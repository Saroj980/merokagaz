'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { refreshUser, user } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token && email) {
      setLoading(true);
      api.auth.verifyEmail({ token, email })
        .then(() => {
          setSuccess(true);
          refreshUser();
        })
        .catch((err) => {
          setError(err.message || (isNe ? 'प्रमाणीकरण टोकन अमान्य वा म्याद सकिएको छ।' : 'Invalid or expired verification token.'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, email, refreshUser, isNe]);

  const handleResend = async () => {
    const targetEmail = email || user?.email;
    if (!targetEmail) return;

    setResending(true);
    setResendMessage(null);
    try {
      await api.auth.resendVerification({ email: targetEmail });
      setResendMessage(isNe ? 'नयाँ प्रमाणीकरण लिंक तपाईंको इमेलमा पठाइएको छ।' : 'A fresh verification link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || (isNe ? 'पुनः पठाउन असफल भयो।' : 'Failed to resend verification.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <RefreshCw className="h-10 w-10 text-[#18A999] animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-[#123B5D]">
              {isNe ? 'इमेल प्रमाणीकरण हुँदैछ...' : 'Verifying your email address...'}
            </h2>
            <p className="text-xs text-slate-500">
              {isNe ? 'कृपया केही सेकेन्ड प्रतीक्षा गर्नुहोस्' : 'Please wait while we verify your account'}
            </p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#123B5D]">
              {isNe ? 'इमेल सफलतापूर्वक प्रमाणित भयो!' : 'Email Verified Successfully!'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isNe
                ? 'तपाईंको खाता अब पूर्ण रूपमा सक्रिय र प्रमाणित भएको छ। अब तपाईं आधिकारिक कागजातहरू सिर्जना तथा सुरक्षित डाउनलोड गर्न सक्नुहुन्छ।'
                : 'Your email has been verified. You now have full access to generate, view, and securely download official documents.'}
            </p>
            <div className="pt-4">
              <Link
                href="/user/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
              >
                <span>{isNe ? 'मेरो ड्यासबोर्डमा जानुहोस्' : 'Go to My Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#123B5D]">
              {isNe ? 'इमेल प्रमाणीकरण' : 'Verify Email Address'}
            </h2>
            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 text-left">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                {isNe
                  ? 'तपाईंको खाताको सुरक्षाका लागि कृपया दर्ता गरिएको इमेल ठेगाना प्रमाणित गर्नुहोस्।'
                  : 'Please verify your email address to unlock official document downloads and account security.'}
              </p>
            )}

            {resendMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 text-left">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resendMessage}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#123B5D] text-xs font-bold text-white shadow-sm hover:bg-[#0E2E4A] disabled:opacity-50 transition-all cursor-pointer"
              >
                {resending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                <span>{isNe ? 'प्रमाणीकरण इमेल पुनः पठाउनुहोस्' : 'Resend Verification Email'}</span>
              </button>
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {isNe ? 'लगइन पृष्ठमा फर्कनुहोस्' : 'Back to Login'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
