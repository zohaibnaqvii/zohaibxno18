
import React from 'react';
import { Message, User, Theme, PersonaId } from '../types';
import { PERSONAS } from '../gemini';

interface MessageBubbleProps {
  message: Message;
  user: User;
  theme: Theme;
  personaId?: PersonaId;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user, theme, personaId = 'original' }) => {
  const isAI = message.role === 'ai';
  const isDark = theme === 'dark';
  const persona = PERSONAS[personaId] || PERSONAS.original;

  return (
    <div className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-1 shadow-sm ${isAI 
        ? (isDark ? 'bg-white text-black font-black text-[9px]' : 'bg-black text-white font-black text-[9px]') 
        : (isDark ? 'bg-gray-800 border-white/5' : 'bg-gray-100 border-black/5')}`}>
        {isAI ? persona.icon : <img src={user.photoURL} alt="U" className="w-full h-full object-cover" />}
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {isAI ? persona.name : 'LEGEND'}
          </span>
        </div>

        <div className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {message.text || (isAI && <span className="animate-pulse">Typing...</span>)}
        </div>

        {message.imageURL && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            <img src={message.imageURL} alt="ZX-Gen" className="w-full h-auto object-cover" />
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {message.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className={`px-2 py-1 rounded-lg border text-[8px] font-bold uppercase transition-all ${isDark 
                  ? 'bg-white/5 border-white/5 text-gray-500 hover:text-white' 
                  : 'bg-black/5 border-black/5 text-gray-500 hover:text-black'}`}
              >
                {source.title.slice(0, 15)}...
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
