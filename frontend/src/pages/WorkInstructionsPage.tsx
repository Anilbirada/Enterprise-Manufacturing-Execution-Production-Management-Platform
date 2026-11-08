import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const WorkInstructionsPage: React.FC = () => {
  const { activePlant, hasPermission, user } = useAuth();
  const [instructions, setInstructions] = useState<any[]>([]);
  const [selectedInstruction, setSelectedInstruction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [operationName, setOperationName] = useState('CNC Boring Setup');
  const [step1Title, setStep1Title] = useState('Tooling Check & Calibration');
  const [step1Text, setStep1Text] = useState('Inspect carbide boring bar for chipping. Verify runout with dial test indicator under 0.005mm.');
  const [step1Caution, setStep1Caution] = useState('Always wear protective eye protection and isolate machine power during spindle tooling load.');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/instructions?plantId=${activePlant?._id || ''}`);
      if (res.success) {
        setInstructions(res.instructions);
        if (res.instructions.length > 0 && !selectedInstruction) {
          setSelectedInstruction(res.instructions[0]);
        }
      }
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
      await api.request('/instructions', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          code,
          title,
          operationName,
          version: '1.0',
          status: 'Published',
          steps: [
            {
              stepNumber: 1,
              title: step1Title,
              instructionText: step1Text,
              safetyCaution: step1Caution,
              criticalCheckPoint: 'Bore dial test reading <= 0.005mm'
            }
          ]
        })
      });
      setShowModal(false);
      setCode('');
      setTitle('');
      loadData();
    } catch (err: any) {
      alert(`Error creating instruction: ${err.message}`);
    }
  };

  const handleSignOff = async (id: string) => {
    try {
      await api.request(`/instructions/${id}/sign-off`, { method: 'POST', body: JSON.stringify({}) });
      alert('You have acknowledged and digitally signed this Standard Operating Procedure.');
      loadData();
    } catch (err: any) {
      alert(`Sign off failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Digital Work Instructions (SOPs)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating procedures, safety guidelines, and operator digital sign-offs.
          </p>
        </div>

        {hasPermission('workinstructions:edit') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Visual SOP</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Standard Operating Procedures ({instructions.length})
          </span>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading instructions...</div>
            ) : instructions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No work instructions authored yet.</div>
            ) : (
              instructions.map((inst) => (
                <div
                  key={inst._id}
                  onClick={() => setSelectedInstruction(inst)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedInstruction?._id === inst._id
                      ? 'bg-industrial-50 border-industrial-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {inst.code}
                    </span>
                    <span className="text-[10px] text-slate-400">v{inst.version}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1.5">{inst.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-1">Operation: {inst.operationName}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Viewer */}
        <div className="lg:col-span-2">
          {selectedInstruction ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedInstruction.code} (v{selectedInstruction.version})
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedInstruction.title}</h2>
                  <p className="text-xs text-slate-500">Operation: {selectedInstruction.operationName}</p>
                </div>

                <button
                  onClick={() => handleSignOff(selectedInstruction._id)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acknowledge & Sign Off</span>
                </button>
              </div>

              {/* Step Sequence */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Sequential Work Instructions ({selectedInstruction.steps?.length || 0} Steps)
                </h3>

                {selectedInstruction.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-industrial-700 text-white flex items-center justify-center font-bold text-xs">
                        {step.stepNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{step.title}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-8">{step.instructionText}</p>

                    {step.safetyCaution && (
                      <div className="ml-8 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Safety Caution: </span>
                          <span>{step.safetyCaution}</span>
                        </div>
                      </div>
                    )}

                    {step.criticalCheckPoint && (
                      <div className="ml-8 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Critical Gate: <strong className="font-semibold">{step.criticalCheckPoint}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sign Off Log */}
              {selectedInstruction.signOffs && selectedInstruction.signOffs.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Operator Acknowledgement Sign-offs ({selectedInstruction.signOffs.length})
                  </span>
                  <div className="mt-2 space-y-1">
                    {selectedInstruction.signOffs.map((so: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 flex justify-between">
                        <span>{so.operatorName}</span>
                        <span className="text-slate-400">{new Date(so.signedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              Select a work instruction from the left panel to review procedure steps.
            </div>
          )}
        </div>
      </div>

      {/* Add SOP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Standard Operating Procedure</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SOP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SOP-CNC-BORING"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Operation Name</label>
                  <input
                    type="text"
                    required
                    value={operationName}
                    onChange={(e) => setOperationName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">SOP Title</label>
                <input
                  type="text"
                  required
                  placeholder="5-Axis CNC Bore Setup and Zero-Point Calibration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Step 1 Title</label>
                <input
                  type="text"
                  required
                  value={step1Title}
                  onChange={(e) => setStep1Title(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Step 1 Instructions</label>
                <textarea
                  rows={2}
                  required
                  value={step1Text}
                  onChange={(e) => setStep1Text(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Safety Caution</label>
                <input
                  type="text"
                  value={step1Caution}
                  onChange={(e) => setStep1Caution(e.target.value)}
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
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-bold"
                >
                  Publish SOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
