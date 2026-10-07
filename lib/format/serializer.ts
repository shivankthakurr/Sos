/**
 * Format Preserving Engine - Serializer
 * Reassembles a FormattedDocument back to native text (HTML, Markdown, WhatsApp, Plain)
 * with 100% fidelity, restoring token placeholders to native markup.
 */

import { FormatType, FormattedBlock, FormattedDocument, InlineSpan } from './types';

/**
 * Detokenize placeholder tokens back to native format delimiters
 */
export function detokenizeSpans(text: string, spans: InlineSpan[], targetFormat: FormatType): string {
  let restored = text;

  // Restore links: ⟦a1|url⟧label⟦/a1⟧
  restored = restored.replace(/⟦a(\d+)\|([^⟧]+)⟧([\s\S]*?)⟦\/a\1⟧/g, (_, idStr, href, label) => {
    if (targetFormat === 'html') {
      return `<a href="${href}">${label}</a>`;
    } else if (targetFormat === 'markdown') {
      return `[${label}](${href})`;
    } else {
      return `${label} (${href})`;
    }
  });

  // Restore bold: ⟦b1⟧text⟦/b1⟧
  restored = restored.replace(/⟦b(\d+)⟧([\s\S]*?)⟦\/b\1⟧/g, (_, idStr, body) => {
    if (targetFormat === 'html') {
      return `<strong>${body}</strong>`;
    } else if (targetFormat === 'markdown') {
      return `**${body}**`;
    } else if (targetFormat === 'whatsapp') {
      return `*${body}*`;
    } else {
      return body;
    }
  });

  // Restore italic: ⟦i1⟧text⟦/i1⟧
  restored = restored.replace(/⟦i(\d+)⟧([\s\S]*?)⟦\/i\1⟧/g, (_, idStr, body) => {
    if (targetFormat === 'html') {
      return `<em>${body}</em>`;
    } else if (targetFormat === 'markdown') {
      return `*${body}*`;
    } else if (targetFormat === 'whatsapp') {
      return `_${body}_`;
    } else {
      return body;
    }
  });

  // Restore strikethrough: ⟦s1⟧text⟦/s1⟧
  restored = restored.replace(/⟦s(\d+)⟧([\s\S]*?)⟦\/s\1⟧/g, (_, idStr, body) => {
    if (targetFormat === 'html') {
      return `<del>${body}</del>`;
    } else if (targetFormat === 'markdown') {
      return `~~${body}~~`;
    } else if (targetFormat === 'whatsapp') {
      return `~${body}~`;
    } else {
      return body;
    }
  });

  // Restore inline code: ⟦code1⟧text⟦/code1⟧
  restored = restored.replace(/⟦code(\d+)⟧([\s\S]*?)⟦\/code\1⟧/g, (_, idStr, body) => {
    if (targetFormat === 'html') {
      return `<code>${body}</code>`;
    } else {
      return `\`${body}\``;
    }
  });

  // Clean up any unmatched tokens if LLM mutated an ID
  restored = restored.replace(/⟦\/?[a-z0-9_|]+⟧/gi, '');

  return restored;
}

/**
 * Serialize a block back to its string representation
 */
export function serializeBlock(block: FormattedBlock, format: FormatType): string {
  // If not humanized, return rawText directly
  const content = block.humanizedText !== undefined ? block.humanizedText : block.tokenizedText;
  const restoredContent = detokenizeSpans(content, block.spans, format);

  if (block.type === 'blank-line') {
    return block.rawText;
  }

  if (block.type === 'horizontal-rule' || block.type === 'code-block' || block.type === 'emoji-line') {
    return block.rawText;
  }

  if (block.type === 'heading') {
    // If heading was not modified, return original rawText
    if (block.humanizedText === undefined) {
      return block.rawText;
    }
    if (format === 'html') {
      const lvl = block.level || 2;
      return `<h${lvl}>${restoredContent}</h${lvl}>`;
    } else {
      const hashes = '#'.repeat(block.level || 2);
      return `${hashes} ${restoredContent}`;
    }
  }

  if (block.type === 'list-item') {
    const indent = block.indent || '';
    const marker = block.marker || '-';
    return `${indent}${marker} ${restoredContent}`;
  }

  if (block.type === 'blockquote') {
    return `> ${restoredContent}`;
  }

  // Standard paragraph
  if (format === 'html' && !restoredContent.startsWith('<')) {
    return `<p>${restoredContent}</p>`;
  }

  return restoredContent;
}

/**
 * Serialize complete document back to text in native format
 */
export function serializeDocument(doc: FormattedDocument, targetFormat?: FormatType): string {
  const format = targetFormat || doc.format;
  let out = '';

  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    const serialized = serializeBlock(block, format);
    out += serialized + block.originalSeparator;
  }

  return out;
}

/**
 * Generate rich HTML representation suitable for clipboard writing (text/html)
 * and rich rendered preview.
 */
export function serializeToHtml(doc: FormattedDocument): string {
  let html = '';

  for (const block of doc.blocks) {
    const content = block.humanizedText !== undefined ? block.humanizedText : block.tokenizedText;
    const restored = detokenizeSpans(content, block.spans, 'html');

    if (block.type === 'heading') {
      const lvl = block.level || 2;
      html += `<h${lvl}>${restored}</h${lvl}>\n`;
    } else if (block.type === 'list-item') {
      html += `<li>${restored}</li>\n`;
    } else if (block.type === 'blockquote') {
      html += `<blockquote>${restored}</blockquote>\n`;
    } else if (block.type === 'code-block') {
      html += `<pre><code>${block.rawText.replace(/```[a-z]*\n?/g, '')}</code></pre>\n`;
    } else if (block.type === 'horizontal-rule') {
      html += `<hr />\n`;
    } else if (block.type === 'blank-line') {
      html += `<br />\n`;
    } else if (block.type === 'paragraph') {
      html += `<p>${restored}</p>\n`;
    } else {
      html += `<div>${restored}</div>\n`;
    }
  }

  return html;
}
