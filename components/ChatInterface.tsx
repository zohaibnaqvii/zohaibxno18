
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
      
      if (result.needsActivation && onKeyError) {
        onKeyError();
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all shrink-0 border ${activePersona === pid 
              ? (isDark ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-black text-white border-black shadow-[0_0_15px_rgba(0,0,0,0.1)]') 
              : (isDark ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-black/5 text-gray-400 border-black/5')} ${isLoading ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
          >
            <span>{PERSONAS[pid].icon}</span>
            <span>{PERSONAS[pid].name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-xl mx-auto w-full no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className={`w-20 h-20 rounded-[2.2rem] border-2 flex items-center justify-center bg-black text-white font-black text-2xl mb-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              ZX
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Intel...</div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Google Search Cloud Active</div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} user={user} theme={theme} personaId={activePersona} />
        ))}
        
        {isLoading && !messages.find(m => m.id.startsWith('ai-'))?.text && (
          <div className="flex items-center gap-3 px-12">
            <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white' : 'bg-black'}`}></div>
            <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-75 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
            <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-150 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Searching Live Intel...</span>
          </div>
        )}
      </div>

      <div className={`p-4 pb-10 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <form 
          onSubmit={handleSend}
          className={`relative max-w-xl mx-auto rounded-[2rem] border transition-all duration-300 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden ${isDark ? 'bg-[#111] border-white/10 focus-within:border-white/20' : 'bg-gray-100 border-black/5 focus-within:border-black/10'}`}
        >
          <input 
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Protocol: ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-6 py-5 pr-16 text-sm font-medium focus:outline-none placeholder:text-gray-600"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-2 bottom-2 px-5 rounded-2xl transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'} disabled:opacity-20 active:scale-90`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-[8px] font-black text-gray-800 uppercase tracking-[0.5em] opacity-40">ZOHAIB X NO 18 | FREE ELITE ACCESS</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
