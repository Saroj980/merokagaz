'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, Document, Category } from '@/lib/api';
import CustomSelect from '@/components/ui/CustomSelect';
import toast, { alertModal } from '@/lib/toast';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Building2,
  Layers,
  ExternalLink,
  Clock,
  Filter,
  AlertCircle,
  AlertTriangle,
  GitBranch,
  Calendar,
  Sparkles,
} from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function AdminDocumentsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Document Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Slug check & auto-generation state
  const [isSlugManual, setIsSlugManual] = useState<boolean>(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugMessage, setSlugMessage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    name_np: '',
    slug: '',
    category_id: 1,
    department: 'IRD',
    price: '100',
    processing_time: '५ मिनेट',
    requirements_raw: '',
    description: '',
    description_np: '',
    is_active: true,
  });

  // Versioning & Template Modal State
  const [versionModalDoc, setVersionModalDoc] = useState<Document | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionEffectiveDate, setNewVersionEffectiveDate] = useState('');
  const [newVersionSetActive, setNewVersionSetActive] = useState(true);
  const [creatingVersion, setCreatingVersion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    loadData(stored);
  }, []);

  async function loadData(t = token) {
    setLoading(true);
    try {
      const [docsRes, catsRes] = await Promise.allSettled([
        t ? api.admin.documents.list(t) : api.documents.list(),
        api.categories.list(),
      ]);

      if (docsRes.status === 'fulfilled') {
        const raw = docsRes.value;
        const list = Array.isArray(raw) ? raw : (raw as any).data || [];
        setDocuments(list);
      }
      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value);
        if (catsRes.value.length > 0 && !editingDoc) {
          setFormData((prev) => ({ ...prev, category_id: catsRes.value[0].id }));
        }
      }
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'डाटा लोड गर्न सकिएन।' : 'Failed to load documents.'));
    } finally {
      setLoading(false);
    }
  }

  // Debounced live DB check for slug validity
  useEffect(() => {
    if (!isModalOpen || !formData.slug.trim()) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    const cleanSlug = formData.slug.trim().toLowerCase();
    const validFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug);

    if (!validFormat) {
      setSlugStatus('invalid');
      setSlugMessage(
        isNe
          ? 'अमान्य ढाँचा: सानो अक्षर (a-z), अंक (0-9) र हाइफन (-) मात्र प्रयोग गर्नुहोस्'
          : 'Invalid slug: use lowercase alphanumeric characters and hyphens only'
      );
      return;
    }

    setSlugStatus('checking');
    setSlugMessage(isNe ? 'डाटाबेसमा प्रमाणीकरण हुँदैछ...' : 'Checking database availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await api.admin.documents.checkSlug(token, cleanSlug, editingDoc?.id);
        if (res.available) {
          setSlugStatus('available');
          setSlugMessage(isNe ? 'स्लग उपलब्ध छ ✓' : 'Slug is available ✓');
        } else {
          setSlugStatus('taken');
          setSlugMessage(res.message || (isNe ? 'यो स्लग पहिले नै प्रयोगमा छ!' : 'Slug already taken in database'));
        }
      } catch (err: any) {
        setSlugStatus('idle');
        setSlugMessage('');
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [formData.slug, isModalOpen, editingDoc?.id, token, isNe]);

  function openCreateModal() {
    setEditingDoc(null);
    setIsSlugManual(false);
    setSlugStatus('idle');
    setSlugMessage('');
    setFormData({
      name: '',
      name_np: '',
      slug: '',
      category_id: categories[0]?.id || 1,
      department: 'IRD',
      price: '100',
      processing_time: isNe ? '५ मिनेट' : '5 Minutes',
      requirements_raw: isNe ? 'नागरिकताको प्रमाणपत्र, पासपोर्ट साइजको फोटो' : 'Citizenship Certificate, Passport Size Photo',
      description: '',
      description_np: '',
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(doc: Document) {
    setEditingDoc(doc);
    setIsSlugManual(true);
    setSlugStatus('idle');
    setSlugMessage('');
    const reqs = Array.isArray(doc.requirements) ? doc.requirements.join(', ') : '';

    setFormData({
      name: doc.name,
      name_np: doc.name_np || '',
      slug: doc.slug,
      category_id: doc.category_id || doc.category?.id || categories[0]?.id || 1,
      department: doc.department || 'IRD',
      price: String(doc.price || '0'),
      processing_time: (doc as any).processing_time || (isNe ? '५ मिनेट' : '5 Minutes'),
      requirements_raw: reqs,
      description: doc.description || '',
      description_np: (doc as any).description_np || '',
      is_active: doc.is_active ?? true,
    });
    setIsModalOpen(true);
  }

  function handleNameChange(val: string) {
    if (!isSlugManual && !editingDoc) {
      const generated = slugify(val);
      setFormData((prev) => ({
        ...prev,
        name: val,
        slug: generated,
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  }

  function handleRegenerateSlug() {
    const generated = slugify(formData.name);
    setFormData((prev) => ({ ...prev, slug: generated }));
    setIsSlugManual(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugStatus === 'taken' || slugStatus === 'invalid') {
      toast.error(slugMessage || (isNe ? 'कृपया मान्य स्लग राख्नुहोस्।' : 'Please specify a valid and available slug.'));
      return;
    }

    setSubmitting(true);

    const requirementsArray = formData.requirements_raw
      ? formData.requirements_raw
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : [];

    const finalSlug = formData.slug.trim() || slugify(formData.name);

    const payload = {
      name: formData.name.trim(),
      name_np: formData.name_np.trim(),
      slug: finalSlug,
      category_id: formData.category_id,
      department: formData.department,
      price: formData.price,
      processing_time: formData.processing_time,
      requirements: requirementsArray,
      description: formData.description,
      description_np: formData.description_np,
      is_active: formData.is_active,
    };

    try {
      if (editingDoc) {
        await api.admin.documents.update(token, editingDoc.id, payload);
        toast.success(isNe ? 'कागजात सफलतापूर्वक सम्पादन गरियो!' : 'Document updated successfully!');
      } else {
        await api.admin.documents.create(token, payload);
        toast.success(
          isNe
            ? 'नयाँ कागजात, संस्करण v2026.1 र टेम्प्लेट सफलतापूर्वक सिर्जना गरियो!'
            : 'Document created with v2026.1 and auto-linked starter template!'
        );
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'कागजात सुरक्षित गर्न असफल भयो।' : 'Failed to save document.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(doc: Document) {
    try {
      await api.admin.documents.toggleStatus(token, doc.id);
      toast.success(
        isNe
          ? `कागजात [${doc.name_np || doc.name}] ${!doc.is_active ? 'सक्रिय' : 'निष्क्रिय'} बनाइयो।`
          : `Document "${doc.name}" ${!doc.is_active ? 'activated' : 'deactivated'}.`
      );
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_active: !d.is_active } : d))
      );
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'स्थिति परिवर्तन गर्न सकिएन।' : 'Failed to toggle status.'));
    }
  }

  async function handleDelete(doc: Document) {
    const docTitle = isNe ? (doc.name_np || doc.name) : doc.name;
    const confirmed = await alertModal.confirm(
      isNe ? 'कागजात मेटाउने?' : 'Delete Document?',
      isNe
        ? `के तपाईं "${docTitle}" कागजात र यसका सबै संस्करणहरू मेटाउन निश्चित हुनुहुन्छ?`
        : `Are you sure you want to permanently delete "${docTitle}" and all associated versions?`,
      isNe ? 'मेटाउनुहोस्' : 'Delete',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.admin.documents.delete(token, doc.id);
      toast.success(isNe ? 'कागजात सफलतापूर्वक मेटाइयो।' : 'Document deleted successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'कागजात मेटाउन असफल भयो।' : 'Failed to delete document.'));
    }
  }

  // Version modal openers
  function openVersionModal(doc: Document) {
    setVersionModalDoc(doc);
    const count = doc.versions?.length || 1;
    setNewVersionNumber(`v2026.${count + 1}`);
    setNewVersionEffectiveDate(new Date().toISOString().split('T')[0]);
    setNewVersionSetActive(true);
    setIsVersionModalOpen(true);
  }

  async function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!versionModalDoc) return;

    setCreatingVersion(true);
    try {
      await api.admin.documents.createVersion(token, versionModalDoc.id, {
        version_number: newVersionNumber.trim(),
        effective_date: newVersionEffectiveDate,
        is_active: newVersionSetActive,
        template_name: `${versionModalDoc.name} Template (${newVersionNumber.trim()})`,
        template_status: 'draft',
      });
      toast.success(
        isNe
          ? `नयाँ संस्करण ${newVersionNumber} र टेम्प्लेट सफलतापूर्वक सिर्जना गरियो!`
          : `New version ${newVersionNumber} and linked template created successfully!`
      );
      setIsVersionModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'संस्करण सिर्जना गर्न असफल भयो।' : 'Failed to create new version.'));
    } finally {
      setCreatingVersion(false);
    }
  }

  // Filtering: respects both category_id numeric & string, plus category slug
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.name_np && doc.name_np.includes(search)) ||
      doc.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCat =
      selectedCat === 'all' ||
      String(doc.category_id) === selectedCat ||
      String(doc.category?.id) === selectedCat ||
      doc.category?.slug === selectedCat;

    const matchesDept =
      selectedDept === 'all' ||
      doc.department?.toUpperCase() === selectedDept.toUpperCase();

    return matchesSearch && matchesCat && matchesDept;
  });

  return (
    <AdminShell>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#18A999] text-white shadow-sm">
                <FileText className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-[#123B5D]">
                {isNe ? 'कागजात तथा फारम व्यवस्थापन' : 'Document & Form Management'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'सरकारी फारमहरू, संस्करण (Versioning), लिंक गरिएका टेम्प्लेट र प्रत्यक्ष लिङ्कहरू व्यवस्थापन गर्नुहोस्।'
                : 'Manage official documents, live form templates, schema versioning, and pricing.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData()}
              className="widget-click flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isNe ? 'ताजा गर्नुहोस्' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="widget-click inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{isNe ? 'नयाँ फारम थप्नुहोस्' : 'Add New Document'}</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-3xl border border-teal-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isNe ? 'कागजातको नाम, स्लग वा शीर्षक खोज्नुहोस्...' : 'Search document title or slug...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18A999]"
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

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <CustomSelect
                value={selectedDept}
                onChange={(val) => setSelectedDept(val)}
                icon={<Building2 className="h-4 w-4" />}
                className="w-48 sm:w-56"
                options={[
                  {
                    value: 'all',
                    label: isNe ? 'सबै निकाय' : 'All Departments',
                    subLabel: isNe ? 'सबै सरकारी निकाय' : 'All government bodies',
                  },
                  {
                    value: 'IRD',
                    label: isNe ? 'आन्तरिक राजस्व विभाग (IRD)' : 'Inland Revenue (IRD)',
                    subLabel: isNe ? 'कर तथा भ्याट सम्बन्धी' : 'Tax & VAT Services',
                  },
                  {
                    value: 'OCR',
                    label: isNe ? 'कम्पनी रजिस्ट्रार (OCR)' : 'Company Registrar (OCR)',
                    subLabel: isNe ? 'दर्ता तथा अद्यावधिक' : 'Corporate Filing',
                  },
                  {
                    value: 'LEGAL',
                    label: isNe ? 'कानुनी लिखत (LEGAL)' : 'Legal Agreements (LEGAL)',
                    subLabel: isNe ? 'करार तथा लिखतहरू' : 'Deeds & Contracts',
                  },
                  {
                    value: 'WARD',
                    label: isNe ? 'वडा तथा स्थानीय तह (WARD)' : 'Local Ward (WARD)',
                    subLabel: isNe ? 'सिफारिस तथा पञ्जीकरण' : 'Recommendations',
                  },
                  {
                    value: 'GENERAL',
                    label: isNe ? 'सामान्य (GENERAL)' : 'General (GENERAL)',
                    subLabel: isNe ? 'अन्य प्रशासनिक कागजात' : 'Other Administrative',
                  },
                ]}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>{isNe ? 'श्रेणी:' : 'Category:'}</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedCat === 'all'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isNe ? 'सबै' : 'All'} ({documents.length})
            </button>
            {categories.map((c) => {
              const count = documents.filter(
                (d) =>
                  String(d.category_id) === String(c.id) ||
                  String(d.category?.id) === String(c.id) ||
                  d.category?.slug === c.slug
              ).length;

              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCat(String(c.id))}
                  className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCat === String(c.id)
                      ? 'bg-[#123B5D] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{isNe ? (c.name_np || c.name) : (c.name || c.name_np)}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      selectedCat === String(c.id) ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Table */}
        <div className="overflow-hidden rounded-3xl border border-teal-200/90 bg-white shadow-xs animate-admin-page-in mb-10">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isNe ? 'कागजातहरूको सूची' : 'Document Listings'}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 font-outfit">
              {isNe ? `कुल ${filteredDocs.length} वटा कागजात उपलब्ध` : `${filteredDocs.length} documents found`}
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500 font-outfit flex flex-col items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[#18A999] mb-3" />
              <span>Loading documents ledger...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <span className="text-3xl">📄</span>
              <p className="mt-2 font-bold text-slate-700">
                {isNe ? 'कुनै कागजात फेला परेन।' : 'No documents found.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">{isNe ? 'कागजात (Document)' : 'Document'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'निकाय' : 'Department'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'टेम्प्लेट र संस्करण' : 'Template & Version'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'शुल्क' : 'Fee'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-6 py-3.5 text-right">{isNe ? 'कार्यहरू' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const primaryTitle = isNe ? (doc.name_np || doc.name) : doc.name;
                    const secondaryTitle = isNe ? doc.name : (doc.name_np || '');
                    const activeVersion = doc.active_version;
                    const linkedTemplate = activeVersion?.template;
                    const versionsCount = doc.versions?.length || 1;

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Title and details */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#18A999] font-bold shadow-xs">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[#123B5D] text-xs">
                                {primaryTitle}
                              </p>
                              {secondaryTitle && (
                                <p className="text-[11px] text-slate-500 font-outfit mt-0.5">
                                  {secondaryTitle}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  /{doc.slug}
                                </span>
                                {(doc as any).processing_time && (
                                  <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{(doc as any).processing_time}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-[#18A999] font-outfit">
                            <Building2 className="h-3 w-3" />
                            <span>{doc.department || 'GENERAL'}</span>
                          </span>
                        </td>

                        {/* Linked Template & Versioning */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-900 font-mono">
                                <Layers className="h-3 w-3 text-[#18A999]" />
                                <span>{linkedTemplate?.name || `${doc.name} Template`}</span>
                              </span>
                              {linkedTemplate && (
                                <span
                                  className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                    linkedTemplate.status === 'published'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {linkedTemplate.status === 'published'
                                    ? isNe ? 'प्रकाशित' : 'Published'
                                    : isNe ? 'मस्यौदा' : 'Draft'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-outfit">
                              <span className="text-slate-600">
                                {linkedTemplate?.fields_count ?? 4} {isNe ? 'फिल्डहरू' : 'fields'}
                              </span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => openVersionModal(doc)}
                                className="inline-flex items-center gap-1 text-[#18A999] hover:text-[#123B5D] hover:underline font-semibold"
                                title={isNe ? 'संस्करण इतिहास हेर्नुहोस् र नयाँ संस्करण थप्नुहोस्' : 'View version history and create new version'}
                              >
                                <GitBranch className="h-2.5 w-2.5" />
                                <span>{activeVersion?.version_number || 'v2026.1'}</span>
                                <span className="text-slate-400">({versionsCount} {isNe ? 'संस्करण' : 'versions'})</span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 font-outfit">
                          {Number(doc.price) === 0 ? (
                            <span className="text-emerald-600 font-bold">{isNe ? 'निःशुल्क' : 'Free'}</span>
                          ) : (
                            <span>NPR {Number(doc.price).toLocaleString()}</span>
                          )}
                        </td>

                        {/* Status Toggle Button */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(doc)}
                            title={isNe ? 'क्लिक गरी सक्रिय वा निष्क्रिय बनाउनुहोस्' : 'Click to toggle status'}
                            className={`widget-click inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition border ${
                              doc.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {doc.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            <span>{doc.is_active ? (isNe ? 'सक्रिय' : 'Active') : (isNe ? 'निष्क्रिय' : 'Inactive')}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                          <Link
                            href={`/documents/${doc.slug}/form`}
                            target="_blank"
                            title={isNe ? 'ग्राहक फारम हेर्नुहोस्' : 'Open live client form'}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-[11px] font-bold text-[#148C7E] transition hover:bg-teal-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>{isNe ? 'फारम हेर्नुहोस्' : 'Live Form'}</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => openVersionModal(doc)}
                            title={isNe ? 'संस्करण व्यवस्थापन' : 'Version History & Templates'}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#18A999]"
                          >
                            <GitBranch className="h-3 w-3" />
                            <span>{isNe ? 'संस्करण' : 'Version'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(doc)}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#123B5D]"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>{isNe ? 'सम्पादन' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Create / Edit Document Modal ─── */}
        {mounted && isModalOpen && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-teal-200 bg-white p-6 shadow-2xl animate-scale-up">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-[#123B5D] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#18A999]" />
                <span>
                  {editingDoc
                    ? isNe
                      ? 'कागजात विवरण सम्पादन'
                      : 'Edit Document Details'
                    : isNe
                    ? 'नयाँ सरकारी कागजात थप्नुहोस्'
                    : 'Create New Government Document'}
                </span>
              </h2>

              {!editingDoc && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-[11px] text-teal-800">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#18A999]" />
                  <span>
                    {isNe
                      ? 'कागजात सिर्जना गर्दा प्रारम्भिक संस्करण (v2026.1) र स्वचालित फारम टेम्प्लेट स्वतः लिंक हुनेछ।'
                      : 'Creating this document will auto-provision official Version v2026.1 and an auto-linked starter form template.'}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* English Document Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'कागजातको नाम (अंग्रेजी) *' : 'Document Name (English) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Personal PAN Registration"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden font-outfit"
                    />
                  </div>

                  {/* Nepali Document Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'कागजातको नाम (नेपाली) *' : 'Document Name (Nepali) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name_np}
                      onChange={(e) => setFormData({ ...formData, name_np: e.target.value })}
                      placeholder="उदा. व्यक्तिगत PAN दर्ता फारम"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>

                  {/* URL Slug with Auto-generate & Live DB Validation */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {isNe ? 'URL स्लग (अद्वितीय ठेगाना) *' : 'URL Slug (Unique Address) *'}
                      </label>
                      {formData.name && (
                        <button
                          type="button"
                          onClick={handleRegenerateSlug}
                          className="text-[10px] text-[#18A999] hover:underline font-semibold flex items-center gap-1"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>{isNe ? 'नामबाट पुनः उत्पादन गर्नुहोस्' : 'Re-generate from name'}</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setFormData({ ...formData, slug: e.target.value });
                        }}
                        placeholder="personal-pan-registration"
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-hidden ${
                          slugStatus === 'available'
                            ? 'border-emerald-400 bg-emerald-50/20 text-emerald-950'
                            : slugStatus === 'taken' || slugStatus === 'invalid'
                            ? 'border-rose-400 bg-rose-50/20 text-rose-950'
                            : 'border-slate-200 focus:border-[#18A999]'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {slugStatus === 'checking' && (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#18A999]" />
                        )}
                        {slugStatus === 'available' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                    </div>

                    {/* Slug feedback message */}
                    {slugMessage && (
                      <p
                        className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                          slugStatus === 'available'
                            ? 'text-emerald-700'
                            : slugStatus === 'taken' || slugStatus === 'invalid'
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {slugStatus === 'checking' && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {slugStatus === 'available' && <CheckCircle2 className="h-3 w-3" />}
                        {slugStatus === 'invalid' && <AlertTriangle className="h-3 w-3" />}
                        {slugStatus === 'taken' && <AlertCircle className="h-3 w-3" />}
                        <span>{slugMessage}</span>
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'श्रेणी (Category) *' : 'Category *'}
                    </label>
                    <CustomSelect
                      value={String(formData.category_id || '')}
                      onChange={(val) => setFormData({ ...formData, category_id: Number(val) })}
                      options={categories.map((c) => ({
                        value: String(c.id),
                        label: (isNe ? (c.name_np || c.name) : (c.name || c.name_np)) || `Category #${c.id}`,
                        subLabel: c.slug,
                      }))}
                      placeholder={isNe ? 'श्रेणी छान्नुहोस्...' : 'Select category...'}
                      searchPlaceholder={isNe ? 'श्रेणी खोज्नुहोस्...' : 'Search categories...'}
                      searchable={true}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'सरकारी निकाय (Department) *' : 'Department *'}
                    </label>
                    <CustomSelect
                      value={formData.department}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      options={[
                        { value: 'IRD', label: isNe ? 'IRD (आन्तरिक राजस्व विभाग)' : 'IRD (Inland Revenue Department)', subLabel: 'Revenue / Tax' },
                        { value: 'OCR', label: isNe ? 'OCR (कम्पनी रजिस्ट्रार कार्यालय)' : 'OCR (Office of Company Registrar)', subLabel: 'Company / Corporate' },
                        { value: 'LEGAL', label: isNe ? 'LEGAL (कानुनी सम्झौता तथा लिखत)' : 'LEGAL (Contracts & Legal Deeds)', subLabel: 'Agreements' },
                        { value: 'WARD', label: isNe ? 'WARD (स्थानीय तह तथा वडा कार्यालय)' : 'WARD (Local Ward Office)', subLabel: 'Local Government' },
                        { value: 'GENERAL', label: isNe ? 'GENERAL (सामान्य प्रशासनिक)' : 'GENERAL (General Administration)', subLabel: 'Administrative' },
                      ]}
                      searchable={false}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'शुल्क (रु.) *' : 'Price (NPR) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden font-outfit"
                    />
                  </div>

                  {/* Processing Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'तयार हुन लाग्ने औसत समय' : 'Average Processing Time'}
                    </label>
                    <input
                      type="text"
                      value={formData.processing_time}
                      onChange={(e) => setFormData({ ...formData, processing_time: e.target.value })}
                      placeholder="e.g. 5 Mins / Same Day / तत्काल"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'आवश्यक कानुनी कागजातहरू (अल्पविरामले छुट्याउनुहोस्)' : 'Required Documents (Comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={formData.requirements_raw}
                      onChange={(e) => setFormData({ ...formData, requirements_raw: e.target.value })}
                      placeholder={isNe ? 'उदा. नागरिकताको प्रतिलिपि, पासपोर्ट फोटो' : 'e.g. Citizenship Copy, Passport Photo'}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Description English */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'विवरण (अंग्रेजी)' : 'Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the official document..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden font-outfit"
                  />
                </div>

                {/* Description Nepali */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'विवरण (नेपाली)' : 'Description (Nepali)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description_np}
                    onChange={(e) => setFormData({ ...formData, description_np: e.target.value })}
                    placeholder="फारमको संक्षिप्त कानुनी विवरण..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-slate-300 text-[#18A999] focus:ring-[#18A999]"
                  />
                  <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    {isNe ? 'कागजातलाई वेबसाइटमा तुरुन्त सार्वजनिक (सक्रिय) राख्ने' : 'Publish & make active on public portal'}
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {isNe ? 'रद्द' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || slugStatus === 'taken' || slugStatus === 'invalid'}
                    className="widget-click rounded-xl bg-[#123B5D] px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E2E4A] disabled:opacity-50"
                  >
                    {submitting
                      ? isNe ? 'सुरक्षित हुँदैछ...' : 'Saving...'
                      : isNe ? 'सुरक्षित गर्नुहोस्' : 'Save Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ─── Version History & New Version Modal ─── */}
        {mounted && isVersionModalOpen && versionModalDoc && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-teal-200 bg-white p-6 shadow-2xl animate-scale-up">
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#18A999]">
                  <GitBranch className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#123B5D]">
                    {isNe ? 'कागजात संस्करण तथा टेम्प्लेट रेकर्डहरू' : 'Document Versions & Template Records'}
                  </h2>
                  <p className="text-xs text-slate-500 font-outfit">
                    {versionModalDoc.name} ({versionModalDoc.slug})
                  </p>
                </div>
              </div>

              {/* Version History List */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isNe ? 'सक्रिय तथा पूर्व संस्करणहरू' : 'Existing Versions & Templates'}
                </h3>

                <div className="space-y-2">
                  {(versionModalDoc.versions && versionModalDoc.versions.length > 0
                    ? versionModalDoc.versions
                    : [
                        {
                          id: 'v-initial',
                          version_number: versionModalDoc.active_version?.version_number || 'v2026.1',
                          effective_date: versionModalDoc.active_version?.effective_date || null,
                          is_active: true,
                          template: versionModalDoc.active_version?.template || null,
                        },
                      ]
                  ).map((ver, idx) => (
                    <div
                      key={ver.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 transition hover:bg-white hover:shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#123B5D] font-mono text-xs font-bold shadow-2xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#123B5D]">
                              {ver.version_number}
                            </span>
                            {ver.is_active && (
                              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                {isNe ? 'सक्रिय (Current)' : 'Active (Current)'}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            {ver.effective_date && (
                              <span className="inline-flex items-center gap-1 font-outfit">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{ver.effective_date}</span>
                              </span>
                            )}
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#18A999] font-medium font-mono">
                              <Layers className="h-3 w-3" />
                              <span>{ver.template?.name || `${versionModalDoc.name} Template`}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            ver.template?.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ver.template?.status === 'published'
                            ? isNe ? 'प्रकाशित' : 'Published'
                            : isNe ? 'मस्यौदा' : 'Draft'}
                        </span>
                        <Link
                          href={`/documents/${versionModalDoc.slug}/form`}
                          target="_blank"
                          className="widget-click inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3 w-3 text-teal-600" />
                          <span>{isNe ? 'फारम' : 'Form'}</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form to Create New Version */}
              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B5D] flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#18A999]" />
                  <span>{isNe ? 'नयाँ संस्करण र लिंक गरिएको टेम्प्लेट थप्नुहोस्' : 'Create New Version & Linked Template'}</span>
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isNe
                    ? 'फारममा परिवर्तन वा नयाँ कानुनी ढाँचा अनुसार नयाँ संस्करण दर्ता गर्नुहोस्।'
                    : 'Provision a new schema version and starter template linked to this document.'}
                </p>

                <form onSubmit={handleCreateVersion} className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {isNe ? 'संस्करण नम्बर (Version Code) *' : 'Version Number *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newVersionNumber}
                        onChange={(e) => setNewVersionNumber(e.target.value)}
                        placeholder="e.g. v2026.2"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {isNe ? 'लागू हुने मिति (Effective Date) *' : 'Effective Date *'}
                      </label>
                      <input
                        type="date"
                        required
                        value={newVersionEffectiveDate}
                        onChange={(e) => setNewVersionEffectiveDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-outfit focus:border-[#18A999] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="set_active_check"
                      checked={newVersionSetActive}
                      onChange={(e) => setNewVersionSetActive(e.target.checked)}
                      className="h-4 w-4 rounded-sm border-slate-300 text-[#18A999] focus:ring-[#18A999]"
                    />
                    <label htmlFor="set_active_check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      {isNe
                        ? 'यस नयाँ संस्करणलाई तुरुन्तै मुख्य (सक्रिय) संस्करण बनाउने'
                        : 'Set as current active version for live public submissions'}
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsVersionModalOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      {isNe ? 'बन्द' : 'Close'}
                    </button>
                    <button
                      type="submit"
                      disabled={creatingVersion}
                      className="widget-click rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {creatingVersion
                        ? isNe ? 'संस्करण सिर्जना हुँदैछ...' : 'Creating...'
                        : isNe ? 'नयाँ संस्करण दर्ता गर्नुहोस्' : 'Create & Link Version'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminShell>
  );
}
