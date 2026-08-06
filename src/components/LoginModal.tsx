import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, User, Lock, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = async (usr: string, pass: string) => {
    setError(null);
    setLoading(true);
    const res = await login(usr, pass);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Quick login failed');
    }
  };

  const demoAccounts: { role: UserRole; title: string; user: string; pass: string; badge: string; desc: string; bg: string }[] = [
    {
      role: 'admin',
      title: 'System Administrator',
      user: 'admin',
      pass: 'AdminPassword123!',
      badge: 'Full Access (*)',
      desc: 'Can access and modify all employees, payroll, settings, and migrations.',
      bg: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900'
    },
    {
      role: 'hr_manager',
      title: 'HR Manager',
      user: 'hr_manager',
      pass: 'HrPassword123!',
      badge: 'Employees & Attendance',
      desc: 'Can add/edit employees and manage attendance. Read-only payroll.',
      bg: 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900'
    },
    {
      role: 'accountant',
      title: 'Finance Accountant',
      user: 'accountant',
      pass: 'AccountantPassword123!',
      badge: 'Payroll & WPS Exports',
      desc: 'Can calculate & approve payroll runs, generate WPS bank files.',
      bg: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900'
    },
    {
      role: 'viewer',
      title: 'Auditor / Viewer',
      user: 'viewer',
      pass: 'ViewerPassword123!',
      badge: 'Read-Only Access',
      desc: 'Can view directories and reports. All POST/PUT/DELETE actions blocked.',
      bg: 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">JWT System Authentication</h3>
              <p className="text-xs text-slate-400">Sign in or switch role-based access tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
              <div>
                <span className="font-bold">Active User:</span> {user.firstName} {user.lastName} (@{user.username})
              </div>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px]">
                {user.role}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin or admin@apexpayroll.com"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating with bcrypt & JWT...' : 'Sign In with JWT'}
            </button>
          </form>

          {/* Quick Persona Demo Switcher */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quick Demo Role Switcher (One-Click JWT Auth)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.user, acc.pass)}
                  disabled={loading}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${acc.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{acc.title}</span>
                    <span className="text-[10px] font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1 leading-tight">{acc.desc}</p>
                  <div className="mt-2 text-[10px] font-mono opacity-70">
                    user: <span className="font-bold">{acc.user}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
