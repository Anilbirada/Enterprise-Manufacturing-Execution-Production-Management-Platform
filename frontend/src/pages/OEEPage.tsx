import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Gauge,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Filter
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

export const OEEPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [plantOEE, setPlantOEE] = useState<any>(null);
  const [machinesOEE, setMachinesOEE] = useState<any[]>([]);
  const [downtimePareto, setDowntimePareto] = useState<any[]>([]);
  const [kpiSettings, setKpiSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOEEData = async () => {
    try {
      setLoading(true);
      const [plantRes, machRes, paretoRes, settingsRes] = await Promise.all([
        api.request(`/oee/plant?plantId=${activePlant?._id || ''}`),
        api.request(`/oee/machines-comparison?plantId=${activePlant?._id || ''}`),
        api.request(`/downtime/pareto?plantId=${activePlant?._id || ''}`),
        api.request(`/oee/settings?plantId=${activePlant?._id || ''}`)
      ]);

      if (plantRes.success) setPlantOEE(plantRes.result);
      if (machRes.success) setMachinesOEE(machRes.machines);
      if (paretoRes.success) setDowntimePareto(paretoRes.pareto);
      if (settingsRes.success) setKpiSettings(settingsRes.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOEEData();
  }, [activePlant]);

  const pOee = plantOEE || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">OEE & Efficiency Engine</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-industrial-100 text-industrial-800 border border-industrial-200">
              ISO 22400 / SEMI E10 Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overall Equipment Effectiveness based on planned calendar hours, net operating time, and verified quality yield.
          </p>
        </div>

        <button
          onClick={loadOEEData}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Recalculate KPIs
        </button>
      </div>

      {/* Main OEE 4-Pillar Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Availability */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Availability (A)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600">
            {pOee.availabilityPercent !== null && pOee.availabilityPercent !== undefined
              ? `${pOee.availabilityPercent}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            Operating: <span className="font-semibold text-slate-700">{pOee.operatingMinutes || 0}m</span> / Planned: <span className="font-semibold text-slate-700">{pOee.plannedProductionMinutes || 0}m</span>
          </div>
          <div className="text-[10px] text-slate-400">Formula: Operating Time / Planned Time</div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Performance (P)</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-600">
            {pOee.performancePercent !== null && pOee.performancePercent !== undefined
              ? `${pOee.performancePercent}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            Total Pieces Produced: <span className="font-semibold text-slate-700">{pOee.totalProductionCount || 0}</span>
          </div>
          <div className="text-[10px] text-slate-400">Formula: (Ideal Cycle × Total Count) / Operating Time</div>
        </div>

        {/* Quality */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Quality (Q)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {pOee.qualityPercent !== null && pOee.qualityPercent !== undefined
              ? `${pOee.qualityPercent}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            Good: <span className="font-semibold text-emerald-700">{pOee.goodQuantity || 0}</span> | Scrap: <span className="font-semibold text-rose-600">{pOee.rejectedQuantity || 0}</span>
          </div>
          <div className="text-[10px] text-slate-400">Formula: Good Quantity / Total Quantity</div>
        </div>

        {/* Overall OEE */}
        <div className="bg-gradient-to-br from-industrial-950 to-industrial-850 text-white rounded-xl p-5 shadow-md space-y-2 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-cyan-300 font-medium">
            <span>Overall OEE Score</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-300">
            {pOee.oeePercent !== null && pOee.oeePercent !== undefined
              ? `${pOee.oeePercent}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-300">
            Target Benchmark: <span className="font-semibold text-cyan-200">{kpiSettings?.oeeTargetPercent || 85}%</span>
          </div>
          <div className="text-[10px] text-slate-400">Formula: Availability × Performance × Quality</div>
        </div>
      </div>

      {/* Machine-wise OEE Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Machine Fleet OEE Breakdown & Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Operating / Planned</th>
                <th className="py-2.5 px-3">Unplanned Downtime</th>
                <th className="py-2.5 px-3">Produced (Good/Scrap)</th>
                <th className="py-2.5 px-3">Availability</th>
                <th className="py-2.5 px-3">Performance</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3 font-bold">OEE Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machinesOEE.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No machine performance data logged in selected window.
                  </td>
                </tr>
              ) : (
                machinesOEE.map((m) => (
                  <tr key={m.scopeId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 font-mono">{m.operatingMinutes}m / {m.plannedProductionMinutes}m</td>
                    <td className="py-2.5 px-3 text-rose-600 font-semibold">{m.unplannedDowntimeMinutes} mins</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-emerald-600">{m.goodQuantity}</span> / <span className="text-rose-500">{m.rejectedQuantity}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-blue-700">{m.availabilityPercent ?? 'N/A'}%</td>
                    <td className="py-2.5 px-3 font-medium text-cyan-700">{m.performancePercent ?? 'N/A'}%</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{m.qualityPercent ?? 'N/A'}%</td>
                    <td className="py-2.5 px-3 font-extrabold text-industrial-700 text-sm">
                      {m.oeePercent !== null && m.oeePercent !== undefined ? `${m.oeePercent}%` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downtime Pareto Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Downtime Loss Analysis (Pareto Classification)
          </h2>
          <p className="text-xs text-slate-500">Root cause categories by total downtime minutes lost</p>
        </div>

        <div className="h-64">
          {downtimePareto.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No downtime records found in current reporting period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimePareto}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="_id" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalMinutes" name="Downtime Minutes" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
