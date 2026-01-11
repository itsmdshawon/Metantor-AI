import React from 'react';
import { Mail, ArrowLeft, Phone } from 'lucide-react';

interface ContactUsProps {
    onClose: () => void;
}

const ContactUs: React.FC<ContactUsProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#050816] flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex-none px-8 py-6 border-b border-gray-800/60 flex items-center justify-between bg-[#0b1020]/30">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <span className="font-black text-white text-sm">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">Metantor</h1>
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Support Hub</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-slate-200 text-sm font-bold rounded-xl transition-all active:scale-95 border border-gray-700 hover:border-blue-500/30"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tool
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-16 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black text-white tracking-tight">Contact Us</h2>
                            <div className="h-1 bg-blue-600 w-20 mx-auto rounded-full"></div>
                        </div>
                        
                        <p className="text-slate-300 leading-relaxed text-center max-w-2xl mx-auto text-lg font-medium">
                            At Metantor, we value open communication. Whether you have Privacy Questions, ideas for any update to make, business inquiries, or need any assistance, we are here to listen and help.
                        </p>

                        <div className="bg-[#0b1020] border border-gray-800 rounded-[2.5rem] p-12 flex flex-col items-center text-center space-y-10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-600/10 transition-colors duration-700"></div>

                            <div className="w-full relative z-10">
                                <p className="text-slate-200 font-bold text-base md:text-lg">Our support team aims to respond to all calls and messages within 24-48 hours</p>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-3xl relative z-10">
                                <a href="mailto:its.mdshawon@gmail.com" className="flex-1 flex flex-col items-center gap-6 p-10 bg-[#151a25] rounded-3xl border border-gray-800 hover:border-blue-500/50 hover:bg-[#1a2130] transition-all group min-w-0 shadow-xl hover:-translate-y-1">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                                        <Mail className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em]">EMAIL SUPPORT</span>
                                        <span className="text-blue-400 font-bold text-lg whitespace-nowrap overflow-hidden text-ellipsis w-full block">its.mdshawon@gmail.com</span>
                                    </div>
                                </a>
                                
                                <a href="https://wa.me/8801881447666" target="_blank" className="flex-1 flex flex-col items-center gap-6 p-10 bg-[#151a25] rounded-3xl border border-gray-800 hover:border-emerald-500/50 hover:bg-[#1a2b25] transition-all group min-w-0 shadow-xl hover:-translate-y-1">
                                    <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                                        <Phone className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em]">WHATSAPP SUPPORT</span>
                                        <span className="text-emerald-400 font-bold text-lg whitespace-nowrap block">+880 1881-447666</span>
                                    </div>
                                </a>
                            </div>

                            <div className="pt-8 border-t border-gray-800/50 w-full relative z-10">
                                <a 
                                    href="https://www.behance.net/itsmdshawon" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-600 uppercase tracking-[0.4em] font-black hover:text-blue-500 transition-colors cursor-pointer decoration-transparent block"
                                >
                                    DEVELOPED BY MD. SHAWON
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;