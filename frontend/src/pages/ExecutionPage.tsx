import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PlaySquare,
  Tablet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Barcode,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ExecutionPage: React.FC = () => {
  const { activePlant, user } = useAuth();
  const [mode, setMode] = useState<'Tablet' | 'Management'>('Tablet');
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Operator Booking Inputs (Big touch inputs for tablet)
  const [goodQty, setGoodQty] = useState<number>(10);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('Dimensional Deviation');
  const [defectCategory, setDefectCategory] = useState<string>('Machining Burr');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Downtime quick modal
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [downtimeCategory, setDowntimeCategory] = useState('Mechanical Failure');
  const [downtimeReason, setDowntimeReason] = useState('Tooling insert breakage');

  const loadExecutionData = async () => {
    try {
      setLoading(true);
      const [jobsRes, machinesRes, shiftsRes, entriesRes] = await Promise.all([
        api.request(`/execution/jobs?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/machines?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/shifts?plantId=${activePlant?._id || ''}`),
        api.request(`/execution/entries?plantId=${activePlant?._id || ''}`)
      ]);

      if (jobsRes.success) {
        setJobs(jobsRes.jobs);
        if (jobsRes.jobs.length > 0 && !selectedJob) {
          setSelectedJob(jobsRes.jobs[0]);
        }
      }

      if (machinesRes.success && machinesRes.list.length > 0) {
        setMachines(machinesRes.list);
        if (!selectedMachineId) setSelectedMachineId(machinesRes.list[0]._id);
      }

      if (shiftsRes.success && shiftsRes.list.length > 0) {
        setShifts(shiftsRes.list);
        if (!selectedShiftId) setSelectedShiftId(shiftsRes.list[0]._id);
      }

      if (entriesRes.success) {
        setHistoryEntries(entriesRes.entries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutionData();
  }, [activePlant]);

  const handleBarcodeLookup = () => {
    if (!barcodeInput) return;
    const found = jobs.find(
      (j) =>
        j.orderNumber.toLowerCase() === barcodeInput.toLowerCase() ||
        j.batchNumber?.toLowerCase() === barcodeInput.toLowerCase() ||
        j.productId?.barcode?.toLowerCase() === barcodeInput.toLowerCase()
    );

    if (found) {
      setSelectedJob(found);
      setBookingSuccessMsg(`Scanned: Loaded Work Order ${found.orderNumber}`);
      setTimeout(() => setBookingSuccessMsg(null), 3000);
    } else {
      alert(`No active work order found for barcode: ${barcodeInput}`);
    }
    setBarcodeInput('');
  };

  const handleBookProduction = async () => {
    if (!selectedJob) {
      alert('Please select an active work order job.');
      return;
    }

    if (goodQty < 0 || rejectedQty < 0) {
      alert('Quantities cannot be negative.');
      return;
    }

    if (goodQty === 0 && rejectedQty === 0) {
      alert('Total booked quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setBookingSuccessMsg(null);

    // Generate idempotency key for this touch action
    const idempotencyKey = `exec-${selectedJob._id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      const res = await api.request('/execution/record', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          workOrderId: selectedJob._id,
          machineId: selectedMachineId || machines[0]?._id,
          shiftId: selectedShiftId || shifts[0]?._id,
          operationSequence: 10,
          goodQuantity: goodQty,
          rejectedQuantity: rejectedQty,
          rejectionReason: rejectedQty > 0 ? rejectionReason : undefined,
          defectCategory: rejectedQty > 0 ? defectCategory : undefined,
          durationMinutes: 30,
          idempotencyKey
        })
      });

      if (res.success) {
        setBookingSuccessMsg(`Successfully booked ${goodQty} Good units and ${rejectedQty} Rejections.`);
        setTimeout(() => setBookingSuccessMsg(null), 4000);
        loadExecutionData();
      }
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportDowntime = async () => {
    if (!selectedMachineId) {
      alert('Please select a machine.');
      return;
    }

    try {
      await api.request('/downtime/report', {
        method: 'POST',
        body: JSON.stringify({
          machineId: selectedMachineId,
          category: downtimeCategory,
          reasonDescription: downtimeReason,
          isPlanned: false,
          workOrderId: selectedJob?._id
        })
      });
      setShowDowntimeModal(false);
      alert('Downtime event logged and supervisor alerted.');
      loadExecutionData();
    } catch (err: any) {
      alert(`Downtime report error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Experience Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Production Execution</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-industrial-100 text-industrial-800">
              {mode === 'Tablet' ? 'Shop-Floor Tablet Interface' : 'Management Production Audit'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Operator station logging, quantity bookings, defect tracking, and downtime reporting.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('Tablet')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'Tablet'
                ? 'bg-industrial-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Tablet Operator Mode</span>
          </button>
          <button
            onClick={() => setMode('Management')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'Management'
                ? 'bg-industrial-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Management Monitor</span>
          </button>
        </div>
      </div>

      {mode === 'Tablet' ? (
        /* ================= TABLET SHOP-FLOOR INTERFACE ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Jobs Queue & Barcode Scanner */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Job Queue ({jobs.length})
              </span>
              <span className="text-[11px] text-slate-400">Touch to select</span>
            </div>

            {/* Barcode / QR Scanner Input */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center">
                <Barcode className="w-3.5 h-3.5 mr-1 text-industrial-600" />
                Scan Barcode / Digital Traveler
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Scan or type WO/Batch..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={handleBarcodeLookup}
                  className="px-3 py-1.5 bg-industrial-700 hover:bg-industrial-600 text-white rounded text-xs font-semibold"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
              {jobs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No released jobs waiting for execution.
                </div>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedJob?._id === job._id;
                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-industrial-50 border-industrial-500 ring-2 ring-industrial-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-slate-900">{job.orderNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-700 mt-1">{job.productId?.name}</div>

                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>Line: {job.productionLineId?.name || 'Line 1'}</span>
                        <span className="font-semibold text-slate-800">
                          {job.completedQuantity} / {job.plannedQuantity} PCS
                        </span>
                      </div>

                      {job.isQualityHold && (
                        <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100 p-1 rounded flex items-center">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          <span>Quality Hold Active</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (2 spans): Shop-Floor Booking Station */}
          <div className="lg:col-span-2 space-y-4">
            {bookingSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bookingSuccessMsg}</span>
              </div>
            )}

            {selectedJob ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Selected Job Card Banner */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold tracking-wide">{selectedJob.orderNumber}</span>
                      <span className="text-[11px] bg-cyan-900/60 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-700/50">
                        Batch: {selectedJob.batchNumber || 'BATCH-8901'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">{selectedJob.productId?.name}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Planned Output</div>
                    <div className="text-xl font-bold text-cyan-400">
                      {selectedJob.completedQuantity} / {selectedJob.plannedQuantity} PCS
                    </div>
                  </div>
                </div>

                {/* Station Machine & Shift Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assigned Workstation Machine
                    </label>
                    <select
                      value={selectedMachineId}
                      onChange={(e) => setSelectedMachineId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500"
                    >
                      {machines.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.code}) - [{m.state}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Production Shift
                    </label>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => setSelectedShiftId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500"
                    >
                      {shifts.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Big Touch Quantity Input Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Good Quantity Booking */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                      Good Produced Quantity (PCS)
                    </span>
                    <div className="flex items-center space-x-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setGoodQty((prev) => Math.max(0, prev - 10))}
                        className="w-12 h-12 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-lg font-bold shadow-sm active:scale-95 transition-transform"
                      >
                        -10
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={goodQty}
                        onChange={(e) => setGoodQty(Math.max(0, Number(e.target.value)))}
                        className="flex-1 text-center font-bold text-2xl py-2 bg-white border-2 border-emerald-400 rounded-xl text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setGoodQty((prev) => prev + 10)}
                        className="w-12 h-12 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-lg font-bold shadow-sm active:scale-95 transition-transform"
                      >
                        +10
                      </button>
                    </div>
                  </div>

                  {/* Rejected Quantity Booking */}
                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center">
                      <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                      Scrap / Rejected Quantity (PCS)
                    </span>
                    <div className="flex items-center space-x-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setRejectedQty((prev) => Math.max(0, prev - 1))}
                        className="w-12 h-12 rounded-xl bg-white border border-rose-300 text-rose-800 text-lg font-bold shadow-sm active:scale-95 transition-transform"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={rejectedQty}
                        onChange={(e) => setRejectedQty(Math.max(0, Number(e.target.value)))}
                        className="flex-1 text-center font-bold text-2xl py-2 bg-white border-2 border-rose-400 rounded-xl text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRejectedQty((prev) => prev + 1)}
                        className="w-12 h-12 rounded-xl bg-white border border-rose-300 text-rose-800 text-lg font-bold shadow-sm active:scale-95 transition-transform"
                      >
                        +1
                      </button>
                    </div>

                    {rejectedQty > 0 && (
                      <div className="mt-3 space-y-2">
                        <select
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg text-slate-800 font-medium"
                        >
                          <option value="Dimensional Deviation">Defect: Dimensional Deviation</option>
                          <option value="Surface Porosity / Burr">Defect: Surface Porosity / Burr</option>
                          <option value="Tooling Chatter Marks">Defect: Tooling Chatter Marks</option>
                          <option value="Material Inclusions">Defect: Material Inclusions</option>
                          <option value="Operator Setting Error">Defect: Operator Setting Error</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleBookProduction}
                    disabled={submitting || selectedJob.isQualityHold}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-base font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{submitting ? 'Recording Posting...' : 'Book Production Batch (Post Qty)'}</span>
                  </button>

                  <button
                    onClick={() => setShowDowntimeModal(true)}
                    className="py-4 px-6 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span>Report Downtime / Stop</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Please select or scan an active job from the queue on the left to start production execution.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= MANAGEMENT EXECUTION MONITOR ================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Posted Production Transactions ({historyEntries.length})
            </h2>
            <button
              onClick={loadExecutionData}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded text-slate-700"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Work Order #</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Good Qty</th>
                  <th className="py-2.5 px-3">Rejected Qty</th>
                  <th className="py-2.5 px-3">Scrap Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No production transactions booked yet.
                    </td>
                  </tr>
                ) : (
                  historyEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{entry.workOrderId?.orderNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{entry.productId?.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{entry.machineId?.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{entry.operatorId?.name}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">{entry.goodQuantity}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-500">{entry.rejectedQuantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{entry.rejectionReason || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Downtime Modal */}
      {showDowntimeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Report Machine Downtime</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Downtime Reason Category</label>
                <select
                  value={downtimeCategory}
                  onChange={(e) => setDowntimeCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Mechanical Failure">Mechanical Failure</option>
                  <option value="Electrical Failure">Electrical Failure</option>
                  <option value="Material Shortage">Material Shortage</option>
                  <option value="Operator Unavailable">Operator Unavailable</option>
                  <option value="Changeover">Changeover</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Planned Maintenance">Planned Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Issue Details / Symptoms</label>
                <textarea
                  rows={3}
                  value={downtimeReason}
                  onChange={(e) => setDowntimeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDowntimeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportDowntime}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                >
                  Halt Machine & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
