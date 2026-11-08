import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, Coffee, Calendar, CheckCircle2 } from 'lucide-react';

export const ShiftPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('14:00');
  const [plannedBreakMinutes, setPlannedBreakMinutes] = useState(45);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/master-data/shifts?plantId=${activePlant?._id || ''}`);
      if (res.success) setShifts(res.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [activePlant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/master-data/shifts', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          code,
          name,
          startTime,
          endTime,
          durationMinutes: 480,
          plannedBreakMinutes: Number(plannedBreakMinutes),
          breaks: [
            { name: 'Tea Break', startTime: '09:00', durationMinutes: 15 },
            { name: 'Lunch Break', startTime: '12:00', durationMinutes: 30 }
          ]
        })
      });
      setShowModal(false);
      setCode('');
      setName('');
      loadShifts();
    } catch (err: any) {
      alert(`Error creating shift: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Shift Calendar & Work Schedules</h1>
          <p className="text-xs text-slate-500 mt-1">
            Production shifts, operating hours, and planned breaks deducted for accurate OEE calculation.
          </p>
        </div>

        {hasPermission('shifts:edit') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shift</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading shift schedules...</div>
        ) : shifts.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">No shifts configured for this facility.</div>
        ) : (
          shifts.map((shift) => {
            const operatingTime = (shift.durationMinutes || 480) - (shift.plannedBreakMinutes || 45);
            return (
              <div key={shift._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {shift.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{shift.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-industrial-600" />
                      Shift Hours:
                    </span>
                    <span className="font-bold text-slate-900">
                      {shift.startTime} - {shift.endTime} (8 hrs)
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center">
                      <Coffee className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      Planned Breaks:
                    </span>
                    <span className="font-semibold text-amber-700">{shift.plannedBreakMinutes} min</span>
                  </div>

                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Planned Operating Time:</span>
                    <span className="font-bold text-emerald-700">{operatingTime} min / shift</span>
                  </div>
                </div>

                {shift.breaks && shift.breaks.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Break Details</span>
                    <div className="mt-1 space-y-1">
                      {shift.breaks.map((b: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                          <span>{b.name} ({b.startTime})</span>
                          <span>{b.durationMinutes} mins</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Production Shift</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shift Code</label>
                <input
                  type="text"
                  required
                  placeholder="SHIFT_C"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shift Name</label>
                <input
                  type="text"
                  required
                  placeholder="Night Shift (C)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Planned Breaks Total (mins)</label>
                <input
                  type="number"
                  required
                  value={plannedBreakMinutes}
                  onChange={(e) => setPlannedBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
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
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
