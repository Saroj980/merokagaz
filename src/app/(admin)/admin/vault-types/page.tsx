'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import toast, { alertModal } from '@/lib/toast';
import ModalPortal from '@/components/ui/ModalPortal';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderArchive,
  Tag,
} from 'lucide-react';

interface VaultDocType {
  id: number;
  code: string;
  name_en: string;
  name_ne: string;
  description_en: string | null;
  description_ne: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const AVAILABLE_ICONS = [
  { value: 'badge', label: 'Badge / ID Card (नागरिकता)' },
  { value: 'credit_card', label: 'Credit Card / NID (परिचयपत्र)' },
  { value: 'drive_eta', label: 'Drive / Vehicle (सवारी/लाइसेन्स)' },
  { value: 'menu_book', label: 'Booklet / Bluebook (ब्लूबुक)' },
  { value: 'travel_explore', label: 'Passport / Travel (राहदानी)' },
  { value: 'receipt_long', label: 'Receipt / Tax / PAN (प्यान)' },
  { value: 'description', label: 'General Document (सरकारी कागजात)' },
  { value: 'shield', label: 'Shield / Security (सुरक्षा)' },
  { value: 'file_text', label: 'Certificate / Text (प्रमाणपत्र)' },
];

export default function AdminVaultTypesPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [types, setTypes] = useState<VaultDocType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [token, setToken] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<VaultDocType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name_en: '',
    name_ne: '',
    description_en: '',
    description_ne: '',
    icon: 'badge',
    sort_order: 1,
    is_active: true,
  });

  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('mk_admin_token') || '';
    setToken(t);
    fetchTypes(t);
  }, [filterStatus]);

  async function fetchTypes(t = token) {
    setLoading(true);
    try {
      const activeParam = filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined;
      const res = await api.admin.vaultTypes.list(t, {
        search: searchQuery.trim() || undefined,
        is_active: activeParam,
      });

      if (res && res.data && Array.isArray(res.data.types)) {
        setTypes(res.data.types);
      } else {
        setTypes([]);
      }
    } catch (err: any) {
      toast.error(isNe ? 'कागजात प्रकारहरू लोड गर्न सकिएन।' : 'Failed to load vault document types.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingType(null);
    setCodeManuallyEdited(false);
    setFormData({
      code: '',
      name_en: '',
      name_ne: '',
      description_en: '',
      description_ne: '',
      icon: 'badge',
      sort_order: (types.length || 0) + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(item: VaultDocType) {
    setEditingType(item);
    setCodeManuallyEdited(true);
    setFormData({
      code: item.code,
      name_en: item.name_en,
      name_ne: item.name_ne,
      description_en: item.description_en || '',
      description_ne: item.description_ne || '',
      icon: item.icon || 'badge',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  }

  function handleNameEnChange(val: string) {
    setFormData((prev) => {
      const next = { ...prev, name_en: val };
      if (!codeManuallyEdited && !editingType) {
        next.code = slugify(val);
      }
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name_en.trim() || !formData.name_ne.trim() || !formData.code.trim()) {
      toast.error(isNe ? 'कृपया आवश्यक विवरणहरू भर्नुहोस्।' : 'Please fill all required fields.');
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await api.admin.vaultTypes.update(token, editingType.id, formData);
        toast.success(isNe ? 'कागजात प्रकार सफलतापूर्वक सम्पादन भयो।' : 'Document type updated successfully.');
      } else {
        await api.admin.vaultTypes.create(token, formData);
        toast.success(isNe ? 'नयाँ कागजात प्रकार थपियो।' : 'New document type created.');
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      toast.error(err?.message || (isNe ? 'सुरक्षित गर्न असफल भयो।' : 'Failed to save document type.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item: VaultDocType) {
    try {
      await api.admin.vaultTypes.toggleStatus(token, item.id);
      toast.success(
        isNe
          ? `स्थिति अद्यावधिक गरियो: ${!item.is_active ? 'सक्रिय' : 'निष्क्रिय'}`
          : `Status updated: ${!item.is_active ? 'Active' : 'Inactive'}`
      );
      setTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch (err: any) {
      toast.error(isNe ? 'स्थिति परिवर्तन गर्न सकिएन।' : 'Failed to change status.');
    }
  }

  async function handleDelete(item: VaultDocType) {
    const confirmed = await alertModal.confirm(
      isNe ? 'कागजात प्रकार मेटाउने?' : 'Delete Document Type?',
      isNe
        ? `के तपाईं "${item.name_ne}" (${item.code}) प्रकार मेटाउन निश्चित हुनुहुन्छ? यो प्रकार प्रयोगकर्ताहरूको भल्टमा देखिन छाड्नेछ।`
        : `Are you sure you want to delete "${item.name_en}" (${item.code})? It will no longer appear in the mobile vault.`,
      isNe ? 'मेटाउनुहोस्' : 'Delete',
      isNe ? 'रद्द' : 'Cancel'
    );

    if (!confirmed) return;

    try {
      await api.admin.vaultTypes.delete(token, item.id);
      toast.success(isNe ? 'सफलतापूर्वक मेटाइयो।' : 'Deleted successfully.');
      setTypes((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err: any) {
      toast.error(isNe ? 'मेटाउन सकिएन।' : 'Failed to delete.');
    }
  }

  const filteredTypes = types.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name_en.toLowerCase().includes(q) ||
      t.name_ne.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.description_en && t.description_en.toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isNe ? 'भल्ट कागजात प्रकार व्यवस्थापन' : 'Vault Document Types Management'}
              </h1>
              <p className="text-sm text-slate-500">
                {isNe
                  ? 'मोबाइल एपको डिजिटल भल्टमा उपलब्ध हुने आधिकारिक कागजातहरूको सूची तथा प्रकार नियन्त्रण गर्नुहोस्।'
                  : 'Manage official document categories and types available in the mobile user vault.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTypes()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title={isNe ? 'पुनः लोड गर्नुहोस्' : 'Reload'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isNe ? 'नयाँ कागजात प्रकार' : 'Add Document Type'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isNe ? 'नाम वा कोडबाट खोज्नुहोस्...' : 'Search by name or code...'}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all'
                  ? isNe ? 'सबै' : 'All'
                  : st === 'active'
                  ? isNe ? 'सक्रिय' : 'Active'
                  : isNe ? 'निष्क्रिय' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* Types Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">{isNe ? 'शीर्षक / नाम' : 'Title / Name'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'कोड (Slug)' : 'Code (Key)'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'आइकन' : 'Icon'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'क्रम (Sort)' : 'Sort'}</th>
                  <th className="py-3.5 px-4 text-center">{isNe ? 'स्थिति' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isNe ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                      <span>{isNe ? 'लोड हुँदैछ...' : 'Loading types...'}</span>
                    </td>
                  </tr>
                ) : filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FolderArchive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span>{isNe ? 'कुनै कागजात प्रकार भेटिएन।' : 'No vault document types found.'}</span>
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{item.name_en}</div>
                        <div className="text-xs text-slate-500">{item.name_ne}</div>
                        {item.description_en && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.description_en}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-medium">
                          <Tag className="w-3 h-3" />
                          <span>{item.icon || 'badge'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {item.sort_order}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isNe ? 'सक्रिय' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>{isNe ? 'निष्क्रिय' : 'Inactive'}</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title={isNe ? 'सम्पादन' : 'Edit'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title={isNe ? 'मेटाउनुहोस्' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        <ModalPortal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            editingType
              ? isNe ? 'कागजात प्रकार सम्पादन गर्नुहोस्' : 'Edit Document Type'
              : isNe ? 'नयाँ कागजात प्रकार थप्नुहोस्' : 'New Vault Document Type'
          }
          subtitle={
            isNe
              ? 'भल्टमा प्रयोगकर्ताले छनोट गर्न मिल्ने प्रकारको विवरण भर्नुहोस्।'
              : 'Configure document type code, names, and display settings.'
          }
        >
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isNe ? 'अंग्रेजी नाम (English Name)' : 'Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => handleNameEnChange(e.target.value)}
                placeholder="e.g. Nepali Citizenship (Front)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isNe ? 'नेपाली नाम (Nepali Name)' : 'Name (Nepali)'} *
              </label>
              <input
                type="text"
                required
                value={formData.name_ne}
                onChange={(e) => setFormData({ ...formData, name_ne: e.target.value })}
                placeholder="उदा. नेपाली नागरिकता (अगाडि)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {isNe ? 'कोड / Slug' : 'Code (Key)'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => {
                    setCodeManuallyEdited(true);
                    setFormData({ ...formData, code: slugify(e.target.value) });
                  }}
                  placeholder="citizenship_front"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {isNe ? 'क्रम (Sort Order)' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isNe ? 'आइकन शैली (Icon)' : 'Icon Style'}
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <option key={ic.value} value={ic.value}>
                    {ic.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isNe ? 'अंग्रेजी विवरण (Description EN)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Optional details or instructions..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isNe ? 'नेपाली विवरण (Description NE)' : 'Description (Nepali)'}
              </label>
              <textarea
                rows={2}
                value={formData.description_ne}
                onChange={(e) => setFormData({ ...formData, description_ne: e.target.value })}
                placeholder="कागजात सम्बन्धी थप निर्देशन..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  {isNe ? 'सक्रिय राख्ने (Active in App)' : 'Active (Available in Mobile App)'}
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {isNe ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {saving
                  ? isNe ? 'सेभ गर्दै...' : 'Saving...'
                  : editingType
                  ? isNe ? 'अपडेट गर्नुहोस्' : 'Update Type'
                  : isNe ? 'थप्नुहोस्' : 'Create Type'}
              </button>
            </div>
          </form>
        </ModalPortal>
      </div>
    </AdminShell>
  );
}
