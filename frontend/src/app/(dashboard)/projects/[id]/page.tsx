"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, FolderOpen, ChevronRight, CircleDashed, CheckCircle2,
  Plus, Trash2, UserPlus, Search, Archive, XCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Member { user_id: number; username: string; email: string; role: string; }
interface TaskNode {
  task_id: number; title: string; status: string; priority: string; due_date: string | null;
  sub_tasks: TaskNode[]; assignee: { user_id: number; username: string } | null;
}
interface ProjectInfo { project_id: number; title: string; status: string; owner_id: number; }

const isOverdue = (due_date: string | null, status: string) =>
  due_date && status !== 'Closed' && new Date(due_date) < new Date();
const isDueSoon = (due_date: string | null, status: string) => {
  if (!due_date || status === 'Closed') return false;
  const diff = new Date(due_date).getTime() - Date.now();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
};

export default function ProjectDetailsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [tasksTree, setTasksTree] = useState<TaskNode[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<{ user_id: number; role: string } | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', assignee_id: '', due_date: '' });

  const fetchTasks = useCallback(async () => {
    const res = await api.get(`/projects/${projectId}/tasks`);
    setTasksTree(res.data);
  }, [projectId]);

  const fetchMembers = useCallback(async () => {
    const res = await api.get(`/projects/${projectId}/members`);
    setMembers(res.data);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const init = async () => {
      try {
        const [usersRes, projectsRes, userRes] = await Promise.all([
          api.get('/users'), api.get('/projects'), api.get('/auth/me')
        ]);
        setAllUsers(usersRes.data);
        setCurrentUser(userRes.data);
        const proj = projectsRes.data.find((p: ProjectInfo) => p.project_id === Number(projectId));
        if (proj) setProjectInfo(proj);
        await Promise.all([fetchTasks(), fetchMembers()]);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    init();
  }, [projectId, fetchTasks, fetchMembers]);

  const flattenTree = (nodes: TaskNode[]): TaskNode[] =>
    nodes.flatMap(n => [n, ...flattenTree(n.sub_tasks || [])]);

  const isFiltering = searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all';

  const filteredTasks = useMemo(() => {
    if (!isFiltering) return tasksTree;
    return flattenTree(tasksTree).filter(t => {
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchAssignee = filterAssignee === 'all' ||
        (filterAssignee === 'unassigned' ? !t.assignee : t.assignee?.user_id === Number(filterAssignee));
      return matchSearch && matchStatus && matchPriority && matchAssignee;
    });
  }, [tasksTree, searchQuery, filterStatus, filterPriority, filterAssignee, isFiltering]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: newTask.title, description: newTask.description || undefined,
        priority: newTask.priority, assignee_id: newTask.assignee_id || undefined,
        due_date: newTask.due_date || undefined,
      });
      await fetchTasks(); setShowCreateModal(false);
      setNewTask({ title: '', description: '', priority: 'Medium', assignee_id: '', due_date: '' });
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create task'); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault(); setAddMemberError('');
    try { await api.post(`/projects/${projectId}/members`, { username: addMemberUsername }); await fetchMembers(); setAddMemberUsername(''); }
    catch (err: any) { setAddMemberError(err.response?.data?.error || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${projectId}/members/${userId}`); await fetchMembers(); }
    catch (err: any) { alert(err.response?.data?.error || 'Cannot remove'); }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this project?')) return;
    try { await api.patch(`/projects/${projectId}/archive`); router.push('/'); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to archive'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('PERMANENTLY DELETE this project and all tasks? This cannot be undone.')) return;
    try { await api.delete(`/projects/${projectId}`); router.push('/'); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  const priorityStyle = (p: string) => ({ High: 'bg-red-100 text-red-600', Low: 'bg-green-100 text-green-600' } as any)[p] || 'bg-yellow-100 text-yellow-700';
  const isOwner = projectInfo?.owner_id === currentUser?.user_id || currentUser?.role === 'Admin';

  const renderTaskRow = (node: TaskNode, depth = 0): React.ReactNode => {
    const overdue = isOverdue(node.due_date, node.status);
    const dueSoon = isDueSoon(node.due_date, node.status);
    return (
      <div key={node.task_id} className="mb-2">
        <div
          onClick={() => router.push(`/projects/${projectId}/tasks/${node.task_id}`)}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer ${overdue ? 'border-red-200 hover:border-red-400' : 'border-transparent hover:border-[#3B82F6]/30'}`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {node.status === 'Closed'
              ? <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
              : <CircleDashed className="text-gray-300 group-hover:text-[#3B82F6] w-5 h-5 flex-shrink-0 transition-colors" />}
            <span className="font-bold text-gray-800 truncate">{node.title}</span>
            {overdue && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">OVERDUE</span>}
            {dueSoon && !overdue && <span className="text-[9px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded-full flex-shrink-0">DUE SOON</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {node.assignee && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <div className="w-4 h-4 bg-[#A855F7] rounded-full flex items-center justify-center text-white text-[8px] font-black">{node.assignee.username.charAt(0).toUpperCase()}</div>
                <span className="text-xs font-bold text-gray-600 hidden md:block">{node.assignee.username}</span>
              </div>
            )}
            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${priorityStyle(node.priority)}`}>{node.priority}</span>
            <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
              node.status === 'Closed' ? 'bg-green-100 text-green-600' : node.status === 'In_Progress' ? 'bg-blue-100 text-blue-600' :
              node.status === 'Review' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
            }`}>{node.status.replace('_', ' ')}</div>
          </div>
        </div>
        {!isFiltering && node.sub_tasks?.length > 0 && (
          <div className="mt-1 border-l-4 border-gray-100 ml-4 pl-4 space-y-1">
            {node.sub_tasks.map(child => renderTaskRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-full p-4 md:p-8 flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-[18px] flex items-center justify-center text-[#3B82F6] flex-shrink-0"><FolderOpen className="w-7 h-7" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mb-1"><span>Projects</span><ChevronRight className="w-3 h-3" /><span>#{projectId}</span></div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">{projectInfo?.title || 'Project Workspace'}</h2>
        </div>
        {isOwner && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleArchive} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-yellow-50 text-gray-500 hover:text-yellow-600 rounded-2xl font-bold text-sm transition-colors"><Archive className="w-4 h-4" /> Archive</button>
            <button onClick={handleDeleteProject} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-2xl font-bold text-sm transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        )}
      </header>

      <div className="flex gap-2 border-b-2 border-gray-100 pb-0">
        {(['tasks', 'members'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-black text-sm uppercase tracking-widest rounded-t-[16px] transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900 border-b-2 border-white -mb-[2px]' : 'text-gray-400 hover:text-gray-700'}`}>
            {tab === 'tasks' ? `🗂 Tasks (${tasksTree.length})` : `👥 Members (${members.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-3xl rounded-[30px] shadow-2xl border-4 border-white p-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'tasks' && (
          <>
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <h3 className="font-black text-xl uppercase tracking-widest text-gray-800 flex-1">Task List</h3>
              <button onClick={() => setShowCreateModal(true)} className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Task
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3 mb-5 p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 flex-1 min-w-[180px] border-2 border-gray-100 focus-within:border-[#3B82F6] transition-colors">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="outline-none font-bold text-sm bg-transparent w-full" />
                {searchQuery && <button onClick={() => setSearchQuery('')}><XCircle className="w-4 h-4 text-gray-400" /></button>}
              </div>
              {[
                { value: filterStatus, set: setFilterStatus, opts: [['all','All Status'],['Open','Open'],['In_Progress','In Progress'],['Review','Review'],['Closed','Closed']] },
                { value: filterPriority, set: setFilterPriority, opts: [['all','All Priority'],['High','High'],['Medium','Medium'],['Low','Low']] },
                { value: filterAssignee, set: setFilterAssignee, opts: [['all','All Assignees'],['unassigned','Unassigned'],...members.map(m=>[String(m.user_id),m.username])] },
              ].map(({ value, set, opts }, i) => (
                <select key={i} value={value} onChange={e => set(e.target.value)}
                  className={`bg-white border-2 rounded-xl px-3 py-2 font-bold text-sm outline-none transition-colors ${value !== 'all' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-gray-100 text-gray-500'}`}>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              {isFiltering && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); setFilterAssignee('all'); }}
                  className="text-sm font-bold text-gray-400 hover:text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> Clear</button>
              )}
            </div>

            {isFiltering && <p className="text-xs font-black text-gray-400 uppercase mb-3">{filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''}</p>}

            {isLoading ? <div className="flex justify-center h-32 items-center"><Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" /></div>
              : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold mb-4">{isFiltering ? 'No tasks match your filters.' : 'No tasks yet.'}</p>
                  {!isFiltering && <button onClick={() => setShowCreateModal(true)} className="bg-black text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest">Create First Task</button>}
                </div>
              ) : <div>{filteredTasks.map(node => renderTaskRow(node))}</div>}
          </>
        )}

        {activeTab === 'members' && (
          <>
            <div className="mb-6">
              <h3 className="font-black text-xl uppercase tracking-widest text-gray-800 mb-4">Add Member</h3>
              <form onSubmit={handleAddMember} className="flex gap-3">
                <input value={addMemberUsername} onChange={e => setAddMemberUsername(e.target.value)} placeholder="Enter exact username..."
                  className="flex-1 bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-3 font-bold outline-none transition-colors" />
                <button type="submit" className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add</button>
              </form>
              {addMemberError && <p className="text-red-500 font-bold text-sm mt-2">{addMemberError}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map(member => (
                <div key={member.user_id} className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4 border-2 border-transparent hover:border-[#A855F7]/30 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-full flex items-center justify-center text-white text-lg font-black flex-shrink-0">{member.username.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900">{member.username}</p>
                    <p className="text-xs text-gray-500 font-bold truncate">{member.email}</p>
                    <span className="text-[10px] font-black uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{member.role}</span>
                  </div>
                  <button onClick={() => handleRemoveMember(member.user_id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-8">
            <h3 className="font-black text-2xl uppercase text-gray-900 mb-6">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <input required value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title *" className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors" />
              <textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Description (optional)" className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 font-bold outline-none appearance-none">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Due Date</label>
                  <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Assign to</label>
                <select value={newTask.assignee_id} onChange={e => setNewTask(p => ({ ...p, assignee_id: e.target.value }))} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 font-bold outline-none appearance-none">
                  <option value="">— Unassigned —</option>
                  {allUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-800 transition-colors">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
