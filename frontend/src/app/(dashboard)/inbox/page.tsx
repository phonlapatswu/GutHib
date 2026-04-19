"use client";

import { useEffect, useState } from 'react';
import { Loader2, Bell, ShieldAlert, CheckCircle, Flame, GitMerge } from 'lucide-react';
import api from '@/lib/api';

interface Log {
  log_id: number;
  action: 'Claim' | 'Submit' | 'Request_Changes' | 'Merge';
  message: string | null;
  timestamp: string;
  user: { username: string };
  task: { title: string, project: { title: string } };
}

export default function InboxPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get('/users/me/inbox');
        setLogs(res.data);
      } catch (error) {
        console.error("Failed to fetch inbox logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInbox();
  }, []);

  const getLogVisuals = (action: Log['action']) => {
    switch (action) {
      case 'Claim': return { icon: <Flame className="w-5 h-5" />, color: 'bg-[#3B82F6] text-white', label: 'Claimed Task' };
      case 'Submit': return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-[#5EE1CD] text-black', label: 'Submitted Work' };
      case 'Request_Changes': return { icon: <ShieldAlert className="w-5 h-5" />, color: 'bg-[#ec4899] text-white', label: 'Requested Changes' };
      case 'Merge': return { icon: <GitMerge className="w-5 h-5" />, color: 'bg-[#A855F7] text-white', label: 'Merged Task' };
      default: return { icon: <Bell className="w-5 h-5" />, color: 'bg-gray-200 text-gray-500', label: 'System Alert' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full p-4 md:p-10 flex flex-col">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#ec4899] inline-block pb-2">Inbox</h2>
          <p className="font-bold text-gray-500 mt-4 text-lg">Your activity feed and system notifications.</p>
        </div>
      </header>

      <div className="w-full flex-1 overflow-auto custom-scrollbar bg-white/50 backdrop-blur-3xl rounded-[40px] shadow-2xl border-4 border-white p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-12 h-12 text-[#ec4899] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Bell className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest">All caught up!</h3>
            <p className="text-gray-500 font-bold mt-2">No new notifications in your inbox.</p>
          </div>
        ) : (
          <div className="relative border-l-4 border-gray-100 ml-6 space-y-10">
            {logs.map((log) => {
              const visual = getLogVisuals(log.action);
              return (
                <div key={log.log_id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[22px] top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${visual.color}`}>
                    {visual.icon}
                  </div>
                  
                  {/* Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-transparent hover:border-[#ec4899]/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-[10px] uppercase font-black tracking-widest text-[#ec4899]">
                        {visual.label}
                      </p>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                   
                    <h4 className="text-xl font-bold text-gray-900 leading-tight">
                      <span className="font-black text-[#A855F7]">{log.user.username}</span> performed <span className="font-black">{log.action.replace('_', ' ')}</span> on task
                    </h4>
                    
                    <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-1">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Target Task</span>
                      <p className="font-bold text-gray-800">{log.task.title}</p>
                      <p className="text-xs font-bold text-gray-500">From project: {log.task.project.title}</p>
                    </div>

                    {log.message && (
                      <p className="mt-4 text-gray-600 font-medium italic">
                        "{log.message}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
