
import React from 'react';
import { Message, User, Theme, PersonaId } from '../types';
import { PERSONAS } from '../gemini';

interface MessageBubbleProps {
  message: Message;
  user: User;
  theme: Theme;
  personaId?: PersonaId;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user, personaId = 'original' }) => {
  const isAI = message.role === 'ai';
  const persona = PERSONAS[personaId] || PERSONAS.original;

  return (
    <div className={`flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-6 duration-700 ${!isAI ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-3 mb-1 ${!isAI ? 'flex-row-reverse' : ''}`}>
        <div className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center shrink-0 border-2 transition-all ${isAI 
          ? 'bg-white text-black font-black text-xs border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
          : 'bg-[#111] border-white/5 text-gray-500'}`}>
          {isAI ? persona.icon : <img src={user.photoURL} alt="U" className="w-full h-full object-cover rounded-[1.2rem] p-0.5 opacity-90" />}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isAI ? 'text-red-600' : 'text-gray-600'}`}>
          {isAI ? persona.name : 'LEGEND'}
        </span>
      </div>

      <div className={`max-w-[85%] rounded-[2rem] px-8 py-5 text-[15px] leading-relaxed whitespace-pre-wrap font-bold ${isAI 
        ? 'bg-white/5 text-gray-100 border border-white/5 shadow-2xl' 
        : 'bg-red-600 text-white shadow-[0_20px_40px_rgba(220,38,38,0.2)]'}`}>
        {message.text || (isAI && <span className="animate-pulse opacity-10">...</span>)}
      </div>

      {message.imageURL && (
        <div className="mt-4 max-w-[90%] rounded-[2.5rem] overflow-hidden border-2 border-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
          <img src={message.imageURL} alt="ZX-Render" className="w-full h-auto object-cover" />
        </div>
      )}

      {message.sources && message.sources.length > 0 && (
        <div className={`mt-3 flex flex-wrap gap-2 ${!isAI ? 'justify-end' : ''}`}>
          {message.sources.map((source, i) => (
            <a 
              key={i} 
              href={source.uri} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-2xl border border-white/5 bg-white/5 text-[9px] font-black uppercase text-gray-600 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
            >
              {source.title.slice(0, 15)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
