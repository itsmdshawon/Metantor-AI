
import React, { useState } from 'react';
import { X, Trash2, Shield, ExternalLink, Plus, Key, Info } from 'lucide-react';
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
        if (e.key === 'Enter') handleAdd();
    };

    const getProviderLinks = (prov: AiProvider) => {
        switch(prov) {
            case 'Google Gemini': return { url: 'https://aistudio.google.com/app/apikey', label: 'Get Free Gemini API Keys' };
            case 'Groq Cloud': return { url: 'https://console.groq.com/keys', label: 'Get Free Groq API Keys' };
            case 'Mistral AI': return { url: 'https://console.mistral.ai/api-keys/', label: 'Get Free Mistral API Keys' };
            default: return { url: '#', label: 'Get API Key' };
        }
    }

    const linkData = getProviderLinks(provider);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#0f1320] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/5">
                
                <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#0b1020]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                            <Shield className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-200 leading-none">{provider} Setup</h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">Add multiple keys for rotation</p>
                        </div>
                    </div>
                    {!forceOpen && (
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-6 flex gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
                            <Info className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-[10px] text-blue-200 leading-relaxed">
                            <b>Pro Tip:</b> Paste different keys here. The app will rotate them automatically to bypass rate limits!
                        </p>
                    </div>

                    <div className="mb-8">
                        <label className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
                            Paste {provider} Key
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="sk-..."
                                    className="w-full bg-[#050816] border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-slate-700"
                                />
                            </div>
                            <button 
                                onClick={handleAdd}
                                disabled={!newKey.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-900/30"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                            Active Key Pool
                        </label>
                        
                        {apiKeys.length === 0 ? (
                            <div className="bg-[#151a25] border border-dashed border-gray-800 rounded-xl p-8 text-center">
                                <p className="text-xs text-slate-500 font-medium">No keys active</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {apiKeys.map((key, index) => (
                                    <div key={index} className="flex items-center justify-between bg-[#1a1f2e] border border-gray-800 rounded-xl p-3 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <div className="font-mono text-[11px] text-slate-300">
                                                ••••{key.slice(-6)}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRemoveKey(index)}
                                            className="p-1.5 text-slate-600 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-[#050816]/50 border-t border-gray-800">
                    <a 
                        href={linkData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-blue-500/50 text-slate-400 py-3 rounded-xl text-xs font-semibold transition-all group"
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
