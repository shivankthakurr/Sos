'use client';

import { useState } from 'react';
import { Sparkles, Shield, ExternalLink, RefreshCw, CheckCircle2, Globe, Info } from 'lucide-react';

interface CleverWidgetProps {
  theme: 'dark' | 'light';
  widgetId?: string;
}

export default function CleverWidget({
  theme,
  widgetId = '33dc43a519354b10acae8f772de30821'
}: CleverWidgetProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const reloadWidget = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Top Header Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        theme === 'dark'
          ? 'bg-slate-900/80 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight">Clever Cloud Engine</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active &bull; 100% Free
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[10px]">
                Sanvox ID: {widgetId.slice(0, 8)}...
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant bypass with zero API keys required &bull; Live cloud rewrite powered by Clever AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Official Clever Badge */}
          <a
            href="https://cleverhumanizer.ai"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
            style={{
              border: '1.5px solid #0E7B54',
              color: '#0E7B54',
              background: theme === 'dark' ? '#062016' : '#E7F3EC'
            }}
          >
            <img
              src="https://cleverhumanizer.ai/assets/img/logo-ai-humanizer40x40@2x.png"
              alt="Clever"
              className="w-3.5 h-3.5 rounded"
            />
            Checked by Clever
          </a>

          <button
            onClick={reloadWidget}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Reload widget frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Domain notice & instructions banner */}
      <div className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
        theme === 'dark'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-amber-300">
              Why "Content is blocked" appears on localhost?
            </span>
          </div>
          <a
            href={`https://widgets.cleverhumanizer.ai/embed/${widgetId}?theme=${theme}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
          >
            Direct Test Link <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-200/90">
          Clever AI's server sends a strict security header: <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">frame-ancestors https://shivankthakur.com</code>. 
          To allow this widget to render on <strong>localhost</strong> or <strong>Vercel</strong>:
        </p>
        <ol className="list-decimal list-inside text-[11px] space-y-1 text-amber-200/90 pl-1">
          <li>Clever AI dashboard me apne <strong>Sanvox</strong> widget par jaakar <strong>&gt; Widget settings</strong> kholiye.</li>
          <li><strong>Allowed websites</strong> me <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">http://localhost:3000</code> aur apna Vercel URL add karke Save karein.</li>
          <li>Save karte hi upar <strong>Refresh</strong> button dabayein — widget turant load ho jayega!</li>
        </ol>
      </div>

      {/* Main Iframe Widget Container */}
      <div className={`w-full rounded-2xl border overflow-hidden transition-all shadow-xl relative ${
        theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 ring-1 ring-slate-800/50'
          : 'bg-white border-slate-200'
      }`}>
        <iframe
          key={`${widgetId}-${theme}-${iframeKey}`}
          src={`https://widgets.cleverhumanizer.ai/embed/${widgetId}?theme=${theme}`}
          aria-label="Sanvox AI Humanizer"
          className="w-full min-h-[760px] sm:min-h-[780px] border-0 block"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
          referrerPolicy="origin"
        />
      </div>
    </div>
  );
}
