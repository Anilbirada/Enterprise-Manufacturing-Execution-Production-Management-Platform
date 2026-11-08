import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  PlaySquare,
  Network,
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Boxes,
  PackageSearch,
  QrCode,
  Wrench,
  FileText,
  BarChart3,
  BellRing,
  Users,
  ShieldCheck,
  Cable,
  Settings
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  requiredPermission?: string;
}

export const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const navigationItems: NavItem[] = [
    { name: '1. Overview Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: '2. Production Planning', path: '/planning', icon: CalendarDays, requiredPermission: 'planning:view' },
    { name: '3. Work Orders', path: '/work-orders', icon: ClipboardList, requiredPermission: 'workorders:view' },
    { name: '4. Production Execution', path: '/execution', icon: PlaySquare, requiredPermission: 'execution:view' },
    { name: '5. Production Lines', path: '/lines', icon: Network, requiredPermission: 'lines:view' },
    { name: '6. Machines & Equipment', path: '/machines', icon: Cpu, requiredPermission: 'machines:view' },
    { name: '7. Shift Management', path: '/shifts', icon: Clock, requiredPermission: 'shifts:view' },
    { name: '8. Downtime & Andon', path: '/andon', icon: AlertTriangle, requiredPermission: 'andon:view' },
    { name: '9. Quality Management', path: '/quality', icon: CheckCircle2, requiredPermission: 'quality:view' },
    { name: '10. OEE & Analytics', path: '/oee', icon: Gauge, requiredPermission: 'oee:view' },
    { name: '11. Products & BOM', path: '/products', icon: Boxes },
    { name: '12. Materials & Inventory', path: '/inventory', icon: PackageSearch, requiredPermission: 'inventory:view' },
    { name: '13. Barcode & Traceability', path: '/traceability', icon: QrCode, requiredPermission: 'traceability:view' },
    { name: '14. Maintenance Management', path: '/maintenance', icon: Wrench, requiredPermission: 'maintenance:view' },
    { name: '15. Work Instructions', path: '/work-instructions', icon: FileText, requiredPermission: 'workinstructions:view' },
    { name: '16. Reports & Exports', path: '/reports', icon: BarChart3, requiredPermission: 'reports:view' },
    { name: '17. Notifications', path: '/notifications', icon: BellRing },
    { name: '18. User Management', path: '/users', icon: Users, requiredPermission: 'users:manage' },
    { name: '19. Audit Logs', path: '/audit', icon: ShieldCheck, requiredPermission: 'audit:view' },
    { name: '20. Integrations', path: '/integrations', icon: Cable, requiredPermission: 'system:configure' },
    { name: '21. System Settings', path: '/settings', icon: Settings, requiredPermission: 'system:configure' }
  ];

  // Filter items based on permission
  const accessibleItems = navigationItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <aside className="w-64 bg-industrial-900 border-r border-slate-800 text-slate-300 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto select-none">
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
          Manufacturing Modules
        </div>

        <nav className="space-y-0.5 mt-1">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-industrial-700 text-cyan-300 border-l-4 border-cyan-400 shadow-inner'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/80 bg-industrial-950/40 text-[11px] text-slate-400">
        <div className="flex justify-between items-center mb-1">
          <span>Engine Release</span>
          <span className="text-cyan-400 font-semibold">v1.0-prod</span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>Target Plant</span>
          <span>Jigani & Bommasandra</span>
        </div>
      </div>
    </aside>
  );
};
