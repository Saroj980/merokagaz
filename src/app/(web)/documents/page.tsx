'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, Document, Category, formatCurrency } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import {
  Clock,
  RefreshCw,
  FileText,
  LayoutGrid,
  List,
  Search,
  X,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';

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

function DocumentsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || undefined;
  const searchParam = searchParams.get('search') || undefined;

  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [docs, setDocs] = useState<Document[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Search, Sort & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [sortBy, setSortBy] = useState<'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('default');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under-250' | '250-500' | 'above-500'>('all');
  const [featuredSuite, setFeaturedSuite] = useState<'annual' | 'registration'>('annual');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setHasError(false);

    Promise.allSettled([
      api.documents.list({ category: categoryParam }),
      api.categories.list(),
    ])
      .then(([docRes, catRes]) => {
        if (!isMounted) return;
        if (docRes.status === 'fulfilled') setDocs(docRes.value);
        else setHasError(true);

        if (catRes.status === 'fulfilled') setCats(catRes.value);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryParam]);

  // Extract distinct departments from docs
  const departments = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set).sort();
  }, [docs]);

  // Options for Department CustomSelect
  const departmentOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: 'all',
        label: isNe ? 'सबै निकाय' : 'All Departments',
        subLabel: isNe ? 'कम्पनी, कर, वडा तथा अन्य सबै निकाय' : 'All government bodies',
      },
    ];

    departments.forEach((d) => {
      let label = d;
      let subLabel = '';
      if (d === 'OCR') {
        label = isNe ? 'कम्पनी रजिष्ट्रार (OCR)' : 'Company Registrar (OCR)';
        subLabel = isNe ? 'कम्पनी दर्ता, MOA, AOA' : 'Corporate Filing';
      } else if (d === 'IRD') {
        label = isNe ? 'आन्तरिक राजस्व (IRD)' : 'Inland Revenue (IRD)';
        subLabel = isNe ? 'PAN, VAT कर सेवाहरू' : 'Tax & VAT Services';
      } else if (d === 'WARD') {
        label = isNe ? 'वडा / स्थानीय तह (WARD)' : 'Local Ward (WARD)';
        subLabel = isNe ? 'सिफारिस तथा प्रमाणीकरण' : 'Recommendations';
      } else if (d === 'LEGAL') {
        label = isNe ? 'कानुनी लिखत (LEGAL)' : 'Legal Agreements (LEGAL)';
        subLabel = isNe ? 'करारनामा तथा सम्झौता' : 'Deeds & Contracts';
      }
      list.push({ value: d, label, subLabel });
    });

    return list;
  }, [departments, isNe]);

  // Options for Price Filter CustomSelect
  const priceOptions: SelectOption[] = useMemo(() => [
    {
      value: 'all',
      label: isNe ? 'सबै शुल्क' : 'All Fees',
      subLabel: isNe ? 'सबै मूल्य दायरा' : 'Any fee level',
    },
    {
      value: 'under-250',
      label: isNe ? 'रु. २५० भन्दा कम' : 'Under Rs. 250',
      subLabel: isNe ? 'सुलभ तथा प्रारम्भिक' : 'Budget & basic documents',
    },
    {
      value: '250-500',
      label: isNe ? 'रु. २५० – रु. ५००' : 'Rs. 250 – Rs. 500',
      subLabel: isNe ? 'मध्यम स्तरका फारमहरू' : 'Standard registration forms',
    },
    {
      value: 'above-500',
      label: isNe ? 'रु. ५०० भन्दा बढी' : 'Above Rs. 500',
      subLabel: isNe ? 'विस्तृत तथा पूर्ण प्याकेज' : 'Full packages & deeds',
    },
  ], [isNe]);

  // Options for Sorting CustomSelect
  const sortOptions: SelectOption[] = useMemo(() => [
    {
      value: 'default',
      label: isNe ? 'पूर्वनिर्धारित' : 'Sort: Default',
      subLabel: isNe ? 'सिफारिस गरिएका' : 'Recommended order',
    },
    {
      value: 'name-asc',
      label: isNe ? 'नाम (क → ज्ञ)' : 'Name (A to Z)',
      subLabel: isNe ? 'वर्णानुक्रम अनुसार' : 'Alphabetical',
    },
    {
      value: 'name-desc',
      label: isNe ? 'नाम (ज्ञ → क)' : 'Name (Z to A)',
      subLabel: isNe ? 'उल्टो वर्णानुक्रम' : 'Reverse alphabetical',
    },
    {
      value: 'price-asc',
      label: isNe ? 'शुल्क: कम देखि बढी' : 'Fee: Low to High',
      subLabel: isNe ? 'न्यूनतम शुल्क पहिले' : 'Cheapest first',
    },
    {
      value: 'price-desc',
      label: isNe ? 'शुल्क: बढी देखि कम' : 'Fee: High to Low',
      subLabel: isNe ? 'अधिकतम शुल्क पहिले' : 'Highest fee first',
    },
  ], [isNe]);

  // Client-side instant filter and sort
  const filteredDocs = useMemo(() => {
    let list = [...docs];

    // 1. Text Search across title, description, department, slug
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const titleEn = (d.name || '').toLowerCase();
        const titleNp = (d.name_np || '').toLowerCase();
        const descEn = (d.description || '').toLowerCase();
        const descNp = (d.description_np || '').toLowerCase();
        const dept = (d.department || '').toLowerCase();
        const slug = (d.slug || '').toLowerCase();
        return (
          titleEn.includes(q) ||
          titleNp.includes(q) ||
          descEn.includes(q) ||
          descNp.includes(q) ||
          dept.includes(q) ||
          slug.includes(q)
        );
      });
    }

    // 2. Department filter
    if (departmentFilter !== 'all') {
      list = list.filter(
        (d) => (d.department || '').toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    // 3. Price range filter
    if (priceFilter !== 'all') {
      list = list.filter((d) => {
        const p = Number(d.price) || 0;
        if (priceFilter === 'under-250') return p < 250;
        if (priceFilter === '250-500') return p >= 250 && p <= 500;
        if (priceFilter === 'above-500') return p > 500;
        return true;
      });
    }

    // 4. Sorting
    if (sortBy === 'name-asc') {
      list.sort((a, b) => {
        const aTitle = (isNe && a.name_np ? a.name_np : a.name).toLowerCase();
        const bTitle = (isNe && b.name_np ? b.name_np : b.name).toLowerCase();
        return aTitle.localeCompare(bTitle, isNe ? 'ne' : 'en');
      });
    } else if (sortBy === 'name-desc') {
      list.sort((a, b) => {
        const aTitle = (isNe && a.name_np ? a.name_np : a.name).toLowerCase();
        const bTitle = (isNe && b.name_np ? b.name_np : b.name).toLowerCase();
        return bTitle.localeCompare(aTitle, isNe ? 'ne' : 'en');
      });
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return list;
  }, [docs, searchQuery, departmentFilter, priceFilter, sortBy, isNe]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || departmentFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'default'
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setPriceFilter('all');
    setSortBy('default');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Page Title & Intro */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] font-outfit">
            {isNe ? 'आधिकारिक सरकारी कागजातहरू' : 'Official Government Documents'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {isNe
              ? 'नेपाल सरकारका विभिन्न निकायहरूका प्रमाणित निवेदन, प्रबन्धपत्र, नियमावली तथा सम्झौता ढाँचाहरू।'
              : 'Verified official applications, deeds, and registration templates.'}
          </p>
        </div>

        {/* Count Badge */}
        {!loading && (
          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/90 rounded-full px-3.5 py-1.5 shadow-2xs self-start sm:self-auto">
            {isNe ? 'कुल कागजात:' : 'Total Documents:'}{' '}
            <span className="font-extrabold text-[#123B5D] font-outfit">{filteredDocs.length}</span> / {docs.length}
          </div>
        )}
      </div>

      {/* Category Pills & View Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              !categoryParam
                ? 'bg-[#123B5D] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isNe ? 'सबै' : 'All'}
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/documents?category=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                categoryParam === c.slug
                  ? 'bg-[#123B5D] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isNe && c.name_np ? c.name_np : c.name}
            </Link>
          ))}
        </div>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid View"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#123B5D] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isNe ? 'ग्रिड' : 'Grid'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List View"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#123B5D] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isNe ? 'सूची' : 'List'}</span>
          </button>
        </div>
      </div>

      {/* ── Search, Sort & Filter Bar ── */}
      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isNe
                  ? 'कागजात खोज्नुहोस् (उदा. दर्ता निवेदन, PAN, MOA, नियमावली, अख्तियारी...)'
                  : 'Search documents by title, keyword, or department (e.g. PAN, MOA, AOA...)'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 py-2.5 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#18A999] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#18A999]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title={isNe ? 'खाली गर्नुहोस्' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter & Sort Dropdowns with CustomSelect */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Department Filter */}
            <div className="flex-1 sm:flex-initial min-w-[170px]">
              <CustomSelect
                value={departmentFilter}
                onChange={(val) => setDepartmentFilter(val)}
                options={departmentOptions}
                searchable={departmentOptions.length > 3}
                searchPlaceholder={isNe ? 'निकाय खोज्नुहोस्...' : 'Search agencies...'}
                trailingIcon={<Filter className="h-3.5 w-3.5" />}
                hideChevron={true}
                buttonClassName={`rounded-full px-4 py-2 border transition-all text-xs font-semibold ${
                  departmentFilter !== 'all'
                    ? 'border-[#18A999] bg-teal-50/40 text-[#123B5D] ring-2 ring-[#18A999]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#18A999]'
                }`}
              />
            </div>

            {/* Price Filter */}
            <div className="flex-1 sm:flex-initial min-w-[160px]">
              <CustomSelect
                value={priceFilter}
                onChange={(val) => setPriceFilter(val as any)}
                options={priceOptions}
                searchable={false}
                trailingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                hideChevron={true}
                buttonClassName={`rounded-full px-4 py-2 border transition-all text-xs font-semibold ${
                  priceFilter !== 'all'
                    ? 'border-[#18A999] bg-teal-50/40 text-[#123B5D] ring-2 ring-[#18A999]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#18A999]'
                }`}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex-1 sm:flex-initial min-w-[175px]">
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={sortOptions}
                searchable={false}
                trailingIcon={<ArrowUpDown className="h-3.5 w-3.5" />}
                hideChevron={true}
                buttonClassName={`rounded-full px-4 py-2 border transition-all text-xs font-semibold ${
                  sortBy !== 'default'
                    ? 'border-[#18A999] bg-teal-50/40 text-[#123B5D] ring-2 ring-[#18A999]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#18A999]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Active Filter Badges & Reset */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-600">
              <span>
                {isNe ? 'फेला परेको:' : 'Found:'}{' '}
                <strong className="text-[#123B5D] font-bold font-outfit">{filteredDocs.length}</strong>{' '}
                {isNe ? 'वटा कागजात' : 'documents'}
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#18A999] border border-teal-200/50">
                  <span>खोज: &ldquo;{searchQuery}&rdquo;</span>
                </span>
              )}
              {departmentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/50">
                  <span>निकाय: {departmentFilter}</span>
                </span>
              )}
              {priceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">
                  <span>
                    शुल्क:{' '}
                    {priceFilter === 'under-250'
                      ? '< Rs. 250'
                      : priceFilter === '250-500'
                      ? 'Rs. 250-500'
                      : '> Rs. 500'}
                  </span>
                </span>
              )}
              {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                  <span>क्रमबद्ध</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{isNe ? 'सबै फिल्टर हटाउनुहोस्' : 'Reset all filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Featured Document Suites Spotlight Banner ── */}
      {(!categoryParam || categoryParam === 'ocr') && !searchQuery && (
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#123B5D] via-[#1a4f7c] to-[#148C7E] p-6 sm:p-8 text-white shadow-xl relative">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none text-9xl">
            {featuredSuite === 'annual' ? '📊' : '🏛️'}
          </div>

          <div className="relative z-10 max-w-3xl">
            {/* Suite Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFeaturedSuite('annual')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  featuredSuite === 'annual'
                    ? 'bg-emerald-400 text-slate-900 shadow-md ring-2 ring-emerald-300/50'
                    : 'bg-white/10 text-teal-100 hover:bg-white/20'
                }`}
              >
                <span>🌟</span>
                <span>{isNe ? 'वार्षिक विवरण अभिलेख (४-इन-१)' : 'Annual Compliance (4-in-1)'}</span>
                <span className="text-[10px] bg-slate-900/20 px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                  {isNe ? 'नयाँ' : 'New'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFeaturedSuite('registration')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  featuredSuite === 'registration'
                    ? 'bg-emerald-400 text-slate-900 shadow-md ring-2 ring-emerald-300/50'
                    : 'bg-white/10 text-teal-100 hover:bg-white/20'
                }`}
              >
                <span>🏛️</span>
                <span>{isNe ? 'कम्पनी दर्ता (३-इन-१)' : 'Company Registration (3-in-1)'}</span>
              </button>
            </div>

            {featuredSuite === 'annual' ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/25 px-3 py-1 text-[11px] font-bold text-emerald-200 border border-emerald-400/30 mb-2 backdrop-blur-xs">
                  <span>✨ {isNe ? 'प्रमुख फिचर्ड प्याकेज (Featured Suite)' : 'Featured Compliance Suite'}</span>
                  <span>•</span>
                  <span>४-इन-१ पूर्ण प्याकेज</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black font-outfit leading-tight mb-2">
                  {isNe
                    ? 'कम्पनी वार्षिक विवरण अभिलेख पूर्ण प्याकेज (४ कागजातहरू)'
                    : 'Annual Compliance Complete Package (4 Documents Suite)'}
                </h2>

                <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed mb-4">
                  {isNe
                    ? 'कम्पनी ऐन, २०६३ बमोजिम OCR मा वार्षिक विवरण दाखिला गर्दा आवश्यक पर्ने सम्पूर्ण ४ वटा कागजातहरू (दर्ता निवेदन, सञ्चालक समिति बैठक, साधारण सभा माइन्युट र दफा ५१ को विवरण) एकै फारम भरेर एकसाथ प्राप्त गर्नुहोस्।'
                    : 'Filing Annual Compliance with the Company Registrar? Generate the official Application to Registrar, Board Meeting Minutes, AGM Minutes, and Section 51 Annual Return with a single form.'}
                </p>

                {/* 4 Checklist Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-emerald-300 font-bold">✓</span>
                    <span>१. दर्ता दरखास्त निवेदन (वार्षिक विवरण अभिलेख)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-emerald-300 font-bold">✓</span>
                    <span>२. संचालक समितिको बैठक (साधारण सभा बोलाउने)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-emerald-300 font-bold">✓</span>
                    <span>३. वार्षिक साधारण सभा (४ वटा निर्णयहरू)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-emerald-300 font-bold">✓</span>
                    <span>४. कम्पनी ऐनको दफा ५१ को विवरण</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/documents/annual-compliance-suite/form"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-lg transition hover:from-emerald-300 hover:to-teal-400 active:scale-95"
                  >
                    <span>🚀 {isNe ? '४ वटै कागजात एकसाथ बनाउनुहोस्' : 'Generate 4-in-1 Suite Now'}</span>
                  </Link>
                  <span className="text-xs text-teal-100/70 font-medium">
                    {isNe ? 'वा तल व्यक्तिगत कागजातहरू छान्नुहोस् ↓' : 'Or select individual documents below ↓'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/20 px-3 py-1 text-[11px] font-bold text-teal-200 border border-teal-400/30 mb-2 backdrop-blur-xs">
                  <span>🏛️ {isNe ? 'सिफारिस गरिएको' : 'Recommended'}</span>
                  <span>•</span>
                  <span>३-इन-१ पूर्ण प्याकेज</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black font-outfit leading-tight mb-2">
                  {isNe
                    ? 'कम्पनी दर्ता पूर्ण प्याकेज (All-in-One Company Suite)'
                    : 'Complete Company Registration Suite (MOA, AOA & Application)'}
                </h2>

                <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed mb-4">
                  {isNe
                    ? 'नेपालमा कम्पनी दर्ता गर्दा चाहिने सबै मुख्य कागजातहरू (दर्ता निवेदन, प्रबन्धपत्र MOA र नियमावली AOA) अब छुट्टाछुट्टै फारम भरिरहनु पर्दैन। एकै पटक विवरण भरेर सबै कागजात एकसाथ प्राप्त गर्नुहोस्।'
                    : 'Incorporating a Private Limited Company? Generate the official Application to Registrar, Memorandum (MOA), and Articles (AOA) simultaneously with single form entry.'}
                </p>

                {/* Checklist of included documents */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-teal-300">✓</span>
                    <span>१. दर्ता दरखास्त निवेदन</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-teal-300">✓</span>
                    <span>२. प्रबन्धपत्र (MOA)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-xs border border-white/10">
                    <span className="text-teal-300">✓</span>
                    <span>३. नियमावली (AOA)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/company-registration-suite/form"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-lg transition hover:from-emerald-300 hover:to-teal-400 active:scale-95"
                  >
                    <span>🚀 {isNe ? 'सबै कागजात एकसाथ बनाउनुहोस्' : 'Generate All Documents at Once'}</span>
                  </Link>
                  <span className="text-xs text-teal-100/70 font-medium">
                    {isNe ? 'वा तल व्यक्तिगत कागजातहरू छान्नुहोस् ↓' : 'Or select individual documents below ↓'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <RefreshCw className="h-7 w-7 text-[#18A999] animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">
            {isNe ? 'कागजातहरू लोड हुँदैछ...' : 'Loading document catalogue...'}
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && hasError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 text-xs">
          <strong>{isNe ? 'सर्भरसँग सम्पर्क हुन सकेन।' : 'Unable to reach backend API.'}</strong>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasError && filteredDocs.length === 0 && (
        <div className="py-16 text-center text-slate-500 rounded-3xl bg-white border border-slate-200 p-8">
          <div className="mb-3 text-5xl">🔍</div>
          <p className="font-bold text-base text-[#123B5D]">
            {isNe ? 'कुनै कागजात फेला परेन' : 'No documents found'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isNe
              ? 'तपाईंले खोज्नुभएको शब्द वा छनोट गर्नुभएको फिल्टर अनुसार कागजात फेला परेन। कृपया फरक शब्द प्रयोग गर्नुहोस्।'
              : 'No documents match your search or filter criteria. Try adjusting your query.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#18A999] transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isNe ? 'सबै फिल्टर हटाउनुहोस्' : 'Reset all filters'}</span>
            </button>
          )}
        </div>
      )}

      {/* Documents Display: Grid or List */}
      {!loading && filteredDocs.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => {
              const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
              const docDesc = isNe && doc.description_np ? doc.description_np : doc.description;

              return (
                <Link
                  key={doc.slug}
                  href={`/documents/${doc.slug}/form`}
                  className="group card-hover-effect rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-[#18A999] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#18A999]">
                        {doc.department}
                      </p>
                      {doc.processing_time && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatProcessingTime(doc.processing_time, isNe)}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="mb-2 font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug">
                      {docTitle}
                    </h2>
                    {docDesc && (
                      <p className="mb-4 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                        {docDesc}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">
                        {isNe ? 'शुल्क' : 'Fee'}
                      </span>
                      <span className="text-base font-bold text-[#123B5D] font-outfit">
                        {formatCurrency(doc.price, isNe)}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#123B5D] group-hover:bg-[#18A999] group-hover:text-white group-hover:border-[#18A999] transition">
                      <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => {
              const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
              const docDesc = isNe && doc.description_np ? doc.description_np : doc.description;

              return (
                <Link
                  key={doc.slug}
                  href={`/documents/${doc.slug}/form`}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#18A999] hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#18A999]">
                        {doc.department}
                      </span>
                      {doc.processing_time && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatProcessingTime(doc.processing_time, isNe)}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug">
                      {docTitle}
                    </h2>
                    {docDesc && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-600 leading-relaxed">
                        {docDesc}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {isNe ? 'शुल्क' : 'Fee'}
                      </span>
                      <span className="text-base font-extrabold text-[#123B5D] font-outfit">
                        {formatCurrency(doc.price, isNe)}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-bold text-white transition group-hover:bg-[#18A999] shadow-xs whitespace-nowrap">
                      <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
