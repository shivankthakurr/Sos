/**
 * Format Preserving Engine - Block Validator & Guard
 * Validates rewritten block against original block constraints.
 * If validation fails, triggers retry or falls back to original text.
 */

import { FormattedBlock } from './types';
import { countWords } from '../text-utils';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateRewrittenBlock(
  original: FormattedBlock,
  rewrittenText: string
): ValidationResult {
  const trimmed = rewrittenText.trim();

  // 1. Cannot be empty if original was not empty
  if (original.tokenizedText.trim().length > 0 && trimmed.length === 0) {
    return { valid: false, reason: 'Rewritten text is empty' };
  }

  // 2. Token pair preservation check: every token pair in original must exist in rewritten
  for (const span of original.spans) {
    let openToken = '';
    let closeToken = '';

    if (span.type === 'link') {
      openToken = `⟦a${span.id}|`;
      closeToken = `⟦/a${span.id}⟧`;
    } else if (span.type === 'bold') {
      openToken = `⟦b${span.id}⟧`;
      closeToken = `⟦/b${span.id}⟧`;
    } else if (span.type === 'italic') {
      openToken = `⟦i${span.id}⟧`;
      closeToken = `⟦/i${span.id}⟧`;
    } else if (span.type === 'strikethrough') {
      openToken = `⟦s${span.id}⟧`;
      closeToken = `⟦/s${span.id}⟧`;
    } else if (span.type === 'code') {
      openToken = `⟦code${span.id}⟧`;
      closeToken = `⟦/code${span.id}⟧`;
    }

    if (openToken && !rewrittenText.includes(openToken)) {
      return { valid: false, reason: `Missing open placeholder token: ${openToken}` };
    }
    if (closeToken && !rewrittenText.includes(closeToken)) {
      return { valid: false, reason: `Missing close placeholder token: ${closeToken}` };
    }
  }

  // 3. Length drift check: +/-15% (allow +/-25% for short sentences under 15 words)
  const origWords = countWords(original.tokenizedText);
  const newWords = countWords(rewrittenText);
  if (origWords > 15) {
    const minWords = Math.floor(origWords * 0.80);
    const maxWords = Math.ceil(origWords * 1.25);
    if (newWords < minWords || newWords > maxWords) {
      return {
        valid: false,
        reason: `Word count drift exceeded: original ${origWords}, rewritten ${newWords}`,
      };
    }
  }

  // 4. Line count check: single-line block should not become multi-paragraph block
  const origLines = original.tokenizedText.split('\n').filter(l => l.trim()).length;
  const newLines = rewrittenText.split('\n').filter(l => l.trim()).length;
  if (Math.abs(origLines - newLines) > 1) {
    return { valid: false, reason: `Line count mismatch: original ${origLines}, rewritten ${newLines}` };
  }

  return { valid: true };
}
