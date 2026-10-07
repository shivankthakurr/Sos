// StealthHumanizer v3 - Format-Preserving, Gated Multi-Pass Humanization Engine

import { HumanizationOptions, HumanizationResult, SentenceResult } from './types';
import { getSystemPrompt, getRehumanizePrompt } from './prompts';
import { getProvider } from './providers';
import { generateWithProvider } from './server/providers-runtime';
import { detectAI } from './detector';
import { postprocess } from './postprocess';
import { addToHistory } from './storage';
import { countWords, splitIntoSentences } from './text-utils';
import { evaluateSemanticFidelity } from './semantic-fidelity';
import {
  parseDocument,
  serializeDocument,
  serializeToHtml,
  validateRewrittenBlock,
  FormattedBlock,
  FormattedDocument,
} from './format';
import { computeStructureSignature, compareStructureSignatures } from './structure-sig';

/**
 * Humanize a single formatted block while protecting tokens
 */
async function humanizeBlock(
  block: FormattedBlock,
  options: HumanizationOptions,
  apiKey: string,
  customModel?: string
): Promise<string> {
  const text = block.tokenizedText;
  if (!text || text.trim().length === 0) return block.rawText;

  const systemPrompt = getSystemPrompt(
    options.style || 'blog',
    options.writingSample,
    options.language,
    options.freezeWords
  );

  const providerInfo = getProvider(options.model);
  const model = customModel || options.customModel || providerInfo?.defaultModel || options.model;

  const inputWords = countWords(text);
  const lengthAnchor = `Length target: approximately ${inputWords} words (±15%). Do not summarize or expand.`;
  const tokenInstruction = block.spans.length > 0
    ? `CRITICAL FORMATTING RULE: The text contains tokens like ⟦b1⟧...⟦/b1⟧, ⟦i2⟧...⟦/i2⟧, ⟦a3|url⟧...⟦/a3⟧. Reproduce every token EXACTLY as it appears. Do not modify, remove, or translate them. Rewrite only the normal words.\n\n`
    : '';

  const prompt = `${tokenInstruction}${lengthAnchor}\n\nText to humanize:\n\n${text}`;

  try {
    const rawResult = await generateWithProvider(options.model, apiKey, systemPrompt, prompt, { model });
    const cleaned = rawResult.trim();

    // Validate the block
    const validation = validateRewrittenBlock(block, cleaned);
    if (validation.valid) {
      return postprocess(cleaned, {
        light: true,
        style: options.style,
        aggressiveSynonyms: options.aggressiveSynonyms !== false,
      });
    }

    // Retry once with strict instruction
    const retryPrompt = `STRICT RETRY: Your previous output failed format validation (${validation.reason}). You MUST output all placeholder tokens exactly as written. Rewrite ONLY the words.\n\nText to humanize:\n\n${text}`;
    const retryResult = await generateWithProvider(options.model, apiKey, systemPrompt, retryPrompt, { model });
    const retryCleaned = retryResult.trim();
    const retryValidation = validateRewrittenBlock(block, retryCleaned);

    if (retryValidation.valid) {
      return postprocess(retryCleaned, {
        light: true,
        style: options.style,
        aggressiveSynonyms: options.aggressiveSynonyms !== false,
      });
    }

    // Fallback to deterministic rewrite of block if LLM fails format validation
    return postprocess(block.tokenizedText, {
      light: true,
      style: options.style,
      aggressiveSynonyms: true,
    });
  } catch (err: any) {
    console.error(`[Humanize Provider Error (${options.model})]:`, err?.message || err);
    return postprocess(block.tokenizedText, {
      light: true,
      style: options.style,
      aggressiveSynonyms: true,
    });
  }
}

