'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(isNe ? 'पासवर्ड कम्तिमा ८ अक्षरको हुनुपर्छ।' : 'Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError(isNe ? 'पासवर्ड र कन्फर्म पासवर्ड मिलेन।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPassword({ token, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || (isNe ? 'पासवर्ड रिसेट असफल भयो। लिंक म्याद सकिएको हुन सक्छ।' : 'Failed to reset password. Token may be expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#123B5D]">
            {isNe ? 'नयाँ पासवर्ड सेट गर्नुहोस्' : 'Set New Password'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isNe ? 'सुरक्षित तथा बलियो पासवर्ड छान्नुहोस्' : 'Choose a strong and secure password'}
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">
              {isNe ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो' : 'Password Reset Successful'}
            </h3>
            <p className="text-xs text-emerald-700">
              {isNe ? 'तपाईं अब नयाँ पासवर्ड प्रयोग गरेर लगइन गर्न सक्नुहुन्छ।' : 'You can now sign in using your new credentials.'}
            </p>
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-[#123B5D] text-xs font-bold text-white shadow-md hover:bg-[#0E2E4A]"
              >
                <span>{isNe ? 'लगइन गर्नुहोस्' : 'Proceed to Login'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'नयाँ पासवर्ड' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस्' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>{isNe ? 'अपडेट हुँदैछ...' : 'Updating password...'}</span>
              ) : (
                <>
                  <span>{isNe ? 'पासवर्ड परिवर्तन गर्नुहोस्' : 'Reset Password'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
