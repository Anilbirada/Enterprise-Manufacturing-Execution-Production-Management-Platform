import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Bell,
  LogOut,
  Wifi,
  WifiOff,
  Tablet,
  RefreshCw,
  ChevronDown,
  User,
  ShieldAlert
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activePlant, plants, selectPlant, logout } = useAuth();
  const { isConnected, unreadNotificationCount } = useSocket();
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  const offlineQueueCount = api.getOfflineQueue().length;

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncOfflineQueue();
      alert(`Offline Synchronization Complete: ${res.synced} actions synced, ${res.failed} failed.`);
    } catch (e: any) {
      alert(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="h-16 bg-industrial-950 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none">
      {/* Brand & Plant Selector */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-industrial-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-industrial-500/20">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">RSR FACTORY360</span>
              <span className="text-[10px] bg-industrial-800 text-cyan-300 font-semibold px-1.5 py-0.5 rounded border border-cyan-800/40">
                MES ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">RSR Technologies • Jigani & Bommasandra</p>
          </div>
        </div>

        {/* Plant Switcher */}
        {plants.length > 0 && (
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-700/80 rounded-md px-3 py-1.5 text-xs">
            <span className="text-slate-400 mr-2">Active Plant:</span>
            <select
              value={activePlant?._id || ''}
              onChange={(e) => {
                const found = plants.find((p) => p._id === e.target.value);
                if (found) selectPlant(found);
              }}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer pr-2"
            >
              {plants.map((p) => (
                <option key={p._id} value={p._id} className="bg-slate-900 text-white">
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        {/* Real-time WebSocket connection badge */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 text-[11px]">{isConnected ? 'Live Telemetry' : 'Disconnected'}</span>
        </div>

        {/* Offline Queue Badge & Sync Button */}
        {offlineQueueCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center space-x-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md hover:bg-amber-500/30 transition-colors"
            title="Click to synchronize offline actions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{offlineQueueCount} Offline Queue</span>
          </button>
        )}

        {/* Tablet Shop Floor Mode Toggle */}
        <button
          onClick={() => navigate('/execution')}
          className="flex items-center space-x-1.5 text-xs bg-industrial-800 hover:bg-industrial-700 text-cyan-200 border border-cyan-700/50 px-3 py-1.5 rounded-md font-medium transition-all shadow-sm"
          title="Switch to Shop Floor Operator Tablet Mode"
        >
          <Tablet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Shop-Floor Mode</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-alarm-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* User Role Card & Logout */}
        <div className="flex items-center pl-3 border-l border-slate-800 space-x-3">
          <div className="hidden lg:block text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[10px] text-cyan-400 font-medium">{user?.role}</div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
