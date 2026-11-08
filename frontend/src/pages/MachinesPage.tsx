import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MachineState } from '../types';
import {
  Cpu,
  Plus,
  Activity,
  Thermometer,
  Zap,
  Gauge,
  AlertTriangle,
  Wrench,
  Clock
} from 'lucide-react';

export const MachinesPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const { latestTelemetry } = useSocket();
  const [machines, setMachines] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('CNC Milling');
  const [manufacturer, setManufacturer] = useState('Haas Automation');
  const [capacityUnitsPerHour, setCapacityUnitsPerHour] = useState(60);
  const [idealCycleTimeSeconds, setIdealCycleTimeSeconds] = useState(60);
  const [productionLineId, setProductionLineId] = useState('');

  const loadMachines = async () => {
    try {
      setLoading(true);
      const [mchRes, lineRes] = await Promise.all([
        api.request(`/master-data/machines?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/lines?plantId=${activePlant?._id || ''}`)
      ]);

      if (mchRes.success) setMachines(mchRes.list);
      if (lineRes.success) setLines(lineRes.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, [activePlant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/master-data/machines', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          productionLineId: productionLineId || undefined,
          code,
          name,
          type,
          manufacturer,
          capacityUnitsPerHour: Number(capacityUnitsPerHour),
          idealCycleTimeSeconds: Number(idealCycleTimeSeconds),
          connectivityType: 'Simulated',
          state: MachineState.IDLE
        })
      });
      setShowModal(false);
      setCode('');
      setName('');
      loadMachines();
    } catch (err: any) {
      alert(`Error creating machine: ${err.message}`);
    }
  };

  const handleStateChange = async (machineId: string, newState: MachineState) => {
    try {
      await api.request(`/master-data/machines/${machineId}`, {
        method: 'PUT',
        body: JSON.stringify({
          state: newState,
          lastStateChange: new Date()
        })
      });
      loadMachines();
    } catch (err: any) {
      alert(`Error updating machine state: ${err.message}`);
    }
  };

  const getStateClasses = (state: MachineState) => {
    switch (state) {
      case MachineState.RUNNING:
        return { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500 animate-pulse' };
      case MachineState.IDLE:
        return { badge: 'bg-cyan-100 text-cyan-800 border-cyan-300', dot: 'bg-cyan-500' };
      case MachineState.FAULT:
        return { badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500 animate-bounce' };
      case MachineState.STOPPED:
        return { badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
      case MachineState.MAINTENANCE:
        return { badge: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' };
      default:
        return { badge: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Machines & Equipment Fleet</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
              OPC UA & MQTT Simulation Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time machine states, cycle times, operating hours, and industrial IoT sensor telemetry.
          </p>
        </div>

        {hasPermission('machines:edit') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Machine</span>
          </button>
        )}
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading equipment fleet...</div>
        ) : machines.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">No machines configured.</div>
        ) : (
          machines.map((m) => {
            const telemetry = latestTelemetry[m._id] || latestTelemetry[m.code] || {};
            const stateStyle = getStateClasses(m.state);

            return (
              <div key={m._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                {/* Header with state */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {m.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{m.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {m.type} • {m.manufacturer || 'Industrial Equip'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${stateStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.dot}`} />
                      <span>{m.state}</span>
                    </span>

                    {/* Quick state change dropdown for supervisors / maintenance */}
                    {hasPermission('machines:update_status') && (
                      <select
                        value={m.state}
                        onChange={(e) => handleStateChange(m._id, e.target.value as MachineState)}
                        className="text-[10px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 font-medium text-slate-700 cursor-pointer focus:outline-none"
                      >
                        <option value={MachineState.RUNNING}>Set Running</option>
                        <option value={MachineState.IDLE}>Set Idle</option>
                        <option value={MachineState.STOPPED}>Set Stopped</option>
                        <option value={MachineState.MAINTENANCE}>Set Maint</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Real-time Industrial IoT Sensor Telemetry (OPC UA Simulated) */}
                <div className="p-3 bg-slate-900 text-white rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                    <span className="flex items-center text-cyan-400 font-semibold">
                      <Activity className="w-3 h-3 mr-1" />
                      Industrial Telemetry
                    </span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">SIMULATED</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400">Spindle Speed</div>
                      <div className="font-mono text-xs font-bold text-cyan-300">
                        {telemetry.spindleSpeedRpm ? `${telemetry.spindleSpeedRpm} RPM` : '0 RPM'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400">Temperature</div>
                      <div className="font-mono text-xs font-bold text-amber-300">
                        {telemetry.motorTemperatureCelsius ? `${telemetry.motorTemperatureCelsius}°C` : '31.5°C'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400">Vibration</div>
                      <div className="font-mono text-xs font-bold text-emerald-300">
                        {telemetry.vibrationMmPerSec ? `${telemetry.vibrationMmPerSec} mm/s` : '0.1 mm/s'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Machine Details Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400">Ideal Cycle: </span>
                    <span className="font-semibold">{m.idealCycleTimeSeconds} sec</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Hours: </span>
                    <span className="font-semibold">{m.operatingHoursTotal} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Last PM: </span>
                    <span className="font-medium">
                      {m.lastMaintenanceDate ? new Date(m.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Next Due: </span>
                    <span className="font-medium text-industrial-600">
                      {m.nextMaintenanceDate ? new Date(m.nextMaintenanceDate).toLocaleDateString() : 'In 30 days'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Machine Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Equipment Asset</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Machine Identifier / Code</label>
                <input
                  type="text"
                  required
                  placeholder="MCH-CNC-5AX-02"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Machine Name</label>
                <input
                  type="text"
                  required
                  placeholder="5-Axis Milling Machine #2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Equipment Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="CNC Milling">CNC Milling</option>
                    <option value="CNC Turning">CNC Turning</option>
                    <option value="Stamping Press">Stamping Press</option>
                    <option value="Plastic Injection">Plastic Injection</option>
                    <option value="Robotic Assembly">Robotic Assembly</option>
                    <option value="Testing Rig">Testing Rig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Production Line</label>
                  <select
                    value={productionLineId}
                    onChange={(e) => setProductionLineId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Assign Line --</option>
                    {lines.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Capacity (Units/Hr)</label>
                  <input
                    type="number"
                    required
                    value={capacityUnitsPerHour}
                    onChange={(e) => setCapacityUnitsPerHour(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ideal Cycle Time (sec)</label>
                  <input
                    type="number"
                    required
                    value={idealCycleTimeSeconds}
                    onChange={(e) => setIdealCycleTimeSeconds(Number(e.target.value))}
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
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
