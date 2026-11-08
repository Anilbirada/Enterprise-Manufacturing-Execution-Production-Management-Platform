import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Factory, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background industrial grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-industrial-600 to-cyan-400 items-center justify-center shadow-xl shadow-cyan-500/20 mb-4 border border-cyan-300/30">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">RSR FACTORY360</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise MES & Production Management Platform</p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-industrial-900 border border-cyan-800/40 text-cyan-300">
            Jigani & Bommasandra Industrial Pilot
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <h2 className="text-lg font-semibold text-white mb-2">Secure Enterprise Login</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your authorized factory credentials to access your station.</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@rsrtechnologies.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-industrial-600 hover:bg-industrial-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-industrial-600/30 flex items-center justify-center space-x-2 transition-all mt-6 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed accounts quick-selector for evaluators & development testing */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pilot Quick-Access Profiles
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@rsrtechnologies.in')}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-left hover:border-cyan-500 transition-colors text-slate-300"
              >
                <div className="font-medium text-white">System Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('operator@rsrtechnologies.in')}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-left hover:border-cyan-500 transition-colors text-slate-300"
              >
                <div className="font-medium text-white">Machine Operator</div>
                <div className="text-[10px] text-slate-500 truncate">operator@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('prod.manager@rsrtechnologies.in')}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-left hover:border-cyan-500 transition-colors text-slate-300"
              >
                <div className="font-medium text-white">Production Manager</div>
                <div className="text-[10px] text-slate-500 truncate">prod.manager@rsrtechnologies.in</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('quality@rsrtechnologies.in')}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-left hover:border-cyan-500 transition-colors text-slate-300"
              >
                <div className="font-medium text-white">Quality Manager</div>
                <div className="text-[10px] text-slate-500 truncate">quality@rsrtechnologies.in</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
