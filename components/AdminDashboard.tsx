import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore/lite';
import { Shield, CheckCircle, XCircle, Search, LogOut, Download, Trash2, ArrowLeft, Users, Loader2 } from 'lucide-react';

interface UserData {
    uid: string;
    email: string;
    fullName?: string;
    dob?: string;
    phone?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    role: string;
}

interface AdminDashboardProps {
    onLogout: () => void;
    onBackToApp: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToApp }) => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const userList = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            } as UserData));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleAccess = async (uid: string, currentStatus: boolean) => {
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { isActive: !currentStatus });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !currentStatus } : u));
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user status");
        }
    };

    const removeUser = async (uid: string) => {
        if (!window.confirm("Are you sure you want to remove this user? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "users", uid));
            setUsers(prev => prev.filter(u => u.uid !== uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user");
        }
    };

    const exportUserEmails = () => {
        const emails = users.map(u => u.email).join('\n');
        const blob = new Blob([emails], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `UserList_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#050816] text-slate-300 p-4 lg:p-10 font-['Inter']">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-900/30">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">Admin Dashboard</h1>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Metantor User Governance</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={onBackToApp}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#151a25] border border-gray-800 hover:border-blue-500/30 rounded-xl text-sm font-bold transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Tool
                        </button>
                        <button 
                            onClick={exportUserEmails}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                        >
                            <Download className="w-4 h-4" /> Export User Data
                        </button>
                        <button 
                            onClick={onLogout}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/30 rounded-xl text-sm font-bold transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#0b1020] border border-gray-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Registered</h3>
                        <p className="text-4xl font-black text-white mt-2">{users.length}</p>
                    </div>
                    <div className="bg-[#0b1020] border border-gray-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black text-emerald-600/80 uppercase tracking-widest">Active Accounts</h3>
                        <p className="text-4xl font-black text-emerald-400 mt-2">{users.filter(u => u.isActive).length}</p>
                    </div>
                    <div className="bg-[#0b1020] border border-gray-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black text-blue-600/80 uppercase tracking-widest">Verified Users</h3>
                        <p className="text-4xl font-black text-blue-400 mt-2">{users.filter(u => u.isVerified).length}</p>
                    </div>
                </div>

                <div className="bg-[#0b1020] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="p-8 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h2 className="font-bold text-white uppercase tracking-wider text-sm">User Directory</h2>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" placeholder="Search by name or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#151a25] border border-gray-800 rounded-2xl pl-11 pr-5 py-3 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-80 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-[#0f1320]/80 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="p-6">User Profile</th>
                                    <th className="p-6">Contact Info</th>
                                    <th className="p-6">Join Date</th>
                                    <th className="p-6 text-center">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest">No users found</td></tr>
                                ) : filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-[#151a25]/40 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-100">{user.fullName || 'No Name'}</span>
                                                <span className="text-[10px] text-slate-600 font-medium">DOB: {user.dob || 'Not set'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-slate-400">{user.email}</span>
                                                <span className="text-[10px] text-blue-500 font-bold">{user.phone || 'No Phone'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] text-slate-500 font-mono uppercase">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                                                        Blocked
                                                    </span>
                                                )}
                                                {!user.isVerified && (
                                                    <span className="text-[8px] text-amber-500 font-black uppercase tracking-tighter">Not Verified</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => toggleAccess(user.uid, user.isActive)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        user.isActive 
                                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                    }`}
                                                >
                                                    {user.isActive ? 'Block' : 'Unblock'}
                                                </button>
                                                <button 
                                                    onClick={() => removeUser(user.uid)}
                                                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;