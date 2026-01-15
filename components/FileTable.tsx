import React from 'react';
import { UploadCloud, Check, AlertCircle } from 'lucide-react';
import { FileItem, Platform } from '../types';
import { cleanText } from '../utils/helpers';

interface FileTableProps {
    files: FileItem[];
    platform: Platform;
    onPreview: (url: string) => void;
}

const FileTable: React.FC<FileTableProps> = ({ files, platform, onPreview }) => {
    
    if (files.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center opacity-50 hover:opacity-80 transition-opacity duration-300">
                    <div className="w-24 h-24 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/5 shadow-xl">
                        <UploadCloud className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">No images uploaded</h3>
                    <p className="text-sm text-slate-500 mt-2 text-center">Drag files here or click "Add Images" to begin (Jpg, Jpeg & Png)</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto p-4 lg:p-8">
                <div className="bg-[#0b1020] rounded-2xl border border-gray-800/60 overflow-hidden shadow-2xl min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-gray-900/95 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-800">
                                <tr>
                                    <th className="p-5 pl-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-24">Preview</th>
                                    <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-48">Filename</th>
                                    <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-64">Title</th>
                                    <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                    <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-64">Keywords</th>
                                    <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-48">Categories</th>
                                    <th className="p-5 pr-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60 text-sm">
                                {files.map((item) => (
                                    <TableRow key={item.id} item={item} platform={platform} onPreview={onPreview} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TableRow: React.FC<{ item: FileItem, platform: Platform, onPreview: (url: string) => void }> = ({ item, platform, onPreview }) => {
    const { metadata } = item;

    const renderCategories = () => {
        if (!metadata) return '-';
        
        const badges: React.ReactNode[] = [];

        // Adobe Stock: Sky Blue theme
        if (metadata.adobe_category) {
            badges.push(<div key="adobe" className="text-[10px] text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded border border-sky-900/50 inline-block mr-1 mb-1" title="Adobe Category">Ad: {metadata.adobe_category}</div>);
        }
        
        // Shutterstock: Sky Blue theme (combined for consistency)
        if (metadata.shutterstock_main) {
            const combined = [metadata.shutterstock_main, metadata.shutterstock_optional].filter(Boolean).join(', ');
            badges.push(<div key="ss" className="text-[10px] text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded border border-sky-900/50 inline-block mr-1 mb-1" title="Shutterstock Categories">SS: {combined}</div>);
        }
        
        // VectorStock: Teal/Emerald theme
        if (metadata.vectorstock_primary) {
            badges.push(<div key="vs1" className="text-[10px] text-teal-400 bg-teal-950/30 px-2 py-0.5 rounded border border-teal-900/50 inline-block mr-1 mb-1" title="VectorStock Primary">VS1: {metadata.vectorstock_primary}</div>);
        }
        if (metadata.vectorstock_secondary) {
            badges.push(<div key="vs2" className="text-[10px] text-teal-400/80 bg-teal-950/20 px-2 py-0.5 rounded border border-teal-900/30 inline-block mr-1 mb-1" title="VectorStock Secondary">VS2: {metadata.vectorstock_secondary}</div>);
        }
        
        // Single platform fallback: Consistent with Adobe/SS theme
        if (badges.length === 0 && metadata.category && platform !== 'General') {
             badges.push(<div key="single" className="text-[10px] text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded border border-sky-900/50">{metadata.category}</div>);
        }

        return badges.length > 0 ? badges : '-';
    };

    return (
        <tr className="hover:bg-gray-800/30 transition-colors animate-fadeIn border-b border-gray-800/50 last:border-0">
            <td className="p-4 pl-6 align-top">
                <img 
                    src={item.previewUrl} 
                    onClick={() => onPreview(item.previewUrl)} 
                    className="w-12 h-12 object-cover rounded-lg ring-1 ring-gray-700 shadow-md cursor-zoom-in hover:ring-blue-500 hover:scale-105 transition-all" 
                    alt="thumb" 
                    title="Click to Preview" 
                />
            </td>
            <td className="p-4 text-slate-300 font-mono text-xs truncate max-w-[150px] align-top pt-5" title={item.file.name}>
                {item.file.name}
            </td>
            
            <td className="p-4 text-slate-500 align-top">
                <div className="max-h-[85px] overflow-y-auto pr-2 text-xs font-medium leading-relaxed custom-scrollbar">
                    {metadata?.title ? metadata.title : '-'}
                </div>
            </td>
            
            <td className="p-4 text-slate-500 align-top">
                <div className="max-h-[85px] overflow-y-auto pr-2 text-xs leading-relaxed min-w-[200px] custom-scrollbar">
                    {metadata?.description ? metadata.description : '-'}
                </div>
            </td>
            
            <td className="p-4 text-slate-500 align-top">
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-2 min-w-[200px] custom-scrollbar">
                    {metadata?.keywords && Array.isArray(metadata.keywords) ? metadata.keywords.map((k, i) => (
                         <span key={i} className="bg-[#1B2030] text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-medium border border-gray-700/50 shadow-sm whitespace-nowrap hover:border-gray-600 transition-colors cursor-default">
                            {cleanText(k)}
                         </span>
                    )) : '-'}
                </div>
            </td>
            
            <td className="p-4 text-slate-500 align-top">
                <div className="max-h-[85px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                    {renderCategories()}
                </div>
            </td>
            
            <td className="p-4 pr-6 align-top text-right pt-5">
                {item.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-800/50 text-slate-500 border border-gray-700 uppercase tracking-wider">
                        Pending
                    </span>
                )}
                
                {item.status === 'processing' && (
                    item.errorMsg ? (
                       <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold bg-amber-950/50 border border-amber-800/60 text-amber-400 tracking-wider animate-pulse whitespace-nowrap">
                             <AlertCircle className="w-3 h-3" />
                             {item.errorMsg.includes('Retrying') ? item.errorMsg : 'RECONNECTING...'}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold bg-blue-950 border border-blue-800/60 text-blue-400 tracking-wider">
                            <div className="w-2.5 h-2.5 border-[2px] border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            PROCESSING
                        </span>
                    )
                )}

                {item.status === 'complete' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> SUCCESS
                    </span>
                )}
                {item.status === 'error' && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold bg-red-950/50 border border-red-800/60 text-red-400 tracking-wider cursor-help">
                            <AlertCircle className="w-3 h-3" /> ERROR
                        </span>
                        {item.errorMsg && (
                            <span className="text-[9px] font-medium text-red-500/80 max-w-[140px] text-right leading-tight" title={item.errorMsg}>
                                {item.errorMsg.includes('Connection failed') 
                                    ? 'Try changing the AI model' 
                                    : item.errorMsg.replace('Google GenAI Error:', '').replace('Groq Error', '')}
                            </span>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
};

export default FileTable;