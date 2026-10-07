'use client';

import { Sparkles, Layers, Search, History, Settings, Sun, Moon, Activity, Zap } from 'lucide-react';
import type { Tab } from '@/lib/types';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: 'humanizer', label: 'Humanizer', icon: Sparkles },
  { id: 'clever', label: 'Cloud Engine', icon: Zap },
  { id: 'detector', label: 'AI Detector', icon: Search },
  { id: 'batch', label: 'Batch Mode', icon: Layers },
  { id: 'dashboard', label: 'Analytics', icon: Activity },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Navbar({ activeTab, setActiveTab, theme, toggleTheme }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-sm transition-colors duration-200 app-navbar">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('humanizer')}>
            <img
              src="/sanvox-logo.png"
              alt="Sanvox AI Logo"
              className="w-10 h-10 object-contain rounded-full transition-transform duration-200 hover:scale-105 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-100 brand-title">
                  Sanvox <span className="text-indigo-400">AI</span>
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-semibold tracking-wide">
                  v3.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                By <span className="font-medium text-slate-300">Shivank Thakur</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs + Theme Toggle aligned together */}
          <div className="flex items-center gap-3">
            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 rounded-xl p-1 shadow-inner nav-tabs-container">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-normal transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all theme-toggle-btn shadow-sm"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-slate-700">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1 pb-2.5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
