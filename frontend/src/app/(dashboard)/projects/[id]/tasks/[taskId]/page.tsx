"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, CheckCircle2, Clock, AlertTriangle, Send, GitMerge, XCircle, Edit2, Trash2, Save, X } from 'lucide-react';
import api from '@/lib/api';

interface TaskDetail {
  task_id: number; project_id: number; title: string; description: string | null;
  status: string; priority: string; due_date: string | null; created_at: string;
  started_at: string | null; completed_at: string | null;
  assignee: { user_id: number; username: string; email: string } | null;
  project: { project_id: number; title: string; owner_id: number };
  commits: Array<{ log_id: number; action: string; message: string | null; timestamp: string; user: { username: string } }>;
  submissions: Array<{ submission_id: number; content: string | null; file_url: string | null; submitted_at: string; worker: { username: string } }>;
}

interface CurrentUser { user_id: number; username: string; role: string; }

export default function TaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [allUsers, setAllUsers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '', assignee_id: '', due_date: '' });
  const [submitContent, setSubmitContent] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTask = useCallback(async () => {
    const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    setTask(res.data);
    setEditForm({
      title: res.data.title,
      description: res.data.description || '',
      priority: res.data.priority,
      assignee_id: res.data.assignee?.user_id?.toString() || '',
      due_date: res.data.due_date ? res.data.due_date.split('T')[0] : '',
    });
  }, [projectId, taskId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, usersRes] = await Promise.all([api.get('/auth/me'), api.get('/users')]);
        setCurrentUser(userRes.data);
        setAllUsers(usersRes.data);
        await fetchTask();
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    init();
  }, [fetchTask]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        assignee_id: editForm.assignee_id || undefined,
        due_date: editForm.due_date || undefined,
      });
      await fetchTask();
      setIsEditing(false);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to save'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task permanently? This cannot be undone.')) return;
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    router.push(`/projects/${projectId}`);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitContent && !submitFileUrl) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${taskId}/submit`, {
        content: submitContent || undefined,
        file_url: submitFileUrl || undefined,
      });
      setSubmitContent('');
      setSubmitFileUrl('');
      await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Submission failed'); }
  };

  const handleReview = async (action: 'Merge' | 'Request_Changes') => {
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}/review`, { action, message: reviewMessage });
      setReviewMessage('');
      await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Review failed'); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-[#A855F7]" /></div>;
  if (!task) return <div className="flex justify-center items-center h-full"><p className="text-gray-400 font-bold">Task not found.</p></div>;

  const isOwnerOrRequester = currentUser?.role === 'Requester' || currentUser?.role === 'Admin' || task.project.owner_id === currentUser?.user_id;
  const isAssignee = task.assignee?.user_id === currentUser?.user_id;
  const canSubmit = isAssignee && task.status === 'In_Progress';
  const canReview = isOwnerOrRequester && task.status === 'Review';

  const statusColors: Record<string, string> = {
    Open: 'bg-gray-100 text-gray-500 border border-gray-200',
    In_Progress: 'bg-blue-100 text-blue-600 border border-blue-200',
    Review: 'bg-purple-100 text-purple-600 border border-purple-200',
    Closed: 'bg-green-100 text-green-600 border border-green-200',
  };

  return (
    <div className="max-w-5xl mx-auto h-full p-4 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      
      {/* Back Button */}
      <button onClick={() => router.push(`/projects/${projectId}`)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors self-start">
        <ChevronLeft className="w-5 h-5" /> Back to Project
      </button>

      {/* Task Header Card */}
      <div className="bg-white rounded-[40px] shadow-2xl border-4 border-gray-100 p-8">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              className="text-3xl font-black bg-gray-50 border-2 border-[#5EE1CD] rounded-2xl px-5 py-3 outline-none w-full" />
            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Description..."
              className="bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-3 outline-none resize-none font-medium" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 font-bold outline-none">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Due Date</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 font-bold outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Assignee</label>
                <select value={editForm.assignee_id} onChange={e => setEditForm(p => ({ ...p, assignee_id: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 font-bold outline-none">
                  <option value="">— Unassigned —</option>
                  {allUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-black text-white py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-gray-800">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-black text-gray-900 leading-tight flex-1 mr-4">{task.title}</h1>
              {isOwnerOrRequester && (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-100 hover:bg-[#5EE1CD]/20 rounded-2xl text-gray-500 hover:text-gray-900 transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={handleDelete} className="p-3 bg-gray-100 hover:bg-red-50 rounded-2xl text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {task.description && <p className="text-gray-600 font-medium mb-6 leading-relaxed">{task.description}</p>}

            <div className="flex flex-wrap gap-3">
              <span className={`text-xs font-black uppercase px-4 py-2 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-500'}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-black uppercase px-4 py-2 rounded-full ${
                task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Low' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
              }`}>{task.priority} Priority</span>
              {task.assignee ? (
                <span className="text-xs font-black px-4 py-2 rounded-full bg-[#A855F7]/10 text-[#A855F7] flex items-center gap-1">
                  <div className="w-4 h-4 bg-[#A855F7] rounded-full flex items-center justify-center text-white text-[8px]">
                    {task.assignee.username.charAt(0).toUpperCase()}
                  </div>
                  {task.assignee.username}
                </span>
              ) : <span className="text-xs font-black px-4 py-2 rounded-full bg-gray-100 text-gray-500">Unassigned</span>}
              {task.due_date && (
                <span className="text-xs font-black px-4 py-2 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Due {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── SUBMIT WORK (Worker Only) ─── */}
        {canSubmit && (
          <div className="bg-white rounded-[30px] shadow-xl border-4 border-[#5EE1CD]/30 p-6">
            <h3 className="font-black text-lg uppercase text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#5EE1CD]" /> Submit Your Work
            </h3>
            <form onSubmit={handleSubmitWork} className="flex flex-col gap-3">
              <textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)}
                rows={4} placeholder="Describe your completed work..."
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 outline-none font-medium resize-none transition-colors" />
              <input value={submitFileUrl} onChange={e => setSubmitFileUrl(e.target.value)}
                placeholder="File URL (optional)"
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 outline-none font-medium transition-colors" />
              <button type="submit" className="w-full bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6] text-white py-3 rounded-2xl font-black uppercase text-sm shadow-lg hover:shadow-xl transition-all">
                Submit for Review
              </button>
            </form>
          </div>
        )}

        {/* ─── REVIEW PANEL (Requester Only, status=Review) ─── */}
        {canReview && (
          <div className="bg-white rounded-[30px] shadow-xl border-4 border-[#A855F7]/30 p-6">
            <h3 className="font-black text-lg uppercase text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#A855F7]" /> Review Submission
            </h3>
            {task.submissions[0] && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-2">Submitted by {task.submissions[0].worker.username}</p>
                <p className="font-medium text-gray-700">{task.submissions[0].content}</p>
                {task.submissions[0].file_url && (
                  <a href={task.submissions[0].file_url} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] text-xs font-bold mt-2 block hover:underline">
                    📎 View Attachment
                  </a>
                )}
              </div>
            )}
            <textarea value={reviewMessage} onChange={e => setReviewMessage(e.target.value)}
              rows={2} placeholder="Feedback message (optional)..."
              className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#A855F7] rounded-2xl px-4 py-3 outline-none font-medium mb-3 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => handleReview('Request_Changes')} className="flex-1 bg-red-50 text-red-600 border-2 border-red-200 py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <XCircle className="w-4 h-4" /> Request Changes
              </button>
              <button onClick={() => handleReview('Merge')} className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-lg">
                <GitMerge className="w-4 h-4" /> Approve & Merge
              </button>
            </div>
          </div>
        )}

        {/* ─── ACTIVITY LOG ─── */}
        <div className={`bg-white rounded-[30px] shadow-xl border-4 border-gray-100 p-6 ${canSubmit || canReview ? '' : 'lg:col-span-2'}`}>
          <h3 className="font-black text-lg uppercase text-gray-800 mb-4">Activity Log</h3>
          {task.commits.length === 0 ? (
            <p className="text-gray-400 font-bold text-sm">No activity yet.</p>
          ) : (
            <div className="relative border-l-4 border-gray-100 ml-3 space-y-5">
              {task.commits.map(log => (
                <div key={log.log_id} className="relative pl-6">
                  <div className={`absolute -left-[14px] top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                    log.action === 'Merge' ? 'bg-green-500' :
                    log.action === 'Submit' ? 'bg-[#3B82F6]' :
                    log.action === 'Request_Changes' ? 'bg-red-500' : 'bg-[#A855F7]'
                  }`}>
                    {log.action.charAt(0)}
                  </div>
                  <p className="font-bold text-gray-800 text-sm"><span className="text-[#A855F7]">@{log.user.username}</span> → {log.action.replace('_', ' ')}</p>
                  {log.message && <p className="text-gray-500 text-xs font-medium mt-0.5 truncate">{log.message}</p>}
                  <p className="text-gray-400 text-[10px] font-bold mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
