
import React, { useState } from 'react';
import { X, Trash2, Shield, ExternalLink, Plus, Key } from 'lucide-react';
import { AiProvider } from '../types';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKeys: string[];
    onAddKey: (key: string) => void;
    onRemoveKey: (index: number) => void;
    forceOpen: boolean;
    provider: AiProvider;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
    isOpen, 
    onClose, 
    apiKeys, 
    onAddKey, 
    onRemoveKey,
    forceOpen,
    provider
}) => {
    const [newKey, setNewKey] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (newKey.trim()) {
            onAddKey(newKey.trim());
            setNewKey('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    const getProviderLinks = (prov: AiProvider) => {
        switch(prov) {
            case 'Google Gemini': return { url: 'https://aistudio.google.com/app/apikey', label: 'Get API Key from Google AI Studio' };
            case 'Groq Cloud': return { url: 'https://console.groq.com/keys', label: 'Get API Key from Groq Cloud' };
            case 'xAI Grok': return { url: 'https://console.x.ai/', label: 'Get API Key from xAI Console' };
            case 'Mistral AI': return { url: 'https://console.mistral.ai/api-keys/', label: 'Get API Key from Mistral Platform' };
            default: return { url: '#', label: 'Get API Key' };
        }
    }

    const linkData = getProviderLinks(provider);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#0f1320] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/5">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#0b1020]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                            <Shield className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-200 leading-none">{provider} Access</h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Configure your credentials</p>
                        </div>
                    </div>
                    {!forceOpen && (
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    
                    {/* Add New Key */}
                    <div className="mb-8">
                        <label className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
                            Add New {provider} Key
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <div className="absolute left-3 top-2.5 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                                    <Key className="w-4 h-4" />
                                </div>
                                <input 
                                    type="text" 
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Paste ${provider} Key...`}
                                    className="w-full bg-[#050816] border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-slate-600"
                                />
                            </div>
                            <button 
                                onClick={handleAdd}
                                disabled={!newKey.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Saved Keys List */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Authorized Keys
                            </label>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {apiKeys.length} Active
                            </span>
                        </div>
                        
                        {apiKeys.length === 0 ? (
                            <div className="bg-[#151a25] border border-dashed border-gray-800 rounded-xl p-8 text-center">
                                <p className="text-xs text-slate-500 font-medium">No API keys configured</p>
                                <p className="text-[10px] text-slate-600 mt-1">Add a key above to initialize the generator</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {apiKeys.map((key, index) => (
                                    <div key={index} className="flex items-center justify-between bg-[#1a1f2e] border border-gray-800 hover:border-gray-700 rounded-xl p-3 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <div className="font-mono text-[11px] text-slate-300 tracking-wide">
                                                ••••••••••••••••••••••••{key.slice(-4)}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRemoveKey(index)}
                                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Revoke Key"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Link */}
                <div className="p-4 bg-[#050816]/50 border-t border-gray-800">
                    <a 
                        href={linkData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-400 text-slate-400 py-3 rounded-xl text-xs font-semibold transition-all group"
                    >
                        <span>{linkData.label}</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
