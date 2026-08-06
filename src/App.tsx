import React, { useState, useEffect } from 'react';
import { Employee, Department, PayrollRun, AttendanceRecord, SystemConfig, AuditLog } from './types';
import { defaultConfig } from './config';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { EmployeeTab } from './components/EmployeeTab';
import { PayrollProcessingTab } from './components/PayrollProcessingTab';
import { PayslipsTab } from './components/PayslipsTab';
import { AttendanceTab } from './components/AttendanceTab';
import { JournalEntriesTab } from './components/JournalEntriesTab';
import { CompanyManagementTab } from './components/CompanyManagementTab';
import { ReportsTab } from './components/ReportsTab';
import { AuthTab } from './components/AuthTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { WorkerConsoleTab } from './components/WorkerConsoleTab';
import { SettingsTab } from './components/SettingsTab';
import { getCurrentPeriod } from './utils/dateHelper';
import { ShieldAlert, X } from 'lucide-react';

function MainAppContent() {
  const { authFetch, user, companyId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentPeriod] = useState<string>(getCurrentPeriod());
  
  // Data state from Express Backend
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Load initial backend state using JWT authFetch
  const loadData = async () => {
    try {
      const [empRes, runsRes, attRes, cfgRes, logsRes] = await Promise.all([
        authFetch('/api/employees').then(r => r.json()),
        authFetch('/api/payroll/runs').then(r => r.json()),
        authFetch(`/api/attendance?period=${currentPeriod}`).then(r => r.json()),
        authFetch('/api/settings').then(r => r.json()),
        authFetch('/api/reports/audit-logs').then(r => r.json())
      ]);

      if (empRes.success) {
        setEmployees(empRes.data.employees);
        setDepartments(empRes.data.departments);
      }
      if (runsRes.success) setPayrollRuns(runsRes.data);
      if (attRes.success) setAttendanceRecords(attRes.data.records);
      if (cfgRes.success) setConfig(cfgRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);

      setApiStatus('online');
    } catch (err) {
      console.error('Failed to connect to Express backend API:', err);
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPeriod, user?.role, companyId]);

  // Handler functions targeting Express API routes with error interceptor
  const handleResponseErrors = (json: any) => {
    if (json.error?.code === 'FORBIDDEN') {
      setForbiddenError(json.error.message || 'Access denied for your user role.');
      return false;
    }
    return true;
  };

  const handleAddEmployee = async (empData: any) => {
    setForbiddenError(null);
    const res = await authFetch('/api/employees', {
      method: 'POST',
      body: JSON.stringify(empData)
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setForbiddenError(null);
    const res = await authFetch(`/api/employees/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
    }
  };

  const handleCalculateRun = async (period: string) => {
    setForbiddenError(null);
    const res = await authFetch('/api/payroll/runs/calculate', {
      method: 'POST',
      body: JSON.stringify({ period, title: `Payroll Run ${period}` })
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
    }
  };

  const handleApproveRun = async (runId: string) => {
    setForbiddenError(null);
    const res = await authFetch(`/api/payroll/runs/${runId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy: `${user?.firstName || 'User'} (${user?.role})` })
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
    }
  };

  const handleUpdateAttendance = async (rec: any) => {
    setForbiddenError(null);
    const res = await authFetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(rec)
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
    }
  };

  const handleSaveConfig = async (updated: Partial<SystemConfig>) => {
    setForbiddenError(null);
    const res = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      setConfig(json.data);
      await loadData();
    }
  };

  const handleTriggerWorker = async () => {
    setForbiddenError(null);
    const res = await authFetch('/api/system/worker/run', {
      method: 'POST',
      body: JSON.stringify({ period: currentPeriod })
    });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
      return json.data;
    }
    throw new Error(json.error?.message || 'Worker failed');
  };

  const handleTriggerMigration = async () => {
    setForbiddenError(null);
    const res = await authFetch('/api/system/migrate/run', { method: 'POST' });
    const json = await res.json();
    if (handleResponseErrors(json) && json.success) {
      await loadData();
      return json.data;
    }
    throw new Error(json.error?.message || 'Migration failed');
  };

  const latestRun = payrollRuns.length > 0 ? payrollRuns[payrollRuns.length - 1] : undefined;

  return (
    <div id="payroll-system-app" className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar
        companyName={config.companyName}
        activePeriod={currentPeriod}
        apiStatus={apiStatus}
        onRunWorker={handleTriggerWorker}
      />

      {/* Permission Forbidden Banner if Role Insufficient */}
      {forbiddenError && (
        <div className="bg-rose-600 text-white px-6 py-3 flex items-center justify-between text-xs font-semibold shadow-md border-b border-rose-700 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-300" />
            <span>HTTP 403 Forbidden: {forbiddenError} Use the "Switch Role" button in navbar to change persona.</span>
          </div>
          <button
            onClick={() => setForbiddenError(null)}
            className="text-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          employeeCount={employees.length}
          payrollRunStatus={latestRun?.status === 'calculated' ? 'pending' : undefined}
        />

        <main id="main-content-area" className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              employees={employees}
              latestRun={latestRun}
              config={config}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeTab
              employees={employees}
              departments={departments}
              config={config}
              onAddEmployee={handleAddEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollProcessingTab
              currentPeriod={currentPeriod}
              payrollRuns={payrollRuns}
              config={config}
              onCalculateRun={handleCalculateRun}
              onApproveRun={handleApproveRun}
            />
          )}

          {activeTab === 'payslips' && (
            <PayslipsTab
              payrollRuns={payrollRuns}
              config={config}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              currentPeriod={currentPeriod}
              employees={employees}
              attendanceRecords={attendanceRecords}
              onUpdateAttendance={handleUpdateAttendance}
            />
          )}

          {activeTab === 'journal' && (
            <JournalEntriesTab />
          )}

          {activeTab === 'companies' && (
            <CompanyManagementTab onRefreshData={loadData} />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              payrollRuns={payrollRuns}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'auth' && (
            <AuthTab />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureTab />
          )}

          {activeTab === 'worker' && (
            <WorkerConsoleTab
              onTriggerWorker={handleTriggerWorker}
              onTriggerMigration={handleTriggerMigration}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              config={config}
              onSaveConfig={handleSaveConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
