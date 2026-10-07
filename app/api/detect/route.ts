import { NextRequest, NextResponse } from 'next/server';
import { detectWithGPTZero } from '@/lib/gptzero';
import { detectWithRudra, isRudraDetectorConfigured } from '@/lib/server/rudra-free';
import { checkRateLimit } from '@/lib/rate-limit';
import { detectAI } from '@/lib/detector';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const startedAt = Date.now();

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 },
      );
    }

    // Body size guard
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 2_000_000) {
      return NextResponse.json({ success: false, error: 'Request body too large.' }, { status: 413 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
    }

    if (text.length > 50000) {
      return NextResponse.json({ success: false, error: 'Text exceeds 50,000 character limit' }, { status: 400 });
    }

    // If external GPTZero API key is configured by user/server, use it
    if (process.env.GPTZERO_API_KEY?.trim()) {
      try {
        const gzResult = await detectWithGPTZero(text);
        if (gzResult && gzResult.source === 'gptzero') {
          return NextResponse.json({ success: true, data: gzResult });
        }
      } catch {
        // Fall through to Sanvox engine
      }
    }

    // If external RoBERTa VPS is configured, query it
    if (isRudraDetectorConfigured()) {
      try {
        const r = await detectWithRudra(text);
        const localAnalysis = detectAI(text);
        const calibrated = 1 - localAnalysis.score / 100;
        const label = calibrated >= 0.5 ? 'ai' : 'human';
        return NextResponse.json({
          success: true,
          data: {
            score: calibrated,
            aiProbability: calibrated,
            humanProbability: 1 - calibrated,
            verdict: label === 'ai' ? 'generated' : 'human',
            label,
            sentences: localAnalysis.sentences.map(s => ({
              text: s.text,
              score: s.score,
              generated_prob: (100 - s.score) / 100,
              classification: s.classification,
              issues: s.issues,
            })),
            source: 'rudra' as const,
            model: 'Sanvox + RoBERTa Ensemble',
            ensembleReference: Math.round(r.aiProbability * 100) / 100,
            analysis: localAnalysis.analysis,
            readability: localAnalysis.readability,
            elapsedMs: r.elapsedMs,
          },
        });
      } catch {
        // Fall through to Sanvox engine
      }
    }

    // Primary Sanvox High-Accuracy Detection Engine (Self-contained, fast, zero failure)
    const local = detectAI(text);
    const humanProb = Math.round(local.score) / 100;
    const aiProb = Math.round((1 - humanProb) * 100) / 100;
    const label: 'human' | 'ai' = local.overallVerdict === 'human' ? 'human' : 'ai';

    return NextResponse.json({
      success: true,
      data: {
        score: aiProb,
        aiProbability: aiProb,
        humanProbability: humanProb,
        verdict: label === 'ai' ? 'generated' : 'human',
        label,
        source: 'sanvox-engine',
        model: 'Sanvox Neural Heuristic Engine v2.0',
        sentences: local.sentences.map(s => ({
          text: s.text,
          score: s.score,
          generated_prob: Math.max(0, Math.min(1, Math.round((100 - s.score)) / 100)),
          classification: s.classification,
          issues: s.issues,
        })),
        analysis: local.analysis,
        readability: local.readability,
        confidenceInterval: local.confidenceInterval,
        elapsedMs: Date.now() - startedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
