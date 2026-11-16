'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { api, Order, formatCurrency } from '@/lib/api';
import toast from '@/lib/toast';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  RefreshCw,
  AlertCircle,
  FileCheck,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';

function CheckoutContent() {
  const params = useSearchParams();
  const orderNo = params.get('order_no') || params.get('order') || params.get('orderNo') || params.get('public_order_no') || params.get('id');
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order data
  async function loadOrder(isSilent = false) {
    if (!orderNo) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.orders.get(orderNo);
      setOrder(res);
    } catch (err: any) {
      setError(err.message || (isNe ? 'अर्डर विवरण लोड गर्न सकिएन।' : 'Failed to load order details.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderNo]);

  // Request Admin Approval / Offline Payment
  async function handleRequestAdminApproval() {
    if (!orderNo) return;
    setSubmittingApproval(true);
    try {
      const res = await api.orders.requestApproval(orderNo);
      setOrder(res.data);
      toast.success(
        isNe
          ? 'अर्डर प्रशासक प्रमाणीकरणका लागि पेश भयो!'
          : 'Order submitted for Admin verification & approval!'
      );
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'प्रमाणीकरण अनुरोध गर्न सकिएन।' : 'Failed to request admin approval.'));
    } finally {
      setSubmittingApproval(false);
    }
  }

  if (!orderNo) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center max-w-md mx-auto shadow-xs">
        <p className="text-sm font-bold text-rose-700">
          {isNe ? 'अर्डर नम्बर फेला परेन।' : 'Order tracking number missing.'}
        </p>
        <Link
          href="/documents"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#123B5D] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isNe ? 'कागजात सूचीमा फर्कनुहोस्' : 'Return to Documents'}</span>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md card-elevate rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <RefreshCw className="h-7 w-7 text-[#18A999] animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">
          {isNe ? 'अर्डर विवरणहरू लोड हुँदैछ...' : 'Loading order details...'}
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-xs">
        <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
        <p className="text-xs font-bold text-rose-800">{error}</p>
        <button
          onClick={() => loadOrder()}
          className="mt-4 widget-click rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          {isNe ? 'पुन: प्रयास गर्नुहोस्' : 'Try Again'}
        </button>
      </div>
    );
  }

  const isPaid = order?.payment_status === 'paid' || order?.download_ready;
  const isPendingApproval = order?.payment_status === 'pending_approval';
  const docName = isNe && order?.document?.name_np ? order.document.name_np : (order?.document?.name || (isNe ? 'कागजात सिर्जना' : 'Document Generation'));
  const subtotal = order?.subtotal ?? 150;
  const total = order?.total ?? 150;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* ─── ORDER SUMMARY CARD ─── */}
      <div className="card-elevate rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isNe ? 'अर्डर सारांश' : 'Order Summary'}
            </span>
            <h2 className="text-sm font-extrabold text-[#123B5D] mt-0.5">
              {docName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-mono text-xs font-semibold text-[#18A999]">
                #{order?.public_order_no || orderNo}
              </p>
              <Link
                href={`/documents/${order?.document_slug || order?.document?.slug || 'generic'}/form?order=${order?.public_order_no || orderNo}`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:border-[#18A999] hover:text-[#18A999] hover:bg-teal-50/50 transition shadow-2xs"
                title="Edit submitted details"
              >
                <Edit3 className="h-3 w-3" />
                <span>{isNe ? 'विवरण सम्पादन' : 'Edit Details'}</span>
              </Link>
            </div>
          </div>

          <div className="text-right">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>{isNe ? 'भुक्तान प्रमाणित' : 'Paid & Verified'}</span>
              </span>
            ) : isPendingApproval ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                <span>{isNe ? 'प्रमाणीकरण बाँकी' : 'Pending Approval'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                <span>{isNe ? 'भुक्तानी बाँकी' : 'Awaiting Payment'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Pricing Rows */}
        <div className="my-5 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>{isNe ? 'कागजात सिर्जना शुल्क' : 'Official Document Fee'}</span>
            <span className="font-semibold text-slate-800 font-outfit">
              {formatCurrency(subtotal, isNe)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{isNe ? 'प्रणाली सेवा तथा प्रमाणीकरण' : 'Service & Verification Fee'}</span>
            <span className="font-semibold text-emerald-600 font-outfit">
              {isNe ? 'निःशुल्क' : 'Free'}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-[#123B5D]">
            <span>{isNe ? 'कुल जम्मा' : 'Total Payable'}</span>
            <span className="text-base text-[#18A999] font-outfit font-black">
              {formatCurrency(total, isNe)}
            </span>
          </div>
        </div>

        {/* ─── STATE 1: ALREADY PAID / APPROVED ─── */}
        {isPaid && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950">
              {isNe ? 'भुक्तानी स्वीकृत तथा कागजात तयार!' : 'Payment Approved & Document Ready!'}
            </h3>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              {isNe
                ? 'तपाईंको कागजात सफलतापूर्वक प्रमाणीकरण भइसकेको छ। अब तपाईं आधिकारिक PDF डाउनलोड गर्न सक्नुहुन्छ।'
                : 'Your order has been officially verified. Your official print-ready PDF is ready for immediate download.'}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
              <a
                href={`/api/v1/downloads/${order?.download_token || 'latest'}?order=${order?.public_order_no}`}
                target="_blank"
                rel="noreferrer"
                className="btn-shimmer widget-click inline-flex items-center justify-center gap-2 rounded-2xl bg-[#18A999] px-6 py-3 text-xs font-bold text-white shadow-md shadow-teal-500/25 hover:bg-[#148C7E]"
              >
                <Download className="h-4 w-4" />
                <span>{isNe ? 'आधिकारिक PDF डाउनलोड गर्नुहोस्' : 'Download Official PDF'}</span>
              </a>

              <button
                type="button"
                onClick={() => loadOrder(true)}
                disabled={refreshing}
                className="widget-click inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{isNe ? 'स्थिति ताजा गर्नुहोस्' : 'Refresh'}</span>
              </button>
            </div>

            <div className="mt-4 pt-3.5 border-t border-emerald-200/70 flex items-center justify-center">
              <Link
                href={`/documents/${order?.document_slug || order?.document?.slug || 'generic'}/form?order=${order?.public_order_no || orderNo}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B5D] hover:text-[#18A999] transition py-1 px-3 rounded-lg hover:bg-emerald-100/50"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#18A999]" />
                <span>{isNe ? 'कागजातको विवरण सम्पादन गर्नुहोस् (Edit Document Details)' : 'Edit Document Details'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* ─── STATE 2: PENDING ADMIN APPROVAL ─── */}
        {!isPaid && isPendingApproval && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-amber-950">
              {isNe ? 'प्रशासकको प्रमाणीकरणको प्रतीक्षामा' : 'Awaiting Administrator Approval'}
            </h3>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed max-w-sm mx-auto">
              {isNe
                ? 'तपाईंको अर्डर सुरक्षित दर्ता भएको छ। हाम्रा प्रशासकले अफलाइन भुक्तानी वा बैंक भौचर प्रमाणीकरण गरेपछि तपाईंको कागजात डाउनलोडका लागि खुल्नेछ।'
                : 'Your order has been recorded for offline verification. Once our administrator approves the payment, your document will be ready here.'}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-white border border-amber-200 text-left space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">{isNe ? 'ट्र्याकिङ अर्डर नं:' : 'Tracking Order #:'}</span>
                <span className="font-bold text-[#123B5D]">#{order?.public_order_no}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">{isNe ? 'भुक्तानी विधि:' : 'Payment Mode:'}</span>
                <span className="font-semibold text-amber-800">{isNe ? 'अफलाइन / प्रशासक स्वीकृति' : 'Offline / Admin Approval'}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => loadOrder(true)}
                disabled={refreshing}
                className="widget-click inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#123B5D] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0e2c46] cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{isNe ? 'प्रमाणीकरण स्थिति जाँच गर्नुहोस्' : 'Check Approval Status'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── STATE 3: UNPAID — CHOOSE PAYMENT OR ADMIN APPROVAL ─── */}
        {!isPaid && !isPendingApproval && (
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isNe ? 'भुक्तानी विधि वा प्रमाणीकरण छनोट गर्नुहोस्' : 'Select Payment or Verification Option'}
            </p>

            {/* Option 1: eSewa */}
            <button
              type="button"
              className="widget-click flex w-full items-center justify-between rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 p-3.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/60 shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🟢</span>
                <span>{isNe ? 'eSewa मार्फत भुक्तानी' : 'Pay with eSewa'}</span>
              </div>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white font-outfit">Instant</span>
            </button>

            {/* Option 2: Khalti */}
            <button
              type="button"
              className="widget-click flex w-full items-center justify-between rounded-2xl border-2 border-purple-500/40 bg-purple-50/50 p-3.5 text-xs font-bold text-purple-800 transition hover:bg-purple-100/60 shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🟣</span>
                <span>{isNe ? 'Khalti मार्फत भुक्तानी' : 'Pay with Khalti'}</span>
              </div>
              <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] text-white font-outfit">Instant</span>
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">
                  {isNe ? 'वा अफलाइन / म्यानुअल विकल्प' : 'OR OFFLINE / MANUAL OPTION'}
                </span>
              </div>
            </div>

            {/* Option 3: Skip Online Payment / Admin Approval */}
            <div className="rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-sky-50/80 to-blue-50/40 p-4 transition shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'प्रशासकबाट स्वीकृत (अफलाइन भुक्तानी)' : 'Direct Admin Approval / Offline Payment'}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {isNe
                        ? 'अनलाइन भुक्तानी नगरी अर्डर सुरक्षित राख्नुहोस्। बैंक भौचर वा नगद प्रमाणीकरणपछि प्रशासकले कागजात खुला गर्नेछन्।'
                        : 'Skip online payment. Submit order for offline counter/voucher verification by administrator.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestAdminApproval}
                  disabled={submittingApproval}
                  className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0e2c46] disabled:opacity-60 cursor-pointer"
                >
                  {submittingApproval ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>{isNe ? 'अनुरोध पेश हुँदैछ...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isNe ? 'प्रशासक प्रमाणीकरणका लागि पेश गर्नुहोस्' : 'Request Admin Approval (Skip Payment)'}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#18A999]" />
          <span>{isNe ? 'सुरक्षित २५६-बिट ई-पेमेन्ट गेटवे तथा आधिकारिक प्रमाणीकरण' : '256-Bit Encrypted Secure Gateway & Verification'}</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        {isNe ? 'भुक्तानी वा प्रशासक स्वीकृति पश्चात आधिकारिक PDF कागजात तुरुन्त उपलब्ध हुनेछ।' : 'Official print-ready PDF will be downloadable immediately after payment or admin approval.'}
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  return (
    <div className="px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#123B5D]">
          {isNe ? 'भुक्तानी तथा कागजात प्राप्ति' : 'Checkout & Document Retrieval'}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          {isNe ? 'आफ्नो आधिकारिक कागजात PDF प्राप्त गर्न सुरक्षित भुक्तानी वा प्रशासक प्रमाणीकरण रोज्नुहोस्।' : 'Complete secure payment or request admin approval to retrieve your verified document.'}
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-xs text-slate-400 py-12">Loading order details...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
