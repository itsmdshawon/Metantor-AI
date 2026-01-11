import React from 'react';
import { Plus, Sparkles, Download, Trash2, Menu, RefreshCw, Users, FileText, Key } from 'lucide-react';
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
    onOpenCommunity: () => void;
    isResume?: boolean;
    isGemini: boolean;
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
    onMenuClick,
    onOpenCommunity,
    isResume,
    isGemini
}) => {
    
    const PlatformButton = ({ name, icon, isActive }: { name: Platform, icon: React.ReactNode, isActive: boolean }) => (
        <button 
            onClick={() => setPlatform(name)}
            className={`
                flex items-center justify-center gap-2 px-6 rounded-full text-[13px] font-bold cursor-pointer transition-all duration-200 h-[40px] select-none whitespace-nowrap border
                ${isActive 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40' 
                    : 'bg-[#111520] border-slate-700/30 text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                }
            `}
        >
            <span className="flex items-center justify-center shrink-0">
                {icon}
            </span>
            <span className="leading-none mt-[1px]">{name}</span>
        </button>
    );

    const iconStyle = "w-4 h-4";
    const GeneralIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={iconStyle}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    const AdobeIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={iconStyle}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
    const ShutterstockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={iconStyle}><circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94" /><path d="M9.69 8h11.48" /></svg>;
    const VecteezyIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={iconStyle}><circle cx="4" cy="4" r="2" /><circle cx="20" cy="4" r="2" /><circle cx="12" cy="20" r="2" /><path d="M4 6c0 6 6 12 8 12s8-6 8-12" /></svg>;
    const VectorStockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={iconStyle}><rect x="10" y="10" width="4" height="4" /><path d="M12 10V3" /><path d="M12 21v-7" /><path d="M10 12H3" /><path d="M21 12h-7" /><circle cx="12" cy="3" r="1" /><circle cx="12" cy="21" r="1" /><circle cx="3" cy="12" r="1" /><circle cx="21" cy="12" r="1" /></svg>;

    return (
        <header className="bg-[#0b1020] border-b border-gray-800/60 shadow-xl z-30 flex-none flex flex-col">
            <div className="w-full px-6 py-5 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white -ml-2">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-2xl flex items-center justify-center w-11 h-11 flex-shrink-0 shadow-lg shadow-blue-900/30">
                            <span className="font-black text-white text-xl leading-none">M</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-white tracking-tight leading-none">Metantor</h1>
                            <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase mt-1 leading-none">AI Metadata That Drives Sales</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} multiple accept="image/jpeg, image/png" className="hidden" onChange={handleFileChange} />
                    <button 
                        onClick={onOpenCommunity} 
                        className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[#141824] hover:bg-[#1e2330] text-blue-400 border border-blue-900/30 hover:border-blue-500/50 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Users className="w-4 h-4" />
                        <span className="leading-none">Community Hub</span>
                    </button>
                    <button onClick={onUploadClick} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 border border-white/10 group whitespace-nowrap">
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        <span className="leading-none">Add Images</span>
                    </button>
                    <button onClick={onGenerate} disabled={!canGenerate || isProcessing} className={`flex items-center gap-2 px-5 py-2.5 border text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${isResume && !isProcessing ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/20 shadow-lg shadow-amber-900/20' : canGenerate && !isProcessing ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-lg shadow-blue-900/20' : 'bg-[#141824] border-gray-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : isResume ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        <span className="leading-none">{isProcessing ? 'Processing...' : isResume ? 'Re-Generate' : 'Generate'}</span>
                    </button>
                    
                    {/* Export controls appear only when everything is completed and not currently processing */}
                    {canExport && !isProcessing && (
                        <div className="hidden md:flex items-center gap-3 animate-fadeIn">
                            <button onClick={onExportCsv} className="flex items-center gap-2 px-5 py-2.5 bg-[#141824] hover:bg-[#1e2330] text-slate-200 border border-gray-800 hover:border-emerald-500/50 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap">
                                <Download className="w-4 h-4" />
                                <span className="leading-none">Export CSV</span>
                            </button>
                            <button onClick={onExportReport} className="flex items-center gap-2 px-5 py-2.5 bg-[#141824] hover:bg-[#1e2330] text-purple-400 border border-gray-800 hover:border-purple-500/50 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap">
                                <FileText className="w-4 h-4" />
                                <span className="leading-none">Export Report</span>
                            </button>
                        </div>
                    )}

                    <button onClick={onClear} disabled={!hasFiles} className="flex items-center gap-2 px-5 py-2.5 bg-[#141824] hover:bg-red-900/20 text-slate-400 hover:text-red-400 border border-gray-800 hover:border-red-800/50 rounded-xl transition-all disabled:opacity-40 active:scale-95 whitespace-nowrap text-xs font-bold">
                        <Trash2 className="w-4 h-4" />
                        <span className="leading-none">Clear Data</span>
                    </button>
                </div>
            </div>

            <div className="w-full px-8 py-3 bg-[#020617] border-t border-gray-800/50 flex items-center gap-8 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Metadata Strategy</span>
                </div>
                <div className="flex items-center gap-4 min-w-max">
                    <PlatformButton name="General" icon={GeneralIcon} isActive={platform === 'General'} />
                    <PlatformButton name="Adobe Stock" icon={AdobeIcon} isActive={platform === 'Adobe Stock'} />
                    <PlatformButton name="Shutterstock" icon={ShutterstockIcon} isActive={platform === 'Shutterstock'} />
                    <PlatformButton name="Vecteezy" icon={VecteezyIcon} isActive={platform === 'Vecteezy'} />
                    <PlatformButton name="VectorStock" icon={VectorStockIcon} isActive={platform === 'VectorStock'} />
                </div>
            </div>
        </header>
    );
};

export default Header;