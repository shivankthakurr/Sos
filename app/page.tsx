'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, FileText, ArrowRight, Zap, Shield, Globe, Check,
  CreditCard, TrendingUp, BarChart2, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Humanizer from '@/components/Humanizer';
import CleverWidget from '@/components/CleverWidget';
import BatchHumanizer from '@/components/BatchHumanizer';
import Detector from '@/components/Detector';
import History from '@/components/History';
import Settings from '@/components/Settings';
import ObservabilityDashboard from '@/components/ObservabilityDashboard';
import Toast from '@/components/Toast';
import Footer from '@/components/Footer';
import { Toast as ToastType, Tab } from '@/lib/types';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';

function HeroSection({ onStart, theme }: { onStart: () => void; theme: 'dark' | 'light' }) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-24">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none bg-grid opacity-30" />

      <div className="relative container mx-auto px-4 max-w-5xl text-center">
        <div className="animate-fade-in-up">
          {/* Creator & Status Badge */}
          <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-medium mb-7 shadow-sm transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/90 border border-slate-700 text-slate-300'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}>
            <img src="/sanvox-logo.png" alt="Sanvox AI" className="w-4 h-4 rounded-full object-contain" />
            <span>Sanvox AI v3.0 &bull; Lead Developer:</span>
            <a
              href="https://shivankthakur.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-500 hover:underline"
            >
              Shivank Thakur
            </a>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-5 leading-[1.12]">
            Transform <span className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 bg-clip-text text-transparent">Synthetic AI</span> Into<br />
            <span>Undetectable Human Prose</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-9 leading-relaxed font-normal text-slate-400">
            Disrupt statistical perplexity, burstiness, and formulaic AI markers. High-fidelity humanization with built-in deep forensic detection.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-10 animate-fade-in-up-delay">
          {[
            { icon: <Zap className="w-4 h-4 text-indigo-400" />, label: 'Instant Humanization' },
            { icon: <Shield className="w-4 h-4 text-indigo-400" />, label: 'Ninja Stealth Mode' },
            { icon: <BarChart2 className="w-4 h-4 text-indigo-400" />, label: 'Forensic Detection Scan' },
            { icon: <RefreshCw className="w-4 h-4 text-indigo-400" />, label: 'Multi-Pass Refine' },
            { icon: <FileText className="w-4 h-4 text-indigo-400" />, label: 'PDF & DOCX Support' },
            { icon: <Globe className="w-4 h-4 text-indigo-400" />, label: '16+ Languages' },
          ].map(f => (
            <div
              key={f.label}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-medium border shadow-sm transition-all hover:-translate-y-0.5 cursor-default ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-center gap-3 animate-fade-in-up-delay-2">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Humanizer Studio <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function StatsBar({ theme }: { theme: 'dark' | 'light' }) {
  const stats = [
    { value: '99.4%', label: 'Human Pass Rate' },
    { value: '35+', label: 'AI Model Connectors' },
    { value: '0.4s', label: 'Local Forensics Scan' },
    { value: '16+', label: 'Global Languages' },
  ];

  return (
    <section className="py-6 relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className={`rounded-2xl p-6 sm:p-7 border shadow-sm transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-white border-slate-200'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-4xl font-extrabold text-indigo-500 tracking-tight">
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ theme }: { theme: 'dark' | 'light' }) {
  const plans = [
    {
      name: 'Community Free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for students, quick drafts, and verifying the Sanvox engine.',
      badge: null,
      features: [
        'Sanvox Neural Heuristic Engine',
        'Unlimited AI Detection scans',
        'Privacy Mode (100% offline local processing)',
        'Up to 5,000 words per session',
        'Detailed sentence-by-sentence analysis',
      ],
      cta: 'Current Plan',
      popular: false,
    },
    {
      name: 'Pro Creator',
      price: '$19',
      period: '/month',
      description: 'For researchers, copywriters, and professional content creators.',
      badge: 'Recommended',
      features: [
        'Everything in Free',
        'All 35+ AI Providers (GPT-4o, Claude 3.5, Gemini 2.5)',
        'Multi-Pass Ninja Bypass (99.8% pass rate)',
        'Unlimited word count & batch document upload',
        'PDF & DOCX file conversion',
        'All writing styles & tone calibration',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Enterprise & API',
      price: '$49',
      period: '/month',
      description: 'For teams, agencies, and high-throughput automated publishing.',
      badge: null,
      features: [
        'Everything in Pro',
        'REST API & Webhook endpoints',
        'Dedicated server queue with 0 rate limits',
        'Turnitin & Copyleaks bypass hardening',
        '50% Affiliate Partner Payout Share',
        'Priority technical support',
      ],
      cta: 'Contact for Enterprise',
      popular: false,
    },
  ];

  return (
    <section className="py-16 relative" id="pricing-section">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2.5">
            <CreditCard className="w-3.5 h-3.5" /> Pricing & Payout Plans
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2.5">
            Simple, Transparent Tiers
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Choose the right power level for your writing workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 flex flex-col justify-between relative border transition-all ${
                p.popular
                  ? 'border-indigo-500 shadow-lg ring-1 ring-indigo-500'
                  : theme === 'dark'
                    ? 'border-slate-800 bg-slate-900/60 shadow-sm'
                    : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  {p.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-5 min-h-[32px] leading-relaxed">{p.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-xs font-medium text-slate-400">{p.period}</span>
                </div>

                <div className="space-y-3 border-t border-slate-700/40 pt-5 mb-6">
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  p.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    : theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Affiliate Payout Notice */}
        <div className={`rounded-2xl p-5 mt-10 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-0.5">Partner Payout Program</h4>
              <p className="text-xs text-slate-400">
                Earn 50% recurring commissions on all referred subscribers. Monthly automated disbursements.
              </p>
            </div>
          </div>
          <a
            href="https://shivankthakur.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Apply for Partner Payout &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ theme }: { theme: 'dark' | 'light' }) {
  const steps = [
    { num: '01', icon: <FileText className="w-5 h-5 text-indigo-400" />, title: 'Paste or Upload', desc: 'Paste raw ChatGPT, Claude, or Gemini output, or upload DOCX/PDF files directly.' },
    { num: '02', icon: <Sparkles className="w-5 h-5 text-indigo-400" />, title: 'Configure Tone', desc: 'Select from Academic, Professional, Casual, or Ninja Stealth mode to balance vocabulary and structure.' },
    { num: '03', icon: <ArrowRight className="w-5 h-5 text-indigo-400" />, title: 'Verify & Export', desc: 'Inspect the sentence-by-sentence detection score and export directly to clean text or Word.' },
  ];

  return (
    <section className="py-14 relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">How Sanvox AI Operates</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Three intuitive steps to organic, undetectable writing</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`rounded-2xl p-6 text-center border shadow-sm transition-all hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                {s.icon}
              </div>
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Step {s.num}</div>
              <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('humanizer');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const saved = getTheme();
    const effectiveTheme: 'dark' | 'light' = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    setThemeState(effectiveTheme);
    if (effectiveTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveTheme(next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const showToast = useCallback((type: ToastType['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const scrollToWorkspace = () => {
    document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${theme} flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#080c16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    } selection:bg-indigo-500 selection:text-white`}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />

      {/* Hero only appears on main workspace tabs */}
      {activeTab === 'humanizer' && (
        <>
          <HeroSection onStart={scrollToWorkspace} theme={theme} />
          <StatsBar theme={theme} />
        </>
      )}

      {/* Main Interactive Workspace Area */}
      <main className="container mx-auto px-4 py-6 max-w-6xl flex-1" id="workspace-section">
        {activeTab === 'humanizer' && (
          <Humanizer showToast={showToast} onGoToSettings={() => setActiveTab('settings')} onGoToClever={() => setActiveTab('clever')} isFirstVisit={false} />
        )}

        {activeTab === 'clever' && (
          <CleverWidget theme={theme} />
        )}

        {activeTab === 'detector' && (
          <Detector showToast={showToast} />
        )}

        {activeTab === 'batch' && (
          <BatchHumanizer showToast={showToast} />
        )}

        {activeTab === 'dashboard' && (
          <ObservabilityDashboard showToast={showToast} />
        )}

        {activeTab === 'history' && (
          <History showToast={showToast} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'settings' && (
          <Settings showToast={showToast} />
        )}
      </main>

      {/* Supporting Sections */}
      {activeTab === 'humanizer' && (
        <>
          <HowItWorks theme={theme} />
          <PricingSection theme={theme} />
        </>
      )}

      {/* Floating Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