export async function humanizeText(
  text: string,
  options: HumanizationOptions,
  apiKey: string,
  onProgress?: (pass: number, maxPasses: number, message: string) => void
): Promise<HumanizationResult> {
  const inputWordCount = countWords(text);
  const style = options.style || 'blog';
  const targetAiScore = options.targetScore !== undefined ? options.targetScore : 10; // Default target: <=10% AI
  const maxPasses = 4;

  // Step 0.5: Parse into structured document
  const doc: FormattedDocument = parseDocument(text);
  const originalSig = computeStructureSignature(text);

  // Filter humanizable blocks
  const humanizableBlocks = doc.blocks.filter(b => {
    if (b.type === 'heading') {
      return !!options.alsoHumanizeHeadings;
    }
    return b.isHumanizable;
  });

  const totalToRewrite = humanizableBlocks.length;
  let processedCount = 0;

  onProgress?.(1, maxPasses, `Pass 1/${maxPasses} — Rewriting blocks...`);

  // Layer 1: Rewrite each humanizable block independently
  for (const block of humanizableBlocks) {
    processedCount++;
    onProgress?.(
      1,
      maxPasses,
      `Pass 1/${maxPasses} — Humanizing block ${processedCount}/${totalToRewrite}...`
    );

    const rewritten = await humanizeBlock(block, options, apiKey);
    block.humanizedText = rewritten;
  }

  // Intermediate assembly
  let currentSerialized = serializeDocument(doc);
  const docPolished = postprocess(currentSerialized, {
    light: true,
    style: options.style,
    aggressiveSynonyms: options.aggressiveSynonyms !== false,
  });
  const docPolishedSig = computeStructureSignature(docPolished);
  if (compareStructureSignatures(originalSig, docPolishedSig).pass) {
    currentSerialized = docPolished;
  }

  let bestSerialized = currentSerialized;
  let initialDetection = detectAI(currentSerialized);
  let bestAiScore = Math.round((100 - initialDetection.score) * 10) / 10;
  let passes = 1;

  // Step 1: Gated Multi-pass Loop
  if (maxPasses > 1 && bestAiScore > targetAiScore) {
    for (let pass = 2; pass <= maxPasses; pass++) {
      onProgress?.(
        pass,
        maxPasses,
        `Pass ${pass}/${maxPasses} — Calibrating AI score: ${bestAiScore}% (target: <=${targetAiScore}%)...`
      );

      // Find highest AI-classified sentences in the current text
      const detection = detectAI(bestSerialized);
      const flaggedSentences = detection.sentences
        .filter(s => s.classification === 'ai' || s.classification === 'maybe')
        .map(s => s.text)
        .slice(0, 5); // Take top 5 to avoid over-rewriting

      if (flaggedSentences.length === 0) break;

      try {
        const rePrompt = getRehumanizePrompt(flaggedSentences, style);
        const providerInfo = getProvider(options.model);
        const model = options.customModel || providerInfo?.defaultModel || options.model;
        const reResult = await generateWithProvider(options.model, apiKey, rePrompt, '', { model });

        const reSentences = reResult
          .split('\n')
          .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter(line => line.length > 8);

        // Attempt replacement in candidate text
        let candidateText = bestSerialized;
        for (let i = 0; i < Math.min(flaggedSentences.length, reSentences.length); i++) {
          const orig = flaggedSentences[i];
          const repl = reSentences[i];
          if (orig && repl && candidateText.includes(orig)) {
            candidateText = candidateText.replace(orig, repl);
          }
        }

        // Apply light safe cleanup
        candidateText = postprocess(candidateText, { light: true, aggressiveSynonyms: options.aggressiveSynonyms });

        // Gate: Evaluate new score and semantic fidelity
        const candDetection = detectAI(candidateText);
        const candAiScore = Math.round((100 - candDetection.score) * 10) / 10;
        const candFidelity = evaluateSemanticFidelity(text, candidateText);
        const candSig = computeStructureSignature(candidateText);
        const sigCheck = compareStructureSignatures(originalSig, candSig);

        // Accept ONLY IF AI score drops, structure matches, and fidelity passes
        if (candAiScore < bestAiScore && candFidelity.score >= 65 && sigCheck.pass) {
          bestSerialized = candidateText;
          bestAiScore = candAiScore;
          passes = pass;
          if (bestAiScore <= targetAiScore) break;
        }
      } catch {
        break;
      }
    }
  }

  // Final check: structure signature equality hard gate
  const finalSig = computeStructureSignature(bestSerialized);
  const finalSigCheck = compareStructureSignatures(originalSig, finalSig);
  let finalText = bestSerialized;

  if (!finalSigCheck.pass) {
    // If anything disrupted structure, fall back to serialized document from block engine
    finalText = serializeDocument(doc);
  }

  const htmlText = serializeToHtml(doc);
  const finalDetection = detectAI(finalText);
  const outputWordCount = countWords(finalText);

  const origSentences = splitIntoSentences(text);
  const humSentences = splitIntoSentences(finalText);
  const maxLen = Math.max(origSentences.length, humSentences.length);
  const sentenceResults: SentenceResult[] = [];

  for (let i = 0; i < maxLen; i++) {
    sentenceResults.push({
      original: origSentences[i] || '',
      humanized: humSentences[i] || '',
      index: i,
      detectionScore: finalDetection.sentences[i]?.score,
    });
  }

  const providerInfo = getProvider(options.model);

  const result: HumanizationResult = {
    sentences: sentenceResults,
    fullText: finalText,
    htmlText,
    format: doc.format,
    model: options.model,
    modelName: providerInfo?.name || options.model,
    wordCount: { input: inputWordCount, output: outputWordCount },
    timestamp: Date.now(),
    passes,
    finalScore: finalDetection.score,
    options,
  };

  addToHistory({
    originalText: text,
    humanizedText: finalText,
    options,
    wordCount: { input: inputWordCount, output: outputWordCount },
    timestamp: Date.now(),
    model: options.model,
    modelName: providerInfo?.name || options.model,
    finalScore: finalDetection.score,
    passes,
  });

  return result;
}
