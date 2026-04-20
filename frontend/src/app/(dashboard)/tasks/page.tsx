"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CircleDashed, Loader2, Search, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface Task {
  task_id: number;
  project_id: number;
  title: string;
  due_date: string | null;
  status: 'Open' | 'In_Progress' | 'Review' | 'Closed';
  project: { title: string };
  assignee: { username: string };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/users/me/tasks');
        setTasks(res.data);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleStatusClick = async (task: Task) => {
    // Determine next status cycle: Open -> In_Progress -> Closed -> Open
    let nextStatus: Task['status'] = 'Open';
    if (task.status === 'Open') nextStatus = 'In_Progress';
    else if (task.status === 'In_Progress') nextStatus = 'Closed';
    else if (task.status === 'Closed') nextStatus = 'Open';

    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: nextStatus } : t));

    // Send API Request
    try {
      await api.patch(`/projects/${task.project_id}/tasks/${task.task_id}/status`, {
        status: nextStatus
      });
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert if failed
      setTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: task.status } : t));
    }
  };

  const isOverdue = (due_date: string | null, status: string) =>
    due_date && status !== 'Closed' && new Date(due_date) < new Date();
  const isDueSoon = (due_date: string | null, status: string) => {
    if (!due_date || status === 'Closed') return false;
    const diff = new Date(due_date).getTime() - Date.now();
    return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
  };

  const filteredTasks = useMemo(() =>
    searchQuery ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) : tasks
  , [tasks, searchQuery]);

  const getProgressVisuals = (status: Task['status']) => {
    switch (status) {
      case 'Closed': return { width: '100%', bg: 'bg-[#16a34a]', textBg: 'bg-[#16a34a]/10 text-[#16a34a] border-2 border-[#16a34a]/20', label: 'Done' };
      case 'In_Progress': return { width: '50%', bg: 'bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6]', textBg: 'bg-[#5EE1CD] text-black shadow-[#5EE1CD]/30 shadow-lg', label: 'In Progress' };
      case 'Review': return { width: '80%', bg: 'bg-gradient-to-r from-[#A855F7] to-[#ec4899]', textBg: 'bg-[#A855F7] text-white shadow-lg', label: 'Review' };
      default: return { width: '10%', bg: 'bg-gray-300', textBg: 'bg-gray-100 text-gray-500 border-2 border-gray-200', label: 'Open' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full p-4 md:p-10 flex flex-col">
      <header className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#A855F7] inline-block pb-2">My Tasks</h2>
          <p className="font-bold text-gray-500 mt-4 text-lg">Your assigned tasks. Click a task to open it, or click status to cycle it.</p>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border-2 border-gray-100 focus-within:border-[#A855F7] transition-colors shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="outline-none font-bold text-sm w-44 bg-transparent" />
          {searchQuery && <button onClick={() => setSearchQuery('')}><XCircle className="w-4 h-4 text-gray-400" /></button>}
        </div>
      </header>

      <div className="w-full flex-1 overflow-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center bg-white rounded-[40px] p-20 shadow-xl border-4 border-gray-100">
            <h3 className="text-2xl font-black text-gray-400 uppercase">No tasks found!</h3>
            <p className="text-gray-500 mt-2 font-bold">You are totally free right now.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center bg-white rounded-[40px] p-20 shadow-xl border-4 border-gray-100">
            <h3 className="text-2xl font-black text-gray-400 uppercase">{searchQuery ? 'No matches found' : 'No tasks found!'}</h3>
            <p className="text-gray-500 mt-2 font-bold">{searchQuery ? 'Try a different search term.' : 'You are totally free right now.'}</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:flex items-center px-8 py-4 mb-4 text-xs font-black uppercase text-gray-400 tracking-widest">
              <div className="w-1/4">Task Name</div>
              <div className="w-1/6">Project</div>
              <div className="w-1/6">Assignment</div>
              <div className="w-1/6">Due Date</div>
              <div className="w-1/6 text-center">Status</div>
              <div className="w-1/6 text-right pr-4">Progress</div>
            </div>

            {/* Task Rows */}
            <div className="space-y-6">
              {filteredTasks.map((task) => {
                const visual = getProgressVisuals(task.status);
                const overdue = isOverdue(task.due_date, task.status);
                const dueSoon = isDueSoon(task.due_date, task.status);
                return (
                  <div 
                    key={task.task_id} 
                    className="bg-white rounded-[30px] p-6 shadow-xl border-4 border-transparent hover:border-[#5EE1CD]/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row md:items-center gap-4 group"
                  >
                    
                    {/* Task Name */}
                    <div className="md:w-1/4 flex items-center gap-4 overflow-hidden">
                      {task.status === 'Closed' ? (
                      <CheckCircle2 className="text-[#16a34a] w-8 h-8 flex-shrink-0" />
                    ) : (
                      <CircleDashed className="text-gray-300 group-hover:text-[#5EE1CD] w-8 h-8 flex-shrink-0 transition-colors" />
                    )}
                    <div className="min-w-0">
                      <span className="font-black text-xl text-gray-900 truncate block" title={task.title}>{task.title}</span>
                      <div className="flex gap-2 mt-0.5">
                        {overdue && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">OVERDUE</span>}
                        {dueSoon && !overdue && <span className="text-[9px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded-full">DUE SOON</span>}
                      </div>
                    </div>
                    </div>

                    {/* Project */}
                    <div className="md:w-1/6 font-bold text-gray-500 flex flex-col overflow-hidden">
                      <span className="md:hidden text-xs text-gray-400 uppercase tracking-widest mb-1">Project</span>
                      <span className="truncate">{task.project.title}</span>
                    </div>

                    {/* Assignment */}
                    <div className="md:w-1/6 flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 flex-shrink-0 bg-[#A855F7]/20 rounded-full flex items-center justify-center text-sm font-black text-[#A855F7] uppercase">
                        {task.assignee.username.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800 truncate">{task.assignee.username}</span>
                    </div>

                    {/* Due Date */}
                    <div className={`md:w-1/6 font-bold ${overdue ? 'text-red-500' : dueSoon ? 'text-yellow-600' : 'text-[#3B82F6]'}`}>
                      <span className="md:hidden text-xs text-gray-400 uppercase tracking-widest block mb-1">Due Date</span>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </div>

                    {/* Status (Clickable) */}
                    <div className="md:w-1/6 flex md:justify-center cursor-pointer transform hover:scale-105 transition-transform active:scale-95" onClick={() => handleStatusClick(task)}>
                      <div className={`font-black text-xs uppercase tracking-widest py-3 px-6 rounded-full w-full max-w-[140px] text-center select-none ${visual.textBg}`}>
                        {visual.label}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="md:w-1/6 flex justify-end">
                      <div className="w-full md:w-32 h-4 bg-gray-100 rounded-full overflow-hidden flex relative shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${visual.bg}`}
                          style={{ width: visual.width }}
                        >
                          {task.status !== 'Closed' && task.status !== 'Open' && (
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-1/2 -skew-x-12 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
