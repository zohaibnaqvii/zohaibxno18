
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: () => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    setLoading(true);
    try {
      await onLogin();
    } catch (err: any) {
      console.error("Access Error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-between py-16 px-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
      
      {/* Aesthetic Background Grid - Faded more for mobile */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-6 h-full w-full">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white h-24 w-full"></div>
          ))}
        </div>
      </div>

      {/* Top Section */}
      <div className="relative z-10 w-full text-center mt-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white text-black font-black text-4xl shadow-[0_0_80px_rgba(255,255,255,0.25)] animate-pulse mb-8">
          ZX
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Zohaib X NO 18</h1>
          <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed">Elite Private AI Access</p>
        </div>
      </div>

      {/* Bottom Section - Pushed down for 'Lamba' look */}
      <div className="relative z-10 w-full max-w-xs space-y-8 mb-4">
        <div className="text-center px-4">
           <p className="text-gray-400 text-[10px] font-medium leading-relaxed italic opacity-60">
             "Legit, Raw, and 100% Free."
           </p>
        </div>

        <button 
          onClick={handleEnter}
          disabled={loading}
          className={`group w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all transform active:scale-90 ${loading ? 'bg-gray-900 text-gray-600' : 'bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]'}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              BOOTING...
            </span>
          ) : (
            <>
              ENTER SYSTEM
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-[8px] text-gray-800 font-black uppercase tracking-[0.6em] animate-pulse">Established by Legend</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
