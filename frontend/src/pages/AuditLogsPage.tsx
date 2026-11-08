import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, Filter, Clock, UserCheck, AlertOctagon } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { activePlant } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      let endpoint = `/audit?plantId=${activePlant?._id || ''}`;
      if (actionFilter) endpoint += `&action=${actionFilter}`;
      const res = await api.request(endpoint);
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activePlant, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Compliance & Security Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit logs recording every state transition, quantity booking, quality hold, and security event.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh Logs
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <span className="text-xs font-semibold text-slate-500">Filter Event Action:</span>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
        >
          <option value="">All Audit Actions</option>
          <option value="TRANSITION_WORK_ORDER_STATUS">Status Transitions</option>
          <option value="PRODUCTION_BOOKING">Production Postings</option>
          <option value="PLACE_QUALITY_HOLD">Quality Holds</option>
          <option value="RELEASE_QUALITY_HOLD">Hold Releases</option>
          <option value="REPORT_DOWNTIME">Downtime Events</option>
          <option value="ACCESS_DENIED">Access Denied Security Events</option>
          <option value="USER_LOGIN">User Logins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No audit records found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.userName || log.userEmail}</div>
                      <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {log.newValue ? JSON.stringify(log.newValue) : log.entityId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
