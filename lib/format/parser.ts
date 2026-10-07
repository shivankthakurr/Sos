/**
 * Format Preserving Engine - Parser
 * Converts raw input (HTML, Markdown, WhatsApp, Plain) into a structured FormattedDocument
 * while masking inline styling into token pairs: ⟦b1⟧...⟦/b1⟧, ⟦i2⟧...⟦/i2⟧, ⟦a3|url⟧...⟦/a3⟧.
 */

import { FormatType, FormattedBlock, FormattedDocument, InlineSpan } from './types';

// Emoji detection
const EMOJI_ONLY_REGEX = /^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+$/u;

export function detectFormat(input: string): FormatType {
  const trimmed = input.trim();
  // Check for HTML tags
  if (/<\/(p|div|h[1-6]|li|ul|ol|span|table|b|strong|i|em)>|<br\s*\/?>/i.test(trimmed)) {
    return 'html';
  }
  // Check for Markdown elements
  if (/^(#{1,6}\s+|-\s+|\*\s+|\d+\.\s+|>\s+|```)/m.test(trimmed) || /\[[^\]]+\]\([^)]+\)/.test(trimmed) || /\*\*[^*]+\*\*/.test(trimmed)) {
    return 'markdown';
  }
  // Check for WhatsApp formatting (*bold*, _italic_, ~strike~)
  if (/(^|\s)\*[^*\n]+\*($|\s)/.test(trimmed) || /(^|\s)_[^_\n]+_($|\s)/.test(trimmed) || /(^|\s)~[^~\n]+~($|\s)/.test(trimmed)) {
    return 'whatsapp';
  }
  return 'plain';
}

/**
 * Tokenize inline markup into safe balanced placeholders like ⟦b1⟧...⟦/b1⟧
 */
export function tokenizeInlineSpans(text: string, format: FormatType): { tokenized: string; spans: InlineSpan[] } {
  const spans: InlineSpan[] = [];
  let tokenized = text;
  let counter = 1;

  if (format === 'html') {
    // Links: <a href="url">text</a>
    tokenized = tokenized.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (_, href, body) => {
      const id = counter++;
      spans.push({ id, type: 'link', rawOpen: `<a href="${href}">`, rawClose: '</a>', metadata: { href } });
      return `⟦a${id}|${href}⟧${body}⟦/a${id}⟧`;
    });

    // Bold: <b>, <strong>
    tokenized = tokenized.replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, (_, tag, body) => {
      const id = counter++;
      spans.push({ id, type: 'bold', rawOpen: `<${tag}>`, rawClose: `</${tag}>` });
      return `⟦b${id}⟧${body}⟦/b${id}⟧`;
    });

    // Italic: <i>, <em>
    tokenized = tokenized.replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, (_, tag, body) => {
      const id = counter++;
      spans.push({ id, type: 'italic', rawOpen: `<${tag}>`, rawClose: `</${tag}>` });
      return `⟦i${id}⟧${body}⟦/i${id}⟧`;
    });

    // Inline code: <code>
    tokenized = tokenized.replace(/<code[^>]*>(.*?)<\/code>/gi, (_, body) => {
      const id = counter++;
      spans.push({ id, type: 'code', rawOpen: '<code>', rawClose: '</code>' });
      return `⟦code${id}⟧${body}⟦/code${id}⟧`;
    });
  } else if (format === 'markdown') {
    // Inline code: `code` (must come first to prevent matching inside backticks)
    tokenized = tokenized.replace(/`([^`\n]+)`/g, (_, code) => {
      const id = counter++;
      spans.push({ id, type: 'code', rawOpen: '`', rawClose: '`' });
      return `⟦code${id}⟧${code}⟦/code${id}⟧`;
    });

    // Links: [text](href)
    tokenized = tokenized.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const id = counter++;
      spans.push({ id, type: 'link', rawOpen: `[`, rawClose: `](${href})`, metadata: { href } });
      return `⟦a${id}|${href}⟧${label}⟦/a${id}⟧`;
    });

    // Bold: **text** or __text__
    tokenized = tokenized.replace(/(\*\*|__)([^\*\n]+)\1/g, (_, delim, body) => {
      const id = counter++;
      spans.push({ id, type: 'bold', rawOpen: delim, rawClose: delim });
      return `⟦b${id}⟧${body}⟦/b${id}⟧`;
    });

    // Italic: *text* or _text_
    tokenized = tokenized.replace(/(?<!\*|\w)(\*|_)([^\*\n_]+)\1(?!\*|\w)/g, (_, delim, body) => {
      const id = counter++;
      spans.push({ id, type: 'italic', rawOpen: delim, rawClose: delim });
      return `⟦i${id}⟧${body}⟦/i${id}⟧`;
    });
  } else if (format === 'whatsapp') {
    // WhatsApp bold: *text*
    tokenized = tokenized.replace(/(?<=^|\s)\*([^*\n]+)\*(?=$|\s)/g, (_, body) => {
      const id = counter++;
      spans.push({ id, type: 'bold', rawOpen: '*', rawClose: '*' });
      return `⟦b${id}⟧${body}⟦/b${id}⟧`;
    });

    // WhatsApp italic: _text_
    tokenized = tokenized.replace(/(?<=^|\s)_([^_\n]+)_(?=$|\s)/g, (_, body) => {
      const id = counter++;
      spans.push({ id, type: 'italic', rawOpen: '_', rawClose: '_' });
      return `⟦i${id}⟧${body}⟦/i${id}⟧`;
    });

    // WhatsApp strikethrough: ~text~
    tokenized = tokenized.replace(/(?<=^|\s)~([^~\n]+)~(?=$|\s)/g, (_, body) => {
      const id = counter++;
      spans.push({ id, type: 'strikethrough', rawOpen: '~', rawClose: '~' });
      return `⟦s${id}⟧${body}⟦/s${id}⟧`;
    });
  }

  return { tokenized, spans };
}

/**
 * Parse document into blocks with formatting metadata
 */
export function parseDocument(input: string, formatHint?: FormatType): FormattedDocument {
  const lineEnding: '\r\n' | '\n' = input.includes('\r\n') ? '\r\n' : '\n';
  const format: FormatType = formatHint || detectFormat(input);

  const rawLines = input.split(/\r?\n/);
  const blocks: FormattedBlock[] = [];

  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    // Trailing newline separator
    const isLast = i === rawLines.length - 1;
    const separator = isLast ? '' : lineEnding;

    // Fenced code block handling
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockBuffer = [rawLine];
        continue;
      } else {
        inCodeBlock = false;
        codeBlockBuffer.push(rawLine);
        const codeText = codeBlockBuffer.join(lineEnding);
        blocks.push({
          id: `block-${blocks.length}`,
          type: 'code-block',
          rawText: codeText,
          tokenizedText: codeText,
          isHumanizable: false, // Never rewrite code
          spans: [],
          originalSeparator: separator,
        });
        codeBlockBuffer = [];
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    // Blank line
    if (!trimmed) {
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'blank-line',
        rawText: rawLine,
        tokenizedText: rawLine,
        isHumanizable: false,
        spans: [],
        originalSeparator: separator,
      });
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___|<hr\s*\/?>)$/.test(trimmed)) {
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'horizontal-rule',
        rawText: rawLine,
        tokenizedText: rawLine,
        isHumanizable: false,
        spans: [],
        originalSeparator: separator,
      });
      continue;
    }

    // Markdown Heading (#, ##, ###)
    const mdHeadingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (mdHeadingMatch) {
      const level = mdHeadingMatch[1].length;
      const { tokenized, spans } = tokenizeInlineSpans(rawLine, format);
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'heading',
        level,
        rawText: rawLine,
        tokenizedText: tokenized,
        isHumanizable: false, // Sacred: preserved unchanged by default
        spans,
        originalSeparator: separator,
      });
      continue;
    }

    // HTML Heading (<h1>...</h1>)
    const htmlHeadingMatch = trimmed.match(/^<h([1-6])[^>]*>(.*?)<\/h\1>$/i);
    if (htmlHeadingMatch) {
      const level = parseInt(htmlHeadingMatch[1], 10);
      const { tokenized, spans } = tokenizeInlineSpans(rawLine, format);
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'heading',
        level,
        rawText: rawLine,
        tokenizedText: tokenized,
        isHumanizable: false, // Sacred: preserved unchanged by default
        spans,
        originalSeparator: separator,
      });
      continue;
    }

    // List Item: bullet or numbered
    const listMatch = rawLine.match(/^(\s*)([-*•]|\d+[\.\)])\s+(.*)$/);
    if (listMatch) {
      const indent = listMatch[1];
      const marker = listMatch[2];
      const content = listMatch[3];
      const { tokenized, spans } = tokenizeInlineSpans(content, format);
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'list-item',
        indent,
        marker,
        rawText: rawLine,
        tokenizedText: tokenized,
        isHumanizable: true, // Content of list item is humanized
        spans,
        originalSeparator: separator,
      });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const content = trimmed.replace(/^>\s*/, '');
      const { tokenized, spans } = tokenizeInlineSpans(content, format);
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'blockquote',
        rawText: rawLine,
        tokenizedText: tokenized,
        isHumanizable: true,
        spans,
        originalSeparator: separator,
      });
      continue;
    }

    // Emoji-only line
    if (EMOJI_ONLY_REGEX.test(trimmed)) {
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'emoji-line',
        rawText: rawLine,
        tokenizedText: rawLine,
        isHumanizable: false,
        spans: [],
        originalSeparator: separator,
      });
      continue;
    }

    // Standard Paragraph
    const { tokenized, spans } = tokenizeInlineSpans(rawLine, format);
    blocks.push({
      id: `block-${blocks.length}`,
      type: 'paragraph',
      rawText: rawLine,
      tokenizedText: tokenized,
      isHumanizable: true,
      spans,
      originalSeparator: separator,
    });
  }

  return {
    format,
    lineEnding,
    blocks,
    rawText: input,
  };
}
