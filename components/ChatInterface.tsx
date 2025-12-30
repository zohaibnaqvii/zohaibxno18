
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
          setActivePersona(chat.personaId);
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
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithZohaib(input, messages, activePersona);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: result.text,
        imageURL: result.imageURL,
        sources: result.sources,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      const updatedChatId = chatId || `chat_${Date.now()}`;
      const chatData: Chat = {
        chatId: updatedChatId,
        uid: user.uid,
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        createdAt: Date.now(),
        messages: finalMessages,
        personaId: activePersona,
      };

      await db.saveChat(chatData);
      if (!chatId) {
        onChatCreated(updatedChatId);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Persona Selector */}
      {!chatId && messages.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-1 rounded-2xl border bg-black/5 backdrop-blur-md border-white/10">
          {(Object.keys(PERSONAS) as PersonaId[]).map(pid => (
            <button
              key={pid}
              onClick={() => setActivePersona(pid)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activePersona === pid 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-500 hover:text-white'}`}
            >
              {PERSONAS[pid].name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center bg-black text-white font-black text-2xl ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              ZX
            </div>
            <div className="space-y-1">
              <div className="font-black text-xl tracking-tighter uppercase">ZOHAIB X NO 18</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.4em]">Elite Protocol Active</div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble 
            key={m.id} 
            message={m} 
            user={user} 
            theme={theme} 
            personaId={activePersona}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-black border border-white/10 text-white font-black text-[9px]`}>
              {PERSONAS[activePersona].icon}
            </div>
            <div className="h-2 w-12 bg-gray-500/20 rounded-full" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`p-4 md:p-6 transition-colors duration-300 ${isDark ? 'bg-black/20' : 'bg-white'}`}>
        <form 
          onSubmit={handleSend}
          className={`relative max-w-3xl mx-auto rounded-3xl border transition-all duration-300 shadow-2xl ${isDark ? 'bg-[#171717] border-white/10 focus-within:border-white/30' : 'bg-gray-50 border-black/5 focus-within:border-black/20'}`}
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-6 py-5 pr-16 text-sm focus:outline-none placeholder:text-gray-500"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all ${isDark ? 'bg-white text-black hover:scale-105' : 'bg-black text-white hover:scale-105'} disabled:opacity-30 disabled:scale-100`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-30">ZOHAIB X NO 18 | UNFILTERED PRIVATE ACCESS</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
