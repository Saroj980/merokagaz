'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, Document, formatCurrency } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, Clock, FileText, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

function formatProcessingTime(timeStr: string | null | undefined, isNe: boolean): string {
  if (!timeStr) return '';
  if (isNe) return timeStr;
  const nepToEn: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    'मिनेट': 'mins',
    'तत्काल': 'Instant',
    'दिन': 'days',
    'घण्टा': 'hours',
  };
  let res = timeStr;
  Object.entries(nepToEn).forEach(([k, v]) => {
    res = res.replaceAll(k, v);
  });
  return res;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    api.documents.get(slug)
      .then((data) => {
        if (!isMounted) return;
        setDoc(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="h-7 w-7 text-[#18A999] animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">
          {isNe ? 'कागजात लोड हुँदैछ...' : 'Loading document details...'}
        </p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-md my-16 rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-xs">
        <p className="text-sm font-bold text-rose-700">
          {isNe ? 'कागजात फेला परेन।' : 'Document not found.'}
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

  const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
  const docSubtitle = isNe ? doc.name : (doc.name_np || null);
  const docDesc = isNe && doc.description_np ? doc.description_np : doc.description;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-[#18A999] transition font-semibold">
          {isNe ? 'गृहपृष्ठ' : 'Home'}
        </Link>
        <span>/</span>
        <Link href="/documents" className="hover:text-[#18A999] transition font-semibold">
          {isNe ? 'कागजातहरू' : 'Documents'}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-bold line-clamp-1">{docTitle}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="mb-3 inline-block rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-[#148C7E]">
              {doc.department}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] leading-tight">
              {docTitle}
            </h1>
            {docSubtitle && (
              <p className="mt-1 text-xs font-medium text-slate-400">
                {docSubtitle}
              </p>
            )}
            {docDesc && (
              <p className="mt-4 leading-relaxed text-slate-600 text-xs sm:text-sm">
                {docDesc}
              </p>
            )}
          </div>

          {/* Requirements */}
          {doc.requirements && doc.requirements.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#123B5D] mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#18A999]" />
                <span>{isNe ? 'आवश्यक प्रमाण कागजातहरू' : 'Required Documents & Prerequisites'}</span>
              </h2>
              <ul className="space-y-2.5">
                {doc.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#18A999] shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="text-center border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isNe ? 'आधिकारिक शुल्क' : 'Official Fee'}
              </span>
              <div className="text-3xl font-black text-[#123B5D] font-outfit mt-1">
                {formatCurrency(doc.price, isNe)}
              </div>
              {doc.processing_time && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatProcessingTime(doc.processing_time, isNe)}</span>
                </p>
              )}
            </div>

            <Link
              href={`/documents/${slug}/form`}
              className="btn-shimmer widget-click flex w-full items-center justify-center gap-2 rounded-2xl bg-[#18A999] py-3.5 text-center text-xs font-bold text-white shadow-md shadow-teal-500/25 hover:bg-[#148C7E] transition cursor-pointer"
            >
              <span>{isNe ? 'फारम भर्न सुरु गर्नुहोस्' : 'Start Application Form'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {doc.active_version && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified Template ({doc.active_version.version_number})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
