import React, { useState } from 'react';
import { Terminal, Play, RefreshCw, CheckCircle2 } from 'lucide-react';

interface WorkerConsoleTabProps {
  onTriggerWorker: () => Promise<any>;
  onTriggerMigration: () => Promise<any>;
}

export const WorkerConsoleTab: React.FC<WorkerConsoleTabProps> = ({
  onTriggerWorker,
  onTriggerMigration
}) => {
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System CLI Runner Initialized.`,
    `[${new Date().toLocaleTimeString()}] Target scripts: worker.ts, migrate.ts.`
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunWorker = async () => {
    setIsRunning(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] > npm run worker`]);
    try {
      const res = await onTriggerWorker();
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [WORKER SUCCESS] Processed ${res.employeesProcessed || 0} employees. Duration: ${res.durationMs || 0}ms. Total Net: SAR ${res.totalNetPay || 0}`
      ]);
    } catch (err: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [WORKER ERROR] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunMigration = async () => {
    setIsRunning(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] > npm run migrate`]);
    try {
      const res = await onTriggerMigration();
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [MIGRATION SUCCESS] ${res.message || 'Database schema updated successfully.'}`
      ]);
    } catch (err: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [MIGRATION ERROR] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="worker-console-tab" className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">CLI Scripts Runner (worker.ts & migrate.ts)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executes background tasks and database seed migrations directly via Express API endpoints or CLI commands.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-cli-run-migration"
            onClick={handleRunMigration}
            disabled={isRunning}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded border border-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isRunning ? 'animate-spin' : ''}`} />
            <span>npm run migrate</span>
          </button>

          <button
            id="btn-cli-run-worker"
            onClick={handleRunWorker}
            disabled={isRunning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>npm run worker</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 font-mono text-xs shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="ml-2 font-bold text-slate-300">bash - payroll-system worker process</span>
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Clear Console
          </button>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto text-green-400 p-2">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log}
            </div>
          ))}
          {isRunning && (
            <div className="text-yellow-400 animate-pulse">
              [RUNNING] Executing script process...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
