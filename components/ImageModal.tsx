import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
    url: string | null;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="relative max-w-5xl max-h-[90vh] p-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <button 
                    className="absolute -top-12 right-4 text-slate-400 hover:text-white transition-colors"
                    onClick={onClose}
                >
                    <X className="w-8 h-8" />
                </button>
                <img 
                    src={url} 
                    className="max-w-full max-h-[85vh] rounded-lg shadow-2xl ring-1 ring-white/10 object-contain mx-auto" 
                    alt="Full Preview" 
                />
            </div>
        </div>
    );
};

export default ImageModal;