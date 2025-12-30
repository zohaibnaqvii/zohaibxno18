
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
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('zohaibx_theme');
    return (saved as Theme) || 'dark';
  });

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeyValid(hasKey);
      return hasKey;
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) setUser(currentUser);
      await checkKey();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('zohaibx_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleActivateKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success and refresh state
      setIsKeyValid(true);
      setTimeout(async () => {
        const valid = await checkKey();
        if (valid) window.location.reload();
      }, 1500);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="animate-pulse text-2xl font-black tracking-tighter text-white">ZOHAIB X NO 18</div>
    </div>
  );

  if (!user) return <AuthPage onLogin={async () => setUser(await auth.signIn())} />;

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#000] text-gray-200' : 'bg-white text-gray-900'}`}>
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
        <header className={`h-14 flex items-center justify-between px-4 border-b shrink-0 backdrop-blur-md z-10 ${theme === 'dark' ? 'border-white/5 bg-black/80' : 'border-black/5 bg-white/80'}`}>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <button 
              onClick={handleActivateKey}
              className={`flex items-center gap-2 text-[8px] font-black tracking-tighter uppercase px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${!isKeyValid ? 'border-red-600 bg-red-600/20 text-red-500 animate-pulse' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${!isKeyValid ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
              {!isKeyValid ? 'FORCE ACTIVATE' : 'SYSTEM ONLINE'}
            </button>
          </div>
          
          <div className="text-[10px] font-black tracking-widest uppercase opacity-80">ZOHAIB X NO 18</div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={handleActivateKey} 
              className={`p-2 transition-all ${!isKeyValid ? 'text-red-500' : 'opacity-20 hover:opacity-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"></path></svg>
            </button>
            <button onClick={() => setCurrentChatId(null)} className="p-2 opacity-40"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
          </div>
        </header>

        <ChatInterface 
          user={user} 
          chatId={currentChatId} 
          theme={theme}
          onChatCreated={(id) => setCurrentChatId(id)}
          onKeyError={() => {
            setIsKeyValid(false);
            handleActivateKey(); // Auto-open sync dialog if error occurs
          }}
        />
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          user={user} 
          theme={theme}
          setTheme={setTheme}
          onClose={() => setIsSettingsOpen(false)} 
          onLogout={() => { auth.signOut(); setUser(null); }}
        />
      )}
    </div>
  );
};

export default App;
