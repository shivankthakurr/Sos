'use client';

import { useState } from 'react';
import { RefreshCw, Info, ExternalLink, ShieldCheck, Zap, Maximize2 } from 'lucide-react';

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

  const openPopupWindow = () => {
    window.open(
      `https://widgets.cleverhumanizer.ai/embed/${widgetId}?theme=${theme}`,
      'SanvoxCloud',
      'width=540,height=780,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
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
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight">Sanvox Neural Cloud Engine</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active &bull; Instant Free
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-speed AI text humanization &amp; bypass engine &bull; Zero API keys required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Instant Popup Window Button (bypasses any iframe domain restriction!) */}
          <button
            onClick={openPopupWindow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-95"
            title="Open instant Cloud Humanizer popup window (works on any domain)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open in Popup Window</span>
          </button>

          <button
            onClick={reloadWidget}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Reload frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Domain Authorization Notice & Help */}
      <div className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
        theme === 'dark'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Agar iframe me &quot;Content is blocked&quot; dikhe to:</span>
          </div>
          <button
            onClick={openPopupWindow}
            className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            &rarr; &quot;Open in Popup Window&quot; dabayein (yeh turant khul jayega)
          </button>
        </div>
        <p className="text-[11px] text-amber-200/90 leading-relaxed">
          Iframe ko direct is page par render karne ke liye apne widget dashboard me jaakar <strong>&gt; Widget settings</strong> kholiye aur <strong>Allowed websites</strong> me <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">https://sos-ruk2.vercel.app</code> add kar lijiye.
        </p>
      </div>

      {/* Main Cloud Engine Frame */}
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
