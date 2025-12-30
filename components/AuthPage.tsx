
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
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)] opacity-50"></div>
      
      {/* Aesthetic Background Grid */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20 h-20 w-full"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] bg-white text-black font-black text-5xl shadow-[0_0_60px_rgba(255,255,255,0.3)] animate-pulse mb-4">
            ZX
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white">ZOHAIB X NO 18</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] px-4">Elite Access • Unfiltered & Free</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <p className="text-gray-300 text-xs font-bold leading-relaxed italic">
              "Bina kisi rukawat ke, enjoy karo!"
            </p>
          </div>

          <button 
            onClick={handleEnter}
            disabled={loading}
            className={`group w-full flex items-center justify-center gap-3 py-5 px-6 rounded-2xl font-black text-sm uppercase tracking-[0.25em] transition-all transform active:scale-95 ${loading ? 'bg-gray-800 text-gray-500' : 'bg-white text-black hover:bg-gray-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                LOADING SYSTEM...
              </span>
            ) : (
              <>
                ENTER SYSTEM
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </>
            )}
          </button>
        </div>

        <div className="pt-20">
          <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em] animate-pulse">LEGENDARY ACCESS GRANTED</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
