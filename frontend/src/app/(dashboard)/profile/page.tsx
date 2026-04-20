"use client";

import { useEffect, useState } from 'react';
import { Loader2, User, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import Image from 'next/image';
import Cookies from 'js-cookie';

interface ProfileData {
  user_id: number; username: string; email: string; role: string; avatar_url: string | null; created_at: string;
  taskStats: Array<{ status: string; _count: number }>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUploading, setIsUploading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        setEditForm({ username: res.data.username, email: res.data.email });
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    init();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.put('/users/me', editForm);
      setProfileMsg('✅ Profile updated successfully!');
    } catch (err: any) {
      setProfileMsg(`❌ ${err.response?.data?.error || 'Update failed'}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('❌ New passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg('❌ Password must be at least 6 characters'); return; }
    try {
      await api.post('/users/me/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('✅ Password changed! Please log in again.');
      setTimeout(() => { Cookies.remove('token'); window.location.href = '/login'; }, 2000);
    } catch (err: any) {
      setPwMsg(`❌ ${err.response?.data?.error || 'Failed'}`);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => prev ? { ...prev, avatar_url: res.data.avatar_url } : null);
      setProfileMsg('✅ Avatar updated!');
    } catch (err: any) {
      setProfileMsg(`❌ ${err.response?.data?.error || 'Upload failed'}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-[#5EE1CD]" /></div>;
  if (!profile) return <div className="flex justify-center items-center h-full"><p className="text-gray-400 font-bold">Could not load profile.</p></div>;

  const totalTasks = profile.taskStats.reduce((sum, s) => sum + s._count, 0);
  const completedTasks = profile.taskStats.find(s => s.status === 'Closed')?._count || 0;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="max-w-3xl mx-auto h-full p-4 md:p-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

      <header className="mb-2">
        <h2 className="text-5xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#5EE1CD] inline-block pb-2">My Profile</h2>
      </header>

      {/* User Card */}
      <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-[#5EE1CD]/20 flex items-center gap-6">
        <label className="relative group cursor-pointer flex-shrink-0">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl overflow-hidden relative">
            {profile.avatar_url ? (
               <Image src={`${API_BASE}${profile.avatar_url}`} alt="Avatar" fill className="object-cover" />
            ) : (
               profile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="text-white w-6 h-6 rotate-90" /> {/* Just an icon for "upload" since I don't have Upload specific icon imported besides Loader */}
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </label>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-gray-900">{profile.username}</h3>
            {isUploading && <Loader2 className="w-4 h-4 animate-spin text-[#5EE1CD]" />}
          </div>
          <p className="text-gray-500 font-bold">{profile.email}</p>
          <span className="text-xs font-black uppercase bg-black text-[#5EE1CD] px-4 py-1.5 rounded-full mt-2 inline-block">{profile.role}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, color: 'text-[#3B82F6]', bg: 'bg-blue-50' },
          { label: 'Completed', value: completedTasks, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completion %', value: `${completionRate}%`, color: 'text-[#A855F7]', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-[24px] p-5 text-center`}>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-black text-gray-400 uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit Tabs */}
      <div className="bg-white rounded-[40px] shadow-2xl border-4 border-gray-100 p-8">
        <div className="flex gap-2 mb-6 border-b-2 border-gray-100 pb-4">
          {(['profile', 'password'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-700'}`}>
              {tab === 'profile' ? '👤 Edit Profile' : '🔒 Change Password'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-1">Username</label>
              <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors" />
            </div>
            {profileMsg && <p className="font-bold text-sm">{profileMsg}</p>}
            <button type="submit" className="bg-black text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-800 transition-colors">
              Save Profile
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {[
              { label: 'Current Password', field: 'currentPassword' as const },
              { label: 'New Password', field: 'newPassword' as const },
              { label: 'Confirm New Password', field: 'confirmPassword' as const },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="text-xs font-black uppercase text-gray-400 block mb-1">{label}</label>
                <input type="password" value={pwForm[field]} onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors" />
              </div>
            ))}
            {pwMsg && <p className="font-bold text-sm">{pwMsg}</p>}
            <button type="submit" className="bg-black text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-800 transition-colors">
              Change Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
