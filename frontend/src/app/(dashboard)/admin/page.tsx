"use client";

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ShieldAlert, Trash2, Shield, User } from 'lucide-react';
import api from '@/lib/api';

interface UserRecord { user_id: number; username: string; email: string; role: string; created_at: string; }

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/admin/all');
      setUsers(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) setIsForbidden(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await api.get('/auth/me');
        setCurrentUserId(meRes.data.user_id);
        if (meRes.data.role !== 'Admin') { setIsForbidden(true); setIsLoading(false); return; }
        await fetchUsers();
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    init();
  }, [fetchUsers]);

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/users/admin/${userId}/role`, { role });
      setMsg(`✅ Role updated`);
      await fetchUsers();
    } catch (err: any) { setMsg(`❌ ${err.response?.data?.error || 'Failed'}`); }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Permanently delete user "${username}"? All their data will be removed.`)) return;
    try {
      await api.delete(`/users/admin/${userId}`);
      setMsg(`✅ User "${username}" deleted.`);
      await fetchUsers();
    } catch (err: any) { setMsg(`❌ ${err.response?.data?.error || 'Failed'}`); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-[#3B82F6]" /></div>;

  if (isForbidden) return (
    <div className="flex flex-col justify-center items-center h-full gap-4">
      <ShieldAlert className="w-20 h-20 text-red-400" />
      <h2 className="text-3xl font-black text-gray-900 uppercase">Access Denied</h2>
      <p className="text-gray-500 font-bold">You need Admin role to access this panel.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto h-full p-4 md:p-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <header>
        <h2 className="text-5xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-red-400 inline-block pb-2 flex items-center gap-3">
          <ShieldAlert className="w-10 h-10" /> Admin Panel
        </h2>
        <p className="font-bold text-gray-400 mt-3">Manage all users, roles, and organization settings.</p>
      </header>

      {msg && (
        <div className={`p-4 rounded-2xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-2xl border-4 border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 px-8 py-4 bg-gray-50 text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
          <div className="col-span-2">User</div>
          <div>Email</div>
          <div>Role</div>
          <div className="text-right">Actions</div>
        </div>

        {/* User Rows */}
        <div className="divide-y divide-gray-50">
          {users.map(user => (
            <div key={user.user_id} className="grid grid-cols-5 px-8 py-5 items-center hover:bg-gray-50/50 transition-colors">
              {/* Avatar + Name */}
              <div className="col-span-2 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0 ${
                  user.role === 'Admin' ? 'bg-red-500' : user.role === 'Manager' ? 'bg-emerald-500' : user.role === 'Requester' ? 'bg-[#3B82F6]' : 'bg-[#A855F7]'
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-900">{user.username}</p>
                  <p className="text-[10px] font-bold text-gray-400">ID #{user.user_id} · Joined {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Email */}
              <div className="text-sm font-bold text-gray-500 truncate pr-4">{user.email}</div>

              {/* Role Selector */}
              <div>
                <select
                  value={user.role}
                  disabled={user.user_id === currentUserId}
                  onChange={e => handleChangeRole(user.user_id, e.target.value)}
                  className={`bg-white border-2 rounded-xl px-3 py-2 font-black text-xs uppercase outline-none transition-colors cursor-pointer ${
                    user.role === 'Admin' ? 'border-red-300 text-red-600' :
                    user.role === 'Manager' ? 'border-emerald-300 text-emerald-600' :
                    user.role === 'Requester' ? 'border-blue-300 text-blue-600' : 'border-purple-300 text-purple-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="Worker">Worker</option>
                  <option value="Requester">Requester</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                <button
                  disabled={user.user_id === currentUserId}
                  onClick={() => handleDeleteUser(user.user_id, user.username)}
                  className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 font-bold text-center">
        Total: {users.length} users · You cannot delete or change your own role.
      </p>
    </div>
  );
}
