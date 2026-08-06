import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { useAuth } from '../context/AuthContext';
import { Building2, Save, Send, CheckCircle2, AlertTriangle, Plus, Landmark, FileSpreadsheet, Server, Sparkles } from 'lucide-react';

interface Props {
  onRefreshData?: () => void;
}

export const CompanyManagementTab: React.FC<Props> = ({ onRefreshData }) => {
  const { authFetch, companyId: activeCompanyId, setCompanyId, companiesList } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingApi, setTestingApi] = useState<boolean>(false);
  const [apiTestResult, setApiTestResult] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<Company>>({});

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/companies');
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
        const current = json.data.find((c: Company) => c.id === activeCompanyId) || json.data[0];
        if (current) {
          setSelectedCompany(current);
          setFormData(current);
        }
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [activeCompanyId]);

  const handleCompanySelect = (comp: Company) => {
    setSelectedCompany(comp);
    setFormData(comp);
    setApiTestResult(null);
    setMessage(null);
  };

  const handleSaveCompany = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'إعدادات الشركة تم حفظها بنجاح!' });
        await fetchCompanies();
        if (onRefreshData) onRefreshData();
      } else {
        setMessage({ type: 'error', text: json.error?.message || 'فشل حفظ الإعدادات' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestApi = async () => {
    if (!selectedCompany) return;
    setTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await authFetch(`/api/companies/${selectedCompany.id}/test-api`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        setApiTestResult(json.data);
      } else {
        setApiTestResult({ error: json.error?.message || 'فشل فحص الاتصال' });
      }
    } catch (err: any) {
      setApiTestResult({ error: err.message || 'خطأ في الربط' });
    } finally {
      setTestingApi(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const code = (form.elements.namedItem('code') as HTMLInputElement).value;
    const crNumber = (form.elements.namedItem('crNumber') as HTMLInputElement).value;

    try {
      const res = await authFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name, code, crNumber })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setMessage({ type: 'success', text: 'تم إنشاء الشركة الجديدة بنجاح!' });
        await fetchCompanies();
      } else {
        alert(json.error?.message || 'فشل إنشاء الشركة');
      }
    } catch (err) {
      alert('حدث خطأ أثناء إضافة الشركة');
    }
  };

  return (
    <div id="company-settings-management-tab" className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">إدارة إعدادات الشركات (Multi-Tenant Hub)</h1>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              تكوين دليل الحسابات الخاص بكل شركة، بيانات حماية الأجور (WPS)، ورابط API الخاص بالبرنامج المحاسبي.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-add-company"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شركة جديدة</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-xs font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Company Selector Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">الشركات المسجلة</h2>
            
            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">جاري التحميل...</div>
            ) : (
              <div className="space-y-2">
                {companies.map(comp => {
                  const isActiveTenant = comp.id === activeCompanyId;
                  const isSelected = comp.id === selectedCompany?.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => handleCompanySelect(comp)}
                      className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{comp.name}</span>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">{comp.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>س.ت: {comp.crNumber}</span>
                        {isActiveTenant ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">النشطة الآن</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanyId(comp.id);
                              handleCompanySelect(comp);
                            }}
                            className="text-blue-600 hover:underline font-semibold text-[10px]"
                          >
                            تفعيل التوكن
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings Form for Selected Company */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCompany && formData ? (
              <>
                {/* 1. Chart of Accounts Configuration */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">دليل الحسابات الخاص بالشركة (Chart of Accounts Mapping)</h3>
                      <p className="text-xs text-slate-500">تخصيص أرقام وأسماء الحسابات المستخدمة في قيد اليومية المحاسبي لهذه الشركة</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رمز حساب مصروف الأجور والبدلات</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.salariesAccountCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, salariesAccountCode: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اسم حساب مصروف الأجور</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.salariesAccountName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, salariesAccountName: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رمز حساب مساهمة التأمينات (صاحب العمل)</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.gosiExpenseAccountCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, gosiExpenseAccountCode: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اسم حساب مصروف التأمينات</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.gosiExpenseAccountName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, gosiExpenseAccountName: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رمز حساب ذمم الرواتب المستحقة (WPS)</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.payrollPayableAccountCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, payrollPayableAccountCode: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اسم حساب ذمم الرواتب الصافية</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.payrollPayableAccountName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, payrollPayableAccountName: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رمز حساب مستحقات التأمينات الاجتماعية</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.gosiPayableAccountCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, gosiPayableAccountCode: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اسم حساب مستحقات التأمينات</label>
                      <input
                        type="text"
                        value={formData.chartOfAccounts?.gosiPayableAccountName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chartOfAccounts: { ...formData.chartOfAccounts!, gosiPayableAccountName: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. WPS Configurations */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">بيانات وإعدادات حماية الأجور (WPS Configuration)</h3>
                      <p className="text-xs text-slate-500">بيانات المنشأة والحساب البنكي الدافع لملف مسير الرواتب الوزاري</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">معرّف المنشأة الدافع (Payer ID / Mol ID)</label>
                      <input
                        type="text"
                        value={formData.wpsConfig?.payerId || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          wpsConfig: { ...formData.wpsConfig!, payerId: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المنشأة كما في وزارة الموارد البشرية</label>
                      <input
                        type="text"
                        value={formData.wpsConfig?.establishmentName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          wpsConfig: { ...formData.wpsConfig!, establishmentName: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رمز بنك المنشأة (Payer Bank Code)</label>
                      <input
                        type="text"
                        value={formData.wpsConfig?.payerBankCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          wpsConfig: { ...formData.wpsConfig!, payerBankCode: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. NCBK, RIBL, SABB"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">آيبان حساب دفع الرواتب (Payer IBAN)</label>
                      <input
                        type="text"
                        value={formData.wpsConfig?.payerIban || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          wpsConfig: { ...formData.wpsConfig!, payerIban: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Accounting API Config & Integration */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">رابط وتوثيق API البرنامج المحاسبي (ERP API Integration)</h3>
                        <p className="text-xs text-slate-500">توجيه القيود التلقائي لبرنامج ERP الخاص بهذه الشركة</p>
                      </div>
                    </div>
                    <button
                      id="btn-test-accounting-api"
                      onClick={handleTestApi}
                      disabled={testingApi}
                      className="flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{testingApi ? 'جاري الفحص...' : 'فحص الاتصال والترحيل (Test API)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">رابط API لمزامن القيود (ERP Accounting Endpoint URL)</label>
                      <input
                        type="text"
                        value={formData.accountingApiConfig?.apiUrl || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          accountingApiConfig: { ...formData.accountingApiConfig!, apiUrl: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://erp.company.com/api/journal-entries"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">مفتاح التوثيق (API Secret Key / Bearer Token)</label>
                      <input
                        type="password"
                        value={formData.accountingApiConfig?.apiKey || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          accountingApiConfig: { ...formData.accountingApiConfig!, apiKey: e.target.value }
                        })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id="autoSync"
                        checked={formData.accountingApiConfig?.autoSyncOnApproval || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          accountingApiConfig: { ...formData.accountingApiConfig!, autoSyncOnApproval: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <label htmlFor="autoSync" className="text-xs font-semibold text-slate-800 cursor-pointer">
                        ترحيل قيد اليومية تلقائياً لبرنامج المحاسبة عند اعتماد مسير الرواتب
                      </label>
                    </div>
                  </div>

                  {apiTestResult && (
                    <div className="mt-4 p-4 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-emerald-400 font-bold">✓ نتيجة اختبار ربط API المحاسبي:</span>
                        <span className="text-slate-400 text-[10px]">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                        {JSON.stringify(apiTestResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Save Footer Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="btn-save-company-settings"
                    onClick={handleSaveCompany}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الشركة الحالية'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-xs">
                يرجى اختيار شركة من القائمة الجانبية لعرض وتعديل إعداداتها.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-right">
            <h3 className="font-bold text-slate-900 text-base">تسجيل شركة جديدة في النظام Multi-Tenant</h3>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الشركة بالعربي/الإنجليزي</label>
                <input
                  name="name"
                  required
                  placeholder="شركة الأفق العربية للتكنولوجيا"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">كود الشركة (Company Code)</label>
                <input
                  name="code"
                  required
                  placeholder="HORIZON"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم السجل التجاري (CR Number)</label>
                <input
                  name="crNumber"
                  placeholder="1010889900"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  حفظ وإنشاء الشركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
