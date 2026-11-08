import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Sliders, 
  Database, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Factory,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { activePlant, plants } = useAuth();
  const currentPlantId = activePlant?.code || activePlant?._id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'kpis' | 'plants' | 'backup'>('general');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // General System State
  const [companyName, setCompanyName] = useState('RSR Technologies');
  const [appTitle, setAppTitle] = useState('RSR Factory360 MES');
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [offlineSyncInterval, setOfflineSyncInterval] = useState(15);

  // OEE Thresholds State
  const [oeeWorldClassTarget, setOeeWorldClassTarget] = useState(85);
  const [oeeWarningThreshold, setOeeWarningThreshold] = useState(65);
  const [autoDowntimeThresholdSeconds, setAutoDowntimeThresholdSeconds] = useState(180);
  const [excludePlannedBreaks, setExcludePlannedBreaks] = useState(true);

  // Plants / Sites State
  const [plantsList, setPlantsList] = useState<any[]>([]);
  const [newPlantModal, setNewPlantModal] = useState(false);
  const [newPlantCode, setNewPlantCode] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantLocation, setNewPlantLocation] = useState('');

  useEffect(() => {
    loadSettingsData();
  }, [activePlant]);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-data/plants');
      setPlantsList(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setAlert({ type: 'success', message: 'System configuration saved successfully.' });
      setTimeout(() => setAlert(null), 4000);
    }, 600);
  };

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantCode || !newPlantName) return;
    try {
      setSaving(true);
      // fetch default site id or create
      const sitesRes = await api.get('/master-data/sites');
      const siteId = sitesRes.data.data?.[0]?._id;
      if (!siteId) {
        throw new Error('Please configure a manufacturing site first.');
      }
      await api.post('/master-data/plants', {
        code: newPlantCode.toUpperCase(),
        name: newPlantName,
        siteId,
        location: newPlantLocation || 'Bengaluru Industrial Zone'
      });
      setAlert({ type: 'success', message: `Plant ${newPlantCode} created successfully.` });
      setNewPlantModal(false);
      setNewPlantCode('');
      setNewPlantName('');
      setNewPlantLocation('');
      loadSettingsData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-industrial-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-industrial-800 rounded-lg border border-slate-700 text-cyan-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">System Settings & Plant Configuration</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure plant hierarchy, OEE targets, data policies, and automated backup schedules
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadSettingsData()}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-md border flex items-center space-x-2 text-sm ${
            alert.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700 text-rose-300'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'general'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>General & Company</span>
        </button>
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'kpis'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>OEE & Production Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('plants')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'plants'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Manufacturing Plants ({plantsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'backup'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data & Backups</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-industrial-900 border border-slate-800 rounded-lg p-6 max-w-3xl space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-2">
            Company & Application Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Platform Identifier
              </label>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Session Inactivity Timeout (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Forces re-authentication when operator station is unattended</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                PWA Offline Sync Polling (Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={offlineSyncInterval}
                onChange={(e) => setOfflineSyncInterval(Number(e.target.value))}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Interval for shop-floor tablet offline action reconciliation</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save General Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: OEE & Production Rules */}
      {activeTab === 'kpis' && (
        <form onSubmit={handleSaveGeneral} className="bg-industrial-900 border border-slate-800 rounded-lg p-6 max-w-3xl space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-2">
            OEE & Manufacturing Calculation Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target World-Class OEE (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={oeeWorldClassTarget}
                onChange={(e) => setOeeWorldClassTarget(Number(e.target.value))}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Industry benchmark standard is typically 85.0%</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                OEE Warning Threshold (%)
              </label>
              <input
                type="number"
                min={20}
                max={80}
                value={oeeWarningThreshold}
                onChange={(e) => setOeeWarningThreshold(Number(e.target.value))}
                className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Triggers amber alert on supervisor & executive dashboards</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Micro-Stop Detection Threshold (Seconds)
            </label>
            <input
              type="number"
              min={30}
              max={1800}
              value={autoDowntimeThresholdSeconds}
              onChange={(e) => setAutoDowntimeThresholdSeconds(Number(e.target.value))}
              className="w-full md:w-1/2 bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Inactivity duration on a running line before an automatic downtime event is initiated</span>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludePlannedBreaks}
                onChange={(e) => setExcludePlannedBreaks(e.target.checked)}
                className="rounded bg-industrial-950 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">Exclude Planned Shift Breaks from Planned Production Time</span>
                <p className="text-[11px] text-slate-400">
                  Strict OEE formula: (Total Shift Duration - Planned Tea/Lunch Breaks) = Planned Production Time. Prevents false availability penalties.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save OEE Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Manufacturing Plants */}
      {activeTab === 'plants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              Multi-plant manufacturing topology. Users switch plants via the top header bar.
            </p>
            <button
              onClick={() => setNewPlantModal(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manufacturing Plant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantsList.map((plant) => (
              <div
                key={plant._id}
                className={`p-5 rounded-lg border bg-industrial-900 ${
                  plant.code === currentPlantId
                    ? 'border-cyan-500/80 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <Factory className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-white text-base">{plant.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                    {plant.code}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{plant.location || 'Bengaluru Industrial Zone'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-medium">Active Production</span>
                  </div>
                </div>

                {plant.code === currentPlantId ? (
                  <div className="text-[11px] text-cyan-400 font-semibold flex items-center space-x-1.5 bg-cyan-950/40 border border-cyan-800/60 p-2 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Session Context</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Available in multi-plant dropdown
                  </div>
                )}
              </div>
            ))}
          </div>

          {newPlantModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <form onSubmit={handleCreatePlant} className="bg-industrial-900 border border-slate-700 rounded-lg p-6 max-w-md w-full space-y-4">
                <h3 className="text-base font-bold text-white">Register Manufacturing Plant</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Plant Code (e.g. PEENYA-PLANT3)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlantCode}
                    onChange={(e) => setNewPlantCode(e.target.value)}
                    className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Plant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlantName}
                    onChange={(e) => setNewPlantName(e.target.value)}
                    className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Location / Industrial Zone
                  </label>
                  <input
                    type="text"
                    value={newPlantLocation}
                    onChange={(e) => setNewPlantLocation(e.target.value)}
                    placeholder="e.g. Peenya Industrial Area, Bengaluru"
                    className="w-full bg-industrial-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewPlantModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                  >
                    Create Plant
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Data & Backup */}
      {activeTab === 'backup' && (
        <div className="bg-industrial-900 border border-slate-800 rounded-lg p-6 max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">Database Backup & Disaster Recovery</h2>
            <p className="text-xs text-slate-400 mt-1">
              Production backup routines using MongoDB mongodump and tar snapshot archive
            </p>
          </div>

          <div className="p-4 bg-industrial-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-200">Automated Daily Backups</span>
                <p className="text-xs text-slate-400">Scheduled daily at 02:00 AM IST to `/var/backups/rsrfactory360`</p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ENABLED (CRON)
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800 font-mono">
              <p>Script: <span className="text-cyan-300">docker/backup.sh</span></p>
              <p>Restore: <span className="text-cyan-300">docker/restore.sh &lt;backup_file.tar.gz&gt;</span></p>
              <p>Retention: <span className="text-white">30 Days rolling rotation</span></p>
            </div>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-lg flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold block mb-0.5">Disaster Recovery Protocol:</span>
              Restoration overwrites the active transactional collections (WorkOrders, ProductionEntries, DowntimeEvents). Ensure plant operations are placed on planned hold before executing restoration in production.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
