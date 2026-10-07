'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Check,
  X,
  Zap,
  Star,
  RotateCcw,
  AlertTriangle,
  Server,
  Cpu,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  WEB_PROVIDERS as PROVIDERS,
  getProvider,
  validateApiKey,
} from '@/lib/providers';
import {
  getApiKeys,
  setApiKeys,
  clearApiKeys,
  getAppMode,
  setAppMode,
  getVerifiedProviders,
  setVerifiedProvider,
  AppMode,
} from '@/lib/storage';
import { ModelProvider } from '@/lib/types';

interface SettingsProps {
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

// The 4 curated providers required in Step 3.5
const CURATED_PROVIDERS: {
  id: ModelProvider;
  name: string;
  badge: 'Free tier' | 'Paid';
  badgeColor: string;
  getKeyUrl: string;
  defaultModel: string;
  recommendedModels: string[];
  placeholder: string;
}[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Free tier',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    defaultModel: 'gemini-2.5-flash',
    recommendedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    placeholder: 'AIzaSy...',
  },
  {
    id: 'groq',
    name: 'Groq',
    badge: 'Free tier',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    getKeyUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    recommendedModels: ['llama-3.3-70b-versatile', 'qwen/qwen3.8-27b', 'groq/compound-mini'],
    placeholder: 'gsk_...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Free tier',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    getKeyUrl: 'https://openrouter.ai/keys',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    recommendedModels: ['meta-llama/llama-3.3-70b-instruct', 'google/gemma-4-31b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free'],
    placeholder: 'sk-or-v1-...',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'Paid',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
    getKeyUrl: 'https://console.anthropic.com/',
    defaultModel: 'claude-sonnet-4-5',
    recommendedModels: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-3-5-sonnet-20241022'],
    placeholder: 'sk-ant-api03-...',
  },
];

