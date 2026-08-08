import React, { useState } from 'react';
import { Terminal, Shield, LogOut, KeyRound, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoginModal } from './LoginModal';

interface NavbarProps {
  companyName: string;
  activePeriod: string;
  apiStatus: 'online' | 'offline' | 'loading';
  onRunWorker: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyName,
  activePeriod,
  apiStatus,
  onRunWorker
}) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hr_manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <header id="app-header" className="h-14 bg-white border-b border-slate-200 text-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 tracking-tight text-sm uppercase">{companyName}</h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                Cycle: {activePeriod}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Express Backend Engine</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">v1.0.0</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle Button */}
          <button
            id="btn-language-toggle"
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            className="px-2.5 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{language === 'ar' ? 'English 🇬🇧' : 'العربية 🇸🇦'}</span>
          </button>

          {/* API Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-slate-700 font-medium text-[11px]">
              {apiStatus === 'online' ? t('apiConnected') : t('apiConnecting')}
            </span>
          </div>

          {/* Quick Worker Trigger Button */}
          <button
            id="btn-trigger-worker-header"
            onClick={onRunWorker}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-200 shadow-xs flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">{t('runPayrollWorker')}</span>
          </button>

          {/* User Auth Profile Badge & Switcher */}
          <div className="pl-2 border-l border-slate-200 flex items-center gap-2 text-xs">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-slate-900 leading-tight">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-switch-user"
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Switch Role / JWT Sign In"
                  className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Switch Role</span>
                </button>

                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>JWT Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
