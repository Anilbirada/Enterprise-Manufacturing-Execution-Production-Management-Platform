import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Cable,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Upload,
  Globe,
  Database,
  ShieldCheck
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [simulationActive, setSimulationActive] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importType, setImportType] = useState('Product');
  const [importJson, setImportJson] = useState(
    JSON.stringify(
      [
        { code: 'ERP-PART-100', name: 'ERP Imported Hydraulic Flange', category: 'Machining', uom: 'PCS', standardCycleTimeSeconds: 50 }
      ],
      null,
      2
    )
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.request('/integrations/configs');
      if (res.success) setConfigs(res.configs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleToggleSimulation = async (enable: boolean) => {
    try {
      const res = await api.request('/integrations/simulation/toggle', {
        method: 'POST',
        body: JSON.stringify({ enable })
      });
      setSimulationActive(res.simulationActive);
      alert(res.message);
    } catch (err: any) {
      alert(`Simulation toggle error: ${err.message}`);
    }
  };

  const handleBatchImport = async () => {
    try {
      const records = JSON.parse(importJson);
      const res = await api.request('/integrations/erp/import', {
        method: 'POST',
        body: JSON.stringify({
          entityType: importType,
          records
        })
      });
      alert(res.message);
    } catch (err: any) {
      alert(`ERP Import error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Industrial & ERP Integrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            OPC UA & MQTT read-only telemetry adapters, REST API endpoints, webhooks, and ERP sync pipelines.
          </p>
        </div>
      </div>

      {/* Industrial Machine Telemetry Simulation Layer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-industrial-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Read-Only Industrial Telemetry Adapter (OPC UA / MQTT)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Provides real-time spindle RPM, motor temperature, and vibration telemetry. 
              <span className="font-semibold text-rose-600"> Note: Strictly read-only; safety commands are never sent to PLCs.</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                simulationActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {simulationActive ? 'Simulation Active' : 'Simulation Paused'}
            </span>
            <button
              onClick={() => handleToggleSimulation(!simulationActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-colors ${
                simulationActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {simulationActive ? 'Pause Simulation' : 'Start Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* ERP Batch Payload Importer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-industrial-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Enterprise ERP Ingestion Adapter (SAP / Odoo / ERPNext)
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Sync master records or work orders in bulk via standardized JSON/REST payloads.
        </p>

        <div className="space-y-3">
          <div className="flex space-x-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              Target Entity:
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
            >
              <option value="Product">Products (Finished Goods & Subassemblies)</option>
              <option value="Material">Materials (Raw Stock & Components)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">JSON Payload</label>
            <textarea
              rows={5}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none"
            />
          </div>

          <button
            onClick={handleBatchImport}
            className="flex items-center space-x-1.5 px-4 py-2 bg-industrial-700 hover:bg-industrial-800 text-white rounded-lg text-xs font-bold shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Process & Import ERP Payload</span>
          </button>
        </div>
      </div>

      {/* Webhook Endpoints Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-industrial-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Public Webhook Receiver
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Configure barcode scan guns, vision cameras, or external ERP webhooks to trigger automatic execution actions.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
          POST https://rsrfactory360.internal/api/integrations/webhook
        </div>
      </div>
    </div>
  );
};