export default function Settings({ showToast }: SettingsProps) {
  const [mode, setMode] = useState<AppMode>('with-key');
  const [keys, setKeys] = useState<Record<string, string | undefined>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
  const [verifyErrors, setVerifyErrors] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  // Ollama local state
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('qwen2.5:7b');
  const [checkingOllama, setCheckingOllama] = useState<boolean>(false);

  // Collapsible advanced drawer
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    setKeys(getApiKeys());
    setMode(getAppMode());
    setVerifiedMap(getVerifiedProviders());
    checkOllamaStatus();
  }, []);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setAppMode(newMode);
    showToast('info', `Switched to ${newMode === 'with-key' ? 'With API Key' : 'Without API Key (Local)'} mode`);
  };

  const checkOllamaStatus = async () => {
    setCheckingOllama(true);
    try {
      const res = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        setOllamaModels(models);
        setOllamaOnline(true);
        if (models.length > 0 && !models.includes(selectedOllamaModel)) {
          setSelectedOllamaModel(models[0]);
        }
      } else {
        setOllamaOnline(false);
      }
    } catch {
      setOllamaOnline(false);
    } finally {
      setCheckingOllama(false);
    }
  };

  const handleKeyChange = (providerId: string, val: string) => {
    const newKeys = { ...keys, [providerId]: val };
    setKeys(newKeys);
    setApiKeys(newKeys);
    // Clear verification status if key changes
    if (verifiedMap[providerId]) {
      const updated = { ...verifiedMap, [providerId]: false };
      setVerifiedMap(updated);
      setVerifiedProvider(providerId, false);
    }
    if (verifyErrors[providerId]) {
      setVerifyErrors(prev => ({ ...prev, [providerId]: '' }));
    }
  };

  const handleVerify = async (providerId: ModelProvider) => {
    const key = keys[providerId]?.trim();
    if (!key) {
      showToast('warning', `Please enter a key for ${providerId}`);
      return;
    }

    setVerifying(providerId);
    showToast('info', `Verifying ${providerId} key...`);

    try {
      const result = await validateApiKey(providerId, key);
      if (result.valid) {
        // Save key and mark verified
        const newKeys = { ...keys, [providerId]: key };
        setKeys(newKeys);
        setApiKeys(newKeys);
        setVerifiedProvider(providerId, true);
        setVerifiedMap(prev => ({ ...prev, [providerId]: true }));
        setVerifyErrors(prev => ({ ...prev, [providerId]: '' }));
        showToast('success', `${providerId} key is valid! ✅`);
      } else {
        setVerifiedProvider(providerId, false);
        setVerifiedMap(prev => ({ ...prev, [providerId]: false }));
        const errMsg = result.error || 'Invalid API key or network error';
        setVerifyErrors(prev => ({ ...prev, [providerId]: errMsg }));
        showToast('error', `Failed: ${errMsg} ❌`);
      }
    } catch (err: any) {
      setVerifiedProvider(providerId, false);
      setVerifiedMap(prev => ({ ...prev, [providerId]: false }));
      const errMsg = err.message || 'Verification failed';
      setVerifyErrors(prev => ({ ...prev, [providerId]: errMsg }));
      showToast('error', errMsg);
    } finally {
      setVerifying(null);
    }
  };

  const handleClearAll = () => {
    setKeys({});
    clearApiKeys();
    setVerifiedMap({});
    showToast('info', 'All API keys and verifications cleared');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" /> Settings & Providers
        </h2>
        <p className="text-slate-400 mt-1">Configure your humanization engine and manage providers</p>
      </div>

      {/* MODE SWITCHER (Step 3.5 A) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 shadow-lg">
        <button
          onClick={() => handleModeChange('with-key')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'with-key'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-4 h-4" /> With API key (Fast, &le;10% AI bypass)
        </button>
        <button
          onClick={() => handleModeChange('no-key')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'no-key'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" /> Without API key (Free, local Ollama)
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <p>
            <strong>Local Storage Privacy:</strong> API keys are saved exclusively in your browser&apos;s local storage.
          </p>
          <p className="text-slate-400">
            Keys are never committed, logged, or stored on external servers. Direct requests go straight to each provider.
          </p>
        </div>
      </div>

      {/* ==================== WITH API KEY MODE ==================== */}
      {mode === 'with-key' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Curated Providers (Recommended)
            </h3>
            {Object.values(keys).some(k => k && k.trim().length > 0) && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                Clear all keys
              </button>
            )}
          </div>

          <div className="grid gap-3.5">
            {CURATED_PROVIDERS.map(prov => {
              const keyVal = keys[prov.id] || '';
              const isVerified = verifiedMap[prov.id];
              const errorMsg = verifyErrors[prov.id];
              const isChecking = verifying === prov.id;

              return (
                <div
                  key={prov.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-white text-base">{prov.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${prov.badgeColor}`}>
                        {prov.badge}
                      </span>
                      {isVerified && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" /> Key is valid
                        </span>
                      )}
                    </div>
                    <a
                      href={prov.getKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 w-fit"
                    >
                      <ExternalLink className="w-3 h-3" /> Get API key
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 relative">
                      <input
                        type={showKeys[prov.id] ? 'text' : 'password'}
                        value={keyVal}
                        onChange={e => handleKeyChange(prov.id, e.target.value)}
                        placeholder={`Paste ${prov.name} key (${prov.placeholder})`}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        title={showKeys[prov.id] ? 'Hide key' : 'Show key'}
                      >
                        {showKeys[prov.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isChecking || !keyVal.trim()}
                      onClick={() => handleVerify(prov.id)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm min-w-[100px]"
                    >
                      {isChecking ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Collapsed More Providers Drawer */}
          <div className="pt-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-400 font-medium transition-colors"
            >
              <span>More providers (advanced — 25+ additional backends)</span>
              {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3">
                <p className="text-xs text-slate-400">
                  Additional providers are available for custom deployments:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {PROVIDERS.filter(p => !CURATED_PROVIDERS.some(c => c.id === p.id)).map(extra => (
                    <div key={extra.id} className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg text-xs">
                      <div className="font-semibold text-slate-300">{extra.name}</div>
                      <div className="text-slate-500 text-[11px] truncate">{extra.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== WITHOUT API KEY (LOCAL OLLAMA) MODE ==================== */}
      {mode === 'no-key' && (
        <div className="space-y-4">
          {/* Non-blocking Yellow Warning Banner (Step 3.5 C) */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300 mb-0.5">Notice: Local Model Quality</p>
              Without an API key, the result may be less humanized because local models are smaller (4B-8B).
              For guaranteed <strong>&lt;=10% AI detection bypass</strong>, we recommend adding a free Gemini or Groq API key in &quot;With API key&quot; mode.
            </div>
          </div>

          {/* Ollama Local Integration Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-base">Ollama Local Engine</h4>
                {ollamaOnline === true && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                )}
                {ollamaOnline === false && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">
                    Offline
                  </span>
                )}
              </div>
              <button
                onClick={checkOllamaStatus}
                disabled={checkingOllama}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${checkingOllama ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {ollamaOnline === true ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Ollama is running at <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">http://localhost:11434</code>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Installed Local Model:
                  </label>
                  {ollamaModels.length > 0 ? (
                    <select
                      value={selectedOllamaModel}
                      onChange={e => setSelectedOllamaModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {ollamaModels.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-300">
                      No models installed in Ollama yet. Run the pull command below.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <p>Ollama is not running locally or not reachable.</p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="text-slate-400 font-sans font-semibold">Windows Setup Instructions:</div>
                  <div className="text-indigo-300">1. Install Ollama from: https://ollama.com/download/windows</div>
                  <div className="text-indigo-300">2. Open CMD or PowerShell and run:</div>
                  <div className="bg-slate-900 p-2 rounded text-emerald-400 select-all">
                    ollama pull qwen2.5:7b
                  </div>
                  <div className="text-slate-400 font-sans text-[11px]">
                    (Recommended: <strong>qwen2.5:7b</strong> for 16GB RAM/VRAM, or <strong>llama3.1:8b</strong>. For lower RAM, use <strong>gemma3:4b</strong>)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
