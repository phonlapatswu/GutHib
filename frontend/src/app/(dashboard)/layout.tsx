"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Triangle, LogOut, Settings, Shield, Bell } from 'lucide-react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface Project { project_id: number; title: string; }
interface CurrentUser { user_id: number; username: string; role: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [inboxCount, setInboxCount] = useState(0);

  const fetchInboxCount = useCallback(async () => {
    try {
      const res = await api.get('/users/me/inbox/count');
      setInboxCount(res.data.unread || 0);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, userRes] = await Promise.all([api.get('/projects'), api.get('/auth/me')]);
        setProjects(projectsRes.data);
        setCurrentUser(userRes.data);
        await fetchInboxCount();
      } catch (error) { console.error("Failed to fetch sidebar data", error); }
    };
    fetchData();

    // Refresh inbox count every 30s
    const interval = setInterval(fetchInboxCount, 30000);
    return () => clearInterval(interval);
  }, [fetchInboxCount]);

  const handleLogout = () => { Cookies.remove('token'); router.push('/login'); };

  return (
    <div
      className="flex h-screen w-full text-black font-sans p-4 md:p-6 gap-6"
      style={{ backgroundImage: 'url("/shark_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-white/95 backdrop-blur-3xl border-4 border-[#3B82F6]/30 rounded-[40px] shadow-2xl flex-col pt-10 pb-4 h-full relative overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-2 px-8 mb-8 z-10 flex-shrink-0">
          <div className="bg-black text-white p-1 rounded-sm w-10 h-10 flex items-center justify-center transform -rotate-45 shadow-xl">
            <Triangle className="fill-current w-5 h-5 transform rotate-45" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase ml-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">SHARK<br />TASK</h1>
        </div>

        {/* User Badge */}
        {currentUser && (
          <div className="mx-4 mb-6 bg-gradient-to-r from-[#3B82F6]/10 to-[#A855F7]/10 rounded-[20px] p-4 flex items-center gap-3 flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0 ${
              currentUser.role === 'Admin' ? 'bg-red-500' : currentUser.role === 'Manager' ? 'bg-emerald-500' : currentUser.role === 'Requester' ? 'bg-[#3B82F6]' : 'bg-[#A855F7]'
            }`}>
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900 text-sm truncate">{currentUser.username}</p>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                currentUser.role === 'Admin' ? 'bg-red-100 text-red-600' :
                currentUser.role === 'Manager' ? 'bg-emerald-100 text-emerald-600' :
                currentUser.role === 'Requester' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              }`}>{currentUser.role}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 z-10 overflow-y-auto w-full custom-scrollbar">
          {[
            { label: 'Home', path: '/' },
            { label: 'My Task', path: '/tasks' },
            { label: 'Analytics', path: '/analytics' },
          ].map(({ label, path }) => (
            <Link key={label} href={path}
              className={`block px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
                pathname === path ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}>
              {label}
            </Link>
          ))}

          {/* Inbox with badge */}
          <Link href="/inbox"
            className={`flex items-center justify-between px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
              pathname === '/inbox' ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}>
            <span>Inbox</span>
            {inboxCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
                {inboxCount > 99 ? '99+' : inboxCount}
              </span>
            )}
          </Link>

          <Link href="/message"
            className={`block px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
              pathname === '/message' ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}>
            Message
          </Link>

          {/* Projects */}
          <div className="mt-8 mb-3 px-5 text-xs font-black text-gray-300 uppercase tracking-widest">Projects</div>
          {projects.map(project => (
            <Link key={project.project_id} href={`/projects/${project.project_id}`}
              className={`block px-5 py-3 text-[13px] font-bold rounded-[20px] transition-all truncate ${
                pathname.startsWith(`/projects/${project.project_id}`) ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-gray-400 hover:bg-[#3B82F6]/5 hover:text-[#3B82F6]'
              }`}>
              # {project.title}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pt-4 border-t border-gray-100 flex-shrink-0 space-y-1">
          <Link href="/profile"
            className={`flex items-center gap-3 px-5 py-3 rounded-[20px] font-bold text-sm transition-all ${
              pathname === '/profile' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}>
            <Settings className="w-4 h-4" /> Profile Settings
          </Link>

          {currentUser?.role === 'Admin' && (
            <Link href="/admin"
              className={`flex items-center gap-3 px-5 py-3 rounded-[20px] font-bold text-sm transition-all ${
                pathname === '/admin' ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50'
              }`}>
              <Shield className="w-4 h-4" /> Admin Panel
            </Link>
          )}

          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-[20px] font-bold text-sm text-gray-400 hover:bg-gray-100 hover:text-black transition-all">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-white/95 backdrop-blur-3xl border-4 border-[#A855F7]/30 rounded-[40px] shadow-2xl relative custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
