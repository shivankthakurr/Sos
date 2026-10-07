// StealthHumanizer v2 - Advanced AI Detection Engine

import { DetectionResult, SentenceDetectionResult, DetailedDetectionReport } from './types';
import { calculateReadability } from './readability';
import type { CorpusStyleModel, CalibratedThresholds } from './style-model';
import { splitIntoSentences } from './text-utils';

// ==================== PATTERN DATABASES ====================

const AI_PHRASES = [
  'it is important to note', 'it is worth mentioning', 'it is worth noting',
  'in conclusion', 'in summary', 'to summarize', 'to conclude',
  'furthermore', 'moreover', 'additionally', 'in addition',
  'it is crucial', 'it is essential', 'it is imperative',
  'plays a crucial role', 'plays an important role', 'plays a pivotal role',
  'has the potential to', 'it is evident that', 'it is clear that',
  'demonstrates the', 'illustrates the', 'showcases the',
  'underscores the', 'highlights the', 'emphasizes the',
  'on the other hand', 'in terms of', 'when it comes to',
  'as previously mentioned', 'as discussed earlier', 'as noted above',
  'it should be noted', 'it must be noted', 'needless to say',
  'last but not least', 'first and foremost', 'at the end of the day',
  'in today\'s world', 'in this day and age', 'in the modern era',
  'in the contemporary landscape', 'in the current landscape',
  'a myriad of', 'delve into', 'delves into',
  'tapestry of', 'navigating the landscape',
  'multifaceted', 'robust', 'seamless', 'streamline',
  'synergy', 'paradigm', 'paradigm shift', 'holistic',
  'innovative', 'cutting-edge', 'state-of-the-art', 'groundbreaking',
  'transformative', 'comprehensive', 'unprecedented',
  'utilize', 'facilitate', 'optimize', 'leverage',
  'implement', 'foster', 'cultivate', 'empower',
  'embark on a journey', 'sheds light on', 'brings to the forefront',
];

const AI_SENTENCE_STARTERS = [
  'In this article', 'This paper', 'This study', 'This research',
  'The results', 'The findings', 'The analysis', 'The data',
  'It is widely', 'It is commonly', 'There is a',
  'One of the', 'Another important', 'A key aspect',
  'The importance of', 'The significance of', 'The role of',
  'Research has shown', 'Studies have shown', 'Evidence suggests',
];

const HEDGING_PHRASES = [
  'it could be argued', 'one might consider', 'it is possible that',
  'it would seem', 'this suggests that', 'this may indicate',
  'it appears that', 'this could potentially', 'one could argue',
];

const QUANTIFIERS = [
  'numerous', 'various', 'multiple', 'several', 'a variety of',
  'a multitude of', 'a range of', 'a number of', 'countless',
  'a vast array of', 'a wide range of', 'a significant number of',
];

const TRANSITION_WORDS = [
  'however', 'therefore', 'moreover', 'furthermore', 'additionally',
  'consequently', 'nevertheless', 'meanwhile', 'subsequently', 'thus',
  'hence', 'accordingly', 'similarly', 'likewise', 'conversely',
  'otherwise', 'instead', 'rather', 'yet', 'still', 'moreover',
];

const HUMAN_INDICATORS = [
  'basically', 'actually', 'literally', 'honestly', 'like',
  'you know', 'I mean', 'kind of', 'sort of', 'pretty much',
  'I think', 'I feel like', 'I guess', 'I\'d say', 'to be honest',
  'weirdly', 'interestingly', 'funnily enough', 'surprisingly',
  'anyway', 'so yeah', 'I dunno', 'tbh', 'imo',
];

// Arabic-specific patterns
const AR_AI_PHRASES = [
  'من المهم أن نلاحظ', 'من الجدير بالذكر', 'من الضروري أن',
  'في الختام', 'بصورة عامة', 'لذلك', 'بالإضافة إلى ذلك',
  'من ناحية أخرى', 'في الواقع', 'في العصر الحديث',
  'تلعب دوراً هاماً', 'من الضروري الإشارة إلى', 'في هذا الصدد',
  'من خلال هذا المقال', 'نتيجة لذلك', 'علاوة على ذلك',
  'كما هو معروف', 'من منظور', 'في ضوء ذلك',
];

