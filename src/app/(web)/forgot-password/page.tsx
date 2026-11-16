'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.auth.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || (isNe ? 'अनुरोध असफल भयो।' : 'Request failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#123B5D]">
            {isNe ? 'पासवर्ड रिसेट गर्नुहोस्' : 'Reset your password'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isNe
              ? 'आफ्नो खाताको इमेल ठेगाना प्रविष्ट गर्नुहोस्, हामी रिसेट लिंक पठाउनेछौं।'
              : 'Enter your registered email address and we will send a password reset link.'}
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">
              {isNe ? 'रिसेट लिंक पठाइयो' : 'Reset link dispatched'}
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              {isNe
                ? `हामीले ${email} मा पासवर्ड रिसेट सम्बन्धी निर्देशनहरू पठाएका छौं। कृपया इनबक्स तथा स्प्याम फोल्डर जाँच गर्नुहोस्।`
                : `We have dispatched instructions to ${email}. Please check your inbox and spam folder.`}
            </p>
            <Link
              href="/login"
              className="inline-block mt-3 text-xs font-bold text-[#123B5D] hover:underline"
            >
              {isNe ? 'लगइनमा फर्कनुहोस्' : 'Return to login'}
            </Link>
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
                {isNe ? 'इमेल ठेगाना' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>{isNe ? 'पठाउँदै...' : 'Sending...'}</span>
              ) : (
                <>
                  <span>{isNe ? 'रिसेट लिंक पठाउनुहोस्' : 'Send Reset Link'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                {isNe ? 'लगइनमा फर्कनुहोस्' : 'Back to Login'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
