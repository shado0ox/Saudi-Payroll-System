import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { Clock, Save } from 'lucide-react';

interface AttendanceTabProps {
  currentPeriod: string;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (rec: any) => Promise<void>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  currentPeriod,
  employees,
  attendanceRecords,
  onUpdateAttendance
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [editingValues, setEditingValues] = useState<{ [empId: string]: { absence: number; overtime: number } }>({});

  const handleInputChange = (empId: string, field: 'absence' | 'overtime', val: number) => {
    setEditingValues(prev => ({
      ...prev,
      [empId]: {
        absence: field === 'absence' ? val : (prev[empId]?.absence ?? 0),
        overtime: field === 'overtime' ? val : (prev[empId]?.overtime ?? 0)
      }
    }));
  };

  const handleSave = async (empId: string) => {
    const vals = editingValues[empId] || { absence: 0, overtime: 0 };
    await onUpdateAttendance({
      employeeId: empId,
      period: selectedPeriod,
      workingDays: 30,
      presentDays: 30 - vals.absence,
      unpaidAbsenceDays: vals.absence,
      overtimeHours: vals.overtime
    });
  };

  return (
    <div id="attendance-overtime-tab" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Attendance & Overtime Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Log unpaid leave days and overtime hours to automatically calculate salary adjustments.</p>
        </div>

        <input
          id="input-attendance-period"
          type="month"
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Working Days</th>
                <th className="py-2.5 px-4">Unpaid Absence Days</th>
                <th className="py-2.5 px-4">Overtime Hours</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
              {employees.map(emp => {
                const rec = attendanceRecords.find(a => a.employeeId === emp.id && a.period === selectedPeriod);
                const currAbsence = editingValues[emp.id]?.absence ?? rec?.unpaidAbsenceDays ?? 0;
                const currOvertime = editingValues[emp.id]?.overtime ?? rec?.overtimeHours ?? 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">
                      {emp.firstName} {emp.lastName}
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{emp.employeeCode}</div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">{emp.department}</td>
                    <td className="py-2.5 px-4 text-slate-800">30 days</td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={currAbsence}
                        onChange={e => handleInputChange(emp.id, 'absence', Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs text-center focus:border-blue-500 shadow-xs"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        value={currOvertime}
                        onChange={e => handleInputChange(emp.id, 'overtime', Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs text-center focus:border-blue-500 shadow-xs"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        id={`btn-save-attendance-${emp.id}`}
                        onClick={() => handleSave(emp.id)}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
