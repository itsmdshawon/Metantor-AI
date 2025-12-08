
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { setPersistence, signInWithEmailAndPassword, browserLocalPersistence } from 'firebase/auth';
import { Shield, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Set persistence to LOCAL so the user stays logged in after closing the tab
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Incorrect email or password.");
            } else if (err.code === 'auth/user-not-found') {
                setError("No account found. Please contact the administrator.");
            } else if (err.code === 'auth/wrong-password') {
                 setError("Incorrect password.");
            } else {
                setError("Login failed. Access denied.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050816] p-4">
            <div className="w-full max-w-md bg-[#0b1020] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="p-8 relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        {/* FIXED LOGO: Fixed width/height to prevent stretching */}
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="font-black text-white text-3xl font-['Inter'] leading-none mt-1">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Metantor</h1>
                        <p className="text-sm text-slate-400 mt-1">AI Metadata Generator</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#151a25] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-slate-600"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#151a25] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                                <Shield className="w-3 h-3 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Log In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-800 pt-6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-2">Restricted Access</p>
                        <p className="text-xs text-slate-400">
                           This tool is private. If you need access, please contact the administrator directly.
                        </p>
                    </div>
                </div>
                
                {/* Footer status */}
                <div className="bg-[#0f1320] border-t border-gray-800 p-3 text-center">
                     <p className="text-[10px] text-slate-600">Secure Access • Developed by Md. Shawon</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
