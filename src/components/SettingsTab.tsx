import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Settings, Save, ShieldCheck } from 'lucide-react';

interface SettingsTabProps {
  config: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ config, onSaveConfig }) => {
  const [companyName, setCompanyName] = useState(config.companyName);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);
  const [employeeGosi, setEmployeeGosi] = useState(config.socialSecurityEmployeeRate * 100);
  const [employerGosi, setEmployerGosi] = useState(config.socialSecurityEmployerRate * 100);
  const [overtimeRate, setOvertimeRate] = useState(config.overtimeHourlyMultiplier);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig({
        companyName,
        currencySymbol,
        socialSecurityEmployeeRate: employeeGosi / 100,
        socialSecurityEmployerRate: employerGosi / 100,
        overtimeHourlyMultiplier: Number(overtimeRate)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="settings-tab-content" className="space-y-6">
      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs">
        <h2 className="text-base font-bold text-slate-800">System Tax & Insurance Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Adjust parameters stored in <code className="text-blue-600 font-mono">/src/config/index.ts</code> to dynamically update all calculations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-lg space-y-5 text-xs text-slate-800 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Company Legal Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Currency Symbol</label>
            <input
              type="text"
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded border border-slate-200">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Social Insurance (Employee Share %)</label>
            <input
              type="number"
              step="0.1"
              value={employeeGosi}
              onChange={e => setEmployeeGosi(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Social Insurance (Employer Share %)</label>
            <input
              type="number"
              step="0.1"
              value={employerGosi}
              onChange={e => setEmployerGosi(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Overtime Hourly Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={overtimeRate}
              onChange={e => setOvertimeRate(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
