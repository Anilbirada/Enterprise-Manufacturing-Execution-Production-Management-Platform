import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Users, Plus, ShieldCheck, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { activePlant, hasPermission, plants } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<UserRole>(UserRole.MACHINE_OPERATOR);
  const [plantId, setPlantId] = useState(activePlant?._id || '');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.request('/users');
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activePlant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          plantId: plantId || undefined
        })
      });
      setShowModal(false);
      setName('');
      setEmail('');
      loadUsers();
    } catch (err: any) {
      alert(`Error creating user: ${err.message}`);
    }
  };

  const toggleUserActive = async (user: any) => {
    try {
      await api.request(`/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !user.active })
      });
      loadUsers();
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Enterprise User Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-based access control (RBAC), multi-plant user allocation, and account activation governance.
          </p>
        </div>

        {hasPermission('users:manage') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Factory User</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Facility / Plant</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading user directory...</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-industrial-50 text-industrial-800 border border-industrial-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.plantId?.name || 'All Facilities (Global)'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasPermission('users:manage') && (
                        <button
                          onClick={() => toggleUserActive(u)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            u.active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
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

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Provision Factory User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Employee Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@rsrtechnologies.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Enterprise Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  <option value={UserRole.PLANT_MANAGER}>Plant Manager</option>
                  <option value={UserRole.PRODUCTION_MANAGER}>Production Manager</option>
                  <option value={UserRole.SHIFT_SUPERVISOR}>Shift Supervisor</option>
                  <option value={UserRole.MACHINE_OPERATOR}>Machine Operator</option>
                  <option value={UserRole.QUALITY_MANAGER}>Quality Manager / Inspector</option>
                  <option value={UserRole.MAINTENANCE_ENGINEER}>Maintenance Engineer</option>
                  <option value={UserRole.WAREHOUSE_MANAGER}>Warehouse Manager</option>
                  <option value={UserRole.SYSTEM_ADMIN}>System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Plant Facility</label>
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">All Facilities</option>
                  {plants.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
