import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Filter
} from 'lucide-react';

export const PlanningPage: React.FC = () => {
  const { activePlant } = useAuth();
  const [scheduleLines, setScheduleLines] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating a plan
  const [planNumber, setPlanNumber] = useState('');
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ganttRes, plansRes] = await Promise.all([
        api.request(`/planning/gantt?plantId=${activePlant?._id || ''}`),
        api.request(`/planning/plans?plantId=${activePlant?._id || ''}`)
      ]);

      if (ganttRes.success) setScheduleLines(ganttRes.lines);
      if (plansRes.success) setPlans(plansRes.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/planning/plans', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          planNumber,
          title,
          periodStart,
          periodEnd
        })
      });
      setShowCreateModal(false);
      setPlanNumber('');
      setTitle('');
      loadData();
    } catch (err: any) {
      alert(`Error creating plan: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Production Planning & Scheduler</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gantt-style line capacity allocation, sequencing, and production backlog orchestration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Master Plan</span>
          </button>
        </div>
      </div>

      {/* Gantt Timeline Scheduler Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-industrial-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Production Line Gantt Schedule ({viewMode} View)
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
              <span>Released</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span>Overdue</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading schedule timeline...</div>
        ) : scheduleLines.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No production lines configured for scheduling in this facility.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {scheduleLines.map((line) => (
              <div key={line.lineId} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-slate-900">{line.lineName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {line.lineCode}
                    </span>
                    <span className="text-[11px] text-slate-400">Target: {line.targetPerHour} PCS/hr</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {line.orders?.length || 0} Orders Queued
                  </span>
                </div>

                {/* Scheduled Orders Bar Container */}
                {line.orders && line.orders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                    {line.orders.map((order: any) => {
                      const percent = order.plannedQuantity > 0 ? Math.round((order.completedQuantity / order.plannedQuantity) * 100) : 0;
                      return (
                        <div
                          key={order.id}
                          className={`p-3 rounded-lg border text-xs relative ${
                            order.isOverdue
                              ? 'bg-rose-50/60 border-rose-300'
                              : order.status === 'In Progress'
                              ? 'bg-emerald-50/40 border-emerald-300'
                              : 'bg-blue-50/40 border-blue-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900">{order.orderNumber}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                order.priority === 'Urgent' || order.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.priority}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 truncate font-medium">{order.productName}</div>

                          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                            <span>Completed: {order.completedQuantity} / {order.plannedQuantity}</span>
                            <span className="font-semibold">{percent}%</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${order.isOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>

                          <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center">
                            <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                            {order.isQualityHold && (
                              <span className="text-amber-600 font-bold bg-amber-100 px-1 rounded text-[9px]">
                                HOLD
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
                    Line idle. No active production scheduled.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Production Plans Master List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Master Production Plans</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Plan Code</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No master plans recorded. Click "Create Master Plan" above to create one.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.planNumber}</td>
                    <td className="py-2.5 px-3 text-slate-800">{p.title}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{p.createdBy?.name || 'Manager'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Master Production Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plan Number</label>
                <input
                  type="text"
                  required
                  placeholder="PLAN-2026-W45"
                  value={planNumber}
                  onChange={(e) => setPlanNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="Weekly Jigani Caliper Target"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium"
                >
                  Save Master Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
