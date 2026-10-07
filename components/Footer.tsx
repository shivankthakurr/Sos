'use client';

import { Terminal, Globe, Mail, ShieldCheck, Heart, Sparkles, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-dark-700/60 bg-dark-950/90 backdrop-blur-xl mt-20 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/sanvox-logo.png" alt="Sanvox AI" className="w-9 h-9 object-contain rounded-full flex-shrink-0" />
              <h3 className="text-xl font-black text-white tracking-tight">
                Sanvox <span className="text-accent-400">AI</span>
              </h3>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed max-w-md">
              Next-generation AI text humanization & detection engine designed to rewrite synthetic AI text into natural, expressive, human-grade prose that seamlessly bypasses detection algorithms.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://shivankthakur.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900/80 hover:bg-dark-800 border border-dark-700/60 text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> Official Website
              </a>
              <a
                href="https://github.com/shivankthakurr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900/80 hover:bg-dark-800 border border-dark-700/60 text-xs font-semibold text-dark-200 hover:text-white transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" /> GitHub Profile
              </a>
            </div>
          </div>

          {/* Developer / Creator */}
          <div>
            <h4 className="text-xs font-bold text-dark-300 uppercase tracking-widest mb-4">Lead Developer</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-white font-semibold">Shivank Thakur</li>
              <li>
                <a
                  href="https://shivankthakur.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-400 hover:text-accent-400 transition-colors flex items-center gap-1"
                >
                  Portfolio: shivankthakur.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/shivankthakurr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-400 hover:text-accent-400 transition-colors flex items-center gap-1"
                >
                  GitHub: @shivankthakurr <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-dark-400 text-xs">Architect & AI Researcher</span>
              </li>
            </ul>
          </div>

          {/* Quick Links & Resources */}
          <div>
            <h4 className="text-xs font-bold text-dark-300 uppercase tracking-widest mb-4">Core Systems</h4>
            <ul className="space-y-2.5 text-sm text-dark-400">
              <li className="hover:text-accent-400 transition-colors cursor-pointer">Sanvox Humanizer Engine</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">Deep Forensics Detector</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">Multi-Pass Style Rewriter</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">Privacy & Local Processing</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-dark-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-dark-400">
          <p>
            &copy; {new Date().getFullYear()} <strong className="text-dark-200">Sanvox AI</strong>. Developed by{' '}
            <a href="https://shivankthakur.com/" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline font-semibold">
              Shivank Thakur
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="https://cleverhumanizer.ai"
              target="_blank"
              rel="nofollow noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                border: '1.5px solid #0E7B54',
                borderRadius: '999px',
                color: '#0E7B54',
                font: '700 12px system-ui, sans-serif',
                textDecoration: 'none',
                background: '#062016'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <img
                src="https://cleverhumanizer.ai/assets/img/logo-ai-humanizer40x40@2x.png"
                alt="Clever AI"
                width="16"
                height="16"
                style={{ borderRadius: '4px', display: 'block' }}
              />
              Checked by Clever AI Detector
            </a>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-400" /> 100% Privacy</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-400" /> Neural Rewriting</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
