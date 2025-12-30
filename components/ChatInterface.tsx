
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
      id: Date.now().toString(),
      role: 'user',
      text: currentInput,
      timestamp: Date.now(),
    };

    // Save history for context BEFORE adding the new user message to state
    const historyForContext = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Placeholder for AI streaming message
    const aiMessageId = (Date.now() + 1).toString();
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
        (streamedText) => {
          setMessages(prev => prev.map(m => 
            m.id === aiMessageId ? { ...m, text: streamedText } : m
          ));
        }
      );
      
      setMessages(prev => {
        const final = prev.map(m => 
          m.id === aiMessageId ? { 
            ...m, 
            imageURL: result.imageURL, 
            sources: result.sources 
          } : m
        );
        
        const updatedChatId = chatId || `chat_${Date.now()}`;
        const chatData: Chat = {
          chatId: updatedChatId,
          uid: user.uid,
          title: currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : ''),
          createdAt: Date.now(),
          messages: final,
          personaId: activePersona,
        };
        db.saveChat(chatData);
        if (!chatId) onChatCreated(updatedChatId);
        return final;
      });
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Persona Bar - Extra Slim */}
      <div className={`flex items-center gap-1.5 p-2 px-4 border-b overflow-x-auto no-scrollbar shrink-0 ${isDark ? 'border-white/5 bg-black' : 'border-black/5 bg-gray-50'}`}>
        {(Object.keys(PERSONAS) as PersonaId[]).map(pid => (
          <button
            key={pid}
            onClick={() => !chatId && setActivePersona(pid)}
            disabled={!!chatId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shrink-0 border ${activePersona === pid 
              ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') 
              : (isDark ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-black/5 text-gray-400 border-black/5')} ${chatId ? 'opacity-30' : 'active:scale-95'}`}
          >
            <span>{PERSONAS[pid].icon}</span>
            <span>{PERSONAS[pid].name}</span>
          </button>
        ))}
      </div>

      {/* Messages - Vertical Focus */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth md:max-w-2xl mx-auto w-full"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className={`w-24 h-24 rounded-[2.5rem] border flex items-center justify-center bg-black text-white font-black text-4xl shadow-[0_0_50px_rgba(255,255,255,0.05)] ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {PERSONAS[activePersona].icon}
            </div>
            <div className="space-y-1">
              <div className="font-black text-3xl tracking-tighter uppercase">{PERSONAS[activePersona].name}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-500">{PERSONAS[activePersona].description}</div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} user={user} theme={theme} personaId={activePersona} />
        ))}
        
        {isLoading && !messages[messages.length-1]?.text && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black border border-white/10 text-white font-black text-[10px]">
              {PERSONAS[activePersona].icon}
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input - Sticky Bottom */}
      <div className={`p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <form 
          onSubmit={handleSend}
          className={`relative max-w-2xl mx-auto rounded-[1.8rem] border transition-all duration-300 shadow-2xl overflow-hidden ${isDark ? 'bg-[#121212] border-white/5' : 'bg-gray-100 border-black/5'}`}
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Protocol ${PERSONAS[activePersona].name}...`}
            className="w-full bg-transparent px-6 py-5 pr-16 text-sm font-medium focus:outline-none placeholder:text-gray-600"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-2 bottom-2 px-4 rounded-2xl transition-all ${isDark ? 'bg-white text-black active:scale-90' : 'bg-black text-white active:scale-90'} disabled:opacity-20`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.6em]">ELITE ACCESS GRANTED</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
