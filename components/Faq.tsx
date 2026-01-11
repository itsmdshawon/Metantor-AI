import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, HelpCircle, MessageCircle, Zap, ShieldCheck, Globe } from 'lucide-react';

interface FaqItemProps {
    question: string;
    answer: string;
    icon: React.ElementType;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 text-left ${
                    isOpen 
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-900/20' 
                    : 'bg-[#0b1020] border-gray-800 hover:border-gray-700'
                }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-gray-800 text-slate-400 group-hover:text-blue-400'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-bold text-sm lg:text-base tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-slate-300'}`}>
                        {question}
                    </span>
                </div>
                <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 py-5 text-slate-400 text-sm leading-relaxed border-x border-b border-gray-800/40 rounded-b-2xl -mt-2 bg-[#0b1020]/30">
                    {answer}
                </div>
            </div>
        </div>
    );
};

interface FaqProps {
    onClose: () => void;
    onContactClick: () => void;
}

const Faq: React.FC<FaqProps> = ({ onClose, onContactClick }) => {
    const faqData = [
        {
            question: "What is Metantor?",
            answer: "Metantor is an AI tool made for people who sell assets online. It helps you create metadata for your work very fast. It uses smart technology to look at your images and find the best metadata so you can sell more.",
            icon: HelpCircle
        },
        {
            question: "Does it work with Adobe Stock and Shutterstock?",
            answer: "Metantor works with all big sites like Adobe Stock and Shutterstock. It also works with Vecteezy and VectorStock. You can use your metadata directly on their sites.",
            icon: Globe
        },
        {
            question: "Do I need my own API keys?",
            answer: "Yes. You must use your own keys from Google Gemini, Mistral AI or Groq Cloud. This keeps the tool fast and free for you to use. We show you exactly how to get these keys for free in our sidebar.",
            icon: Zap
        },
        {
            question: "Is there a limit to how many images I can upload?",
            answer: "No. There is no hard limit from our side. You can upload as many images as you need. The speed of the work only depends on the API key you are using.",
            icon: MessageCircle
        },
        {
            question: "Is Metantor safe to use?",
            answer: "Yes. We do not store your images or your private keys. Everything happens on your own computer and the AI service you choose. Your work stays private and safe.",
            icon: ShieldCheck
        }
    ];

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
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Common Questions</p>
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
            <div className="flex-1 overflow-y-auto p-8 lg:p-16">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-slate-400 text-sm lg:text-base max-w-xl mx-auto">
                            Everything you need to know about Metantor and how it helps in your microstock contributor journey.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqData.map((item, index) => (
                            <FaqItem key={index} {...item} />
                        ))}
                    </div>

                    <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-8 text-center space-y-4">
                        <h3 className="text-xl font-bold text-white">Still have questions?</h3>
                        <p className="text-slate-400 text-sm">
                            If you cannot find the answer here, please reach out to our support team.
                        </p>
                        <button 
                            onClick={onContactClick}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-95"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Faq;