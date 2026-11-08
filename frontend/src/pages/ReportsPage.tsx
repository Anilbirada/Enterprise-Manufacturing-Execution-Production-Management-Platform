import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [reportType, setReportType] = useState<'Shift' | 'ProductionSummary'>('Shift');
  const [reportData, setReportData] = useState<any | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadShifts = async () => {
    try {
      const res = await api.request(`/master-data/shifts?plantId=${activePlant?._id || ''}`);
      if (res.success) setShifts(res.list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (reportType === 'Shift') {
        endpoint = `/reports/shift?date=${selectedDate}&plantId=${activePlant?._id || ''}`;
        if (selectedShiftId) endpoint += `&shiftId=${selectedShiftId}`;
      } else {
        endpoint = `/reports/production-summary?plantId=${activePlant?._id || ''}`;
      }

      const res = await api.request(endpoint);
      if (res.success) {
        setReportData(res.report || res);
      }
    } catch (err: any) {
      alert(`Error loading report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
    fetchReport();
  }, [activePlant, reportType, selectedDate, selectedShiftId]);

  const handleDownload = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      const url = `/reports/shift?date=${selectedDate}&plantId=${activePlant?._id || ''}&format=${format}${
        selectedShiftId ? `&shiftId=${selectedShiftId}` : ''
      }`;
      const blob = await api.request(url);

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `factory360-shift-report-${selectedDate}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Reports & Production Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing production logs, shift outputs, scrap rates, and database-verified Excel/CSV exports.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownload('csv')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleDownload('excel')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="Shift">Shift Production Report</option>
            <option value="ProductionSummary">Product Summary Breakdown</option>
          </select>

          {reportType === 'Shift' && (
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="">-- All Shifts --</option>
              {shifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          />
        </div>

        <button
          onClick={fetchReport}
          className="w-full sm:w-auto px-4 py-2 bg-industrial-700 text-white text-xs font-semibold rounded-lg hover:bg-industrial-800"
        >
          Generate Report
        </button>
      </div>

      {/* Report Data Display */}
      {reportType === 'Shift' ? (
        <div className="space-y-6">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Good Produced Units</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{reportData?.totalGood || 0} PCS</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Rejected / Scrap Units</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{reportData?.totalRejected || 0} PCS</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Shift Scrap Rate</span>
              <div className="text-2xl font-bold text-slate-800 mt-1">{reportData?.scrapRatePercent || 0}%</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Recorded Booking Count</span>
              <div className="text-2xl font-bold text-industrial-700 mt-1">{reportData?.totalEntries || 0} Postings</div>
            </div>
          </div>

          {/* Detailed Production Entries Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shift Posting Ledger
              </h3>
              <span className="text-xs text-slate-500">Date: {selectedDate}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Work Order</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Machine</th>
                    <th className="py-2.5 px-3">Shift</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Good Output</th>
                    <th className="py-2.5 px-3">Scrap Output</th>
                    <th className="py-2.5 px-3">Scrap Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">Loading ledger data...</td>
                    </tr>
                  ) : reportData?.entries?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No production bookings found for selected date and shift filters.
                      </td>
                    </tr>
                  ) : (
                    reportData?.entries?.map((e: any) => (
                      <tr key={e._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(e.startTime).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{e.workOrderId?.orderNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{e.productId?.name}</td>
                        <td className="py-2.5 px-3 text-slate-700">{e.machineId?.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{e.shiftId?.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{e.operatorId?.name}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{e.goodQuantity}</td>
                        <td className="py-2.5 px-3 font-bold text-rose-600">{e.rejectedQuantity}</td>
                        <td className="py-2.5 px-3 text-slate-500">{e.rejectionReason || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Product Summary Breakdown Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Product-Wise Throughput & Scrap Totals
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Part / SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Good Output</th>
                  <th className="py-3 px-4">Scrapped</th>
                  <th className="py-3 px-4">Total Produced</th>
                  <th className="py-3 px-4">Yield %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.productBreakdown?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No production recorded in selected period.</td>
                  </tr>
                ) : (
                  reportData?.productBreakdown?.map((item: any, idx: number) => {
                    const yieldPercent = item.total > 0 ? Math.round((item.good / item.total) * 1000) / 10 : 100;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.product}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{item.good}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{item.rejected}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.total}</td>
                        <td className="py-3 px-4 font-bold text-industrial-700">{yieldPercent}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
