import React, { useState } from 'react';
import { Employee, Department, SystemConfig } from '../types';
import { formatCurrency } from '../utils/currency';
import { UserPlus, Search, Edit2, Trash2, X, Plus, ShieldCheck, Lock } from 'lucide-react';

interface EmployeeTabProps {
  employees: Employee[];
  departments: Department[];
  config: SystemConfig;
  onAddEmployee: (empData: any) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export const EmployeeTab: React.FC<EmployeeTabProps> = ({
  employees,
  departments,
  config,
  onAddEmployee,
  onDeleteEmployee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('1010123456');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+966 50 ');
  const [department, setDepartment] = useState(departments[0]?.name || 'Software Engineering');
  const [position, setPosition] = useState('Specialist');
  const [basicSalary, setBasicSalary] = useState<number>(12000);
  const [housingAllowance, setHousingAllowance] = useState<number>(3000);
  const [transportAllowance, setTransportAllowance] = useState<number>(1000);
  const [bankName, setBankName] = useState('Al Rajhi Bank');
  const [iban, setIban] = useState('SA0380000000608010101001');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.position} ${emp.nationalId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddEmployee({
      firstName,
      lastName,
      nationalId,
      email,
      phone,
      department,
      position,
      basicSalary: Number(basicSalary),
      housingAllowance: Number(housingAllowance),
      transportAllowance: Number(transportAllowance),
      bankName,
      iban,
      customAllowances: [],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true
    });

    setShowAddModal(false);
    // Reset fields
    setFirstName('');
    setLastName('');
    setEmail('');
    setNationalId('1010123456');
  };

  return (
    <div id="employee-management-tab" className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Employee Master Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage employee compensation packages, bank details, and department allocations.</p>
        </div>
        <button
          id="btn-open-add-employee-modal"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-employees"
            type="text"
            placeholder="Search by name, employee code, position..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <select
          id="select-filter-department"
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
        >
          <option value="all">All Departments ({employees.length})</option>
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Employee ID & Name</th>
                <th className="px-4 py-2.5">Department & Position</th>
                <th className="px-4 py-2.5">Basic Salary</th>
                <th className="px-4 py-2.5">Allowances</th>
                <th className="px-4 py-2.5">GOSI Status</th>
                <th className="px-4 py-2.5">Bank IBAN</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEmployees.map(emp => {
                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{emp.employeeCode}</span>
                        <span>•</span>
                        <span>{emp.email}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                        <span className="text-slate-400">ID:</span>
                        <span className="text-slate-700 bg-slate-100 px-1 py-0.2 rounded">{emp.nationalId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-800 font-medium">{emp.position}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                      {formatCurrency(emp.basicSalary, config.currencySymbol)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      <div>H: {formatCurrency(emp.housingAllowance, config.currencySymbol)}</div>
                      <div className="text-slate-400 text-[10px]">T: {formatCurrency(emp.transportAllowance, config.currencySymbol)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        emp.socialSecurityEnrolled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.socialSecurityEnrolled ? 'GOSI Enrolled' : 'No GOSI'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">
                      <div>{emp.bankName}</div>
                      <div className="text-slate-500 flex items-center gap-1 text-[10px]">
                        <Lock className="w-2.5 h-2.5 text-blue-600 inline" />
                        <span>{emp.iban}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        id={`btn-delete-emp-${emp.id}`}
                        onClick={() => onDeleteEmployee(emp.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 text-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Add New Employee Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">National ID / Iqama *</label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Encrypted
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                    placeholder="1010123456"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Position / Job Title</label>
                  <input
                    type="text"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Bank Name</label>
                  </div>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Salary Components */}
              <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800">Compensation Package ({config.currencySymbol})</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Basic Salary</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={basicSalary}
                      onChange={e => setBasicSalary(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Housing Allowance</label>
                    <input
                      type="number"
                      min="0"
                      value={housingAllowance}
                      onChange={e => setHousingAllowance(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Transport Allowance</label>
                    <input
                      type="number"
                      min="0"
                      value={transportAllowance}
                      onChange={e => setTransportAllowance(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">IBAN Number *</label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> AES-256
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
