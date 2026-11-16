'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, formatCurrency } from '@/lib/api';
import toast from '@/lib/toast';
import {
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Copy,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [token, setToken] = useState<string>('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('mk_admin_token') || localStorage.getItem('mero_kagaz_admin_token') || '';
    setToken(stored);
  }, []);

  async function loadPayments(page = 1) {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = { page };
      if (selectedProvider !== 'all') params.provider = selectedProvider;
      const res = await api.admin.payments.list(token, params);
      const items = res.data?.data || res.data || [];
      setPayments(Array.isArray(items) ? items : []);
      if (res.meta) {
        setPagination({
          current_page: res.meta.current_page || 1,
          last_page: res.meta.last_page || 1,
          total: res.meta.total || 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadPayments();
  }, [token, selectedProvider]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(isNe ? 'कपी गरियो!' : 'Copied!');
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#123B5D] font-outfit">
              {isNe ? 'भुक्तानी तथा कारोबार अभिलेख' : 'Payments & Transactions'}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {isNe
                ? 'eSewa, Khalti र अफलाइन/म्यानुअल कारोबारहरूको आधिकारिक रेकर्ड।'
                : 'Digital payment gateway receipts, transaction logs and manual cash/voucher settlements.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPayments(pagination.current_page)}
            disabled={loading}
            className="widget-click inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{isNe ? 'रिफ्रेस' : 'Refresh'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: 'all', label: isNe ? 'सबै कारोबारहरू' : 'All Providers' },
            { id: 'cash', label: isNe ? 'नगद (Cash)' : 'Cash' },
            { id: 'bank_transfer', label: isNe ? 'बैंक भौचर (Bank)' : 'Bank Transfer' },
            { id: 'esewa', label: 'eSewa' },
            { id: 'khalti', label: 'Khalti' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedProvider(pill.id)}
              className={`widget-click whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedProvider === pill.id
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {loading && payments.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-7 w-7 text-[#18A999] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">{isNe ? 'कारोबार लोड हुँदैछ...' : 'Loading transactions...'}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-9 w-9 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#123B5D]">
                {isNe ? 'कुनै कारोबार भेटिएन' : 'No Transactions Recorded Yet'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {isNe ? 'ग्राहक भुक्तानी वा प्रशासक स्वीकृतिहरू यहाँ सूचीकृत हुनेछन्।' : 'Incoming payments and settlements will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5"># Transaction Ref</th>
                    <th className="px-5 py-3.5">{isNe ? 'अर्डर नं' : 'Order No'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'विधि (Provider)' : 'Provider / Mode'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'रकम' : 'Amount'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-5 py-3.5">{isNe ? 'प्रमाणीकरण मिति' : 'Verified At'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const orderNo = p.order?.public_order_no || p.order_id || '-';
                    const isCompleted = p.status === 'completed';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-[#123B5D]">
                          <div className="flex items-center gap-1.5">
                            <span>{p.provider_reference || p.id}</span>
                            <button
                              type="button"
                              onClick={() => copyText(p.provider_reference || p.id)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap font-mono font-semibold text-[#18A999]">
                          #{orderNo}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {p.provider}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800 font-outfit">
                          {formatCurrency(p.amount, isNe)}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isNe ? 'सफल' : 'Completed'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold border border-amber-200">
                              <Clock className="h-3 w-3" />
                              <span>{p.status}</span>
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-400">
                          {p.verified_at ? new Date(p.verified_at).toLocaleString() : (p.created_at ? new Date(p.created_at).toLocaleString() : '-')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
