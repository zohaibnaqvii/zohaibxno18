
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
  onForceActivate?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, chatId, theme, onChatCreated, onKeyError, onForceActivate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaId>('evil_friend');
  const [isSystemOffline, setIsSystemOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        messages, 
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
    <div className="flex-1 flex flex-col h-full bg-black">
      {/* Persona Selector */}
      <div className="flex items-center gap-2 p-3 px-6 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0 bg-black/50 backdrop-blur-md">
        {(Object.keys(PERSONAS) as PersonaId[]).map(pid => (
          <button
            key={pid}
            disabled={isLoading}
            onClick={() => setActivePersona(pid)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all shrink-0 border-2 ${activePersona === pid 
              ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
              : 'bg-white/5 text-gray-500 border-transparent hover:border-white/10'}`}
          >
            <span>{PERSONAS[pid].icon}</span>
            <span>{PERSONAS[pid].name}</span>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-10 max-w-2xl mx-auto w-full no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
            <div className="w-24 h-24 rounded-[3.5rem] bg-gradient-to-tr from-red-600 to-red-400 p-[2px] mb-8 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
              <div className="w-full h-full rounded-[3.5rem] bg-black flex items-center justify-center text-white font-black text-3xl">ZX</div>
            </div>
            <div className="space-y-3">
              <div className="text-[14px] font-black uppercase tracking-[0.8em] text-red-600 animate-pulse">ELITE BYPASS ACTIVE</div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Zohaib X Private Terminal</div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} user={user} theme="dark" personaId={activePersona} />
        ))}
        
        {isSystemOffline && (
          <div className="flex flex-col items-center gap-6 py-16 animate-in fade-in zoom-in duration-700 bg-red-600/5 rounded-[3rem] border border-red-600/10 border-dashed">
            <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 border border-red-600/20 shadow-[0_0_40px_rgba(220,38,38,0.1)]">
               <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>
            </div>
            <div className="text-center space-y-2">
              <div className="text-[12px] font-black uppercase tracking-widest text-red-500">System Connection Blocked</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Bhai, system sync karna parega access ke liye.</p>
            </div>
            <button 
              onClick={onForceActivate}
              className="px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_25px_60px_rgba(220,38,38,0.4)] active:scale-95 bg-red-600 text-white hover:bg-red-500 ring-4 ring-red-600/10"
            >
              Force Activate (Free)
            </button>
          </div>
        )}

        {isLoading && !messages.find(m => m.id.startsWith('ai-'))?.text && (
          <div className="flex items-center gap-4 px-12">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-red-600">Syncing Private Cloud...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 pb-14 bg-gradient-to-t from-black via-black to-transparent">
        <form 
          onSubmit={handleSend}
          className="relative max-w-2xl mx-auto rounded-[2.5rem] border border-white/5 bg-[#080808] transition-all duration-300 focus-within:border-red-600/40 focus-within:shadow-[0_0_40px_rgba(220,38,38,0.1)] overflow-hidden"
        >
          <input 
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Protocol: ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-10 py-7 pr-24 text-[15px] font-bold text-white focus:outline-none placeholder:text-gray-800"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-4 top-4 bottom-4 px-8 rounded-[1.8rem] transition-all bg-white text-black font-black uppercase text-[10px] tracking-widest disabled:opacity-5 active:scale-90"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.8em]">ZOHAIB X NO 18 • UNRESTRICTED ELITE STATUS</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
