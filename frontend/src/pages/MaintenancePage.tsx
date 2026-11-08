import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [machineId, setMachineId] = useState('');
  const [type, setType] = useState('Preventive');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState('Medium');

  const loadData = async () => {
    try {
      setLoading(true);
      const [moRes, mchRes] = await Promise.all([
        api.request(`/maintenance/orders?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/machines?plantId=${activePlant?._id || ''}`)
      ]);

      if (moRes.success) setOrders(moRes.orders);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/maintenance/orders', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          machineId,
          type,
          title,
          description,
          scheduledDate,
          priority
        })
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(`Error scheduling maintenance: ${err.message}`);
    }
  };

  const handleComplete = async (orderId: string) => {
    const actions = prompt('Enter actions taken during servicing:');
    if (!actions) return;
    const downtime = prompt('Enter total downtime minutes (0 if none):', '30');

    try {
      await api.request(`/maintenance/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Completed',
          actionsTaken: actions,
          downtimeDurationMinutes: Number(downtime || 0)
        })
      });
      loadData();
    } catch (err: any) {
      alert(`Error completing order: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Maintenance Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Preventive Maintenance (PM) schedules, emergency breakdown work orders, and machine service records.
          </p>
        </div>

        {hasPermission('maintenance:create') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Maintenance</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Machine</th>
                <th className="py-3 px-4">Title / Task</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading maintenance orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">No maintenance orders logged.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{o.machineId?.name}</div>
                      <div className="text-[10px] text-slate-400">{o.machineId?.code}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{o.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {o.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          o.priority === 'Emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(o.scheduledDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-600">{o.assignedTechnicianId?.name || 'Assigned Lead'}</td>
                    <td className="py-3 px-4 text-right">
                      {o.status !== 'Completed' && hasPermission('maintenance:update') && (
                        <button
                          onClick={() => handleComplete(o._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                        >
                          Complete Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Schedule Machine Maintenance</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Equipment</label>
                <select
                  required
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose Machine --</option>
                  {machines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Maintenance Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Preventive">Preventive Maintenance (PM)</option>
                  <option value="Breakdown">Breakdown Repair</option>
                  <option value="Calibration">Gauge & Sensor Calibration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="Monthly 5-Axis Spindle Lubrication & Alignment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / SOP Details</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Check way lube pressure, replace primary filter cartridge..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-bold"
                >
                  Schedule Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
