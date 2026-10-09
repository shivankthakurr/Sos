'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Zap, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface CleverWidgetProps {
  theme: 'dark' | 'light';
  widgetId?: string;
}

export default function CleverWidget({
  theme,
  widgetId = '3eba83786be84c2194ebb5281225d137'
}: CleverWidgetProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeHeight, setIframeHeight] = useState(540);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Unique channel ID for iframe resize handshake protocol
  const channel = useMemo(
    () => Array.from(crypto.getRandomValues(new Uint8Array(16)), v => v.toString(16).padStart(2, '0')).join(''),
    [iframeKey]
  );

  const reloadWidget = () => {
    setIframeHeight(540);
    setIframeKey(k => k + 1);
  };

  // Handshake with embedded engine once loaded
  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'clever:init',
            channel,
            scheme: theme
          },
          'https://widgets.cleverhumanizer.ai'
        );
      } catch (err) {
        console.warn('Engine handshake notice:', err);
      }
    }
  };

  // Listen for dynamic resize messages from the backend engine
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://widgets.cleverhumanizer.ai') return;
      if (event.data?.channel !== channel) return;
      if (event.data?.type === 'clever:resize') {
        const height = event.data.height;
        if (typeof height === 'number' && Number.isFinite(height) && height >= 200 && height <= 20000) {
          setIframeHeight(height);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [channel]);

  // Exact clipping values to remove external branding:
  // - Top header (54px): contains external logo and name -> clipped via marginTop: -54px
  // - Bottom footer (66px): contains external attribution & terms -> clipped via container height trimming
  const topClip = 54;
  const bottomClip = 68;
  const viewportHeight = Math.max(420, iframeHeight - topClip - bottomClip);

  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Top Status Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight">Sanvox Cloud Humanizer</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active &bull; 100% Free Unlimited
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
              isDark
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

      {/* Main Unified Sanvox Engine Card */}
      <div
        className={`w-full rounded-2xl border transition-all shadow-xl overflow-hidden ${
          isDark
            ? 'bg-[#1b1e19] border-[#353c32] ring-1 ring-slate-800/40'
            : 'bg-white border-[#e4e3d9]'
        }`}
      >
        {/* Custom Sanvox Top Header Bar (100% replaces external header) */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between transition-colors ${
            isDark
              ? 'bg-[#171a16] border-[#353c32] text-[#e9eae2]'
              : 'bg-[#fcfbf7] border-[#e4e3d9] text-[#191e1a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">
                Sanvox <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Bypass Engine v4.2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Zero AI Detection</span>
            </span>
          </div>
        </div>

        {/* Viewport container with exact top/bottom clipping mask */}
        <div
          className="w-full relative overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: `${viewportHeight}px` }}
        >
          <iframe
            ref={iframeRef}
            key={`${widgetId}-${theme}-${iframeKey}`}
            src={`https://widgets.cleverhumanizer.ai/embed/${widgetId}?theme=${theme}`}
            aria-label="Sanvox AI Humanizer Engine"
            onLoad={handleIframeLoad}
            style={{
              marginTop: `-${topClip}px`,
              height: `${iframeHeight}px`,
              width: '100%',
              border: 0,
              display: 'block'
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            allow="clipboard-write"
            referrerPolicy="origin"
          />
        </div>

        {/* Custom Sanvox Bottom Bar (100% replaces external footer) */}
        <div
          className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs transition-colors ${
            isDark
              ? 'bg-[#171a16] border-[#353c32] text-[#a6ad9f]'
              : 'bg-[#fcfbf7] border-[#e4e3d9] text-[#5b6159]'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium text-[11px]">
              Protected by Sanvox AI Forensic Engine &bull; Zero Detection Guaranteed
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Private
            </span>
            <span>&bull;</span>
            <span>No Logs Kept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
