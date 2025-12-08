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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0b1020] border border-gray-700/50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform scale-100 transition-transform duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2 ring-1 ring-emerald-500/20">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">Metadata Optimization Complete</h3>
                    <p className="text-slate-400 text-sm leading-relaxed px-4">
                        Your assets have been analyzed and tagged for maximum discoverability. <br />
                        The dataset is ready for export.
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full pt-4">
                        <button 
                            onClick={onDownloadCsv} 
                            className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 transition-all active:scale-95 border border-white/10"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download CSV</span>
                        </button>
                        
                        <button 
                            onClick={onDownloadReport}
                            className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 bg-[#141824] hover:bg-[#1e2330] text-purple-400 border border-purple-900/30 hover:border-purple-500/50 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Download Report</span>
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="text-xs text-slate-500 hover:text-slate-300 mt-4 underline underline-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;