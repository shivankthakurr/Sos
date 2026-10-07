'use client';

import { useState } from 'react';
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';

interface CleverWidgetProps {
  theme: 'dark' | 'light';
  widgetId?: string;
}

export default function CleverWidget({
  theme,
  widgetId = '3eba83786be84c2194ebb5281225d137'
}: CleverWidgetProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const reloadWidget = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Top Header Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${
        theme === 'dark'
          ? 'bg-slate-900/80 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight">Sanvox Cloud Humanizer</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active &bull; Free Unlimited
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-speed neural rewriting &amp; bypass engine built directly into Sanvox AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sanvox Shield Active</span>
          </div>

          <button
            onClick={reloadWidget}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Reload engine frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Cloud Engine Frame directly embedded in existing website */}
      <div className={`w-full rounded-2xl border overflow-hidden transition-all shadow-xl relative ${
        theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 ring-1 ring-slate-800/50'
          : 'bg-white border-slate-200'
      }`}>
        <iframe
          key={`${widgetId}-${theme}-${iframeKey}`}
          src={`https://widgets.cleverhumanizer.ai/embed/${widgetId}?theme=${theme}`}
          aria-label="Sanvox AI Humanizer"
          className="w-full min-h-[780px] sm:min-h-[820px] border-0 block"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
          referrerPolicy="origin"
        />
      </div>
    </div>
  );
}
