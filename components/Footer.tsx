import React from 'react';

interface FooterProps {
    onOpenPrivacy: () => void;
    onOpenContact: () => void;
    onOpenTerms: () => void;
    onOpenFaq: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenContact, onOpenTerms, onOpenFaq }) => {
    return (
        <footer className="bg-[#050816] border-t border-gray-800/40 py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-medium text-slate-500 tracking-wider w-full flex-none relative z-50">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <span className="text-center md:text-left">© Copyright 2026 Metantor. All Rights Reserved</span>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
                    <button 
                        type="button"
                        onClick={onOpenPrivacy}
                        className="text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        Privacy Policy
                    </button>
                    <button 
                        type="button"
                        onClick={onOpenTerms}
                        className="text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        Terms and Conditions
                    </button>
                    <button 
                        type="button"
                        onClick={onOpenFaq}
                        className="text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        FAQ
                    </button>
                    <button 
                        type="button"
                        onClick={onOpenContact}
                        className="text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        Contact Us
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-slate-600">Developed by</span>
                <a 
                    href="https://www.behance.net/itsmdshawon" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 font-bold hover:text-blue-400 transition-colors cursor-pointer decoration-transparent"
                >
                    Md. Shawon
                </a>
            </div>
        </footer>
    );
};

export default Footer;