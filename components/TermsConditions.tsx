import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Shield, Zap, Info, Mail, Phone, Clock } from 'lucide-react';

type TermsSection = 'welcome' | 'usage' | 'data' | 'plans' | 'rules';

interface TermsConditionsProps {
    onClose: () => void;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState<TermsSection>('welcome');

    const menuItems = [
        { id: 'welcome', label: 'Welcome', icon: BookOpen },
        { id: 'usage', label: 'How to Use', icon: Zap },
        { id: 'data', label: 'Data and Rights', icon: Shield },
        { id: 'plans', label: 'Future Plans', icon: Clock },
        { id: 'rules', label: 'Simple Rules', icon: Info },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'welcome':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Welcome to Metantor</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            These terms are our simple agreement with you. By using Metantor you agree to follow these basic steps. This helps keep our tool safe for everyone.
                        </p>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 text-slate-300">
                            We want to make AI tools easy for everyone to use. Our goal is to help you build better metadata for your work.
                        </div>
                    </div>
                );
            case 'usage':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">How to Use</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            Metantor is a tool for making metadata for your images. It helps people who sell assets online. All creators can use it for their work.
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-[#0b1020] border border-gray-800 rounded-xl p-5">
                                <p className="text-sm text-slate-400">You must use your own API keys. Keep your keys private and safe at all times.</p>
                            </div>
                            <div className="bg-[#0b1020] border border-gray-800 rounded-xl p-5">
                                <p className="text-sm text-slate-400">This tool generates high quality metadata for your assets. You have the final control over all the results. This ensures the output is exactly what you need for your work.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Data and Rights</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            You own everything you create. We do not take any rights to your works. You own the metadata you make.
                        </p>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                            <p className="text-slate-300 text-sm">We do not store your images on our servers.</p>
                            <p className="text-slate-300 text-sm">You are free to use the metadata for your own works.</p>
                        </div>
                    </div>
                );
            case 'plans':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Future Plans</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            Metantor has no paid plans right now. You can use all current features with your own keys.
                        </p>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                            <p className="text-slate-300 text-sm italic">
                                We might add paid plans in the future. We can update these terms at any time.
                            </p>
                        </div>
                    </div>
                );
            case 'rules':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Simple Rules</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-red-500/5 border-l-4 border-red-500/40 p-5 rounded-r-xl border-y border-r border-gray-800/20">
                                <span className="text-slate-300 text-sm font-medium">Do not use Metantor to harm people or businesses.</span>
                            </div>
                            <div className="flex items-center gap-4 bg-red-500/5 border-l-4 border-red-500/40 p-5 rounded-r-xl border-y border-r border-gray-800/20">
                                <span className="text-slate-300 text-sm font-medium">Do not use our tool to create illegal content.</span>
                            </div>
                            <div className="flex items-center gap-4 bg-red-500/5 border-l-4 border-red-500/40 p-5 rounded-r-xl border-y border-r border-gray-800/20">
                                <span className="text-slate-300 text-sm font-medium">You are responsible for your own actions. If you break laws, the consequences are yours to handle.</span>
                            </div>
                            <div className="flex items-center gap-4 bg-red-500/5 border-l-4 border-red-500/40 p-5 rounded-r-xl border-y border-r border-gray-800/20">
                                <span className="text-slate-300 text-sm font-medium">Metantor is not responsible for how you use the tool.</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050816] flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex-none px-8 py-6 border-b border-gray-800/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <span className="font-black text-white text-sm">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">Metantor</h1>
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Terms and Conditions</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-slate-200 text-sm font-bold rounded-xl transition-all active:scale-95 border border-gray-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tool
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Navigation Sidebar */}
                <div className="w-80 border-r border-gray-800/60 bg-[#0b1020]/30 overflow-y-auto hidden md:block">
                    <nav className="p-6 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as TermsSection)}
                                className={`w-full flex items-center text-left gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
                                    activeSection === item.id 
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 shrink-0 ${activeSection === item.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                <span className="leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-16">
                    <div className="max-w-3xl mx-auto flex flex-col min-h-full">
                        <div className="flex-1">
                            {renderContent()}
                        </div>
                        
                        {/* Modern Contact Info Section */}
                        <div className="mt-16 pt-12 border-t border-gray-800">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 text-center">Get in Touch</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <a 
                                    href="mailto:its.mdshawon@gmail.com"
                                    className="bg-[#0b1020] border border-gray-800 p-6 rounded-2xl flex items-center gap-4 group hover:border-blue-500/50 hover:bg-blue-500/5 transition-all active:scale-[0.98]"
                                >
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Email</p>
                                        <p className="text-sm text-slate-200 font-bold group-hover:text-blue-400 transition-colors">its.mdshawon@gmail.com</p>
                                    </div>
                                </a>
                                <a 
                                    href="https://wa.me/8801881447666"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#0b1020] border border-gray-800 p-6 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-[0.98]"
                                >
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase">WhatsApp</p>
                                        <p className="text-sm text-slate-200 font-bold group-hover:text-emerald-400 transition-colors">+880 1881-447666</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;