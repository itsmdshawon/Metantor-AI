import React from 'react';
import { Check, Download, FileText } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadCsv: () => void;
    onDownloadReport: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onDownloadCsv, onDownloadReport }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-[#0b1020] border border-gray-800/80 rounded-[3rem] shadow-[0_0_120px_rgba(0,0,0,0.9)] p-14 max-w-[480px] w-full mx-4 transform transition-all duration-300 relative border-white/5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                    {/* Centered Large Circle Check Icon as in Screenshot */}
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 ring-4 ring-emerald-500/10 shadow-3xl shadow-emerald-900/40">
                        <Check className="w-12 h-12 text-emerald-500 stroke-[3]" />
                    </div>
                    
                    <h3 className="text-3xl font-black text-white tracking-tight mb-14">Download Your Files</h3>
                    
                    <div className="flex flex-col gap-5 w-full">
                        {/* Primary Download Button: Export CSV */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDownloadCsv(); }} 
                            className="flex items-center justify-center gap-4 w-full px-8 py-5.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-900/50 transition-all active:scale-95 border border-white/10 group h-16"
                        >
                            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                            <span>Export CSV</span>
                        </button>
                        
                        {/* Secondary Download Button: Export Report */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDownloadReport(); }}
                            className="flex items-center justify-center gap-4 w-full px-8 py-5.5 bg-[#141824] hover:bg-[#1c2235] text-slate-300 border border-gray-800/60 hover:border-blue-500/40 text-[13px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 group shadow-xl h-16"
                        >
                            <FileText className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span>Export Report</span>
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="mt-12 text-[11px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-[0.5em] transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;