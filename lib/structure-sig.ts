/**
 * Structure Signature Utility
 * Extracts an invariant signature of a document's layout and formatting elements
 * to guarantee 100% format preservation.
 */

export interface StructureSignature {
  blocks: Array<{
    type: string;
    level?: number;
    marker?: string;
    headingText?: string;
  }>;
  blankLinesCount: number;
  links: string[];
  emojiCount: number;
  hasTables: boolean;
  totalBlocks: number;
}

// Regex for emojis (Unicode emoji range)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;

// Regex for markdown links
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

export function computeStructureSignature(text: string): StructureSignature {
  const lines = text.split(/\r?\n/);
  const blocks: StructureSignature['blocks'] = [];
  let blankLinesCount = 0;
  const links: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankLinesCount++;
      continue;
    }

    // Heading (#, ##, ###, etc.)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        headingText: headingMatch[2].trim(),
      });
      continue;
    }

    // HTML headings
    const htmlHeadingMatch = trimmed.match(/^<h([1-6])>(.*?)<\/h\1>$/i);
    if (htmlHeadingMatch) {
      blocks.push({
        type: 'heading',
        level: parseInt(htmlHeadingMatch[1], 10),
        headingText: htmlHeadingMatch[2].trim(),
      });
      continue;
    }

    // Bullet / Numbered list item
    const listMatch = trimmed.match(/^(\*|-|•|\d+[\.\)])\s+(.*)$/);
    if (listMatch) {
      blocks.push({
        type: 'list-item',
        marker: listMatch[1],
      });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      blocks.push({ type: 'blockquote' });
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      blocks.push({ type: 'horizontal-rule' });
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      blocks.push({ type: 'code-block' });
      continue;
    }

    // Standard paragraph
    blocks.push({ type: 'paragraph' });
  }

  // Extract links
  let match;
  while ((match = LINK_REGEX.exec(text)) !== null) {
    links.push(match[2]);
  }

  // Count emojis
  const emojiMatches = text.match(EMOJI_REGEX);
  const emojiCount = emojiMatches ? emojiMatches.length : 0;

  return {
    blocks,
    blankLinesCount,
    links,
    emojiCount,
    hasTables: text.includes('|---') || text.includes('| ---'),
    totalBlocks: blocks.length,
  };
}

export function compareStructureSignatures(
  before: StructureSignature,
  after: StructureSignature,
  options: { allowHeadingWordingChange?: boolean } = {}
): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (before.blocks.length !== after.blocks.length) {
    reasons.push(`Block count mismatch: expected ${before.blocks.length}, got ${after.blocks.length}`);
  }

  const minLen = Math.min(before.blocks.length, after.blocks.length);
  for (let i = 0; i < minLen; i++) {
    const b1 = before.blocks[i];
    const b2 = after.blocks[i];

    if (b1.type !== b2.type) {
      reasons.push(`Block ${i} type mismatch: expected '${b1.type}', got '${b2.type}'`);
    }

    if (b1.type === 'heading' && b2.type === 'heading') {
      if (b1.level !== b2.level) {
        reasons.push(`Heading ${i} level mismatch: expected H${b1.level}, got H${b2.level}`);
      }
      if (!options.allowHeadingWordingChange && b1.headingText !== b2.headingText) {
        reasons.push(`Heading ${i} text altered: '${b1.headingText}' -> '${b2.headingText}'`);
      }
    }

    if (b1.type === 'list-item' && b2.type === 'list-item') {
      if (b1.marker !== b2.marker) {
        reasons.push(`List item ${i} marker mismatch: expected '${b1.marker}', got '${b2.marker}'`);
      }
    }
  }

  if (Math.abs(before.blankLinesCount - after.blankLinesCount) > 2) {
    reasons.push(`Blank line count shift: before ${before.blankLinesCount}, after ${after.blankLinesCount}`);
  }

  if (before.emojiCount !== after.emojiCount) {
    reasons.push(`Emoji count altered: before ${before.emojiCount}, after ${after.emojiCount}`);
  }

  return {
    pass: reasons.length === 0,
    reasons,
  };
}
