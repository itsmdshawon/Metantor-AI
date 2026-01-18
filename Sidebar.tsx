import React, { useState, useEffect } from 'react';
import { Settings2, ChevronDown, X, Bot, Cpu, Sparkles, FileJson, Save, SlidersHorizontal, Key, Filter, ChevronLeftSquare, ChevronRightSquare, Ban, Tags, Check } from 'lucide-react';
import { AppConfig, AiProvider } from './types';
import { AI_PROVIDERS } from './constants';

interface ContentFilterItemProps {
    label: string;
    icon: any;
    activeKey: keyof AppConfig;
    textKey: keyof AppConfig;
    placeholder: string;
    config: AppConfig;
    onChange: (key: keyof AppConfig, value: any) => void;
}

const ContentFilterItem: React.FC<ContentFilterItemProps> = ({ 
    label, 
    icon: Icon, 
    activeKey, 
    textKey, 
    placeholder,
    config,
    onChange
}) => {
    const isActive = config[activeKey] as boolean;
    const [localValue, setLocalValue] = useState(config[textKey] as string);

    useEffect(() => {
        if (config[textKey] !== localValue) {
            setLocalValue(config[textKey] as string);
        }
    }, [config[textKey]]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        onChange(textKey, val);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-slate-600'}`} />
                    {label}
                </label>
                <button 
                    onClick={() => onChange(activeKey, !isActive)}
                    className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${isActive ? 'bg-blue-600' : 'bg-gray-800'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${isActive ? 'left-4.5' : 'left-0.5'}`} />
                </button>
            </div>
            <input 
                type="text"
                disabled={!isActive}
                value={localValue}
                onChange={handleTextChange}
                placeholder={placeholder}
                className={`w-full bg-[#151a25] border rounded-xl px-3 py-2.5 text-xs transition-all focus:outline-none ${
                    isActive 
                    ? 'border-gray-700 text-slate-200 focus:border-blue-500/50' 
                    : 'border-gray-800/40 text-slate-600 placeholder-slate-800 cursor-not-allowed'
                }`}
            />
        </div>
    );
};

interface SidebarProps {
    config: AppConfig;
    setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
    isOpen: boolean;
    onClose: () => void;
    onSaveSettings: () => void;
    apiKeysCount: number;
    onOpenApiKeys: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    config, 
    setConfig, 
    isOpen, 
    onClose, 
    onSaveSettings,
    apiKeysCount,
    onOpenApiKeys
}) => {
    const [saved, setSaved] = useState(false);

    const handleChange = (key: keyof AppConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleProviderChange = (provider: AiProvider) => {
        const defaultModel = AI_PROVIDERS[provider][0].id;
        setConfig(prev => ({ ...prev, provider, model: defaultModel }));
    };

    const handleSaveClick = () => {
        onSaveSettings();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const renderModelOptions = () => {
        const models = AI_PROVIDERS[config.provider];
        return models.map(m => (
            <option key={m.id} value={m.id} className="bg-[#151a25] text-slate-200">{m.name}</option>
        ));
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-[#0b1020] border-r border-gray-800 flex flex-col h-full transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 overflow-y-auto custom-scrollbar
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                
                <div className="flex items-center justify-between p-6 lg:hidden border-b border-gray-800">
                    <span className="text-sm font-bold text-white uppercase tracking-widest">Settings</span>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 border-b border-gray-800">
                    <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Settings2 className="w-4 h-4 text-blue-500" />
                        Configuration
                    </h2>
                </div>

                <div className="p-7 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2.5">
                             <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <Bot className="w-3.5 h-3.5" />
                                AI Provider
                            </label>
                            <div className="relative group">
                                <select 
                                    value={config.provider}
                                    onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
                                    className="w-full bg-[#151a25] border border-gray-800 hover:border-gray-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer transition-colors shadow-sm font-medium"
                                >
                                    {Object.keys(AI_PROVIDERS).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-blue-400 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                             <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <Cpu className="w-3.5 h-3.5" />
                                Select {config.provider} Model
                            </label>
                            <div className="relative group">
                                <select 
                                    value={config.model}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    className="w-full bg-[#151a25] border border-gray-800 hover:border-gray-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer transition-colors shadow-sm font-medium"
                                >
                                    {renderModelOptions()}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-blue-400 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <Key className="w-3.5 h-3.5 text-blue-500" />
                                {config.provider} Key Pool
                            </label>
                            <button 
                                onClick={onOpenApiKeys}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#151a25] border border-gray-800 hover:border-gray-700 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${apiKeysCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`}></div>
                                    <span className="text-xs font-bold text-slate-300">
                                        {apiKeysCount} Keys
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Manage</span>
                            </button>
                        </div>

                        <div className="space-y-2.5">
                             <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <FileJson className="w-3.5 h-3.5" />
                                Change File Extension
                            </label>
                            <div className="relative group">
                                <select 
                                    value={config.extensionMode}
                                    onChange={(e) => handleChange('extensionMode', e.target.value)}
                                    className="w-full bg-[#151a25] border border-gray-800 hover:border-gray-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer transition-colors shadow-sm font-medium"
                                >
                                    <option value="default">Default</option>
                                    <option value="jpg">Jpg</option>
                                    <option value="jpeg">Jpeg</option>
                                    <option value="png">Png</option>
                                    <option value="svg">Svg</option>
                                    <option value="eps">Eps</option>
                                    <option value="ai">Ai</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-blue-400 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-800/50 w-full"></div>

                    <div className="space-y-6 px-1">
                        <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                            Metadata Controls
                        </label>
                        
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Title Length</label>
                                <div className="flex items-center gap-4 bg-[#151a25] p-2.5 rounded-xl border border-gray-800/40 group focus-within:border-blue-500/30 transition-colors shadow-sm">
                                    <div className="flex-1 px-1">
                                        <input 
                                            type="range" min="5" max="30" step="1" 
                                            value={config.titleLen}
                                            onChange={(e) => handleChange('titleLen', parseInt(e.target.value))}
                                            className="w-full accent-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="w-[110px] h-8 bg-slate-900/60 border border-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="font-mono text-[11px] font-bold text-blue-400">
                                            {config.titleLen}w • {config.titleLen * 7}c
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Description Length</label>
                                <div className="flex items-center gap-4 bg-[#151a25] p-2.5 rounded-xl border border-gray-800/40 group focus-within:border-blue-500/30 transition-colors shadow-sm">
                                    <div className="flex-1 px-1">
                                        <input 
                                            type="range" min="10" max="60" step="1" 
                                            value={config.descLen}
                                            onChange={(e) => handleChange('descLen', parseInt(e.target.value))}
                                            className="w-full accent-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="w-[110px] h-8 bg-slate-900/60 border border-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="font-mono text-[11px] font-bold text-blue-400">
                                            {config.descLen}w • {config.descLen * 7}c
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 tracking-widest px-1">Keywords</label>
                                <div className="flex items-center gap-4 bg-[#151a25] p-2.5 rounded-xl border border-gray-800/40 group focus-within:border-blue-500/30 transition-colors shadow-sm">
                                    <div className="flex-1 px-1">
                                        <input 
                                            type="range" min="3" max="50" step="1" 
                                            value={config.kwCount}
                                            onChange={(e) => handleChange('kwCount', parseInt(e.target.value))}
                                            className="w-full accent-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="w-[110px] h-8 bg-slate-900/60 border border-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="font-mono text-[11px] font-bold text-blue-400">
                                            {config.kwCount} Keywords
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-800/50 w-full"></div>

                    {/* Custom Prompt Section - Restored */}
                    <div className="space-y-4 px-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                Custom Instructions
                            </label>
                            <button 
                                onClick={() => handleChange('useCustomPrompt', !config.useCustomPrompt)}
                                className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${config.useCustomPrompt ? 'bg-blue-600' : 'bg-gray-800'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${config.useCustomPrompt ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        
                        {config.useCustomPrompt && (
                            <div className="animate-fadeIn">
                                <textarea 
                                    value={config.customPrompt}
                                    onChange={(e) => handleChange('customPrompt', e.target.value)}
                                    placeholder="e.g. Focus on moody lighting, mention a smiling person, or use formal language..."
                                    className="w-full bg-[#151a25] border border-gray-700 rounded-xl px-3 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 min-h-[100px] resize-none custom-scrollbar shadow-inner"
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-800/50 w-full"></div>

                    <div className="space-y-6 px-1">
                        <label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                            <Filter className="w-3.5 h-3.5 text-blue-500" />
                            Content Filters
                        </label>
                        
                        <div className="space-y-5">
                            <ContentFilterItem 
                                label="Text before title" 
                                icon={ChevronLeftSquare} 
                                activeKey="prefixActive" 
                                textKey="prefixText" 
                                placeholder="Prefix..." 
                                config={config}
                                onChange={handleChange}
                            />
                            <ContentFilterItem 
                                label="Text after title" 
                                icon={ChevronRightSquare} 
                                activeKey="suffixActive" 
                                textKey="suffixText" 
                                placeholder="Suffix..." 
                                config={config}
                                onChange={handleChange}
                            />
                            <ContentFilterItem 
                                label="Negative Title Words" 
                                icon={Ban} 
                                activeKey="negativeTitleActive" 
                                textKey="negativeTitleWords" 
                                placeholder="cat, dog..." 
                                config={config}
                                onChange={handleChange}
                            />
                            <ContentFilterItem 
                                label="Negative Keywords" 
                                icon={Tags} 
                                activeKey="negativeKeywordsActive" 
                                textKey="negativeKeywordsWords" 
                                placeholder="white, background..." 
                                config={config}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="pt-4 pb-10">
                        <button 
                            onClick={handleSaveClick}
                            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 border border-white/10 group ${
                                saved 
                                ? 'bg-emerald-600 text-white shadow-emerald-900/30' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                            }`}
                        >
                            {saved ? (
                                <><Check className="w-4 h-4" /><span>Saved!</span></>
                            ) : (
                                <><Save className="w-4 h-4 group-hover:scale-110" /><span>Save All Settings</span></>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;