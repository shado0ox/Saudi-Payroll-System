import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { AccountingJournalEntry } from '../types';
import {
  BookOpen,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Search,
  Filter,
  FileText,
  Send,
  Terminal,
  X,
  ExternalLink,
  ShieldAlert,
  Bell
} from 'lucide-react';

interface SearchFormValues {
  searchQuery: string;
  statusFilter: 'all' | 'pending' | 'sent' | 'confirmed' | 'failed';
}

export const JournalEntriesTab: React.FC = () => {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEntry, setSelectedEntry] = useState<AccountingJournalEntry | null>(null);
  const [showCronModal, setShowCronModal] = useState<boolean>(false);
  const [cronLogs, setCronLogs] = useState<string[]>([]);
  const [cronSummary, setCronSummary] = useState<string | null>(null);

  // React Hook Form for filter/search
  const { register, watch, reset } = useForm<SearchFormValues>({
    defaultValues: {
      searchQuery: '',
      statusFilter: 'all'
    }
  });

  const searchQuery = watch('searchQuery');
  const statusFilter = watch('statusFilter');

  // React Query: Fetch Journal Entries
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['journalEntries', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await authFetch(`/api/payroll/journals?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch journal entries from accounting API');
      }
      return res.json() as Promise<{
        success: boolean;
        stats: {
          total: number;
          pending: number;
          sent: number;
          confirmed: number;
          failed: number;
          maxRetryExceededAlerts: number;
        };
        data: AccountingJournalEntry[];
      }>;
    }
  });

  // React Query Mutation: Manual Single Entry Retry
  const retryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await authFetch(`/api/payroll/journals/${entryId}/retry`, {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Retry failed');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      if (selectedEntry && selectedEntry.id === data.data?.id) {
        setSelectedEntry(data.data);
      }
    }
  });

  // React Query Mutation: Trigger Hourly Cron Job
  const cronMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/payroll/journals/trigger-cron', {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Cron job execution failed');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setCronLogs(data.data?.logs || []);
      setCronSummary(data.message || 'Cron job completed successfully');
      setShowCronModal(true);
    }
  });

  const entries = data?.data || [];
  const stats = data?.stats || { total: 0, pending: 0, sent: 0, confirmed: 0, failed: 0, maxRetryExceededAlerts: 0 };

  const getStatusBadge = (status: AccountingJournalEntry['status'], retryCount: number) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            مؤكد ومرحل (Confirmed)
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3.5 h-3.5" />
            تم الإرسال (Sent)
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            قيد الانتظار (Pending)
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            فاشل ({retryCount}/5 محاولات)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">سجل قيود المحاسبة والترحيل (Accounting Journal Ledger)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة وإعادة محاولة ترحيل قيود مسير الرواتب المزدوجة إلى نظام ERP بضغطة زر وتوليد التنبيهات الآلية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cronMutation.mutate()}
            disabled={cronMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {cronMutation.isPending ? (
              <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            )}
            <span>تشغيل Cron Job الدوري الآن</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banner for entries exceeding max retries (>=5) */}
      {stats.maxRetryExceededAlerts > 0 && (
        <div className="bg-rose-50 border-r-4 border-rose-600 p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <span>تنبيه عاجل: تجاوز عدد محاولات إعادة الإرسال الحد الأقصى (Max Retries ≥ 5)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                  {stats.maxRetryExceededAlerts} قيود
                </span>
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                تم تجاوز 5 محاولات فاشلة لإرسال بعض القيود المحاسبية. تم إرسال إشعارات فورية إلى الفريق المالي عبر Slack برمز قناة <code className="bg-rose-100 text-rose-800 px-1 rounded">#accounting-alerts</code> والبريد الإلكتروني. يمكنك إعادة المحاولة يدوياً.
              </p>
            </div>
          </div>
          <button
            onClick={() => reset({ searchQuery: '', statusFilter: 'failed' })}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900 whitespace-nowrap cursor-pointer"
          >
            عرض القيود الفاشلة
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">إجمالي القيود (Total)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium">قيد الانتظار (Pending)</span>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pending}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-xs text-blue-700 font-medium">تم الإرسال (Sent)</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.sent}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium">مؤكد ومرحل (Confirmed)</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.confirmed}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium">فاشل (Failed)</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-rose-900">{stats.failed}</p>
            {stats.maxRetryExceededAlerts > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                <Bell className="w-2.5 h-2.5" /> {stats.maxRetryExceededAlerts} alerts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم القيد أو المسير..."
            {...register('searchQuery')}
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium shrink-0">الحالة:</span>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'pending', label: 'قيد الانتظار' },
              { id: 'sent', label: 'تم الإرسال' },
              { id: 'confirmed', label: 'مؤكد' },
              { id: 'failed', label: 'فاشل' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => reset({ searchQuery, statusFilter: f.id as any })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            جاري تحميل سجلات القيود المحاسبية...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold">
            حدث خطأ أثناء جلب القيود المحاسبية. يرجى إعادة المحاولة.
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            لا توجد قيود محاسبية تطابق محددات البحث الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">رقم المرجع (Ref)</th>
                  <th className="p-3">رمز المسير</th>
                  <th className="p-3">الفترة</th>
                  <th className="p-3">إجمالي المدين / الدائن</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">المحاولات</th>
                  <th className="p-3">آخر خطأ</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {entries.map(entry => {
                  const isRetrying = retryMutation.isPending && retryMutation.variables === entry.id;
                  const isMaxRetryExceeded = entry.retryCount >= entry.maxRetries;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{entry.reference}</td>
                      <td className="p-3 font-mono text-slate-600">{entry.runCode}</td>
                      <td className="p-3 text-slate-600">{entry.period}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {entry.totalDebit.toLocaleString()} SAR
                      </td>
                      <td className="p-3">{getStatusBadge(entry.status, entry.retryCount)}</td>
                      <td className="p-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isMaxRetryExceeded
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : entry.retryCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.retryCount} / {entry.maxRetries || 5}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-500 text-[11px]" title={entry.lastError}>
                        {entry.lastError ? (
                          <span className="text-rose-600 font-mono truncate block">
                            {entry.lastError}
                          </span>
                        ) : entry.transactionId ? (
                          <span className="text-emerald-600 font-mono">Tx: {entry.transactionId}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {(entry.status === 'failed' || entry.status === 'pending') && (
                            <button
                              onClick={() => retryMutation.mutate(entry.id)}
                              disabled={isRetrying}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                isMaxRetryExceeded
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              } disabled:opacity-50`}
                              title="إعادة إرسال القيد المحاسبي يدوياً إلى ERP API"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                              <span>{isRetrying ? 'جاري...' : 'إعادة إرسال'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedEntry(entry)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>التفاصيل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>تفاصيل القيد المحاسبي: {selectedEntry.reference}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">رمز المسير: {selectedEntry.runCode} | الفترة: {selectedEntry.period}</p>
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Retry Meta */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">الحالة الحالية:</span>
                <div className="mt-1">{getStatusBadge(selectedEntry.status, selectedEntry.retryCount)}</div>
              </div>
              <div>
                <span className="text-slate-500">المحاولات المنفذة:</span>
                <p className="font-mono font-bold text-slate-800 mt-1">{selectedEntry.retryCount} من أصل {selectedEntry.maxRetries || 5}</p>
              </div>
              <div>
                <span className="text-slate-500">تاريخ الإنشاء:</span>
                <p className="font-mono text-slate-700 mt-1">{new Date(selectedEntry.createdAt).toLocaleString('ar-SA')}</p>
              </div>
              <div>
                <span className="text-slate-500">رقم المعاملة (Tx ID):</span>
                <p className="font-mono font-bold text-slate-800 mt-1">{selectedEntry.transactionId || 'غير متوفر'}</p>
              </div>
            </div>

            {/* Last Error trace if present */}
            {selectedEntry.lastError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-900 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> آخر سجل خطأ (API Error):
                </span>
                <p className="font-mono text-rose-800 bg-white p-2 rounded border border-rose-200 text-[11px] overflow-x-auto">
                  {selectedEntry.lastError}
                </p>
              </div>
            )}

            {/* Double Entry Lines Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">بنود القيد المحاسبي المزدوج (Double-Entry Ledger Lines):</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">رقم الحساب</th>
                      <th className="p-2.5">اسم الحساب</th>
                      <th className="p-2.5">النوع</th>
                      <th className="p-2.5">المبلغ (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEntry.journalData?.lines?.map((line, idx) => (
                      <tr key={idx} className={line.type === 'debit' ? 'bg-blue-50/30' : 'bg-emerald-50/30'}>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{line.accountCode}</td>
                        <td className="p-2.5 text-slate-700">{line.accountName}</td>
                        <td className="p-2.5 font-bold">
                          {line.type === 'debit' ? (
                            <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded">مدين (Debit)</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">دائن (Credit)</span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold font-mono text-slate-900">
                          {line.amount.toLocaleString()} SAR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              {(selectedEntry.status === 'failed' || selectedEntry.status === 'pending') && (
                <button
                  onClick={() => retryMutation.mutate(selectedEntry.id)}
                  disabled={retryMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RotateCw className={`w-4 h-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>إعادة المحاولة الآن</span>
                </button>
              )}
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cron Job Execution Logs Modal */}
      {showCronModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">سجل تنفيذ Cron Job الدوري (Hourly Retry Console)</h2>
              </div>
              <button
                onClick={() => setShowCronModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cronSummary && (
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs font-semibold text-emerald-400">
                {cronSummary}
              </div>
            )}

            <div className="bg-black/90 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-80 overflow-y-auto dir-ltr">
              {cronLogs.map((log, i) => (
                <div key={i} className={log.includes('CRITICAL') ? 'text-rose-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCronModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
