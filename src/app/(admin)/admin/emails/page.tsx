'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import {
  api,
  EmailSettingsData,
  EmailTemplateItem,
  EmailLogItem,
} from '@/lib/api';
import { formatBsDate } from '@/lib/nepaliDate';
import {
  Mail,
  Settings,
  FileCode,
  ListOrdered,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Edit2,
  Lock,
  Save,
  Check,
  Code,
  Columns,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Heading,
  List,
  Link2,
  Maximize2,
} from 'lucide-react';

export default function AdminEmailManagementPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'test' | 'logs'>('settings');

  // Settings State
  const [settings, setSettings] = useState<EmailSettingsData | null>(null);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [editorMode, setEditorMode] = useState<'split' | 'visual' | 'code'>('split');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);

  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; success: boolean } | null>(null);

  // Logs State
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [logStatus, setLogStatus] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // Load Settings & Templates on mount
  useEffect(() => {
    api.admin.emails.getSettings().then(setSettings).catch(() => {});
    api.admin.emails.getTemplates().then((t) => {
      setTemplates(t);
      if (t.length > 0) setSelectedTemplate(t[0]);
    }).catch(() => {});
  }, []);

  // Load Logs when logs tab opens
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.admin.emails.getLogs(undefined, {
        status: logStatus,
        search: logSearch,
      });
      if (Array.isArray(data)) setLogs(data);
    } catch {} finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, logStatus]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setSettingsMsg(null);

    try {
      const payload: any = { ...settings };
      if (smtpPassword) {
        payload.smtp_password = smtpPassword;
      }
      const res = await api.admin.emails.updateSettings(payload);
      setSettings(res.settings);
      setSmtpPassword('');
      setSettingsMsg({
        text: isNe ? 'इमेल सेटिङहरू सफलतापूर्वक सुरक्षित गरियो।' : 'Email settings saved successfully.',
        success: true,
      });
    } catch (err: any) {
      setSettingsMsg({
        text: err.message || (isNe ? 'सेटिङ सुरक्षित गर्न असफल।' : 'Failed to save settings.'),
        success: false,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await api.admin.emails.sendTest(testEmail);
      setTestResult({
        text: res.message || 'Test email dispatched successfully.',
        success: true,
      });
    } catch (err: any) {
      setTestResult({
        text: err.message || 'Failed to dispatch test email. Verify SMTP host and port.',
        success: false,
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSavingTemplate(true);
    setTemplateMsg(null);

    try {
      const res = await api.admin.emails.updateTemplate(editingTemplate.id, {
        subject: editingTemplate.subject,
        body_html: editingTemplate.body_html,
        body_text: editingTemplate.body_text,
        is_active: editingTemplate.is_active,
      });
      setTemplateMsg(isNe ? 'टेम्प्लेट सुरक्षित गरियो।' : 'Template updated successfully.');
      setSelectedTemplate(res.template);
      setTemplates((prev) => prev.map((t) => (t.id === res.template.id ? res.template : t)));
    } catch (err: any) {
      setTemplateMsg(err.message || 'Failed to update template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleRetryLog = async (id: number) => {
    setRetryingId(id);
    try {
      await api.admin.emails.retryLog(id);
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#123B5D]">
              {isNe ? 'इमेल स्वचालन तथा व्यवस्थापन' : 'Email Automation & Delivery'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'SMTP सर्भर, सूचना टेम्प्लेटहरू, परीक्षण इमेल र डेलिभरी लगहरू व्यवस्थापन गर्नुहोस्।'
                : 'Configure SMTP providers, dynamic email templates, notification toggles, and delivery logs.'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>{isNe ? 'SMTP र प्रदायक सेटिङ' : 'SMTP & Provider Settings'}</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>{isNe ? 'इमेल टेम्प्लेट सम्पादक' : 'Email Templates Editor'}</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'test'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>{isNe ? 'परीक्षण इमेल पठाउनुहोस्' : 'Send Test Email'}</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            <span>{isNe ? 'डेलिभरी लगहरू' : 'Delivery Logs'}</span>
          </button>
        </div>

        {/* ─── TAB 1: SMTP & Provider Settings ─── */}
        {activeTab === 'settings' && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
            {settingsMsg && (
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                settingsMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {settingsMsg.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{settingsMsg.text}</span>
              </div>
            )}

            {!settings ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading settings...</div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Server Credentials */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-[#123B5D] border-b border-slate-100 pb-2">
                      {isNe ? 'मेल सर्भर कन्फिगरेसन' : 'Mail Server Configuration'}
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isNe ? 'इमेल प्रदायक (Driver)' : 'Mail Provider / Driver'}
                      </label>
                      <select
                        value={settings.provider}
                        onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                      >
                        <option value="smtp">Custom SMTP (Gmail / Outlook / Mailpit / Direct SMTP)</option>
                        <option value="log">Local Log Driver (Testing / Development)</option>
                        <option value="mailgun">Mailgun API</option>
                        <option value="postmark">Postmark</option>
                        <option value="ses">Amazon SES</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'SMTP होस्ट' : 'SMTP Host'}
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_host || ''}
                          onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                          placeholder="e.g. smtp.gmail.com or mailpit"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'पोर्ट' : 'Port'}
                        </label>
                        <input
                          type="number"
                          value={settings.smtp_port}
                          onChange={(e) => setSettings({ ...settings, smtp_port: Number(e.target.value) })}
                          placeholder="587"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'इन्क्रिप्सन' : 'Encryption'}
                        </label>
                        <select
                          value={settings.smtp_encryption || 'null'}
                          onChange={(e) => setSettings({ ...settings, smtp_encryption: e.target.value === 'null' ? null : e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        >
                          <option value="tls">TLS (Port 587)</option>
                          <option value="ssl">SSL (Port 465)</option>
                          <option value="null">None (Port 1025 / 25)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'प्रयोगकर्ता नाम' : 'Username'}
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_username || ''}
                          onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                          placeholder="SMTP user"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isNe ? 'SMTP पासवर्ड' : 'SMTP Password'}
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          placeholder={settings.has_password ? '•••••••• (Encrypted in DB, enter new to change)' : 'Enter SMTP password'}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isNe ? 'गोपनीयताका लागि पासवर्ड पूर्ण रूपमा इन्क्रिप्ट गरी भण्डारण गरिन्छ।' : 'Passwords are encrypted with Laravel Crypt and never exposed in logs or UI.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'पठाउनेको नाम' : 'Sender Name'}
                        </label>
                        <input
                          type="text"
                          value={settings.from_name}
                          onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isNe ? 'पठाउनेको इमेल' : 'Sender Email'}
                        </label>
                        <input
                          type="email"
                          value={settings.from_email}
                          onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Notification Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-[#123B5D] border-b border-slate-100 pb-2">
                      {isNe ? 'सूचना प्रकार सक्रिय/निष्क्रिय गर्नुहोस्' : 'Automated Event Toggles'}
                    </h3>

                    <div className="space-y-3">
                      {[
                        { key: 'verify_email', label: isNe ? 'खाता दर्ता तथा इमेल प्रमाणीकरण' : 'Account Registration & Verification' },
                        { key: 'password_reset', label: isNe ? 'पासवर्ड रिसेट निर्देशन' : 'Password Reset Notifications' },
                        { key: 'payment_success', label: isNe ? 'सफल भुक्तानी रसिद' : 'Payment Confirmation' },
                        { key: 'payment_failed', label: isNe ? 'भुक्तानी विफलता सूचना' : 'Payment Failure Alert' },
                        { key: 'document_ready', label: isNe ? 'कागजात तयार भएको सुरक्षित डाउनलोड लिंक' : 'Document Ready & Expiring Download Link' },
                        { key: 'document_failed', label: isNe ? 'कागजात सिर्जना विफलता' : 'Document Generation Error Notification' },
                        { key: 'business_invitation', label: isNe ? 'संस्थागत खाता टोली निमन्त्रणा' : 'Business Account Team Invitations' },
                        { key: 'account_welcome', label: isNe ? 'नयाँ प्रयोगकर्ता स्वागत इमेल' : 'New User Welcome Email' },
                      ].map((item) => {
                        const isEnabled = settings.notifications_enabled?.[item.key] ?? true;
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60"
                          >
                            <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...(settings.notifications_enabled || {}) };
                                updated[item.key] = !isEnabled;
                                setSettings({ ...settings, notifications_enabled: updated });
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                isEnabled ? 'bg-[#18A999]' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  isEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingSettings ? (isNe ? 'बचत हुँदै...' : 'Saving...') : (isNe ? 'सेटिङ सुरक्षित गर्नुहोस्' : 'Save Email Settings')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── TAB 2: Email Templates Editor ─── */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selector List */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-extrabold text-[#123B5D] uppercase tracking-wider px-2 mb-3">
                {isNe ? 'टेम्प्लेटहरू' : 'Available Templates'}
              </h3>
              <div className="space-y-1">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplate(tmpl);
                        setEditingTemplate({ ...tmpl });
                        setTemplateMsg(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition-all ${
                        isSelected
                          ? 'bg-teal-50 border border-teal-200 text-[#123B5D] font-bold shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tmpl.key}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Editor Area */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              {templateMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{templateMsg}</span>
                </div>
              )}

              {editingTemplate ? (
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#123B5D]">{editingTemplate.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Key: {editingTemplate.key}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700">{isNe ? 'सक्रिय' : 'Active'}</label>
                      <input
                        type="checkbox"
                        checked={editingTemplate.is_active}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                        className="h-4 w-4 text-[#18A999] rounded-md border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Variables pills */}
                  {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                        {isNe ? 'अनुमोदित चलहरू (Dynamic Variables - Click to copy)' : 'Approved Dynamic Placeholders'}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {editingTemplate.variables.map((v) => (
                          <span
                            key={v}
                            onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                            title="Click to copy"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-700 border border-slate-200 hover:border-teal-400 transition-colors shadow-2xs"
                          >
                            <span>&#123;&#123;{v}&#125;&#125;</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isNe ? 'इमेल विषय (Subject)' : 'Email Subject'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 font-medium focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>

                  {/* Rich HTML Viewer & Editor Toolbar */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        {isNe ? 'इमेल HTML बडी तथा प्रत्यक्ष दृश्य (HTML Editor & Viewer)' : 'Email HTML Body & Live Viewer'}
                      </label>

                      {/* Mode Switcher */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setEditorMode('split')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            editorMode === 'split'
                              ? 'bg-white text-[#123B5D] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Columns className="h-3.5 w-3.5" />
                          <span>{isNe ? 'दुवै (Split View)' : 'Split View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            editorMode === 'visual'
                              ? 'bg-white text-[#123B5D] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{isNe ? 'प्रत्यक्ष दृश्य (Preview)' : 'Live Preview'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('code')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            editorMode === 'code'
                              ? 'bg-white text-[#123B5D] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Code className="h-3.5 w-3.5" />
                          <span>{isNe ? 'HTML कोड (Source)' : 'HTML Source'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Format & Insert Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        title="Add Bold Heading"
                        onClick={() => {
                          const snippet = `<h2 style="color: #123B5D; margin-top: 0;">Heading Title</h2>\n`;
                          setEditingTemplate({
                            ...editingTemplate,
                            body_html: (editingTemplate.body_html || '') + snippet,
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Heading className="h-3.5 w-3.5" />
                        <span className="text-[10px]">H2</span>
                      </button>

                      <button
                        type="button"
                        title="Insert Paragraph"
                        onClick={() => {
                          const snippet = `<p style="color: #475569; line-height: 1.6;">Your message text here...</p>\n`;
                          setEditingTemplate({
                            ...editingTemplate,
                            body_html: (editingTemplate.body_html || '') + snippet,
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <span className="text-[10px] font-mono">&lt;p&gt;</span>
                      </button>

                      <button
                        type="button"
                        title="Insert Action Button"
                        onClick={() => {
                          const snippet = `\n<div style="text-align: center; margin: 24px 0;">\n  <a href="{{secure_download_link}}" style="background: #18A999; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Click Here</a>\n</div>\n`;
                          setEditingTemplate({
                            ...editingTemplate,
                            body_html: (editingTemplate.body_html || '') + snippet,
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-[#18A999] text-xs font-bold flex items-center gap-1"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Button</span>
                      </button>

                      <button
                        type="button"
                        title="Insert Table"
                        onClick={() => {
                          const snippet = `\n<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">\n  <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Item</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">Detail</td></tr>\n</table>\n`;
                          setEditingTemplate({
                            ...editingTemplate,
                            body_html: (editingTemplate.body_html || '') + snippet,
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <span className="text-[10px] font-mono">&lt;table&gt;</span>
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-1" />

                      <span className="text-[10px] font-semibold text-slate-400">
                        {isNe ? 'द्रुत ढाँचा (Quick Snippets)' : 'WYSIWYG Helpers'}
                      </span>
                    </div>

                    {/* Editor & Viewer Canvas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Code Editor Pane */}
                      {(editorMode === 'split' || editorMode === 'code') && (
                        <div className={`space-y-1 ${editorMode === 'code' ? 'lg:col-span-2' : ''}`}>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                            <span>HTML Source</span>
                            <span>{editingTemplate.body_html?.length || 0} chars</span>
                          </div>
                          <textarea
                            rows={16}
                            required
                            value={editingTemplate.body_html}
                            onChange={(e) =>
                              setEditingTemplate({ ...editingTemplate, body_html: e.target.value })
                            }
                            className="w-full font-mono rounded-2xl border border-slate-700 p-4 text-xs font-medium leading-relaxed bg-[#0f172a] text-[#38bdf8] focus:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-400/20 shadow-inner"
                            placeholder="Enter HTML template here..."
                          />
                        </div>
                      )}

                      {/* Visual Live Viewer Pane */}
                      {(editorMode === 'split' || editorMode === 'visual') && (
                        <div className={`space-y-1 ${editorMode === 'visual' ? 'lg:col-span-2' : ''}`}>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5 text-[#18A999]" />
                              <span>{isNe ? 'इमेल प्रत्यक्ष रूप (Real Rendering)' : 'Live Email Client View'}</span>
                            </span>
                            <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                              Live
                            </span>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 min-h-[340px] max-h-[460px] overflow-y-auto">
                            {/* Email Mock Header */}
                            <div className="rounded-xl bg-white p-3 mb-3 border border-slate-200/80 shadow-2xs text-xs space-y-1">
                              <div className="text-slate-400 text-[10px]">
                                <strong>To:</strong> citizen@example.com
                              </div>
                              <div className="text-slate-800 font-bold truncate">
                                <strong>Subject:</strong> {editingTemplate.subject}
                              </div>
                            </div>

                            {/* Rendered HTML Container */}
                            <div
                              className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/90 text-sm overflow-hidden"
                              dangerouslySetInnerHTML={{
                                __html: (editingTemplate.body_html || '')
                                  .replace(/\{\{user_name\}\}/g, 'Bikash Nepal')
                                  .replace(/\{\{business_name\}\}/g, 'Himalayan Enterprises Pvt. Ltd.')
                                  .replace(/\{\{order_number\}\}/g, 'ORD-2026-8841')
                                  .replace(/\{\{document_name\}\}/g, 'वार्षिक साधारण सभा (AGM) माइन्यूट')
                                  .replace(/\{\{amount\}\}/g, '500')
                                  .replace(/\{\{payment_provider\}\}/g, 'eSewa')
                                  .replace(/\{\{payment_reference\}\}/g, 'ESW-992147')
                                  .replace(/\{\{date\}\}/g, '2083-06-28')
                                  .replace(/\{\{secure_download_link\}\}/g, 'http://localhost:3000/api/v1/downloads/demo-token-123')
                                  .replace(/\{\{expiry_hours\}\}/g, '48'),
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#18A999] hover:bg-[#13887a] px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{savingTemplate ? 'Saving...' : (isNe ? 'टेम्प्लेट सुरक्षित गर्नुहोस्' : 'Save Template')}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a template to view or edit.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: Send Test Email ─── */}
        {activeTab === 'test' && (
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-[#123B5D]">
                {isNe ? 'SMTP परीक्षण इमेल पठाउनुहोस्' : 'Send Test Notification'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {isNe
                  ? 'तपाईंको सक्रिय SMTP सर्भर र प्रमाणीकरण ठीकसँग चलिरहेको छ भनी प्रमाणित गर्नुहोस्।'
                  : 'Verify that your active SMTP server and credentials can successfully deliver emails.'}
              </p>
            </div>

            {testResult && (
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{testResult.text}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'परीक्षण प्राप्तकर्ता इमेल' : 'Recipient Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {sendingTest ? (
                  <span>{isNe ? 'पठाउँदै...' : 'Sending test email...'}</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{isNe ? 'अहिले नै परीक्षण गर्नुहोस्' : 'Dispatch Test Email'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 4: Delivery Logs ─── */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder={isNe ? 'इमेल वा विषय खोज्नुहोस्...' : 'Search recipient or subject...'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#18A999] focus:outline-hidden"
                />
                <button
                  onClick={loadLogs}
                  className="px-3 py-1.5 rounded-xl bg-[#123B5D] text-xs font-bold text-white"
                >
                  {isNe ? 'खोज्नुहोस्' : 'Filter'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
                >
                  <option value="">{isNe ? 'सबै अवस्था' : 'All Status'}</option>
                  <option value="sent">{isNe ? 'सफल (Sent)' : 'Sent'}</option>
                  <option value="failed">{isNe ? 'असफल (Failed)' : 'Failed'}</option>
                  <option value="pending">{isNe ? 'बाँकी (Pending)' : 'Pending'}</option>
                </select>

                <button
                  onClick={loadLogs}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              {loadingLogs ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading delivery logs...</div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No email records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-400">
                      <tr>
                        <th className="px-6 py-3.5">{isNe ? 'प्राप्तकर्ता' : 'Recipient'}</th>
                        <th className="px-6 py-3.5">{isNe ? 'विषय' : 'Subject'}</th>
                        <th className="px-6 py-3.5">{isNe ? 'टेम्प्लेट' : 'Template'}</th>
                        <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                        <th className="px-6 py-3.5">{isNe ? 'मिति (BS)' : 'Timestamp'}</th>
                        <th className="px-6 py-3.5 text-right">{isNe ? 'कार्य' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{log.recipient_email}</div>
                            {log.recipient_name && <div className="text-[10px] text-slate-400">{log.recipient_name}</div>}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate font-medium">
                            {log.subject}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                            {log.template_key || 'direct'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              log.status === 'sent'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {log.status}
                            </span>
                            {log.error_message && (
                              <p className="text-[10px] text-rose-600 mt-1 truncate max-w-xs" title={log.error_message}>
                                {log.error_message}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[11px]">
                            {formatBsDate(log.created_at, 'YYYY MMMM DD', isNe ? 'ne' : 'en')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {log.status === 'failed' && (
                              <button
                                onClick={() => handleRetryLog(log.id)}
                                disabled={retryingId === log.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                              >
                                <RotateCw className={`h-3 w-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                                <span>{isNe ? 'पुनः प्रयास' : 'Retry'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
