
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (code: string) => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await onLogin(code);
    } catch (err: any) {
      setError(err.message || "Access Denied");
      // Add a slight shake effect would be nice, but simple alert/text for now
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)] opacity-50"></div>
      
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20 h-20 w-full"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white text-black font-black text-4xl shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-pulse">
            ZX
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white">ZOHAIB X NO 18</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] px-4">Elite Intelligence Access Only</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block text-left pl-2">Enter Secret Code</label>
            <input 
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-white/5 border-2 ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl py-4 px-6 text-white text-center text-xl font-black tracking-widest focus:outline-none focus:border-white/40 transition-all placeholder:text-gray-800`}
              disabled={loading}
            />
            {error && <p className="text-red-500 text-[10px] font-bold uppercase mt-2 animate-bounce">{error}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading || !code}
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 ${loading ? 'bg-gray-800 text-gray-500' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {loading ? 'Verifying...' : 'Access System'}
          </button>
        </form>

        <div className="pt-20">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em]">Authorized by Legend</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
