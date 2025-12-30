
import React, { useState, useEffect } from 'react';
import { User, Chat, Theme } from '../types';
import { db } from '../firebase';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  currentChatId: string | null;
  theme: Theme;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  currentChatId, 
  theme,
  onSelectChat, 
  onNewChat,
  onOpenSettings
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchChats = async () => {
      const data = await db.getChats(user.uid);
      setChats(data);
    };
    fetchChats();
  }, [user.uid, currentChatId]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out border-r flex flex-col
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-[#171717] border-white/5' : 'bg-[#f9f9f9] border-black/5'}
      `}>
        <div className="p-4">
          <button 
            onClick={onNewChat}
            className={`w-full flex items-center justify-between px-3 py-3 border rounded-xl transition-all text-sm group ${isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-black/10 hover:bg-black/5 text-gray-900'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span className="font-bold tracking-tight">New Chat</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className={`px-3 text-[10px] font-bold py-2 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>History</div>
          {chats.map(chat => (
            <button
              key={chat.chatId}
              onClick={() => onSelectChat(chat.chatId)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all truncate hover:opacity-80 ${currentChatId === chat.chatId 
                ? (isDark ? 'bg-white/10 text-white font-medium' : 'bg-black/5 text-black font-medium') 
                : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')}`}
            >
              {chat.title || 'Untitled Chat'}
            </button>
          ))}
          {chats.length === 0 && (
            <div className={`px-3 py-8 text-center text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No chats yet</div>
          )}
        </div>

        <div className={`p-4 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <button 
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-sm ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <img src={user.photoURL} className={`w-8 h-8 rounded-full border ${isDark ? 'border-white/10' : 'border-black/10'}`} alt="Profile" />
            <div className="flex-1 text-left">
              <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{user.name}</div>
              <div className={`text-[10px] uppercase font-black ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Settings</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
