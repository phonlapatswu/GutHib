"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquare, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface UserRef { user_id: number; username: string; email?: string; avatar_url?: string | null; }
interface ChatMessage {
  message_id: number;
  sender_id: number;
  recipient_id: number | null;
  project_id: number | null;
  text: string;
  created_at: string;
  read_at: string | null;
  sender: UserRef;
  recipient?: UserRef | null;
}
interface Conversation { user_id: number; username: string; email: string; avatar_url?: string | null; unreadCount?: number; }
interface ProjectWithMembers { project_id: number; title: string; members: Conversation[]; unreadCount?: number; }

export default function MessagePage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<Conversation | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchMessages = useCallback(async () => {
    try {
      let params: any = {};
      if (activeProject) params.project_id = activeProject.project_id;
      else if (activeRecipient) params.recipient_id = activeRecipient.user_id;
      else return; // Don't fetch if nothing selected

      const res = await api.get('/messages', { params });
      setMessages(res.data);
    } catch (error) { console.error("Failed to fetch messages", error); }
  }, [activeProject, activeRecipient]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (e) { console.error(e); }
  };

  const markAsRead = useCallback(async () => {
    if (!activeRecipient && !activeProject) return;
    try {
      await api.post('/messages/read', {
        partner_id: activeRecipient?.user_id,
        project_id: activeProject?.project_id
      });
      // Clear unread count locally
      if (activeRecipient) {
        setConversations(prev => prev.map(c => c.user_id === activeRecipient.user_id ? { ...c, unreadCount: 0 } : c));
      }
      if (activeProject) {
        setProjects(prev => prev.map(p => p.project_id === activeProject.project_id ? { ...p, unreadCount: 0 } : p));
      }
    } catch (e) { /* silent */ }
  }, [activeRecipient, activeProject]);

  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, projectsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/projects')
        ]);
        setMyUserId(userRes.data.user_id);
        
        // Fetch members for each project
        const projectData = await Promise.all(projectsRes.data.map(async (p: any) => {
          const membersRes = await api.get(`/projects/${p.project_id}/members`);
          return { ...p, members: membersRes.data };
        }));
        setProjects(projectData);
        
        // Auto-select first project if available
        if (projectData.length > 0 && !activeProject && !activeRecipient) {
          setActiveProject(projectData[0]);
        }
        
        await Promise.all([fetchMessages(), fetchConversations()]);
      } catch (error) { console.error("Init failed", error); }
      finally { setIsLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    
    if (activeProject) {
      socket.emit('join_project', activeProject.project_id);
    }

    socket.on('new_message', (msg: ChatMessage) => {
      // Check if the message belongs to current active chat
      const isRelevant = 
        (activeProject && msg.project_id === activeProject.project_id) ||
        (activeRecipient && 
          ((msg.sender_id === activeRecipient.user_id && msg.recipient_id === myUserId) ||
           (msg.sender_id === myUserId && msg.recipient_id === activeRecipient.user_id))
        );
      
      if (isRelevant) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.message_id === msg.message_id)) return prev;
          return [...prev, msg];
        });
        markAsRead();
      } else {
        // Increment unread count for the relevant chat list item
        if (msg.project_id) {
          setProjects(prev => prev.map(p => p.project_id === msg.project_id ? { ...p, unreadCount: (p.unreadCount || 0) + 1 } : p));
        } else if (msg.sender_id) {
          setConversations(prev => {
             // If conversation exists, increment
             if (prev.find(c => c.user_id === msg.sender_id)) {
                return prev.map(c => c.user_id === msg.sender_id ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c);
             }
             // If not, it will be added when fetchConversations runs (prompted by unread_count_update in layout)
             return prev;
          });
          fetchConversations();
        }
      }
    });
    
    socket.on('user_updated', () => {
       fetchConversations();
       api.get('/auth/me').then(res => setMyUserId(res.data.user_id)).catch(console.error);
    });

    fetchMessages();
    markAsRead(); // Mark as read when switching
    
    return () => {
      socket.off('new_message');
      socket.disconnect();
    };
  }, [activeProject, activeRecipient, fetchMessages, markAsRead, myUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const txt = inputText;
    setInputText('');

    try {
      await api.post('/messages', { 
        text: txt, 
        recipient_id: activeRecipient?.user_id || undefined,
        project_id: activeProject?.project_id || undefined
      });
      await fetchMessages();
      if (activeRecipient) fetchConversations();
    } catch (error) {
      alert("Failed to send");
      setInputText(txt);
    }
  };

  const startNewDM = async (user: Conversation) => {
    setActiveRecipient(user);
    setShowNewMsgModal(false);
    // Add to conversations locally if not exists
    if (!conversations.find(c => c.user_id === user.user_id)) {
      setConversations(p => [user, ...p]);
    }
  };

  const handleEmailSearch = async () => {
    if (!emailInput.includes('@')) return;
    try {
      // We can try to send a test message or just use an endpoint if we had one
      // For now, let's just use the createMessage logic which handles email
      const res = await api.post('/messages', { text: "Hello! (Starting conversation)", recipient_email: emailInput });
      const newMsg = res.data;
      if (newMsg.recipient) {
        startNewDM(newMsg.recipient);
        setEmailInput('');
      }
    } catch (e: any) {
      alert(e.response?.data?.error || "User not found");
    }
  };

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Sidebar */}
      <div className={`
        ${activeRecipient || activeProject ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 bg-[rgb(var(--bg-sidebar))] border-r-4 border-[rgb(var(--border-main))] flex flex-col pt-8 pb-4 transition-all duration-300
      `}>
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-black uppercase text-[rgb(var(--text-main))]">Messages</h2>
          <button 
            onClick={() => setShowNewMsgModal(true)}
            className="w-full mt-4 bg-black text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            + New Message
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <div className="pt-4 pb-2 px-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Groups</span>
          </div>

          {projects.map(p => (
            <button 
              key={p.project_id}
              onClick={() => { setActiveProject(p); setActiveRecipient(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeProject?.project_id === p.project_id ? 'bg-[#3B82F6] text-white shadow-lg' : 'hover:bg-[rgb(var(--bg-card))] text-[rgb(var(--text-muted))]'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${activeProject?.project_id === p.project_id ? 'bg-white/20' : 'bg-gray-100 text-[#3B82F6]'}`}>
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <div className="font-black text-sm uppercase truncate">{p.title}</div>
                <div className={`text-[10px] font-bold truncate ${activeProject?.project_id === p.project_id ? 'text-white/70' : 'text-gray-400'}`}>Team Chat</div>
              </div>
              {p.unreadCount && p.unreadCount > 0 && activeProject?.project_id !== p.project_id && (
                <div className="bg-white text-[#3B82F6] text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {p.unreadCount}
                </div>
              )}
            </button>
          ))}

          <div className="pt-4 pb-2 px-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversations</span>
          </div>

          {conversations.map(c => (
            <button 
              key={c.user_id}
              onClick={() => { setActiveRecipient(c); setActiveProject(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeRecipient?.user_id === c.user_id ? 'bg-[#5EE1CD] text-white shadow-lg' : 'hover:bg-[rgb(var(--bg-card))] text-[rgb(var(--text-muted))]'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg overflow-hidden flex-shrink-0 ${activeRecipient?.user_id === c.user_id ? 'bg-white/20' : 'bg-[#5EE1CD]/10 text-[#5EE1CD]'}`}>
                {c.avatar_url ? (
                  <img src={`${API_BASE}${c.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  c.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <div className="font-black text-sm uppercase truncate">{c.username}</div>
                <div className={`text-[10px] font-bold truncate ${activeRecipient?.user_id === c.user_id ? 'text-white/70' : 'text-gray-400'}`}>{c.email}</div>
              </div>
              {c.unreadCount && c.unreadCount > 0 && activeRecipient?.user_id !== c.user_id && (
                <div className="bg-white text-[#5EE1CD] text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {c.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`
        ${activeRecipient || activeProject ? 'flex' : 'hidden md:flex'}
        flex-1 flex flex-col bg-[rgb(var(--bg-app))] transition-all duration-300
      `}>
        <header className="bg-[rgb(var(--bg-sidebar))]/50 backdrop-blur-3xl border-b-4 border-[rgb(var(--border-main))] p-4 md:p-8 flex items-center gap-4">
            {/* Back Button for Mobile */}
            <button 
              onClick={() => { setActiveRecipient(null); setActiveProject(null); }}
              className="md:hidden p-2 bg-[rgb(var(--bg-surface))] rounded-xl shadow-sm border border-[rgb(var(--border-main))] text-[rgb(var(--text-muted))] active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg ${activeProject ? 'bg-[#3B82F6]' : 'bg-[#5EE1CD]'}`}>
              {activeProject ? <MessageSquare className="w-5 h-5 md:w-6 md:h-6" /> : (activeRecipient ? activeRecipient.username.charAt(0).toUpperCase() : '?')}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[rgb(var(--text-main))] leading-none">
                {activeProject ? `${activeProject.title} Team` : (activeRecipient ? activeRecipient.username : 'Select Chat')}
              </h2>
              <p className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mt-1">
                {activeProject ? 'Project Group Channel' : (activeRecipient ? activeRecipient.email : '')}
              </p>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center grayscale opacity-50">
              <div className="w-24 h-24 bg-gray-200 rounded-[40px] flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <p className="font-black text-gray-400 uppercase tracking-widest text-sm">No magic here yet.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === myUserId;
              return (
                <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] font-black text-gray-400 ml-4 mb-1">@{msg.sender.username}</span>}
                    <div 
                      className={`px-6 py-4 rounded-[32px] shadow-sm text-[15px] font-bold leading-relaxed ${
                        isMe 
                        ? 'bg-gradient-to-br from-[#5EE1CD] to-[#3B82F6] text-white rounded-br-sm' 
                        : 'bg-[rgb(var(--bg-surface))] border-4 border-[rgb(var(--border-main))] text-[rgb(var(--text-main))] rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && !activeProject && (
                        <span className={`text-[9px] font-black uppercase ${msg.read_at ? 'text-[#5EE1CD]' : 'text-gray-300'}`}>
                          • {msg.read_at ? 'Read' : 'Sent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 md:p-10 pt-0">
          <form onSubmit={handleSend} className="bg-[rgb(var(--bg-sidebar))]/80 backdrop-blur-2xl border-4 border-[rgb(var(--border-main))] rounded-[40px] p-2 flex gap-2 shadow-2xl">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeProject ? activeProject.title : (activeRecipient ? activeRecipient.username : '...')}`}
              className="flex-1 bg-transparent border-none outline-none px-8 py-5 text-[rgb(var(--text-main))] font-bold placeholder-[rgb(var(--text-dim))] text-lg"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-black text-white w-16 h-16 rounded-[30px] flex items-center justify-center shadow-lg hover:shadow-black/20 hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl border-8 border-white overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-black uppercase text-gray-900">New Message</h3>
                  <button onClick={() => setShowNewMsgModal(false)} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-all font-black text-gray-400">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Search by Email</label>
                    <div className="flex gap-2">
                       <input 
                         type="email" 
                         value={emailInput}
                         onChange={(e) => setEmailInput(e.target.value)}
                         placeholder="friend@email.com"
                         className="flex-1 bg-gray-50 border-4 border-gray-100 focus:border-[#3B82F6]/50 rounded-2xl px-6 py-4 font-bold outline-none transition-all placeholder:text-gray-300"
                       />
                       <button 
                         onClick={handleEmailSearch}
                         className="bg-[#3B82F6] text-white px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-blue-400/30 transition-all active:scale-95"
                       >
                         Find
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-8">
                  {projects.map(p => (
                    <div key={p.project_id}>
                      <div className="flex items-center gap-3 mb-4">
                         <div className="h-px flex-1 bg-gray-100"></div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.title} Team</span>
                         <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         {p.members.map(m => (
                           m.user_id !== myUserId && (
                             <button
                               key={m.user_id}
                               onClick={() => startNewDM(m)}
                               className="flex items-center gap-3 p-4 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-95 text-left border border-white"
                             >
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-[#5EE1CD] shadow-sm overflow-hidden">
                                  {m.avatar_url ? (
                                    <img src={`${API_BASE}${m.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    m.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-black text-xs uppercase truncate">{m.username}</div>
                                  <div className="text-[8px] font-bold text-gray-400 truncate uppercase">{m.email}</div>
                                </div>
                             </button>
                           )
                         ))}
                      </div>
                    </div>
                  ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
