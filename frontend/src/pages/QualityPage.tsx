import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InspectionType, QualityDisposition } from '../types';
import {
  CheckCircle2,
  XCircle,
  Plus,
  ShieldAlert,
  FileCheck,
  AlertOctagon,
  Search,
  Filter,
  Lock,
  Unlock
} from 'lucide-react';

export const QualityPage: React.FC = () => {
  const { activePlant, hasPermission, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Inspections' | 'NCR' | 'Holds' | 'Plans'>('Inspections');
  const [inspections, setInspections] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [holds, setHolds] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Inspection Form State
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [inspectionType, setInspectionType] = useState<InspectionType>(InspectionType.IN_PROCESS);
  const [productId, setProductId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [sampleSize, setSampleSize] = useState(5);
  const [inspectedQty, setInspectedQty] = useState(10);
  const [passedQty, setPassedQty] = useState(10);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [disposition, setDisposition] = useState<QualityDisposition>(QualityDisposition.ACCEPTED);
  const [defectReason, setDefectReason] = useState('');

  // Hold Form State
  const [holdEntityType, setHoldEntityType] = useState<'WorkOrder' | 'Batch' | 'Machine'>('WorkOrder');
  const [holdEntityId, setHoldEntityId] = useState('');
  const [holdIdentifier, setHoldIdentifier] = useState('');
  const [holdReason, setHoldReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [insRes, ncrRes, holdRes, planRes, prodRes, woRes] = await Promise.all([
        api.request(`/quality/inspections?plantId=${activePlant?._id || ''}`),
        api.request(`/quality/ncr?plantId=${activePlant?._id || ''}`),
        api.request(`/quality/holds?plantId=${activePlant?._id || ''}`),
        api.request(`/quality/plans?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/products?plantId=${activePlant?._id || ''}`),
        api.request(`/work-orders?plantId=${activePlant?._id || ''}`)
      ]);

      if (insRes.success) setInspections(insRes.inspections);
      if (ncrRes.success) setNcrs(ncrRes.list);
      if (holdRes.success) setHolds(holdRes.holds);
      if (planRes.success) setPlans(planRes.plans);
      if (prodRes.success) setProducts(prodRes.list);
      if (woRes.success) setWorkOrders(woRes.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleRecordInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/quality/inspections', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          productId,
          workOrderId: workOrderId || undefined,
          inspectionType,
          sampleSize: Number(sampleSize),
          inspectedQuantity: Number(inspectedQty),
          passedQuantity: Number(passedQty),
          rejectedQuantity: Number(rejectedQty),
          disposition,
          defectReason: rejectedQty > 0 ? defectReason : undefined,
          parameterResults: [
            { parameterName: 'Dimensional Compliance', passed: rejectedQty === 0 }
          ]
        })
      });

      setShowInspectionModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording inspection: ${err.message}`);
    }
  };

  const handlePlaceHold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/quality/holds', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          entityType: holdEntityType,
          entityId: holdEntityId,
          entityIdentifier: holdIdentifier,
          reason: holdReason
        })
      });

      setShowHoldModal(false);
      setHoldReason('');
      loadData();
    } catch (err: any) {
      alert(`Error placing quality hold: ${err.message}`);
    }
  };

  const handleReleaseHold = async (holdId: string) => {
    const just = prompt('Enter release justification and authorization note:');
    if (!just) return;

    try {
      await api.request(`/quality/holds/${holdId}/release`, {
        method: 'POST',
        body: JSON.stringify({ releaseJustification: just })
      });
      loadData();
    } catch (err: any) {
      alert(`Error releasing hold: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Quality Assurance & Compliance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspection protocols, First-Off validation, Nonconformance reports (NCR), and Quality Hold governance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasPermission('quality:hold') && (
            <button
              onClick={() => setShowHoldModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Place Quality Hold</span>
            </button>
          )}

          {hasPermission('quality:inspect') && (
            <button
              onClick={() => setShowInspectionModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        {(['Inspections', 'NCR', 'Holds', 'Plans'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors ${
              activeTab === tab
                ? 'text-industrial-600 border-b-2 border-industrial-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'Inspections' && `Inspection Logs (${inspections.length})`}
            {tab === 'NCR' && `Non-Conformance & CAPA (${ncrs.length})`}
            {tab === 'Holds' && `Active Quality Holds (${holds.filter((h) => h.status === 'Active').length})`}
            {tab === 'Plans' && `Inspection Plans (${plans.length})`}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Inspections' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Inspection #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Work Order</th>
                  <th className="py-3 px-4">Inspected / Passed</th>
                  <th className="py-3 px-4">Rejected</th>
                  <th className="py-3 px-4">Disposition</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No quality inspections logged yet.
                    </td>
                  </tr>
                ) : (
                  inspections.map((ins) => (
                    <tr key={ins._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{ins.inspectionNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {ins.inspectionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{ins.productId?.name}</td>
                      <td className="py-3 px-4 font-mono">{ins.workOrderId?.orderNumber || '—'}</td>
                      <td className="py-3 px-4">
                        {ins.inspectedQuantity} / <span className="font-bold text-emerald-600">{ins.passedQuantity}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-500">{ins.rejectedQuantity}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ins.disposition === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ins.disposition}
                        </span>
                      </td>
                      <td className="py-3 px-4">{ins.inspectorId?.name || 'Inspector'}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(ins.inspectedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'NCR' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Nonconformance Reports (NCR) & Corrective Actions (CAPA)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">NCR #</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Defect Description</th>
                  <th className="py-3 px-4">Qty Affected</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ncrs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No active nonconformance reports.
                    </td>
                  </tr>
                ) : (
                  ncrs.map((ncr) => (
                    <tr key={ncr._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-rose-700">{ncr.ncrNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{ncr.productId?.name}</td>
                      <td className="py-3 px-4">{ncr.defectDescription}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ncr.quantityAffected}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {ncr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{ncr.reportedBy?.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Holds' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <ShieldAlert className="w-4 h-4 text-amber-600 mr-1.5" />
              <span>Production Quality Holds</span>
            </h2>
            <span className="text-xs text-slate-500">Active holds halt affected work orders and batches</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Hold #</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Target Identifier</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Placed By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No quality holds currently in place.
                    </td>
                  </tr>
                ) : (
                  holds.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{h.holdNumber}</td>
                      <td className="py-3 px-4">{h.entityType}</td>
                      <td className="py-3 px-4 font-bold text-amber-800">{h.entityIdentifier}</td>
                      <td className="py-3 px-4">{h.reason}</td>
                      <td className="py-3 px-4">{h.placedByName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'Active'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {h.status === 'Active' && hasPermission('quality:release_hold') && (
                          <button
                            onClick={() => handleReleaseHold(h._id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                          >
                            Release Hold
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
      )}

      {activeTab === 'Plans' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quality Inspection Protocols & Sampling Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                      {plan.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{plan.name}</h4>
                  </div>
                  <span className="text-xs font-semibold text-industrial-700">{plan.inspectionType}</span>
                </div>
                <div className="text-xs text-slate-600">Product: {plan.productId?.name}</div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <span className="font-semibold">{plan.parameters?.length || 0} Critical Parameters: </span>
                  {plan.parameters?.map((p: any) => p.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">Record Quality Inspection</h3>
            <form onSubmit={handleRecordInspection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Inspection Type</label>
                <select
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value as InspectionType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value={InspectionType.INCOMING}>Incoming Raw Material</option>
                  <option value={InspectionType.FIRST_OFF}>First-Off Setup Validation</option>
                  <option value={InspectionType.IN_PROCESS}>In-Process Quality Check</option>
                  <option value={InspectionType.FINAL}>Final Outgoing Quality Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Work Order (Optional)</label>
                <select
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- None --</option>
                  {workOrders.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.orderNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sample Size</label>
                  <input
                    type="number"
                    min={1}
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Passed Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={passedQty}
                    onChange={(e) => setPassedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Disposition Decision</label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as QualityDisposition)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                >
                  <option value={QualityDisposition.ACCEPTED}>Accepted</option>
                  <option value={QualityDisposition.REJECTED}>Rejected (Generate NCR)</option>
                  <option value={QualityDisposition.REWORK}>Rework Required</option>
                  <option value={QualityDisposition.CONCESSION}>Concession Release</option>
                </select>
              </div>

              {rejectedQty > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Defect Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="Surface porosity / tool chatter"
                    value={defectReason}
                    onChange={(e) => setDefectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-bold"
                >
                  Submit Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Quality Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2 text-amber-700">
              <Lock className="w-5 h-5 text-amber-600" />
              <span>Place Quality Hold</span>
            </h3>

            <form onSubmit={handlePlaceHold} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Entity Type</label>
                <select
                  value={holdEntityType}
                  onChange={(e) => setHoldEntityType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="WorkOrder">Work Order</option>
                  <option value="Batch">Batch Number</option>
                  <option value="Machine">Machine Asset</option>
                </select>
              </div>

              {holdEntityType === 'WorkOrder' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Work Order</label>
                  <select
                    required
                    value={holdEntityId}
                    onChange={(e) => {
                      setHoldEntityId(e.target.value);
                      const found = workOrders.find((w) => w._id === e.target.value);
                      setHoldIdentifier(found?.orderNumber || '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Choose Order to Freeze --</option>
                    {workOrders.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.orderNumber} - {w.productId?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Justification / Reason for Hold</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Suspected raw material contamination, severe chatter, or customer containment notice..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                >
                  Enforce Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
