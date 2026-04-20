"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface Task {
  task_id: number;
  title: string;
  due_date: string | null;
  status: string;
  project: { title: string };
}

interface User {
  user_id: number;
  username: string;
  email: string;
}

interface Project {
  project_id: number;
  title: string;
  created_at: string;
}

export default function DashboardHome() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [note, setNote] = useState('');
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    // Load local notepad
    const savedNote = localStorage.getItem('sharkTaskNote');
    if (savedNote) setNote(savedNote);

    const fetchData = async () => {
      try {
        const [tasksRes, usersRes, projectsRes, userRes] = await Promise.all([
          api.get('/users/me/tasks'),
          api.get('/users'),
          api.get('/projects'),
          api.get('/auth/me'),
        ]);

        setTasks(tasksRes.data.slice(0, 4));
        setTeam(usersRes.data);
        setProjects(projectsRes.data);
        setCurrentUser(userRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem('sharkTaskNote', e.target.value);
  };

  const handleCreateProject = async () => {
    const title = window.prompt("Enter new project title:");
    if (!title) return;

    try {
      const res = await api.post('/projects', { title });
      setProjects([res.data, ...projects]);
    } catch (error: any) {
      alert("Failed to create project: " + (error.response?.data?.error || "Unknown"));
    }
  };

  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      
      <header className="mb-12">
        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#5EE1CD] inline-block pb-2">Overview</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column */}
        <div className="space-y-10">
          
          {/* Assigned Task Widget */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-[#3B82F6]/10 transform transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-gray-800">My Tasks</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tasks.length} pending</span>
            </div>
            
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-gray-500 font-bold p-4 bg-gray-50 rounded-2xl">No tasks assigned yet. Time to chill! 🏖️</p>
              ) : tasks.map((task) => (
                <div key={task.task_id} className="bg-[#f8f9fa] border-l-8 border-[#5EE1CD] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-50 text-xs font-black uppercase text-gray-300">#{task.task_id}</div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-gray-900 text-lg w-10/12 truncate">{task.title}</h4>
                    <CheckCircle2 className={`${task.status === 'Closed' ? 'text-green-500' : 'text-gray-300'} w-6 h-6 hover:text-[#5EE1CD] transition-colors flex-shrink-0 z-10 relative`} />
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold mt-2">
                    <span className="text-gray-500 uppercase tracking-widest bg-gray-200 px-3 py-1 rounded-full truncate max-w-[120px]">{task.project.title}</span>
                    <span className="text-[#3B82F6] bg-blue-50 px-3 py-1 rounded-full">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* People Widget */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-[#A855F7]/10 transform transition-transform hover:-translate-y-1">
             <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-gray-800">Team</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{team.length} members</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {team.map((user) => (
                <div key={user.user_id} className="bg-[#f8f9fa] hover:bg-[#5EE1CD]/10 border-2 border-transparent hover:border-[#5EE1CD]/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-full p-1 mb-3 shadow-lg">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl font-black text-gray-700">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <p className="font-black text-sm text-gray-900 uppercase truncate w-full">{user.username}</p>
                  <p className="text-[10px] text-gray-500 font-bold truncate w-full mt-1">{user.email}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-10">
          
          {/* Project Widget with completion stats */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-gray-100 transform transition-transform hover:-translate-y-1 flex flex-col h-[400px]">
             <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-gray-800">Projects</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{projects.length} active</span>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {isManager && (
                <button onClick={handleCreateProject} className="w-full bg-black text-white hover:bg-gray-800 transition-colors p-5 rounded-[20px] flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-black/20 group sticky top-0 z-10">
                  <div className="bg-[#5EE1CD] rounded-full p-1 text-black group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  NEW PROJECT
                </button>
              )}
              
              {(projects as any[]).map((project) => (
                <Link 
                  href={`/projects/${project.project_id}`}
                  key={project.project_id} 
                  className="bg-white border-2 border-gray-100 hover:border-[#A855F7]/50 p-4 rounded-[20px] transition-all cursor-pointer group hover:shadow-md block"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-[#f1f5f9] group-hover:bg-[#A855F7]/10 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0 transition-colors">🚀</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-gray-900 uppercase tracking-tight truncate">{project.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-gray-400">{project._count?.tasks || 0} tasks</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs font-bold text-[#A855F7]">{project.completionRate ?? 0}% done</span>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6] transition-all duration-500"
                      style={{ width: `${project.completionRate ?? 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>


          {/* Private Notepad Widget */}
          <div className="bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] rounded-[40px] p-8 shadow-2xl border-4 border-gray-100 h-[420px] flex flex-col relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
             <div className="flex justify-between items-end mb-6 relative z-10">
              <h3 className="font-black text-2xl uppercase text-gray-800">Private Notepad</h3>
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">Auto-saved</span>
            </div>
            
            <textarea 
              value={note}
              onChange={handleNoteChange}
              className="w-full flex-1 bg-white/50 backdrop-blur-sm border-2 border-gray-200 focus:border-[#5EE1CD] rounded-[24px] p-6 resize-none outline-none text-base text-gray-800 placeholder-gray-400 shadow-inner transition-colors relative z-10 font-medium custom-scrollbar"
              placeholder="Jot down notes, spells, or secret plans here... (Saved locally to your browser)"
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
