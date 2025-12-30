
import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, Message, Theme, PersonaId } from '../types';
import { db } from '../firebase';
import { chatWithZohaib, PERSONAS } from '../gemini';
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithZohaib(input, messages, activePersona);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response.text,
        imageURL: response.imageURL,
        sources: response.sources,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      let targetChatId = chatId;
      if (!targetChatId) {
        targetChatId = 'chat_' + Date.now().toString();
        const newChat: Chat = {
          chatId: targetChatId,
          uid: user.uid,
          title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
          createdAt: Date.now(),
          messages: finalMessages,
          personaId: activePersona
        };
        await db.saveChat(newChat);
        onChatCreated(targetChatId);
      } else {
        const chats = await db.getChats(user.uid);
        const chat = chats.find(c => c.chatId === targetChatId);
        if (chat) {
          chat.messages = finalMessages;
          chat.personaId = activePersona;
          await db.saveChat(chat);
        }
      }
    } catch (error) {
      console.error("Chat failure", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
      {/* Persona Selector Bar - Slimmer for mobile */}
      <div className={`flex items-center gap-2 p-1.5 px-3 border-b overflow-x-auto no-scrollbar shrink-0 ${isDark ? 'border-white/5 bg-black/60' : 'border-black/5 bg-gray-50'}`}>
        <span className={`text-[8px] font-black uppercase tracking-widest mr-1 shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>MOOD:</span>
        {(Object.values(PERSONAS) as any).map((p: any) => (
          <button
            key={p.id}
            onClick={() => !chatId && setActivePersona(p.id)}
            disabled={!!chatId}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all shrink-0 border ${
              activePersona === p.id 
                ? (isDark ? 'bg-white text-black border-white shadow-lg' : 'bg-black text-white border-black shadow-md')
                : (isDark ? 'bg-white/5 text-gray-400 border-white/5' : 'bg-black/5 text-gray-600 border-black/5')
            } ${chatId ? 'opacity-40' : 'active:scale-95'}`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-5 md:max-w-3xl md:mx-auto w-full scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in fade-in duration-700">
            <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center border shadow-2xl animate-pulse ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
              <span className="text-3xl font-black">{PERSONAS[activePersona].icon}</span>
            </div>
            <div className="space-y-2">
              <h2 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{PERSONAS[activePersona].name}</h2>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] px-10 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {PERSONAS[activePersona].description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-8 w-full max-w-xs px-4">
               {['Code for a trading bot', 'Talk like an EVIL friend', 'Generate cyber art', 'Tell me a secret'].map(t => (
                 <button 
                  key={t}
                  onClick={() => { setInput(t); }}
                  className={`px-5 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-left transition-all active:scale-95 ${isDark ? 'border-white/5 bg-white/5 text-gray-400' : 'border-black/5 bg-black/5 text-gray-600'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} user={user} theme={theme} personaId={activePersona} />
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
             <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-[9px] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
               {PERSONAS[activePersona].icon}
             </div>
             <div className="space-y-2 mt-2">
                <div className="flex gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Optimized Input area for Mobile - Tall and Narrow */}
      <div className="p-3 md:p-4 pb-6 md:pb-10">
        <form 
          onSubmit={handleSend}
          className="relative max-w-2xl mx-auto group"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Say something to ${PERSONAS[activePersona].name}...`}
            className={`w-full border rounded-[1.5rem] py-4.5 pl-5 pr-14 focus:outline-none focus:ring-0 transition-all text-sm font-medium shadow-2xl ${isDark 
              ? 'bg-[#1a1a1a] border-white/5 text-white placeholder-gray-600' 
              : 'bg-[#f0f0f0] border-black/5 text-black placeholder-gray-400'}`}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-1.5 top-1.5 bottom-1.5 w-11 flex items-center justify-center rounded-2xl transition-all ${input.trim() 
              ? (isDark ? 'bg-white text-black shadow-lg scale-100 active:scale-90' : 'bg-black text-white shadow-md scale-100 active:scale-90') 
              : (isDark ? 'bg-white/5 text-gray-700' : 'bg-black/5 text-gray-300')}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className={`text-[8px] text-center mt-3 font-black uppercase tracking-[0.3em] ${isDark ? 'text-gray-800' : 'text-gray-300'}`}>
          ZOHAIB X NO 18 • {PERSONAS[activePersona].name}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
