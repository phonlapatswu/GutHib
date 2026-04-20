"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Triangle, LogOut, Settings, Shield, Menu, X, Moon, Sun } from 'lucide-react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Image from 'next/image';
import Cookies from 'js-cookie';

interface Project { project_id: number; title: string; }
interface CurrentUser { user_id: number; username: string; email: string; role: string; avatar_url: string | null; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchCounts = useCallback(async () => {
    try {
      const [inboxRes, msgRes] = await Promise.all([
        api.get('/users/me/inbox/count'),
        api.get('/messages/unread-count')
      ]);
      setInboxCount(inboxRes.data.unread || 0);
      setUnreadMsgCount(msgRes.data.totalUnread || 0);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    
    const fetchData = async () => {
      try {
        const [projectsRes, userRes] = await Promise.all([api.get('/projects'), api.get('/auth/me')]);
        setProjects(projectsRes.data);
        setCurrentUser(userRes.data);
        await fetchCounts();
        
        // Connect socket and listen
        socket.connect();
        socket.on('unread_count_update', () => {
           console.log('Real-time count update triggered');
           fetchCounts();
        });
        
        socket.on('user_updated', () => {
           console.log('User profile update triggered');
           api.get('/auth/me').then(res => setCurrentUser(res.data)).catch(console.error);
        });
        
        // Also listen for new messages to update counts immediately
        socket.on('new_message', () => fetchCounts());

      } catch (error) { console.error("Failed to fetch sidebar data", error); }
    };
    fetchData();

    return () => {
      socket.off('unread_count_update');
      socket.off('new_message');
      socket.disconnect();
    };
  }, [fetchCounts]);

  const handleLogout = () => { Cookies.remove('token'); router.push('/login'); };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div
      className="flex h-screen w-full text-black font-sans p-4 md:p-6 gap-6"
      style={{ backgroundImage: 'url("/shark_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-[101] md:z-0
        flex flex-col h-full
        bg-[rgb(var(--bg-sidebar))] backdrop-blur-3xl border-4 border-[#3B82F6]/30 dark:border-[#A855F7]/30 rounded-[40px] shadow-2xl 
        pt-10 pb-4 overflow-hidden
        transition-all duration-500 ease-out
        ${isSidebarOpen ? 'left-0 w-72 m-4 md:m-0' : '-left-[100%] md:left-0 w-72'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-8 mb-8 z-10 flex-shrink-0">
          <div className="bg-black text-white p-1 rounded-sm w-10 h-10 flex items-center justify-center transform -rotate-45 shadow-xl">
            <Triangle className="fill-current w-5 h-5 transform rotate-45" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase ml-2 bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">SHARK<br />TASK</h1>
        </div>

        {/* User Badge */}
        {currentUser && (
          <div className="mx-4 mb-6 bg-gradient-to-r from-[#3B82F6]/10 to-[#A855F7]/10 rounded-[20px] p-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] flex items-center justify-center font-black text-white shadow-lg overflow-hidden shrink-0 relative">
              {currentUser.avatar_url ? (
                <Image src={`${API_BASE}${currentUser.avatar_url}`} alt="Avatar" fill className="object-cover" />
              ) : (
                currentUser.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[rgb(var(--text-main))] text-sm truncate">{currentUser.username}</p>
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
            { label: 'Analytics', path: '/analytics' },
          ].map(({ label, path }) => (
            <Link key={label} href={path}
              className={`block px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
                pathname === path ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-main))] hover:text-[rgb(var(--text-main))]'
              }`}>
              {label}
            </Link>
          ))}

          {/* Inbox with badge */}
          <Link href="/inbox"
            className={`flex items-center justify-between px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
              pathname === '/inbox' ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-main))] hover:text-[rgb(var(--text-main))]'
            }`}>
            <span>Inbox</span>
            {inboxCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
                {inboxCount > 99 ? '99+' : inboxCount}
              </span>
            )}
          </Link>

          <Link href="/message"
            className={`flex items-center justify-between px-5 py-3.5 text-[15px] font-bold rounded-[20px] transition-all ${
              pathname === '/message' ? 'bg-black text-[#5EE1CD] shadow-lg shadow-black/20' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-main))] hover:text-[rgb(var(--text-main))]'
            }`}>
            <span>Message</span>
            {unreadMsgCount > 0 && (
              <span className="bg-[#A855F7] text-white text-[10px] font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md">
                {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
              </span>
            )}
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
              pathname === '/profile' ? 'bg-black text-white' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-main))] hover:text-[rgb(var(--text-main))]'
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

          <button onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-[20px] font-bold text-sm text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white transition-all">
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-[20px] font-bold text-sm text-gray-400 hover:bg-gray-100 hover:text-black dark:hover:text-white transition-all">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col bg-[rgb(var(--bg-surface))] backdrop-blur-3xl border-4 border-[#A855F7]/30 dark:border-[#3B82F6]/30 rounded-[40px] shadow-2xl relative">
        
        {/* Mobile Header / Hamburger Toggle */}
        <div className="md:hidden p-4 flex items-center justify-between border-b border-[rgb(var(--border-main))] bg-[rgb(var(--bg-sidebar))]">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-black text-white rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-2">
             <div className="bg-black text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center transform -rotate-45">
               <Triangle className="fill-current w-3 h-3 transform rotate-45" />
             </div>
             <span className="font-black text-sm tracking-tighter uppercase">SharkTask</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
