import React, { useState } from 'react';
import { Info, ShieldCheck, Share2, ListChecks, ArrowLeft, X, CheckCircle } from 'lucide-react';

export type PrivacySection = 'intro' | 'info' | 'third-party' | 'summary' | 'conclusion';

interface PrivacyPolicyProps {
    onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState<PrivacySection>('intro');

    const menuItems = [
        { id: 'intro', label: 'Introduction', icon: Info },
        { id: 'info', label: 'How Data is Handled', icon: ShieldCheck },
        { id: 'third-party', label: 'Third Party Services', icon: Share2 },
        { id: 'summary', label: "What We Don't Do", icon: ListChecks },
        { id: 'conclusion', label: "Our Commitment", icon: CheckCircle },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'intro':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Introduction</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            We value your trust. This guide explains how Metantor handles your data in a simple and honest way. Our goal is to provide a powerful tool while keeping your private details safe.
                        </p>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 text-slate-300">
                            Metantor is built to be a safe space for your creative work. We do not track you or keep your files. This page will show you exactly how we work with the information you provide.
                        </div>
                    </div>
                );
            case 'info':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">How Data is Handled</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300">
                            Metantor does not store or see your personal files on our own servers. To work correctly, the app uses two types of data that stay under your control.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#0b1020] border border-gray-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="text-blue-500">1</span> API Keys
                                </h3>
                                <p className="text-xs text-slate-500 uppercase font-bold">API Key Access</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-bold text-blue-400 mb-1">Usage</p>
                                        <p className="text-sm text-slate-400">API Keys are only used to ask the AI providers for results on your behalf.</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-blue-400 mb-1">Storage</p>
                                        <p className="text-sm text-slate-400">Your API Keys stay on your own computer. We never send them to our own database.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0b1020] border border-gray-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="text-blue-500">2</span> Image Data
                                </h3>
                                <p className="text-xs text-slate-500 uppercase font-bold">Image Use</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-bold text-blue-400 mb-1">Usage</p>
                                        <p className="text-sm text-slate-400">Images are used to make your metadata. They are sent directly to the AI service you choose.</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-blue-400 mb-1">Storage</p>
                                        <p className="text-sm text-slate-400">We do not save your images. They are deleted from memory as soon as the task is finished.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'third-party':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Third Party Services</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            Metantor works as a bridge to other AI companies. These services help us generate your metadata.
                        </p>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-8 space-y-4">
                            <h3 className="text-xl font-bold text-blue-400">AI Providers</h3>
                            <p className="text-slate-300 leading-relaxed">
                                We connect you with Google, Groq, and Mistral. When you use their models, your data is handled by their own rules. We suggest you read their privacy pages to know how they work.
                            </p>
                            <div className="flex flex-wrap gap-6 pt-4">
                                <a href="https://ai.google.dev/gemini-api/terms" target="_blank" className="text-xs font-bold text-blue-500 hover:underline transition-all">Google</a>
                                <a href="https://groq.com/privacy-policy/" target="_blank" className="text-xs font-bold text-blue-500 hover:underline transition-all">Groq</a>
                                <a href="https://legal.mistral.ai/terms/privacy-policy?language=en-US" target="_blank" className="text-xs font-bold text-blue-500 hover:underline transition-all">Mistral</a>
                            </div>
                        </div>
                    </div>
                );
            case 'summary':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">What We Don't Do</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300">
                            Our priority is to keep things simple. Here is a short list of things we will never do with your data.
                        </p>
                        <div className="space-y-4">
                            {[
                                "We do not collect your API Keys",
                                "We do not save your images",
                                "We do not keep the metadata you generate",
                                "We do not track your history"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-6 group hover:bg-red-500/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <X className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="text-slate-200 font-bold text-base">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'conclusion':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-3xl font-bold text-blue-400">Our Commitment</h2>
                        <div className="h-px bg-gray-800 w-full"></div>
                        <p className="text-slate-300 leading-relaxed">
                            This policy is our promise to you. Metantor is more than just a tool, it is a partner for your creative journey. We built this platform with the belief that you should have full power over your work and your data.
                        </p>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 space-y-6">
                            <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Final Summary
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                    <p className="text-slate-300 text-sm">You own everything you create. We never take rights to your work.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                    <p className="text-slate-300 text-sm">Your privacy is built into the tool. It is not an extra feature.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                    <p className="text-slate-300 text-sm">We stay honest and open about how your data moves.</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-400 text-center font-medium pt-4">
                            Thank you for choosing Metantor as your trusted partner
                        </p>
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
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Privacy Center</p>
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
                                onClick={() => setActiveSection(item.id as PrivacySection)}
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
                    <div className="max-w-3xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;