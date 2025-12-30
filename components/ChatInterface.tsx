
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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, chatId, theme, onChatCreated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaId>('original');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const loadChat = async () => {
      if (chatId) {
        const chats = await db.getChats(user.uid);
        const chat = chats.find(c => c.chatId === chatId);
        if (chat) {
          setMessages(chat.messages);
          setActivePersona(chat.personaId || 'original');
        }
      } else {
        setMessages([]);
        setActivePersona('original');
      }
    };
    loadChat();
  }, [chatId, user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      
      setMessages(prev => {
        const final = prev.map(m => m.id === aiMessageId ? { ...m, ...result } : m);
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
      console.error("Stream Loop Crash:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative transition-all duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className={`flex items-center gap-1 p-2 px-4 border-b overflow-x-auto no-scrollbar shrink-0 ${isDark ? 'border-white/5 bg-black' : 'border-black/5 bg-gray-50'}`}>
        {(Object.keys(PERSONAS) as PersonaId[]).map(pid => (
          <button
            key={pid}
            disabled={!!chatId || isLoading}
            onClick={() => setActivePersona(pid)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all shrink-0 border ${activePersona === pid 
              ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') 
              : (isDark ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-black/5 text-gray-400 border-black/5')} ${(chatId || isLoading) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
          >
            <span>{PERSONAS[pid].icon}</span>
            <span>{PERSONAS[pid].name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-xl mx-auto w-full no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 animate-pulse">
            <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center bg-black text-white font-black text-3xl mb-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              ZX
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for Access</div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} user={user} theme={theme} personaId={activePersona} />
        ))}
        
        {isLoading && !messages.find(m => m.id.startsWith('ai-'))?.text && (
          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest px-12">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
            SYNCING...
          </div>
        )}
      </div>

      <div className={`p-4 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <form 
          onSubmit={handleSend}
          className={`relative max-w-xl mx-auto rounded-3xl border transition-all duration-300 shadow-xl overflow-hidden ${isDark ? 'bg-[#111] border-white/10 focus-within:border-white/20' : 'bg-gray-50 border-black/5 focus-within:border-black/10'}`}
        >
          <input 
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Protocol: ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-5 py-4 pr-14 text-sm font-medium focus:outline-none placeholder:text-gray-600"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-2xl transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'} disabled:opacity-20 active:scale-90`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[8px] font-black text-gray-800 uppercase tracking-[0.5em] opacity-40">ZX NO 18 | TURBO ENGINE ACTIVE</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
