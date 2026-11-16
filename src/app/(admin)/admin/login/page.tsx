'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import toast from '@/lib/toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t, lang, isReady } = useLanguage();

  const [email, setEmail] = useState('admin@merokagaz.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning(lang === 'ne' ? 'कृपया ईमेल ठेगाना प्रविष्ट गर्नुहोस्।' : 'Please enter your email address.');
      return;
    }

    if (!password) {
      toast.warning(lang === 'ne' ? 'कृपया पासवर्ड प्रविष्ट गर्नुहोस्।' : 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.admin.login(email, password);
      localStorage.setItem('mk_admin_token', result.token);
      toast.success(lang === 'ne' ? 'सफलतापूर्वक लगइन भयो!' : 'Login successful! Welcome to Admin Panel.');
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : lang === 'ne'
          ? 'प्रशासक लगइन असफल भयो। विवरण जाँच गर्नुहोस्।'
          : 'Login failed. Please verify credentials.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  // Jaba samma language select / ready vai sakdaina, taba samma loader dekhaune
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E6F6F3]">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/95 px-8 py-7 shadow-xl shadow-[#123B5D]/10">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#18A999] border-r-[#123B5D] animate-spin" />
            <div className="relative h-9 w-9 animate-pulse">
              <Image
                src="/assets/icon.png"
                alt="Loading"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#123B5D] tracking-wide font-outfit">
            लोड हुँदैछ... / Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#E6F6F3] px-4 py-12">
      {/* Top Right Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      {/* Soft Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-80 w-80 rounded-full bg-[#18A999]/15 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[#F4B942]/15 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header with Larger Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-3 h-20 w-64 sm:h-24 sm:w-72">
            <Image
              src="/assets/logo.png"
              alt="Mero Kagaz"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-white/90 px-3.5 py-1 text-xs font-semibold text-[#123B5D] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#18A999] animate-pulse"></span>
            {t('adminPortalBadge')}
          </span>
        </div>

        {/* Login Form Box */}
        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-[#123B5D]/5 backdrop-blur-xl"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#123B5D]">{t('adminSignInTitle')}</h2>
            <p className="mt-1 text-xs text-slate-500">{t('adminSignInSubtitle')}</p>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-[#123B5D]">{t('adminEmailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F7F9FC] px-4 py-2.5 text-sm text-[#17212B] placeholder-slate-400 transition focus:border-[#18A999] focus:bg-white focus:ring-2 focus:ring-[#18A999]/30 focus:outline-none"
              placeholder="admin@merokagaz.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold text-[#123B5D]">{t('adminPasswordLabel')}</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F7F9FC] px-4 py-2.5 pr-11 text-sm text-[#17212B] placeholder-slate-400 transition focus:border-[#18A999] focus:bg-white focus:ring-2 focus:ring-[#18A999]/30 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('adminHidePassword') : t('adminShowPassword')}
                className="absolute right-3 p-1 text-slate-400 transition hover:text-[#123B5D]"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18A999] py-3 text-sm font-semibold text-white shadow-md shadow-[#18A999]/25 transition hover:bg-[#148C7E] active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{t('adminSubmittingBtn')}</span>
              </>
            ) : (
              <span>{t('adminSubmitBtn')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
