'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Lock, Mail, ArrowRight, UserCheck, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      login(res.token, res.user, res.businesses || []);

      if (accountType === 'business' && res.businesses && res.businesses.length > 0) {
        router.push('/business/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (err: any) {
      setError(err.message || (isNe ? 'लगइन असफल भयो। कृपया आफ्नो इमेल र पासवर्ड जाँच गर्नुहोस्।' : 'Login failed. Please verify credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white shadow-lg shadow-teal-500/20">
            {accountType === 'individual' ? <UserCheck className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#123B5D] tracking-tight">
            {isNe ? 'मेरो कागज खाता लगइन' : 'Sign in to Mero Kagaz'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {isNe ? 'आधिकारिक सरकारी कागजात व्यवस्थापन प्रणाली' : 'Official Government Document Automation Platform'}
          </p>

          {/* Account Type Selector */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                accountType === 'individual'
                  ? 'bg-white text-[#123B5D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{isNe ? 'व्यक्तिगत खाता' : 'Individual User'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('business')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                accountType === 'business'
                  ? 'bg-white text-[#123B5D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{isNe ? 'संस्था / व्यवसाय' : 'Business Account'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {isNe ? 'पासवर्ड' : 'Password'}
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-[#18A999] hover:text-[#148C7E] transition-colors"
              >
                {isNe ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? (isNe ? 'पासवर्ड लुकाउनुहोस्' : 'Hide password') : (isNe ? 'पासवर्ड हेर्नुहोस्' : 'Show password')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isNe ? 'प्रमाणीकरण हुँदैछ...' : 'Signing in...'}</span>
              </span>
            ) : (
              <>
                <span>{isNe ? 'लगइन गर्नुहोस्' : 'Sign in'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isNe ? 'खाता छैन?' : "Don't have an account?"}{' '}
            <Link
              href="/register"
              className="font-bold text-[#18A999] hover:underline"
            >
              {isNe ? 'नयाँ खाता खोल्नुहोस्' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
