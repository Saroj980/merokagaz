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
  Landmark,
  Star,
  Check,
  FileCheck,
  Award,
  Layers,
  ShieldCheck,
  Building2,
  Scale,
  Eye,
  ArrowRight,
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
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-teal-50/80 border border-teal-200/80 rounded-full px-4 py-1.5 shadow-2xs self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-[#18A999]" />
            <span>{isNe ? 'कुल कागजात:' : 'Total Documents:'}</span>
            <span className="font-black text-[#123B5D] font-outfit">{filteredDocs.length}</span>
            <span className="text-slate-400">/ {docs.length}</span>
          </div>
        )}
      </div>

      {/* Category Pills & View Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              !categoryParam
                ? 'bg-gradient-to-r from-[#123B5D] to-[#1a4f7c] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-400 hover:text-[#148C7E] shadow-2xs'
            }`}
          >
            {isNe ? 'सबै' : 'All'}
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/documents?category=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                categoryParam === c.slug
                  ? 'bg-gradient-to-r from-[#123B5D] to-[#1a4f7c] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-400 hover:text-[#148C7E] shadow-2xs'
              }`}
            >
              {isNe && c.name_np ? c.name_np : c.name}
            </Link>
          ))}
        </div>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid View"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        <div className="mb-8 overflow-hidden rounded-3xl border border-teal-200/90 bg-gradient-to-br from-white via-teal-50/20 to-sky-50/30 p-6 sm:p-8 lg:p-9 shadow-sm relative">
          {/* Delicate ambient glow backdrops */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl" />

          {/* 2-Column Grid Layout: Left Narrative & Controls, Right Visual Document Stack */}
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Narrative, Tabs & CTA */}
            <div className="lg:col-span-7 xl:col-span-7">
              {/* Suite Switcher Tabs */}
              <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 mb-4 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFeaturedSuite('annual')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    featuredSuite === 'annual'
                      ? 'bg-white text-[#123B5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${featuredSuite === 'annual' ? 'text-amber-500 fill-amber-500' : 'text-amber-400'}`} />
                  <span>{isNe ? 'वार्षिक विवरण अभिलेख (४-इन-१)' : 'Annual Compliance (4-in-1)'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                    featuredSuite === 'annual' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isNe ? 'नयाँ' : 'New'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeaturedSuite('registration')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    featuredSuite === 'registration'
                      ? 'bg-white text-[#123B5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Landmark className={`h-3.5 w-3.5 ${featuredSuite === 'registration' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{isNe ? 'कम्पनी दर्ता (३-इन-१)' : 'Company Registration (3-in-1)'}</span>
                </button>
              </div>

              {featuredSuite === 'annual' ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/90 px-3 py-1 text-[11px] font-bold text-[#148C7E] mb-2.5">
                    <Award className="h-3.5 w-3.5 text-[#148C7E]" />
                    <span>{isNe ? 'आधिकारिक कम्प्लायन्स प्याकेज' : 'Official Statutory Compliance Suite'}</span>
                    <span>•</span>
                    <span>४-इन-१ पूर्ण प्याकेज</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#123B5D] leading-tight mb-2.5 tracking-tight">
                    {isNe
                      ? 'कम्पनी वार्षिक विवरण अभिलेख पूर्ण प्याकेज (४ कागजातहरू)'
                      : 'Annual Compliance Complete Package (4 Documents Suite)'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {isNe
                      ? 'कम्पनी ऐन, २०६३ बमोजिम OCR मा वार्षिक विवरण दाखिला गर्दा आवश्यक पर्ने सम्पूर्ण ४ वटा कागजातहरू एकै फारम भरेर एकसाथ प्राप्त गर्नुहोस्।'
                      : 'Filing Annual Compliance with the Company Registrar? Generate the official Application, Board Minutes, AGM Minutes, and Section 51 Annual Return with a single form.'}
                  </p>

                  {/* 4 Checklist Documents */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>१. दर्ता दरखास्त निवेदन</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>२. संचालक समिति बैठक</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>३. वार्षिक साधारण सभा (AGM)</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>४. दफा ५१ को विवरण</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/documents/annual-compliance-suite/form"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#148C7E] hover:bg-[#0f6c61] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <FileCheck className="h-4 w-4 text-teal-100" />
                      <span>{isNe ? '४ वटै कागजात एकसाथ बनाउनुहोस्' : 'Generate 4-in-1 Suite Now'}</span>
                    </Link>
                    <span className="text-xs text-slate-400 font-medium">
                      {isNe ? 'वा तल व्यक्तिगत कागजातहरू छान्नुहोस् ↓' : 'Or select individual documents below ↓'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/90 px-3 py-1 text-[11px] font-bold text-[#148C7E] mb-2.5">
                    <Award className="h-3.5 w-3.5 text-[#148C7E]" />
                    <span>{isNe ? 'सिफारिस गरिएको पूर्ण प्याकेज' : 'Recommended Registration Suite'}</span>
                    <span>•</span>
                    <span>३-इन-१ पूर्ण प्याकेज</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#123B5D] leading-tight mb-2.5 tracking-tight">
                    {isNe
                      ? 'कम्पनी दर्ता पूर्ण प्याकेज (All-in-One Company Suite)'
                      : 'Complete Company Registration Suite (MOA, AOA & Application)'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {isNe
                      ? 'नेपालमा कम्पनी दर्ता गर्दा चाहिने सबै मुख्य कागजातहरू (दर्ता निवेदन, प्रबन्धपत्र MOA र नियमावली AOA) एकै पटक विवरण भरेर एकसाथ प्राप्त गर्नुहोस्।'
                      : 'Incorporating a Private Limited Company? Generate the official Application to Registrar, Memorandum (MOA), and Articles (AOA) simultaneously with single form entry.'}
                  </p>

                  {/* Checklist of included documents */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>१. दर्ता निवेदन</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>२. प्रबन्धपत्र (MOA)</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>३. नियमावली (AOA)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/company-registration-suite/form"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#148C7E] hover:bg-[#0f6c61] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <FileCheck className="h-4 w-4 text-teal-100" />
                      <span>{isNe ? 'सबै कागजात एकसाथ बनाउनुहोस्' : 'Generate All Documents at Once'}</span>
                    </Link>
                    <span className="text-xs text-slate-400 font-medium">
                      {isNe ? 'वा तल व्यक्तिगत कागजातहरू छान्नुहोस् ↓' : 'Or select individual documents below ↓'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Visual Mockup Showcase */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="relative mx-auto max-w-sm rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-teal-900/5">
                {/* Official Statutory Header */}
                <div className="text-center border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-700 text-sm mb-1 shadow-2xs">
                    <Landmark className="h-4 w-4 text-red-700" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-600">नेपाल सरकार • उद्योग मन्त्रालय</p>
                  <p className="text-xs font-extrabold text-[#123B5D]">कम्पनी रजिष्ट्रारको कार्यालय (OCR)</p>
                  <p className="text-[9px] text-[#148C7E] font-bold">
                    {featuredSuite === 'annual' ? 'वार्षिक अभिलेख कागजात प्याकेज' : 'कम्पनी दर्ता संयुक्त लिखतहरू'}
                  </p>
                </div>

                {/* Verified Stamp Badge */}
                <div className="absolute -top-3 -right-3 rotate-6 rounded-lg border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                  <span>प्रमाणित प्रारूप</span>
                </div>

                {/* Simulated Stack Rows */}
                <div className="mt-3.5 space-y-2 text-[11px]">
                  {featuredSuite === 'annual' ? (
                    <>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">१. दर्ता दरखास्त निवेदन</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">२. सञ्चालक समिति बैठक</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">३. साधारण सभा माइन्युट</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">४. दफा ५१ को विवरण</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">१. दर्ता दरखास्त निवेदन</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">२. प्रबन्धपत्र (MOA)</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 border border-slate-100">
                        <span className="text-slate-600 font-medium">३. नियमावली (AOA)</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">तयार</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Trust Microbar */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-outfit">
                  <span className="flex items-center gap-1 text-[#148C7E] font-bold">
                    <Clock className="h-3 w-3" />
                    <span>Instant PDF</span>
                  </span>
                  <span>A4 Print-Ready</span>
                  <span className="font-bold text-[#123B5D]">100% Legal</span>
                </div>
              </div>
            </div>
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
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => {
              const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
              const docDesc = isNe && doc.description_np ? doc.description_np : doc.description;
              const isSuite = doc.slug.includes('suite');

              return (
                <div
                  key={doc.slug}
                  className={`group relative flex flex-col justify-between rounded-2xl bg-white p-5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 border ${
                    isSuite
                      ? 'border-teal-400 ring-2 ring-teal-100/70 bg-gradient-to-b from-teal-50/20 to-white'
                      : 'border-slate-200/90 hover:border-[#18A999]/80'
                  }`}
                >
                  <div>
                    {/* Minimal Top Meta Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        {doc.category?.slug === 'ocr' ? (
                          <Building2 className="h-4 w-4 text-slate-400" />
                        ) : doc.category?.slug === 'ird' ? (
                          <Landmark className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Scale className="h-4 w-4 text-slate-400" />
                        )}
                        {doc.processing_time && (
                          <span>{formatProcessingTime(doc.processing_time, isNe)}</span>
                        )}
                      </div>

                      {isSuite && (
                        <span className="rounded-md bg-amber-50 border border-amber-200/90 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {isNe ? 'संयुक्त प्याकेज' : 'Full Package'}
                        </span>
                      )}
                    </div>

                    {/* Document Title */}
                    <Link href={`/documents/${doc.slug}/form`} className="block group-hover:text-[#18A999] transition">
                      <h2 className="text-base font-bold text-[#123B5D] leading-snug group-hover:text-[#18A999] transition line-clamp-2">
                        {docTitle}
                      </h2>
                    </Link>

                    {/* Clean Description */}
                    {docDesc && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {docDesc}
                      </p>
                    )}
                  </div>

                  {/* Clean Bottom Footer */}
                  <div className="mt-5 border-t border-slate-100 pt-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-base font-bold font-outfit ${Number(doc.price) === 0 ? 'text-emerald-600' : 'text-[#123B5D]'}`}>
                        {Number(doc.price) === 0 ? (isNe ? 'निःशुल्क (Free)' : 'Free') : formatCurrency(doc.price, isNe)}
                      </span>

                      <span className="text-[11px] font-medium text-slate-400">
                        {isNe ? 'A4 ढाँचा' : 'A4 Print Ready'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/documents/${doc.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>{isNe ? 'विवरण' : 'Details'}</span>
                      </Link>
                      <Link
                        href={`/documents/${doc.slug}/form`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#123B5D] hover:bg-[#18A999] py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer group-hover:shadow-md"
                      >
                        <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
              const docDesc = isNe && doc.description_np ? doc.description_np : doc.description;
              const isSuite = doc.slug.includes('suite');

              return (
                <div
                  key={doc.slug}
                  className={`group rounded-2xl bg-white p-4 sm:p-5 transition-all duration-200 shadow-2xs hover:shadow-md border flex flex-col justify-between ${
                    isSuite
                      ? 'border-teal-400 ring-2 ring-teal-100/70 bg-gradient-to-br from-teal-50/20 via-white to-white'
                      : 'border-slate-200/90 hover:border-[#18A999]/80'
                  }`}
                >
                  {/* Top: Icon + Content */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 shadow-2xs group-hover:border-teal-300 group-hover:bg-teal-50/50 transition">
                      {doc.category?.slug === 'ocr' ? (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      ) : doc.category?.slug === 'ird' ? (
                        <Landmark className="h-5 w-5 text-teal-600" />
                      ) : (
                        <Scale className="h-5 w-5 text-purple-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Status / Suite pill */}
                      <div className="flex items-center gap-2 mb-1">
                        {doc.processing_time && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatProcessingTime(doc.processing_time, isNe)}
                          </span>
                        )}

                        {isSuite && (
                          <span className="rounded-md bg-amber-50 border border-amber-200/90 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-800">
                            {isNe ? 'संयुक्त प्याकेज' : 'Full Package'}
                          </span>
                        )}
                      </div>

                      {/* Document Title */}
                      <Link href={`/documents/${doc.slug}/form`} className="block">
                        <h2 className="text-sm sm:text-base font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug line-clamp-1">
                          {docTitle}
                        </h2>
                      </Link>

                      {/* Clean Description */}
                      {docDesc && (
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-1">
                          {docDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Fee & Actions */}
                  <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                    <span className={`text-base font-bold font-outfit ${Number(doc.price) === 0 ? 'text-emerald-600' : 'text-[#123B5D]'}`}>
                      {Number(doc.price) === 0 ? (isNe ? 'निःशुल्क (Free)' : 'Free') : formatCurrency(doc.price, isNe)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/documents/${doc.slug}`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>{isNe ? 'विवरण' : 'Details'}</span>
                      </Link>

                      <Link
                        href={`/documents/${doc.slug}/form`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] hover:bg-[#18A999] px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-xs group-hover:shadow-md whitespace-nowrap"
                      >
                        <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
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
