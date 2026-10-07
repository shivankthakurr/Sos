/**
 * Format Preserving Engine - Types
 * Supports HTML, Markdown, Plain Text, and WhatsApp formatting with 100% fidelity.
 */

export type FormatType = 'html' | 'markdown' | 'whatsapp' | 'plain';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list-item'
  | 'blockquote'
  | 'code-block'
  | 'horizontal-rule'
  | 'blank-line'
  | 'emoji-line';

export interface InlineSpan {
  id: number;
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'link' | 'code';
  rawOpen: string;
  rawClose: string;
  metadata?: {
    href?: string;
    title?: string;
  };
}

export interface FormattedBlock {
  id: string;
  type: BlockType;
  rawText: string;
  // Masked text with inline tokens like ⟦b1⟧text⟦/b1⟧
  tokenizedText: string;
  // Humanized text after LLM and validation
  humanizedText?: string;
  // Formatting metadata
  level?: number;              // Heading level 1-6
  marker?: string;             // List marker: '-', '*', '•', '1.', '1)'
  indent?: string;             // Whitespace indentation
  spans: InlineSpan[];         // Inline token mappings
  isHumanizable: boolean;      // True for regular paragraphs and list content, false for headings/rules/blank
  originalSeparator: string;   // Trailing newline(s)
}

export interface FormattedDocument {
  format: FormatType;
  lineEnding: '\r\n' | '\n';
  blocks: FormattedBlock[];
  rawText: string;
}

export interface FormatOptions {
  alsoHumanizeHeadings?: boolean; // Default false (headings kept 100% verbatim)
  targetFormat?: FormatType;
}
