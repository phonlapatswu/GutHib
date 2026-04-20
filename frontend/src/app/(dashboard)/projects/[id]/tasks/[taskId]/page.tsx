"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ChevronLeft, CheckCircle2, Clock, AlertTriangle, Send,
  GitMerge, XCircle, Edit2, Trash2, Save, X, Plus, MessageSquare, Paperclip, Calendar
} from 'lucide-react';
import api from '@/lib/api';

interface TaskDetail {
  task_id: number; project_id: number; title: string; description: string | null;
  status: string; priority: string; due_date: string | null; planned_start_date: string | null; 
  created_at: string; started_at: string | null; completed_at: string | null;
  assignees: Array<{ user: { user_id: number; username: string; email: string } }>;
  project: { project_id: number; title: string; owner_id: number };
  commits: Array<{ log_id: number; action: string; message: string | null; timestamp: string; user: { username: string } }>;
  submissions: Array<{ submission_id: number; content: string | null; file_url: string | null; submitted_at: string; worker: { username: string } }>;
}
interface Comment { comment_id: number; content: string; file_url: string | null; created_at: string; author: { user_id: number; username: string }; }
interface CurrentUser { user_id: number; username: string; role: string; }

const isOverdue = (due_date: string | null, status: string) =>
  due_date && status !== 'Closed' && new Date(due_date) < new Date();

const isDueSoon = (due_date: string | null, status: string) => {
  if (!due_date || status === 'Closed') return false;
  const diff = new Date(due_date).getTime() - Date.now();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
};

