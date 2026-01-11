import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { Shield, Lock, Mail, Loader2, LogIn, User, Calendar, Phone, CheckCircle, ArrowLeft } from 'lucide-react';

const COUNTRY_CODES = [
    { code: '+1', name: 'USA' },
    { code: '+44', name: 'UK' },
    { code: '+91', name: 'India' },
    { code: '+880', name: 'Bangladesh' },
    { code: '+61', name: 'Australia' },
    { code: '+1', name: 'Canada' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+81', name: 'Japan' },
    { code: '+86', name: 'China' },
];

const Login: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup' | 'verify' | 'admin'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [phone, setPhone] = useState('');
    const [dialCode, setDialCode] = useState('+1');
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingUid, setPendingUid] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.isActive === false) {
                    await auth.signOut();
                    setError("Your account has been blocked. Contact administrator.");
                    return;
                }
                if (data.isVerified === false) {
                    setPendingUid(result.user.uid);
                    setView('verify');
                }
            }
        } catch (err: any) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // In a real app, this would trigger a Cloud Function to send an actual email.
            // For now, we store it in Firestore for verification.
            console.log("SIMULATED EMAIL SENT: Your verification code is " + code);

            await setDoc(doc(db, "users", result.user.uid), {
                fullName,
                dob,
                phone: dialCode + phone,
                email,
                uid: result.user.uid,
                isActive: true,
                isVerified: false,
                verificationCode: code,
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: serverTimestamp()
            });

            await updateProfile(result.user, { displayName: fullName });
            
            setPendingUid(result.user.uid);
            setView('verify');
            setSuccessMsg("Verification code sent to your email. Check all folders including spam.");
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') setError("Email address already registered");
            else setError("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userRef = doc(db, "users", pendingUid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.verificationCode === verificationCode) {
                    await setDoc(userRef, { isVerified: true }, { merge: true });
                    // Access is granted automatically by App.tsx observing this change
                } else {
                    setError("Invalid verification code");
                }
            }
        } catch (err) {
            setError("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                if (userSnap.data().role !== 'admin') {
                    await auth.signOut();
                    setError("Access denied. Admin credentials required.");
                }
            } else {
                await auth.signOut();
                setError("Admin record not found.");
            }
        } catch (err) {
            setError("Invalid admin credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050816] p-4 font-['Inter']">
            <div className="w-full max-w-md bg-[#0b1020] border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="p-10 relative z-10">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-5 shadow-lg shadow-blue-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="font-black text-white text-3xl leading-none mt-1">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Metantor</h1>
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">AI Metadata that Drives Sales</p>
                    </div>

                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-200">Welcome Creator</h2>
                                <p className="text-xs text-slate-500 mt-1">Sign in to start generating high converting metadata</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="your password"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-center text-xs text-red-400 bg-red-950/20 py-3 rounded-xl border border-red-900/30 px-3">{error}</p>}

                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
                            </button>

                            <div className="text-center mt-6">
                                <p className="text-xs text-slate-500">
                                    Don't have an account? 
                                    <button type="button" onClick={() => {setView('signup'); setError('');}} className="ml-2 text-blue-400 font-bold hover:underline">Sign Up</button>
                                </p>
                            </div>
                        </form>
                    )}

                    {view === 'signup' && (
                        <form onSubmit={handleSignUp} className="space-y-4 animate-fadeIn">
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-200">Create Account</h2>
                                <p className="text-xs text-slate-500 mt-1">Join Metantor to drive your microstock sales</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <User className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Birth</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Calendar className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="date" required value={dob} onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={dialCode} onChange={(e) => setDialCode(e.target.value)}
                                        className="bg-[#151a25] border border-gray-800 rounded-2xl px-3 text-xs text-white focus:outline-none focus:border-blue-500/50 h-12"
                                    >
                                        {COUNTRY_CODES.map(c => <option key={c.code + c.name} value={c.code}>{c.code} {c.name}</option>)}
                                    </select>
                                    <div className="relative flex-1 group flex items-center">
                                        <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                            <Phone className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input 
                                            type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                            placeholder="123456789"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="create a password"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-center text-xs text-red-400 bg-red-950/20 py-3 rounded-xl border border-red-900/30 px-3">{error}</p>}

                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                            </button>

                            <div className="text-center mt-6">
                                <p className="text-xs text-slate-500">
                                    Already have an account? 
                                    <button type="button" onClick={() => {setView('login'); setError('');}} className="ml-2 text-blue-400 font-bold hover:underline">Log In</button>
                                </p>
                            </div>
                        </form>
                    )}

                    {view === 'verify' && (
                        <form onSubmit={handleVerify} className="space-y-4 animate-fadeIn">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-6 h-6 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-200">Verify Your Email</h2>
                                <p className="text-xs text-slate-500 mt-2 px-6">Enter the 6 digit code sent to your email address to continue</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">Verification Code</label>
                                <input 
                                    type="text" required maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full bg-[#151a25] border border-gray-800 rounded-2xl px-4 py-3 text-center text-2xl font-black text-white tracking-[0.5em] focus:outline-none focus:border-blue-500/50 transition-all h-16"
                                    placeholder="000000"
                                />
                            </div>

                            {successMsg && <p className="text-center text-[10px] text-emerald-400 font-bold uppercase tracking-tight">{successMsg}</p>}
                            {error && <p className="text-center text-xs text-red-400 bg-red-950/20 py-3 rounded-xl border border-red-900/30 px-3">{error}</p>}

                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify and Continue</>}
                            </button>

                            <button 
                                type="button" onClick={() => setView('signup')}
                                className="w-full text-xs text-slate-500 hover:text-white transition-colors py-2"
                            >
                                Back to Registration
                            </button>
                        </form>
                    )}

                    {view === 'admin' && (
                        <form onSubmit={handleAdminLogin} className="space-y-4 animate-fadeIn">
                             <div className="flex items-center gap-2 mb-6 justify-center">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">Admin Access Portal</span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="admin@metantor.ai"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-12"
                                        placeholder="admin password"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-center text-xs text-red-400 bg-red-950/20 py-3 rounded-xl border border-red-900/30 px-3">{error}</p>}

                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In as Admin</>}
                            </button>

                            <button 
                                type="button" onClick={() => setView('login')}
                                className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white transition-colors py-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to User Login
                            </button>
                        </form>
                    )}

                    {view !== 'admin' && view !== 'verify' && (
                        <div className="mt-10 text-center border-t border-gray-800/60 pt-6">
                            <button 
                                onClick={() => { setView('admin'); setError(''); }}
                                className="text-[10px] text-slate-600 hover:text-blue-400 font-black uppercase tracking-[0.2em] transition-colors"
                            >
                                Administrative Portal Only
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;