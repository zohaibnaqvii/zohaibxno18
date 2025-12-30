
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import { auth, db } from './firebase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSystemActive, setIsSystemActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('zohaibx_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    const init = async () => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) setUser(currentUser);

      // Check for mandatory key selection if in AI Studio environment
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsSystemActive(hasKey);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleActivateSystem = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsSystemActive(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('zohaibx_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleLogin = async () => {
    const loggedInUser = await auth.signIn();
    setUser(loggedInUser);
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="animate-pulse text-2xl font-black tracking-tighter text-white">ZOHAIB X NO 18</div>
    </div>
  );

  if (!user) return <AuthPage onLogin={handleLogin} />;

  // API Key Guard Screen (User requested Access Denied UI)
  if (!isSystemActive) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-red-950/30 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v6H9V6h6m0-2H9c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"></path><rect x="3" y="14" width="18" height="6" rx="2"></rect><line x1="7" y1="17" x2="7" y2="17"></line><line x1="10" y1="17" x2="10" y2="17"></line></svg>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Access Denied</h1>
          <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
            Bhai system band hai. API key activate karni hogi Access panel se.
          </p>
        </div>
        <button 
          onClick={handleActivateSystem}
          className="px-12 py-4 bg-[#333] hover:bg-white hover:text-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl"
        >
          Activate System
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em] hover:text-white transition-colors">Billing Info</a>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0d0d0d] text-gray-200' : 'bg-white text-gray-900'}`}>
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
        <header className={`h-14 flex items-center justify-between px-4 border-b shrink-0 backdrop-blur-md z-10 ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-black/5 bg-white/50'}`}>
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
          <div className="text-xs font-black tracking-tighter uppercase">ZOHAIB X NO 18</div>
          <button onClick={() => setCurrentChatId(null)} className="p-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
        </header>

        <ChatInterface 
          user={user} 
          chatId={currentChatId} 
          theme={theme}
          onChatCreated={(id) => setCurrentChatId(id)}
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
