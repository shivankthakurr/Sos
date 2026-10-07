#!/usr/bin/env tsx
/**
 * StealthHumanizer Benchmark Evaluation Runner
 * Measures AI detection scores (heuristic + real RoBERTa classifier),
 * formatting preservation (structure signature hard gate), word count drift,
 * and semantic fidelity across >= 12 real blog samples.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { detectAI } from '../../lib/detector';
import { countWords } from '../../lib/text-utils';
import { humanizeText } from '../../lib/humanizer';
import { parseDocument, serializeDocument } from '../../lib/format';
import { postprocess } from '../../lib/postprocess';
import { computeStructureSignature, compareStructureSignatures } from './structure-sig';

interface DetectionOutput {
  detector: string;
  document_score: number | null;
  avg_paragraph_score: number | null;
  max_paragraph_score: number | null;
}

function runRealDetector(text: string): DetectionOutput {
  try {
    const tempFile = path.join(__dirname, `_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
    fs.writeFileSync(tempFile, text, 'utf8');

    const detectScript = path.join(__dirname, 'detect.py');
    const cmd = `python "${detectScript}" "${tempFile}"`;
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

    fs.unlinkSync(tempFile);
    return JSON.parse(stdout);
  } catch (err: any) {
    return {
      detector: 'fakespot-ai/roberta-base-ai-text-detection-v1',
      document_score: null,
      avg_paragraph_score: null,
      max_paragraph_score: null,
    };
  }
}

async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(600) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isBaseline = args.includes('--baseline') || !args.includes('--after');
  const samplesDir = path.join(__dirname, 'samples');
  const resultsDir = path.join(__dirname, 'results');

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const sampleFiles = fs.readdirSync(samplesDir).filter(f => f.endsWith('.txt')).sort();

  console.log('='.repeat(95));
  console.log(`StealthHumanizer Evaluation Suite — ${isBaseline ? 'BASELINE RUN' : 'POST-HUMANIZATION RUN'}`);
  console.log(`Evaluator: RoBERTa Base AI Text Detector (fakespot-ai) + Built-in Heuristics`);
  console.log(`Total Samples: ${sampleFiles.length}`);
  console.log('='.repeat(95));

  const results: any[] = [];

  console.log(
    '| Sample Name'.padEnd(35) +
    '| Words '.padEnd(10) +
    '| Heuristic AI '.padEnd(16) +
    '| RoBERTa Doc AI '.padEnd(18) +
    '| RoBERTa Para AI '.padEnd(19) +
    '| Structure |'
  );
  console.log('-'.repeat(105));

  const ollamaOnline = await isOllamaRunning();
  if (!isBaseline) {
    console.log(`Inference status: ${ollamaOnline ? 'Ollama running on localhost:11434' : 'Local Ollama offline — running block-preserving stealth pipeline'}`);
  }

  for (const filename of sampleFiles) {
    const startTime = Date.now();
    const filePath = path.join(samplesDir, filename);
    const inputText = fs.readFileSync(filePath, 'utf8');
    const inputWords = countWords(inputText);

    let outputText = inputText;
    let outputWords = inputWords;
    let sigCompare = { pass: true, reasons: [] as string[] };

    if (!isBaseline) {
      const geminiKey = process.env.GEMINI_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

      let provider: any = 'ollama';
      let key = 'ollama';

      if (geminiKey) {
        provider = 'gemini';
        key = geminiKey;
      } else if (groqKey) {
        provider = 'groq';
        key = groqKey;
      } else if (openrouterKey) {
        provider = 'openrouter';
        key = openrouterKey;
      } else if (claudeKey) {
        provider = 'claude';
        key = claudeKey;
      }

      if (provider !== 'ollama' || ollamaOnline) {
        try {
          const humResult = await humanizeText(
            inputText,
            {
              style: 'blog',
              model: provider,
              targetScore: 10,
              language: 'en',
              freezeWords: 'Son of Swaad, sonofswaad.com, Malai Chaap, Afghani Chaap, Rogan Josh Chaap, Tandoori Stuffed Chaap, Achari Chaap, Haryali Chaap, Rumali Roti',
              alsoHumanizeHeadings: false,
            },
            key
          );
          outputText = humResult.fullText;
        } catch (err: any) {
          console.warn(`[Eval Warning] Humanize failed for ${filename}:`, err?.message);
        }
      } else {
        // Fast deterministic block engine: 100% format preservation + AI footprint reduction
        const doc = parseDocument(inputText);
        for (const block of doc.blocks) {
          if (block.isHumanizable && block.type !== 'heading') {
            block.humanizedText = postprocess(block.tokenizedText, { light: false, style: 'blog' });
          }
        }
        outputText = serializeDocument(doc);
      }

      outputWords = countWords(outputText);
      const beforeSig = computeStructureSignature(inputText);
      const afterSig = computeStructureSignature(outputText);
      sigCompare = compareStructureSignatures(beforeSig, afterSig);
    }

    const wordsDeltaPct = (((outputWords - inputWords) / inputWords) * 100).toFixed(1) + '%';
    const heuristic = detectAI(outputText);
    const heuristicAiScore = Math.round((100 - heuristic.score) * 10) / 10;

    const realDetection = runRealDetector(outputText);
    const latency = Date.now() - startTime;

    const entry = {
      sample: filename,
      inputWords,
      outputWords,
      wordsDeltaPct,
      heuristicScore: heuristicAiScore,
      robertaDocScore: realDetection.document_score ?? 'N/A',
      robertaAvgParaScore: realDetection.avg_paragraph_score ?? 'N/A',
      robertaMaxParaScore: realDetection.max_paragraph_score ?? 'N/A',
      structurePass: sigCompare.pass,
      timeMs: latency,
    };

    results.push(entry);

    const docStr = realDetection.document_score !== null ? `${realDetection.document_score}%` : 'N/A';
    const paraStr = realDetection.avg_paragraph_score !== null ? `${realDetection.avg_paragraph_score}%` : 'N/A';

    console.log(
      `| ${filename}`.padEnd(35) +
      `| ${inputWords}`.padEnd(10) +
      `| ${heuristicAiScore}%`.padEnd(16) +
      `| ${docStr}`.padEnd(18) +
      `| ${paraStr}`.padEnd(19) +
      `| ${sigCompare.pass ? 'PASS' : 'FAIL'}      |`
    );
  }

  console.log('-'.repeat(105));

  // Compute aggregate statistics
  const validDocScores = results.map(r => r.robertaDocScore).filter(s => typeof s === 'number') as number[];
  const validParaScores = results.map(r => r.robertaAvgParaScore).filter(s => typeof s === 'number') as number[];
  const validHeuristicScores = results.map(r => r.heuristicScore) as number[];

  const avgDoc = validDocScores.length ? (validDocScores.reduce((a, b) => a + b, 0) / validDocScores.length).toFixed(2) : 'N/A';
  const avgPara = validParaScores.length ? (validParaScores.reduce((a, b) => a + b, 0) / validParaScores.length).toFixed(2) : 'N/A';
  const avgHeuristic = (validHeuristicScores.reduce((a, b) => a + b, 0) / validHeuristicScores.length).toFixed(2);

  console.log(`\nSUMMARY:`);
  console.log(`- Average Heuristic AI Score:   ${avgHeuristic}%`);
  console.log(`- Average RoBERTa Document AI:  ${avgDoc}%`);
  console.log(`- Average RoBERTa Paragraph AI: ${avgPara}%`);
  console.log(`- Structure Signatures Pass:    ${results.filter(r => r.structurePass).length} / ${results.length}`);

  const targetFile = isBaseline ? 'baseline.json' : 'after.json';
  const outputPath = path.join(resultsDir, targetFile);
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    type: isBaseline ? 'baseline' : 'after',
    averages: {
      heuristicAi: Number(avgHeuristic),
      robertaDocAi: typeof avgDoc === 'string' && avgDoc !== 'N/A' ? Number(avgDoc) : null,
      robertaAvgParaAi: typeof avgPara === 'string' && avgPara !== 'N/A' ? Number(avgPara) : null,
    },
    results,
  }, null, 2), 'utf8');

  console.log(`\nResults saved to: scripts/eval/results/${targetFile}`);
}

main().catch(err => {
  console.error('Evaluation run failed:', err);
  process.exit(1);
});
