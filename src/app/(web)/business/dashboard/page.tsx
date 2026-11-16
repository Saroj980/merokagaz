'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import {
  api,
  BusinessItem,
  BusinessDashboardData,
  BusinessMemberItem,
} from '@/lib/api';
import { NepaliDateFilter, DateFilterValue } from '@/components/ui/NepaliDateFilter';
import { formatBsDate } from '@/lib/nepaliDate';
import {
  Building2,
  FileText,
  CreditCard,
  Users,
  Search,
  Filter,
  Download,
  PlusCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  ChevronDown,
  BarChart3,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { token, isLoggedIn, isLoaded, activeBusiness, businesses, setActiveBusiness } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  // Filters State
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: 'this_month',
    labelNe: 'यो महिना',
    labelEn: 'This Month',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'tracking' | 'analytics' | 'members'>('tracking');

  // Data State
  const [dashboardData, setDashboardData] = useState<BusinessDashboardData | null>(null);
  const [members, setMembers] = useState<BusinessMemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; success: boolean } | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);

    try {
      const data = await api.business.dashboard(
        activeBusiness.id,
        {
          date_preset: dateFilter.preset,
          start_date: dateFilter.startDate,
          end_date: dateFilter.endDate,
          search: searchQuery,
          status: statusFilter,
          payment_status: paymentFilter,
        },
        token || undefined
      );
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, dateFilter, searchQuery, statusFilter, paymentFilter, token]);

  const loadMembers = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const m = await api.business.members(activeBusiness.id, token || undefined);
      if (Array.isArray(m)) setMembers(m);
    } catch {}
  }, [activeBusiness, token]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, [isLoaded, isLoggedIn, loadDashboard, router]);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setInviting(true);
    setInviteMsg(null);

    try {
      await api.business.invite(activeBusiness.id, {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
      });
      setInviteMsg({
        text: isNe ? 'निमन्त्रणा सफलतापूर्वक पठाइयो।' : 'Invitation dispatched successfully.',
        success: true,
      });
      setInviteEmail('');
      setInviteName('');
      loadMembers();
    } catch (err: any) {
      setInviteMsg({
        text: err.message || (isNe ? 'निमन्त्रणा पठाउन असफल भयो।' : 'Failed to send invitation.'),
        success: false,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!activeBusiness) return;
    if (!confirm(isNe ? 'के तपाईं यो सदस्यलाई हटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to remove this member?')) return;

    try {
      await api.business.removeMember(activeBusiness.id, userId);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18A999]" />
        <p className="mt-3 text-xs font-semibold text-slate-500 font-outfit">
          {isNe ? 'ड्यासबोर्ड लोड हुँदैछ...' : 'Loading business dashboard...'}
        </p>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  // If user has no business, prompt to register one
  if (!activeBusiness && businesses.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999] mx-auto">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#123B5D]">
          {isNe ? 'कुनै व्यवसाय खाता फेला परेन' : 'No Business Account Found'}
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          {isNe
            ? 'आफ्नो कम्पनी, फर्म वा संस्थाको नाममा आधिकारिक सरकारी कागजातहरू सिर्जना तथा ट्र्याक गर्न अहिले नै नयाँ व्यवसाय दर्ता गर्नुहोस्।'
            : 'Register your business to generate, manage, and track verified company documents with isolated billing and team access.'}
        </p>
        <Link
          href="/business/register"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{isNe ? 'नयाँ व्यवसाय दर्ता गर्नुहोस्' : 'Register New Business'}</span>
        </Link>
      </div>
    );
  }

  const kpis = dashboardData?.kpis;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ─── Top Business Switcher & Header ─── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white text-2xl font-black shadow-md">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                {/* Business Switcher Dropdown */}
                {businesses.length > 1 ? (
                  <div className="relative inline-block">
                    <select
                      value={activeBusiness?.id}
                      onChange={(e) => {
                        const found = businesses.find((b) => b.id === Number(e.target.value));
                        if (found) setActiveBusiness(found);
                      }}
                      className="text-xl sm:text-2xl font-extrabold text-[#123B5D] bg-transparent border-b-2 border-teal-500 pr-8 py-0.5 focus:outline-hidden cursor-pointer"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#123B5D]">
                    {activeBusiness?.name}
                  </h1>
                )}

                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200 uppercase">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{activeBusiness?.my_role || 'Owner'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PAN/VAT: <span className="font-mono font-bold text-slate-700">{activeBusiness?.pan_vat_number || 'N/A'}</span> • {activeBusiness?.email}
              </p>
            </div>
          </div>

          {/* Date Filter & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <NepaliDateFilter value={dateFilter} onChange={setDateFilter} />

            <Link
              href="/business/register"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>{isNe ? 'अर्को व्यवसाय थप्नुहोस्' : 'Add Business'}</span>
            </Link>

            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{isNe ? 'कागजात सिर्जना गर्नुहोस्' : 'Generate Document'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Real-Time KPI Cards (Actual DB Metrics) ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
        {/* Total Documents */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isNe ? 'कुल कागजात' : 'Total Documents'}
            </span>
            <FileText className="h-4 w-4 text-[#18A999]" />
          </div>
          <div className="text-2xl font-black text-[#123B5D]">
            {kpis ? kpis.total_documents.toLocaleString() : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isNe ? `आज: ${kpis?.documents_today || 0} • यो हप्ता: ${kpis?.documents_this_week || 0}` : `Today: ${kpis?.documents_today || 0} • Week: ${kpis?.documents_this_week || 0}`}
          </div>
        </div>

        {/* Total Spending */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isNe ? 'कुल खर्च (प्रमाणित)' : 'Total Spending'}
            </span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            NPR {kpis ? kpis.total_spending.toLocaleString() : '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isNe ? `सफल भुक्तानी: ${kpis?.successful_payments_count || 0}` : `Verified: ${kpis?.successful_payments_count || 0} payments`}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isNe ? 'बाँकी भुक्तानी' : 'Pending Payments'}
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {kpis ? kpis.pending_payments_count : '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isNe ? 'अपुष्ट / प्रक्रियामा' : 'Unpaid invoices'}
          </div>
        </div>

        {/* Failed Orders */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isNe ? 'असफल कारोबार' : 'Failed Transactions'}
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {kpis ? kpis.failed_payments_count : '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isNe ? 'आयमा गणना नगरिएको' : 'Excluded from revenue'}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tracking'
              ? 'bg-[#123B5D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{isNe ? 'कागजात तथा भुक्तानी ट्र्याकिङ' : 'Documents & Payment Tracking'}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#123B5D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{isNe ? 'कागजात प्रयोग विश्लेषण' : 'Document Usage Analytics'}</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-[#123B5D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{isNe ? 'टोली सदस्यहरू' : 'Team Members'}</span>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
            {members.length || activeBusiness?.total_members || 1}
          </span>
        </button>
      </div>

      {/* ─── Tab 1: Documents & Payment Tracking ─── */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isNe ? 'कागजात वा अर्डर नम्बर खोज्नुहोस्...' : 'Search order number or document...'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="">{isNe ? 'सबै भुक्तानी स्थिति' : 'All Payments'}</option>
                <option value="paid">{isNe ? 'सफल (Paid)' : 'Paid'}</option>
                <option value="unpaid">{isNe ? 'बाँकी (Unpaid)' : 'Unpaid'}</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="">{isNe ? 'सबै कागजात स्थिति' : 'All Status'}</option>
                <option value="completed">{isNe ? 'सम्पन्न (Completed)' : 'Completed'}</option>
                <option value="processing">{isNe ? 'प्रक्रियामा (Processing)' : 'Processing'}</option>
                <option value="failed">{isNe ? 'असफल (Failed)' : 'Failed'}</option>
              </select>

              <button
                onClick={loadDashboard}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#18A999] mb-2" />
                <span>{isNe ? 'लोड हुँदैछ...' : 'Loading business data...'}</span>
              </div>
            ) : !dashboardData || dashboardData.orders.items.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <span>{isNe ? 'कुनै रेकर्ड फेला परेन।' : 'No records match your filters.'}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5"># Order No</th>
                      <th className="px-6 py-3.5">{isNe ? 'कागजात' : 'Document'}</th>
                      <th className="px-6 py-3.5">{isNe ? 'सिर्जनाकर्ता' : 'Created By'}</th>
                      <th className="px-6 py-3.5">{isNe ? 'मूल्य' : 'Charged Price'}</th>
                      <th className="px-6 py-3.5">{isNe ? 'भुक्तानी' : 'Payment'}</th>
                      <th className="px-6 py-3.5">{isNe ? 'रेफरेन्स' : 'Payment Ref'}</th>
                      <th className="px-6 py-3.5">{isNe ? 'मिति (BS / AD)' : 'Date'}</th>
                      <th className="px-6 py-3.5 text-right">{isNe ? 'डाउनलोड' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.orders.items.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-[#123B5D]">
                          {order.public_order_no}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {isNe ? order.document_name_np : order.document_name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {order.created_by}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          NPR {order.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                          {order.payment_reference || '—'}
                        </td>
                        <td className="px-6 py-4 text-[11px] text-slate-500">
                          <div>{formatBsDate(order.created_at, 'YYYY MMMM DD', isNe ? 'ne' : 'en')}</div>
                          <div className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.download_url ? (
                            <a
                              href={order.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#18A999] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#148C7E]"
                            >
                              <Download className="h-3 w-3" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {order.payment_status === 'paid' ? 'Processing' : 'Unpaid'}
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
        </div>
      )}

      {/* ─── Tab 2: Document Usage Analytics ─── */}
      {activeTab === 'analytics' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-[#123B5D]">
            {isNe ? 'यस व्यवसायमा सबैभन्दा धेरै सिर्जना गरिएका कागजातहरू' : 'Top Documents Generated by Business'}
          </h3>

          {!dashboardData?.document_usage || dashboardData.document_usage.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {isNe ? 'चयन गरिएको मितिमा कुनै कागजात प्रयोग गरिएको छैन।' : 'No document usage in this period.'}
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.document_usage.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100 text-[#18A999] text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{isNe ? item.name_np : item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.count} {isNe ? 'पटक सिर्जना' : 'generated'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">NPR {item.total_spent.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">{isNe ? 'खर्च' : 'Spent'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 3: Team Members & Invitations ─── */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#123B5D]">
              {isNe ? 'टोली सदस्य तथा भूमिका व्यवस्थापन' : 'Team Members & Permissions'}
            </h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0E2E4A]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isNe ? 'नयाँ सदस्यलाई निम्तो दिनुहोस्' : 'Invite Member'}</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5">{isNe ? 'सदस्य' : 'Member'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'भूमिका' : 'Role'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'सामेल भएको मिति' : 'Joined Date'}</th>
                    <th className="px-6 py-3.5 text-right">{isNe ? 'कार्य' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500">{m.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          m.role === 'owner'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : m.role === 'admin'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {m.joined_at ? formatBsDate(m.joined_at, 'YYYY MMMM DD', isNe ? 'ne' : 'en') : 'Pending'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Invite Member Modal ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-[#123B5D]">
              {isNe ? 'व्यवसाय टोलीमा नयाँ सदस्य थप्नुहोस्' : 'Invite Team Member'}
            </h3>
            <p className="text-xs text-slate-500">
              {isNe
                ? 'उहाँको इमेलमा आधिकारिक निमन्त्रणा लिंक पठाइनेछ।'
                : 'An official invitation link will be dispatched to their email.'}
            </p>

            {inviteMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                inviteMsg.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {inviteMsg.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{inviteMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'सदस्यको नाम (वैकल्पिक)' : 'Member Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Shyam Karki"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'इमेल ठेगाना' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'भूमिका' : 'Role'}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                >
                  <option value="member">{isNe ? 'सदस्य (कागजात बनाउन सक्ने)' : 'Member (Can generate documents)'}</option>
                  <option value="admin">{isNe ? 'प्रशासक (सदस्य थप्न र सबै हेर्न सक्ने)' : 'Admin (Full access)'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isNe ? 'बन्द गर्नुहोस्' : 'Close'}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl bg-[#123B5D] text-xs font-bold text-white shadow-xs hover:bg-[#0E2E4A]"
                >
                  {inviting ? (isNe ? 'पठाउँदै...' : 'Sending...') : (isNe ? 'निमन्त्रणा पठाउनुहोस्' : 'Send Invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
