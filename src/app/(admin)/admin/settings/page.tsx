'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, SiteSettings } from '@/lib/api';
import toast from '@/lib/toast';
import {
  Check,
  Globe,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    loadSettings(stored);
  }, []);

  async function loadSettings(t = token) {
    setLoading(true);
    try {
      // First try admin endpoint, fallback to public endpoint
      let data: SiteSettings;
      if (t) {
        data = await api.admin.settings.get(t);
      } else {
        data = await api.settings.get();
      }
      setSettings(data);
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'सेटिङहरू लोड गर्न सकिएन।' : 'Failed to load settings.'));
    } finally {
      setLoading(false);
    }
  }

  // Multi-Email Handlers
  const currentEmails = (settings?.contact_emails && settings.contact_emails.length > 0)
    ? settings.contact_emails
    : (settings?.contact_email ? [settings.contact_email] : ['support@merokagaz.com']);

  const handleEmailChange = (index: number, val: string) => {
    if (!settings) return;
    const updated = [...currentEmails];
    updated[index] = val;
    setSettings({
      ...settings,
      contact_emails: updated,
      contact_email: updated[0] || '',
    });
  };

  const handleAddEmail = () => {
    if (!settings) return;
    const updated = [...currentEmails, ''];
    setSettings({
      ...settings,
      contact_emails: updated,
      contact_email: updated[0] || '',
    });
  };

  const handleRemoveEmail = (index: number) => {
    if (!settings) return;
    if (currentEmails.length <= 1) {
      toast.error(isNe ? 'कम्तिमा एउटा सम्पर्क इमेल हुनु आवश्यक छ।' : 'At least one contact email is required.');
      return;
    }
    const updated = currentEmails.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      contact_emails: updated,
      contact_email: updated[0] || '',
    });
  };

  // Multi-Phone Handlers
  const currentPhones = (settings?.contact_phones && settings.contact_phones.length > 0)
    ? settings.contact_phones
    : (settings?.contact_phone ? [settings.contact_phone] : ['+977-9865650872']);

  const handlePhoneChange = (index: number, val: string) => {
    if (!settings) return;
    const updated = [...currentPhones];
    updated[index] = val;
    setSettings({
      ...settings,
      contact_phones: updated,
      contact_phone: updated[0] || '',
    });
  };

  const handleAddPhone = () => {
    if (!settings) return;
    const updated = [...currentPhones, ''];
    setSettings({
      ...settings,
      contact_phones: updated,
      contact_phone: updated[0] || '',
    });
  };

  const handleRemovePhone = (index: number) => {
    if (!settings) return;
    if (currentPhones.length <= 1) {
      toast.error(isNe ? 'कम्तिमा एउटा फोन नम्बर हुनु आवश्यक छ।' : 'At least one contact phone is required.');
      return;
    }
    const updated = currentPhones.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      contact_phones: updated,
      contact_phone: updated[0] || '',
    });
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const payload: SiteSettings = {
        ...settings,
        contact_emails: currentEmails.map((e) => e.trim()).filter(Boolean),
        contact_email: currentEmails[0]?.trim() || '',
        contact_phones: currentPhones.map((p) => p.trim()).filter(Boolean),
        contact_phone: currentPhones[0]?.trim() || '',
      };

      const res = await api.admin.settings.update(token, payload);
      const updated = (res as any)?.data || res;
      if (updated && typeof updated === 'object') {
        setSettings(updated);
      }
      toast.success(isNe ? 'सेटिङहरू सफलतापूर्वक सुरक्षित गरियो!' : 'Settings saved successfully!');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'सेटिङ सुरक्षित गर्न असफल भयो।' : 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <AdminShell>
        <div className="flex h-96 items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-outfit">
            <RefreshCw className="h-4 w-4 animate-spin text-[#18A999]" />
            <span>Loading dynamic settings...</span>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <form onSubmit={handleSave} className="w-full space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-teal-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-[#123B5D]">
              {isNe ? 'वेबसाइट तथा प्लेटफर्म सेटिङहरू' : 'Website & Platform Settings'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'पोर्टलको नाम, कानुनी कम्पनी विवरण, ट्यागलाइन र आधिकारिक सम्पर्क विवरणहरू यहाँबाट व्यवस्थापन गर्नुहोस्।'
                : 'Configure portal name, company registration branding, taglines, and official support contact details.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="widget-click inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>{saving ? (isNe ? 'सुरक्षित हुँदैछ...' : 'Saving...') : isNe ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'Save Changes'}</span>
          </button>
        </div>

        {/* ─── 1. General Branding & Contact ─── */}
        <div className="rounded-3xl border border-teal-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="h-4 w-4 text-[#18A999]" />
            <h2 className="text-sm font-bold text-[#123B5D]">
              {isNe ? 'सामान्य ब्रान्डिङ र सम्पर्क' : 'General Branding & Contact Details'}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'पोर्टलको नाम' : 'Portal Name'}
              </label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'कम्पनीको नाम (Copyright)' : 'Company Name (Copyright)'}
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'ट्यागलाइन (नेपाली)' : 'Tagline (Nepali)'}
              </label>
              <input
                type="text"
                value={settings.site_tagline_ne}
                onChange={(e) => setSettings({ ...settings, site_tagline_ne: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'ट्यागलाइन (अंग्रेजी)' : 'Tagline (English)'}
              </label>
              <input
                type="text"
                value={settings.site_tagline_en}
                onChange={(e) => setSettings({ ...settings, site_tagline_en: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden font-outfit"
              />
            </div>

            {/* ─── Multi-Email Section ─── */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#18A999] border border-teal-200/60">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'सम्पर्क इमेलहरू (Support Emails)' : 'Support Emails'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isNe ? 'पहिलो इमेल मुख्य सम्पर्कको रूपमा देखिनेछ' : 'First email acts as primary support contact'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-teal-100/70 text-teal-800 px-2.5 py-0.5 text-[10px] font-bold">
                  {currentEmails.length} {isNe ? 'इमेल' : currentEmails.length === 1 ? 'email' : 'emails'}
                </span>
              </div>

              <div className="space-y-2">
                {currentEmails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-[#18A999]" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        placeholder="support@merokagaz.com"
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-20 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden font-outfit shadow-2xs"
                      />
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx === 0 ? (isNe ? 'मुख्य (Primary)' : 'Primary') : `#${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(idx)}
                      disabled={currentEmails.length <= 1}
                      title={currentEmails.length <= 1 ? (isNe ? 'कम्तिमा एउटा इमेल चाहिन्छ' : 'At least one email is required') : (isNe ? 'हटाउनुहोस्' : 'Remove')}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddEmail}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 py-2 text-xs font-bold text-[#148C7E] transition hover:bg-teal-100/60 hover:border-teal-400 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isNe ? 'थप इमेल थप्नुहोस्' : 'Add Another Email'}</span>
              </button>
            </div>

            {/* ─── Multi-Phone Section ─── */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#123B5D] border border-blue-200/60">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'सम्पर्क फोन नम्बरहरू (Support Phones)' : 'Support Phone Numbers'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isNe ? 'पहिलो नम्बर मुख्य हटलाइनको रूपमा देखिनेछ' : 'First number acts as primary support hotline'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100/70 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                  {currentPhones.length} {isNe ? 'फोन' : currentPhones.length === 1 ? 'number' : 'numbers'}
                </span>
              </div>

              <div className="space-y-2">
                {currentPhones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-[#18A999]" />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        placeholder="+977-9865650872"
                        onChange={(e) => handlePhoneChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-20 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden font-outfit shadow-2xs"
                      />
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx === 0 ? (isNe ? 'मुख्य (Primary)' : 'Primary') : `#${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      disabled={currentPhones.length <= 1}
                      title={currentPhones.length <= 1 ? (isNe ? 'कम्तिमा एउटा फोन नम्बर चाहिन्छ' : 'At least one phone is required') : (isNe ? 'हटाउनुहोस्' : 'Remove')}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddPhone}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 py-2 text-xs font-bold text-[#123B5D] transition hover:bg-blue-100/60 hover:border-blue-400 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isNe ? 'थप फोन नम्बर थप्नुहोस्' : 'Add Another Phone'}</span>
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{isNe ? 'कार्यालय ठेगाना' : 'Office Address'}</span>
                </span>
              </label>
              <input
                type="text"
                value={settings.office_address_ne}
                onChange={(e) => setSettings({ ...settings, office_address_ne: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
