'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import toast from '@/lib/toast';
import ModalPortal from '@/components/ui/ModalPortal';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Plus,
  Trash2,
  ExternalLink,
  PhoneCall,
  Search,
  Globe,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  FolderPlus,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function AdminPortalsContactsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [activeTab, setActiveTab] = useState<'links' | 'emergency'>('links');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Sections State
  const [sections, setSections] = useState<any[]>([]);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [manageSectionsOpen, setManageSectionsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [sectionForm, setSectionForm] = useState({
    slug: '',
    title_en: '',
    title_ne: '',
    description_en: '',
    sort_order: 1,
    is_active: true,
  });

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    title_en: '',
    title_ne: '',
    description_en: '',
    sort_order: 1,
    is_active: true,
  });

  // Government Links State
  const [links, setLinks] = useState<any[]>([]);
  const [linksFilterSection, setLinksFilterSection] = useState<string>('all');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [linkForm, setLinkForm] = useState({
    section: 'public_benefits',
    title_en: '',
    title_ne: '',
    url: '',
    icon: 'public',
    badge_text: '',
    sort_order: 1,
    is_active: true,
  });

  // Emergency Numbers State
  const [numbers, setNumbers] = useState<any[]>([]);
  const [numbersFilterCat, setNumbersFilterCat] = useState<string>('all');
  const [emergencySearch, setEmergencySearch] = useState('');
  const [numberModalOpen, setNumberModalOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<any | null>(null);
  const [numberForm, setNumberForm] = useState({
    category: 'general',
    service_name_en: '',
    service_name_ne: '',
    phone_number: '',
    alternate_number: '',
    region_type: 'national',
    sort_order: 1,
    is_active: true,
  });

  useEffect(() => {
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    loadData(stored);
  }, []);

  async function loadData(t = token) {
    setLoading(true);
    try {
      const [linksRes, numsRes, secRes, catRes] = await Promise.all([
        api.admin.portals.getLinks(t),
        api.admin.portals.getEmergencyNumbers(t),
        api.admin.portals.getSections(t),
        api.admin.portals.getCategories(t),
      ]);

      setLinks((linksRes as any)?.data?.links || (linksRes as any)?.links || []);
      setNumbers((numsRes as any)?.data?.numbers || (numsRes as any)?.numbers || []);
      setSections((secRes as any)?.data?.sections || (secRes as any)?.sections || []);
      setCategories((catRes as any)?.data?.categories || (catRes as any)?.categories || []);
    } catch (err: any) {
      toast.error(err.message || 'डाटा लोड हुन सकेन।');
    } finally {
      setLoading(false);
    }
  }

  // ─── Section Management Handlers ────────────────────────────
  function openAddSection() {
    setEditingSection(null);
    setSectionForm({
      slug: '',
      title_en: '',
      title_ne: '',
      description_en: '',
      sort_order: sections.length + 1,
      is_active: true,
    });
    setSectionModalOpen(true);
  }

  function openEditSection(item: any) {
    setEditingSection(item);
    setSectionForm({
      slug: item.slug || '',
      title_en: item.title_en || '',
      title_ne: item.title_ne || '',
      description_en: item.description_en || '',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ?? true,
    });
    setSectionModalOpen(true);
  }

  async function handleSaveSection(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingSection) {
        await api.admin.portals.updateSection(token, editingSection.id, sectionForm);
        toast.success(isNe ? 'सेक्सन सफलतापूर्वक अद्यावधिक भयो।' : 'Section updated successfully.');
      } else {
        await api.admin.portals.createSection(token, sectionForm);
        toast.success(isNe ? 'नयाँ सेक्सन थपियो।' : 'Section created successfully.');
      }
      setSectionModalOpen(false);
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'सेक्सन सुरक्षित गर्न सकिएन।');
    }
  }

  async function handleDeleteSection(id: number) {
    if (!confirm(isNe ? 'के तपाईं यो सेक्सन मेटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to delete this section?')) return;
    try {
      await api.admin.portals.deleteSection(token, id);
      toast.success(isNe ? 'सेक्सन मेटाइयो।' : 'Section deleted.');
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'मेटाउन सकिएन।');
    }
  }

  // ─── Category Management Handlers ───────────────────────────
  function openAddCategory() {
    setEditingCategory(null);
    setCategoryForm({
      slug: '',
      title_en: '',
      title_ne: '',
      description_en: '',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setCategoryModalOpen(true);
  }

  function openEditCategory(item: any) {
    setEditingCategory(item);
    setCategoryForm({
      slug: item.slug || '',
      title_en: item.title_en || '',
      title_ne: item.title_ne || '',
      description_en: item.description_en || '',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ?? true,
    });
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingCategory) {
        await api.admin.portals.updateCategory(token, editingCategory.id, categoryForm);
        toast.success(isNe ? 'वर्ग सफलतापूर्वक अद्यावधिक भयो।' : 'Category updated successfully.');
      } else {
        await api.admin.portals.createCategory(token, categoryForm);
        toast.success(isNe ? 'नयाँ वर्ग थपियो।' : 'Category created successfully.');
      }
      setCategoryModalOpen(false);
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'वर्ग सुरक्षित गर्न सकिएन।');
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm(isNe ? 'के तपाईं यो वर्ग मेटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to delete this category?')) return;
    try {
      await api.admin.portals.deleteCategory(token, id);
      toast.success(isNe ? 'वर्ग मेटाइयो।' : 'Category deleted.');
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'मेटाउन सकिएन।');
    }
  }

  // ─── Link Handlers ──────────────────────────────────────────
  function openAddLink() {
    setEditingLink(null);
    const defaultSection = sections.length > 0 ? sections[0].slug : 'public_benefits';
    setLinkForm({
      section: defaultSection,
      title_en: '',
      title_ne: '',
      url: '',
      icon: 'public',
      badge_text: '',
      sort_order: links.length + 1,
      is_active: true,
    });
    setLinkModalOpen(true);
  }

  function openEditLink(item: any) {
    setEditingLink(item);
    setLinkForm({
      section: item.section || (sections.length > 0 ? sections[0].slug : 'public_benefits'),
      title_en: item.title_en || '',
      title_ne: item.title_ne || '',
      url: item.url || '',
      icon: item.icon || 'public',
      badge_text: item.badge_text || '',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ?? true,
    });
    setLinkModalOpen(true);
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingLink) {
        await api.admin.portals.updateLink(token, editingLink.id, linkForm);
        toast.success(isNe ? 'लिंक सफलतापूर्वक अपडेट भयो।' : 'Link updated successfully.');
      } else {
        await api.admin.portals.createLink(token, linkForm);
        toast.success(isNe ? 'नयाँ लिंक थपियो।' : 'Link created successfully.');
      }
      setLinkModalOpen(false);
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'लिंक सुरक्षित गर्न सकिएन।');
    }
  }

  async function handleDeleteLink(id: number) {
    if (!confirm(isNe ? 'के तपाईं यो लिंक मेटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to delete this link?')) return;
    try {
      await api.admin.portals.deleteLink(token, id);
      toast.success(isNe ? 'लिंक मेटाइयो।' : 'Link deleted successfully.');
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'मेटाउन सकिएन।');
    }
  }

  // ─── Emergency Handlers ─────────────────────────────────────
  function openAddNumber() {
    setEditingNumber(null);
    const defaultCategory = categories.length > 0 ? categories[0].slug : 'general';
    setNumberForm({
      category: defaultCategory,
      service_name_en: '',
      service_name_ne: '',
      phone_number: '',
      alternate_number: '',
      region_type: 'national',
      sort_order: numbers.length + 1,
      is_active: true,
    });
    setNumberModalOpen(true);
  }

  function openEditNumber(item: any) {
    setEditingNumber(item);
    setNumberForm({
      category: item.category || (categories.length > 0 ? categories[0].slug : 'general'),
      service_name_en: item.service_name_en || '',
      service_name_ne: item.service_name_ne || '',
      phone_number: item.phone_number || '',
      alternate_number: item.alternate_number || '',
      region_type: item.region_type || 'national',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ?? true,
    });
    setNumberModalOpen(true);
  }

  async function handleSaveNumber(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingNumber) {
        await api.admin.portals.updateEmergencyNumber(token, editingNumber.id, numberForm);
        toast.success(isNe ? 'नम्बर सफलतापूर्वक अपडेट भयो।' : 'Emergency number updated successfully.');
      } else {
        await api.admin.portals.createEmergencyNumber(token, numberForm);
        toast.success(isNe ? 'नयाँ आपतकालीन नम्बर थपियो।' : 'Emergency number added successfully.');
      }
      setNumberModalOpen(false);
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'नम्बर सुरक्षित गर्न सकिएन।');
    }
  }

  async function handleDeleteNumber(id: number) {
    if (!confirm(isNe ? 'के तपाईं यो आपतकालीन सेवा नम्बर मेटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to delete this emergency contact?')) return;
    try {
      await api.admin.portals.deleteEmergencyNumber(token, id);
      toast.success(isNe ? 'नम्बर मेटाइयो।' : 'Emergency contact deleted.');
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || 'मेटाउन सकिएन।');
    }
  }

  // Filtered links
  const filteredLinks = links.filter((l) => {
    if (linksFilterSection === 'all') return true;
    return l.section === linksFilterSection;
  });

  // Filtered numbers
  const filteredNumbers = numbers.filter((n) => {
    if (numbersFilterCat !== 'all' && n.category !== numbersFilterCat) return false;
    if (emergencySearch.trim()) {
      const q = emergencySearch.toLowerCase();
      const matchEn = n.service_name_en?.toLowerCase().includes(q);
      const matchNe = n.service_name_ne?.toLowerCase().includes(q);
      const matchPhone = n.phone_number?.includes(q);
      return matchEn || matchNe || matchPhone;
    }
    return true;
  });

  // Prepare options for CustomSelect components
  const sectionSelectOptions = sections.map((s) => ({
    value: s.slug,
    label: isNe && s.title_ne ? `${s.title_ne} (${s.title_en})` : s.title_en,
    subLabel: `Slug: ${s.slug}`,
  }));

  const categorySelectOptions = categories.map((c) => ({
    value: c.slug,
    label: isNe && c.title_ne ? `${c.title_ne} (${c.title_en})` : c.title_en,
    subLabel: `Slug: ${c.slug}`,
  }));

  const regionTypeOptions = [
    { value: 'national', label: isNe ? 'National (देशव्यापी)' : 'National (Countrywide)' },
    { value: 'province', label: isNe ? 'Province (प्रदेश स्तर)' : 'Province Level' },
    { value: 'district', label: isNe ? 'District (जिल्ला स्तर)' : 'District Level' },
  ];

  const statusOptions = [
    { value: '1', label: isNe ? 'सक्रिय (Active)' : 'Active' },
    { value: '0', label: isNe ? 'निष्क्रिय (Inactive)' : 'Inactive' },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#123B5D]">
              {isNe ? 'सरकारी पोर्टल तथा आपतकालीन नम्बर व्यवस्थापन' : 'Government Portals & Emergency Contacts'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isNe
                ? 'एप र वेबसाइटमा देखिने सरकारी लिंक, सेक्सन, आपतकालीन नम्बर र वर्गहरू यहाँबाट थप्न तथा नियन्त्रण गर्न सक्नुहुन्छ।'
                : 'Manage in-app external government links, sections, emergency numbers, and categories directory.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {isNe ? 'रिफ्रेस' : 'Refresh'}
            </button>

            {activeTab === 'links' ? (
              <>
                <button
                  type="button"
                  onClick={() => setManageSectionsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-teal-300 text-[#0F766E] rounded-lg hover:bg-teal-50/60 shadow-2xs transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isNe ? 'सेक्सन व्यवस्थापन' : 'Manage Sections'}
                  <span className="ml-1 px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
                    {sections.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openAddLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#123B5D] text-white rounded-lg hover:bg-[#0e2e4a] shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isNe ? 'नयाँ सरकारी लिंक' : 'Add External Link'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setManageCategoriesOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-teal-300 text-[#0F766E] rounded-lg hover:bg-teal-50/60 shadow-2xs transition cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {isNe ? 'वर्ग व्यवस्थापन' : 'Manage Categories'}
                  <span className="ml-1 px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
                    {categories.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openAddNumber}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0F766E] text-white rounded-lg hover:bg-[#0d635d] shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isNe ? 'नयाँ आपतकालीन नम्बर' : 'Add Emergency Number'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'links'
                ? 'border-[#123B5D] text-[#123B5D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            {isNe ? 'सरकारी लिंकहरू (Gov Portals)' : 'Government Links'}
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {links.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'emergency'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            {isNe ? 'आपतकालीन नम्बरहरू (Emergency Numbers)' : 'Emergency Numbers'}
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-teal-50 text-teal-800 font-bold">
              {numbers.length}
            </span>
          </button>
        </div>

        {/* ─── TAB 1: GOVERNMENT LINKS ────────────────────────────── */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Dynamic Section Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isNe ? 'सेक्सन अनुसार:' : 'Section:'}
              </span>

              <button
                type="button"
                onClick={() => setLinksFilterSection('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                  linksFilterSection === 'all'
                    ? 'bg-[#123B5D] text-white border-[#123B5D]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isNe ? 'सबै लिङ्कहरू' : 'All Sections'} ({links.length})
              </button>

              {sections.map((sec) => {
                const count = links.filter((l) => l.section === sec.slug).length;
                return (
                  <button
                    key={sec.slug}
                    type="button"
                    onClick={() => setLinksFilterSection(sec.slug)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                      linksFilterSection === sec.slug
                        ? 'bg-[#123B5D] text-white border-[#123B5D]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isNe && sec.title_ne ? sec.title_ne : sec.title_en} ({count})
                  </button>
                );
              })}
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">क्र.सं.</th>
                      <th className="py-3 px-4">सेक्सन (Section)</th>
                      <th className="py-3 px-4">शीर्षक (Title)</th>
                      <th className="py-3 px-4">URL लिङ्क</th>
                      <th className="py-3 px-4">ब्याज / स्थिति</th>
                      <th className="py-3 px-4 text-right">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLinks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {isNe ? 'कुनै सरकारी लिङ्क फेला परेन।' : 'No government links found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLinks.map((item, idx) => {
                        const secInfo = sections.find((s) => s.slug === item.section);
                        const secName = secInfo
                          ? isNe && secInfo.title_ne
                            ? secInfo.title_ne
                            : secInfo.title_en
                          : item.section;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                              {item.sort_order || idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {secName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{item.title_en}</div>
                              {item.title_ne && (
                                <div className="text-xs text-slate-500">{item.title_ne}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 hover:underline max-w-xs truncate"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{item.url}</span>
                              </a>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {item.badge_text && (
                                  <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                                    {item.badge_text}
                                  </span>
                                )}
                                {item.is_active ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditLink(item)}
                                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLink(item.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: EMERGENCY NUMBERS ───────────────────────────── */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={emergencySearch}
                  onChange={(e) => setEmergencySearch(e.target.value)}
                  placeholder={
                    isNe
                      ? 'आपतकालीन सेवा वा नम्बर खोज्नुहोस् (उदा. Police, 100, 102)...'
                      : 'Search emergency services or numbers (e.g. Police, 100, 102)...'
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              {/* Dynamic Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setNumbersFilterCat('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition cursor-pointer ${
                    numbersFilterCat === 'all'
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isNe ? 'सबै वर्गहरू' : 'All Categories'} ({numbers.length})
                </button>

                {categories.map((cat) => {
                  const count = numbers.filter((n) => n.category === cat.slug).length;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setNumbersFilterCat(cat.slug)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition cursor-pointer ${
                        numbersFilterCat === cat.slug
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isNe && cat.title_ne ? cat.title_ne.split('(')[0] : cat.title_en} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numbers Table */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">क्र.सं.</th>
                      <th className="py-3 px-4">वर्ग (Category)</th>
                      <th className="py-3 px-4">सेवा नाम (Service Name)</th>
                      <th className="py-3 px-4">फोन नम्बर (Dial Number)</th>
                      <th className="py-3 px-4">क्षेत्र (Region)</th>
                      <th className="py-3 px-4 text-right">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNumbers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {isNe ? 'कुनै आपतकालीन नम्बर फेला परेन।' : 'No emergency numbers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredNumbers.map((item, idx) => {
                        const catInfo = categories.find((c) => c.slug === item.category);
                        const catName = catInfo
                          ? isNe && catInfo.title_ne
                            ? catInfo.title_ne.split('(')[0].trim()
                            : catInfo.title_en
                          : item.category;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                              {item.sort_order || idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                                {catName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{item.service_name_en}</div>
                              {item.service_name_ne && (
                                <div className="text-xs text-slate-500">{item.service_name_ne}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-[#0F766E]">{item.phone_number}</span>
                              {item.alternate_number && (
                                <span className="text-slate-400 text-xs block">
                                  / {item.alternate_number}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize">
                                {item.region_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditNumber(item)}
                                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNumber(item.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 1: ADD/EDIT GOVERNMENT LINK ─────────────────── */}
        <ModalPortal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          title={editingLink ? (isNe ? 'सरकारी लिङ्क सम्पादन गर्नुहोस्' : 'Edit Government Link') : (isNe ? 'नयाँ सरकारी लिङ्क थप्नुहोस्' : 'Add New Government Link')}
          subtitle={isNe ? 'एप र वेब पोर्टलमा प्रदर्शित हुने सरकारी लिंक' : 'External official portal link displayed on app and web'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveLink} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isNe ? 'सेक्सन (Section) *' : 'Section *'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    openAddSection();
                  }}
                  className="text-[11px] font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isNe ? 'नयाँ सेक्सन थप्नुहोस्' : 'Add New Section'}
                </button>
              </div>
              <CustomSelect
                value={linkForm.section}
                onChange={(val) => setLinkForm({ ...linkForm, section: val })}
                options={sectionSelectOptions}
                placeholder={isNe ? 'सेक्सन छान्नुहोस्...' : 'Select section...'}
                searchable={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'अंग्रेजी शीर्षक (Title EN) *' : 'Title EN *'}
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.title_en}
                  onChange={(e) => setLinkForm({ ...linkForm, title_en: e.target.value })}
                  placeholder="Health Benefits"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'नेपाली शीर्षक (Title NE)' : 'Title NE'}
                </label>
                <input
                  type="text"
                  value={linkForm.title_ne}
                  onChange={(e) => setLinkForm({ ...linkForm, title_ne: e.target.value })}
                  placeholder="नि:शुल्क स्वास्थ्य सेवा"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'URL लिङ्क *' : 'URL Link *'}
              </label>
              <input
                type="url"
                required
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://freehealth.mohp.gov.np"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'ब्याज (Badge Text)' : 'Badge Text'}
                </label>
                <input
                  type="text"
                  value={linkForm.badge_text}
                  onChange={(e) => setLinkForm({ ...linkForm, badge_text: e.target.value })}
                  placeholder="MoHP / IRD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'क्रम (Sort Order)' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  value={linkForm.sort_order}
                  onChange={(e) => setLinkForm({ ...linkForm, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'स्थिति (Status)' : 'Status'}
                </label>
                <CustomSelect
                  value={linkForm.is_active ? '1' : '0'}
                  onChange={(val) => setLinkForm({ ...linkForm, is_active: val === '1' })}
                  options={statusOptions}
                  searchable={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isNe ? 'रद्द' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#123B5D] text-white rounded-lg hover:bg-[#0e2e4a] shadow-xs cursor-pointer"
              >
                {isNe ? 'सुरक्षित गर्नुहोस्' : 'Save Link'}
              </button>
            </div>
          </form>
        </ModalPortal>

        {/* ─── MODAL 2: ADD/EDIT EMERGENCY NUMBER ────────────────── */}
        <ModalPortal
          isOpen={numberModalOpen}
          onClose={() => setNumberModalOpen(false)}
          title={editingNumber ? (isNe ? 'आपतकालीन सम्पर्क सम्पादन गर्नुहोस्' : 'Edit Emergency Contact') : (isNe ? 'नयाँ आपतकालीन सम्पर्क थप्नुहोस्' : 'Add Emergency Contact')}
          subtitle={isNe ? 'एपमा देखिने सार्वजनिक आपतकालीन हटलाइन नम्बरहरू' : 'Direct emergency numbers and hotlines for citizens'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveNumber} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isNe ? 'वर्ग (Category) *' : 'Category *'}
                </label>
                <button
                  type="button"
                  onClick={() => openAddCategory()}
                  className="text-[11px] font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isNe ? 'नयाँ वर्ग थप्नुहोस्' : 'Add New Category'}
                </button>
              </div>
              <CustomSelect
                value={numberForm.category}
                onChange={(val) => setNumberForm({ ...numberForm, category: val })}
                options={categorySelectOptions}
                placeholder={isNe ? 'वर्ग छान्नुहोस्...' : 'Select category...'}
                searchable={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'सेवाको नाम EN *' : 'Service Name EN *'}
                </label>
                <input
                  type="text"
                  required
                  value={numberForm.service_name_en}
                  onChange={(e) => setNumberForm({ ...numberForm, service_name_en: e.target.value })}
                  placeholder="Police Emergency"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'सेवाको नाम NE' : 'Service Name NE'}
                </label>
                <input
                  type="text"
                  value={numberForm.service_name_ne}
                  onChange={(e) => setNumberForm({ ...numberForm, service_name_ne: e.target.value })}
                  placeholder="प्रहरी आपतकालीन सेवा"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'डायल फोन नम्बर *' : 'Dial Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={numberForm.phone_number}
                  onChange={(e) => setNumberForm({ ...numberForm, phone_number: e.target.value })}
                  placeholder="100 वा 01-4104595"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'वैकल्पिक नम्बर (ऐच्छिक)' : 'Alternate Number (Optional)'}
                </label>
                <input
                  type="text"
                  value={numberForm.alternate_number}
                  onChange={(e) => setNumberForm({ ...numberForm, alternate_number: e.target.value })}
                  placeholder="01-4228435"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'क्षेत्रीय प्रकार (Region Type)' : 'Region Type'}
                </label>
                <CustomSelect
                  value={numberForm.region_type}
                  onChange={(val) => setNumberForm({ ...numberForm, region_type: val })}
                  options={regionTypeOptions}
                  searchable={false}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'क्रम (Sort Order)' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  value={numberForm.sort_order}
                  onChange={(e) => setNumberForm({ ...numberForm, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNumberModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isNe ? 'रद्द' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#0F766E] text-white rounded-lg hover:bg-[#0d635d] shadow-xs cursor-pointer"
              >
                {isNe ? 'सुरक्षित गर्नुहोस्' : 'Save Number'}
              </button>
            </div>
          </form>
        </ModalPortal>

        {/* ─── MODAL 3: MANAGE SECTIONS LIST ──────────────────────── */}
        <ModalPortal
          isOpen={manageSectionsOpen}
          onClose={() => setManageSectionsOpen(false)}
          title={isNe ? 'सरकारी लिङ्कका सेक्सनहरू व्यवस्थापन' : 'Manage Portal Sections'}
          subtitle={isNe ? 'नयाँ सेक्सन थप्न, सम्पादन गर्न वा मेटाउन सक्नुहुन्छ' : 'Create, customize, and manage portal sections for links'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                {isNe
                  ? 'दर्ता भएका सेक्सनहरू एपको होम स्क्रिन तथा लिङ्क सूचीमा देखिन्छन्।'
                  : 'Active sections are dynamically displayed in the mobile app and admin filter.'}
              </p>
              <button
                type="button"
                onClick={openAddSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#123B5D] text-white rounded-lg hover:bg-[#0e2e4a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isNe ? 'नयाँ सेक्सन थप्नुहोस्' : 'Add New Section'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Title EN</th>
                    <th className="p-3">Title NE</th>
                    <th className="p-3 text-center">Order</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-700">{sec.slug}</td>
                      <td className="p-3 font-medium text-slate-800">{sec.title_en}</td>
                      <td className="p-3 text-slate-600">{sec.title_ne || '—'}</td>
                      <td className="p-3 text-center text-slate-400">{sec.sort_order}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditSection(sec)}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setManageSectionsOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                {isNe ? 'बन्द गर्नुहोस्' : 'Close'}
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* ─── MODAL 4: ADD / EDIT SINGLE SECTION ─────────────────── */}
        <ModalPortal
          isOpen={sectionModalOpen}
          onClose={() => setSectionModalOpen(false)}
          title={editingSection ? (isNe ? 'सेक्सन सम्पादन गर्नुहोस्' : 'Edit Section') : (isNe ? 'नयाँ सेक्सन थप्नुहोस्' : 'Create New Section')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveSection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'अंग्रेजी नाम (Title EN) *' : 'Title EN *'}
              </label>
              <input
                type="text"
                required
                value={sectionForm.title_en}
                onChange={(e) => {
                  const val = e.target.value;
                  setSectionForm((prev) => ({
                    ...prev,
                    title_en: val,
                    slug: !editingSection ? slugify(val) : prev.slug,
                  }));
                }}
                placeholder="Public Benefits"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isNe ? 'स्लग (Slug / System ID) *' : 'Section Slug *'}
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  {isNe ? 'स्वतः सिर्जना (Auto-generated)' : 'Auto-generated'}
                </span>
              </div>
              <input
                type="text"
                required
                disabled={!!editingSection}
                value={sectionForm.slug}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  })
                }
                placeholder="उदा. public_benefits"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isNe
                  ? 'अंग्रेजी शीर्षक टाइप गर्दा यो स्वतः बन्छ। आवश्यक परे आफैं सम्पादन गर्न सक्नुहुन्छ।'
                  : 'Automatically generated from English Title. Can be customized if needed.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'नेपाली नाम (Title NE)' : 'Title NE'}
              </label>
              <input
                type="text"
                value={sectionForm.title_ne}
                onChange={(e) => setSectionForm({ ...sectionForm, title_ne: e.target.value })}
                placeholder="सार्वजनिक सुविधाहरू"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'क्रम (Sort Order)' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  value={sectionForm.sort_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'स्थिति' : 'Status'}
                </label>
                <CustomSelect
                  value={sectionForm.is_active ? '1' : '0'}
                  onChange={(val) => setSectionForm({ ...sectionForm, is_active: val === '1' })}
                  options={statusOptions}
                  searchable={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSectionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isNe ? 'रद्द' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#123B5D] text-white rounded-lg hover:bg-[#0e2e4a] cursor-pointer"
              >
                {isNe ? 'सुरक्षित गर्नुहोस्' : 'Save Section'}
              </button>
            </div>
          </form>
        </ModalPortal>

        {/* ─── MODAL 5: MANAGE CATEGORIES LIST ────────────────────── */}
        <ModalPortal
          isOpen={manageCategoriesOpen}
          onClose={() => setManageCategoriesOpen(false)}
          title={isNe ? 'आपतकालीन नम्बरका वर्गहरू व्यवस्थापन' : 'Manage Emergency Categories'}
          subtitle={isNe ? 'नयाँ वर्ग थप्न, सम्पादन गर्न वा मेटाउन सक्नुहुन्छ' : 'Create, customize, and manage emergency categories'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                {isNe
                  ? 'दर्ता भएका वर्गहरू एपको आपतकालीन डाइरेक्टरीमा समूहबद्ध भएर देखिन्छन्।'
                  : 'Active categories group emergency contacts inside the mobile app.'}
              </p>
              <button
                type="button"
                onClick={openAddCategory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0F766E] text-white rounded-lg hover:bg-[#0d635d] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isNe ? 'नयाँ वर्ग थप्नुहोस्' : 'Add New Category'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Title EN</th>
                    <th className="p-3">Title NE</th>
                    <th className="p-3 text-center">Order</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-700">{cat.slug}</td>
                      <td className="p-3 font-medium text-slate-800">{cat.title_en}</td>
                      <td className="p-3 text-slate-600">{cat.title_ne || '—'}</td>
                      <td className="p-3 text-center text-slate-400">{cat.sort_order}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCategory(cat)}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setManageCategoriesOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                {isNe ? 'बन्द गर्नुहोस्' : 'Close'}
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* ─── MODAL 6: ADD / EDIT SINGLE CATEGORY ────────────────── */}
        <ModalPortal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title={editingCategory ? (isNe ? 'वर्ग सम्पादन गर्नुहोस्' : 'Edit Category') : (isNe ? 'नयाँ वर्ग थप्नुहोस्' : 'Create New Category')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'अंग्रेजी नाम (Title EN) *' : 'Title EN *'}
              </label>
              <input
                type="text"
                required
                value={categoryForm.title_en}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryForm((prev) => ({
                    ...prev,
                    title_en: val,
                    slug: !editingCategory ? slugify(val) : prev.slug,
                  }));
                }}
                placeholder="Ambulance Services"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isNe ? 'स्लग (Slug / System ID) *' : 'Category Slug *'}
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  {isNe ? 'स्वतः सिर्जना (Auto-generated)' : 'Auto-generated'}
                </span>
              </div>
              <input
                type="text"
                required
                disabled={!!editingCategory}
                value={categoryForm.slug}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  })
                }
                placeholder="उदा. ambulance_services"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isNe
                  ? 'अंग्रेजी शीर्षक टाइप गर्दा यो स्वतः बन्छ। आवश्यक परे आफैं सम्पादन गर्न सक्नुहुन्छ।'
                  : 'Automatically generated from English Title. Can be customized if needed.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'नेपाली नाम (Title NE)' : 'Title NE'}
              </label>
              <input
                type="text"
                value={categoryForm.title_ne}
                onChange={(e) => setCategoryForm({ ...categoryForm, title_ne: e.target.value })}
                placeholder="एम्बुलेन्स सेवाहरू"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'क्रम (Sort Order)' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'स्थिति' : 'Status'}
                </label>
                <CustomSelect
                  value={categoryForm.is_active ? '1' : '0'}
                  onChange={(val) => setCategoryForm({ ...categoryForm, is_active: val === '1' })}
                  options={statusOptions}
                  searchable={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isNe ? 'रद्द' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#0F766E] text-white rounded-lg hover:bg-[#0d635d] cursor-pointer"
              >
                {isNe ? 'सुरक्षित गर्नुहोस्' : 'Save Category'}
              </button>
            </div>
          </form>
        </ModalPortal>
      </div>
    </AdminShell>
  );
}
