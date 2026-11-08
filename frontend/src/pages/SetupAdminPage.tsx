import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Factory, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SetupAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('Anil');
  const [email, setEmail] = useState('admin@rsrtechnologies.in');
  const [password, setPassword] = useState('RSRAdmin@2026!');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.request('/auth/setup-admin', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'First administrator setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-industrial-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-industrial-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">First Administrator Initialization</h1>
          <p className="text-xs text-slate-400 mt-1">Configure root administrator account for RSR Factory360</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Administrator initialized! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Administrator Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Master Password (min 8 chars)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-cyan-600/30 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? 'Initializing...' : 'Initialize System Administrator'}
          </button>
        </form>
      </div>
    </div>
  );
};
