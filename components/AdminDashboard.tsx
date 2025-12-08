
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Shield, CheckCircle, XCircle, Search, LogOut } from 'lucide-react';

interface UserData {
    uid: string;
    email: string;
    isActive: boolean;
    createdAt: string;
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
            // Optimistic update
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !currentStatus } : u));
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user status");
        }
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#050816] text-slate-300 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-xl">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-bold text-white">Administrator Panel</h1>
                            <p className="text-sm text-slate-400">Manage user access and subscriptions</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onBackToApp}
                            className="flex-1 md:flex-none px-4 py-2 bg-[#151a25] border border-gray-700 hover:bg-[#1e2330] rounded-lg text-sm font-medium transition-colors"
                        >
                            Open Tool
                        </button>
                        <button 
                            onClick={onLogout}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/30 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0b1020] border border-gray-800 p-5 rounded-xl">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</h3>
                        <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                    </div>
                    <div className="bg-[#0b1020] border border-gray-800 p-5 rounded-xl">
                        <h3 className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider">Active Subscribers</h3>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{users.filter(u => u.isActive).length}</p>
                    </div>
                    <div className="bg-[#0b1020] border border-gray-800 p-5 rounded-xl">
                        <h3 className="text-xs font-bold text-red-600/80 uppercase tracking-wider">Inactive / Blocked</h3>
                        <p className="text-2xl font-bold text-red-400 mt-1">{users.filter(u => !u.isActive).length}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#0b1020] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h2 className="font-bold text-white">User Management</h2>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#151a25] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-[#0f1320] text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">User Email</th>
                                    <th className="p-4">Joined Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                                ) : filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-[#151a25]/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-200">{user.email}</td>
                                        <td className="p-4 text-xs text-slate-500 font-mono">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/50">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => toggleAccess(user.uid, user.isActive)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    user.isActive 
                                                        ? 'bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/40' 
                                                        : 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900/40'
                                                }`}
                                            >
                                                {user.isActive ? 'Block Access' : 'Grant Access'}
                                            </button>
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
