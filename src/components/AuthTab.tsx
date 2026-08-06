import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, RefreshCw, UserCheck, Lock, CheckCircle2, XCircle, AlertTriangle, Terminal, Code2, Users } from 'lucide-react';
import { UserRole } from '../types';

export const AuthTab: React.FC = () => {
  const { user, accessToken, refreshToken, refreshAuthToken, authFetch } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState<{ method: string; url: string; label: string }>({
    method: 'GET',
    url: '/api/employees',
    label: 'Get Employee Directory'
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Decode JWT Payload locally for inspection
  const getDecodedPayload = (token: string | null) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const decoded = getDecodedPayload(accessToken);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data.users);
        setRolesList(data.data.roles);
      }
    } catch (err) {
      console.error('Failed to load users list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshAuthToken();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleTestApi = async (method: string, url: string, payload?: any) => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await authFetch(url, {
        method,
        body: payload ? JSON.stringify(payload) : undefined
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        ok: false,
        data: { error: err.message }
      });
    } finally {
      setTestLoading(false);
    }
  };

  const rbacMatrix = [
    { module: 'Employee Directory (Read)', path: 'GET /api/employees', admin: true, hr: true, acc: true, viewer: true },
    { module: 'Employee Management (Write/Delete)', path: 'POST/DELETE /api/employees', admin: true, hr: true, acc: false, viewer: false },
    { module: 'Attendance & Overtime Ledger', path: 'POST /api/attendance', admin: true, hr: true, acc: false, viewer: false },
    { module: 'Payroll Calculation & Approval', path: 'POST /api/payroll/runs/*', admin: true, hr: false, acc: true, viewer: false },
    { module: 'WPS Bank File & CSV Export', path: 'GET /api/reports/wps/*', admin: true, hr: false, acc: true, viewer: false },
    { module: 'System Tax & GOSI Settings', path: 'PUT /api/settings', admin: true, hr: false, acc: false, viewer: false },
    { module: 'Worker & DB Migration Script', path: 'POST /api/system/migrate/run', admin: true, hr: false, acc: false, viewer: false }
  ];

  return (
    <div id="jwt-auth-tab" className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">JWT Authentication & Role-Based Access Control (RBAC)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Full authentication engine with bcrypt password hashing, JWT Access Tokens, Refresh Tokens, and 4 role authorization tiers.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Access Token</span>
        </button>
      </div>

      {/* Active User Token Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Token Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active JWT Access Token</h3>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
              VALID SESSION
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 block">Logged User:</span>
              <span className="text-slate-900 font-bold text-sm">
                {user?.firstName} {user?.lastName} (@{user?.username})
              </span>
              <span className="ml-2 text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
                {user?.role}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 block">Bearer Access Token (Header):</span>
              <div className="bg-slate-900 text-green-400 p-2.5 rounded text-[10px] font-mono break-all max-h-20 overflow-y-auto">
                {accessToken || 'No token active'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 block">Refresh Token:</span>
              <div className="bg-slate-900 text-yellow-400 p-2.5 rounded text-[10px] font-mono break-all max-h-20 overflow-y-auto">
                {refreshToken || 'No refresh token active'}
              </div>
            </div>
          </div>
        </div>

        {/* Decoded JWT Payload Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Decoded Token Claims Payload</h3>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded">
              HS256 ALGORITHM
            </span>
          </div>

          <div className="bg-slate-900 p-3 rounded text-green-400 font-mono text-xs overflow-x-auto max-h-60">
            <pre>{JSON.stringify(decoded, null, 2)}</pre>
          </div>
          <p className="text-[11px] text-slate-500">
            Decoded directly from client JWT without server roundtrip. Verified server-side via secret key in <code className="text-blue-600 font-mono font-semibold">jwtHelper.ts</code>.
          </p>
        </div>
      </div>

      {/* Users Database Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              System Database Users & Password Hash Ledger (<code className="text-blue-600 font-mono">users</code> table in schema.sql)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">{usersList.length} Accounts Seeded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Username / Email</th>
                <th className="py-2.5 px-4">Role Tier</th>
                <th className="py-2.5 px-4">Password Hash</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
              {usersList.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-sans font-bold text-slate-900">
                    {u.firstName} {u.lastName}
                    <div className="text-[10px] text-slate-400 font-mono font-normal">{u.id}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-slate-800">@{u.username}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'hr_manager' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'accountant' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                    bcrypt ($2a$10$...) hashed
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Lock className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Role Authorization Permission Matrix (enforced by <code className="text-blue-600 font-mono">requireRole</code> middleware)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">System Endpoint / Action</th>
                <th className="py-2.5 px-4 font-mono text-[11px]">Route</th>
                <th className="py-2.5 px-4 text-center">Admin</th>
                <th className="py-2.5 px-4 text-center">HR Manager</th>
                <th className="py-2.5 px-4 text-center">Accountant</th>
                <th className="py-2.5 px-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{row.module}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-blue-700">{row.path}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.admin ? (
                      <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">ALLOWED</span>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">DENIED</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.hr ? (
                      <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">ALLOWED</span>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">DENIED</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.acc ? (
                      <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">ALLOWED</span>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">DENIED</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.viewer ? (
                      <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">ALLOWED</span>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">DENIED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Middleware Permission Tester */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Live Express API Role Enforcement Inspector
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Active Role: <strong className="text-blue-700 uppercase font-bold">{user?.role}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTestApi('GET', '/api/employees')}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <span className="text-emerald-600 font-bold mr-1">GET</span> /api/employees
          </button>

          <button
            onClick={() => handleTestApi('POST', '/api/employees', { firstName: 'Test', lastName: 'User', basicSalary: 10000 })}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <span className="text-blue-600 font-bold mr-1">POST</span> /api/employees (HR/Admin)
          </button>

          <button
            onClick={() => handleTestApi('POST', '/api/payroll/runs/calculate', { period: '2026-08', title: 'Test Run' })}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <span className="text-blue-600 font-bold mr-1">POST</span> /api/payroll/runs/calculate (Accountant/Admin)
          </button>

          <button
            onClick={() => handleTestApi('PUT', '/api/settings', { companyName: 'New Company' })}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <span className="text-amber-600 font-bold mr-1">PUT</span> /api/settings (Admin Only)
          </button>

          <button
            onClick={() => handleTestApi('POST', '/api/system/migrate/run')}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-semibold text-slate-800 cursor-pointer shadow-xs"
          >
            <span className="text-purple-600 font-bold mr-1">POST</span> /api/system/migrate/run (Admin Only)
          </button>
        </div>

        {testResult && (
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
              <span>RESPONSE STATUS:</span>
              <span className={testResult.ok ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {testResult.status} {testResult.statusText || (testResult.ok ? 'OK' : 'FORBIDDEN / ERROR')}
              </span>
            </div>
            <pre className={testResult.ok ? 'text-green-400 overflow-x-auto max-h-60 p-2' : 'text-red-400 overflow-x-auto max-h-60 p-2'}>
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
