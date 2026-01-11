import React from 'react';
import { X, Youtube, Facebook, MessageCircle } from 'lucide-react';

interface CommunityHubProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const items = [
        {
            label: "Join Our Microstock Free Support Group",
            subLabel: "WhatsApp number +88 01881-447666",
            link: "https://chat.whatsapp.com/IVGlwnekD2CI5vj5E0n8WR",
            icon: MessageCircle,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            hoverBorder: "hover:border-emerald-500/50"
        },
        {
            label: "Subscribe To My Channel",
            link: "https://www.youtube.com/@MasterWithShawon",
            icon: Youtube,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            hoverBorder: "hover:border-red-500/50"
        },
        {
            label: "Join Our Group",
            link: "https://www.facebook.com/groups/masterwithshawon",
            icon: Facebook,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            hoverBorder: "hover:border-blue-500/50"
        },
        {
            label: "Follow Me",
            link: "https://www.facebook.com/itsmdshawon/",
            icon: Facebook,
            color: "text-blue-400",
            bgColor: "bg-blue-400/10",
            hoverBorder: "hover:border-blue-400/50"
        }
    ];

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#0b1020] border border-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                                <span className="font-black text-white text-lg">M</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Community Hub</h3>
                                <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase mt-0.5">Support and Access</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group flex items-center gap-4 p-5 bg-[#151a25] border border-gray-800 rounded-3xl transition-all shadow-xl ${item.hoverBorder} cursor-pointer block no-underline`}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div className={`p-4 ${item.bgColor} rounded-2xl ${item.color} transition-all duration-300 group-hover:scale-110 shadow-lg shrink-0`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-200 tracking-tight leading-tight">{item.label}</span>
                                        {item.subLabel && (
                                            <span className="text-[11px] font-medium text-slate-500 mt-1">{item.subLabel}</span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityHub;