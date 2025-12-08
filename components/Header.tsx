
import React from 'react';
import { Plus, Sparkles, Download, FileText, Trash2, Menu } from 'lucide-react';
import { Platform } from '../types';

interface HeaderProps {
    platform: Platform;
    setPlatform: (p: Platform) => void;
    onUploadClick: () => void;
    onGenerate: () => void;
    onClear: () => void;
    onExportCsv: () => void;
    onExportReport: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    canGenerate: boolean;
    canExport: boolean;
    hasFiles: boolean;
    isProcessing: boolean;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
    platform,
    setPlatform,
    onUploadClick,
    onGenerate,
    onClear,
    onExportCsv,
    onExportReport,
    fileInputRef,
    handleFileChange,
    canGenerate,
    canExport,
    hasFiles,
    isProcessing,
    onMenuClick
}) => {
    
    const PlatformButton = ({ name, icon, isActive }: { name: Platform, icon: React.ReactNode, isActive: boolean }) => (
        <button 
            onClick={() => setPlatform(name)}
            className={`
                inline-flex items-center gap-2 px-6 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200 h-[42px] select-none whitespace-nowrap
                ${isActive 
                    ? 'bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/40' 
                    : 'bg-[#111520] border border-slate-700/30 text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                }
            `}
        >
            {icon}
            <span>{name}</span>
        </button>
    );

    // SVG Icons for platforms
    const GeneralIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    const AdobeIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
    const ShutterstockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94" /><path d="M9.69 8h11.48" /></svg>;
    const VecteezyIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="4" cy="4" r="2" /><circle cx="20" cy="4" r="2" /><circle cx="12" cy="20" r="2" /><path d="M4 6c0 6 6 12 8 12s8-6 8-12" /></svg>;
    const VectorStockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="10" y="10" width="4" height="4" /><path d="M12 10V3" /><path d="M12 21v-7" /><path d="M10 12H3" /><path d="M21 12h-7" /><circle cx="12" cy="3" r="1" /><circle cx="12" cy="21" r="1" /><circle cx="3" cy="12" r="1" /><circle cx="21" cy="12" r="1" /></svg>;

    return (
        <header className="bg-[#0b1020]/95 backdrop-blur-xl border-b border-gray-800/60 shadow-xl z-30 flex-none flex flex-col">
            {/* Top Bar */}
            <div className="w-full px-4 lg:px-8 py-4 lg:py-5 flex flex-col xl:flex-row items-center justify-between gap-4 lg:gap-6">
                
                <div className="w-full flex items-center justify-between xl:w-auto">
                    {/* Menu Button (Mobile) */}
                    <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white mr-2">
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Brand */}
                    <div className="flex items-center gap-3 lg:gap-5 group">
                        <div className="bg-blue-600 p-2 lg:p-2.5 rounded-2xl transition-all duration-300 hover:bg-blue-500 flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 flex-shrink-0">
                            <span className="font-black text-white text-lg lg:text-xl font-['Inter'] leading-none">M</span>
                        </div>
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight leading-tight">Metantor</h1>
                            <p className="text-[10px] lg:text-[11px] text-blue-400 font-bold tracking-wider uppercase mt-0.5">AI Metadata That Drives Sales</p>
                        </div>
                    </div>
                </div>

                {/* Actions - Scrollable on mobile */}
                <div className="w-full xl:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    <div className="flex items-center gap-3 min-w-max">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            multiple 
                            accept="image/jpeg, image/png" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        
                        <button 
                            onClick={onUploadClick}
                            className="flex items-center gap-2.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 transition-all active:scale-95 whitespace-nowrap border border-white/10 group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Add Images</span>
                        </button>

                        <div className="h-8 w-px bg-gray-800 mx-1 hidden sm:block"></div>

                        <button 
                            onClick={onGenerate}
                            disabled={!canGenerate || isProcessing}
                            className={`flex items-center gap-2.5 px-5 py-2.5 border text-sm font-semibold rounded-lg transition-all whitespace-nowrap shadow-sm active:scale-95
                                ${canGenerate && !isProcessing
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                                    : 'bg-[#141824] border-gray-800 text-slate-200 hover:bg-[#1e2330] disabled:opacity-40 disabled:cursor-not-allowed'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Sparkles className={`w-4 h-4 ${canGenerate ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-400'}`} />
                            )}
                            <span>{isProcessing ? 'Processing...' : 'Generate'}</span>
                        </button>

                        <button 
                            onClick={onExportCsv}
                            disabled={!canExport || isProcessing}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-[#141824] hover:bg-[#1e2330] text-slate-200 border border-gray-800 hover:border-emerald-500/50 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-emerald-900/20 hover:text-emerald-400 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>

                        <button 
                            onClick={onExportReport}
                            disabled={!canExport || isProcessing}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-[#141824] hover:bg-[#1e2330] text-slate-200 border border-gray-800 hover:border-purple-500/50 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-purple-900/20 hover:text-purple-400 active:scale-95"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Export Report</span>
                        </button>

                        <button 
                            onClick={onClear}
                            disabled={!hasFiles}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-[#141824] hover:bg-red-900/20 text-slate-400 hover:text-red-400 border border-gray-800 hover:border-red-800/50 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-red-900/10 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear List</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Platform Selector - Scrollable on mobile */}
            <div className="w-full px-4 lg:px-8 bg-[#020617]/50 border-t border-gray-800/50">
                <div className="flex flex-col lg:flex-row lg:items-center py-4 lg:py-0 gap-4 lg:gap-6 min-h-[72px]">
                    <div className="flex-shrink-0 flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none">Metadata Strategy</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                        <div className="flex items-center gap-3 min-w-max">
                            <PlatformButton name="General" icon={GeneralIcon} isActive={platform === 'General'} />
                            <PlatformButton name="Adobe Stock" icon={AdobeIcon} isActive={platform === 'Adobe Stock'} />
                            <PlatformButton name="Shutterstock" icon={ShutterstockIcon} isActive={platform === 'Shutterstock'} />
                            <PlatformButton name="Vecteezy" icon={VecteezyIcon} isActive={platform === 'Vecteezy'} />
                            <PlatformButton name="VectorStock" icon={VectorStockIcon} isActive={platform === 'VectorStock'} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
