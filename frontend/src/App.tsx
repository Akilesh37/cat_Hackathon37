import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/cat-ui/Sidebar';
import { TopBar } from './components/cat-ui/TopBar';
import { MobileBottomNav } from './pages/operator/MobileLayout';
import { Login } from './pages/Login';

// Operator Pages
import { OperatorDashboard } from './pages/operator/OperatorDashboard';
import { MyTasks } from './pages/operator/MyTasks';
import { LiveOperation } from './pages/operator/LiveOperation';
import { PreStartSafetyCheck } from './pages/operator/PreStartSafetyCheck';
import { MachineHealth } from './pages/operator/MachineHealth';
import { CopilotView } from './pages/operator/CopilotView';
import { TrainingHub } from './pages/operator/TrainingHub';
import { QuizView } from './pages/operator/QuizView';
import { OperatorAlerts } from './pages/operator/Alerts';
import { ShiftSummary } from './pages/operator/ShiftSummary';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FleetCommandCenter } from './pages/admin/FleetCommandCenter';
import { TaskAssignment } from './pages/admin/TaskAssignment';
import { LiveSensorMonitoring } from './pages/admin/LiveSensorMonitoring';
import { OperatorManagement } from './pages/admin/OperatorManagement';
import { IncidentCenter } from './pages/admin/IncidentCenter';
import { IncidentReplay } from './pages/admin/IncidentReplay';
import { MaintenanceDashboard } from './pages/admin/MaintenanceDashboard';
import { AdminReports } from './pages/admin/Reports';
import { AdminSettings } from './pages/admin/Settings';

// Layout wrapper for authenticated views
const AppLayout: React.FC<{ children: React.ReactNode; isOperator?: boolean }> = ({ children, isOperator }) => {
  return (
    <div className="min-h-screen bg-cat-gray-50 flex">
      {/* Fixed 240px Sidebar on desktop */}
      <div className="hidden md:block w-60 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        <TopBar />
        <main className="p-4 md:p-6 flex-1 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isOperator && <MobileBottomNav />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Admin App Routes */}
      <Route
        path="/admin/dashboard"
        element={<AppLayout><AdminDashboard /></AppLayout>}
      />
      <Route
        path="/admin/fleet"
        element={<AppLayout><FleetCommandCenter /></AppLayout>}
      />
      <Route
        path="/admin/tasks/assign"
        element={<AppLayout><TaskAssignment /></AppLayout>}
      />
      <Route
        path="/admin/monitoring"
        element={<AppLayout><LiveSensorMonitoring /></AppLayout>}
      />
      <Route
        path="/admin/operators"
        element={<AppLayout><OperatorManagement /></AppLayout>}
      />
      <Route
        path="/admin/incidents"
        element={<AppLayout><IncidentCenter /></AppLayout>}
      />
      <Route
        path="/admin/incidents/:incidentId/replay"
        element={<AppLayout><IncidentReplay /></AppLayout>}
      />
      <Route
        path="/admin/maintenance"
        element={<AppLayout><MaintenanceDashboard /></AppLayout>}
      />
      <Route
        path="/admin/training"
        element={<AppLayout><TrainingHub /></AppLayout>}
      />
      <Route
        path="/admin/reports"
        element={<AppLayout><AdminReports /></AppLayout>}
      />
      <Route
        path="/admin/settings"
        element={<AppLayout><AdminSettings /></AppLayout>}
      />

      {/* Operator App Routes */}
      <Route
        path="/operator/dashboard"
        element={<AppLayout isOperator><OperatorDashboard /></AppLayout>}
      />
      <Route
        path="/operator/tasks"
        element={<AppLayout isOperator><MyTasks /></AppLayout>}
      />
      <Route
        path="/operator/live"
        element={<AppLayout isOperator><LiveOperation /></AppLayout>}
      />
      <Route
        path="/operator/safety-check"
        element={<AppLayout isOperator><PreStartSafetyCheck /></AppLayout>}
      />
      <Route
        path="/operator/health"
        element={<AppLayout isOperator><MachineHealth /></AppLayout>}
      />
      <Route
        path="/operator/copilot"
        element={<AppLayout isOperator><CopilotView /></AppLayout>}
      />
      <Route
        path="/operator/training"
        element={<AppLayout isOperator><TrainingHub /></AppLayout>}
      />
      <Route
        path="/operator/quiz/:assignmentId"
        element={<AppLayout isOperator><QuizView /></AppLayout>}
      />
      <Route
        path="/operator/alerts"
        element={<AppLayout isOperator><OperatorAlerts /></AppLayout>}
      />
      <Route
        path="/operator/summary/:taskId"
        element={<AppLayout isOperator><ShiftSummary /></AppLayout>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
