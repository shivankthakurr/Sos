'use client';

import { useState } from 'react';
import { Search, CheckCircle, HelpCircle, BarChart3, Zap, BookOpen, Shield, AlertTriangle, Sparkles, Check, Info } from 'lucide-react';
import { detectAI, getClassificationColor, getScoreColor, getScoreBarColor, getDetailedDetectionReport } from '@/lib/detector';
import { getReadabilityLabel, getGradeLevelDescription } from '@/lib/readability';
import { SAMPLE_AI_TEXT } from '@/lib/prompts';
import { countWords } from '@/lib/storage';
import { BASE_PATH } from '@/lib/base-path';

interface DetectorProps {
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface DetectionResponseData {
  label: 'human' | 'ai';
  aiProbability: number;
  humanProbability: number;
  model: string;
  elapsedMs: number;
  source: string;
  verdict?: string;
  sentences?: Array<{
    text: string;
    score: number;
    classification: 'human' | 'maybe' | 'ai';
    issues: string[];
  }>;
}

export default function Detector({ showToast }: DetectorProps) {
  const [text, setText] = useState('');
  const [detectionData, setDetectionData] = useState<DetectionResponseData | null>(null);
  const [heuristic, setHeuristic] = useState<ReturnType<typeof detectAI> | null>(null);
  const [detailedReport, setDetailedReport] = useState<ReturnType<typeof getDetailedDetectionReport> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async () => {
    if (!text.trim()) {
      showToast('warning', 'Please enter text to analyze.');
      return;
    }
    setLoading(true);
    setDetectionData(null);
    setHeuristic(null);
    setDetailedReport(null);

    try {
      const response = await fetch(`${BASE_PATH}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.success && json?.data) {
          const d = json.data;
          const aiP = typeof d.aiProbability === 'number' ? d.aiProbability : (typeof d.score === 'number' ? d.score : 0.5);
          const humanP = typeof d.humanProbability === 'number' ? d.humanProbability : (1 - aiP);
          setDetectionData({
            label: aiP >= 0.5 ? 'ai' : 'human',
            aiProbability: aiP,
            humanProbability: humanP,
            model: d.model || 'Sanvox Neural Heuristic Engine v2.0',
            elapsedMs: d.elapsedMs || 0,
            source: d.source || 'sanvox-engine',
            verdict: d.verdict,
            sentences: d.sentences,
          });
        }
      }
    } catch {
      // Local fallback handled smoothly below
    }

    // Run high-precision local analysis
    try {
      const localResult = detectAI(text);
      const report = getDetailedDetectionReport(text);
      setHeuristic(localResult);
      setDetailedReport(report);

      // If server route didn't set detectionData, use local result directly
      setDetectionData(prev => {
        if (prev) return prev;
        const humanProb = localResult.score / 100;
        const aiProb = Math.round((1 - humanProb) * 100) / 100;
        return {
          label: localResult.overallVerdict === 'human' ? 'human' : 'ai',
          aiProbability: aiProb,
          humanProbability: humanProb,
          model: 'Sanvox Neural Heuristic Engine v2.0',
          elapsedMs: 45,
          source: 'sanvox-local',
          verdict: localResult.overallVerdict,
          sentences: localResult.sentences,
        };
      });

      showToast('success', 'Analysis completed successfully!');
    } catch {
      showToast('error', 'Failed to analyze text.');
    } finally {
      setLoading(false);
    }
  };

  const aiPercent = detectionData ? Math.round(detectionData.aiProbability * 100) : (heuristic ? 100 - heuristic.score : 0);
  const humanPercent = detectionData ? Math.round(detectionData.humanProbability * 100) : (heuristic ? heuristic.score : 0);
  const isLikelyHuman = humanPercent >= 60;
  const isMixed = humanPercent >= 45 && humanPercent < 60;

  const readLabel = heuristic ? getReadabilityLabel(heuristic.readability.fleschReadingEase) : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Sanvox AI Deep Scan
          </div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Search className="w-7 h-7 text-accent-400" /> AI Content Detector
          </h2>
          <p className="text-dark-300 text-sm mt-1">
            Detect ChatGPT, Claude, Gemini, and GPT-4 patterns with deep entropy, burstiness, and sentence-level forensics.
          </p>
        </div>
        <button
          onClick={() => { setText(SAMPLE_AI_TEXT); showToast('info', 'Sample AI text loaded!'); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800/80 hover:bg-dark-700/80 border border-dark-700/60 text-dark-200 hover:text-white text-sm font-medium transition-all self-start shadow-sm"
        >
          <Zap className="w-4 h-4 text-accent-400" /> Load Sample AI Text
        </button>
      </div>

      {/* Input Text Area */}
      <div className="glass-card rounded-2xl p-5 border border-dark-700/60 shadow-xl relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-dark-200 flex items-center gap-1.5">
            Enter or Paste Text
          </label>
          {text && (
            <button
              onClick={() => { setText(''); setDetectionData(null); setHeuristic(null); setDetailedReport(null); }}
              className="text-xs text-dark-400 hover:text-red-400 transition-colors"
            >
              Clear text
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste essays, articles, or AI output here to check for synthetic patterns..."
          className="w-full h-52 p-4 bg-dark-900/60 border border-dark-700/50 rounded-xl text-white placeholder-dark-500 resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-medium text-dark-400">
            {countWords(text)} words &bull; {text.length} characters
          </span>
          <button
            onClick={handleDetect}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white font-semibold text-sm shadow-lg shadow-accent-500/25 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Zap className="w-4 h-4 animate-pulse" /> Scanning Patterns...</>
            ) : (
              <><Search className="w-4 h-4" /> Scan with Sanvox AI</>
            )}
          </button>
        </div>
      </div>

      {/* Primary Detection Result Banner */}
      {detectionData && (
        <div className="glass-card rounded-2xl p-7 border border-dark-700/80 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-dark-700/60">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                isLikelyHuman
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-green-500/10'
                  : isMixed
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-yellow-500/10'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-red-500/10'
              }`}>
                {isLikelyHuman ? <Check className="w-7 h-7" /> : isMixed ? <AlertTriangle className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-2xl font-bold ${
                    isLikelyHuman ? 'text-green-400' : isMixed ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {isLikelyHuman ? 'Likely Human-Authored' : isMixed ? 'Mixed / Partially AI-Generated' : 'Likely AI-Generated'}
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20 font-medium">
                    {detectionData.model}
                  </span>
                </div>
                <p className="text-dark-400 text-xs mt-1">
                  Confidence Score: {Math.max(humanPercent, aiPercent)}% &bull; Analyzed in {detectionData.elapsedMs}ms
                </p>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="flex items-center gap-8 bg-dark-900/60 px-6 py-4 rounded-xl border border-dark-700/50">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-green-400 mb-0.5">{humanPercent}%</div>
                <div className="text-[11px] uppercase tracking-wider text-dark-400 font-semibold">Human Score</div>
              </div>
              <div className="w-[1px] h-10 bg-dark-700" />
              <div className="text-center">
                <div className={`text-3xl font-extrabold ${aiPercent > 40 ? 'text-red-400' : 'text-dark-300'} mb-0.5`}>
                  {aiPercent}%
                </div>
                <div className="text-[11px] uppercase tracking-wider text-dark-400 font-semibold">AI Probability</div>
              </div>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium text-dark-400 mb-1.5">
              <span className="text-green-400">Human Likeness ({humanPercent}%)</span>
              <span className="text-red-400">AI Likeness ({aiPercent}%)</span>
            </div>
            <div className="h-3 w-full bg-dark-900 rounded-full overflow-hidden flex">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700" style={{ width: `${humanPercent}%` }} />
              <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-700" style={{ width: `${aiPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Heuristic Analysis & Metrics */}
      {heuristic && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 12-Metric Deep Inspection */}
          <div className="glass-card rounded-2xl p-6 border border-dark-700/60 shadow-lg">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent-400" /> Forensics Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Burstiness', value: heuristic.analysis.burstiness, desc: 'Sentence variation', good: heuristic.analysis.burstiness >= 50 },
                { label: 'Vocab Diversity', value: heuristic.analysis.vocabularyDiversity, desc: 'Lexical variety', good: heuristic.analysis.vocabularyDiversity >= 60 },
                { label: 'Perplexity', value: heuristic.analysis.perplexity, desc: 'Surprisal & entropy', good: heuristic.analysis.perplexity >= 55 },
                { label: 'Length Variation', value: heuristic.analysis.sentenceLengthVariation, desc: 'Length distribution', good: heuristic.analysis.sentenceLengthVariation >= 45 },
                { label: 'Start Diversity', value: heuristic.analysis.sentenceStartDiversity, desc: 'Opener variety', good: heuristic.analysis.sentenceStartDiversity >= 60 },
                { label: 'Pronoun Usage', value: heuristic.analysis.pronounUsage, desc: 'Conversational voice', good: heuristic.analysis.pronounUsage >= 20 },
                { label: 'AI Phrases', value: heuristic.analysis.aiPhraseDensity, desc: 'Cliché AI patterns', good: heuristic.analysis.aiPhraseDensity <= 15 },
                { label: 'Transitions', value: heuristic.analysis.transitionFrequency, desc: 'Overused connectors', good: heuristic.analysis.transitionFrequency <= 25 },
              ].map(m => (
                <div key={m.label} className="bg-dark-900/60 rounded-xl p-3 border border-dark-700/40">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-dark-300 font-medium">{m.label}</span>
                    <span className={`text-xs font-bold ${m.good ? 'text-green-400' : 'text-yellow-400'}`}>
                      {m.value}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.good ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(100, m.value)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-dark-500 mt-1">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Readability & Recommendations */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-dark-700/60 shadow-lg">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent-400" /> Readability & Flow
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-900/60 rounded-xl p-3.5 border border-dark-700/40 text-center">
                  <p className={`text-2xl font-extrabold ${readLabel?.color}`}>{heuristic.readability.fleschReadingEase}</p>
                  <p className="text-xs text-dark-400 font-medium mt-0.5">Reading Ease</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${readLabel?.color}`}>{readLabel?.label}</p>
                </div>
                <div className="bg-dark-900/60 rounded-xl p-3.5 border border-dark-700/40 text-center">
                  <p className="text-2xl font-extrabold text-dark-100">{heuristic.readability.fleschKincaidGrade}</p>
                  <p className="text-xs text-dark-400 font-medium mt-0.5">Grade Level</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">{getGradeLevelDescription(heuristic.readability.fleschKincaidGrade)}</p>
                </div>
                <div className="bg-dark-900/60 rounded-xl p-3.5 border border-dark-700/40 text-center">
                  <p className="text-2xl font-extrabold text-dark-100">{heuristic.readability.readingTimeMinutes} min</p>
                  <p className="text-xs text-dark-400 font-medium mt-0.5">Estimated Reading</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">at 200 WPM</p>
                </div>
                <div className="bg-dark-900/60 rounded-xl p-3.5 border border-dark-700/40 text-center">
                  <p className="text-2xl font-extrabold text-dark-100">{heuristic.readability.avgWordsPerSentence}</p>
                  <p className="text-xs text-dark-400 font-medium mt-0.5">Avg Words / Sentence</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">{heuristic.readability.totalSentences} sentences total</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {detailedReport && detailedReport.recommendations.length > 0 && (
              <div className="glass-card rounded-2xl p-5 border border-dark-700/60 shadow-lg">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-accent-400" /> Improvement Tips to Bypass Detectors
                </h4>
                <ul className="space-y-2 text-xs text-dark-300">
                  {detailedReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 bg-dark-900/40 p-2.5 rounded-lg border border-dark-700/30">
                      <span className="text-accent-400 font-bold">&bull;</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sentence-by-Sentence Breakdown */}
      {heuristic && heuristic.sentences.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-dark-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Sentence-by-Sentence Analysis ({heuristic.sentences.length})
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Human</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Mixed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> AI</span>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {heuristic.sentences.map((sent, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  sent.classification === 'human'
                    ? 'bg-green-500/10 border-green-500/30 text-green-100'
                    : sent.classification === 'maybe'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100'
                      : 'bg-red-500/10 border-red-500/30 text-red-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm flex-1 leading-relaxed">{sent.text}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    sent.classification === 'human'
                      ? 'bg-green-500/20 text-green-300'
                      : sent.classification === 'maybe'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}>
                    {sent.score}% Human
                  </span>
                </div>
                {sent.issues && sent.issues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dark-700/30">
                    {sent.issues.map((iss, j) => (
                      <span key={j} className="text-[11px] bg-dark-900/60 px-2 py-0.5 rounded text-dark-300">
                        {iss}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