const AR_AI_SENTENCE_STARTERS = [
  'في هذا المقال', 'تظهر النتائج', 'تشير الدراسات',
  'من الواضح أن', 'في ضوء', 'بناءً على',
  'يمكن القول إن', 'من الملاحظ أن', 'تهدف هذه الدراسة',
];

const AR_HUMAN_INDICATORS = [
  'يعني', 'بصراحة', 'صحيح', 'طيب', 'عموماً',
  'الحمد لله', 'ما أدري', 'على فكرة', 'بس', 'بالتالي',
  'يا جماعة', 'أنا فكرت', 'بكل صراحة', 'والله', 'يعني كذا',
  'طبعاً', 'مو', 'ليش', 'إيش', 'وش',
];

const AR_TRANSITION_WORDS = [
  'ومع ذلك', 'لذلك', 'بالإضافة', 'نتيجة لذلك', 'علاوة على ذلك',
  'من جهة أخرى', 'في المقابل', 'بشكل عام', 'أخيراً', 'أولاً',
];

// ==================== CORE ANALYSIS FUNCTIONS ====================

function calculatePerplexity(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length < 5) return 65;

  // 1. Unigram frequency & Shannon Entropy (measures lexical surprisal)
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const totalWords = words.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / totalWords;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(Math.max(Object.keys(freq).length, 2));
  const entropyRatio = maxEntropy > 0 ? (entropy / maxEntropy) : 0.7;

  // 2. Bigram uniqueness
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  const uniqueBigrams = new Set(bigrams).size;
  const bigramDiversity = bigrams.length > 0 ? (uniqueBigrams / bigrams.length) : 0.85;

  // Human writing exhibits high entropy ratio + high bigram diversity
  const score = (bigramDiversity * 55) + (entropyRatio * 45);
  return Math.min(100, Math.max(10, Math.round(score)));
}

function calculateBurstiness(sentences: string[]): number {
  if (sentences.length < 2) return 65;
  const lengths = sentences.map(s => (s.match(/\b\w+\b/g) || []).length).filter(l => l > 0);
  if (lengths.length < 2) return 65;
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV = stdDev / avg)
  // Human writing mixes very short and long sentences (CV usually 0.35 - 0.9)
  // AI writing has uniform sentence lengths (CV usually 0.1 - 0.25)
  const cv = stdDev / (avg || 1);
  return Math.min(100, Math.max(15, Math.round(cv * 115)));
}

function calculateVocabularyDiversity(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  if (words.length < 8) return 70;
  // Guiraud's Index (Root TTR) normalized to 0-100
  const uniqueCount = new Set(words).size;
  const guiraud = uniqueCount / Math.sqrt(words.length);
  return Math.min(100, Math.max(20, Math.round((guiraud / 7.2) * 100)));
}

function calculateSentenceLengthVariation(sentences: string[]): number {
  if (sentences.length < 2) return 60;
  const lengths = sentences.map(s => (s.match(/\b\w+\b/g) || []).length).filter(l => l > 0);
  if (lengths.length < 2) return 60;
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const diff = (max - min) / (avg || 1);
  return Math.min(100, Math.max(15, Math.round(diff * 45)));
}

function calculateTransitionFrequency(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length < 10) return 20;
  let count = 0;
  const lower = text.toLowerCase();
  TRANSITION_WORDS.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  });
  const pct = (count / words.length) * 100;
  if (pct <= 2.5) return Math.round(pct * 8);
  return Math.min(100, Math.round(20 + (pct - 2.5) * 16));
}

function calculatePassiveVoiceRatio(text: string): number {
  const sentences = splitIntoSentences(text);
  if (sentences.length < 2) return 25;
  const patterns = [
    /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
    /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
  ];
  let passiveCount = 0;
  sentences.forEach(s => patterns.forEach(p => {
    const m = s.match(p); if (m) passiveCount += m.length;
  }));
  return Math.min(100, Math.round((passiveCount / sentences.length) * 60));
}

