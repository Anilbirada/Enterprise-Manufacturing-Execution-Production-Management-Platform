import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Network, Plus, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';

export const ProductionLinesPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [targetPerHour, setTargetPerHour] = useState(100);
  const [capacityPerShift, setCapacityPerShift] = useState(800);

  const loadLines = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/master-data/lines?plantId=${activePlant?._id || ''}`);
      if (res.success) setLines(res.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, [activePlant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/master-data/lines', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          code,
          name,
          targetPerHour: Number(targetPerHour),
          capacityPerShift: Number(capacityPerShift),
          status: 'Active'
        })
      });
      setShowModal(false);
      setCode('');
      setName('');
      loadLines();
    } catch (err: any) {
      alert(`Error creating line: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Production Lines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing assembly and machining line configurations, throughput targets and active orders.
          </p>
        </div>

        {hasPermission('lines:edit') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Line</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading production lines...</div>
        ) : lines.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">No production lines configured.</div>
        ) : (
          lines.map((line) => (
            <div key={line._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {line.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{line.name}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    line.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : line.status === 'Down'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {line.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Target Rate</div>
                  <div className="font-bold text-slate-800">{line.targetPerHour} PCS / hr</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Shift Capacity</div>
                  <div className="font-bold text-slate-800">{line.capacityPerShift} PCS / shift</div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Current Work Order: </span>
                {line.currentWorkOrderId ? (
                  <span className="font-bold text-industrial-600">
                    {line.currentWorkOrderId.orderNumber} ({line.currentWorkOrderId.completedQuantity} / {line.currentWorkOrderId.plannedQuantity})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None Active</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Production Line</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Line Code</label>
                <input
                  type="text"
                  required
                  placeholder="LINE-ASSY-03"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Line Name</label>
                <input
                  type="text"
                  required
                  placeholder="Packaging & Final Testing Line"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target / Hour</label>
                  <input
                    type="number"
                    required
                    value={targetPerHour}
                    onChange={(e) => setTargetPerHour(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Capacity / Shift</label>
                  <input
                    type="number"
                    required
                    value={capacityPerShift}
                    onChange={(e) => setCapacityPerShift(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
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
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium"
                >
                  Save Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
