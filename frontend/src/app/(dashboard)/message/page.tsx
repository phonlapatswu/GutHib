"use client";

import { useEffect, useState, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface ChatMessage {
  message_id: number;
  sender_id: number;
  text: string;
  created_at: string;
  sender: { username: string };
}

export default function MessagePage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  useEffect(() => {
    // Get current user to determine "me" vs "them"
    const init = async () => {
      try {
        const userRes = await api.get('/auth/me');
        setMyUserId(userRes.data.user_id);
        await fetchMessages();
      } catch (error) {
        console.error("Failed to initialize chat", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();

    // Short-polling for true real-time feel
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Scroll to bottom gracefully
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const optimisticText = inputText;
    setInputText('');

    try {
      await api.post('/messages', { text: optimisticText });
      await fetchMessages(); // immediately fetch to update
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
      setInputText(optimisticText); // restore on failure
    }
  };

  return (
    <div className="mx-auto h-full p-4 md:p-8 flex flex-col">
      <header className="mb-8 flex justify-between items-center px-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#3B82F6] inline-block pb-2">Global Chat</h2>
          <p className="font-bold text-gray-500 mt-2 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#3B82F6]" /> Connect with the entire team.
          </p>
        </div>
      </header>

      <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[40px] shadow-2xl border-4 border-white flex flex-col overflow-hidden mx-4 pb-4">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
          <div className="text-center mb-10">
            <span className="bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-inner">
              Live Feed
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
             <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
               <p className="text-gray-400 font-bold">No messages yet. Say hello!</p>
             </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === myUserId;

              return (
                <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-xs font-black text-gray-400 ml-4 pb-1">@{msg.sender.username}</span>}
                    <div 
                      className={`px-6 py-4 rounded-[24px] shadow-sm text-[15px] font-medium leading-relaxed ${
                        isMe 
                        ? 'bg-gradient-to-br from-[#5EE1CD] to-[#3B82F6] text-white rounded-br-sm' 
                        : 'bg-white border-2 border-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 px-4 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 pb-2 pt-4 bg-transparent flex items-end gap-2">
          <form onSubmit={handleSend} className="flex-1 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white border-4 border-gray-100 focus:border-[#5EE1CD]/50 outline-none rounded-full px-8 py-5 text-gray-800 font-bold shadow-lg transition-colors placeholder:font-medium text-lg"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-black text-white p-5 rounded-full shadow-2xl hover:shadow-[#5EE1CD]/50 hover:bg-gray-900 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex-shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
