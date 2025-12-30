
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import { auth, db } from './firebase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  const checkKeyStatus = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const valid = await window.aistudio.hasSelectedApiKey();
      setIsKeyValid(valid);
      return valid;
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) setUser(currentUser);
      await checkKeyStatus();
      setLoading(false);
    };
    init();
  }, []);

  const handleActivateKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsKeyValid(true);
      // Wait for injection then check again
      setTimeout(async () => {
        const valid = await checkKeyStatus();
        if (valid) {
          // Force UI refresh if key is now present
          window.location.reload();
        }
      }, 2000);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="text-3xl font-black tracking-tighter text-white">ZX NO 18</div>
        <div className="w-12 h-0.5 bg-red-600 animate-pulse"></div>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={async () => setUser(await auth.signIn())} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-gray-200">
      <Sidebar 
        user={user} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentChatId={currentChatId}
        theme={theme}
        onSelectChat={(id) => { setCurrentChatId(id); setIsSidebarOpen(false); }}
        onNewChat={() => { setCurrentChatId(null); setIsSidebarOpen(false); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div 
              onClick={handleActivateKey}
              className={`flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${!isKeyValid ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}
            >
              <div className={`w-2 h-2 rounded-full ${!isKeyValid ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-black tracking-widest uppercase">{!isKeyValid ? 'SYSTEM OFFLINE' : 'LEGEND CONNECTED'}</span>
            </div>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 text-sm font-black tracking-[0.3em] uppercase opacity-90 hidden sm:block">ZOHAIB X NO 18</div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleActivateKey} 
              className={`p-2 transition-all rounded-full ${!isKeyValid ? 'bg-red-500/10 text-red-500 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'opacity-20 hover:opacity-100 hover:bg-white/5'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>
            </button>
            <button onClick={() => setCurrentChatId(null)} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
          </div>
        </header>

        <ChatInterface 
          user={user} 
          chatId={currentChatId} 
          theme={theme}
          onChatCreated={(id) => setCurrentChatId(id)}
          onKeyError={() => setIsKeyValid(false)}
          onForceActivate={handleActivateKey}
        />
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          user={user} 
          theme={theme}
          setTheme={() => {}} 
          onClose={() => setIsSettingsOpen(false)} 
          onLogout={() => { auth.signOut(); setUser(null); }}
        />
      )}
    </div>
  );
};

export default App;
