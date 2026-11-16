'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { Building2, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { refreshBusinesses, isLoggedIn } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bizName, setBizName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.business.acceptInvitation(token);
      setSuccess(true);
      setBizName(res.business?.name || 'the business');
      await refreshBusinesses();
    } catch (err: any) {
      setError(err.message || (isNe ? 'निमन्त्रणा स्वीकार गर्न सकिएन।' : 'Failed to accept invitation.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleAccept();
    }
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
          <Building2 className="h-8 w-8" />
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            <RefreshCw className="h-8 w-8 text-[#18A999] animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-[#123B5D]">
              {isNe ? 'निमन्त्रणा स्वीकार गरिँदैछ...' : 'Accepting invitation...'}
            </h2>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#123B5D]">
              {isNe ? 'टोलीमा स्वागत छ!' : 'Welcome to the team!'}
            </h2>
            <p className="text-xs text-slate-600">
              {isNe
                ? `तपाईं सफलतापूर्वक ${bizName} को टोलीमा सामेल हुनुभएको छ।`
                : `You have joined ${bizName}. You can now view and generate business documents.`}
            </p>
            <div className="pt-3">
              <Link
                href="/business/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-xs font-bold text-white shadow-md"
              >
                <span>{isNe ? 'संस्थागत ड्यासबोर्डमा जानुहोस्' : 'Go to Business Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-[#123B5D]">
              {isNe ? 'व्यवसाय निमन्त्रणा' : 'Business Invitation'}
            </h2>
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center gap-2 text-left">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block text-xs font-bold text-[#123B5D] hover:underline"
              >
                {isNe ? 'लगइन गर्नुहोस्' : 'Sign in to continue'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
