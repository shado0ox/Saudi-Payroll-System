import React, { useState } from 'react';
import { PayrollRun, SystemConfig } from '../types';
import { formatCurrency } from '../utils/currency';
import { Calculator, CheckCircle2, ShieldCheck, Play, ArrowRight, Sparkles } from 'lucide-react';

interface PayrollProcessingTabProps {
  currentPeriod: string;
  payrollRuns: PayrollRun[];
  config: SystemConfig;
  onCalculateRun: (period: string) => Promise<void>;
  onApproveRun: (runId: string) => Promise<void>;
}

export const PayrollProcessingTab: React.FC<PayrollProcessingTabProps> = ({
  currentPeriod,
  payrollRuns,
  config,
  onCalculateRun,
  onApproveRun
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [isCalculating, setIsCalculating] = useState(false);

  const activeRun = payrollRuns.find(r => r.period === selectedPeriod);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      await onCalculateRun(selectedPeriod);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div id="payroll-processing-tab" className="space-y-6">
      {/* Control Console */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Payroll Execution Engine</h2>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
              /api/payroll/runs/calculate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executes <code className="text-blue-600 font-mono">PayrollCalculationService</code> to apply base salaries, overtime multipliers, GOSI contributions, and tax brackets.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            id="input-payroll-period"
            type="month"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
          />

          <button
            id="btn-trigger-payroll-calc"
            onClick={handleRunCalculation}
            disabled={isCalculating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isCalculating ? (
              <span className="animate-spin text-white">⏳</span>
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{activeRun ? 'Recalculate Batch' : 'Execute Calculation'}</span>
          </button>
        </div>
      </div>

      {/* Active Run Card */}
      {activeRun ? (
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 font-mono">RUN CODE: <strong className="text-slate-900">{activeRun.runCode}</strong></div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeRun.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeRun.status === 'approved' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {activeRun.status}
                </span>

                {activeRun.status !== 'approved' && (
                  <button
                    id="btn-approve-payroll-run"
                    onClick={() => onApproveRun(activeRun.id)}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Finalize</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 font-mono text-xs">
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Total Headcount</div>
                <div className="text-base font-bold text-slate-900 mt-1">{activeRun.totalEmployees} Employees</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Gross Payroll</div>
                <div className="text-base font-bold text-slate-900 mt-1">{formatCurrency(activeRun.totalGrossPay, config.currencySymbol)}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Total Deductions</div>
                <div className="text-base font-bold text-red-600 mt-1">{formatCurrency(activeRun.totalDeductions, config.currencySymbol)}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">Net Bank Transfer</div>
                <div className="text-base font-bold text-blue-600 mt-1">{formatCurrency(activeRun.totalNetPay, config.currencySymbol)}</div>
              </div>
            </div>
          </div>

          {/* Calculated Payslips Summary Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Payslip Roll ({activeRun.payslips.length})</h4>
              <span className="text-[11px] text-slate-500 font-mono">Calculated at {new Date(activeRun.calculatedAt || '').toLocaleTimeString()}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Basic</th>
                    <th className="py-2.5 px-4">Allowances</th>
                    <th className="py-2.5 px-4">Gross</th>
                    <th className="py-2.5 px-4">Deductions</th>
                    <th className="py-2.5 px-4">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                  {activeRun.payslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900">
                        {ps.employeeName}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{ps.employeeCode}</div>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{ps.department}</td>
                      <td className="py-2.5 px-4 text-slate-900">{formatCurrency(ps.basicSalary, config.currencySymbol)}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {formatCurrency(ps.housingAllowance + ps.transportAllowance + ps.overtimePay, config.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{formatCurrency(ps.grossPay, config.currencySymbol)}</td>
                      <td className="py-2.5 px-4 text-red-600">
                        -{formatCurrency(ps.totalDeductions, config.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-blue-600">
                        {formatCurrency(ps.netPay, config.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Payroll Batch Run for Period {selectedPeriod}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Execute Calculation" above to start processing salaries for active employees using the modular calculation service.
          </p>
        </div>
      )}
    </div>
  );
};
