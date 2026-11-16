'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import {
  api,
  AdminAnalyticsOverview,
  AdminChartsData,
  OperationalAlertItem,
} from '@/lib/api';
import { NepaliDateFilter, DateFilterValue } from '@/components/ui/NepaliDateFilter';
import { formatBsDate, resolveBsPresetDateRange } from '@/lib/nepaliDate';
import {
  Users,
  Building2,
  FileText,
  CreditCard,
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Bell,
  BellOff,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  X,
  Info,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  // Filters State initialized with real Bikram Sambat Month (e.g. Aswin)
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => {
    const bsRange = resolveBsPresetDateRange('this_month');
    return {
      preset: 'this_month',
      startDate: bsRange.startDate,
      endDate: bsRange.endDate,
      labelNe: `यो महिना (${bsRange.monthNameNe})`,
      labelEn: `This Month (${bsRange.monthNameEn})`,
      bsSummary: bsRange.bsSummaryEn,
    };
  });

  // Analytics Data State
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [charts, setCharts] = useState<AdminChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Operational Live Alerts State
  const [alerts, setAlerts] = useState<OperationalAlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);
  const [hoveredDateData, setHoveredDateData] = useState<{
    date: string;
    total_count: number;
    paid_count: number;
    paid_amount: number;
    unpaid_amount: number;
  } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ch] = await Promise.all([
        api.admin.analytics.overview(undefined, dateFilter.preset, dateFilter.startDate, dateFilter.endDate),
        api.admin.analytics.charts(undefined, dateFilter.preset, dateFilter.startDate, dateFilter.endDate),
      ]);
      setOverview(ov);
      setCharts(ch);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertList, countRes] = await Promise.all([
        api.admin.alerts.list(undefined, { page: 1 }),
        api.admin.alerts.unreadCount(),
      ]);
      if (Array.isArray(alertList)) setAlerts(alertList);
      setUnreadCount(countRes?.unread_count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Live polling for alerts every 12 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 12000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkAlertRead = async (id: number) => {
    try {
      await api.admin.alerts.markAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllAlertsRead = async () => {
    try {
      await api.admin.alerts.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const u = overview?.users;
  const d = overview?.documents;
  const f = overview?.financials;
  const e = overview?.emails;

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* ─── Top Control Bar ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#123B5D]">
              {isNe ? 'केन्द्रीय प्रशासनिक ड्यासबोर्ड' : 'Super Admin Analytics & Operations'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'प्लेटफर्म-व्यापी वास्तविक तथ्याङ्क, प्रत्यक्ष परिचालन अलर्ट र वित्तीय विश्लेषण।'
                : 'Platform-wide real database metrics, live operational alerts, and financial tracking.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NepaliDateFilter value={dateFilter} onChange={setDateFilter} />

            {/* Notification Bell with Unread Badge */}
            <button
              onClick={() => setShowAlertDrawer(true)}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center"
              title="Operational Alerts & Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { fetchAnalytics(); fetchAlerts(); }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── Platform-Wide KPI Grid (12 Metrics across 4 Domains) ─── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* 1. Individual & Business Users */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isNe ? 'प्रयोगकर्ता तथा व्यवसाय' : 'Accounts Overview'}
              </span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#123B5D]">
                {u ? (u.total_individual + u.total_business).toLocaleString() : '—'}
              </span>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                +{u?.new_in_period || 0} {isNe ? 'नयाँ' : 'new'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{isNe ? 'व्यक्तिगत' : 'Individual'}: <strong>{u?.total_individual || 0}</strong></span>
              <span>{isNe ? 'संस्थागत' : 'Business'}: <strong>{u?.total_business || 0}</strong></span>
            </div>
          </div>

          {/* 2. Documents Generated */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isNe ? 'कागजात सिर्जना' : 'Total Documents'}
              </span>
              <FileText className="h-4 w-4 text-[#18A999]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#123B5D]">
                {d ? d.total.toLocaleString() : '—'}
              </span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {d?.period || 0} {isNe ? 'अवधिमा' : 'in period'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{isNe ? 'आज' : 'Today'}: <strong>{d?.today || 0}</strong></span>
              <span>{isNe ? 'यो हप्ता' : 'This Week'}: <strong>{d?.this_week || 0}</strong></span>
              <span>{isNe ? 'यो महिना' : 'Month'}: <strong>{d?.this_month || 0}</strong></span>
            </div>
          </div>

          {/* 3. Received Revenue (Strictly Verified Payments) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isNe ? 'प्राप्त आम्दानी (सत्यापित)' : 'Verified Revenue'}
              </span>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">
                NPR {f ? f.total_received_revenue.toLocaleString() : '0'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{isNe ? 'सत्यापित भुक्तानी' : 'Verified'}: <strong>{f?.total_verified_payments || 0}</strong></span>
              <span>{isNe ? 'अवधिको आम्दानी' : 'Period'}: <strong>Rs {f?.period_received_revenue.toLocaleString() || 0}</strong></span>
            </div>
          </div>

          {/* 4. Operations, Pendings & Failures */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isNe ? 'प्रक्रिया तथा विफलता' : 'Operations & Issues'}
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">
                {f ? f.pending_payments : 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isNe ? 'बाँकी भुक्तानी' : 'Pending payments'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{isNe ? 'असफल भुक्तानी' : 'Failed Pay'}: <strong className="text-rose-600">{f?.failed_payments || 0}</strong></span>
              <span>{isNe ? 'असफल इमेल' : 'Failed Email'}: <strong className="text-rose-600">{e?.failed || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* ─── Visual Charts & Analytics Section ─── */}
        <div className="space-y-6">
          {/* Chart 1: Dual-Axis Collections & Trend Combo Chart */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#18A999]">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-extrabold text-[#123B5D]">
                    {isNe ? 'दैनिक शुल्क संकलन तथा कागजात प्रवाह ग्राफ' : 'Daily Fee Collections & Document Volume Trend'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isNe
                    ? 'छनोट गरिएको अवधिको दैनिक शुल्क संकलन (स्तम्भ) र कागजात संख्या (कर्व रेखा)'
                    : 'Comparing daily fee collection (bars) against document issuance volume (trend curve)'}
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-md bg-[#10b981] shadow-2xs" />
                  <span className="text-slate-700">{isNe ? 'शुल्क संकलन (Collection Rs)' : 'Collection (Rs)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#6366f1] bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                  </span>
                  <span className="text-slate-700">{isNe ? 'कागजात संख्या (Invoices/Docs)' : 'Documents Issued'}</span>
                </div>
                <div className="h-4 w-px bg-slate-300" />
                <span className="text-[11px] text-slate-500 font-normal">
                  {charts?.docs_over_time?.length || 0} {isNe ? 'दिनहरू' : 'days in period'}
                </span>
              </div>
            </div>

            {!charts?.docs_over_time || charts.docs_over_time.length === 0 ? (
              <div className="py-14 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {isNe ? 'यस अवधिमा कुनै अर्डर वा कारोबार दर्ता भएको छैन।' : 'No document orders in this date period.'}
                </p>
              </div>
            ) : (() => {
              const days = charts.docs_over_time;
              const maxDocs = Math.max(...days.map((d) => d.total_count), 4);
              const maxRev = Math.max(...days.map((d) => Number(d.paid_amount || 0)), 1000);

              const totalPeriodDocs = days.reduce((acc, curr) => acc + curr.total_count, 0);
              const totalPeriodRevenue = days.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
              const activeDays = days.filter((d) => d.total_count > 0).length;

              // SVG Dimensions: Use 1000 coordinate viewBox so it fills 100% full width of any screen!
              const viewBoxWidth = 1000;
              const svgHeight = 260;
              const leftPadding = 56;
              const rightPadding = 56;
              const bottomPadding = 36;
              const topPadding = 48;
              const chartPlotHeight = svgHeight - topPadding - bottomPadding;
              const plotWidth = viewBoxWidth - leftPadding - rightPadding;

              // Distribute every day evenly across 100% full length of the card
              const pointSpacing = plotWidth / Math.max(days.length, 1);
              const barWidth = Math.min(26, Math.max(12, pointSpacing * 0.42));

              // Calculate (X, Y) Coordinates for Spline line and Columns
              const points = days.map((d, idx) => {
                const x = leftPadding + (idx + 0.5) * pointSpacing;
                const paidAmt = Number(d.paid_amount || 0);
                const colHeight = (paidAmt / maxRev) * chartPlotHeight;
                const colY = topPadding + (chartPlotHeight - colHeight);

                // Document volume count mapped to right axis, with floating elevation
                const docNorm = d.total_count / maxDocs;
                const lineY = topPadding + (chartPlotHeight - docNorm * (chartPlotHeight - 20)) - 10;

                return {
                  x,
                  colY,
                  colHeight,
                  lineY,
                  data: {
                    date: d.date,
                    total_count: d.total_count,
                    paid_count: d.paid_count,
                    paid_amount: paidAmt,
                    unpaid_amount: Number(d.unpaid_amount || 0),
                  },
                };
              });

              // Smooth spline curve for Document Volume:
              // Connect active points across the timeline so the line glides elegantly without plunging to the bottom floor
              const activePoints = points.filter((p) => p.data.total_count > 0);
              const curvePoints = activePoints.length >= 2
                ? activePoints
                : points;

              // Generate Smooth Catmull-Rom / Bezier SVG Path for the Line
              const buildSmoothPath = (pts: Array<{ x: number; lineY: number }>) => {
                if (pts.length === 0) return '';
                if (pts.length === 1) return `M ${pts[0].x} ${pts[0].lineY}`;

                let d = `M ${pts[0].x} ${pts[0].lineY}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const curr = pts[i];
                  const next = pts[i + 1];
                  const midX = (curr.x + next.x) / 2;
                  d += ` C ${midX} ${curr.lineY}, ${midX} ${next.lineY}, ${next.x} ${next.lineY}`;
                }
                return d;
              };

              const pathString = buildSmoothPath(curvePoints);

              return (
                <div className="space-y-6">
                  {/* Summary Metric Ribbon (Ant Design Statistic Bar) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/70 border border-slate-200/70">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {isNe ? 'अवधिको कुल कागजात' : 'Period Total Documents'}
                      </div>
                      <div className="text-xl font-black text-[#123B5D] mt-0.5">
                        {totalPeriodDocs} <span className="text-xs font-semibold text-teal-600">{isNe ? 'कागजात' : 'docs'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {isNe ? 'अवधिको कुल आम्दानी' : 'Period Total Revenue'}
                      </div>
                      <div className="text-xl font-black text-emerald-600 mt-0.5">
                        NPR {totalPeriodRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {isNe ? 'सक्रिय दिनहरू' : 'Active Activity Days'}
                      </div>
                      <div className="text-xl font-black text-slate-700 mt-0.5">
                        {activeDays} <span className="text-xs font-normal text-slate-400">/ {days.length} {isNe ? 'दिन' : 'days'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Active Hover / Selection Detail Ribbon (Always Visible & Prominent) ── */}
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs border border-indigo-100 font-bold">
                        <Info className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {hoveredDateData ? (
                            <>
                              <span className="text-sm font-extrabold text-[#123B5D]">
                                {formatBsDate(hoveredDateData.date, 'DD MMMM YYYY', isNe ? 'ne' : 'en')}
                              </span>
                              <span className="text-slate-400 font-normal font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                                AD: {hoveredDateData.date}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-600 font-semibold">
                              {isNe ? 'ग्राफको कुनै पनि मितिमा कर्सर लैजानुहोस्' : 'Hover over any date column or dot to inspect details'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {hoveredDateData
                            ? (isNe
                                ? `सत्यापित भुक्तानी: ${hoveredDateData.paid_count} वटा • बाँकी रकम: NPR ${hoveredDateData.unpaid_amount.toLocaleString()}`
                                : `Verified Paid Orders: ${hoveredDateData.paid_count} • Unpaid balance: NPR ${hoveredDateData.unpaid_amount.toLocaleString()}`)
                            : (isNe ? 'शुल्क संकलन, कागजात संख्या र भुक्तानी स्थिति यहाँ प्रत्यक्ष रूपमा देखा पर्छ।' : 'Collections, volume, and verification counts update dynamically.')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs shrink-0 font-bold">
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>{isNe ? 'आम्दानी:' : 'Collection:'}</span>
                        <span className="font-mono text-sm font-black text-emerald-700">
                          NPR {(hoveredDateData?.paid_amount ?? totalPeriodRevenue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 px-3.5 py-2 rounded-xl border border-indigo-200 shadow-2xs">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <span>{isNe ? 'कागजात:' : 'Docs:'}</span>
                        <span className="font-mono text-sm font-black text-indigo-700">
                          {hoveredDateData?.total_count ?? totalPeriodDocs} {isNe ? 'वटा' : 'issued'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── High-Fidelity Dual-Axis Full-Width SVG Canvas ── */}
                  <div className="relative w-full rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-4">
                    {/* Y-Axis Left (Collection Rs) */}
                    <div className="absolute left-2.5 top-11 text-[9px] font-extrabold text-[#10b981] z-10 flex flex-col gap-9 pointer-events-none select-none">
                      <span>Rs {(maxRev).toLocaleString()}</span>
                      <span>Rs {Math.round(maxRev * 0.66).toLocaleString()}</span>
                      <span>Rs {Math.round(maxRev * 0.33).toLocaleString()}</span>
                      <span>Rs 0</span>
                    </div>

                    {/* Y-Axis Right (Invoices / Docs Count) */}
                    <div className="absolute right-2.5 top-11 text-[9px] font-extrabold text-[#6366f1] z-10 flex flex-col gap-9 pointer-events-none select-none text-right">
                      <span>{maxDocs}</span>
                      <span>{Math.round(maxDocs * 0.66)}</span>
                      <span>{Math.round(maxDocs * 0.33)}</span>
                      <span>0</span>
                    </div>

                    <svg
                      viewBox={`0 0 ${viewBoxWidth} ${svgHeight}`}
                      className="w-full h-auto overflow-visible select-none"
                    >
                      <defs>
                        {/* Column Gradient */}
                        <linearGradient id="emeraldBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="emeraldBarMuted" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f1f5f9" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>
                        {/* Glow Filter for Active Dot */}
                        <filter id="dotShadow" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
                        </filter>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                        const y = topPadding + (1 - ratio) * chartPlotHeight;
                        return (
                          <line
                            key={idx}
                            x1={leftPadding - 8}
                            y1={y}
                            x2={viewBoxWidth - rightPadding + 8}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.2"
                            strokeDasharray={ratio > 0 && ratio < 1 ? '4 4' : undefined}
                          />
                        );
                      })}

                      {/* 1. Emerald Rounded Columns for Collections */}
                      {points.map((pt, idx) => {
                        const isHovered = hoveredDateData?.date === pt.data.date;
                        const hasRevenue = pt.data.paid_amount > 0;
                        const barH = Math.max(hasRevenue ? 14 : 4, pt.colHeight);
                        const barY = topPadding + chartPlotHeight - barH;

                        return (
                          <g
                            key={`bar-${idx}`}
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredDateData(pt.data)}
                          >
                            <rect
                              x={pt.x - barWidth / 2}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              rx={barWidth / 3}
                              fill={hasRevenue ? 'url(#emeraldBarGrad)' : 'url(#emeraldBarMuted)'}
                              className={`transition-all duration-200 ${
                                isHovered ? 'brightness-110 filter drop-shadow-md' : 'opacity-90 hover:opacity-100'
                              }`}
                            />
                            {/* Revenue Tag above high columns */}
                            {hasRevenue && (
                              <text
                                x={pt.x}
                                y={barY - 6}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="800"
                                fill="#047857"
                              >
                                {pt.data.paid_amount >= 100000
                                  ? `Rs ${(pt.data.paid_amount / 100000).toFixed(2)}L`
                                  : pt.data.paid_amount >= 1000
                                  ? `Rs ${(pt.data.paid_amount / 1000).toFixed(1)}k`
                                  : `Rs ${pt.data.paid_amount}`}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* 2. Indigo / Purple Smooth Spline Curve for Invoices Volume */}
                      {pathString && (
                        <path
                          d={pathString}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          className="transition-all duration-300 pointer-events-none"
                        />
                      )}

                      {/* 3. Circular Data Points on the Spline Curve (Only for active days) */}
                      {points.map((pt, idx) => {
                        const isHovered = hoveredDateData?.date === pt.data.date;
                        const hasDocs = pt.data.total_count > 0;
                        const bsDayOnly = formatBsDate(pt.data.date, 'DD', isNe ? 'ne' : 'en');

                        return (
                          <g
                            key={`pt-${idx}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredDateData(pt.data)}
                          >
                            {/* Full vertical column hitbox */}
                            <rect
                              x={pt.x - pointSpacing / 2}
                              y={topPadding - 16}
                              width={pointSpacing}
                              height={chartPlotHeight + bottomPadding + 16}
                              fill="transparent"
                            />

                            {/* Vertical Guide Line on Hover */}
                            {isHovered && (
                              <line
                                x1={pt.x}
                                y1={topPadding}
                                x2={pt.x}
                                y2={topPadding + chartPlotHeight}
                                stroke="#6366f1"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                opacity="0.6"
                              />
                            )}

                            {/* Outer Circle Ring on Curve (Only on active days to maintain smooth wave without floor clutter) */}
                            {hasDocs && (
                              <circle
                                cx={pt.x}
                                cy={pt.lineY}
                                r={isHovered ? 7 : 5}
                                fill="#ffffff"
                                stroke="#6366f1"
                                strokeWidth={isHovered ? 3 : 2.5}
                                filter="url(#dotShadow)"
                                className="transition-all duration-150"
                              />
                            )}

                            {/* X-Axis Date Label */}
                            <text
                              x={pt.x}
                              y={svgHeight - 12}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight={isHovered ? '900' : '600'}
                              fill={isHovered ? '#123B5D' : '#64748b'}
                              className="transition-colors"
                            >
                              {bsDayOnly}
                            </text>
                          </g>
                        );
                      })}

                      {/* 4. On-Chart Floating Tooltip for Active Hovered Date */}
                      {hoveredDateData && (() => {
                        const activePt = points.find((p) => p.data.date === hoveredDateData.date);
                        if (!activePt) return null;

                        // Tooltip dimensions
                        const ttW = 124;
                        const ttH = 42;
                        // Keep tooltip bounded inside SVG width
                        const ttX = Math.max(leftPadding, Math.min(viewBoxWidth - rightPadding - ttW, activePt.x - ttW / 2));
                        const ttY = Math.max(4, activePt.lineY - ttH - 10);

                        return (
                          <g className="pointer-events-none transition-all duration-150">
                            {/* Tooltip Card Background */}
                            <rect
                              x={ttX}
                              y={ttY}
                              width={ttW}
                              height={ttH}
                              rx={8}
                              fill="#0f172a"
                              opacity="0.95"
                              filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))"
                            />
                            {/* Tooltip Arrow Pointer */}
                            <polygon
                              points={`${activePt.x - 4},${ttY + ttH} ${activePt.x + 4},${ttY + ttH} ${activePt.x},${ttY + ttH + 4}`}
                              fill="#0f172a"
                              opacity="0.95"
                            />
                            {/* Date Header */}
                            <text
                              x={ttX + ttW / 2}
                              y={ttY + 15}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="9"
                              fontWeight="600"
                            >
                              {formatBsDate(activePt.data.date, 'MMMM DD, YYYY', isNe ? 'ne' : 'en')}
                            </text>
                            {/* Revenue & Docs metrics in tooltip */}
                            <text
                              x={ttX + ttW / 2}
                              y={ttY + 30}
                              textAnchor="middle"
                              fill="#38bdf8"
                              fontSize="10"
                              fontWeight="800"
                            >
                              <tspan fill="#34d399">Rs {activePt.data.paid_amount.toLocaleString()}</tspan>
                              <tspan fill="#94a3b8"> • </tspan>
                              <tspan fill="#a5b4fc">{activePt.data.total_count} docs</tspan>
                            </text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Secondary Grid for Category & Other Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 2: Documents by Category */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'कागजात प्रकार अनुसार विभाजन' : 'Documents by Category / Type'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isNe ? 'IRD कर, OCR कम्पनी, करारनामा र वडा सिफारिस' : 'IRD Tax, OCR Corporate, Contracts, and Ward documents'}
                </p>
              </div>
              <Layers className="h-4 w-4 text-[#123B5D]" />
            </div>

            {!charts?.docs_by_category || charts.docs_by_category.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {isNe ? 'कुनै क्याटेगोरी डेटा उपलब्ध छैन।' : 'No category data in this period.'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {charts.docs_by_category.map((cat, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cat.category_name}</div>
                      <div className="text-[10px] text-slate-400">{cat.count} {isNe ? 'अर्डर' : 'orders'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600 font-mono">NPR {Number(cat.total_amount).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{isNe ? 'कुल मूल्य' : 'Total Value'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart 3: Top Revenue Document Templates (शीर्ष आम्दानी दिने कानूनी ढाँचाहरू) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'शीर्ष आम्दानी दिने कानूनी ढाँचाहरू' : 'Top Revenue Document Templates'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isNe ? 'सर्वाधिक बिक्री र माग भएका कानूनी मस्यौदाहरू' : 'Highest grossing legal draft templates by verified revenue'}
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-[#18A999]" />
            </div>

            {!charts?.revenue_by_doc || charts.revenue_by_doc.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {isNe ? 'यस अवधिमा कुनै बिक्री दर्ता भएको छैन।' : 'No template sales recorded in this period.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {charts.revenue_by_doc.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#18A999] text-xs font-black border border-teal-100">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {isNe ? (doc.name_np || doc.name) : doc.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.orders_count} {isNe ? 'वटा अर्डर' : 'verified orders'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600 font-mono">
                        NPR {Number(doc.total_revenue).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">{isNe ? 'कुल आम्दानी' : 'Revenue'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Top Businesses & Email Performance ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Businesses by Volume & Spending */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'शीर्ष व्यवसाय खाताहरू' : 'Top Businesses by Volume & Spending'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isNe ? 'सबैभन्दा धेरै कागजात र आम्दानी दिने व्यवसायहरू' : 'Companies generating highest volume of legal documents'}
                </p>
              </div>
              <Building2 className="h-4 w-4 text-[#18A999]" />
            </div>

            {!charts?.top_businesses || charts.top_businesses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No business account orders in this period.
              </div>
            ) : (
              <div className="space-y-2.5">
                {charts.top_businesses.map((biz, idx) => (
                  <div key={biz.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100 text-[#18A999] text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{biz.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">PAN: {biz.pan_vat_number || 'N/A'} • {biz.total_docs} docs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">NPR {Number(biz.total_spent).toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-600 font-bold">{isNe ? 'खर्च' : 'Spent'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Delivery Rates */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'इमेल डेलिभरी सफलता दर' : 'Email Delivery Health'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isNe ? 'पठाइएका, असफल र बाँकी इमेल सूचनाहरू' : 'Sent, pending, and failed automated notification status'}
                </p>
              </div>
              <Mail className="h-4 w-4 text-[#123B5D]" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-2xl font-black text-emerald-700">
                  {charts?.email_stats.sent || 0}
                </div>
                <div className="text-[11px] font-bold text-emerald-800 mt-1">
                  {isNe ? 'सफल (Sent)' : 'Sent'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <div className="text-2xl font-black text-rose-700">
                  {charts?.email_stats.failed || 0}
                </div>
                <div className="text-[11px] font-bold text-rose-800 mt-1">
                  {isNe ? 'असफल (Failed)' : 'Failed'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-2xl font-black text-amber-700">
                  {charts?.email_stats.pending || 0}
                </div>
                <div className="text-[11px] font-bold text-amber-800 mt-1">
                  {isNe ? 'बाँकी (Pending)' : 'Pending'}
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/admin/emails"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#18A999] hover:underline"
              >
                <span>{isNe ? 'इमेल सेटिङ तथा लगहरू खोल्नुहोस्' : 'Manage Email Settings & Logs'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ─── Modern Slide-in Operational Alerts Drawer ─── */}
    {showAlertDrawer && (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          onClick={() => setShowAlertDrawer(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <div className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/90 animate-in slide-in-from-right duration-250">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#18A999]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#123B5D]">
                  {isNe ? 'परिचालन सूचना तथा अलर्टहरू' : 'Live Operational Alerts'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0
                    ? (isNe ? `${unreadCount} नयाँ सूचना बाँकी छन्` : `${unreadCount} unread operational notifications`)
                    : (isNe ? 'सबै अलर्टहरू हेरिएका छन्' : 'All alerts up to date')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAlertDrawer(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {alerts.length} {isNe ? 'कुल सूचनाहरू' : 'total items'}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAlertsRead}
                className="text-xs font-bold text-[#18A999] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isNe ? 'सबै पढेको चिन्ह लगाउनुहोस्' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* Alert Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {isNe ? 'कुनै परिचालन समस्या वा नयाँ अलर्ट छैन।' : 'No operational alerts recorded.'}
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';
                const isSuccess = alert.severity === 'success';

                return (
                  <div
                    key={alert.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                      !alert.is_read
                        ? isCritical
                          ? 'bg-rose-50/70 border-rose-200'
                          : isWarning
                          ? 'bg-amber-50/70 border-amber-200'
                          : isSuccess
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-teal-50/60 border-teal-200'
                        : 'bg-slate-50/50 border-slate-100 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          isCritical
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : isSuccess
                            ? 'bg-emerald-500'
                            : 'bg-teal-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase ${
                              isCritical
                                ? 'bg-rose-200 text-rose-800'
                                : isWarning
                                ? 'bg-amber-200 text-amber-800'
                                : isSuccess
                                ? 'bg-emerald-200 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1.5">
                          {formatBsDate(alert.created_at, 'YYYY MMMM DD, hh:mm A', isNe ? 'ne' : 'en')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {alert.link && (
                        <Link
                          href={alert.link}
                          onClick={() => setShowAlertDrawer(false)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#123B5D] shadow-2xs"
                          title="Open Record"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkAlertRead(alert.id)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 shadow-2xs cursor-pointer"
                          title="Mark Read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}
  </AdminShell>
);
}
