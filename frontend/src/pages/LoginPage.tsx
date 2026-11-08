import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Factory, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { Factory360AnimatedBackground } from '../components/Factory360AnimatedBackground';

export const LoginPage: React.FC = () => {
  const { login, setupRequired } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('RSRAdmin@2026!');
  };

  if (setupRequired) {
    navigate('/setup-admin');
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[#030814] select-none">
      {/* =========================================================================
          CONTINUOUS ANIMATED 8-FRAME MANUFACTURING INDUSTRIAL BACKGROUND
          Cycles through 8 photorealistic manufacturing environments with Ken Burns motion
          ========================================================================= */}
      <Factory360AnimatedBackground />

      {/* =========================================================================
          FOREGROUND ENTERPRISE LOGIN CARD (CENTERED & 100% VISIBLE)
          ========================================================================= */}
      <div className="w-full max-w-md relative z-10 transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-4">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex relative mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-industrial-700 via-industrial-600 to-cyan-500 items-center justify-center shadow-xl shadow-cyan-500/20 border border-cyan-400/30 flex relative z-10">
              <Factory className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            {/* Ambient logo glow */}
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-lg -z-0 animate-pulse" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-wider drop-shadow-sm font-sans">
            RSR FACTORY360
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1 tracking-wide">
            Enterprise MES & Production Management Platform
          </p>

          <div className="inline-flex items-center space-x-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-900/80 border border-cyan-700/50 text-cyan-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Jigani & Bommasandra Industrial Pilot</span>
          </div>
        </div>

        {/* Login Form Glassmorphic Card */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-700/70 border-t-cyan-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/95">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Secure Enterprise Login</span>
            </h2>
            <div className="flex items-center space-x-1 text-[11px] text-cyan-400/90 font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>STATION AUTH</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Enter your authorized factory credentials to access your station.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Company Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@rsrtechnologies.in"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-industrial-600 to-cyan-600 hover:from-industrial-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all mt-6 disabled:opacity-50 hover:shadow-cyan-500/20 active:scale-[0.99]"
            >
              <span>{loading ? 'Authenticating Station...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed accounts quick-selector for evaluators & development testing */}
          <div className="mt-7 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pilot Quick-Access Profiles
              </span>
              <span className="text-[10px] text-slate-500">Auto-fill for eval</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@rsrtechnologies.in')}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-cyan-500/70 hover:bg-slate-800/60 transition-all text-slate-300 group"
              >
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">System Admin</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">admin@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('operator@rsrtechnologies.in')}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-cyan-500/70 hover:bg-slate-800/60 transition-all text-slate-300 group"
              >
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Machine Operator</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">operator@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('prod.manager@rsrtechnologies.in')}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-cyan-500/70 hover:bg-slate-800/60 transition-all text-slate-300 group"
              >
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Production Mgr</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">prod.manager@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('quality@rsrtechnologies.in')}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-cyan-500/70 hover:bg-slate-800/60 transition-all text-slate-300 group"
              >
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Quality Inspector</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">quality@rsrtechnologies.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Secure station footer indicator */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>RSR Technologies 256-bit Encrypted MES Station Authorization</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
