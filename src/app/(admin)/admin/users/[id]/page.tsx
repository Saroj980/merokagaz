'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, AdminUserDetail, AdminUserReportFilter } from '@/lib/api';
import toast, { alertModal } from '@/lib/toast';
import {
  formatBsDate,
  resolveBsPresetDateRange,
  bsStringToAdString,
  adStringToBsString,
  toNepaliDigits,
} from '@/lib/nepaliDate';
import { encodeUserId, decodeUserId } from '@/lib/userCode';
import {
  Users,
  ArrowLeft,
  Calendar,
  FileText,
  DollarSign,
  Building2,
  FolderLock,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Key,
  ShieldAlert,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  CreditCard,
  UserCheck,
  UserX,
  FileCheck,
  AlertTriangle,
  X,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AdminUserDetailPage() {
  const params = useParams();
  const rawParam = params?.id ? String(params.id) : '';
  const userId = decodeUserId(rawParam);
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'profile' | 'vault' | 'businesses'>('profile');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Date-wise Report Filters (Both AD and Bikram Sambat BS)
  const [period, setPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [bsStartDate, setBsStartDate] = useState<string>('');
  const [bsEndDate, setBsEndDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Status Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch User Details with date-wise report filters
  const fetchUserDetails = useCallback(async (filters?: AdminUserReportFilter) => {
    if (!userId) return;
    setLoading(true);
    try {
      const filterParams: AdminUserReportFilter = {
        period: filters?.period ?? period,
        start_date: filters?.start_date ?? (startDate || undefined),
        end_date: filters?.end_date ?? (endDate || undefined),
        payment_status: filters?.payment_status ?? (paymentStatus !== 'all' ? paymentStatus : undefined),
        search: filters?.search ?? (searchQuery || undefined),
        page: filters?.page ?? currentPage,
      };

      const res = await api.admin.users.get(userId, filterParams);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      toast.error(isNe ? 'प्रयोगकर्ता विवरण लोड गर्न सकिएन।' : 'Failed to load user records.');
    } finally {
      setLoading(false);
    }
  }, [userId, period, startDate, endDate, paymentStatus, searchQuery, currentPage, isNe]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Fast period select with Bikram Sambat resolution
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setCurrentPage(1);

    if (newPeriod === 'all') {
      setStartDate('');
      setEndDate('');
      setBsStartDate('');
      setBsEndDate('');
      fetchUserDetails({ period: 'all', start_date: undefined, end_date: undefined, page: 1 });
      return;
    }

    const bsRange = resolveBsPresetDateRange(newPeriod);
    const sDate = bsRange.startDate;
    const eDate = bsRange.endDate;

    setStartDate(sDate);
    setEndDate(eDate);
    setBsStartDate(adStringToBsString(sDate));
    setBsEndDate(adStringToBsString(eDate));

    fetchUserDetails({ period: newPeriod, start_date: sDate, end_date: eDate, page: 1 });
  };

  const handleBsStartDateChange = (val: string) => {
    setBsStartDate(val);
    setPeriod('custom');
    const convertedAd = bsStringToAdString(val);
    if (convertedAd) {
      setStartDate(convertedAd);
    }
  };

  const handleBsEndDateChange = (val: string) => {
    setBsEndDate(val);
    setPeriod('custom');
    const convertedAd = bsStringToAdString(val);
    if (convertedAd) {
      setEndDate(convertedAd);
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);

    // If BS string was entered and not yet converted to AD
    let queryStart = startDate;
    let queryEnd = endDate;
    if (bsStartDate && !queryStart) {
      queryStart = bsStringToAdString(bsStartDate) || '';
    }
    if (bsEndDate && !queryEnd) {
      queryEnd = bsStringToAdString(bsEndDate) || '';
    }

    fetchUserDetails({
      period,
      start_date: queryStart || undefined,
      end_date: queryEnd || undefined,
      payment_status: paymentStatus !== 'all' ? paymentStatus : undefined,
      search: searchQuery || undefined,
      page: 1,
    });
  };

  const handleResetFilter = () => {
    setPeriod('all');
    setStartDate('');
    setEndDate('');
    setBsStartDate('');
    setBsEndDate('');
    setPaymentStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
    fetchUserDetails({
      period: 'all',
      start_date: undefined,
      end_date: undefined,
      payment_status: undefined,
      search: undefined,
      page: 1,
    });
  };

  // Toggle User Active / Suspended Status
  const handleToggleStatus = async () => {
    if (!data?.user) return;
    const nextStatus = !data.user.is_active;
    const confirmTitle = nextStatus
      ? isNe ? 'खाता पुनः सक्रिय गर्ने?' : 'Reactivate User Account?'
      : isNe ? 'खाता निलम्बन (Suspend) गर्ने?' : 'Suspend User Account?';

    const confirmMsg = nextStatus
      ? isNe ? `${data.user.name} को खाता पुनः सक्रिय हुनेछ।` : `Allow ${data.user.name} to log in and access services.`
      : isNe ? `${data.user.name} को खाता निलम्बित हुनेछ र कुनै कागजात निकाल्न पाउने छैनन्।` : `Prevent ${data.user.name} from logging in and generating legal documents.`;

    const ok = await alertModal.confirm(
      confirmTitle,
      confirmMsg,
      nextStatus ? (isNe ? 'सक्रिय गर्नुहोस्' : 'Activate') : (isNe ? 'निलम्बन गर्नुहोस्' : 'Suspend'),
      isNe ? 'रद्द' : 'Cancel'
    );

    if (!ok) return;

    setActionLoading(true);
    try {
      await api.admin.users.updateStatus(data.user.id, nextStatus);
      toast.success(nextStatus ? (isNe ? 'खाता सक्रिय गरियो।' : 'Account activated.') : (isNe ? 'खाता निलम्बित गरियो।' : 'Account suspended.'));
      fetchUserDetails();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'त्रुटि भयो।' : 'Failed to update status.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error(isNe ? 'पासवर्ड कम्तिमा ६ वर्णको हुनुपर्दछ।' : 'Password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.admin.users.updatePassword(userId, newPassword);
      toast.success(isNe ? 'पासवर्ड सफलतापूर्वक परिवर्तन गरियो।' : 'User password updated successfully.');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'पासवर्ड परिवर्तन असफल भयो।' : 'Failed to update password.'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const user = data?.user;
  const stats = data?.stats;
  const filteredStats = stats?.filtered;
  const orders = data?.orders || [];
  const vaultDocs = data?.vault_documents || [];
  const ownedBiz = data?.owned_businesses || [];
  const memberBiz = data?.businesses || [];

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-16">
        {/* ─── Breadcrumb & Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href="/admin/users" className="hover:text-teal-600 transition">
                  {isNe ? 'प्रयोगकर्ताहरू' : 'Users'}
                </Link>
                <span>/</span>
                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-mono font-bold">
                  {user?.public_id || (rawParam.startsWith('MKU-') ? rawParam : encodeUserId(rawParam))}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#123B5D] tracking-tight">
                {user ? `${user.name}${user.name_np ? ` (${user.name_np})` : ''}` : (isNe ? 'प्रयोगकर्ता विवरण' : 'User Record & Reports')}
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUserDetails()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isNe ? 'रिफ्रेस' : 'Refresh'}</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => {
                    setNewPassword('');
                    setShowPasswordModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                >
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  <span>{isNe ? 'पासवर्ड परिवर्तन' : 'Change Password'}</span>
                </button>

                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading || user.role === 'admin'}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer shadow-2xs disabled:opacity-50 ${
                    user.is_active
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  <span>
                    {user.is_active
                      ? isNe ? 'खाता निलम्बन गर्नुहोस्' : 'Suspend Account'
                      : isNe ? 'पुनः सक्रिय गर्नुहोस्' : 'Activate Account'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Top Metrics Overview ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Documents Generated Metric (Kati docs generate gare) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'कागजात तयार (Generated Docs)' : 'Docs Generated'}
              </p>
              <h3 className="text-2xl font-black text-[#123B5D] mt-0.5 font-mono">
                {stats?.total_documents_generated ?? 0}
              </h3>
              <p className="text-[11px] text-teal-600 font-medium">
                {isNe ? 'सफल/डाउनलोड योग्य' : 'Paid & Verified'}
              </p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'कुल अर्डर संख्या' : 'Total Orders'}
              </p>
              <h3 className="text-2xl font-black text-[#123B5D] mt-0.5 font-mono">
                {stats?.total_orders ?? 0}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isNe ? 'सबै अर्डरहरू' : 'Lifetime Orders'}
              </p>
            </div>
          </div>

          {/* Total Lifetime Spent */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'कुल खर्च (Total Spent)' : 'Lifetime Revenue'}
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
                NPR {(stats?.total_spent ?? data?.total_spent ?? 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isNe ? 'भुक्तानी सम्पन्न' : 'Paid in full'}
              </p>
            </div>
          </div>

          {/* Vault Documents */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <FolderLock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'भल्ट कागजात (Vault)' : 'Vault Documents'}
              </p>
              <h3 className="text-2xl font-black text-[#123B5D] mt-0.5 font-mono">
                {stats?.vault_documents_count ?? vaultDocs.length}
              </h3>
              <p className="text-[11px] text-purple-600 font-medium">
                {isNe ? 'नागरिकता, लाइसेन्स, NID' : 'Official Government IDs'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── User Profile Strip ─── */}
        {user && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123B5D] text-white font-black text-xl shadow-md">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#123B5D]">{user.name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {user.is_active ? (isNe ? 'सक्रिय' : 'Active') : (isNe ? 'निलम्बित' : 'Suspended')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600">
                    {user.role}
                  </span>
                  {user.email_verified_at ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" />
                      {isNe ? 'प्रमाणित' : 'Verified'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="h-3 w-3" />
                      {isNe ? 'अपुष्ट' : 'Unverified'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1 font-mono">
                  <span>{user.email}</span>
                  {user.phone && <span>• {user.phone}</span>}
                  <span>• {isNe ? 'दर्ता मिति:' : 'Joined:'} {formatBsDate(user.created_at, 'DD MMMM YYYY', isNe ? 'ne' : 'en')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Date-Wise Filter & Reports Section ─── */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'मिति अनुसार रिपोर्ट फिल्टर (Date-wise Report Filter)' : 'Date-Wise Activity & Reports Filter'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isNe ? 'कुनै पनि समय वा निश्चित मितिको कागजात र अर्डर रिपोर्ट हेर्नुहोस्' : 'Filter generated documents, orders, and expenses by date range'}
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: isNe ? 'सबै' : 'All Time' },
                { key: 'today', label: isNe ? 'आज' : 'Today' },
                { key: 'yesterday', label: isNe ? 'हिजो' : 'Yesterday' },
                { key: 'last_7_days', label: isNe ? '७ दिन' : 'Last 7 Days' },
                { key: 'this_month', label: isNe ? 'यो महिना' : 'This Month' },
                { key: 'last_30_days', label: isNe ? '३० दिन' : 'Last 30 Days' },
                { key: 'custom', label: isNe ? 'आफ्नै मिति' : 'Custom' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePeriodChange(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    period === p.key
                      ? 'bg-[#123B5D] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Form Row with Bikram Sambat (BS) Support */}
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isNe ? 'सुरु मिति (वि.सं. B.S.)' : 'Start Date (B.S.)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="YYYY-MM-DD (e.g. 2083-07-01)"
                  value={bsStartDate}
                  onChange={(e) => handleBsStartDateChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              {startDate && (
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  AD: {startDate}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isNe ? 'अन्तिम मिति (वि.सं. B.S.)' : 'End Date (B.S.)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="YYYY-MM-DD (e.g. 2083-07-30)"
                  value={bsEndDate}
                  onChange={(e) => handleBsEndDateChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              {endDate && (
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  AD: {endDate}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isNe ? 'भुक्तानी स्थिति' : 'Payment Status'}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
              >
                <option value="all">{isNe ? 'सबै भुक्तानी' : 'All Status'}</option>
                <option value="paid">{isNe ? 'सम्पन्न (Paid)' : 'Paid'}</option>
                <option value="pending">{isNe ? 'बाँकी (Pending)' : 'Pending'}</option>
                <option value="failed">{isNe ? 'असफल (Failed)' : 'Failed'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isNe ? 'कागजात/अर्डर खोजी' : 'Search Doc / Order #'}
              </label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isNe ? 'अर्डर वा कागजातको नाम...' : 'Search order number, document...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{isNe ? 'फिल्टर लागू' : 'Filter Report'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                {isNe ? 'रिसेट' : 'Reset'}
              </button>
            </div>
          </form>

          {/* Dynamic Filter Output Banner */}
          {filteredStats && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/80 via-blue-50/50 to-slate-50 border border-teal-200/70 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <div>
                  <div className="text-xs font-extrabold text-[#123B5D]">
                    {isNe ? 'छानिएको मिति अवधिको रिपोर्ट सारांश' : 'Date Range Report Summary'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {startDate && endDate ? `${startDate} ~ ${endDate}` : `Period: ${period.toUpperCase()}`}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isNe ? 'तयार कागजात' : 'Docs Generated'}
                  </span>
                  <span className="text-base font-black text-teal-600 font-mono">
                    {filteredStats.documents_generated}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isNe ? 'अर्डर संख्या' : 'Orders Placed'}
                  </span>
                  <span className="text-base font-black text-blue-600 font-mono">
                    {filteredStats.orders_count}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isNe ? 'अवधिको आम्दानी/खर्च' : 'Spent in Range'}
                  </span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    NPR {filteredStats.total_spent.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          {[
            { key: 'documents', label: isNe ? 'तयार कागजात तथा अर्डरहरू' : 'Generated Documents & Orders', icon: FileText, count: orders.length },
            { key: 'profile', label: isNe ? 'व्यक्तिगत तथा सरकारी परिचय' : 'Personal & KYC Details', icon: Users },
            { key: 'vault', label: isNe ? 'कागजात भल्ट (Vault Files)' : 'Document Vault', icon: FolderLock, count: vaultDocs.length },
            { key: 'businesses', label: isNe ? 'व्यवसायहरू (Businesses)' : 'Associated Businesses', icon: Building2, count: ownedBiz.length + memberBiz.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer -mb-px ${
                  isActive
                    ? 'border-[#123B5D] text-[#123B5D]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-[#123B5D] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === 'documents' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'प्रयोगकर्ताले तयार पारेका कागजातहरूको विवरण' : 'Generated Documents & Order History'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isNe ? 'मिति अनुसार फिल्टर गरिएका अर्डर र कागजातहरू' : 'All document generation requests placed by this user'}
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  {isNe ? 'कुनै कागजात वा अर्डर फेला परेन।' : 'No documents or orders found for this period.'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isNe ? 'कृपया मिति परिवर्तन गर्नुहोस् वा नयाँ अर्डर कुर्नुहोस्।' : 'Try resetting your date filters to view all lifetime records.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">{isNe ? 'कागजातको नाम' : 'Document'}</th>
                      <th className="py-3 px-4">{isNe ? 'मिति (BS / AD)' : 'Date'}</th>
                      <th className="py-3 px-4">{isNe ? 'भुक्तानी स्थिति' : 'Payment'}</th>
                      <th className="py-3 px-4">{isNe ? 'अर्डर स्थिति' : 'Order Status'}</th>
                      <th className="py-3 px-4 text-right">{isNe ? 'रकम' : 'Total'}</th>
                      <th className="py-3 px-4 text-center">{isNe ? 'कार्य' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{o.order_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {isNe ? (o.document?.name_np || o.document?.name || 'Document') : (o.document?.name || 'Document')}
                          </div>
                          {o.document?.category && (
                            <span className="text-[10px] text-teal-600 font-medium">
                              {isNe ? (o.document.category.name_np || o.document.category.name) : o.document.category.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          <div className="font-extrabold text-[#123B5D]">
                            {formatBsDate(o.created_at, 'DD MMMM YYYY', isNe ? 'ne' : 'en')} B.S.
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatBsDate(o.created_at, 'YYYY-MM-DD', isNe ? 'ne' : 'en')} ({new Date(o.created_at).toLocaleDateString()})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.payment_status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {o.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                            {o.status || 'completed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                          NPR {Number(o.total).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                          >
                            <Eye className="h-3 w-3" />
                            <span>{isNe ? 'हेर्नुहोस्' : 'View'}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 2: Profile & KYC Details ─── */}
        {activeTab === 'profile' && user && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6 mb-10">
            <div>
              <h3 className="text-sm font-extrabold text-[#123B5D]">
                {isNe ? 'व्यक्तिगत तथा पारिवारिक विवरण (अंग्रेजी र नेपाली दुवै)' : 'Personal & Family Information (English & Nepali)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isNe ? 'प्रयोगकर्ताले सरकारी फारमहरूमा बारम्बार प्रयोग गर्न सुरक्षित गरेका सम्पूर्ण विवरणहरू' : 'All saved personal, family, and citizenship records for legal document automation'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Full Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? 'पूरा नाम (Full Name)' : 'Full Name'}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{user.name}</span>
                {user.name_np && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50/90 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block">
                    नेपाली: {user.name_np}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? 'इमेल ठेगाना' : 'Email Address'}</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm block break-all">{user.email}</span>
                <span className="text-[11px] font-medium text-emerald-600 block">
                  {user.email_verified_at ? (isNe ? '✓ प्रमाणित इमेल' : '✓ Verified Email') : (isNe ? 'प्रमाणित नभएको' : 'Unverified')}
                </span>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? 'मोबाइल नम्बर' : 'Phone Number'}</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm block">{user.phone || '—'}</span>
              </div>

              {/* Father's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? "बाबुको नाम (Father's Name)" : "Father's Name"}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{user.father_name || '—'}</span>
                {user.father_name_np && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50/90 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block">
                    नेपाली: {user.father_name_np}
                  </span>
                )}
              </div>

              {/* Mother's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? "आमाको नाम (Mother's Name)" : "Mother's Name"}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{user.mother_name || '—'}</span>
                {user.mother_name_np && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50/90 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block">
                    नेपाली: {user.mother_name_np}
                  </span>
                )}
              </div>

              {/* Grandfather's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? "हजुरबुबाको नाम (Grandfather's Name)" : "Grandfather's Name"}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{user.grandfather_name || '—'}</span>
                {user.grandfather_name_np && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50/90 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block">
                    नेपाली: {user.grandfather_name_np}
                  </span>
                )}
              </div>

              {/* Spouse's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? "पति/पत्नीको नाम (Spouse's Name)" : "Spouse's Name"}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{user.spouse_name || '—'}</span>
                {user.spouse_name_np && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50/90 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block">
                    नेपाली: {user.spouse_name_np}
                  </span>
                )}
              </div>

              {/* Gender */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? 'लिङ्ग (Gender)' : 'Gender'}</span>
                <span className="font-extrabold text-slate-900 text-sm block capitalize">{user.gender || '—'}</span>
              </div>

              {/* Personal PAN */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">{isNe ? 'स्थायी लेखा नम्बर (Personal PAN)' : 'Personal PAN'}</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm block">{user.pan_number || '—'}</span>
              </div>
            </div>

            {/* Official Identification */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'नागरिकता तथा सरकारी प्रमाणपत्र (Citizenship & Credentials)' : 'Citizenship & Official Credentials'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <span className="text-slate-500 font-bold block">{isNe ? 'नागरिकता नम्बर' : 'Citizenship Number'}</span>
                  <span className="font-extrabold text-[#123B5D] font-mono text-base mt-0.5 block">
                    {user.citizenship_no || '—'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <span className="text-slate-500 font-bold block">{isNe ? 'जारी जिल्ला' : 'Issued District'}</span>
                  <span className="font-extrabold text-[#123B5D] text-sm mt-0.5 block">
                    {user.citizenship_issued_district || '—'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <span className="text-slate-500 font-bold block">{isNe ? 'जारी मिति (B.S.)' : 'Issued Date (BS)'}</span>
                  <span className="font-extrabold text-[#123B5D] font-mono text-sm mt-0.5 block">
                    {user.citizenship_issued_date || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'स्थायी ठेगाना (Permanent Address)' : 'Permanent Address'}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block">{isNe ? 'प्रदेश' : 'Province'}</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{user.province || '—'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block">{isNe ? 'जिल्ला' : 'District'}</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{user.district || '—'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block">{isNe ? 'पालिका' : 'Municipality'}</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{user.municipality || '—'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block">{isNe ? 'वडा नं.' : 'Ward No.'}</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block font-mono">{user.ward || '—'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block">{isNe ? 'टोल / सडक' : 'Tole / Street'}</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{user.tole || '—'}</span>
                </div>
              </div>
            </div>

            {/* Family Members Table */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isNe ? 'पारिवारिक सदस्यहरूको नामावली (Family Members)' : 'Family Members & Dependents'}
                </h4>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Total: {user.family_members?.length || 0}
                </span>
              </div>

              {user.family_members && user.family_members.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-4">{isNe ? 'नाता / सम्बन्ध' : 'Relation'}</th>
                        <th className="py-2.5 px-4">{isNe ? 'नाम (English)' : 'Name (English)'}</th>
                        <th className="py-2.5 px-4">{isNe ? 'नाम (नेपाली)' : 'Name (Nepali)'}</th>
                        <th className="py-2.5 px-4">{isNe ? 'नागरिकता नं.' : 'Citizenship No.'}</th>
                        <th className="py-2.5 px-4">{isNe ? 'जन्म मिति (B.S.)' : 'DOB (B.S.)'}</th>
                        <th className="py-2.5 px-4">{isNe ? 'सम्पर्क फोन' : 'Phone'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {user.family_members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold capitalize text-[#123B5D]">{m.relation || '—'}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{m.name_en || '—'}</td>
                          <td className="py-2.5 px-4 font-semibold text-teal-700">{m.name_np || '—'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{m.citizenship_no || '—'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{m.dob_bs || '—'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{m.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400">
                  {isNe ? 'कुनै पारिवारिक सदस्य थपिएको छैन।' : 'No additional family members entered.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Tab 3: Document Vault ─── */}
        {activeTab === 'vault' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'कागजात भल्टमा सुरक्षित गरिएका फाइलहरू' : 'User Stored Document Vault'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isNe ? 'प्रयोगकर्ताले स्क्यान गरी सुरक्षित राखेका सरकारी परिचयपत्रहरू' : 'Official government documents scanned & saved by user'}
                </p>
              </div>
            </div>

            {vaultDocs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <FolderLock className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  {isNe ? 'कुनै भल्ट कागजात अपलोड गरिएको छैन।' : 'No vault documents uploaded yet.'}
                </h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaultDocs.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                        {doc.document_type || 'DOCUMENT'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-[#123B5D] text-sm">{doc.title}</h4>
                      {doc.document_number && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          No: {doc.document_number}
                        </p>
                      )}
                      {doc.issued_district && (
                        <p className="text-[11px] text-slate-400">
                          {isNe ? 'जिल्ला:' : 'District:'} {doc.issued_district}
                        </p>
                      )}
                      {doc.has_expiry && (
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>
                            {isNe ? 'म्याद (B.S.):' : 'Expiry:'} {doc.expiry_date_bs || doc.expiry_date_ad || '—'}
                          </span>
                        </div>
                      )}
                    </div>

                    {doc.file_path && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>{isNe ? 'हेर्नुहोस्' : 'Preview'}</span>
                          </button>
                          <a
                            href={doc.file_path.startsWith('http') ? doc.file_path : `/storage/${doc.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 4: Associated Businesses ─── */}
        {activeTab === 'businesses' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 mb-10">
            <div>
              <h3 className="text-sm font-extrabold text-[#123B5D]">
                {isNe ? 'सम्बद्ध व्यवसायहरू' : 'Associated Businesses'}
              </h3>
              <p className="text-xs text-slate-500">
                {isNe ? 'प्रयोगकर्ताको स्वामित्व वा सदस्यता रहेका कम्पनी तथा व्यवसायहरू' : 'Companies registered or managed by this user'}
              </p>
            </div>

            {ownedBiz.length === 0 && memberBiz.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  {isNe ? 'कुनै व्यवसाय दर्ता भएको छैन।' : 'No registered businesses found.'}
                </h4>
              </div>
            ) : (
              <div className="space-y-3">
                {[...ownedBiz, ...memberBiz].map((b: any) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#123B5D] text-sm">{b.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                          <span>PAN: {b.pan_vat_number || '—'}</span>
                          {b.registration_number && <span>• Reg: {b.registration_number}</span>}
                          {b.city && <span>• {b.city}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {b.authorized_signatory_name && (
                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400">{isNe ? 'हस्ताक्षरकर्ता:' : 'Signatory:'}</span>{' '}
                          <span className="font-bold">{b.authorized_signatory_name}</span>
                        </div>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Change Password Modal ─── */}
        {mounted && showPasswordModal && user ? createPortal(
          <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-admin-page-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#123B5D]">
                      {isNe ? 'नयाँ पासवर्ड सेट गर्नुहोस्' : 'Set New User Password'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नयाँ पासवर्ड (कम्तिमा ६ वर्ण)' : 'New Password (min 6 chars)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {isNe ? 'रद्द' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-[#123B5D] hover:bg-[#0f2f4a] text-white transition cursor-pointer disabled:opacity-50"
                  >
                    {updatingPassword ? (isNe ? 'सुरक्षित गर्दै...' : 'Updating...') : (isNe ? 'पासवर्ड सुरक्षित गर्नुहोस्' : 'Update Password')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        ) : null}

        {/* ─── Vault Document Preview Modal (Portaled) ─── */}
        {mounted && previewDoc ? createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-admin-page-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#123B5D]">
                    {previewDoc.title || 'Document Preview'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {previewDoc.document_type} {previewDoc.document_number ? `• No: ${previewDoc.document_number}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.file_path.startsWith('http') ? previewDoc.file_path : `/storage/${previewDoc.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isNe ? 'डाउनलोड' : 'Download'}</span>
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-100/50 min-h-[300px]">
                {previewDoc.file_path && previewDoc.file_path.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.file_path.startsWith('http') ? previewDoc.file_path : `/storage/${previewDoc.file_path}`}
                    className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
                    title={previewDoc.title}
                  />
                ) : (
                  <img
                    src={previewDoc.file_path.startsWith('http') ? previewDoc.file_path : `/storage/${previewDoc.file_path}`}
                    alt={previewDoc.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        ) : null}
      </div>
    </AdminShell>
  );
}

