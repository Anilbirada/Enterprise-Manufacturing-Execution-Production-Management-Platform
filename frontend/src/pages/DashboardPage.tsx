import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Activity,
  PlaySquare,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { activePlant } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/dashboard/realtime?plantId=${activePlant?._id || ''}`);
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [activePlant]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        <Activity className="w-5 h-5 animate-spin mr-2 text-industrial-600" />
        Loading real-time command centre metrics...
      </div>
    );
  }

  const summary = data?.summary || {
    plannedTotal: 0,
    completedTotal: 0,
    rejectedTotal: 0,
    achievementPercent: 0,
    qualityPercent: 100,
    activeOrders: 0,
    completedOrders: 0,
    delayedOrders: 0
  };

  const machineCounts = data?.machineStatusCounts || {
    running: 0,
    idle: 0,
    stopped: 0,
    maintenance: 0,
    fault: 0,
    offline: 0,
    total: 0
  };

  const oee = data?.oee || {};

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Factory Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing Command Centre • Plant: <span className="font-semibold text-slate-700">{activePlant?.name || 'All Facilities'}</span>
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors"
        >
          Refresh Feed
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500">Planned vs Actual</span>
            <Layers className="w-4 h-4 text-industrial-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary.completedTotal} <span className="text-xs text-slate-400 font-normal">/ {summary.plannedTotal} PCS</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{summary.achievementPercent}% Target Attained</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500">Quality First-Pass</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {summary.qualityPercent}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {summary.rejectedTotal} Total Scrap Units
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500">Active Work Orders</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary.activeOrders}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>{summary.delayedOrders} Overdue/Delayed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500">Facility Overall OEE</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-industrial-700 mt-2">
            {oee.oeePercent !== null && oee.oeePercent !== undefined ? `${oee.oeePercent}%` : 'N/A'}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500 space-x-2">
            <span>A: {oee.availabilityPercent ?? 'N/A'}%</span>
            <span>P: {oee.performancePercent ?? 'N/A'}%</span>
            <span>Q: {oee.qualityPercent ?? 'N/A'}%</span>
          </div>
        </div>
      </div>

      {/* Machine Status Live Board */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-industrial-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Machine Fleet Status Board</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Total Machines: {machineCounts.total}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Running</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{machineCounts.running}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Producing normally</div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
            <div className="text-[11px] font-semibold text-cyan-800 uppercase">Idle</div>
            <div className="text-2xl font-bold text-cyan-600 mt-1">{machineCounts.idle}</div>
            <div className="text-[10px] text-cyan-700 mt-0.5">Ready for job</div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-800 uppercase">Fault / Down</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{machineCounts.fault}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Immediate attention</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Stopped</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{machineCounts.stopped}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Planned stoppage</div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase">Maintenance</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{machineCounts.maintenance}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">PM or repair</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-600 uppercase">Offline</div>
            <div className="text-2xl font-bold text-slate-500 mt-1">{machineCounts.offline}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Disconnected</div>
          </div>
        </div>
      </div>

      {/* Hourly Trend Chart & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Production Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Hourly Production Output</h3>
              <p className="text-xs text-slate-500">Good output vs rejected scrap pieces</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.hourlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="good" name="Good Quantity" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejections" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alarms & Andon Issues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Active Andon & Downtime</span>
            </h3>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {data?.activeAndonCount || 0} Open
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64">
            {data?.activeAndonIssues?.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All lines running smoothly. No active Andon alarms.
              </div>
            ) : (
              data?.activeAndonIssues?.map((issue: any) => (
                <div key={issue._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-900">{issue.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        issue.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : issue.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{issue.description}</p>
                  <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                    <span>Line: {issue.productionLineId?.name || 'General'}</span>
                    <span>Status: {issue.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