function calculateAIPhraseDensity(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  AI_PHRASES.forEach(phrase => { if (lower.includes(phrase)) count++; });
  const isArabic = /[؀-ۿ]/.test(text);
  if (isArabic) {
    AR_AI_PHRASES.forEach(phrase => { if (text.includes(phrase)) count++; });
  }
  const sentenceCount = Math.max(splitIntoSentences(text).length, 1);
  return Math.min(100, Math.round((count / sentenceCount) * 40));
}

function calculateSentenceStartDiversity(sentences: string[]): number {
  if (sentences.length < 3) return 70;
  const starts = sentences.map(s => s.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean);
  if (starts.length === 0) return 70;
  const uniqueStarts = new Set(starts);
  return Math.round((uniqueStarts.size / starts.length) * 100);
}

function calculatePronounUsage(text: string): number {
  const personalPronouns = ['i', 'me', 'my', 'we', 'us', 'our', 'you', 'your'];
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let count = 0;
  words.forEach(w => { if (personalPronouns.includes(w)) count++; });
  const ratio = (count / Math.max(words.length, 1)) * 400;
  return Math.min(100, Math.round(ratio));
}

function calculateHedgingFrequency(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  HEDGING_PHRASES.forEach(phrase => { if (lower.includes(phrase)) count++; });
  return Math.min(100, count * 20);
}

function calculateQuantifierOveruse(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  QUANTIFIERS.forEach(q => {
    const regex = new RegExp(`\\b${q}\\b`, 'gi');
    const m = lower.match(regex); if (m) count += m.length;
  });
  return Math.min(100, count * 15);
}

// ==================== SENTENCE-LEVEL ANALYSIS ====================

