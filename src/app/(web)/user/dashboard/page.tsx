'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { api, UserDocumentItem, UserPaymentItem } from '@/lib/api';
import { formatBsDate } from '@/lib/nepaliDate';
import toast from '@/lib/toast';
import NepaliInput from '@/components/ui/NepaliInput';
import {
  User,
  FileText,
  CreditCard,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  Edit2,
  PlusCircle,
  RefreshCw,
  Lock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoaded, logout, refreshUser } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [activeTab, setActiveTab] = useState<'documents' | 'payments'>('documents');
  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [payments, setPayments] = useState<UserPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setLoading(true);
    Promise.all([
      api.user.documents().catch(() => []),
      api.user.payments().catch(() => []),
    ])
      .then(([docs, pays]) => {
        if (Array.isArray(docs)) setDocuments(docs);
        if (Array.isArray(pays)) setPayments(pays);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isLoggedIn, router]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      await api.auth.resendVerification({ email: user?.email });
      setResendMsg(isNe ? 'प्रमाणीकरण इमेल पुनः पठाइएको छ।' : 'Verification email resent.');
    } catch {
      setResendMsg(isNe ? 'इमेल पठाउन असफल भयो।' : 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.user.updateProfile({ name: editName, phone: editPhone });
      await refreshUser();
      setShowEditModal(false);
      toast.success(isNe ? 'व्यक्तिगत विवरण सफलतापूर्वक सुरक्षित भयो।' : 'Profile information updated successfully.');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'विवरण अद्यावधिक गर्न सकिएन।' : 'Failed to update profile.'));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (password !== passwordConfirmation) {
      setPwdError(isNe ? 'नयाँ पासवर्ड र कन्फर्म पासवर्ड मिलेन।' : 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setPwdError(isNe ? 'नयाँ पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।' : 'New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.user.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setPwdSuccess(isNe ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो।' : 'Password updated successfully.');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || (isNe ? 'पासवर्ड परिवर्तन असफल भयो।' : 'Failed to change password.'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18A999]" />
        <p className="mt-3 text-xs font-semibold text-slate-500 font-outfit">
          {isNe ? 'ड्यासबोर्ड लोड हुँदैछ...' : 'Loading dashboard...'}
        </p>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ─── Profile Header ─── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white text-2xl font-black shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#123B5D]">
                  {user?.name}
                </h1>
                {user?.is_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{isNe ? 'प्रमाणित खाता' : 'Verified'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span>{isNe ? 'अपुष्ट इमेल' : 'Unverified'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email} • {user?.phone || 'No phone provided'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <User className="h-3.5 w-3.5 text-[#18A999]" />
              <span>{isNe ? 'प्रोफाइल व्यवस्थापन' : 'Manage Profile'}</span>
            </Link>
            <button
              onClick={() => {
                setCurrentPassword('');
                setPassword('');
                setPasswordConfirmation('');
                setPwdError(null);
                setPwdSuccess(null);
                setShowPasswordModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-amber-600" />
              <span>{isNe ? 'पासवर्ड परिवर्तन' : 'Change Password'}</span>
            </button>
            <Link
              href="/business/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/50 px-3.5 py-2 text-xs font-semibold text-[#18A999] hover:bg-teal-50 transition-colors shadow-xs"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{isNe ? 'संस्थागत ड्यासबोर्ड' : 'Business Dashboard'}</span>
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0E2E4A] transition-colors shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{isNe ? 'नयाँ कागजात बनाउनुहोस्' : 'Create Document'}</span>
            </Link>
          </div>
        </div>

        {/* Unverified Email Warning Banner */}
        {!user?.is_verified && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">{isNe ? 'तपाईंको इमेल अझै प्रमाणित भएको छैन।' : 'Your email address is unverified.'}</span>{' '}
                <span>{isNe ? 'सरकारी कागजातहरू सुरक्षित डाउनलोड गर्नका लागि कृपया इमेल प्रमाणीकरण पूरा गर्नुहोस्।' : 'Please verify your email address to ensure account security and document download authorization.'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {resending ? (isNe ? 'पठाउँदै...' : 'Resending...') : (isNe ? 'प्रमाणीकरण इमेल पठाउनुहोस्' : 'Resend Verification')}
              </button>
              {resendMsg && <span className="text-[11px] font-bold text-emerald-700">{resendMsg}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'documents'
              ? 'bg-[#123B5D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{isNe ? 'मेरा कागजातहरू' : 'My Documents'}</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments'
              ? 'bg-[#123B5D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{isNe ? 'भुक्तानी विवरण' : 'Payment History'}</span>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
            {payments.length}
          </span>
        </button>
      </div>

      {/* ─── Tab Content ─── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#18A999] mb-2" />
          <span>{isNe ? 'कागजातहरू लोड हुँदैछन्...' : 'Loading your records...'}</span>
        </div>
      ) : activeTab === 'documents' ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
          {documents.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-bold text-sm">
                {isNe ? 'कुनै कागजात फेला परेन' : 'No documents generated yet'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isNe ? 'तपाईंले कुनै सरकारी कागजात सिर्जना गर्नुभएको छैन। अहिले नै ५ मिनेटमा फारम तयार गर्नुहोस्।' : 'You have not generated any official documents. Prepare print-ready government forms in 5 minutes.'}
              </p>
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#18A999] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#148C7E]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isNe ? 'पहिलो कागजात बनाउनुहोस्' : 'Create First Document'}</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5"># Order No</th>
                    <th className="px-6 py-3.5">{isNe ? 'कागजातको नाम' : 'Document'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'रकम' : 'Amount'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'भुक्तानी अवस्था' : 'Payment'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'मिति (BS / AD)' : 'Date'}</th>
                    <th className="px-6 py-3.5 text-right">{isNe ? 'डाउनलोड' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#123B5D]">
                        {doc.public_order_no}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{isNe ? doc.document_name_np : doc.document_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{doc.category}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {doc.total === 0 ? (
                          <span className="text-emerald-600">{isNe ? 'निःशुल्क' : 'Free'}</span>
                        ) : (
                          `NPR ${doc.total.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          doc.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          doc.status === 'completed'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        <div>{formatBsDate(doc.created_at, 'YYYY MMMM DD', isNe ? 'ne' : 'en')}</div>
                        <div className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {doc.download_url ? (
                          <a
                            href={doc.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#18A999] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#148C7E] transition-all"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{isNe ? 'डाउनलोड' : 'Download'}</span>
                          </a>
                        ) : doc.payment_status !== 'paid' ? (
                          <Link
                            href={`/checkout?order_no=${doc.public_order_no}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#123B5D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0E2E4A]"
                          >
                            <span>{isNe ? 'भुक्तानी गर्नुहोस्' : 'Pay Now'}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                            <Clock className="h-3.5 w-3.5 animate-spin text-amber-500" />
                            <span>{isNe ? 'प्रशोधन हुँदै' : 'Processing'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <span>{isNe ? 'कुनै भुक्तानी रेकर्ड छैन' : 'No payment records found.'}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5"># Order No</th>
                    <th className="px-6 py-3.5">{isNe ? 'कागजात' : 'Document'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'माध्यम' : 'Provider'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'रेफरेन्स नम्बर' : 'Reference'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'रकम' : 'Amount'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'मिति' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-[#123B5D]">{p.order_no}</td>
                      <td className="px-6 py-4 font-medium">{p.document_name}</td>
                      <td className="px-6 py-4 uppercase font-bold text-slate-700">{p.provider}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{p.provider_reference || '—'}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">NPR {p.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {formatBsDate(p.created_at, 'YYYY MMMM DD', isNe ? 'ne' : 'en')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Edit Profile Modal ─── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-[#123B5D]">
              {isNe ? 'व्यक्तिगत विवरण सच्याउनुहोस्' : 'Edit Profile Information'}
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'पूरा नाम' : 'Full Name'}
                </label>
                <NepaliInput
                  value={editName}
                  onChange={(val) => setEditName(val)}
                  placeholder={isNe ? 'पूरा नाम' : 'Full Name'}
                  isNe={isNe}
                  defaultNepaliMode={false}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'फोन नम्बर' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isNe ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 rounded-xl bg-[#123B5D] text-xs font-bold text-white shadow-xs hover:bg-[#0E2E4A]"
                >
                  {updatingProfile ? (isNe ? 'बचत गर्दै...' : 'Saving...') : (isNe ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Change Password Modal ─── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#123B5D]">
                  {isNe ? 'पासवर्ड परिवर्तन गर्नुहोस्' : 'Change Your Password'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isNe ? 'आफ्नो खाता सुरक्षित राख्न बलियो पासवर्ड राख्नुहोस्' : 'Keep your account secure with a strong password'}
                </p>
              </div>
            </div>

            {pwdError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'हालको पासवर्ड (Current Password)' : 'Current Password'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'नयाँ पासवर्ड (New Password)' : 'New Password'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस् (Confirm Password)' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isNe ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {changingPassword ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>{changingPassword ? (isNe ? 'परिवर्तन हुँदैछ...' : 'Updating...') : (isNe ? 'पासवर्ड परिवर्तन गर्नुहोस्' : 'Change Password')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
