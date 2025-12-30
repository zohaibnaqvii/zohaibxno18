
import React from 'react';
import { User, Theme } from '../types';
import { db } from '../firebase';

interface SettingsModalProps {
  user: User;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, theme, setTheme, onClose, onLogout }) => {
  const isDark = theme === 'dark';

  const handleClearHistory = async () => {
    if (confirm("Bhai sure ho? Saari chat history udd jayegi hamesha ke liye!")) {
      await db.clearAllHistory(user.uid);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-md rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${isDark ? 'bg-[#171717] border-white/10' : 'bg-white border-black/5'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <h2 className={`text-xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-black'}`}>System Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-black'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center bg-black text-white font-black text-2xl ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              ZX
            </div>
            <div className="space-y-1">
              <div className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{user.name}</div>
              <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status: Active</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Visuals</div>
            
            <div className={`flex items-center justify-between p-4 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{isDark ? 'Stealth Mode' : 'Light Mode'}</span>
              </div>
              
              <button 
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full relative transition-colors ${isDark ? 'bg-white' : 'bg-black'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${isDark ? 'left-7 bg-black' : 'left-1 bg-white'}`} />
              </button>
            </div>

            <div className={`text-[10px] font-black uppercase tracking-[0.2em] pt-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Danger Zone</div>

            <button 
              onClick={handleClearHistory}
              className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all group ${isDark ? 'bg-white/5 border-white/5 hover:bg-red-500/10 hover:border-red-500/20' : 'bg-black/5 border-black/5 hover:bg-red-500/5 hover:border-red-500/10'}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Format History</span>
              </div>
            </button>

            <button 
              onClick={onLogout}
              className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Exit Portal</span>
              </div>
            </button>
          </div>
        </div>

        <div className={`p-4 text-center ${isDark ? 'bg-white/5 text-gray-600' : 'bg-black/5 text-gray-400'}`}>
          <p className="text-[9px] font-black uppercase tracking-widest">ZOHAIB X NO 18 v1.0.0 | BUILT BY LEGEND</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
