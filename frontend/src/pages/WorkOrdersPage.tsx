import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { WorkOrderStatus } from '../types';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const WorkOrdersPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Work Order Form State
  const [orderNumber, setOrderNumber] = useState('');
  const [productId, setProductId] = useState('');
  const [productionLineId, setProductionLineId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState(100);
  const [priority, setPriority] = useState('Medium');
  const [startDatePlanned, setStartDatePlanned] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0]);
  const [instructions, setInstructions] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [woRes, prodRes, lineRes, shiftRes] = await Promise.all([
        api.request(`/work-orders?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/products?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/lines?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/shifts?plantId=${activePlant?._id || ''}`)
      ]);

      if (woRes.success) setOrders(woRes.orders);
      if (prodRes.success) setProducts(prodRes.list);
      if (lineRes.success) setLines(lineRes.list);
      if (shiftRes.success) setShifts(shiftRes.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          orderNumber,
          productId,
          productionLineId: productionLineId || undefined,
          shiftId: shiftId || undefined,
          plannedQuantity: Number(plannedQuantity),
          priority,
          startDatePlanned,
          dueDate,
          instructions
        })
      });

      setShowCreateModal(false);
      setOrderNumber('');
      setInstructions('');
      loadData();
    } catch (err: any) {
      alert(`Failed to create work order: ${err.message}`);
    }
  };

  const handleTransition = async (orderId: string, toStatus: WorkOrderStatus) => {
    try {
      await api.request(`/work-orders/${orderId}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          toStatus,
          reason: `Status transition to ${toStatus}`
        })
      });
      loadData();
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.DRAFT:
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case WorkOrderStatus.PLANNED:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case WorkOrderStatus.RELEASED:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case WorkOrderStatus.IN_PROGRESS:
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case WorkOrderStatus.PAUSED:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case WorkOrderStatus.COMPLETED:
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case WorkOrderStatus.CANCELLED:
        return 'bg-rose-100 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Work Orders Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing orders, routing execution, batch allocation, and lifecycle transitions.
          </p>
        </div>

        {hasPermission('workorders:create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status filter tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs">
          {['All', 'Draft', 'Planned', 'Released', 'In Progress', 'Paused', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedStatus === status
                  ? 'bg-industrial-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Production Line</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Completed / Scrap</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading work orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No work orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{o.orderNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.batchNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{o.productId?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{o.productId?.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {o.productionLineId?.name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{o.plannedQuantity}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600">{o.completedQuantity}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-rose-500">{o.rejectedQuantity}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : o.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                      {o.isQualityHold && (
                        <div className="flex items-center text-[9px] font-bold text-amber-700 mt-1">
                          <ShieldAlert className="w-3 h-3 mr-0.5 text-amber-600" />
                          <span>QUALITY HOLD</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(o.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* Transition controls based on current status */}
                      <div className="flex items-center justify-end space-x-1.5">
                        {o.status === WorkOrderStatus.DRAFT && (
                          <button
                            onClick={() => handleTransition(o._id, WorkOrderStatus.PLANNED)}
                            className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded text-[11px] font-medium"
                          >
                            Plan Order
                          </button>
                        )}
                        {o.status === WorkOrderStatus.PLANNED && (
                          <button
                            onClick={() => handleTransition(o._id, WorkOrderStatus.RELEASED)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded text-[11px] font-medium"
                          >
                            Release
                          </button>
                        )}
                        {o.status === WorkOrderStatus.RELEASED && (
                          <button
                            onClick={() => handleTransition(o._id, WorkOrderStatus.IN_PROGRESS)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[11px] font-medium"
                          >
                            Start
                          </button>
                        )}
                        {o.status === WorkOrderStatus.IN_PROGRESS && (
                          <>
                            <button
                              onClick={() => handleTransition(o._id, WorkOrderStatus.PAUSED)}
                              className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded text-[11px] font-medium"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => handleTransition(o._id, WorkOrderStatus.COMPLETED)}
                              className="px-2 py-1 bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded text-[11px] font-medium"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {o.status === WorkOrderStatus.PAUSED && (
                          <button
                            onClick={() => handleTransition(o._id, WorkOrderStatus.IN_PROGRESS)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[11px] font-medium"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Production Work Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Work Order Number</label>
                <input
                  type="text"
                  required
                  placeholder="WO-2026-0042"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Product</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose Manufactured Part --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Production Line</label>
                  <select
                    value={productionLineId}
                    onChange={(e) => setProductionLineId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Assign Later --</option>
                    {lines.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Shift</label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Assign Later --</option>
                    {shifts.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Planned Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(Number(e.target.value))}
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
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Planned Start</label>
                  <input
                    type="date"
                    required
                    value={startDatePlanned}
                    onChange={(e) => setStartDatePlanned(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Operator Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Special tooling or inspection requirements..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
