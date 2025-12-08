
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTable from './components/FileTable';
import ImageModal from './components/ImageModal';
import SuccessModal from './components/SuccessModal';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ApiKeyModal from './components/ApiKeyModal';
import { AppConfig, FileItem, Platform } from './types';
import { fileToBase64, generateCsv, generateReport, cleanText } from './utils/helpers';
import { generateMetadata } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'; 
import { Loader2, Lock } from 'lucide-react';

const MAX_AUTO_RETRIES = 5; 
const MAX_FILE_RETRIES = 3; // Max retries for a single file before giving up
const INITIAL_DELAY = 800;
const MIN_DELAY = 200;

// v1.3 Background Process Optimization

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
    const [apiKeys, setApiKeys] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('metantor_api_keys');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    });
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('metantor_api_keys', JSON.stringify(apiKeys));
        if (apiKeys.length === 0 && user && isUserActive) {
            setIsKeyModalOpen(true);
        }
    }, [apiKeys, user, isUserActive]);

    // --- MAIN APP STATE ---
    const [config, setConfig] = useState<AppConfig>(() => {
        const defaults: AppConfig = {
            titleLen: 10,
            descLen: 25,
            kwCount: 5,
            platform: 'General',
            useCustomPrompt: false,
            customPrompt: '',
            extensionMode: 'default'
        };
        try {
            const stored = localStorage.getItem('metantor_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...defaults, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
        return defaults;
    });

    useEffect(() => {
        localStorage.setItem('metantor_config', JSON.stringify(config));
    }, [config]);

    const [files, setFiles] = useState<FileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [shouldStop, setShouldStop] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // --- REFS FOR PROCESSING LOOP (Fixes Background Tab Issue) ---
    const filesRef = useRef<FileItem[]>([]);
    const isProcessingRef = useRef(false);
    const shouldStopRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loopDelay = useRef(INITIAL_DELAY);
    const currentKeyIndex = useRef(0);
    const configRef = useRef(config);
    const apiKeysRef = useRef(apiKeys);

    // Sync Refs with State
    useEffect(() => { filesRef.current = files; }, [files]);
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);

    const processedCount = files.filter(f => f.status === 'complete' || f.status === 'error').length;

    // --- AUTH EFFECT (REAL-TIME LISTENER) ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setVerifyingAccess(true);
                const userRef = doc(db, "users", currentUser.uid);
                
                // Real-time listener for "Instant Kick"
                const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        let active = data.isActive === true;
                        let admin = data.isAdmin === true;

                        if (currentUser.email === 'admin@metantor.com') {
                             admin = true;
                             active = true;
                        }

                        setIsUserActive(active);
                        setIsAdmin(admin);
                    } else {
                        // Create doc if missing (Auto-Setup)
                        await setDoc(userRef, {
                            email: currentUser.email,
                            isActive: false, 
                            isAdmin: false,
                            createdAt: new Date().toISOString()
                        });
                    }
                    setVerifyingAccess(false);
                    setAuthLoading(false);
                }, (error) => {
                    console.error("Snapshot error:", error);
                    setVerifyingAccess(false);
                    setAuthLoading(false);
                });

                return () => unsubscribeSnapshot();
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
        setShouldStop(true);
        shouldStopRef.current = true;
        isProcessingRef.current = false;
        
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setIsProcessing(false);
        setShowSuccessModal(false);
        loopDelay.current = INITIAL_DELAY;
    };

    // --- API KEY MANAGEMENT ---
    const handleAddKey = (key: string) => {
        setApiKeys(prev => [...prev, key]);
    };

    const handleRemoveKey = (index: number) => {
        setApiKeys(prev => prev.filter((_, i) => i !== index));
    };

    // --- ROBUST PROCESSING LOOP ---
    const startProcessing = async () => {
        if (apiKeysRef.current.length === 0) {
            setIsKeyModalOpen(true);
            return;
        }
        if (isProcessingRef.current) return;

        setIsProcessing(true);
        setShouldStop(false);
        isProcessingRef.current = true;
        shouldStopRef.current = false;
        loopDelay.current = INITIAL_DELAY;

        processQueue();
    };

    const processQueue = async () => {
        while (isProcessingRef.current && !shouldStopRef.current) {
            
            // 1. Find next pending file from Ref (always fresh)
            const currentFiles = filesRef.current;
            const nextFile = currentFiles.find(f => f.status === 'pending');

            // 2. If no pending files, check for retries or finish
            if (!nextFile) {
                const isComplete = currentFiles.every(f => f.status === 'complete' || f.status === 'error');
                if (isComplete) {
                    setIsProcessing(false);
                    isProcessingRef.current = false;
                    const hasSuccess = currentFiles.some(f => f.status === 'complete');
                    if (hasSuccess) setShowSuccessModal(true);
                    return;
                }
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }

            // 3. Mark as processing
            setFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'processing' } : f));
            
            // 4. Wait loop delay (Throttle)
            await new Promise(r => setTimeout(r, loopDelay.current));

            if (shouldStopRef.current) break;

            try {
                const keys = apiKeysRef.current;
                const apiKey = keys[currentKeyIndex.current % keys.length];

                const base64 = await fileToBase64(nextFile.file);
                let metadata = await generateMetadata(base64, nextFile.file.type, configRef.current, apiKey);

                if (metadata.title) metadata.title = cleanText(metadata.title);
                if (metadata.description) metadata.description = cleanText(metadata.description);
                if (metadata.keywords && Array.isArray(metadata.keywords)) {
                    metadata.keywords = metadata.keywords.map(k => cleanText(k));
                    if (metadata.keywords.length > configRef.current.kwCount) {
                        metadata.keywords = metadata.keywords.slice(0, configRef.current.kwCount);
                    }
                }

                setFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'complete', metadata } : f));
                
                // Accelerate
                loopDelay.current = Math.max(MIN_DELAY, loopDelay.current - 200);

            } catch (err: any) {
                console.error("Error processing:", err);
                
                // Track retry attempts for this specific file
                const currentRetry = nextFile.retryCount || 0;
                
                if (currentRetry < MAX_FILE_RETRIES) {
                    // Failover logic for Quota errors or generic timeouts
                    if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('quota'))) {
                        console.warn("Quota hit, rotating key...");
                        currentKeyIndex.current += 1;
                        loopDelay.current = Math.min(loopDelay.current + 2000, 10000); // Slow down
                    } else {
                        // For generic errors, just wait a bit
                        loopDelay.current = Math.min(loopDelay.current + 1000, 5000);
                    }

                    // Retry: Set status back to pending but increment count
                    setFiles(prev => prev.map(f => 
                        f.id === nextFile.id 
                            ? { ...f, status: 'pending', retryCount: currentRetry + 1 } 
                            : f
                    ));
                    
                    await new Promise(r => setTimeout(r, 1500)); // Breathing room
                    continue; 
                } else {
                    // Max retries reached, fail permanently so we don't block the queue
                    setFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'error', errorMsg: err.message || "Failed after multiple attempts" } : f));
                }
            }
        }
        
        setIsProcessing(false);
        isProcessingRef.current = false;
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

    if (!user) {
        return <Login />;
    }

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
                    <button 
                        onClick={() => signOut(auth)}
                        className="text-slate-500 hover:text-white text-xs underline underline-offset-4"
                    >
                        Sign Out
                    </button>
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
                    apiKeysCount={apiKeys.length}
                    onOpenApiKeys={() => setIsKeyModalOpen(true)}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="flex-1 flex flex-col bg-[#050816] min-w-0 relative">
                    <div className="flex-none h-14 px-4 lg:px-8 border-b border-gray-800 bg-[#0b1020]/50 flex items-center justify-between text-xs">
                        <div className="text-slate-400 font-medium flex items-center gap-2.5">
                            {files.length > 0 ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <span className="text-blue-100">{files.length} images queued</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                    <span>Waiting for input...</span>
                                </>
                            )}
                        </div>
                        
                        {isProcessing && files.length > 0 && (
                            <div className="flex items-center gap-5 animate-fadeIn">
                                <span className="text-slate-400 font-mono hidden sm:inline">{processedCount}/{files.length}</span>
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
                apiKeys={apiKeys} 
                onAddKey={handleAddKey} 
                onRemoveKey={handleRemoveKey}
                forceOpen={apiKeys.length === 0 && !isProcessing}
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
