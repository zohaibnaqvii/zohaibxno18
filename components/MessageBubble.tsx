
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
    <div className={`flex items-start gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border mt-1 shadow-2xl transition-all ${isAI 
        ? 'bg-white text-black font-black text-[11px] border-white shadow-white/5' 
        : 'bg-[#111] border-white/5 text-gray-400'}`}>
        {isAI ? persona.icon : <img src={user.photoURL} alt="U" className="w-full h-full object-cover rounded-2xl p-0.5 opacity-80" />}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isAI ? 'text-red-600' : 'text-gray-600'}`}>
            {isAI ? persona.name : 'LEGEND STATUS'}
          </span>
        </div>

        <div className={`text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${isAI ? 'text-gray-100' : 'text-gray-400'}`}>
          {message.text || (isAI && <span className="animate-pulse opacity-20">Accessing Cloud...</span>)}
        </div>

        {message.imageURL && (
          <div className="mt-6 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <img src={message.imageURL} alt="ZX-Gen" className="w-full h-auto object-cover" />
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {message.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black uppercase text-gray-600 hover:text-red-500 hover:border-red-500/30 transition-all"
              >
                {source.title.slice(0, 20)}...
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
