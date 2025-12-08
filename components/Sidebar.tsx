
import React from 'react';
import { Settings2, UserCircle2, ChevronDown, LogOut, Shield, Key, X } from 'lucide-react';
import { AppConfig } from '../types';

interface SidebarProps {
    config: AppConfig;
    setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
    isAdmin: boolean;
    onLogout: () => void;
    onOpenAdmin: () => void;
    apiKeysCount: number;
    onOpenApiKeys: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    config, 
    setConfig, 
    isAdmin, 
    onLogout, 
    onOpenAdmin,
    apiKeysCount,
    onOpenApiKeys,
    isOpen,
    onClose
}) => {

    const handleChange = (key: keyof AppConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container - Added overflow-y-auto to main container for unified scrolling */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-[#0b1020] border-r border-gray-800 flex flex-col h-full transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 overflow-y-auto custom-scrollbar
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-800">
                    <span className="text-sm font-bold text-white">Menu</span>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* TOP SECTION: Admin Button */}
                {isAdmin && (
                    <div className="p-4 pb-0 pt-6">
                        <button 
                            onClick={onOpenAdmin}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            ADMIN DASHBOARD
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Settings2 className="w-4 h-4 text-blue-500" />
                            Configuration
                        </h2>
                    </div>
                </div>

                {/* CONFIGURATION INPUTS - Removed overflow/flex-1 to remove inner scrollbar */}
                <div className="p-6 space-y-9">
                    
                    {/* API KEYS BUTTON */}
                    <div className="bg-[#151a25] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">API Keys</span>
                            </div>
                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                {apiKeysCount} Active
                            </span>
                        </div>
                        <button 
                            onClick={onOpenApiKeys}
                            className="w-full flex items-center justify-center gap-2 bg-[#1e2330] hover:bg-[#252b3b] text-slate-300 text-xs font-semibold py-2.5 rounded-lg border border-gray-700 transition-all"
                        >
                            Manage Keys
                        </button>
                    </div>

                    {/* Title Settings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">Title Length</label>
                            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                {config.titleLen} w / {Math.round(config.titleLen * 7)} c
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="5" max="25" step="1" 
                            value={config.titleLen}
                            onChange={(e) => handleChange('titleLen', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Description Settings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">Description Length</label>
                            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                {config.descLen} w / {Math.round(config.descLen * 7)} c
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="10" max="60" step="1" 
                            value={config.descLen}
                            onChange={(e) => handleChange('descLen', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Keyword Settings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">Keywords</label>
                            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                {config.kwCount} tags
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="3" max="50" step="1" 
                            value={config.kwCount}
                            onChange={(e) => handleChange('kwCount', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Custom Prompt Settings */}
                    <div className="space-y-3">
                         <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            Custom Prompt
                        </label>
                        
                        <div className="relative group">
                            <select 
                                value={config.useCustomPrompt ? 'custom' : 'default'}
                                onChange={(e) => handleChange('useCustomPrompt', e.target.value === 'custom')}
                                className="w-full bg-[#0f1320] border border-gray-800 hover:border-gray-700 text-slate-300 text-xs rounded-xl px-3 py-3 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer transition-colors shadow-sm"
                            >
                                <option value="default">Default (Recommended)</option>
                                <option value="custom">Set Custom Prompt</option>
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500 group-hover:text-slate-400 transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        {config.useCustomPrompt && (
                            <div className="animate-fadeIn">
                                <textarea 
                                    value={config.customPrompt}
                                    onChange={(e) => handleChange('customPrompt', e.target.value)}
                                    placeholder="Enter your custom prompt here..." 
                                    className="w-full h-24 bg-[#0f1320] border border-gray-800 rounded-xl p-3 text-[11px] leading-relaxed text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all shadow-inner"
                                />
                            </div>
                        )}
                    </div>

                    {/* File Extension Settings */}
                    <div className="space-y-3">
                         <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            Change File Extension
                        </label>
                        
                        <div className="relative group">
                            <select 
                                value={config.extensionMode}
                                onChange={(e) => handleChange('extensionMode', e.target.value)}
                                className="w-full bg-[#0f1320] border border-gray-800 hover:border-gray-700 text-slate-300 text-xs rounded-xl px-3 py-3 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer transition-colors shadow-sm"
                            >
                                <option value="default">Default</option>
                                <option value="jpg">jpg</option>
                                <option value="jpeg">jpeg</option>
                                <option value="png">png</option>
                                <option value="svg">svg</option>
                                <option value="eps">eps</option>
                                <option value="ai">ai</option>
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500 group-hover:text-slate-400 transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER SECTION: Pushed to bottom using margin-top: auto */}
                <div className="mt-auto p-4 border-t border-gray-800 bg-[#0b1020]">
                    {/* Info Box */}
                    <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 mb-4">
                        <div className="flex gap-3">
                            <UserCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1.5">
                                <p className="text-xs text-blue-200 font-semibold">Developed by Md. Shawon</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Brand Designer & Contributor on major platforms like Adobe Stock, Shutterstock, Vecteezy, VectorStock and more. This tool was built from real daily experience to streamline the contributor workflow.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* LOGOUT BUTTON */}
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-900/30 text-red-400 hover:bg-red-950/30 hover:border-red-900/50 transition-all text-xs font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
