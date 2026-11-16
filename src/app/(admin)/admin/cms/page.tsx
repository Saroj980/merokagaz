'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, CmsContent } from '@/lib/api';
import toast from '@/lib/toast';
import {
  Check,
  RefreshCw,
  LayoutTemplate,
  Building2,
  Workflow,
  HelpCircle,
  Megaphone,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function AdminCmsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'departments' | 'how_it_works' | 'faqs' | 'cta_footer'>('hero');
  const [cms, setCms] = useState<CmsContent | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    loadCms(stored);
  }, []);

  async function loadCms(t = token) {
    setLoading(true);
    try {
      let data: CmsContent;
      if (t) {
        data = await api.admin.cms.get(t);
      } else {
        data = await api.cms.get();
      }
      setCms(data);
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'सामग्री लोड गर्न सकिएन।' : 'Failed to load CMS content.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!cms) return;

    setSaving(true);
    try {
      const res = await api.admin.cms.update(token, cms);
      const updated = (res as any)?.data || res;
      if (updated && typeof updated === 'object') {
        setCms(updated);
      }
      toast.success(isNe ? 'सामग्री सफलतापूर्वक सुरक्षित गरियो!' : 'CMS content updated successfully!');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'सुरक्षित गर्न असफल भयो।' : 'Failed to save CMS content.'));
    } finally {
      setSaving(false);
    }
  }

  // FAQ Handlers
  function addFaq() {
    if (!cms) return;
    const newFaq = {
      qNe: 'नयाँ प्रश्न यहाँ लेख्नुहोस्...',
      qEn: 'Enter new question here...',
      aNe: 'यस प्रश्नको जवाफ यहाँ खुलाउनुहोस्...',
      aEn: 'Provide the answer to this question here...',
    };
    setCms({
      ...cms,
      faqs: [...cms.faqs, newFaq],
    });
  }

  function removeFaq(index: number) {
    if (!cms) return;
    const updated = [...cms.faqs];
    updated.splice(index, 1);
    setCms({ ...cms, faqs: updated });
  }

  function moveFaq(index: number, direction: 'up' | 'down') {
    if (!cms) return;
    const updated = [...cms.faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setCms({ ...cms, faqs: updated });
  }

  function updateFaq(index: number, field: 'qNe' | 'qEn' | 'aNe' | 'aEn', val: string) {
    if (!cms) return;
    const updated = [...cms.faqs];
    updated[index] = { ...updated[index], [field]: val };
    setCms({ ...cms, faqs: updated });
  }

  if (loading || !cms) {
    return (
      <AdminShell>
        <div className="flex h-96 items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-outfit">
            <RefreshCw className="h-4 w-4 animate-spin text-[#18A999]" />
            <span>Loading website CMS data...</span>
          </div>
        </div>
      </AdminShell>
    );
  }

  interface TabItem {
    id: 'hero' | 'departments' | 'how_it_works' | 'faqs' | 'cta_footer';
    labelNe: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'hero', labelNe: 'मुख्य हिरो (Hero)', labelEn: 'Hero Section', icon: LayoutTemplate },
    { id: 'departments', labelNe: 'सरकारी निकायहरू', labelEn: 'Departments', icon: Building2 },
    { id: 'how_it_works', labelNe: 'कार्यप्रणाली (How it Works)', labelEn: 'How It Works', icon: Workflow },
    { id: 'faqs', labelNe: 'सोधिने प्रश्नहरू (FAQs)', labelEn: 'FAQs', icon: HelpCircle, badge: cms.faqs?.length },
    { id: 'cta_footer', labelNe: 'ब्यानर र फुटर', labelEn: 'CTA & Footer', icon: Megaphone },
  ];

  return (
    <AdminShell>
      <form onSubmit={handleSave} className="w-full space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-teal-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-[#18A999]">
                <Sparkles className="h-3 w-3" /> CMS
              </span>
              <h1 className="text-2xl font-extrabold text-[#123B5D]">
                {isNe ? 'सामग्री व्यवस्थापन (Website CMS)' : 'Website Content Management'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'वेबसाइटको मुख्य हिरो, निकायहरू, कार्यविधि चरणहरू, प्रश्नोत्तर (FAQs) र फुटरको सम्पूर्ण सामग्री यहीँबाट सिधै नियन्त्रण गर्नुहोस्।'
                : 'Directly edit all landing page text, department highlights, steps, accordion FAQs, and footer copy.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#123B5D] shadow-xs hover:bg-teal-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{isNe ? 'वेबसाइट हेर्नुहोस्' : 'Preview Site'}</span>
            </a>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#18A999] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#138e80] disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{isNe ? 'सुरक्षित हुँदै...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{isNe ? 'सामग्री सुरक्षित गर्नुहोस्' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-teal-200/60 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`admin-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#123B5D] text-white shadow-xs scale-102'
                    : 'bg-white text-slate-600 border border-teal-100 hover:bg-teal-50 hover:text-[#123B5D]'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-[#F4B942] scale-110' : 'text-slate-400'}`} />
                <span>{isNe ? tab.labelNe : tab.labelEn}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-[#18A999] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: HERO SECTION ─── */}
        {activeTab === 'hero' && (
          <div className="w-full space-y-6 animate-admin-page-in">
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                <LayoutTemplate className="h-4 w-4 text-[#18A999]" />
                {isNe ? 'हिरो सेक्सन हेडलाइन र ब्याड्ज' : 'Hero Badge & Main Headline'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isNe
                  ? 'वेबसाइट खोल्दा देखिने पहिलो मुख्य शीर्षक, हाइलाइट र ब्याड्ज पाठ सम्पादन गर्नुहोस्।'
                  : 'Customize the top badge, prefix headline, emphasized highlight phrase, suffix, and descriptive subtitle.'}
              </p>

              {/* Badge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'शीर्ष ब्याड्ज (नेपाली)' : 'Hero Badge (Nepali)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">NE</span>
                  </label>
                  <input
                    type="text"
                    value={cms.hero.badge_ne}
                    onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, badge_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'शीर्ष ब्याड्ज (अंग्रेजी)' : 'Hero Badge (English)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">EN</span>
                  </label>
                  <input
                    type="text"
                    value={cms.hero.badge_en}
                    onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, badge_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Title Prefix, Highlight, Suffix (Nepali) */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#18A999]"></span>
                  {isNe ? 'नेपाली मुख्य शीर्षक (Title Anatomy)' : 'Nepali Main Headline Anatomy'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prefix Text</label>
                    <input
                      type="text"
                      value={cms.hero.title_prefix_ne}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_prefix_ne: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#18A999] font-bold mb-1">Highlight Word/Phrase (Colored)</label>
                    <input
                      type="text"
                      value={cms.hero.title_highlight_ne}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_highlight_ne: e.target.value } })}
                      className="w-full rounded-lg border border-[#18A999]/40 bg-teal-50/20 px-3 py-2 text-xs font-bold text-[#123B5D] focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Suffix Text</label>
                    <input
                      type="text"
                      value={cms.hero.title_suffix_ne}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_suffix_ne: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Title Prefix, Highlight, Suffix (English) */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                  {isNe ? 'अंग्रेजी मुख्य शीर्षक (Title Anatomy)' : 'English Main Headline Anatomy'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prefix Text</label>
                    <input
                      type="text"
                      value={cms.hero.title_prefix_en}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_prefix_en: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#18A999] font-bold mb-1">Highlight Word/Phrase (Colored)</label>
                    <input
                      type="text"
                      value={cms.hero.title_highlight_en}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_highlight_en: e.target.value } })}
                      className="w-full rounded-lg border border-[#18A999]/40 bg-teal-50/20 px-3 py-2 text-xs font-bold text-[#123B5D] focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Suffix Text</label>
                    <input
                      type="text"
                      value={cms.hero.title_suffix_en}
                      onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, title_suffix_en: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitles */}
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'उपशीर्षक / विवरण (नेपाली)' : 'Subtitle (Nepali)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">NE</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cms.hero.subtitle_ne}
                    onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, subtitle_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'उपशीर्षक / विवरण (अंग्रेजी)' : 'Subtitle (English)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">EN</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cms.hero.subtitle_en}
                    onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, subtitle_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DEPARTMENTS ─── */}
        {activeTab === 'departments' && (
          <div className="w-full space-y-6 animate-admin-page-in">
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-[#18A999]" />
                {isNe ? 'सरकारी निकाय खण्ड (Browse by Department)' : 'Government Departments Section'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isNe
                  ? 'निकाय अनुसार फारमहरू खोज्ने सेक्सनको मुख्य शीर्षक र प्रत्येक निकाय कार्डहरूको विवरण सम्पादन गर्नुहोस्।'
                  : 'Manage section titles and custom bilingual descriptions for IRD, OCR, and Legal Deed cards.'}
              </p>

              {/* Section Headlines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pre-title (Small Tag)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="नेपाली"
                      value={cms.departments.pre_title_ne}
                      onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, pre_title_ne: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={cms.departments.pre_title_en}
                      onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, pre_title_en: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Heading</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="नेपाली"
                      value={cms.departments.main_title_ne}
                      onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, main_title_ne: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={cms.departments.main_title_en}
                      onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, main_title_en: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Department Cards */}
              <div className="mt-6 space-y-6">
                {/* 1. IRD */}
                <div className="rounded-lg border border-teal-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-xs text-[#123B5D]">1. आन्तरिक राजस्व विभाग (IRD)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">विवरण (नेपाली)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.ird_desc_ne}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, ird_desc_ne: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description (English)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.ird_desc_en}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, ird_desc_en: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. OCR */}
                <div className="rounded-lg border border-teal-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-xs text-[#123B5D]">2. कम्पनी रजिस्ट्रारको कार्यालय (OCR)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">विवरण (नेपाली)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.ocr_desc_ne}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, ocr_desc_ne: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description (English)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.ocr_desc_en}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, ocr_desc_en: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Legal Deeds */}
                <div className="rounded-lg border border-teal-100 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-xs text-[#123B5D]">3. कानुनी लिखत तथा सम्झौताहरू (Legal Deeds)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">विवरण (नेपाली)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.legal_desc_ne}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, legal_desc_ne: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description (English)</label>
                      <textarea
                        rows={2}
                        value={cms.departments.legal_desc_en}
                        onChange={(e) => setCms({ ...cms, departments: { ...cms.departments, legal_desc_en: e.target.value } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: HOW IT WORKS ─── */}
        {activeTab === 'how_it_works' && (
          <div className="w-full space-y-6 animate-admin-page-in">
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                <Workflow className="h-4 w-4 text-[#18A999]" />
                {isNe ? 'कार्यप्रणाली चरणहरू (How It Works)' : 'Workflow & Steps'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isNe
                  ? 'नागरिकहरूले कागजात बनाउने ३ वटा सरल चरणहरूको शीर्षक र विवरण सम्पादन गर्नुहोस्।'
                  : 'Customize the 3 guided steps showing citizens how simple it is to prepare their documents.'}
              </p>

              {/* Section Heading */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pre-title / Tag</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="नेपाली"
                      value={cms.how_it_works.pre_title_ne}
                      onChange={(e) => setCms({ ...cms, how_it_works: { ...cms.how_it_works, pre_title_ne: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={cms.how_it_works.pre_title_en}
                      onChange={(e) => setCms({ ...cms, how_it_works: { ...cms.how_it_works, pre_title_en: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Heading</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="नेपाली"
                      value={cms.how_it_works.main_title_ne}
                      onChange={(e) => setCms({ ...cms, how_it_works: { ...cms.how_it_works, main_title_ne: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={cms.how_it_works.main_title_en}
                      onChange={(e) => setCms({ ...cms, how_it_works: { ...cms.how_it_works, main_title_en: e.target.value } })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="mt-6 space-y-4">
                {cms.how_it_works.steps?.map((stepItem, idx) => (
                  <div key={idx} className="rounded-lg border border-teal-100 bg-slate-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18A999] text-[11px] font-bold text-white">
                        {stepItem.step || idx + 1}
                      </span>
                      <span className="font-bold text-xs text-[#123B5D]">
                        {isNe ? `चरण ${idx + 1}` : `Step ${idx + 1}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">शीर्षक (नेपाली)</label>
                        <input
                          type="text"
                          value={stepItem.title_ne}
                          onChange={(e) => {
                            const newSteps = [...cms.how_it_works.steps];
                            newSteps[idx] = { ...newSteps[idx], title_ne: e.target.value };
                            setCms({ ...cms, how_it_works: { ...cms.how_it_works, steps: newSteps } });
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title (English)</label>
                        <input
                          type="text"
                          value={stepItem.title_en}
                          onChange={(e) => {
                            const newSteps = [...cms.how_it_works.steps];
                            newSteps[idx] = { ...newSteps[idx], title_en: e.target.value };
                            setCms({ ...cms, how_it_works: { ...cms.how_it_works, steps: newSteps } });
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">विवरण (नेपाली)</label>
                        <textarea
                          rows={2}
                          value={stepItem.desc_ne}
                          onChange={(e) => {
                            const newSteps = [...cms.how_it_works.steps];
                            newSteps[idx] = { ...newSteps[idx], desc_ne: e.target.value };
                            setCms({ ...cms, how_it_works: { ...cms.how_it_works, steps: newSteps } });
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description (English)</label>
                        <textarea
                          rows={2}
                          value={stepItem.desc_en}
                          onChange={(e) => {
                            const newSteps = [...cms.how_it_works.steps];
                            newSteps[idx] = { ...newSteps[idx], desc_en: e.target.value };
                            setCms({ ...cms, how_it_works: { ...cms.how_it_works, steps: newSteps } });
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: FAQs ─── */}
        {activeTab === 'faqs' && (
          <div className="w-full space-y-6 animate-admin-page-in">
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                    <HelpCircle className="h-4 w-4 text-[#18A999]" />
                    {isNe ? 'प्रायः सोधिने प्रश्नोत्तर (FAQs Management)' : 'Frequently Asked Questions (FAQs)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isNe
                      ? 'वेबसाइटको FAQ एकॉर्डियनमा नयाँ प्रश्न थप्नुहोस्, सम्पादन गर्नुहोस्, क्रम मिलाउनुहोस् वा हटाउनुहोस्।'
                      : 'Add new Q&A pairs, reorder items, or edit bilingual responses directly.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addFaq}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-[#18A999] hover:bg-teal-100 transition shadow-2xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isNe ? 'नयाँ प्रश्न थप्नुहोस्' : 'Add New FAQ'}</span>
                </button>
              </div>

              {cms.faqs?.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  {isNe ? 'कुनै FAQ थपिएको छैन। नयाँ प्रश्न थप्न माथिको बटन थिच्नुहोस्।' : 'No FAQs added yet. Click above to create one.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {cms.faqs?.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 transition-all hover:border-teal-300"
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-2 font-bold text-xs text-[#123B5D]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-700">
                            {idx + 1}
                          </span>
                          <span>{isNe ? `प्रश्न #${idx + 1}` : `Question #${idx + 1}`}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, 'down')}
                            disabled={idx === cms.faqs.length - 1}
                            title="Move Down"
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFaq(idx)}
                            title="Delete FAQ"
                            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                            <span>प्रश्न (नेपाली)</span>
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1 rounded">NE</span>
                          </label>
                          <input
                            type="text"
                            value={faq.qNe}
                            onChange={(e) => updateFaq(idx, 'qNe', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                            <span>Question (English)</span>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">EN</span>
                          </label>
                          <input
                            type="text"
                            value={faq.qEn}
                            onChange={(e) => updateFaq(idx, 'qEn', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Answer Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                            <span>उत्तर (नेपाली)</span>
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1 rounded">NE</span>
                          </label>
                          <textarea
                            rows={3}
                            value={faq.aNe}
                            onChange={(e) => updateFaq(idx, 'aNe', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                            <span>Answer (English)</span>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">EN</span>
                          </label>
                          <textarea
                            rows={3}
                            value={faq.aEn}
                            onChange={(e) => updateFaq(idx, 'aEn', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: CTA BANNER & FOOTER ─── */}
        {activeTab === 'cta_footer' && (
          <div className="w-full space-y-6 animate-admin-page-in">
            {/* CTA Banner */}
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                <Megaphone className="h-4 w-4 text-[#18A999]" />
                {isNe ? 'कल-टु-एक्सन ब्यानर (CTA Section)' : 'Bottom CTA Banner'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isNe
                  ? 'पेजको पुछारमा देखिने मुख्य एक्सन ब्यानर, बटनको नाम र लिङ्कहरू नियन्त्रण गर्नुहोस्।'
                  : 'Manage conversion headlines, subtitles, and button redirects for the full-width bottom banner.'}
              </p>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'ब्यानर मुख्य शीर्षक (नेपाली)' : 'CTA Title (Nepali)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">NE</span>
                  </label>
                  <input
                    type="text"
                    value={cms.cta_banner.title_ne}
                    onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, title_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'ब्यानर मुख्य शीर्षक (अंग्रेजी)' : 'CTA Title (English)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">EN</span>
                  </label>
                  <input
                    type="text"
                    value={cms.cta_banner.title_en}
                    onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, title_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'उपशीर्षक (नेपाली)' : 'Subtitle (Nepali)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">NE</span>
                  </label>
                  <textarea
                    rows={2}
                    value={cms.cta_banner.subtitle_ne}
                    onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, subtitle_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'उपशीर्षक (अंग्रेजी)' : 'Subtitle (English)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">EN</span>
                  </label>
                  <textarea
                    rows={2}
                    value={cms.cta_banner.subtitle_en}
                    onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, subtitle_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                  {isNe ? 'बटन १ र २ को विवरण' : 'Banner Buttons & Target Links'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">बटन १ पाठ (नेपाली)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn1_text_ne}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn1_text_ne: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Button 1 Text (English)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn1_text_en}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn1_text_en: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Button 1 Link (URL)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn1_link}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn1_link: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">बटन २ पाठ (नेपाली)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn2_text_ne}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn2_text_ne: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Button 2 Text (English)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn2_text_en}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn2_text_en: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Button 2 Link (URL)</label>
                    <input
                      type="text"
                      value={cms.cta_banner.btn2_link}
                      onChange={(e) => setCms({ ...cms, cta_banner: { ...cms.cta_banner, btn2_link: e.target.value } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Copy */}
            <div className="rounded-xl border border-teal-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-[#18A999]" />
                {isNe ? 'फुटर परिचय तथा प्रमाणीकरण ब्याड्ज' : 'Footer About Paragraph & Verified Badge'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isNe
                  ? 'फुटरको बायाँपट्टि देखिने संस्थागत परिचय र कानुनी प्रमाणीकरण पाठ।'
                  : 'Footer brand mission statement and legal compliance badges.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'हाम्रो बारेमा (नेपाली)' : 'About Intro (Nepali)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">NE</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cms.footer.about_ne}
                    onChange={(e) => setCms({ ...cms, footer: { ...cms.footer, about_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{isNe ? 'हाम्रो बारेमा (अंग्रेजी)' : 'About Intro (English)'}</span>
                    <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">EN</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cms.footer.about_en}
                    onChange={(e) => setCms({ ...cms, footer: { ...cms.footer, about_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'प्रमाणीकरण ब्याड्ज (नेपाली)' : 'Verified Badge (Nepali)'}
                  </label>
                  <input
                    type="text"
                    value={cms.footer.verified_badge_ne}
                    onChange={(e) => setCms({ ...cms, footer: { ...cms.footer, verified_badge_ne: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'प्रमाणीकरण ब्याड्ज (अंग्रेजी)' : 'Verified Badge (English)'}
                  </label>
                  <input
                    type="text"
                    value={cms.footer.verified_badge_en}
                    onChange={(e) => setCms({ ...cms, footer: { ...cms.footer, verified_badge_en: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </AdminShell>
  );
}
