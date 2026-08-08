import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Pencil,
  KeyRound,
  Power,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';

type ManagedUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt?: string;
};

type RoleRecord = {
  id: string;
  name: UserRole;
  displayName: string;
  description?: string;
};

type UserForm = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

const emptyForm: UserForm = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'viewer'
};

export const AuthTab: React.FC = () => {
  const { user, authFetch } = useAuth();

  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [rolesList, setRolesList] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);

  const [form, setForm] = useState<UserForm>(emptyForm);
  const [newPassword, setNewPassword] = useState('');

  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    clearAlerts();

    try {
      const res = await authFetch('/api/auth/users');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر تحميل المستخدمين.');
      }

      setUsersList(data.data.users || []);
      setRolesList(data.data.roles || []);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل المستخدمين.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsersAndRoles();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const openCreate = () => {
    clearAlerts();
    setEditingUser(null);
    setPasswordUser(null);
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openEdit = (target: ManagedUser) => {
    clearAlerts();
    setShowCreate(false);
    setPasswordUser(null);
    setEditingUser(target);
    setForm({
      username: target.username,
      email: target.email,
      password: '',
      firstName: target.firstName,
      lastName: target.lastName,
      role: target.role
    });
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setError('جميع الحقول مطلوبة.');
      return;
    }

    if (form.password.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف.');
      return;
    }

    setSaving(true);

    try {
      const res = await authFetch('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر إنشاء المستخدم.');
      }

      setMessage('تم إنشاء المستخدم بنجاح.');
      closeForm();
      await fetchUsersAndRoles();
      setMessage('تم إنشاء المستخدم بنجاح.');
    } catch (err: any) {
      setError(err.message || 'تعذر إنشاء المستخدم.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    clearAlerts();
    setSaving(true);

    try {
      const res = await authFetch(`/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر تعديل المستخدم.');
      }

      closeForm();
      await fetchUsersAndRoles();
      setMessage('تم تحديث بيانات المستخدم.');
    } catch (err: any) {
      setError(err.message || 'تعذر تعديل المستخدم.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordUser) return;

    clearAlerts();

    if (newPassword.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف.');
      return;
    }

    setSaving(true);

    try {
      const res = await authFetch(
        `/api/auth/users/${passwordUser.id}/password`,
        {
          method: 'PUT',
          body: JSON.stringify({ password: newPassword })
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر تغيير كلمة المرور.');
      }

      setPasswordUser(null);
      setNewPassword('');
      setMessage('تم تغيير كلمة المرور وإلغاء جلسات المستخدم السابقة.');
    } catch (err: any) {
      setError(err.message || 'تعذر تغيير كلمة المرور.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (target: ManagedUser) => {
    clearAlerts();

    const nextStatus = target.status === 'active' ? 'suspended' : 'active';

    if (target.id === user?.id && nextStatus === 'suspended') {
      setError('لا يمكنك إيقاف حسابك الحالي.');
      return;
    }

    setSaving(true);

    try {
      const res = await authFetch(`/api/auth/users/${target.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر تغيير حالة المستخدم.');
      }

      await fetchUsersAndRoles();
      setMessage(
        nextStatus === 'active'
          ? 'تم تفعيل المستخدم.'
          : 'تم إيقاف المستخدم.'
      );
    } catch (err: any) {
      setError(err.message || 'تعذر تغيير حالة المستخدم.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: ManagedUser) => {
    clearAlerts();

    if (target.id === user?.id) {
      setError('لا يمكنك حذف حسابك الحالي.');
      return;
    }

    const confirmed = window.confirm(
      `هل تريد حذف المستخدم "${target.username}" نهائيًا؟`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const res = await authFetch(`/api/auth/users/${target.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'تعذر حذف المستخدم.');
      }

      await fetchUsersAndRoles();
      setMessage('تم حذف المستخدم.');
    } catch (err: any) {
      setError(err.message || 'تعذر حذف المستخدم.');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div
        className="bg-white border border-slate-200 rounded-xl p-8 text-center"
        dir="rtl"
      >
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">
          إدارة المستخدمين
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          هذه الصفحة متاحة لمدير النظام فقط.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                إدارة المستخدمين والصلاحيات
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              الحسابات المعروضة مرتبطة مباشرة بقاعدة بيانات PostgreSQL.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchUsersAndRoles}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              مستخدم جديد
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {(showCreate || editingUser) && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">
              {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h3>

            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 rounded hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={editingUser ? handleUpdate : handleCreate}
            className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="الاسم الأول">
              <input
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="input"
                required
              />
            </Field>

            <Field label="اسم العائلة">
              <input
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="input"
                required
              />
            </Field>

            <Field label="اسم المستخدم">
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="input"
                required
              />
            </Field>

            <Field label="البريد الإلكتروني">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input"
                required
              />
            </Field>

            {!editingUser && (
              <Field label="كلمة المرور">
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input"
                  minLength={8}
                  required
                />
              </Field>
            )}

            <Field label="الصلاحية">
              <select
                value={form.role}
                onChange={e =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
                className="input"
              >
                {rolesList.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving
                  ? 'جاري الحفظ...'
                  : editingUser
                    ? 'حفظ التعديلات'
                    : 'إنشاء المستخدم'}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordUser && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800">
                تغيير كلمة المرور
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                المستخدم: {passwordUser.username}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPasswordUser(null);
                setNewPassword('');
              }}
              className="p-1.5 rounded hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="p-5 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              minLength={8}
              className="input flex-1"
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              حفظ كلمة المرور
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">المستخدمون</h3>
            <p className="text-xs text-slate-500 mt-1">
              إجمالي الحسابات: {usersList.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            جاري تحميل المستخدمين...
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            لا يوجد مستخدمون.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-600">
                  <th className="text-right px-4 py-3">المستخدم</th>
                  <th className="text-right px-4 py-3">اسم الدخول</th>
                  <th className="text-right px-4 py-3">الصلاحية</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-left px-4 py-3">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {usersList.map(target => {
                  const isSelf = target.id === user?.id;

                  return (
                    <tr key={target.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {target.firstName} {target.lastName}
                          {isSelf && (
                            <span className="mr-2 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                              حسابك
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {target.email}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        @{target.username}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {rolesList.find(r => r.name === target.role)?.displayName ||
                            target.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {target.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                            <Power className="w-3.5 h-3.5" />
                            موقوف
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            title="تعديل"
                            onClick={() => openEdit(target)}
                          >
                            <Pencil className="w-4 h-4" />
                          </ActionButton>

                          <ActionButton
                            title="تغيير كلمة المرور"
                            onClick={() => {
                              clearAlerts();
                              setEditingUser(null);
                              setShowCreate(false);
                              setPasswordUser(target);
                              setNewPassword('');
                            }}
                          >
                            <KeyRound className="w-4 h-4" />
                          </ActionButton>

                          <ActionButton
                            title={
                              target.status === 'active'
                                ? 'إيقاف المستخدم'
                                : 'تفعيل المستخدم'
                            }
                            disabled={isSelf && target.status === 'active'}
                            onClick={() => handleToggleStatus(target)}
                          >
                            <Power className="w-4 h-4" />
                          </ActionButton>

                          <ActionButton
                            title="حذف المستخدم"
                            danger
                            disabled={isSelf}
                            onClick={() => handleDelete(target)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ActionButton>
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
    </div>
  );
};

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label}
    </span>
    {children}
  </label>
);

const ActionButton: React.FC<{
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}> = ({
  title,
  onClick,
  children,
  disabled = false,
  danger = false
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg border transition disabled:opacity-30 disabled:cursor-not-allowed ${
      danger
        ? 'border-red-200 text-red-600 hover:bg-red-50'
        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);