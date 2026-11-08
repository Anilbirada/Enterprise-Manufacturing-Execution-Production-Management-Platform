import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SetupAdminPage } from './pages/SetupAdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanningPage } from './pages/PlanningPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { ProductionLinesPage } from './pages/ProductionLinesPage';
import { MachinesPage } from './pages/MachinesPage';
import { ShiftPage } from './pages/ShiftPage';
import { AndonPage } from './pages/AndonPage';
import { QualityPage } from './pages/QualityPage';
import { OEEPage } from './pages/OEEPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { WorkInstructionsPage } from './pages/WorkInstructionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user, token, isLoading, setupRequired, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-industrial-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading RSR Factory360 MES Engine...</p>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup-admin" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="bg-industrial-900 border border-rose-900/60 p-6 rounded-lg text-center my-12 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-rose-400 mb-2">Access Restricted (403)</h2>
        <p className="text-sm text-slate-300">
          Your active role does not have authorization to view this manufacturing module ({requiredPermission}).
        </p>
      </div>
    );
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public / Setup Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-admin" element={<SetupAdminPage />} />

      {/* Protected Manufacturing Routes with AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/planning"
          element={
            <ProtectedRoute requiredPermission="planning:view">
              <PlanningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-orders"
          element={
            <ProtectedRoute requiredPermission="workorders:view">
              <WorkOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/execution"
          element={
            <ProtectedRoute requiredPermission="execution:view">
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lines"
          element={
            <ProtectedRoute requiredPermission="lines:view">
              <ProductionLinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machines"
          element={
            <ProtectedRoute requiredPermission="machines:view">
              <MachinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute requiredPermission="shifts:view">
              <ShiftPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/andon"
          element={
            <ProtectedRoute requiredPermission="andon:view">
              <AndonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality"
          element={
            <ProtectedRoute requiredPermission="quality:view">
              <QualityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/oee"
          element={
            <ProtectedRoute requiredPermission="oee:view">
              <OEEPage />
            </ProtectedRoute>
          }
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requiredPermission="inventory:view">
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traceability"
          element={
            <ProtectedRoute requiredPermission="traceability:view">
              <TraceabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute requiredPermission="maintenance:view">
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-instructions"
          element={
            <ProtectedRoute requiredPermission="workinstructions:view">
              <WorkInstructionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredPermission="reports:view">
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="users:manage">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute requiredPermission="audit:view">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute requiredPermission="system:configure">
              <IntegrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredPermission="system:configure">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
