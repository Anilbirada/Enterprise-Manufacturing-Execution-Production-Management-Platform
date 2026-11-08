import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AndonStatus, AndonSeverity } from '../types';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Search
} from 'lucide-react';

export const AndonPage: React.FC = () => {
  const { activePlant, hasPermission, user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // New Issue Form State
  const [productionLineId, setProductionLineId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mechanical Failure');
  const [severity, setSeverity] = useState<AndonSeverity>(AndonSeverity.MEDIUM);

  const loadData = async () => {
    try {
      setLoading(true);
      const [andonRes, linesRes, mchRes] = await Promise.all([
        api.request(`/andon/board?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/lines?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/machines?plantId=${activePlant?._id || ''}`)
      ]);

      if (andonRes.success) setIssues(andonRes.issues);
      if (linesRes.success) setLines(linesRes.list);
      if (mchRes.success) setMachines(mchRes.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/andon/report', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          productionLineId,
          machineId: machineId || undefined,
          title,
          description,
          category,
          severity
        })
      });
      setShowReportModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(`Error raising Andon issue: ${err.message}`);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.request(`/andon/${id}/acknowledge`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution summary / actions taken:');
    if (!notes) return;
    try {
      await api.request(`/andon/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes: notes })
      });
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEscalate = async (id: string) => {
    if (!confirm('Are you sure you want to escalate this critical issue to Plant Management?')) return;
    try {
      await api.request(`/andon/${id}/escalate`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getSeverityBadge = (s: AndonSeverity) => {
    switch (s) {
      case AndonSeverity.CRITICAL:
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      case AndonSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case AndonSeverity.MEDIUM:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case AndonSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Downtime & Andon Command Board</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              Live Issue Escalation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual alarm system for equipment breakdowns, material shortages, and line stoppages.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
        >
          <Flame className="w-4 h-4" />
          <span>Raise Andon Alarm</span>
        </button>
      </div>

      {/* Active Andon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading live Andon board...</div>
        ) : issues.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700">Factory Floor Healthy</h3>
            <p className="text-slate-400 mt-1">No active stoppages or escalated Andon alarms at this time.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue._id}
              className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 flex flex-col justify-between ${
                issue.severity === AndonSeverity.CRITICAL ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {issue.issueNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{issue.title}</h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  {issue.description}
                </p>

                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Production Line:</span>
                    <span className="font-semibold text-slate-800">{issue.productionLineId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Machine:</span>
                    <span className="font-semibold text-slate-800">{issue.machineId?.name || 'Line General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reported At:</span>
                    <span className="font-medium">{new Date(issue.reportedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-industrial-700">{issue.status}</span>
                  </div>
                </div>

                {issue.isEscalated && (
                  <div className="mt-3 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 p-1.5 rounded flex items-center justify-between">
                    <span className="flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
                      Escalated to Management
                    </span>
                    <span>Level {issue.escalationLevel}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {issue.status === AndonStatus.OPEN && (
                  <button
                    onClick={() => handleAcknowledge(issue._id)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                  >
                    Acknowledge
                  </button>
                )}

                {issue.status !== AndonStatus.RESOLVED && (
                  <button
                    onClick={() => handleResolve(issue._id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                  >
                    Resolve Issue
                  </button>
                )}

                {!issue.isEscalated && issue.status !== AndonStatus.RESOLVED && (
                  <button
                    onClick={() => handleEscalate(issue._id)}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-semibold"
                    title="Escalate to Plant Manager"
                  >
                    Escalate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raise Andon Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2 text-rose-600">
              <Flame className="w-5 h-5" />
              <span>Raise Operational Andon Alarm</span>
            </h3>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Production Line</label>
                <select
                  required
                  value={productionLineId}
                  onChange={(e) => setProductionLineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Select Line Affected --</option>
                  {lines.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Machine (Optional)</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- None (Line Level Issue) --</option>
                  {machines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alarm Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Pressure Loss on Clamp Rig"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Mechanical Failure">Mechanical Failure</option>
                    <option value="Electrical Failure">Electrical Failure</option>
                    <option value="Material Shortage">Material Shortage</option>
                    <option value="Operator Unavailable">Operator Unavailable</option>
                    <option value="Quality Issue">Quality Issue</option>
                    <option value="Changeover">Changeover</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AndonSeverity)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value={AndonSeverity.LOW}>Low</option>
                    <option value={AndonSeverity.MEDIUM}>Medium</option>
                    <option value={AndonSeverity.HIGH}>High</option>
                    <option value={AndonSeverity.CRITICAL}>Critical (Halt Line)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe failure symptoms, noises, or error codes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Trigger Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
