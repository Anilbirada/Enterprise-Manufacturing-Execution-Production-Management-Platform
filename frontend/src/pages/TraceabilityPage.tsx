import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  GitBranch,
  FileCheck,
  ShieldAlert,
  Download
} from 'lucide-react';

export const TraceabilityPage: React.FC = () => {
  const { activePlant } = useAuth();
  const [searchCode, setSearchCode] = useState('WO-2026-0001');
  const [genealogy, setGenealogy] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // QR Code generator state
  const [qrPayload, setQrPayload] = useState('WO-2026-0001');
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchCode) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.request(`/traceability/genealogy/${encodeURIComponent(searchCode.trim())}`);
      if (res.success && res.genealogy.found) {
        setGenealogy(res.genealogy);
      } else {
        setGenealogy(null);
      }
    } catch {
      setGenealogy(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const res = await api.request('/traceability/qrcode', {
        method: 'POST',
        body: JSON.stringify({ data: qrPayload })
      });
      if (res.success) {
        setGeneratedQr(res.qrDataUrl);
      }
    } catch (err: any) {
      alert(`QR generation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Barcode & Traceability Engine</h1>
        <p className="text-xs text-slate-500 mt-1">
          Full forward and backward genealogy tracking from raw material heats/lots to finished serial traveler records.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Genealogy Lookup (Forward & Backward)
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Enter Work Order #, Batch #, or Serial Number (e.g. WO-2026-0001, BATCH-2026-4401)..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-industrial-600 hover:bg-industrial-700 text-white font-bold rounded-lg text-xs shadow-sm"
          >
            {loading ? 'Searching Genealogy...' : 'Trace Genealogy'}
          </button>
        </form>
      </div>

      {/* Genealogy Tree Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Retrieving forward and backward manufacturing records...
            </div>
          ) : !genealogy ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No genealogy or production history found for tracking code "{searchCode}".
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product and Batch Summary Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-cyan-900/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">
                      IDENTIFIER: {genealogy.trackingCode}
                    </span>
                    <h3 className="text-lg font-bold mt-2">
                      {genealogy.workOrder?.productId?.name || genealogy.batch?.productId?.name || 'Manufactured Item'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Work Order: <span className="font-mono text-cyan-300">{genealogy.workOrder?.orderNumber}</span> •
                      Status: <span className="font-semibold text-emerald-400">{genealogy.workOrder?.status}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Produced</div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {genealogy.workOrder?.completedQuantity} / {genealogy.workOrder?.plannedQuantity} PCS
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturing Timeline & Operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Operations & Machine Executions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Clock className="w-4 h-4 text-industrial-600 mr-1.5" />
                    <span>Operation Execution History ({genealogy.operations?.length || 0})</span>
                  </h3>

                  <div className="space-y-3">
                    {genealogy.operations?.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4">No operation steps logged yet.</div>
                    ) : (
                      genealogy.operations.map((op: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>Seq {op.operationSequence}: Operation Step</span>
                            <span className="text-emerald-700">+{op.goodQuantity} Good</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Machine: <span className="font-semibold">{op.machineId?.name}</span> ({op.machineId?.code})
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>Operator: {op.operatorId?.name}</span>
                            <span>{new Date(op.startTime).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quality Records & Inspections */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <FileCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                    <span>Quality Inspections & Holds ({genealogy.inspections?.length || 0})</span>
                  </h3>

                  <div className="space-y-3">
                    {genealogy.inspections?.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4">No quality inspection records tied to this traveler.</div>
                    ) : (
                      genealogy.inspections.map((ins: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{ins.inspectionNumber} ({ins.inspectionType})</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                ins.disposition === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'bg-rose-100 text-rose-800 font-bold'
                              }`}
                            >
                              {ins.disposition}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Passed: {ins.passedQuantity} | Rejected: {ins.rejectedQuantity}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Inspector: {ins.inspectorId?.name} • {new Date(ins.inspectedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Raw Materials Consumed */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Layers className="w-4 h-4 text-cyan-600 mr-1.5" />
                  <span>Consumed Raw Material Batches / Heats</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Material Code</th>
                        <th className="py-2 px-3">Material Name</th>
                        <th className="py-2 px-3">Quantity Consumed</th>
                        <th className="py-2 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {genealogy.consumedMaterials?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            No raw materials booked against this work order.
                          </td>
                        </tr>
                      ) : (
                        genealogy.consumedMaterials.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.materialId?.code}</td>
                            <td className="py-2 px-3 text-slate-800">{m.materialId?.name}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{Math.abs(m.quantity)} {m.materialId?.uom}</td>
                            <td className="py-2 px-3 text-slate-400">{new Date(m.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Generator Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <QrCode className="w-4 h-4 text-industrial-600 mr-1.5" />
          <span>Industrial QR Code & Digital Traveler Generator</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payload / Identification String</label>
              <input
                type="text"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder="WO-2026-0001 or BATCH-2026-4401"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <button
              onClick={handleGenerateQR}
              className="px-4 py-2 bg-industrial-700 hover:bg-industrial-800 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Generate Industrial QR
            </button>
          </div>

          {generatedQr && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <img src={generatedQr} alt="QR Code" className="w-36 h-36 rounded shadow-sm mx-auto" />
              <div className="text-[10px] font-mono text-slate-500">{qrPayload}</div>
              <a
                href={generatedQr}
                download={`qr-${qrPayload}.png`}
                className="inline-flex items-center space-x-1 text-xs text-industrial-600 hover:text-industrial-800 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR PNG</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
