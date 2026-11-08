import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { setUnreadNotificationCount } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.request('/notifications');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadNotificationCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.request('/notifications/mark-all-read', { method: 'POST' });
      setUnreadNotificationCount(0);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.request(`/notifications/${id}/read`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing event broadcasts, critical Andon alarms, quality holds, and maintenance reminders.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Mark All as Read
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No active notifications.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`p-4 flex items-start space-x-3 transition-colors cursor-pointer ${
                n.isRead ? 'bg-white' : 'bg-industrial-50/40 hover:bg-industrial-50'
              }`}
            >
              <div className="p-1 rounded-full bg-slate-50">{getNotificationIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <div className="mt-2 flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {n.category}
                  </span>
                  {!n.isRead && (
                    <span className="font-bold text-cyan-600 uppercase tracking-wider text-[9px]">
                      New Alert
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