function analyzeSentence(sentence: string): SentenceDetectionResult {
  const issues: string[] = [];
  // Natural human sentence baseline is 75 (clean writing is human by default)
  let score = 75;

  const lower = sentence.toLowerCase();

  // Arabic detection
  const isArabic = /[؀-ۿ]/.test(sentence);

  if (isArabic) {
    AR_AI_PHRASES.forEach(phrase => {
      if (sentence.includes(phrase)) { score -= 18; issues.push(`AI phrase: "${phrase}"`); }
    });
    AR_AI_SENTENCE_STARTERS.forEach(starter => {
      if (sentence.startsWith(starter)) { score -= 12; issues.push('AI-like sentence opener (Arabic)'); }
    });
    AR_TRANSITION_WORDS.forEach(w => {
      if (sentence.includes(w)) { score -= 6; }
    });
    AR_HUMAN_INDICATORS.forEach(h => { if (sentence.includes(h)) score += 6; });

    score = Math.max(0, Math.min(100, score));
    let classification: 'human' | 'maybe' | 'ai';
    if (score >= 65) classification = 'human';
    else if (score >= 45) classification = 'maybe';
    else classification = 'ai';
    return { text: sentence, score, classification, issues };
  }

  // AI phrases (heavy penalty)
  let aiPhraseCount = 0;
  AI_PHRASES.forEach(phrase => {
    if (lower.includes(phrase)) { aiPhraseCount++; issues.push(`AI phrase: "${phrase}"`); }
  });
  score -= aiPhraseCount * 18;

  // AI sentence starters
  AI_SENTENCE_STARTERS.forEach(starter => {
    if (lower.startsWith(starter.toLowerCase())) {
      score -= 12;
      issues.push('AI-like sentence opener');
    }
  });

  // Sentence length
  const wordCount = (sentence.match(/\b\w+\b/g) || []).length;
  if (wordCount > 40) { issues.push('Overly long sentence'); score -= 10; }
  else if (wordCount > 32) { issues.push('Long complex sentence'); score -= 5; }
  if (wordCount <= 8 && wordCount >= 2) { score += 6; } // Short punchy sentences are very human

  // Formal vocabulary
  if (/\b(utilize|facilitate|leverage|foster|cultivate|empower|delve|tapestry|synergy)\b/i.test(sentence)) {
    issues.push('Formal/AI vocabulary'); score -= 10;
  }

  // Passive voice
  if (/\b(is|are|was|were|been|being)\s+\w+ed\b/i.test(sentence)) {
    issues.push('Passive voice'); score -= 4;
  }

  // Hedging
  HEDGING_PHRASES.forEach(h => {
    if (lower.includes(h)) { issues.push('Hedging language'); score -= 8; }
  });

  // Quantifiers
  QUANTIFIERS.forEach(q => {
    if (lower.includes(q)) { score -= 4; }
  });

  // Human indicators (positive signals)
  let humanSignals = 0;
  HUMAN_INDICATORS.forEach(h => { if (lower.includes(h)) humanSignals++; });
  score += humanSignals * 5;

  // Contractions (human signal)
  const contractions = sentence.match(/[a-zA-Z]{1,15}'(?:t|s|re|ve|ll|d|m)\b/gi);
  if (contractions) score += contractions.length * 4;

  // First/Second person (conversational human signal)
  if (/\b(I|me|my|we|us|our)\b/i.test(sentence)) { score += 4; }
  if (/\byou|your\b/i.test(sentence)) { score += 3; }

  // Questions & Exclamations
  if (sentence.endsWith('?')) { score += 5; }
  if (sentence.endsWith('!')) { score += 4; }

  // Em-dashes and semicolons (strong AI signals in commercial detectors)
  if (sentence.includes('—') || sentence.includes('–')) {
    issues.push('AI em-dash');
    score -= 10;
  }
  if (sentence.includes(';')) {
    issues.push('AI semicolon');
    score -= 10;
  }
  if (/not (?:only|just|simply)\b.*?\bbut\b/i.test(sentence)) {
    issues.push('Negation pivot');
    score -= 12;
  }
  if (sentence.includes('(') && sentence.includes(')')) { score += 3; }

  // Natural conjunction starters
  if (/^(and|but|so|because|also|plus|or|well|ok|hey)\b/i.test(sentence)) { score += 4; }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification: 'human' | 'maybe' | 'ai';
  if (score >= 65) classification = 'human';
  else if (score >= 45) classification = 'maybe';
  else classification = 'ai';

  return { text: sentence, score, classification, issues };
}

// ==================== MAIN DETECTION FUNCTION ====================

/** Corpus-calibrated thresholds (set via calibrateWithCorpus) */
let calibratedThresholds: CalibratedThresholds | null = null;

/**
 * Calibrate the detector against corpus statistics.
 * Adjusts weights and thresholds based on real human writing patterns.
 */
export function calibrateWithCorpus(styleModel: CorpusStyleModel): CalibratedThresholds {
  const burstinessFloor = Math.round(styleModel.burstinessProfile.mean * 50);
  const vocabularyFloor = Math.round(styleModel.vocabularyDiversityRange.mean * 85);
  const totalTransitions = Object.values(styleModel.transitionWordFrequency)
    .reduce((sum, v) => sum + v, 0);
  const transitionCeiling = Math.round(totalTransitions * 200);

  calibratedThresholds = {
    humanScoreMin: 55,
    humanScoreMax: 95,
    humanScoreMedian: 70,
    targetScore: 75,
    burstinessFloor,
    vocabularyFloor,
    transitionCeiling,
  };
  return calibratedThresholds;
}

/**
 * Get the realistic score range for human writing based on corpus analysis.
 */
export function getHumanScoreRange(): { min: number; max: number; median: number } {
  if (calibratedThresholds) {
    return {
      min: calibratedThresholds.humanScoreMin,
      max: calibratedThresholds.humanScoreMax,
      median: calibratedThresholds.humanScoreMedian,
    };
  }
  return { min: 50, max: 90, median: 70 };
}

export function detectAI(text: string): DetectionResult {
  const sentences = splitIntoSentences(text);
  const sentenceResults = sentences.map(analyzeSentence);

  const perplexity = calculatePerplexity(text);
  const burstiness = calculateBurstiness(sentences);
  const vocabularyDiversity = calculateVocabularyDiversity(text);
  const sentenceLengthVariation = calculateSentenceLengthVariation(sentences);
  const transitionFrequency = calculateTransitionFrequency(text);
  const passiveVoiceRatio = calculatePassiveVoiceRatio(text);
  const aiPhraseDensity = calculateAIPhraseDensity(text);
  const sentenceStartDiversity = calculateSentenceStartDiversity(sentences);
  const pronounUsage = calculatePronounUsage(text);
  const hedgingFrequency = calculateHedgingFrequency(text);
  const quantifierOveruse = calculateQuantifierOveruse(text);

  const weights = {
    sentenceAvg: 0.30,
    aiPhrases: 0.16,
    burstiness: 0.14,
    perplexity: 0.12,
    transitions: 0.08,
    vocabulary: 0.06,
    sentenceVariation: 0.05,
    passive: 0.03,
    sentenceStart: 0.02,
    pronoun: 0.02,
    hedging: 0.01,
    quantifier: 0.01,
  };

  const sentenceAvg = sentenceResults.length > 0
    ? sentenceResults.reduce((s, r) => s + r.score, 0) / sentenceResults.length : 70;

  const overallScore = Math.max(0, Math.min(100, Math.round(
    sentenceAvg * weights.sentenceAvg +
    perplexity * weights.perplexity +
    burstiness * weights.burstiness +
    vocabularyDiversity * weights.vocabulary +
    sentenceLengthVariation * weights.sentenceVariation +
    (100 - transitionFrequency) * weights.transitions +
    (100 - passiveVoiceRatio) * weights.passive +
    (100 - aiPhraseDensity) * weights.aiPhrases +
    sentenceStartDiversity * weights.sentenceStart +
    pronounUsage * weights.pronoun +
    (100 - hedgingFrequency) * weights.hedging +
    (100 - quantifierOveruse) * weights.quantifier
  )));

  let overallVerdict: 'human' | 'ai' | 'mixed';
  if (overallScore >= 65) overallVerdict = 'human';
  else if (overallScore >= 45) overallVerdict = 'mixed';
  else overallVerdict = 'ai';

  // Confidence interval: wider when fewer sentences or high metric variance
  const sentenceScoreVariance = sentenceResults.length > 1
    ? sentenceResults.reduce((sum, r) => sum + Math.pow(r.score - overallScore, 2), 0) / sentenceResults.length
    : 400;
  const margin = Math.min(15, Math.round(Math.sqrt(sentenceScoreVariance) * 0.6 + (sentenceResults.length < 5 ? 6 : 2)));
  const confidenceInterval = {
    lower: Math.max(0, Math.round(overallScore - margin)),
    upper: Math.min(100, Math.round(overallScore + margin)),
  };

  return {
    score: Math.round(overallScore),
    confidenceInterval,
    sentences: sentenceResults,
    overallVerdict,
    analysis: {
      perplexity: Math.round(perplexity),
      burstiness: Math.round(burstiness),
      vocabularyDiversity: Math.round(vocabularyDiversity),
      sentenceLengthVariation: Math.round(sentenceLengthVariation),
      transitionFrequency: Math.round(transitionFrequency),
      passiveVoiceRatio: Math.round(passiveVoiceRatio),
      aiPhraseDensity: Math.round(aiPhraseDensity),
      sentenceStartDiversity: Math.round(sentenceStartDiversity),
      pronounUsage: Math.round(pronounUsage),
      hedgingFrequency: Math.round(hedgingFrequency),
      quantifierOveruse: Math.round(quantifierOveruse),
    },
    readability: calculateReadability(text),
  };
}

// ==================== DETAILED REPORT ====================

export function getDetailedDetectionReport(text: string): DetailedDetectionReport {
  const result = detectAI(text);
  const { sentences, analysis, score, confidenceInterval, overallVerdict } = result;

  // Top 5 most AI-like sentences
  const sortedAsc = [...sentences].sort((a, b) => a.score - b.score);
  const topAiSentences = sortedAsc.slice(0, 5).map(s => ({
    text: s.text.length > 120 ? s.text.slice(0, 117) + '...' : s.text,
    score: s.score,
    issues: s.issues,
  }));

  // Top 5 most human-like sentences
  const sortedDesc = [...sentences].sort((a, b) => b.score - a.score);
  const topHumanSentences = sortedDesc.slice(0, 5).map(s => ({
    text: s.text.length > 120 ? s.text.slice(0, 117) + '...' : s.text,
    score: s.score,
    issues: s.issues,
  }));

  // Found AI phrases in text
  const lower = text.toLowerCase();
  const foundAiPhrases: string[] = [];
  AI_PHRASES.forEach(phrase => {
    if (lower.includes(phrase)) foundAiPhrases.push(phrase);
  });
  // Arabic AI phrases
  const isArabic = /[؀-ۿ]/.test(text);
  if (isArabic) {
    AR_AI_PHRASES.forEach(phrase => {
      if (text.includes(phrase)) foundAiPhrases.push(phrase);
    });
  }

  // Metrics summary with human-readable interpretations
  const metricsSummary = [
    { name: 'Perplexity', value: analysis.perplexity, interpretation: analysis.perplexity >= 55 ? 'Good diversity' : 'Low diversity (AI-like)' },
    { name: 'Burstiness', value: analysis.burstiness, interpretation: analysis.burstiness >= 40 ? 'Good variation' : 'Uniform lengths (AI-like)' },
    { name: 'Vocabulary Diversity', value: analysis.vocabularyDiversity, interpretation: analysis.vocabularyDiversity >= 60 ? 'Rich vocabulary' : 'Repetitive vocabulary' },
    { name: 'Sentence Variation', value: analysis.sentenceLengthVariation, interpretation: analysis.sentenceLengthVariation >= 40 ? 'Good length variation' : 'Uniform sentence lengths' },
    { name: 'AI Phrase Density', value: analysis.aiPhraseDensity, interpretation: analysis.aiPhraseDensity <= 15 ? 'Low AI phrasing' : 'High AI phrasing detected' },
    { name: 'Passive Voice', value: analysis.passiveVoiceRatio, interpretation: analysis.passiveVoiceRatio <= 20 ? 'Acceptable passive use' : 'Excessive passive voice' },
    { name: 'Transition Frequency', value: analysis.transitionFrequency, interpretation: analysis.transitionFrequency <= 12 ? 'Natural transitions' : 'Over-use of transitions' },
    { name: 'Sentence Start Diversity', value: analysis.sentenceStartDiversity, interpretation: analysis.sentenceStartDiversity >= 60 ? 'Diverse openers' : 'Repetitive sentence openers' },
  ];

  // Actionable recommendations
  const recommendations: string[] = [];
  if (analysis.aiPhraseDensity > 15) recommendations.push('Remove AI-typical phrases like "furthermore," "it is important to note," "delve into"');
  if (analysis.burstiness < 40) recommendations.push('Vary sentence lengths — mix short punchy sentences with longer ones');
  if (analysis.perplexity < 55) recommendations.push('Use more varied vocabulary and unexpected word choices');
  if (analysis.sentenceStartDiversity < 60) recommendations.push('Start sentences differently — avoid always using "The," "This," or transition words');
  if (analysis.passiveVoiceRatio > 20) recommendations.push('Convert passive voice to active voice where possible');
  if (analysis.transitionFrequency > 12) recommendations.push('Reduce transition words (however, moreover, furthermore) — use them sparingly');
  if (analysis.hedgingFrequency > 20) recommendations.push('Reduce hedging language ("it could be argued," "it is possible that")');
  if (topAiSentences.length > 0 && topAiSentences[0].score < 30) {
    recommendations.push(`Focus on rewriting the lowest-scoring sentence: "${topAiSentences[0].text}"`);
  }
  if (recommendations.length === 0) recommendations.push('Text reads naturally — no major AI patterns detected');

  return {
    overallScore: score,
    confidenceInterval,
    verdict: overallVerdict,
    topAiSentences,
    topHumanSentences,
    foundAiPhrases,
    metricsSummary,
    recommendations,
  };
}

// ==================== UTILITY FUNCTIONS ====================

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

export function getClassificationColor(classification: 'human' | 'maybe' | 'ai'): string {
  switch (classification) {
    case 'human': return 'bg-green-500/20 border-green-500/50';
    case 'maybe': return 'bg-yellow-500/20 border-yellow-500/50';
    case 'ai': return 'bg-red-500/20 border-red-500/50';
  }
}

export function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}
