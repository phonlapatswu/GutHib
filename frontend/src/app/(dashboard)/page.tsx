"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, X } from 'lucide-react';
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
  role: string;
  avatar_url: string | null;
}

interface Project {
  project_id: number;
  title: string;
  end_date: string | null;
  created_at: string;
  members: Array<{ user: User }>;
  _count?: { tasks: number; members: number };
  completionRate?: number;
}

export default function DashboardHome() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTeammates, setProjectTeammates] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [note, setNote] = useState('');
  const [currentUser, setCurrentUser] = useState<{ user_id: number; role: string } | null>(null);
  
  // New Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    description: '',
    end_date: '',
    selectedMembers: [] as number[],
  });
  const [memberEmailInput, setMemberEmailInput] = useState('');

  useEffect(() => {
    // Load local notepad
    const savedNote = localStorage.getItem('sharkTaskNote');
    if (savedNote) setNote(savedNote);

    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes, userRes, allUsersRes] = await Promise.all([
          api.get('/users/me/tasks'),
          api.get('/projects'),
          api.get('/auth/me'),
          api.get('/users'),
        ]);

        setTasks(tasksRes.data.slice(0, 4));
        setProjects(projectsRes.data);
        setCurrentUser(userRes.data);
        setAllUsers(allUsersRes.data);
        
        // Populate specific teammates for display count (unique people across all projects, excluding self)
        const currentId = userRes.data.user_id;
        const allTeammates = projectsRes.data.flatMap((p: Project) => p.members.map(m => m.user));
        const uniqueTeammates = Array.from(new Map(allTeammates.map((u: User) => [u.user_id, u])).values()) as User[];
        const filteredTeammates = uniqueTeammates.filter(u => u.user_id !== currentId);
        setProjectTeammates(filteredTeammates);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title) return;

    try {
      const res = await api.post('/projects', {
        title: newProjectForm.title,
        description: newProjectForm.description,
        end_date: newProjectForm.end_date || null,
        members: newProjectForm.selectedMembers,
      });
      setProjects([res.data, ...projects]);
      setShowProjectModal(false);
      setNewProjectForm({ title: '', description: '', end_date: '', selectedMembers: [] });
    } catch (error: any) {
      alert("Failed to create project: " + (error.response?.data?.error || "Unknown"));
    }
  };

  const addMemberByEmail = () => {
    if (!memberEmailInput) return;
    // Search in all users so we can invite anyone in the system
    const userFound = allUsers.find(u => u.email.toLowerCase() === memberEmailInput.toLowerCase());
    
    if (userFound) {
      if (userFound.user_id === currentUser?.user_id) {
        alert("You are already the owner of this project!");
      } else if (newProjectForm.selectedMembers.includes(userFound.user_id)) {
        alert("This member is already added.");
      } else {
        setNewProjectForm(prev => ({
          ...prev,
          selectedMembers: [...prev.selectedMembers, userFound.user_id]
        }));
      }
      setMemberEmailInput('');
    } else {
      alert(`User with email "${memberEmailInput}" not found in our records.`);
    }
  };

  const removeMember = (userId: number) => {
    setNewProjectForm(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter(id => id !== userId)
    }));
  };

  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      
      <header className="mb-12">
        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-[rgb(var(--text-main))] border-b-8 border-[#5EE1CD] inline-block pb-2">Overview</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column */}
        <div className="space-y-10">
          
          {/* Assigned Task Widget */}
          <div className="bg-[rgb(var(--bg-surface))] rounded-[40px] p-8 shadow-2xl border-4 border-[#3B82F6]/10 transform transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-[rgb(var(--text-main))]">My Tasks</h3>
              <span className="text-xs font-bold text-[rgb(var(--text-dim))] uppercase tracking-widest">{tasks.length} pending</span>
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
          <div className="bg-[rgb(var(--bg-surface))] rounded-[40px] p-8 shadow-2xl border-4 border-[#A855F7]/10 transform transition-transform hover:-translate-y-1">
             <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-[rgb(var(--text-main))]">Team</h3>
              <span className="text-xs font-bold text-[rgb(var(--text-dim))] uppercase tracking-widest">{projectTeammates.length} teammates</span>
            </div>
            
            <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {projects.length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-4 italic">No project teams yet.</p>
              ) : projects.map((p) => (
                <div key={p.project_id} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-[#A855F7] uppercase tracking-widest bg-[#A855F7]/10 px-3 py-1 rounded-full">
                       {p.title}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {p.members.map(({ user }) => (
                      <div key={user.user_id} className="bg-gray-50 hover:bg-white border-2 border-transparent hover:border-[#A855F7]/20 rounded-2xl p-4 flex flex-col items-center text-center transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-[#f8fafc] flex items-center justify-center font-black text-gray-400 group-hover:text-black transition-colors overflow-hidden mb-2 border-2 border-white shadow-sm">
                          {user.avatar_url ? (
                            <img src={`${API_BASE}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <p className="font-black text-[10px] text-gray-900 uppercase truncate w-full">{user.username}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-10">
          
          {/* Project Widget with completion stats */}
          <div className="bg-[rgb(var(--bg-surface))] rounded-[40px] p-8 shadow-2xl border-4 border-[rgb(var(--border-main))] transform transition-transform hover:-translate-y-1 flex flex-col h-[400px]">
             <div className="flex justify-between items-end mb-6">
              <h3 className="font-black text-2xl uppercase text-[rgb(var(--text-main))]">Projects</h3>
              <span className="text-xs font-bold text-[rgb(var(--text-dim))] uppercase tracking-widest">{projects.length} active</span>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {isManager && (
                <button onClick={() => setShowProjectModal(true)} className="w-full bg-black text-white hover:bg-gray-800 transition-colors p-5 rounded-[20px] flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-black/20 group sticky top-0 z-10">
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
                  className="bg-[rgb(var(--bg-card))] border-2 border-[rgb(var(--border-main))] hover:border-[#A855F7]/50 p-4 rounded-[20px] transition-all cursor-pointer group hover:shadow-md block"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-[rgb(var(--bg-app))] group-hover:bg-[#A855F7]/10 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0 transition-colors">🚀</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-[rgb(var(--text-main))] uppercase tracking-tight truncate">{project.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-400">{project._count?.tasks || 0} tasks</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs font-bold text-[#A855F7]">{project.completionRate ?? 0}% done</span>
                        {project.end_date && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                              Due: {new Date(project.end_date).toLocaleDateString()}
                            </span>
                          </>
                        )}
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


          <div className="bg-gradient-to-br from-[rgb(var(--bg-surface))] to-[rgb(var(--bg-card))] rounded-[40px] p-8 shadow-2xl border-4 border-[rgb(var(--border-main))] h-[420px] flex flex-col relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
             <div className="flex justify-between items-end mb-6 relative z-10">
              <h3 className="font-black text-2xl uppercase text-[rgb(var(--text-main))]">Private Notepad</h3>
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">Auto-saved</span>
            </div>
            
            <textarea 
              value={note}
              onChange={handleNoteChange}
              className="w-full flex-1 bg-[rgb(var(--bg-app))]/50 backdrop-blur-sm border-2 border-[rgb(var(--border-main))] focus:border-[#5EE1CD] rounded-[24px] p-6 resize-none outline-none text-base text-[rgb(var(--text-main))] placeholder-[rgb(var(--text-dim))] shadow-inner transition-colors relative z-10 font-medium custom-scrollbar"
              placeholder="Jot down notes, spells, or secret plans here... (Saved locally to your browser)"
            ></textarea>
          </div>

        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border-4 border-white animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-10">
              <h3 className="font-black text-3xl uppercase text-gray-900 mb-2">Launch Project</h3>
              <p className="text-gray-400 font-bold text-sm mb-8">Set sail with a new team and mission.</p>
              
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Project Title</label>
                  <input 
                    type="text" 
                    value={newProjectForm.title}
                    onChange={e => setNewProjectForm({...newProjectForm, title: e.target.value})}
                    required
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#5EE1CD] rounded-2xl px-6 py-4 font-bold outline-none transition-colors"
                    placeholder="e.g. Operation Deep Blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-1 block">End Date (Target)</label>
                  <input 
                    type="date" 
                    value={newProjectForm.end_date}
                    onChange={e => setNewProjectForm({...newProjectForm, end_date: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#5EE1CD] rounded-2xl px-6 py-4 font-bold outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Team Members</label>
                  
                  {/* Email Input Field */}
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="email"
                      value={memberEmailInput}
                      onChange={e => setMemberEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMemberByEmail())}
                      placeholder="Type email to add member..."
                      className="flex-1 bg-gray-50 border-2 border-gray-100 focus:border-[#A855F7] rounded-2xl px-6 py-4 font-bold outline-none transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={addMemberByEmail}
                      className="bg-[#A855F7] text-white px-6 rounded-2xl font-black text-sm hover:bg-[#9333ea] transition-colors shadow-lg shadow-[#A855F7]/20"
                    >
                      ADD
                    </button>
                  </div>

                  {/* Selected Members Chips */}
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-[28px] border-2 border-gray-100 min-h-[60px]">
                    {newProjectForm.selectedMembers.length === 0 ? (
                        <p className="text-[10px] text-gray-400 font-bold italic m-auto">No members added yet.</p>
                    ) : (
                        newProjectForm.selectedMembers.map(userId => {
                            return (
                                <div key={userId} className="bg-white border border-[#A855F7]/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <span className="text-xs font-black text-gray-700">{allUsers.find(u => u.user_id === userId)?.email}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => removeMember(userId)}
                                        className="bg-gray-100 hover:bg-red-100 p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                  </div>
                  
                  <p className="text-[10px] text-gray-400 font-bold mt-2 ml-2 italic">* You (Owner) are added automatically.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowProjectModal(false)}
                    className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-800 transition-colors shadow-xl shadow-black/20"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
