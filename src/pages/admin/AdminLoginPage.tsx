import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated) {
            navigate('/admin/dashboard', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        let errorMsg = 'קוד PIN שגוי';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `שגיאת שרת (${res.status})`;
        }
        setError(errorMsg);
        setPin('');
      }
    } catch (err: any) {
      console.error('Login attempt failed:', err);
      setError(`שגיאת תקשורת: ${err.message || 'לא ניתן לגשת לשרת'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (val: string) => {
    if (/^\d{0,8}$/.test(val)) setPin(val);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] relative overflow-hidden font-sans text-white" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 mb-6 group transition-transform hover:scale-110 duration-300">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ממשק ניהול</h1>
            <p className="text-slate-400 font-medium">ישראלי - הדפסות ורגעים</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 mr-1">
                קוד PIN מאובטח
              </label>
              
              <div className="flex justify-center gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      i < pin.length 
                        ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                        : 'border-slate-700 bg-transparent'
                    } ${error ? 'border-red-500/50' : ''}`}
                  />
                ))}
              </div>

              <div className="relative group">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 px-6 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-base"
                  placeholder="הזן קוד PIN"
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-shake">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                loading || pin.length < 4
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>כניסה למערכת</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <a 
              href="/#" 
              className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              חזרה לחנות
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default AdminLoginPage;
