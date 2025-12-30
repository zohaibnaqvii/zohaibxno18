
import React, { useState } from 'react';
import { Message, User, Theme } from '../types';

interface MessageBubbleProps {
  message: Message;
  user: User;
  theme: Theme;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user, theme }) => {
  const [copied, setCopied] = useState(false);
  const isAI = message.role === 'ai';
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden ${isAI 
        ? (isDark ? 'bg-white text-black font-black text-[10px]' : 'bg-black text-white font-black text-[10px]') 
        : (isDark ? 'bg-gray-800 border-white/10' : 'bg-gray-100 border-black/10')}`}>
        {isAI ? 'ZX' : <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{isAI ? 'ZOHAIBXNO18' : 'YOU'}</span>
            <span className={`text-[9px] font-bold ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {isAI && (
            <button 
              onClick={handleCopy}
              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-black'}`}
              title="Copy response"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              )}
            </button>
          )}
        </div>

        <div className={`text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-500 selection:text-white ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {message.text}
        </div>

        {message.imageURL && (
          <div className={`mt-4 rounded-2xl overflow-hidden border shadow-2xl max-w-lg ${isDark ? 'border-white/10' : 'border-black/5'}`}>
            <img src={message.imageURL} alt="Generated content" className="w-full h-auto object-cover" />
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${isDark 
                  ? 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10' 
                  : 'bg-black/5 border-black/5 text-gray-600 hover:bg-black/10'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 22 3 22 10"></polyline><line x1="10" y1="14" x2="22" y2="2"></line></svg>
                {source.title.slice(0, 20)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
