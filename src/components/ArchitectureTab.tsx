import React, { useState } from 'react';
import { FolderTree, Code2, Server, CheckCircle2, Play, Terminal } from 'lucide-react';

export const ArchitectureTab: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/api/health');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const folderStructure = [
    {
      folder: '/src/config',
      desc: 'System defaults, currency format, tax brackets, social security rates, server ports.',
      files: ['index.ts']
    },
    {
      folder: '/src/models',
      desc: 'Data layer and JSON file/memory persistence models.',
      files: ['db.ts', 'EmployeeModel.ts', 'PayrollModel.ts', 'AttendanceModel.ts', 'DepartmentModel.ts']
    },
    {
      folder: '/src/controllers',
      desc: 'Express API controllers handling incoming HTTP requests and responses.',
      files: [
        'employeeController.ts',
        'payrollController.ts',
        'attendanceController.ts',
        'reportController.ts',
        'settingsController.ts',
        'workerController.ts'
      ]
    },
    {
      folder: '/src/services',
      desc: '3 core business logic services as requested.',
      files: [
        'payrollCalculationService.ts (Service 1: Tax, GOSI & Salary calculations)',
        'payslipService.ts (Service 2: Payslip HTML formatting)',
        'payrollExportService.ts (Service 3: WPS Bank & CSV export generation)'
      ]
    },
    {
      folder: '/src/routes',
      desc: 'Express route definitions assembled into a unified router.',
      files: [
        'index.ts',
        'employeeRoutes.ts',
        'payrollRoutes.ts',
        'attendanceRoutes.ts',
        'reportRoutes.ts',
        'settingsRoutes.ts',
        'workerRoutes.ts'
      ]
    },
    {
      folder: '/src/middlewares',
      desc: 'Express request pipeline middlewares.',
      files: ['authMiddleware.ts', 'validationMiddleware.ts', 'errorHandler.ts', 'requestLogger.ts']
    },
    {
      folder: '/src/utils',
      desc: 'Pure helper functions and utilities.',
      files: ['taxCalculator.ts', 'currency.ts', 'dateHelper.ts', 'logger.ts']
    },
    {
      folder: 'Root CLI Scripts',
      desc: 'Standalone scripts executable via npm.',
      files: ['server.ts (Node/Express Entry)', 'worker.ts (Background Worker)', 'migrate.ts (DB Migrations)']
    }
  ];

  const testEndpoints = [
    { name: 'Health Check', url: '/api/health', method: 'GET' },
    { name: 'Get Employees', url: '/api/employees', method: 'GET' },
    { name: 'Get Payroll Runs', url: '/api/payroll/runs', method: 'GET' },
    { name: 'Get Attendance Records', url: '/api/attendance?period=2026-08', method: 'GET' },
    { name: 'Get System Config', url: '/api/settings', method: 'GET' },
    { name: 'Get Audit Trail', url: '/api/reports/audit-logs', method: 'GET' }
  ];

  const handleTestApi = async (url: string) => {
    setActiveEndpoint(url);
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      setApiResponse(json);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="architecture-tab-content" className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Project Folder Architecture ("payroll-system")</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete redistribution of <code className="text-blue-600 font-semibold">server.js</code>, <code className="text-blue-600 font-semibold">routes.js</code>, and the 3 business services into clean modular folders.
          </p>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {folderStructure.map((item, idx) => (
          <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-mono text-xs font-bold text-blue-700">{item.folder}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">
                {item.files.length} module(s)
              </span>
            </div>
            <p className="text-xs text-slate-500">{item.desc}</p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              {item.files.map((file, fIdx) => (
                <div key={fIdx} className="text-xs font-mono text-slate-800 flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live API Tester Console */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-bold text-slate-800">Live Express API Route Inspector</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Base URL: http://0.0.0.0:3000</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {testEndpoints.map((ep, idx) => (
            <button
              key={idx}
              onClick={() => handleTestApi(ep.url)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold border transition-all cursor-pointer shadow-xs ${
                activeEndpoint === ep.url
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={activeEndpoint === ep.url ? 'text-white font-bold mr-1' : 'text-green-600 font-bold mr-1'}>{ep.method}</span>
              {ep.url}
            </button>
          ))}
        </div>

        {/* Console Response Box */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
            <span>REQUEST: {activeEndpoint}</span>
            <span className="text-green-400 font-bold">STATUS: {loading ? 'FETCHING...' : apiResponse ? '200 OK' : 'READY'}</span>
          </div>
          <pre className="text-green-400 overflow-x-auto max-h-60 p-2">
            {loading ? 'Executing Express API call...' : JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
