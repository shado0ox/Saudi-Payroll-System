import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onClose
}) => {

  const { login } = useAuth();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit =
    async (e: React.FormEvent) => {

      e.preventDefault();

      if (!username.trim() || !password) {
        setError(
          'يرجى إدخال اسم المستخدم وكلمة المرور.'
        );
        return;
      }

      setError(null);
      setLoading(true);

      try {

        const result =
          await login(
            username.trim(),
            password
          );

        if (!result.success) {

          setError(
            result.error ||
            'اسم المستخدم أو كلمة المرور غير صحيحة.'
          );

          return;
        }

        if (onClose) {
          onClose();
        }

      } catch {

        setError(
          'تعذر الاتصال بالخادم.'
        );

      } finally {

        setLoading(false);
      }
    };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-slate-950
        p-4
      "
      dir="rtl"
    >

      <div
        className="
          w-full max-w-md
          bg-white
          rounded-2xl
          shadow-2xl
          overflow-hidden
        "
      >

        <div
          className="
            bg-slate-900
            text-white
            px-8 py-7
            text-center
          "
        >

          <div
            className="
              w-14 h-14
              mx-auto mb-4
              rounded-xl
              bg-white/10
              flex items-center justify-center
            "
          >
            <ShieldCheck
              className="w-8 h-8"
            />
          </div>

          <h1
            className="
              text-xl
              font-bold
            "
          >
            نظام إدارة الرواتب
          </h1>

          <p
            className="
              text-slate-300
              text-sm
              mt-2
            "
          >
            HMA COMPANY
          </p>

        </div>


        <div className="p-8">

          {error && (
            <div
              className="
                mb-5
                p-3
                bg-red-50
                border border-red-200
                rounded-lg
                flex items-center
                gap-2
                text-sm
                text-red-700
              "
            >
              <AlertCircle
                className="
                  w-4 h-4
                  shrink-0
                "
              />

              <span>
                {error}
              </span>
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                "
              >
                اسم المستخدم أو البريد الإلكتروني
              </label>

              <div className="relative">

                <User
                  className="
                    absolute
                    right-3
                    top-3
                    w-5 h-5
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={username}
                  onChange={
                    e =>
                      setUsername(
                        e.target.value
                      )
                  }
                  autoComplete="username"
                  autoFocus
                  placeholder="اسم المستخدم"
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-lg
                    pr-11 pl-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>

            </div>


            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                "
              >
                كلمة المرور
              </label>

              <div className="relative">

                <Lock
                  className="
                    absolute
                    right-3
                    top-3
                    w-5 h-5
                    text-slate-400
                  "
                />

                <input
                  type="password"
                  value={password}
                  onChange={
                    e =>
                      setPassword(
                        e.target.value
                      )
                  }
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-lg
                    pr-11 pl-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>

            </div>


            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-blue-600
                hover:bg-blue-700
                disabled:bg-slate-400
                text-white
                font-bold
                py-3
                rounded-lg
                transition
              "
            >
              {loading
                ? 'جاري التحقق...'
                : 'تسجيل الدخول'}
            </button>

          </form>


          <div
            className="
              mt-6
              pt-5
              border-t
              border-slate-200
              text-center
              text-xs
              text-slate-400
            "
          >
            الدخول متاح للمستخدمين المسجلين فقط
          </div>

        </div>

      </div>

    </div>
  );
};