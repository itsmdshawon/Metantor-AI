
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTable from './components/FileTable';
import ImageModal from './components/ImageModal';
import SuccessModal from './components/SuccessModal';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ApiKeyModal from './components/ApiKeyModal';
import { AppConfig, FileItem, Platform, AiProvider } from './types';
import { fileToBase64, generateCsv, generateReport, cleanText } from './utils/helpers';
import { generateMetadata } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore/lite'; 
import { Loader2, Lock } from 'lucide-react';
import { AI_PROVIDERS } from './constants';

const CONCURRENCY_LIMIT = 3; 
const RETRY_DELAY_MS = 1500;
const RATE_LIMIT_DELAY_MS = 5000; 

// Type for storing keys by provider
type ProviderKeys = Record<AiProvider, string[]>;

const App: React.FC = () => {
    // --- AUTHENTICATION STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [verifyingAccess, setVerifyingAccess] = useState(true); 
    const [isUserActive, setIsUserActive] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    // --- MOBILE MENU STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // --- API KEY STATE ---
    // Migration logic: Check for old 'metantor_api_keys' (array) and move to 'metantor_provider_keys' (object)
    const [providerKeys, setProviderKeys] = useState<ProviderKeys>(() => {
        try {
            const storedNew = localStorage.getItem('metantor_provider_keys');
            if (storedNew) {
                return JSON.parse(storedNew);
            }
            
            // Fallback/Migration
            const storedOld = localStorage.getItem('metantor_api_keys');
            const defaultStructure: ProviderKeys = {
                'Google Gemini': [],
                'Groq Cloud': [],
                'xAI Grok': [],
                'Mistral AI': []
            };

            if (storedOld) {
                const oldKeys: string[] = JSON.parse(storedOld);
                // Simple heuristic migration
                oldKeys.forEach(k => {
                    if (k.startsWith('gsk_')) defaultStructure['Groq Cloud'].push(k);
                    else if (k.startsWith('AIza')) defaultStructure['Google Gemini'].push(k);
                    else defaultStructure['Google Gemini'].push(k); // Default fallback
                });
            }
            return defaultStructure;
        } catch (e) { 
            return {
                'Google Gemini': [],
                'Groq Cloud': [],
                'xAI Grok': [],
                'Mistral AI': []
            };
        }
    });

    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('metantor_provider_keys', JSON.stringify(providerKeys));
    }, [providerKeys]);

    // Check if current provider has keys
    const hasKeysForCurrentProvider = (provider: AiProvider) => {
        return providerKeys[provider] && providerKeys[provider].length > 0;
    };

    // --- MAIN APP STATE ---
    const [config, setConfig] = useState<AppConfig>(() => {
        const defaults: AppConfig = {
            titleLen: 10,
            descLen: 25,
            kwCount: 5,
            platform: 'General',
            useCustomPrompt: false,
            customPrompt: '',
            extensionMode: 'default',
            provider: 'Google Gemini',
            model: 'gemini-2.5-flash'
        };
        try {
            const stored = localStorage.getItem('metantor_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure model validity if stored config has old model names
                if (!AI_PROVIDERS[parsed.provider as AiProvider]?.find(m => m.id === parsed.model)) {
                    parsed.model = AI_PROVIDERS[parsed.provider as AiProvider][0].id;
                }
                return { ...defaults, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
        return defaults;
    });

    // Auto-open modal if no keys for current provider on mount
    useEffect(() => {
        if (user && isUserActive && !hasKeysForCurrentProvider(config.provider)) {
            // Optional: Auto open modal? Maybe better to let user click the button in sidebar
            // setIsKeyModalOpen(true);
        }
    }, [config.provider, user, isUserActive]);

    useEffect(() => {
        localStorage.setItem('metantor_config', JSON.stringify(config));
    }, [config]);

    const [files, setFiles] = useState<FileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // --- REFS FOR PROCESSING LOOP ---
    const filesRef = useRef<FileItem[]>([]);
    const isProcessingRef = useRef(false);
    const shouldStopRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentKeyIndex = useRef(0);
    const configRef = useRef(config);
    const providerKeysRef = useRef(providerKeys);
    const pendingQueueRef = useRef<string[]>([]); 

    // Sync Refs with State
    useEffect(() => { filesRef.current = files; }, [files]);
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { providerKeysRef.current = providerKeys; }, [providerKeys]);

    const processedCount = files.filter(f => f.status === 'complete').length;

    // --- AUTH EFFECT ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setVerifyingAccess(true);
                const userRef = doc(db, "users", currentUser.uid);
                
                try {
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        let active = data.isActive === true;
                        let admin = data.isAdmin === true;
                        if (currentUser.email === 'admin@metantor.com') { admin = true; active = true; }
                        setIsUserActive(active);
                        setIsAdmin(admin);
                    } else {
                        const isSuperAdmin = currentUser.email === 'admin@metantor.com';
                        await setDoc(userRef, {
                            email: currentUser.email,
                            isActive: isSuperAdmin, 
                            isAdmin: isSuperAdmin,
                            createdAt: new Date().toISOString()
                        });
                        setIsUserActive(isSuperAdmin);
                        setIsAdmin(isSuperAdmin);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                } finally {
                    setVerifyingAccess(false);
                    setAuthLoading(false);
                }
            } else {
                setIsUserActive(false);
                setIsAdmin(false);
                setVerifyingAccess(false);
                setAuthLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const handlePlatformChange = (p: Platform) => {
        setConfig(prev => ({ ...prev, platform: p }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = (Array.from(e.target.files) as File[]).filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
        
        const newItems: FileItem[] = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
            retryCount: 0
        }));

        setFiles(prev => {
            const combined = [...prev, ...newItems];
            return combined.sort((a, b) => 
                a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })
            );
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
             const newFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
             const newItems: FileItem[] = newFiles.map(file => ({
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'pending',
                retryCount: 0
            }));

            setFiles(prev => {
                const combined = [...prev, ...newItems];
                return combined.sort((a, b) => 
                    a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })
                );
            });
        }
    };

    const handleClear = () => {
        shouldStopRef.current = true;
        isProcessingRef.current = false;
        
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setIsProcessing(false);
        setShowSuccessModal(false);
        pendingQueueRef.current = [];
    };

    // --- KEY MANAGEMENT PER PROVIDER ---
    const handleAddKey = (key: string) => {
        setProviderKeys(prev => ({
            ...prev,
            [config.provider]: [...(prev[config.provider] || []), key]
        }));
    };

    const handleRemoveKey = (index: number) => {
        setProviderKeys(prev => ({
            ...prev,
            [config.provider]: prev[config.provider].filter((_, i) => i !== index)
        }));
    };

    // --- PARALLEL PROCESSING ENGINE ---

    // 1. Worker Function
    const processFileWorker = async (fileId: string) => {
        const fileItem = filesRef.current.find(f => f.id === fileId);
        if (!fileItem) return;

        let success = false;
        let retries = 0;
        
        while (!success && !shouldStopRef.current) {
            try {
                // Get Key from CURRENT Provider pool
                const currentProvider = configRef.current.provider;
                const keys = providerKeysRef.current[currentProvider];
                
                if (!keys || keys.length === 0) throw new Error(`No API Keys for ${currentProvider}`);
                
                const apiKey = keys[currentKeyIndex.current % keys.length];
                currentKeyIndex.current++; 

                setFiles(prev => prev.map(f => f.id === fileId ? { 
                    ...f, 
                    status: 'processing',
                    errorMsg: retries > 0 ? `Retrying... (${retries})` : undefined
                } : f));

                const base64 = await fileToBase64(fileItem.file);
                
                let metadata = await generateMetadata(base64, fileItem.file.type, configRef.current, apiKey);

                if (metadata.title) metadata.title = cleanText(metadata.title);
                if (metadata.description) metadata.description = cleanText(metadata.description);
                if (metadata.keywords && Array.isArray(metadata.keywords)) {
                    metadata.keywords = metadata.keywords.map(k => cleanText(k));
                    if (metadata.keywords.length > configRef.current.kwCount) {
                        metadata.keywords = metadata.keywords.slice(0, configRef.current.kwCount);
                    }
                }

                setFiles(prev => prev.map(f => f.id === fileId ? { 
                    ...f, 
                    status: 'complete', 
                    metadata,
                    errorMsg: undefined,
                    retryCount: retries 
                } : f));
                success = true;

            } catch (error: any) {
                if (shouldStopRef.current) break;
                
                const errorStr = error.toString().toLowerCase();
                const isRateLimit = errorStr.includes('429') || 
                                    errorStr.includes('quota') ||
                                    errorStr.includes('resource exhausted');
                
                const isFatal = errorStr.includes('400') || 
                                errorStr.includes('401') || 
                                errorStr.includes('403') ||
                                errorStr.includes('invalid') ||
                                errorStr.includes('model_decommissioned') ||
                                errorStr.includes('api key');

                if (isFatal) {
                     setFiles(prev => prev.map(f => f.id === fileId ? { 
                        ...f, 
                        status: 'error', 
                        errorMsg: error.message ? error.message.substring(0, 50) : "Fatal Error",
                        retryCount: retries 
                    } : f));
                    break;
                }

                retries++;
                const delay = isRateLimit ? RATE_LIMIT_DELAY_MS : RETRY_DELAY_MS;
                
                let shortError = "Error";
                if (errorStr.includes('503')) shortError = "503 Service Unavailable";
                else if (errorStr.includes('500')) shortError = "500 Server Error";
                else if (errorStr.includes('timeout')) shortError = "Timeout";
                else if (isRateLimit) shortError = "429 Rate Limit";
                else if (error.message) shortError = error.message.substring(0, 20) + "...";

                const statusMsg = `${shortError}. Retrying...`;
                console.warn(`Attempt failed for ${fileItem.file.name} (Retry ${retries}):`, error);

                setFiles(prev => prev.map(f => f.id === fileId ? {
                    ...f,
                    status: 'processing',
                    retryCount: retries,
                    errorMsg: statusMsg
                } : f));
                
                await new Promise(r => setTimeout(r, delay));
            }
        }
    };

    // 2. Queue Manager
    const processQueueManager = async () => {
        const workers: Promise<void>[] = [];
        while (pendingQueueRef.current.length > 0 && !shouldStopRef.current) {
            while (workers.length < CONCURRENCY_LIMIT && pendingQueueRef.current.length > 0) {
                const nextId = pendingQueueRef.current.shift();
                if (nextId) {
                    const workerPromise = processFileWorker(nextId).then(() => {
                        workers.splice(workers.indexOf(workerPromise), 1);
                    });
                    workers.push(workerPromise);
                }
            }
            if (workers.length > 0) {
                await Promise.race(workers);
            } else {
                break;
            }
        }
        await Promise.all(workers);
    };

    // 3. Start Trigger
    const startProcessing = async () => {
        // Check keys for CURRENT provider
        if (!providerKeysRef.current[configRef.current.provider]?.length) {
            setIsKeyModalOpen(true);
            return;
        }
        if (isProcessingRef.current) return;

        setIsProcessing(true);
        shouldStopRef.current = false;
        isProcessingRef.current = true;

        const pendingFiles = filesRef.current.filter(f => f.status === 'pending');
        pendingQueueRef.current = pendingFiles.map(f => f.id);

        await processQueueManager();

        setIsProcessing(false);
        isProcessingRef.current = false;

        const hasSomeComplete = filesRef.current.some(f => f.status === 'complete');
        if (hasSomeComplete && !shouldStopRef.current) {
            setShowSuccessModal(true);
        }
    };

    const handleExportCsv = () => {
        const csv = generateCsv(files, config.platform, config.extensionMode);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.platform}_Metadata.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleExportReport = () => {
        const report = generateReport(files, config.platform, config.titleLen, config.descLen, config.kwCount);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Metadata_Report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (authLoading || (user && verifyingAccess)) {
        return (
            <div className="h-full bg-[#050816] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) return <Login />;

    if (!isUserActive) {
        return (
            <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-[#0b1020] border border-red-900/50 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Your account is currently inactive or payment is pending. <br/>
                        Please contact the administrator to activate your subscription.
                    </p>
                    <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-white text-xs underline underline-offset-4">Sign Out</button>
                </div>
            </div>
        );
    }

    if (isAdmin && showAdminPanel) {
        return <AdminDashboard onLogout={() => signOut(auth)} onBackToApp={() => setShowAdminPanel(false)} />;
    }

    return (
        <div 
            className="h-full flex flex-col overflow-hidden relative" 
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
        >
            <Header 
                platform={config.platform}
                setPlatform={handlePlatformChange}
                onUploadClick={() => fileInputRef.current?.click()}
                onGenerate={startProcessing} 
                onClear={handleClear}
                onExportCsv={handleExportCsv}
                onExportReport={handleExportReport}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileUpload}
                canGenerate={files.some(f => f.status === 'pending')}
                canExport={files.some(f => f.status === 'complete')}
                hasFiles={files.length > 0}
                isProcessing={isProcessing}
                onMenuClick={() => setSidebarOpen(true)}
            />

            <div className="flex flex-1 overflow-hidden min-h-0">
                <Sidebar 
                    config={config} 
                    setConfig={setConfig}
                    isAdmin={isAdmin}
                    onOpenAdmin={() => setShowAdminPanel(true)}
                    onLogout={() => signOut(auth)}
                    apiKeysCount={providerKeys[config.provider]?.length || 0}
                    onOpenApiKeys={() => setIsKeyModalOpen(true)}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="flex-1 flex flex-col bg-[#050816] min-w-0 relative">
                    <div className="flex-none h-14 px-4 lg:px-8 border-b border-gray-800 bg-[#0b1020]/50 flex items-center justify-between text-xs">
                        <div className="text-slate-400 font-medium flex items-center gap-2.5">
                            {files.length > 0 ? (
                                <>
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'}`}></div>
                                    <span className="text-blue-100">
                                        {isProcessing ? 'Processing...' : `${files.length} images loaded`}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                    <span>Waiting for input...</span>
                                </>
                            )}
                        </div>
                        
                        {files.length > 0 && (
                            <div className="flex items-center gap-5 animate-fadeIn">
                                <span className="text-slate-400 font-mono hidden sm:inline">{processedCount}/{files.length} Completed</span>
                                <div className="w-20 sm:w-40 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
                                        style={{ width: `${(processedCount / files.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <FileTable files={files} platform={config.platform} onPreview={setPreviewImage} />
                </main>
            </div>

            <ApiKeyModal 
                isOpen={isKeyModalOpen} 
                onClose={() => setIsKeyModalOpen(false)} 
                apiKeys={providerKeys[config.provider] || []} 
                onAddKey={handleAddKey} 
                onRemoveKey={handleRemoveKey}
                forceOpen={!hasKeysForCurrentProvider(config.provider) && !isProcessing && files.length > 0}
                provider={config.provider}
            />

            <ImageModal url={previewImage} onClose={() => setPreviewImage(null)} />
            
            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                onDownloadCsv={handleExportCsv}
                onDownloadReport={handleExportReport}
            />
        </div>
    );
};

export default App;
