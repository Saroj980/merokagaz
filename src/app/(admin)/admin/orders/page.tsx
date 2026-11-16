'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, Order, formatCurrency } from '@/lib/api';
import toast, { alertModal } from '@/lib/toast';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Phone,
  Calendar,
  X,
  Eye,
  ShieldCheck,
  Building2,
  Copy,
  ExternalLink,
  Download,
  CreditCard,
  Layers,
  Sparkles,
  TrendingUp,
  Wallet,
  LayoutGrid,
  List,
} from 'lucide-react';

interface AnalyticsData {
  total_orders: number;
  total_docs_generated: number;
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
  paid_count: number;
  pending_approval_count: number;
}

export default function AdminOrdersPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [token, setToken] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // View Mode: 'grouped' (Date-wise) or 'flat' (Simple list)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Detail Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Approval Modal
  const [approvingOrder, setApprovingOrder] = useState<Order | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<'cash' | 'bank_transfer' | 'admin_waiver'>('cash');
  const [approvalRefNo, setApprovalRefNo] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mk_admin_token') || localStorage.getItem('mero_kagaz_admin_token') || '';
    setToken(stored);
  }, []);

  async function loadOrders(page = 1) {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = { page };
      if (search.trim()) params.search = search.trim();
      if (selectedStatus === 'pending_approval') params.payment_status = 'pending_approval';
      else if (selectedStatus === 'paid') params.payment_status = 'paid';
      else if (selectedStatus === 'unpaid') params.payment_status = 'unpaid';

      const res: any = await api.admin.orders.list(token, params);
      const items = Array.isArray(res) ? res : (res?.data || []);
      setOrders(items);
      if (res?.analytics) {
        setAnalytics(res.analytics);
      }
      if (res?.meta) {
        setPagination({
          current_page: res.meta.current_page || 1,
          last_page: res.meta.last_page || 1,
          total: res.meta.total || 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'अर्डरहरू लोड गर्न असफल भयो।' : 'Failed to load orders.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, selectedStatus]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadOrders(1);
  }

  // Open Approval Modal
  function openApproveModal(order: Order) {
    setApprovingOrder(order);
    setApprovalMethod('cash');
    setApprovalRefNo(`ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setApprovalNotes('');
  }

  // Confirm Approval & Entry of Payment
  async function handleConfirmApproval(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingOrder) return;

    setApprovalSubmitting(true);
    try {
      await api.admin.orders.approvePayment(token, String(approvingOrder.id), {
        payment_method: approvalMethod,
        reference_no: approvalRefNo.trim(),
        amount: Number(approvingOrder.total) || 0,
        notes: approvalNotes.trim() || undefined,
      });

      toast.success(
        isNe
          ? `अर्डर #${approvingOrder.public_order_no} को भुक्तानी स्वीकृत भयो र कागजात डाउनलोड खुला भयो!`
          : `Order #${approvingOrder.public_order_no} payment approved and download unlocked!`
      );

      setApprovingOrder(null);
      loadOrders(pagination.current_page);
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'भुक्तानी स्वीकृत गर्न असफल भयो।' : 'Failed to approve payment.'));
    } finally {
      setApprovalSubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(isNe ? 'अर्डर नम्बर कपी गरियो!' : 'Order number copied!');
  }

  // Computed analytics with fallbacks
  const computedAnalytics = useMemo(() => {
    const totalOrders = analytics?.total_orders ?? (pagination.total || orders.length);
    const totalDocsGenerated = analytics?.total_docs_generated ?? totalOrders;
    const totalAmount = analytics?.total_amount ?? orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const collectedAmount = analytics?.collected_amount ?? orders
      .filter((o) => o.payment_status === 'paid' || o.download_ready)
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingAmount = analytics?.pending_amount ?? orders
      .filter((o) => o.payment_status === 'pending_approval' || o.payment_status === 'unpaid')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingApprovalCount = analytics?.pending_approval_count ?? orders.filter((o) => o.payment_status === 'pending_approval').length;
    const paidCount = analytics?.paid_count ?? orders.filter((o) => o.payment_status === 'paid' || o.download_ready).length;

    return {
      totalOrders,
      totalDocsGenerated,
      totalAmount,
      collectedAmount,
      pendingAmount,
      pendingApprovalCount,
      paidCount,
    };
  }, [analytics, orders, pagination.total]);

  // Group orders by Date Key (YYYY-MM-DD)
  const dateGroups = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    orders.forEach((ord) => {
      const dateKey = ord.created_at ? ord.created_at.split('T')[0] : 'undated';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ord);
    });

    const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    const todayStr = new Date().toISOString().split('T')[0];
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = yDate.toISOString().split('T')[0];

    return sortedDateKeys.map((dateKey) => {
      const groupOrders = groups[dateKey];
      const count = groupOrders.length;
      const groupTotal = groupOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const groupCollected = groupOrders
        .filter((o) => o.payment_status === 'paid' || o.download_ready)
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      let title = dateKey;
      let subtitle = '';
      let isToday = false;
      let isYesterday = false;

      if (dateKey === 'undated') {
        title = isNe ? 'मिति नखुलेका अर्डरहरू' : 'Undated Orders';
      } else {
        const d = new Date(dateKey + 'T00:00:00');
        const formattedEn = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        subtitle = formattedEn;

        if (dateKey === todayStr) {
          title = isNe ? 'आज (Today)' : 'Today';
          isToday = true;
        } else if (dateKey === yStr) {
          title = isNe ? 'हिजो (Yesterday)' : 'Yesterday';
          isYesterday = true;
        } else {
          title = formattedEn;
          subtitle = dateKey;
        }
      }

      return {
        dateKey,
        title,
        subtitle,
        isToday,
        isYesterday,
        orders: groupOrders,
        count,
        groupTotal,
        groupCollected,
      };
    });
  }, [orders, isNe]);

  // Render a single Order table row
  function renderOrderRow(ord: Order, showTimeOnly = false) {
    const docName = isNe && ord.document?.name_np ? ord.document.name_np : (ord.document?.name || 'Document');
    
    // Resolve Customer Name (registered user has highest precedence)
    const isRegistered = Boolean(ord.user);
    const applicantName = (isNe ? (ord.user?.name_np || ord.user?.name) : (ord.user?.name || ord.user?.name_np)) ||
      ord.form_data?.['applicant_name_np'] ||
      ord.form_data?.['applicant_name'] ||
      ord.form_data?.['applicant.full_name'] ||
      ord.form_data?.['full_name'] ||
      ord.form_data?.['full_name_np'] ||
      ord.form_data?.['name'] ||
      ord.form_data?.['director.full_name'] ||
      ord.form_data?.['client_name'] ||
      (isNe ? 'आवेदक' : 'Applicant');

    const applicantContact = ord.user?.phone ||
      ord.form_data?.['applicant.phone'] ||
      ord.form_data?.['phone'] ||
      ord.form_data?.['mobile'] ||
      ord.user?.email ||
      '-';

    const isPaid = ord.payment_status === 'paid' || ord.download_ready;
    const isPendingApproval = ord.payment_status === 'pending_approval';
    const viewDocUrl = `/api/v1/downloads/${ord.download_token || 'latest'}?order=${ord.public_order_no}`;

    const dateObj = ord.created_at ? new Date(ord.created_at) : null;
    const timeFormatted = dateObj
      ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '-';
    const dateFormatted = dateObj ? dateObj.toLocaleDateString() : '-';

    return (
      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
        {/* Order No */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B5D]">
            <span>#{ord.public_order_no}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(ord.public_order_no)}
              className="text-slate-400 hover:text-slate-700 transition"
              title="Copy Order No"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </td>

        {/* Document */}
        <td className="px-5 py-3.5">
          <span className="font-bold text-[#123B5D] line-clamp-1" title={docName}>
            {docName}
          </span>
        </td>

        {/* Customer Info */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {isRegistered ? (
              <a
                href={`/admin/users/${ord.user?.public_id || ord.user?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-800 font-bold hover:text-[#18A999] hover:underline transition inline-flex items-center gap-1"
                title={ord.user?.email}
              >
                <span>{applicantName}</span>
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <User className="h-2.5 w-2.5" />
                  <span>{isNe ? 'दर्ता' : 'User'}</span>
                </span>
              </a>
            ) : (
              <span className="text-slate-800 font-semibold">{applicantName}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="h-2.5 w-2.5 text-slate-300" />
            <span>{applicantContact}</span>
          </div>
        </td>

        {/* Amount */}
        <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[#148C7E] font-outfit">
          {formatCurrency(ord.total, isNe)}
        </td>

        {/* Payment Status Badge */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>{isNe ? 'चुक्ता (Paid)' : 'Paid & Verified'}</span>
            </span>
          ) : isPendingApproval ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold border border-amber-300 animate-pulse">
              <Clock className="h-3 w-3 text-amber-700" />
              <span>{isNe ? 'प्रमाणीकरण बाँकी' : 'Pending Approval'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-bold border border-slate-200">
              <span>{isNe ? 'बाँकी (Unpaid)' : 'Unpaid'}</span>
            </span>
          )}
        </td>

        {/* Date / Time */}
        <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-500 font-mono">
          {showTimeOnly ? timeFormatted : dateFormatted}
        </td>

        {/* Actions */}
        <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
          {/* Direct View Document Button */}
          <a
            href={viewDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-2.5 py-1 text-[11px] font-bold text-[#148C7E] shadow-2xs hover:bg-teal-100/90 hover:text-[#0f6b60] transition cursor-pointer"
            title={isNe ? 'कागजात हेर्नुहोस् (PDF / Print)' : 'View Generated Document'}
          >
            <FileText className="h-3 w-3 text-[#18A999]" />
            <span>{isNe ? 'कागजात' : 'View Doc'}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>

          {/* Approve Payment button (for pending_approval or unpaid) */}
          {!isPaid && (
            <button
              type="button"
              onClick={() => openApproveModal(ord)}
              className="widget-click inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
              title={isNe ? 'भुक्तानी स्वीकृत गरी कागजात खुल्ला गर्नुहोस्' : 'Approve payment & unlock document'}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>{isNe ? 'स्वीकृत' : 'Approve'}</span>
            </button>
          )}

          {/* View Order Details Modal */}
          <button
            type="button"
            onClick={() => setViewingOrder(ord)}
            className="widget-click inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="h-3 w-3 text-slate-500" />
            <span>{isNe ? 'विवरण' : 'Details'}</span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#123B5D] font-outfit">
              {isNe ? 'अर्डर तथा भुक्तानी व्यवस्थापन' : 'Orders & Payment Management'}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {isNe
                ? 'ग्राहकका अनलाइन फारम, कागजात उत्पादन, मिति अनुसार अर्डर समूह र भुक्तानी विश्लेषण।'
                : 'Customer orders, document generation, date-wise grouped views, and revenue analytics.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadOrders(pagination.current_page)}
              disabled={loading}
              className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>{isNe ? 'रिफ्रेस' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* ─── ENHANCED ANALYTICS CARDS (User Requested) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Docs Generated / Total Orders */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {isNe ? 'कागजात उत्पादन (Docs Generated)' : 'Docs Generated'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#18A999]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-[#123B5D] font-outfit">
              {computedAnalytics.totalDocsGenerated}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {isNe ? `कुल ${computedAnalytics.totalOrders} अर्डरहरू दर्ता` : `From ${computedAnalytics.totalOrders} total orders`}
            </p>
          </div>

          {/* 2. Total Order Value (Gross Amount) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {isNe ? 'कुल कारोबार रकम (Total Amount)' : 'Total Amount'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-[#123B5D] font-outfit">
              {formatCurrency(computedAnalytics.totalAmount, isNe)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {isNe ? 'सबै सिर्जना गरिएका अर्डरहरूको कुल मूल्य' : 'Total gross value of all orders'}
            </p>
          </div>

          {/* 3. Total Collection (Paid & Verified) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">
                {isNe ? 'कुल संकलन (Total Collection)' : 'Total Collected'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 font-outfit">
              {formatCurrency(computedAnalytics.collectedAmount, isNe)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <span>●</span>
              <span>{isNe ? `${computedAnalytics.paidCount} अर्डर चुक्ता सम्पन्न` : `${computedAnalytics.paidCount} paid orders`}</span>
            </div>
          </div>

          {/* 4. Pending Collection Amount */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">
                {isNe ? 'बाँकी संकलन रकम (Pending)' : 'Pending Amount'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-700 font-outfit">
              {formatCurrency(computedAnalytics.pendingAmount, isNe)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              {computedAnalytics.pendingApprovalCount > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping mr-0.5" />
              )}
              <span>
                {isNe
                  ? `${computedAnalytics.pendingApprovalCount} अर्डर प्रमाणीकरण बाँकी`
                  : `${computedAnalytics.pendingApprovalCount} awaiting approval`}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SEARCH, FILTER & VIEW MODE CONTROLS ─── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: isNe ? 'सबै' : 'All' },
              { id: 'pending_approval', label: isNe ? 'प्रमाणीकरण बाँकी' : 'Pending Approval' },
              { id: 'paid', label: isNe ? 'चुक्ता (Paid)' : 'Paid' },
              { id: 'unpaid', label: isNe ? 'भुक्तानी बाँकी' : 'Unpaid' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`widget-click whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#123B5D] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Date Grouped vs Flat List */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`widget-click inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-[#123B5D] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isNe ? 'मिति अनुसार समूहबद्ध दृश्य' : 'Date-wise grouped view'}
              >
                <Calendar className="h-3.5 w-3.5 text-[#18A999]" />
                <span className="hidden sm:inline">{isNe ? 'मिति अनुसार समूह' : 'Date Grouped'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`widget-click inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-white text-[#123B5D] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isNe ? 'साधारण सीधा तालिका' : 'Flat list view'}
              >
                <List className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">{isNe ? 'सीधा सूची' : 'Flat List'}</span>
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isNe ? 'अर्डर नं, नाम वा फोन...' : 'Search order #, name...'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-none"
              />
            </form>
          </div>
        </div>

        {/* ─── ORDERS CONTENT (Grouped by Date OR Flat Table) ─── */}
        {loading && orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
            <RefreshCw className="h-7 w-7 text-[#18A999] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isNe ? 'अर्डरहरू लोड हुँदैछ...' : 'Loading orders...'}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
            <span className="text-4xl">📦</span>
            <h3 className="mt-3 text-sm font-bold text-[#123B5D]">
              {isNe ? 'कुनै अर्डर भेटिएन' : 'No Orders Found'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isNe ? 'तपाईंको खोजी अनुसार कुनै अर्डर फेला परेन।' : 'No customer orders match your search filter.'}
            </p>
          </div>
        ) : viewMode === 'grouped' ? (
          /* ─── DATE-WISE GROUPED VIEW ─── */
          <div className="space-y-4">
            {dateGroups.map((group) => (
              <div
                key={group.dateKey}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Date Group Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-teal-50/20 to-white px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-xs ${
                        group.isToday
                          ? 'bg-[#18A999] text-white'
                          : group.isYesterday
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#123B5D]">{group.title}</span>
                        {group.isToday && (
                          <span className="rounded-full bg-teal-100 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#148C7E]">
                            {isNe ? 'आजका अर्डरहरू' : "Today's Orders"}
                          </span>
                        )}
                        {group.isYesterday && (
                          <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {isNe ? 'हिजोका अर्डरहरू' : "Yesterday"}
                          </span>
                        )}
                      </div>
                      {group.subtitle && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{group.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Group Badges (Count + Subtotal) */}
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {isNe ? `${group.count} वटा अर्डर` : `${group.count} orders`}
                    </span>
                    <span className="rounded-lg bg-teal-50 border border-teal-200/80 px-2.5 py-1 text-xs font-bold text-[#148C7E] font-outfit">
                      {isNe ? `जम्मा: ${formatCurrency(group.groupTotal, isNe)}` : `Total: ${formatCurrency(group.groupTotal, isNe)}`}
                    </span>
                  </div>
                </div>

                {/* Orders in this Date Group */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-2.5"># Order Number</th>
                        <th className="px-5 py-2.5">{isNe ? 'कागजात' : 'Document'}</th>
                        <th className="px-5 py-2.5">{isNe ? 'ग्राहक विवरण' : 'Customer Info'}</th>
                        <th className="px-5 py-2.5">{isNe ? 'रकम' : 'Amount'}</th>
                        <th className="px-5 py-2.5">{isNe ? 'भुक्तानी स्थिति' : 'Payment Status'}</th>
                        <th className="px-5 py-2.5">{isNe ? 'समय' : 'Time'}</th>
                        <th className="px-5 py-2.5 text-right">{isNe ? 'कार्यहरू' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.orders.map((ord) => renderOrderRow(ord, true))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── FLAT TABLE VIEW ─── */
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5"># Order Number</th>
                    <th className="px-5 py-3.5">{isNe ? 'कागजात' : 'Document'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'ग्राहक विवरण' : 'Customer Info'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'रकम' : 'Amount'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'भुक्तानी स्थिति' : 'Payment Status'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'मिति' : 'Date'}</th>
                    <th className="px-5 py-3.5 text-right">{isNe ? 'कार्यहरू' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => renderOrderRow(ord, false))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── MODAL: APPROVE PAYMENT BY ADMIN ─── */}
        {mounted && approvingOrder && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {isNe ? 'प्रशासकबाट भुक्तानी स्वीकृत' : 'Approve Payment & Unlock Document'}
                    </h3>
                    <p className="font-mono text-[11px] text-[#18A999] font-semibold">
                      #{approvingOrder.public_order_no}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovingOrder(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmApproval} className="p-6 space-y-4">
                <div className="rounded-2xl bg-teal-50/60 border border-teal-100 p-3.5 text-xs text-[#123B5D] flex items-center justify-between">
                  <span>{isNe ? 'स्वीकृत हुने कुल रकम:' : 'Total Amount to Approve:'}</span>
                  <span className="text-base font-black text-[#148C7E] font-outfit">
                    {formatCurrency(approvingOrder.total, isNe)}
                  </span>
                </div>

                {/* Payment Method Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isNe ? 'भुक्तानी विधि छान्नुहोस् *' : 'Payment Received Via *'}
                  </label>
                  <CustomSelect
                    value={approvalMethod}
                    onChange={(val) => setApprovalMethod(val as any)}
                    options={[
                      { value: 'cash', label: isNe ? 'नगद भुक्तानी (Cash In Hand)' : 'Cash in Hand' },
                      { value: 'bank_transfer', label: isNe ? 'बैंक भौचर / काउन्टर जम्मा (Bank Voucher)' : 'Bank Transfer / Voucher' },
                      { value: 'admin_waiver', label: isNe ? 'प्रशासकीय छुट / नि:शुल्क (Admin Waiver)' : 'Official Admin Waiver' },
                    ]}
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isNe ? 'भौचर / रसिद नम्बर (Reference No)' : 'Voucher / Reference No.'}
                  </label>
                  <input
                    type="text"
                    value={approvalRefNo}
                    onChange={(e) => setApprovalRefNo(e.target.value)}
                    placeholder="e.g. VOUCHER-9841"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 font-mono focus:border-[#18A999] focus:outline-none"
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isNe ? 'प्रशासक कैफियत (Notes / Remarks)' : 'Admin Approval Remarks'}
                  </label>
                  <textarea
                    rows={2}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder={isNe ? 'उदा: बैंक भौचर प्रमाणित गरियो।' : 'e.g. Verified bank slip and authorized print.'}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#18A999] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovingOrder(null)}
                    className="widget-click rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {isNe ? 'रद्द' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={approvalSubmitting}
                    className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                  >
                    {approvalSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>{isNe ? 'स्वीकृत हुँदैछ...' : 'Approving...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isNe ? 'प्रमाणीकरण तथा डाउनलोड खुल्ला गर्नुहोस्' : 'Confirm & Unlock Download'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ─── MODAL: ORDER DETAILS ─── */}
        {mounted && viewingOrder && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'अर्डर विवरण' : 'Order Details'}
                  </h3>
                  <p className="font-mono text-xs text-[#18A999] font-bold">
                    #{viewingOrder.public_order_no}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Status overview */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Payment Status</span>
                    <p className="font-bold text-slate-800 capitalize mt-0.5">{viewingOrder.payment_status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Fee</span>
                    <p className="font-bold text-[#148C7E] font-outfit mt-0.5">{formatCurrency(viewingOrder.total, isNe)}</p>
                  </div>
                </div>

                {/* Registered User Card (if created by registered account) */}
                {viewingOrder.user && (
                  <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{isNe ? 'दर्ता भएको प्रयोगकर्ता (Registered Customer)' : 'Registered Customer Account'}</span>
                      </span>
                      <a
                        href={`/admin/users/${viewingOrder.user.public_id || viewingOrder.user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#148C7E] hover:underline"
                      >
                        <span>{isNe ? 'प्रयोगकर्ता विवरण' : 'View User'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="mt-2 text-xs">
                      <p className="font-bold text-slate-900">
                        {viewingOrder.user.name} {viewingOrder.user.name_np ? `(${viewingOrder.user.name_np})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                        {viewingOrder.user.email} {viewingOrder.user.phone ? `• ${viewingOrder.user.phone}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Direct Action Link to View Generated Document */}
                <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18A999] text-white shadow-xs">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#123B5D]">
                        {isNe ? 'उत्पादन गरिएको कागजात' : 'Generated Document View'}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {isNe ? 'कागजातलाई आधिकारिक ढाँचामा हेर्नुहोस् र प्रिन्ट गर्नुहोस्' : 'View or print official PDF document format'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/api/v1/downloads/${viewingOrder.download_token || 'latest'}?order=${viewingOrder.public_order_no}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#18A999] transition cursor-pointer"
                  >
                    <span>{isNe ? 'कागजात हेर्नुहोस्' : 'Open Document'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Submitted Answers */}
                <div>
                  <h4 className="font-bold text-[#123B5D] mb-2">
                    {isNe ? 'ग्राहकले भरेका फारमका विवरणहरू (Form Data):' : 'Submitted Customer Form Data:'}
                  </h4>
                  {viewingOrder.form_data && Object.keys(viewingOrder.form_data).length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {Object.entries(viewingOrder.form_data).map(([key, val]) => (
                        <div key={key} className="flex justify-between p-2.5 bg-white">
                          <span className="font-mono text-[11px] text-slate-500">{key}:</span>
                          <span className="font-semibold text-slate-800 text-right">{String(val || '-')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No custom form answers submitted.</p>
                  )}
                </div>

                {/* Notes */}
                {viewingOrder.notes && (
                  <div>
                    <h4 className="font-bold text-[#123B5D] mb-1">{isNe ? 'प्रणाली लग तथा कैफियत:' : 'Order Notes & Activity:'}</h4>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px] whitespace-pre-wrap">
                      {viewingOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between gap-2">
                <a
                  href={`/api/v1/downloads/${viewingOrder.download_token || 'latest'}?order=${viewingOrder.public_order_no}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3.5 py-2 text-xs font-bold text-[#148C7E] hover:bg-teal-50 transition cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-[#18A999]" />
                  <span>{isNe ? 'कागजात खोल्नुहोस्' : 'View Document'}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="widget-click rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isNe ? 'बन्द गर्नुहोस्' : 'Close'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminShell>
  );
}
