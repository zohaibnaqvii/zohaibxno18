
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
      {/* Persona Selector Bar */}
      <div className={`flex items-center gap-2 p-2 px-4 border-b overflow-x-auto no-scrollbar shrink-0 ${isDark ? 'border-white/5 bg-black/40' : 'border-black/5 bg-gray-50'}`}>
        <span className={`text-[9px] font-black uppercase tracking-widest mr-2 shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Persona:</span>
        {(Object.values(PERSONAS) as any).map((p: any) => (
          <button
            key={p.id}
            onClick={() => !chatId && setActivePersona(p.id)}
            disabled={!!chatId} // Only allow persona change for new chats for consistency
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shrink-0 border ${
              activePersona === p.id 
                ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                : (isDark ? 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10' : 'bg-black/5 text-gray-600 border-black/5 hover:bg-black/10')
            } ${chatId ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={p.description}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-6 md:px-0 md:max-w-3xl md:mx-auto w-full scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center border shadow-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
              <span className="text-2xl font-black">{PERSONAS[activePersona].icon}</span>
            </div>
            <div className="space-y-1">
              <h2 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{PERSONAS[activePersona].name}</h2>
              <p className={`text-sm font-medium px-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {PERSONAS[activePersona].description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm px-4">
               {['Explain coding logic', 'Evil plans', 'Generate art', 'Roast me'].map(t => (
                 <button 
                  key={t}
                  onClick={() => { setInput(t); }}
                  className={`px-4 py-3 rounded-2xl border text-xs text-left transition-all active:scale-95 ${isDark ? 'border-white/5 hover:bg-white/5 text-gray-400' : 'border-black/5 hover:bg-black/5 text-gray-600'}`}
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
          <div className="flex items-start gap-4 animate-in fade-in duration-300">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
               {PERSONAS[activePersona].icon}
             </div>
             <div className="space-y-2 mt-2">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${isDark ? 'bg-white/40' : 'bg-black/40'}`}></div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 md:pb-10">
        <form 
          onSubmit={handleSend}
          className="relative max-w-3xl mx-auto group"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Command ${PERSONAS[activePersona].name}...`}
            className={`w-full border rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 transition-all text-sm shadow-xl ${isDark 
              ? 'bg-[#1e1e1e] border-white/10 focus:ring-white/10 text-white placeholder-gray-500' 
              : 'bg-[#f4f4f4] border-black/5 focus:ring-black/5 text-black placeholder-gray-400'}`}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center rounded-xl transition-all ${input.trim() 
              ? (isDark ? 'bg-white text-black hover:scale-105' : 'bg-black text-white hover:scale-105') 
              : (isDark ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-gray-400')}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <p className={`text-[10px] text-center mt-3 font-bold uppercase tracking-widest ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>ZOHAIBXNO18 PERSONAL AI • {PERSONAS[activePersona].name}</p>
      </div>
    </div>
  );
};

export default ChatInterface;
