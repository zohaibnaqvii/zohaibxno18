
import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, Message, Theme, PersonaId } from '../types';
import { db } from '../firebase';
import { chatWithZohaibStream, PERSONAS } from '../gemini';
import MessageBubble from './MessageBubble';

interface ChatInterfaceProps {
  user: User;
  chatId: string | null;
  theme: Theme;
  onChatCreated: (id: string) => void;
  onKeyError?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, chatId, theme, onChatCreated, onKeyError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaId>('evil_friend'); // Default to Evil Friend as requested
  const [isSystemOffline, setIsSystemOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const loadChat = async () => {
      if (chatId) {
        const chats = await db.getChats(user.uid);
        const chat = chats.find(c => c.chatId === chatId);
        if (chat) {
          setMessages(chat.messages);
          setActivePersona(chat.personaId || 'evil_friend');
        }
      } else {
        setMessages([]);
        setActivePersona('evil_friend');
      }
    };
    loadChat();
    setIsSystemOffline(false);
  }, [chatId, user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleActivate = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsSystemOffline(false);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: currentInput,
      timestamp: Date.now(),
    };

    const historyForContext = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = `ai-${Date.now()}`;
    const aiPlaceholder: Message = {
      id: aiMessageId,
      role: 'ai',
      text: '',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const result = await chatWithZohaibStream(
        currentInput, 
        historyForContext, 
        activePersona,
        (text) => {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text } : m));
        }
      );
      
      if (result.needsActivation) {
        setIsSystemOffline(true);
        if (onKeyError) onKeyError();
      }

      setMessages(prev => {
        const final = prev.map(m => m.id === aiMessageId ? { 
          ...m, 
          imageURL: result.imageURL, 
          sources: result.sources 
        } : m);
        
        const updatedChatId = chatId || `chat_${Date.now()}`;
        db.saveChat({
          chatId: updatedChatId,
          uid: user.uid,
          title: currentInput.slice(0, 30),
          createdAt: Date.now(),
          messages: final,
          personaId: activePersona,
        });
        if (!chatId) onChatCreated(updatedChatId);
        return final;
      });
    } catch (error) {
      console.error("Protocol Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className={`flex items-center gap-1.5 p-2 px-4 border-b overflow-x-auto no-scrollbar shrink-0 ${isDark ? 'border-white/5 bg-black' : 'border-black/5 bg-gray-50'}`}>
        {(Object.keys(PERSONAS) as PersonaId[]).map(pid => (
          <button
            key={pid}
            disabled={isLoading}
            onClick={() => setActivePersona(pid)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 border ${activePersona === pid 
              ? (isDark ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-black text-white border-black') 
              : (isDark ? 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10' : 'bg-black/5 text-gray-400 border-black/5')} ${isLoading ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
          >
            <span>{PERSONAS[pid].icon}</span>
            <span>{PERSONAS[pid].name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-xl mx-auto w-full no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className={`w-24 h-24 rounded-[3rem] border-2 flex items-center justify-center bg-black text-white font-black text-3xl mb-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              ZX
            </div>
            <div className="space-y-2">
              <div className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-red-600">UNRESTRICTED ACCESS</div>
              <div className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50">Zohaib X Elite Protocols</div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} user={user} theme={theme} personaId={activePersona} />
        ))}
        
        {isSystemOffline && (
          <div className="flex flex-col items-center gap-4 py-12 animate-in fade-in zoom-in duration-700">
            <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center text-red-600 border border-red-600/50 mb-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-red-500">System Connection Blocked</div>
            <button 
              onClick={handleActivate}
              className={`px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-[0_20px_50px_rgba(255,0,0,0.2)] active:scale-95 border-2 border-red-600 bg-red-600 text-white`}
            >
              Force Sync Now (Free)
            </button>
          </div>
        )}

        {isLoading && !messages.find(m => m.id.startsWith('ai-'))?.text && (
          <div className="flex items-center gap-3 px-12">
            <div className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-red-600' : 'bg-black'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 ml-2">Bypassing Firewalls...</span>
          </div>
        )}
      </div>

      <div className={`p-4 pb-12 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <form 
          onSubmit={handleSend}
          className={`relative max-w-xl mx-auto rounded-3xl border transition-all duration-300 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden ${isDark ? 'bg-[#0a0a0a] border-white/10 focus-within:border-red-600/50' : 'bg-gray-100 border-black/5 focus-within:border-black/20'}`}
        >
          <input 
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Protocol: ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-8 py-6 pr-20 text-sm font-bold focus:outline-none placeholder:text-gray-700"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 top-3 bottom-3 px-6 rounded-2xl transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'} disabled:opacity-10 active:scale-90`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-[9px] font-black text-gray-900 uppercase tracking-[0.6em] opacity-40">ZOHAIB X NO 18 | UNRESTRICTED ELITE</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
