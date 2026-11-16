'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, AuditLogItem, AuditLogResponse, AuditLogMetrics } from '@/lib/api';
import { formatAuditTimestamp, getAuditDateGroupLabel, toNepaliDigits } from '@/lib/nepaliDate';
import CustomSelect from '@/components/ui/CustomSelect';
import toast from '@/lib/toast';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  FileText,
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  PlusCircle,
  Sliders,
  Cpu,
  Layers,
  Clock,
  Laptop,
  Globe,
  Activity,
  List,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string>('');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AuditLogMetrics>({
    total: 0,
    logins_today: 0,
    failed_logins: 0,
    doc_changes: 0,
    system_actions: 0,
  });

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Inspection Modal State & Exit Transition
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [diffTab, setDiffTab] = useState<'table' | 'json'>('table');
  const [exporting, setExporting] = useState(false);

  const closeModal = useCallback(() => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedLog(null);
      setIsClosingModal(false);
    }, 200);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedLog && !isClosingModal) {
        closeModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog, isClosingModal, closeModal]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
  }, []);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await api.admin.auditLogs.list(token, {
          page,
          per_page: 30,
          search: search.trim() || undefined,
          category: category !== 'all' ? category : undefined,
          date_range: dateRange !== 'all' ? dateRange : undefined,
        });

        const items: AuditLogItem[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];

        setLogs(items);
        if (res && (res as any).meta) {
          setCurrentPage((res as any).meta.current_page || 1);
          setLastPage((res as any).meta.last_page || 1);
          setTotalCount((res as any).meta.total ?? items.length);
        } else {
          setTotalCount(items.length);
        }
        if (res && (res as any).metrics) {
          setMetrics((res as any).metrics);
        }
      } catch (err: any) {
        toast.error(err.message || (isNe ? 'अडिट लगहरू लोड गर्न सकिएन।' : 'Failed to load audit logs.'));
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [token, search, category, dateRange, isNe]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // View mode: 'grouped' (grouped by date) or 'flat' (continuous table)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Group logs date-wise
  const groupedLogs = useMemo(() => {
    const map = new Map<string, AuditLogItem[]>();
    for (const log of logs || []) {
      const d = new Date(log.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(log);
    }

    const groups: {
      dateKey: string;
      header: ReturnType<typeof getAuditDateGroupLabel>;
      items: AuditLogItem[];
    }[] = [];

    for (const [dateKey, items] of map.entries()) {
      groups.push({
        dateKey,
        header: getAuditDateGroupLabel(dateKey, lang),
        items,
      });
    }

    return groups;
  }, [logs, lang]);

  async function handleExport() {
    setExporting(true);
    try {
      const allLogs = await api.admin.auditLogs.export(token);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mero_kagaz_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(isNe ? 'अडिट लग सफलतापूर्वक डाउनलोड भयो।' : 'Audit logs exported successfully.');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'एक्सपोर्ट असफल भयो।' : 'Failed to export logs.'));
    } finally {
      setExporting(false);
    }
  }

  function parseJsonPayload(val: unknown): Record<string, any> | null {
    if (!val) return null;
    if (typeof val === 'object' && val !== null) return val as Record<string, any>;
    if (typeof val === 'string') {
      try {
        let parsed = JSON.parse(val);
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function getActionBadge(action: string) {
    if (action === 'auth.login') {
      return {
        icon: <LogIn className="h-3 w-3" />,
        label: isNe ? 'सफल लगइन' : 'User Login',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold',
      };
    }
    if (action === 'auth.failed_login') {
      return {
        icon: <ShieldAlert className="h-3 w-3" />,
        label: isNe ? 'असफल लगइन' : 'Failed Login',
        className: 'border-rose-200 bg-rose-50 text-rose-700 font-bold',
      };
    }
    if (action === 'auth.logout') {
      return {
        icon: <LogOut className="h-3 w-3" />,
        label: isNe ? 'लगआउट' : 'User Logout',
        className: 'border-slate-200 bg-slate-100 text-slate-700 font-semibold',
      };
    }
    if (action === 'document.create' || action === 'document.created') {
      return {
        icon: <PlusCircle className="h-3 w-3" />,
        label: isNe ? 'कागजात सिर्जना' : 'Document Created',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold',
      };
    }
    if (action === 'document.update' || action === 'document.updated') {
      return {
        icon: <Edit className="h-3 w-3" />,
        label: isNe ? 'कागजात सम्पादन' : 'Document Updated',
        className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold',
      };
    }
    if (action === 'document.delete' || action === 'document.deleted') {
      return {
        icon: <Trash2 className="h-3 w-3" />,
        label: isNe ? 'कागजात हटाइयो' : 'Document Deleted',
        className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold',
      };
    }
    if (action === 'document.toggle_status') {
      return {
        icon: <Sliders className="h-3 w-3" />,
        label: isNe ? 'स्थिति परिवर्तन' : 'Status Changed',
        className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold',
      };
    }
    if (action.startsWith('system.')) {
      return {
        icon: <Cpu className="h-3 w-3" />,
        label: isNe ? 'सिस्टम DevOps' : 'System DevOps',
        className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold',
      };
    }
    if (action.startsWith('settings.')) {
      return {
        icon: <Sliders className="h-3 w-3" />,
        label: isNe ? 'साइट सेटिङ' : 'Site Settings',
        className: 'border-amber-200 bg-amber-50 text-amber-800 font-semibold',
      };
    }
    if (action.startsWith('cms.')) {
      return {
        icon: <Globe className="h-3 w-3" />,
        label: isNe ? 'CMS सम्पादन' : 'CMS Content',
        className: 'border-teal-200 bg-teal-50 text-teal-700 font-semibold',
      };
    }
    return {
      icon: <Activity className="h-3 w-3" />,
      label: action,
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
  }

  function renderLogRow(log: AuditLogItem) {
    const badge = getActionBadge(log.action);
    const ts = formatAuditTimestamp(log.created_at, lang);

    return (
      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
        {/* Timestamp: Nepali Date (BS) + AD Date + Exact Time */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
              <Clock className="h-3.5 w-3.5 text-[#18A999]" />
              <span className="font-outfit">{ts.time}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
              <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 border border-emerald-200/80 font-outfit">
                {ts.bsDate}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {ts.adDate}
            </span>
          </div>
        </td>

        {/* User & IP */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="font-semibold text-slate-800">
            {log.user ? log.user.name : <span className="text-slate-500 font-normal italic">{isNe ? 'प्रणाली / अज्ञात' : 'System / Guest'}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
            {log.user && <span>{log.user.email}</span>}
            {log.ip_address && (
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-mono">
                {log.ip_address}
              </span>
            )}
          </div>
        </td>

        {/* Action Badge */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        </td>

        {/* Description */}
        <td className="px-5 py-3.5 max-w-md">
          <p className="text-slate-700 font-medium line-clamp-2">{log.description || '—'}</p>
          {log.model_type && (
            <span className="text-[10px] text-slate-400 font-mono">
              Entity: {log.model_type} {log.model_id ? `(#${log.model_id})` : ''}
            </span>
          )}
        </td>

        {/* Details Action */}
        <td className="px-5 py-3.5 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => setSelectedLog(log)}
            className="widget-click inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#18A999]"
          >
            <Eye className="h-3 w-3" />
            <span>{isNe ? 'हेर्नुहोस्' : 'Inspect'}</span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <AdminShell>
      <div className="w-full space-y-6">
        {/* ─── Header & Top Actions ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#18A999] text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-[#123B5D]">
                {isNe ? 'प्रणाली अडिट तथा सुरक्षा लग' : 'System Audit & Activity Trail'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'प्रयोगकर्ता लगइन, सुरक्षा प्रयासहरू, कागजात परिमार्जन तथा प्रणाली गतिविधिहरूको प्रत्यक्ष अभिलेख।'
                : 'Real-time immutable ledger of user authentications, document modifications, and DevOps maintenance.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLogs(currentPage)}
              disabled={loading}
              className="admin-btn flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#123B5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isNe ? 'ताजा गर्नुहोस्' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || (logs || []).length === 0}
              className="admin-btn flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0E2E4A] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isNe ? 'लग डाउनलोड (JSON)' : 'Export Logs'}</span>
            </button>
          </div>
        </div>

        {/* ─── Summary Metric Cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase">{isNe ? 'कुल लगहरू' : 'Total Logs'}</span>
              <Layers className="h-4 w-4 text-[#18A999]" />
            </div>
            <p className="mt-2 text-xl font-black text-[#123B5D] font-outfit">{metrics.total.toLocaleString()}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase">{isNe ? 'आजको सफल लगइन' : 'Logins Today'}</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-black text-emerald-600 font-outfit">{metrics.logins_today}</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase">{isNe ? 'असफल लगइन प्रयास' : 'Failed Attempts'}</span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-xl font-black text-rose-600 font-outfit">{metrics.failed_logins}</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase">{isNe ? 'कागजात गतिविधि' : 'Doc Edits'}</span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-xl font-black text-blue-700 font-outfit">{metrics.doc_changes}</p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase">{isNe ? 'सिस्टम क्रियाहरू' : 'System DevOps'}</span>
              <Terminal className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-xl font-black text-purple-700 font-outfit">{metrics.system_actions}</p>
          </div>
        </div>

        {/* ─── Search & Category Filter Toolbar ─── */}
        <div className="rounded-3xl border border-teal-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isNe
                    ? 'विवरण, लगइन इमेल, कार्य (Action), वा IP ठेगाना खोज्नुहोस्...'
                    : 'Search by description, user email, action, or IP address...'
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition placeholder:text-slate-400 focus:border-[#18A999] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18A999]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <CustomSelect
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                icon={<Calendar className="h-4 w-4" />}
                className="w-44 sm:w-48"
                options={[
                  { value: 'all', label: isNe ? 'सबै समय' : 'All Time', subLabel: isNe ? 'शुरुवात देखि' : 'Since inception' },
                  { value: 'today', label: isNe ? 'आज' : 'Today', subLabel: isNe ? 'आजका लगहरू' : '24h activity' },
                  { value: 'yesterday', label: isNe ? 'हिजो' : 'Yesterday', subLabel: isNe ? 'हिजोका लगहरू' : 'Past day' },
                  { value: 'week', label: isNe ? 'पछिल्लो ७ दिन' : 'Past 7 Days', subLabel: isNe ? '१ हप्ता' : 'Last 7 days' },
                  { value: 'month', label: isNe ? 'पछिल्लो ३० दिन' : 'Past 30 Days', subLabel: isNe ? '१ महिना' : 'Last 30 days' },
                ]}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>{isNe ? 'वर्ग:' : 'Category:'}</span>
            </span>

            {[
              { id: 'all', labelNe: 'सबै (All)', labelEn: 'All Logs' },
              { id: 'auth', labelNe: '🔐 लगइन तथा प्रमाणीकरण', labelEn: 'Auth & Logins' },
              { id: 'document', labelNe: '📄 कागजात (Documents)', labelEn: 'Documents' },
              { id: 'system', labelNe: '🛠️ सिस्टम तथा मर्मत', labelEn: 'System DevOps' },
              { id: 'settings', labelNe: '⚙️ साइट सेटिङहरू', labelEn: 'Settings' },
              { id: 'cms', labelNe: '🌐 होमपेज CMS', labelEn: 'CMS Content' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  category === cat.id
                    ? 'bg-[#123B5D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {isNe ? cat.labelNe : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Audit Ledger Table ─── */}
        <div className="overflow-hidden rounded-3xl border border-teal-200/90 bg-white shadow-xs animate-admin-page-in">
          {/* Card Header with View Mode Switch */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isNe ? 'क्रियाकलाप अभिलेख (Activity Ledger)' : 'System Audit Ledger'}
              </h3>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-outfit">
                {isNe ? `कुल ${toNepaliDigits(totalCount)}` : `${totalCount} records`}
              </span>
            </div>

            {/* View Mode Switch (Grouped by Date vs Flat List) */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === 'grouped'
                      ? 'bg-white text-[#123B5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{isNe ? 'मिति अनुसार' : 'By Date'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === 'flat'
                      ? 'bg-white text-[#123B5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="h-3 w-3" />
                  <span>{isNe ? 'सूची' : 'Flat List'}</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-400 font-outfit hidden md:inline">
                {isNe ? `पृष्ठमा ${(logs || []).length} अभिलेख` : `Showing ${(logs || []).length}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-slate-500 font-outfit">
              <RefreshCw className="h-6 w-6 animate-spin text-[#18A999] mb-3" />
              <span>{isNe ? 'अडिट लगहरू लोड हुँदैछ...' : 'Loading audit trail records...'}</span>
            </div>
          ) : (logs || []).length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">
              <span className="text-3xl">🔍</span>
              <p className="mt-2 font-bold text-slate-700">
                {isNe ? 'कुनै पनि लग फेला परेन।' : 'No audit records match your query.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isNe ? 'खोज शब्द वा वर्ग फिल्टर परिवर्तन गरी पुनः प्रयास गर्नुहोस्।' : 'Try clearing filters or search terms.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 whitespace-nowrap">{isNe ? 'समय र नेपाली मिति' : 'Date & Time'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'प्रयोगकर्ता / IP' : 'User / IP'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'क्रिया (Action)' : 'Action'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'विवरण (Description)' : 'Description'}</th>
                    <th className="px-5 py-3.5 text-right">{isNe ? 'कार्य' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewMode === 'grouped' ? (
                    groupedLogs.map((group) => (
                      <React.Fragment key={group.dateKey}>
                        {/* ─── Date Group Header Bar ─── */}
                        <tr className="border-t-2 border-b border-slate-200/90 bg-gradient-to-r from-slate-100/90 via-slate-50 to-white">
                          <td colSpan={5} className="px-5 py-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-[#123B5D]" />
                                <span
                                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                    group.header.isToday
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : group.header.isYesterday
                                      ? 'bg-amber-500 text-white shadow-2xs'
                                      : 'bg-slate-200 text-slate-800'
                                  }`}
                                >
                                  {group.header.title}
                                </span>
                                <span className="text-xs font-bold text-slate-700 font-outfit">
                                  {group.header.sub}
                                </span>
                              </div>

                              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs font-outfit">
                                {isNe
                                  ? `${toNepaliDigits(group.items.length)} गतिविधि`
                                  : `${group.items.length} ${group.items.length === 1 ? 'activity' : 'activities'}`}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Rows within this date group */}
                        {group.items.map((log) => renderLogRow(log))}
                      </React.Fragment>
                    ))
                  ) : (
                    (logs || []).map((log) => renderLogRow(log))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Pagination Footer ─── */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs">
              <span className="text-slate-500 font-outfit">
                {isNe
                  ? `पृष्ठ ${currentPage} / ${lastPage} (जम्मा ${totalCount})`
                  : `Page ${currentPage} of ${lastPage} (${totalCount} records)`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchLogs(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{isNe ? 'अघिल्लो' : 'Prev'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchLogs(currentPage + 1)}
                  disabled={currentPage >= lastPage || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>{isNe ? 'पछिल्लो' : 'Next'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Detail Inspection Modal ─── */}
        {mounted && selectedLog && createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isClosingModal) {
                closeModal();
              }
            }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm ${
              isClosingModal ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
            }`}
          >
            <div
              className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 ${
                isClosingModal ? 'animate-modal-dialog-out' : 'animate-modal-dialog-in'
              }`}
            >
              {/* Modal Header */}
              <div className="animate-modal-item-1 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#123B5D] text-white shadow-xs">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {isNe ? 'अडिट लग विस्तृत विवरण' : 'Audit Trail Inspection'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">Log #{selectedLog.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4 overflow-y-auto p-6 text-xs text-slate-700">
                {/* Basic Meta Grid */}
                <div className="animate-modal-item-2 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{isNe ? 'क्रिया (Action)' : 'Action'}</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getActionBadge(selectedLog.action).className}`}>
                        {getActionBadge(selectedLog.action).icon}
                        <span>{getActionBadge(selectedLog.action).label}</span>
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {isNe ? 'समय तथा नेपाली मिति' : 'Timestamp & Date'}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 font-outfit">
                        <Calendar className="h-3 w-3 text-emerald-600" />
                        <span>{formatAuditTimestamp(selectedLog.created_at, lang).fullBs} (B.S.)</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatAuditTimestamp(selectedLog.created_at, lang).fullAd} • {formatAuditTimestamp(selectedLog.created_at, lang).time}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{isNe ? 'प्रयोगकर्ता (User)' : 'User'}</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System / Anonymous'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{isNe ? 'IP ठेगाना' : 'IP Address'}</span>
                    <p className="font-mono text-xs font-semibold text-slate-800 mt-0.5">{selectedLog.ip_address || '—'}</p>
                  </div>

                  {selectedLog.model_type && (
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{isNe ? 'लक्षित वस्तु (Entity)' : 'Target Entity'}</span>
                      <p className="font-mono text-xs text-slate-700 mt-0.5">
                        {selectedLog.model_type} {selectedLog.model_id ? `(#${selectedLog.model_id})` : ''}
                      </p>
                    </div>
                  )}

                  {selectedLog.user_agent && (
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{isNe ? 'User Agent' : 'User Agent'}</span>
                      <p className="font-mono text-[11px] text-slate-500 break-all mt-0.5">{selectedLog.user_agent}</p>
                    </div>
                  )}
                </div>

                {/* Description Card */}
                <div className="animate-modal-item-3">
                  <h4 className="text-xs font-bold text-[#123B5D] uppercase mb-1">{isNe ? 'क्रिया विवरण' : 'Activity Description'}</h4>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 font-medium">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Old Values vs New Values Diff / Payload */}
                {(() => {
                  const oldPayload = parseJsonPayload(selectedLog.old_values);
                  const newPayload = parseJsonPayload(selectedLog.new_values);
                  const hasDiff = Boolean(oldPayload || newPayload);

                  if (!hasDiff) return null;

                  const allKeys = Array.from(
                    new Set([
                      ...Object.keys(oldPayload || {}),
                      ...Object.keys(newPayload || {}),
                    ])
                  );

                  return (
                    <div className="animate-modal-item-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#123B5D] uppercase">
                          {isNe ? 'डेटा परिवर्तन (Data Diff & Payload)' : 'Data Payload & Diff'}
                        </h4>
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDiffTab('table')}
                            className={`rounded-md px-2.5 py-0.5 transition ${
                              diffTab === 'table' ? 'bg-white text-[#123B5D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {isNe ? 'तालिका तुलना' : 'Table Diff'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiffTab('json')}
                            className={`rounded-md px-2.5 py-0.5 transition ${
                              diffTab === 'json' ? 'bg-white text-[#123B5D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            JSON Raw
                          </button>
                        </div>
                      </div>

                      {diffTab === 'table' ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                              <tr>
                                <th className="px-4 py-2.5 w-1/3">{isNe ? 'क्षेत्र (Field)' : 'Field'}</th>
                                {oldPayload && (
                                  <th className="px-4 py-2.5 text-rose-700 bg-rose-50/40">
                                    {isNe ? 'पुरानो मान (Previous)' : 'Old Values'}
                                  </th>
                                )}
                                {newPayload && (
                                  <th className="px-4 py-2.5 text-emerald-700 bg-emerald-50/40">
                                    {isNe ? 'नयाँ मान (New / Updated)' : 'New Payload'}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-outfit">
                              {allKeys.map((key) => {
                                const oldVal = oldPayload?.[key];
                                const newVal = newPayload?.[key];
                                const isChanged = oldPayload && newPayload && JSON.stringify(oldVal) !== JSON.stringify(newVal);

                                const renderValueCell = (v: unknown, variant: 'old' | 'new') => {
                                  if (v === undefined) return <span className="text-slate-300 italic">—</span>;
                                  if (v === null) return <span className="text-slate-400 italic font-mono text-[11px]">null</span>;
                                  if (v === '') return <span className="text-slate-400 italic text-[11px] font-sans">{isNe ? '(खाली)' : '(empty)'}</span>;

                                  const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
                                  const colorClasses = variant === 'old'
                                    ? 'bg-rose-50/80 border-rose-200/80 text-rose-800'
                                    : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 font-semibold';

                                  return (
                                    <div className={`rounded-lg border px-2.5 py-1 text-xs break-words whitespace-pre-wrap leading-relaxed ${colorClasses}`}>
                                      {text}
                                    </div>
                                  );
                                };

                                return (
                                  <tr key={key} className={isChanged ? 'bg-amber-50/30' : ''}>
                                    <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-slate-700 break-all align-top">
                                      {key}
                                    </td>
                                    {oldPayload && (
                                      <td className="px-4 py-2.5 text-slate-600 align-top">
                                        {renderValueCell(oldVal, 'old')}
                                      </td>
                                    )}
                                    {newPayload && (
                                      <td className="px-4 py-2.5 text-slate-800 align-top">
                                        {renderValueCell(newVal, 'new')}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {oldPayload && (
                            <div>
                              <span className="text-[11px] font-bold text-rose-600 block mb-1">
                                {isNe ? 'पुरानो मान (Previous State)' : 'Old Values'}
                              </span>
                              <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] text-rose-300 font-mono">
                                {JSON.stringify(oldPayload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {newPayload && (
                            <div className={!oldPayload ? 'col-span-2' : ''}>
                              <span className="text-[11px] font-bold text-emerald-600 block mb-1">
                                {isNe ? 'नयाँ मान (New State / Payload)' : 'New Values / Payload'}
                              </span>
                              <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] text-emerald-300 font-mono">
                                {JSON.stringify(newPayload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="animate-modal-item-5 border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
                <button
                  type="button"
                  onClick={closeModal}
                  className="admin-btn rounded-xl bg-[#123B5D] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0E2E4A] transition"
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
