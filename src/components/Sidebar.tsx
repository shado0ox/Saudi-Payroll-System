import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  Clock,
  Download,
  FolderTree,
  Terminal,
  Settings,
  ShieldCheck,
  BookOpen,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type TabType = 
  | 'overview' 
  | 'employees' 
  | 'payroll' 
  | 'payslips' 
  | 'attendance' 
  | 'journal'
  | 'companies'
  | 'reports' 
  | 'auth'
  | 'architecture' 
  | 'worker' 
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  employeeCount: number;
  payrollRunStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  employeeCount,
  payrollRunStatus
}) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'overview' as TabType, label: t('overview'), icon: LayoutDashboard },
    { id: 'companies' as TabType, label: t('companies'), icon: Building2 },
    { id: 'employees' as TabType, label: t('employees'), icon: Users, badge: employeeCount },
    { id: 'payroll' as TabType, label: t('payroll'), icon: Calculator, statusDot: payrollRunStatus },
    { id: 'journal' as TabType, label: t('journal'), icon: BookOpen },
    { id: 'payslips' as TabType, label: t('payslips'), icon: FileText },
    { id: 'attendance' as TabType, label: t('attendance'), icon: Clock },
    { id: 'reports' as TabType, label: t('reports'), icon: Download },
    { id: 'auth' as TabType, label: t('auth'), icon: ShieldCheck },
    { id: 'architecture' as TabType, label: t('architecture'), icon: FolderTree },
    { id: 'worker' as TabType, label: t('worker'), icon: Terminal },
    { id: 'settings' as TabType, label: t('settings'), icon: Settings }
  ];

  return (
    <aside id="sidebar-navigation" className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 min-h-[calc(100vh-56px)]">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-xs">
          P
        </div>
        <span className="font-bold text-white tracking-tight">PAYROLL-CORE</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 text-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          {t('systemModules', 'الوحدات والأقسام')}
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}

              {item.statusDot && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          );
        })}

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">
          Security Tiers
        </div>
        <div className="flex items-center gap-2 px-3 py-1 text-slate-400 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Admin / HR Manager
        </div>
        <div className="flex items-center gap-2 px-3 py-1 text-slate-400 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Accountant / Viewer
        </div>
      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/80 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
        >
          <span>Swagger API Docs</span>
          <span className="text-[10px] font-mono bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-200">/api/docs</span>
        </a>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>AUTH_ENGINE</span>
          <span className="text-cyan-400 font-bold">JWT + bcrypt</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>SERVICE</span>
          <span className="text-blue-400 font-bold">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
