import React, { useState, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Sidebar from './Sidebar';
import FileTable from './components/FileTable';
import ImageModal from './components/ImageModal';
import SuccessModal from './components/SuccessModal';
import ApiKeyModal from './components/ApiKeyModal';
import CommunityHub from './components/CommunityHub';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import ContactUs from './components/ContactUs';
import TermsConditions from './components/TermsConditions';
import Faq from './components/Faq';
import { AppConfig, FileItem, Platform, AiProvider } from './types';
import { fileToBase64, generateCsv, generateReport } from './utils/helpers';
import { generateMetadata } from './services/geminiService';
import { RefreshCw, Info } from 'lucide-react';

/**
 * World-class Background Timer Utility.
 * Uses a Web Worker to bypass browser tab throttling in hidden tabs.
 */
const backgroundWait = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        const blob = new Blob([`
            self.onmessage = function(e) {
                setTimeout(function() { self.postMessage('done'); }, e.data);
            };
        `], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        worker.onmessage = () => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve();
        };
        worker.postMessage(ms);
    });
};

const App: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [view, setView] = useState<'app' | 'privacy' | 'contact' | 'terms' | 'faq'>('app');

    const [providerKeys, setProviderKeys] = useState<Record<AiProvider, string[]>>(() => {
        try {
            const stored = localStorage.getItem('metantor_provider_keys');
            if (stored) return JSON.parse(stored);
        } catch (e) { }
        return { 'Google Gemini': [], 'Groq Cloud': [], 'Mistral AI': [] };
    });

    const [files, setFiles] = useState<FileItem[]>([]);
    const [config, setConfig] = useState<AppConfig>(() => {
        try {
            const stored = localStorage.getItem('metantor_app_config');
            if (stored) {
              const parsed = JSON.parse(stored);
              if ((parsed as any).speedMode) delete (parsed as any).speedMode;
              return parsed;
            }
        } catch (e) {}
        return {
            titleLen: 12,
            descLen: 25,
            kwCount: 40,
            platform: 'General',
            useCustomPrompt: false,
            customPrompt: '',
            extensionMode: 'default',
            provider: 'Google Gemini',
            model: 'gemini-3-flash-preview',
            prefixActive: false,
            prefixText: '',
            suffixActive: false,
            suffixText: '',
            negativeTitleActive: false,
            negativeTitleWords: '',
            negativeKeywordsActive: false,
            negativeKeywordsWords: ''
        };
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showApiModal, setShowApiModal] = useState(false);
    const [showCommunityHub, setShowCommunityHub] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rotationNotice, setRotationNotice] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filesRef = useRef<FileItem[]>([]);
    const isProcessingRef = useRef(false);
    const shouldStopRef = useRef(false);
    const configRef = useRef(config);
    const providerKeysRef = useRef(providerKeys);
    const currentKeyIndex = useRef(0);
    const wakeLockRef = useRef<any>(null);

    useEffect(() => { filesRef.current = files; }, [files]);
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { providerKeysRef.current = providerKeys; }, [providerKeys]);

    useEffect(() => {
        if (!isProcessing && files.length > 0 && !shouldStopRef.current) {
            const allSucceeded = files.every(f => f.status === 'complete');
            if (allSucceeded) {
                setShowSuccess(true);
            }
        }
    }, [isProcessing, files]);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            } catch (err) {
                console.debug('WakeLock failed:', err);
            }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => {
                wakeLockRef.current = null;
            });
        }
    };

    const addFiles = (selectedFiles: File[]) => {
        const newFiles = selectedFiles
            .filter(f => ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type) || f.name.toLowerCase().match(/\.(jpg|jpeg|png)$/))
            .map(file => ({
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'pending' as const,
                retryCount: 0
            }));
        if (newFiles.length === 0) return;
        setFiles(prev => [...prev, ...newFiles].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addFiles(Array.from(e.target.files));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    /**
     * MULTI-KEY ROTATION LOGIC:
     * 1. Exhausts Tier 1 (internal retries on a single key).
     * 2. If exhausted, rotates to next key in pool and shows notification.
     * 3. Continues until all keys in pool are exhausted.
     */
    const processFileWorker = async (fileId: string) => {
        const fileItem = filesRef.current.find(f => f.id === fileId);
        if (!fileItem) return;

        let success = false;
        let keysTriedThisTask = 0;
        const provider = configRef.current.provider;
        const keys = providerKeysRef.current[provider];
        const keysCount = keys.length;
        const effectivePoolSize = Math.max(keysCount, 1);

        while (!success && !shouldStopRef.current && keysTriedThisTask < effectivePoolSize) {
            const keyIndex = keysCount > 0 ? currentKeyIndex.current % keysCount : 0;
            const apiKey = keysCount > 0 ? keys[keyIndex] : '';

            try {
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing', errorMsg: undefined } : f));
                const base64 = await fileToBase64(fileItem.file);
                
                // Tier 1: Internal retries happen inside generateMetadata
                const metadata = await generateMetadata(base64, fileItem.file.type, configRef.current, apiKey);

                if (shouldStopRef.current) break;
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'complete', metadata } : f));
                success = true;
            } catch (e: any) {
                // Tier 2: Rotation trigger
                currentKeyIndex.current++;
                keysTriedThisTask++;
                
                if (keysTriedThisTask < effectivePoolSize) {
                    setRotationNotice(`Limit reached for key ${keyIndex + 1}. Rotating to next API key...`);
                    setTimeout(() => setRotationNotice(null), 4000);
                    // Short wait before starting with new key
                    await backgroundWait(2000);
                } else {
                    // Truly exhausted the entire pool
                    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', errorMsg: e.message } : f));
                }
            }
        }
    };

    const handleGenerate = async () => {
        if (isProcessingRef.current) return;
        if (config.provider !== 'Google Gemini' && providerKeys[config.provider].length === 0) {
            setShowApiModal(true);
            return;
        }

        setIsProcessing(true);
        isProcessingRef.current = true;
        shouldStopRef.current = false;
        setShowSuccess(false); 
        
        await requestWakeLock();

        let concurrency = 4;
        if (configRef.current.model === 'meta-llama/llama-4-maverick-17b-128e-instruct') {
            concurrency = 1;
        }

        const queue = [...filesRef.current.filter(f => f.status === 'pending' || f.status === 'error')];
        if (queue.length === 0) {
            setIsProcessing(false);
            isProcessingRef.current = false;
            releaseWakeLock();
            return;
        }

        const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async (_, i) => {
            await backgroundWait(i * 500);
            while (queue.length > 0 && !shouldStopRef.current) {
                const item = queue.shift();
                if (item) await processFileWorker(item.id);
            }
        });
        await Promise.all(workers);

        setIsProcessing(false);
        isProcessingRef.current = false;
        releaseWakeLock();
    };

    const handleSaveSettings = () => {
        localStorage.setItem('metantor_app_config', JSON.stringify(config));
        localStorage.setItem('metantor_provider_keys', JSON.stringify(providerKeys));
    };

    const setPlatform = (p: Platform) => {
        setConfig(prev => ({ ...prev, platform: p }));
    };

    const handleDownloadCsv = () => {
        const csv = generateCsv(files, config.platform, config.extensionMode);
        if (csv) {
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Metadata_${config.platform}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleDownloadReport = () => {
        const report = generateReport(files, config.platform, config.titleLen, config.descLen, config.kwCount);
        if (report) {
            const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Metadata_Report.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (view !== 'app') {
        const views = {
            privacy: <PrivacyPolicy onClose={() => setView('app')} />,
            contact: <ContactUs onClose={() => setView('app')} />,
            terms: <TermsConditions onClose={() => setView('app')} />,
            faq: <Faq onClose={() => setView('app')} onContactClick={() => setView('contact')} />
        };
        return (views as any)[view] || null;
    }

    return (
        <div className="flex h-screen flex-col bg-[#050816] overflow-hidden font-['Inter']">
            <Header 
                platform={config.platform}
                setPlatform={(p) => setPlatform(p)}
                onUploadClick={() => fileInputRef.current?.click()}
                onGenerate={handleGenerate}
                onClear={() => { shouldStopRef.current = true; setFiles([]); setShowSuccess(false); }}
                onExportCsv={handleDownloadCsv}
                onExportReport={handleDownloadReport}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                canGenerate={files.some(f => f.status === 'pending' || f.status === 'error')}
                canExport={files.length > 0 && files.every(f => f.status === 'complete')}
                hasFiles={files.length > 0}
                isProcessing={isProcessing}
                onMenuClick={() => setSidebarOpen(true)}
                onOpenCommunity={() => setShowCommunityHub(true)}
                isResume={files.some(f => f.status === 'error')}
                isGemini={config.provider === 'Google Gemini'}
            />
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar 
                    config={config} 
                    setConfig={setConfig} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                    apiKeysCount={providerKeys[config.provider].length}
                    onOpenApiKeys={() => setShowApiModal(true)}
                    onSaveSettings={handleSaveSettings} 
                />
                <main 
                    className="flex-1 flex flex-col bg-[#050816] overflow-hidden relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* KEY ROTATION NOTIFICATION BANNER */}
                    {rotationNotice && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
                            <div className="bg-blue-600/90 backdrop-blur-md border border-blue-400/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                                <span className="text-xs font-bold text-white tracking-wide">{rotationNotice}</span>
                            </div>
                        </div>
                    )}

                    <FileTable files={files} platform={config.platform} onPreview={setPreviewUrl} />
                    <Footer onOpenPrivacy={() => setView('privacy')} onOpenContact={() => setView('contact')} onOpenTerms={() => setView('terms')} onOpenFaq={() => setView('faq')} />
                </main>
            </div>
            
            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => setShowSuccess(false)} 
                onDownloadCsv={handleDownloadCsv} 
                onDownloadReport={handleDownloadReport} 
            />
            
            <ImageModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
            <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} apiKeys={providerKeys[config.provider]} onAddKey={(k) => setProviderKeys(prev => ({ ...prev, [config.provider]: [...prev[config.provider], k] }))} onRemoveKey={(i) => setProviderKeys(prev => ({ ...prev, [config.provider]: prev[config.provider].filter((_, idx) => idx !== i) }))} forceOpen={false} provider={config.provider} />
            <CommunityHub isOpen={showCommunityHub} onClose={() => setShowCommunityHub(false)} />
            <Analytics />
        </div>
    );
};

export default App;