export default function TaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [allUsers, setAllUsers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);
  const [projectMembers, setProjectMembers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    title: '', 
    description: '', 
    priority: '', 
    assignee_ids: [] as number[], 
    due_date: '',
    planned_start_date: ''
  });
  const [submitContent, setSubmitContent] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentFileUrl, setCommentFileUrl] = useState('');
  const [showCommentFile, setShowCommentFile] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchTask = useCallback(async () => {
    const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    setTask(res.data);
    setEditForm({
      title: res.data.title,
      description: res.data.description || '',
      priority: res.data.priority,
      assignee_ids: res.data.assignees?.map((a: any) => a.user.user_id) || [],
      due_date: res.data.due_date ? res.data.due_date.split('T')[0] : '',
      planned_start_date: res.data.planned_start_date ? res.data.planned_start_date.split('T')[0] : '',
    });
  }, [projectId, taskId]);

  const fetchComments = useCallback(async () => {
    const res = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    setComments(res.data);
  }, [projectId, taskId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, usersRes, membersRes] = await Promise.all([
          api.get('/auth/me'), 
          api.get('/users'),
          api.get(`/projects/${projectId}/members`)
        ]);
        setCurrentUser(userRes.data);
        setAllUsers(usersRes.data);
        setProjectMembers(membersRes.data);
        await Promise.all([fetchTask(), fetchComments()]);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    init();
  }, [fetchTask, fetchComments]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, {
        title: editForm.title, description: editForm.description || undefined,
        priority: editForm.priority, assignee_ids: editForm.assignee_ids,
        due_date: editForm.due_date || undefined,
        planned_start_date: editForm.planned_start_date || undefined,
      });
      await fetchTask(); setIsEditing(false);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to save'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task permanently?')) return;
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    router.push(`/projects/${projectId}`);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitContent && !submitFileUrl) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${taskId}/submit`, {
        content: submitContent || undefined, file_url: submitFileUrl || undefined,
      });
      setSubmitContent(''); setSubmitFileUrl('');
      await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Submission failed'); }
  };

  const handleReview = async (action: 'Merge' | 'Request_Changes') => {
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}/review`, { action, message: reviewMessage });
      setReviewMessage(''); await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Review failed'); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
        content: commentText, file_url: commentFileUrl || undefined,
      });
      setCommentText(''); setCommentFileUrl(''); setShowCommentFile(false);
      await fetchComments();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to comment'); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
      await fetchComments();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: subtaskTitle,
        parent_task_id: Number(taskId),
      });
      setSubtaskTitle(''); setShowSubtaskModal(false);
      await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create subtask'); }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status: newStatus });
      await fetchTask();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to update status'); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-[#A855F7]" /></div>;
  if (!task) return <div className="flex justify-center items-center h-full"><p className="text-gray-400 font-bold">Task not found.</p></div>;

  const isOwnerOrRequester = currentUser?.role === 'Requester' || currentUser?.role === 'Admin' || task.project.owner_id === currentUser?.user_id;
  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';
  const isAssignee = task.assignees.some(a => a.user.user_id === currentUser?.user_id);
  const canSubmit = isAssignee && task.status === 'In_Progress';
  const canReview = isOwnerOrRequester && task.status === 'Review';
  const overdue = isOverdue(task.due_date, task.status);
  const dueSoon = isDueSoon(task.due_date, task.status);

  const statusColors: Record<string, string> = {
    Open: 'bg-gray-100 text-gray-500',
    In_Progress: 'bg-blue-100 text-blue-600',
    Review: 'bg-purple-100 text-purple-600',
    Closed: 'bg-green-100 text-green-600',
  };

  const attachments = task.submissions.filter(s => s.file_url);

  return (
    <div className="max-w-5xl mx-auto h-full p-4 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

      <button onClick={() => router.push(`/projects/${projectId}`)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors self-start">
        <ChevronLeft className="w-5 h-5" /> Back to Project
      </button>

      {/* Task Header */}
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
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Start Date</label>
                <input type="date" value={editForm.planned_start_date} onChange={e => setEditForm(p => ({ ...p, planned_start_date: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 font-bold outline-none" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Due Date</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 font-bold outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-black text-gray-400 uppercase block mb-2">Assignees</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 custom-scrollbar">
                  {projectMembers.map(u => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        const isSelected = editForm.assignee_ids.includes(u.user_id);
                        setEditForm(p => ({
                          ...p,
                          assignee_ids: isSelected 
                            ? p.assignee_ids.filter(id => id !== u.user_id)
                            : [...p.assignee_ids, u.user_id]
                        }));
                      }}
                      className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${
                        editForm.assignee_ids.includes(u.user_id)
                          ? 'bg-[#A855F7] text-white shadow-md'
                          : 'bg-white text-gray-400 border border-gray-100'
                      }`}
                    >
                      {u.username}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-black text-white py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-gray-800">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-black text-gray-900 leading-tight flex-1 mr-4">{task.title}</h1>
              <div className="flex gap-2">
                {isOwnerOrRequester && (
                  <>
                    <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-100 hover:bg-[#5EE1CD]/20 rounded-2xl text-gray-500 hover:text-gray-900 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={handleDelete} className="p-3 bg-gray-100 hover:bg-red-50 rounded-2xl text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                {isManager && (
                  <button onClick={() => setShowSubtaskModal(true)} className="p-3 bg-gray-100 hover:bg-blue-50 rounded-2xl text-gray-500 hover:text-blue-500 transition-colors" title="Add Sub-task">
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {task.description && <p className="text-gray-600 font-medium mb-5 leading-relaxed">{task.description}</p>}

            <div className="flex flex-wrap gap-2">
              {isManager || isAssignee ? (
                <div className="relative group/status">
                  <select 
                    value={task.status} 
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs font-black uppercase px-4 py-2 rounded-full cursor-pointer outline-none border-none appearance-none transition-all hover:ring-4 hover:ring-opacity-30 ${statusColors[task.status]} ${
                      task.status === 'Open' ? 'hover:ring-gray-300' : task.status === 'In_Progress' ? 'hover:ring-blue-300' : 
                      task.status === 'Review' ? 'hover:ring-purple-300' : 'hover:ring-green-300'
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Review">Review</option>
                    {(isManager || task.project.owner_id === currentUser?.user_id) && <option value="Closed">Closed</option>}
                  </select>
                </div>
              ) : (
                <span className={`text-xs font-black uppercase px-4 py-2 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-500'}`}>
                  {task.status.replace('_', ' ')}
                </span>
              )}
              <span className={`text-xs font-black uppercase px-4 py-2 rounded-full ${
                task.priority === 'High' ? 'bg-red-100 text-red-600' :
                task.priority === 'Low' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
              }`}>{task.priority}</span>
              {task.assignees.length > 0 ? (
                <div className="flex -space-x-3">
                  {task.assignees.map(a => (
                    <div key={a.user.user_id} className="w-10 h-10 bg-[#A855F7] border-4 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg" title={a.user.username}>
                      {a.user.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : <span className="text-xs font-black px-4 py-2 rounded-full bg-gray-100 text-gray-400">Unassigned</span>}
              {task.planned_start_date && (
                <span className="text-xs font-black px-4 py-2 rounded-full flex items-center gap-1 bg-gray-100 text-gray-600">
                  <Calendar className="w-3 h-3" />
                  Start — {new Date(task.planned_start_date).toLocaleDateString()}
                </span>
              )}
              {task.due_date && (
                <span className={`text-xs font-black px-4 py-2 rounded-full flex items-center gap-1 ${
                  overdue ? 'bg-red-100 text-red-600 animate-pulse' : dueSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {overdue ? '🔴 OVERDUE' : dueSoon ? '🟡 Due Soon' : 'Due'} — {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Sub-tasks preview */}
            {task.submissions.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs font-black uppercase text-gray-400 mb-2">Submissions ({task.submissions.length})</p>
                {task.submissions.map(s => (
                  <div key={s.submission_id} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 mb-2">
                    <div className="flex-1 text-sm font-medium text-gray-700">{s.content}</div>
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[#3B82F6] text-xs font-bold hover:underline flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> File
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Attachments Gallery */}
      {attachments.length > 0 && (
        <div className="bg-white rounded-[30px] shadow-xl border-4 border-gray-100 p-6">
          <h3 className="font-black text-lg uppercase text-gray-800 mb-4 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#3B82F6]" /> Attachments
          </h3>
          <div className="flex flex-wrap gap-3">
            {attachments.map(a => (
              <a key={a.submission_id} href={a.file_url!} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                <Paperclip className="w-4 h-4" /> {a.file_url!.split('/').pop()?.substring(0, 20) || 'File'}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Submit Work */}
        {canSubmit && (
          <div className="bg-white rounded-[30px] shadow-xl border-4 border-[#5EE1CD]/30 p-6">
            <h3 className="font-black text-lg uppercase text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#5EE1CD]" /> Submit Work
            </h3>
            <form onSubmit={handleSubmitWork} className="flex flex-col gap-3">
              <textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)}
                rows={4} placeholder="Describe your completed work..."
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 outline-none font-medium resize-none transition-colors" />
              <input value={submitFileUrl} onChange={e => setSubmitFileUrl(e.target.value)}
                placeholder="File URL (optional)" className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-4 py-3 outline-none font-medium transition-colors" />
              <button type="submit" className="w-full bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6] text-white py-3 rounded-2xl font-black uppercase text-sm shadow-lg hover:shadow-xl transition-all">
                Submit for Review
              </button>
            </form>
          </div>
        )}

        {/* Review Panel */}
        {canReview && (
          <div className="bg-white rounded-[30px] shadow-xl border-4 border-[#A855F7]/30 p-6">
            <h3 className="font-black text-lg uppercase text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#A855F7]" /> Review Submission
            </h3>
            {task.submissions[0] && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-2">@{task.submissions[0].worker.username}</p>
                <p className="font-medium text-gray-700">{task.submissions[0].content}</p>
                {task.submissions[0].file_url && (
                  <a href={task.submissions[0].file_url} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] text-xs font-bold mt-2 block hover:underline flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> View Attachment
                  </a>
                )}
              </div>
            )}
            <textarea value={reviewMessage} onChange={e => setReviewMessage(e.target.value)}
              rows={2} placeholder="Feedback (optional)..."
              className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#A855F7] rounded-2xl px-4 py-3 outline-none font-medium mb-3 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => handleReview('Request_Changes')} className="flex-1 bg-red-50 text-red-600 border-2 border-red-200 py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-red-100">
                <XCircle className="w-4 h-4" /> Request Changes
              </button>
              <button onClick={() => handleReview('Merge')} className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg">
                <GitMerge className="w-4 h-4" /> Approve & Merge
              </button>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className={`bg-white rounded-[30px] shadow-xl border-4 border-gray-100 p-6 ${canSubmit || canReview ? '' : 'lg:col-span-2'}`}>
          <h3 className="font-black text-lg uppercase text-gray-800 mb-4">Activity Log</h3>
          {task.commits.length === 0 ? <p className="text-gray-400 font-bold text-sm">No activity yet.</p> : (
            <div className="relative border-l-4 border-gray-100 ml-3 space-y-4">
              {task.commits.map(log => (
                <div key={log.log_id} className="relative pl-6">
                  <div className={`absolute -left-[14px] top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                    log.action === 'Merge' ? 'bg-green-500' : log.action === 'Submit' ? 'bg-[#3B82F6]' :
                    log.action === 'Request_Changes' ? 'bg-red-500' : 'bg-[#A855F7]'
                  }`}>{log.action.charAt(0)}</div>
                  <p className="font-bold text-gray-800 text-sm"><span className="text-[#A855F7]">@{log.user.username}</span> → {log.action.replace('_', ' ')}</p>
                  {log.message && <p className="text-gray-500 text-xs font-medium mt-0.5">{log.message}</p>}
                  <p className="text-gray-400 text-[10px] font-bold mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-[40px] shadow-2xl border-4 border-gray-100 p-8">
        <h3 className="font-black text-xl uppercase text-gray-800 mb-6 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[#A855F7]" /> Discussion ({comments.length})
        </h3>

        {/* Comment List */}
        <div className="space-y-5 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-400 font-bold text-sm text-center py-8 bg-gray-50 rounded-2xl">No comments yet. Start the discussion!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.comment_id} className="flex gap-4 group">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-full flex items-center justify-center text-white font-black flex-shrink-0 text-sm">
                  {comment.author.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-black text-gray-900 text-sm">@{comment.author.username}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-5 py-3 mt-1 border border-gray-100">
                    <p className="text-gray-700 font-medium text-sm leading-relaxed">{comment.content}</p>
                    {comment.file_url && (
                      <a href={comment.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-[#3B82F6] text-xs font-bold mt-2 block hover:underline flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Attachment
                      </a>
                    )}
                  </div>
                </div>
                {(comment.author.user_id === currentUser?.user_id || currentUser?.role === 'Admin') && (
                  <button onClick={() => handleDeleteComment(comment.comment_id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all self-start mt-8">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Add Comment */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-full flex items-center justify-center text-white font-black flex-shrink-0 text-sm">
              {currentUser?.username.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 relative">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                rows={2} placeholder="Add a comment..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e as any); } }}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#A855F7] rounded-2xl px-5 py-3 outline-none font-medium resize-none transition-colors text-sm" />
            </div>
          </div>
          {showCommentFile && (
            <input value={commentFileUrl} onChange={e => setCommentFileUrl(e.target.value)}
              placeholder="File/Link URL..."
              className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#A855F7] rounded-2xl px-4 py-3 outline-none font-medium text-sm ml-[52px]" />
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCommentFile(p => !p)}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button type="submit" disabled={!commentText.trim()}
              className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              <Send className="w-4 h-4" /> Comment
            </button>
          </div>
        </form>
      </div>

      {/* Sub-task Modal */}
      {showSubtaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-8">
            <h3 className="font-black text-xl uppercase text-gray-900 mb-4">Add Sub-task</h3>
            <p className="text-sm font-bold text-gray-400 mb-5">Parent: <span className="text-gray-700">{task.title}</span></p>
            <form onSubmit={handleCreateSubtask} className="flex flex-col gap-4">
              <input required value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)}
                placeholder="Sub-task title *"
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#5EE1CD] rounded-2xl px-5 py-4 font-bold outline-none transition-colors" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSubtaskModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-black text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-black text-white py-3 rounded-2xl font-black text-sm hover:bg-gray-800">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
