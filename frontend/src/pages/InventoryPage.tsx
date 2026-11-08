import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PackageSearch,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Stock' | 'Transactions'>('Stock');

  // Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [txnType, setTxnType] = useState('RECEIVE');
  const [quantity, setQuantity] = useState(100);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, txnsRes] = await Promise.all([
        api.request(`/inventory/summary?plantId=${activePlant?._id || ''}`),
        api.request(`/inventory/transactions?plantId=${activePlant?._id || ''}`)
      ]);

      if (summaryRes.success) {
        setMaterials(summaryRes.materials);
        setShortages(summaryRes.shortages);
      }
      if (txnsRes.success) {
        setTransactions(txnsRes.transactions);
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

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/inventory/transaction', {
        method: 'POST',
        body: JSON.stringify({
          materialId: selectedMaterialId,
          type: txnType,
          quantity: Number(quantity),
          reason
        })
      });
      setShowModal(false);
      setReason('');
      loadData();
    } catch (err: any) {
      alert(`Transaction failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Materials & Inventory Visibility</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing raw material stock levels, safety stock thresholds, batch consumption, and inventory movements.
          </p>
        </div>

        {hasPermission('inventory:receive') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Stock Movement</span>
          </button>
        )}
      </div>

      {/* Shortage Alerts Banner */}
      {shortages.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Raw Material Shortage Alert: </span>
            <span>
              {shortages.length} item(s) are below safety stock threshold! (
              {shortages.map((m) => `${m.name}: ${m.currentStock} ${m.uom}`).join(', ')}
              )
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('Stock')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'Stock'
              ? 'text-industrial-600 border-b-2 border-industrial-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Material Stock Levels ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('Transactions')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'Transactions'
              ? 'text-industrial-600 border-b-2 border-industrial-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Ledger Movement Logs ({transactions.length})
        </button>
      </div>

      {/* Stock Levels View */}
      {activeTab === 'Stock' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Safety Stock</th>
                  <th className="py-3 px-4">Reorder Point</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Location Bin</th>
                  <th className="py-3 px-4">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No materials recorded.</td>
                  </tr>
                ) : (
                  materials.map((m) => {
                    const isLow = m.currentStock <= m.safetyStock;
                    return (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{m.name}</td>
                        <td className="py-3 px-4">{m.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          {m.currentStock} <span className="text-xs font-normal text-slate-500">{m.uom}</span>
                        </td>
                        <td className="py-3 px-4">{m.safetyStock} {m.uom}</td>
                        <td className="py-3 px-4">{m.reorderLevel} {m.uom}</td>
                        <td className="py-3 px-4 font-medium">₹{m.unitCost}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{m.locationBin || 'BIN-GEN'}</td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Adequate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Ledger Transactions */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Quantity Changed</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Linked Work Order</th>
                  <th className="py-3 px-4">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No inventory transactions logged.</td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.materialId?.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.type}</td>
                      <td className={`py-3 px-4 font-bold ${t.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="py-3 px-4 font-semibold">{t.balanceAfter}</td>
                      <td className="py-3 px-4 font-mono">{t.workOrderId?.orderNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">{t.performedBy?.name || 'Warehouse'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Log Inventory Movement</h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Material</label>
                <select
                  required
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose Material Item --</option>
                  {materials.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.code}) - Stock: {m.currentStock} {m.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Movement Type</label>
                <select
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="RECEIVE">RECEIVE (GRN / Incoming Delivery)</option>
                  <option value="ISSUE_TO_PRODUCTION">ISSUE_TO_PRODUCTION (Shop Floor Issue)</option>
                  <option value="RETURN">RETURN (Return to Store)</option>
                  <option value="SCRAP">SCRAP (Material Damage Write-off)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Audit Stock Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Doc Reference</label>
                <input
                  type="text"
                  placeholder="PO-8891 or Physical stock cycle count discrepancy"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  Submit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
