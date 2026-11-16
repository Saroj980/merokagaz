'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, MigrationItem, BackupItem, SystemOverview } from '@/lib/api';
import toast, { alertModal } from '@/lib/toast';
import {
  Database,
  Terminal,
  Zap,
  RotateCcw,
  RefreshCw,
  Download,
  Trash2,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  Check,
  AlertTriangle,
  Play,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export default function AdminSystemPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [activeTab, setActiveTab] = useState<'migrations' | 'cache' | 'backup'>('migrations');
  const [token, setToken] = useState<string>('');

  // Overview
  const [overview, setOverview] = useState<SystemOverview | null>(null);

  // Migrations State
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [loadingMigrations, setLoadingMigrations] = useState(false);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [selectedMigrations, setSelectedMigrations] = useState<string[]>([]);
  const [rowOperating, setRowOperating] = useState<string | null>(null);

  // Cache State
  const [clearingCache, setClearingCache] = useState<string | null>(null);

  // Backups State
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

  // Console output
  const [consoleOutput, setConsoleOutput] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    if (stored) {
      loadOverview(stored);
      loadMigrations(stored);
      loadBackups(stored);
    }
  }, []);

  async function loadOverview(t = token) {
    try {
      const res = await api.admin.system.overview(t);
      setOverview(res);
    } catch {
      // Offline or mock
    }
  }

  async function loadMigrations(t = token) {
    setLoadingMigrations(true);
    try {
      const res = await api.admin.system.migrations.list(t);
      setMigrations(res);
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'माइग्रेसन सूची लोड गर्न सकिएन।' : 'Failed to load migrations.'));
    } finally {
      setLoadingMigrations(false);
    }
  }

  async function loadBackups(t = token) {
    setLoadingBackups(true);
    try {
      const res = await api.admin.system.backups.list(t);
      setBackups(res);
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'ब्याकअप सूची लोड गर्न सकिएन।' : 'Failed to load backups.'));
    } finally {
      setLoadingBackups(false);
    }
  }

  // ─── Migrations Handlers ───────────────────────────────────────────────────

  async function handleRunMigrations() {
    setMigrationRunning(true);
    setConsoleOutput(isNe ? 'सबै बाँकी माइग्रेसन सुरु हुँदैछ...\n' : 'Running all pending migrations...\n');
    try {
      const res = await api.admin.system.migrations.run(token);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      setSelectedMigrations([]);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'माइग्रेसन असफल भयो।' : 'Migration failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  async function handleRollback() {
    const confirmed = await alertModal.confirm(
      isNe ? 'माइग्रेसन रोलब्याक गर्ने?' : 'Rollback Migrations?',
      isNe
        ? 'के तपाईं पछिल्लो ब्याचको माइग्रेसन रोलब्याक गर्न निश्चित हुनुहुन्छ?'
        : 'Are you sure you want to rollback the latest migration batch?',
      isNe ? 'रोलब्याक गर्नुहोस्' : 'Rollback',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setMigrationRunning(true);
    setConsoleOutput(isNe ? 'रोलब्याक सुरु हुँदैछ...\n' : 'Rolling back last batch...\n');
    try {
      const res = await api.admin.system.migrations.rollback(token, 1);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      setSelectedMigrations([]);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रोलब्याक असफल भयो।' : 'Rollback failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  // Single migration actions
  async function handleRunSingle(filename: string) {
    setRowOperating(filename);
    setConsoleOutput(isNe ? `[${filename}] माइग्रेसन चलाउँदै...\n` : `Running migration [${filename}]...\n`);
    try {
      const res = await api.admin.system.migrations.run(token, [filename]);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'माइग्रेसन असफल भयो।' : 'Migration failed.'));
    } finally {
      setRowOperating(null);
    }
  }

  async function handleRollbackSingle(filename: string) {
    const confirmed = await alertModal.confirm(
      isNe ? 'यो माइग्रेसन रोलब्याक गर्ने?' : 'Rollback this Migration?',
      isNe
        ? `के तपाईं [${filename}] लाई रोलब्याक गर्न निश्चित हुनुहुन्छ? यसले सम्बन्धित तालिकाहरू हटाउने वा डेटा परिवर्तन फिर्ता गर्नेछ।`
        : `Are you sure you want to rollback [${filename}]? This will drop tables or reverse schema changes for this migration.`,
      isNe ? 'रोलब्याक गर्नुहोस्' : 'Rollback',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setRowOperating(filename);
    setConsoleOutput(isNe ? `[${filename}] रोलब्याक हुँदैछ...\n` : `Rolling back [${filename}]...\n`);
    try {
      const res = await api.admin.system.migrations.rollback(token, { files: [filename] });
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रोलब्याक असफल भयो।' : 'Rollback failed.'));
    } finally {
      setRowOperating(null);
    }
  }

  async function handleRefreshSingle(filename: string) {
    const confirmed = await alertModal.confirm(
      isNe ? 'माइग्रेसन रिफ्रेस (Re-run) गर्ने?' : 'Re-run / Refresh Migration?',
      isNe
        ? `के तपाईं [${filename}] लाई पहिला Rollback अनि फेरि Fresh Run गर्न चाहनुहुन्छ?`
        : `Do you want to rollback and immediately re-run [${filename}]?`,
      isNe ? 'रिफ्रेस गर्नुहोस्' : 'Re-run Now',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setRowOperating(filename);
    setConsoleOutput(isNe ? `[${filename}] रिफ्रेस (Rollback + Run) हुँदैछ...\n` : `Refreshing [${filename}]...\n`);
    try {
      const res = await api.admin.system.migrations.refresh(token, [filename]);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रिफ्रेस असफल भयो।' : 'Refresh failed.'));
    } finally {
      setRowOperating(null);
    }
  }

  // Selected batch actions
  async function handleRunSelected() {
    if (selectedMigrations.length === 0) return;
    setMigrationRunning(true);
    setConsoleOutput(
      isNe
        ? `${selectedMigrations.length} वटा छानिएका माइग्रेसन चल्दैछ...\n`
        : `Executing ${selectedMigrations.length} selected migration(s)...\n`
    );
    try {
      const res = await api.admin.system.migrations.run(token, selectedMigrations);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      setSelectedMigrations([]);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'माइग्रेसन असफल भयो।' : 'Migration failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  async function handleRollbackSelected() {
    if (selectedMigrations.length === 0) return;
    const confirmed = await alertModal.confirm(
      isNe ? 'छानिएका माइग्रेसनहरू रोलब्याक गर्ने?' : 'Rollback Selected Migrations?',
      isNe
        ? `के तपाईं ${selectedMigrations.length} वटा छानिएका माइग्रेसनहरूलाई रोलब्याक गर्न निश्चित हुनुहुन्छ?`
        : `Are you sure you want to rollback ${selectedMigrations.length} selected migration(s)?`,
      isNe ? 'रोलब्याक गर्नुहोस्' : 'Rollback',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setMigrationRunning(true);
    setConsoleOutput(
      isNe
        ? `${selectedMigrations.length} वटा माइग्रेसन रोलब्याक हुँदैछ...\n`
        : `Rolling back ${selectedMigrations.length} selected migration(s)...\n`
    );
    try {
      const res = await api.admin.system.migrations.rollback(token, { files: selectedMigrations });
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      setSelectedMigrations([]);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रोलब्याक असफल भयो।' : 'Rollback failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  async function handleRefreshSelected() {
    if (selectedMigrations.length === 0) return;
    const confirmed = await alertModal.confirm(
      isNe ? 'छानिएका माइग्रेसनहरू रिफ्रेस गर्ने?' : 'Re-run Selected Migrations?',
      isNe
        ? `यसले छानिएका ${selectedMigrations.length} माइग्रेसनहरूलाई पहिला Rollback र त्यसपछि Fresh Migrate गर्नेछ। जारी राख्ने?`
        : `This will rollback and re-run all ${selectedMigrations.length} selected migration(s). Proceed?`,
      isNe ? 'रिफ्रेस गर्नुहोस्' : 'Re-run',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setMigrationRunning(true);
    setConsoleOutput(
      isNe
        ? `${selectedMigrations.length} वटा माइग्रेसन रिफ्रेस हुँदैछ...\n`
        : `Refreshing ${selectedMigrations.length} selected migration(s)...\n`
    );
    try {
      const res = await api.admin.system.migrations.refresh(token, selectedMigrations);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
      setSelectedMigrations([]);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रिफ्रेस असफल भयो।' : 'Refresh failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  function toggleSelectMigration(filename: string) {
    setSelectedMigrations((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  }

  function toggleSelectAllMigrations() {
    if (selectedMigrations.length === migrations.length) {
      setSelectedMigrations([]);
    } else {
      setSelectedMigrations(migrations.map((m) => m.filename));
    }
  }

  async function handleRunSeeders() {
    const confirmed = await alertModal.confirm(
      isNe ? 'डेटाबेस सिडर चलाउने?' : 'Run Database Seeders?',
      isNe
        ? 'यसले पूर्वनिर्धारित कागजात, टेम्प्लेट र व्यवस्थापक डेटा रिफ्रेस गर्नेछ।'
        : 'This will seed initial documents, categories, templates, and admin data.',
      isNe ? 'सिड गर्नुहोस्' : 'Run Seeder',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setMigrationRunning(true);
    setConsoleOutput(isNe ? 'सिडर चल्दैछ...\n' : 'Running database seeders...\n');
    try {
      const res = await api.admin.system.migrations.seed(token);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'सिडर असफल भयो।' : 'Seeder failed.'));
    } finally {
      setMigrationRunning(false);
    }
  }

  // ─── Cache Handlers ────────────────────────────────────────────────────────

  async function handleClearCache(type: 'all' | 'config' | 'route' | 'view' | 'app') {
    setClearingCache(type);
    setConsoleOutput(isNe ? `क्यास (${type}) खाली गरिँदैछ...\n` : `Clearing ${type} cache...\n`);
    try {
      const res = await api.admin.system.cache.clear(token, type);
      setConsoleOutput(res.output || res.message);
      toast.success(res.message);
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'क्यास खाली गर्न असफल भयो।' : 'Failed to clear cache.'));
    } finally {
      setClearingCache(null);
    }
  }

  // ─── Backup Handlers ───────────────────────────────────────────────────────

  async function handleCreateBackup() {
    setCreatingBackup(true);
    setConsoleOutput(isNe ? 'पूर्ण डेटाबेस ब्याकअप तयार हुँदैछ...\n' : 'Creating full database backup...\n');
    try {
      const res = await api.admin.system.backups.create(token);
      const backup = (res as any)?.data || res;
      setConsoleOutput(
        `✓ ${(res as any)?.message || 'Database backup created successfully.'}\nFile: ${backup?.filename || '—'}\nSize: ${backup?.size_human || '—'}\nTime: ${backup?.created_at || '—'}`
      );
      toast.success((res as any)?.message || (isNe ? 'ब्याकअप सफलतापूर्वक सुरक्षित भयो!' : 'Backup created successfully!'));
      loadBackups();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'ब्याकअप असफल भयो।' : 'Backup creation failed.'));
    } finally {
      setCreatingBackup(false);
    }
  }

  async function handleRestoreBackup(filename: string) {
    const confirmed = await alertModal.confirm(
      isNe ? 'डेटाबेस रिस्टोर निश्चित गर्नुहोस्' : 'Confirm Database Restore',
      isNe
        ? `सावधान: ब्याकअप [${filename}] बाट डेटाबेस रिस्टोर गर्दा हालका सबै तालिकाहरू प्रतिस्थापन हुनेछन्। के तपाईं अगाडि बढ्न निश्चित हुनुहुन्छ?`
        : `WARNING: Restoring from [${filename}] will replace current database tables with the backup state. Proceed?`,
      isNe ? 'रिस्टोर गर्नुहोस्' : 'Restore Now',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    setRestoringBackup(filename);
    setConsoleOutput(isNe ? `[${filename}] बाट डेटाबेस रिस्टोर सुरु हुँदैछ...\n` : `Restoring database from [${filename}]...\n`);
    try {
      const res = await api.admin.system.backups.restore(token, filename);
      setConsoleOutput(`✓ ${res.message}`);
      toast.success(res.message);
      loadMigrations();
    } catch (err: any) {
      setConsoleOutput(`ERROR: ${err.message}`);
      toast.error(err.message || (isNe ? 'रिस्टोर असफल भयो।' : 'Restore failed.'));
    } finally {
      setRestoringBackup(null);
    }
  }

  async function handleDeleteBackup(filename: string) {
    const confirmed = await alertModal.confirm(
      isNe ? 'ब्याकअप फाइल मेटाउने?' : 'Delete Backup File?',
      isNe ? `के तपाईं [${filename}] लाई स्थायी रूपमा मेटाउन चाहनुहुन्छ?` : `Permanently delete [${filename}]?`,
      isNe ? 'मेटाउनुहोस्' : 'Delete',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    try {
      const res = await api.admin.system.backups.delete(token, filename);
      toast.success(res.message);
      loadBackups();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'मेटाउन असफल भयो।' : 'Failed to delete backup.'));
    }
  }

  function handleDownloadBackup(filename: string) {
    const url = `http://localhost:8000/api/v1/admin/system/backups/${filename}/download`;
    // Trigger direct download with bearer token via anchor or fetch
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(isNe ? 'डाउनलोड सुरु भयो।' : 'Download started.');
      })
      .catch(() => toast.error(isNe ? 'डाउनलोड असफल भयो।' : 'Download failed.'));
  }

  const ranCount = migrations.filter((m) => m.status === 'Ran').length;
  const pendingCount = migrations.filter((m) => m.status === 'Pending').length;
  const selectedRanCount = migrations.filter(
    (m) => selectedMigrations.includes(m.filename) && m.status === 'Ran'
  ).length;
  const selectedPendingCount = migrations.filter(
    (m) => selectedMigrations.includes(m.filename) && m.status === 'Pending'
  ).length;

  return (
    <AdminShell>
      <div className="w-full space-y-6">
        {/* ─── Header & System Environment Badge ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#123B5D]">
              {isNe ? 'सिस्टम तथा मर्मत हब' : 'System & Maintenance Hub'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'PHP माइग्रेसनहरू, क्यास क्लियरिङ र डेटाबेस ब्याकअप/रिस्टोरको पूर्ण नियन्त्रण केन्द्र'
                : 'Centralized DevOps command center for migrations, cache optimization, and database disaster recovery.'}
            </p>
          </div>

          {/* Quick Environment Badges */}
          {overview && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#123B5D] shadow-2xs font-outfit">
                <Cpu className="h-3.5 w-3.5 text-[#18A999]" />
                <span>PHP {overview.php_version}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#123B5D] shadow-2xs font-outfit">
                <Layers className="h-3.5 w-3.5 text-red-500" />
                <span>Laravel {overview.laravel_version}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#123B5D] shadow-2xs font-outfit">
                <HardDrive className="h-3.5 w-3.5 text-amber-500" />
                <span>{overview.disk_free_space} Free</span>
              </span>
            </div>
          )}
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex flex-wrap gap-2 border-b border-teal-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('migrations')}
            className={`admin-btn flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'migrations'
                ? 'bg-[#123B5D] text-white shadow-xs scale-102'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#123B5D]'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{isNe ? 'PHP माइग्रेसनहरू' : 'PHP Migrations'}</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-900 font-outfit">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cache')}
            className={`admin-btn flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'cache'
                ? 'bg-[#123B5D] text-white shadow-xs scale-102'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#123B5D]'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>{isNe ? 'क्यास व्यवस्थापन' : 'Cache Clearance'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`admin-btn flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-[#123B5D] text-white shadow-xs scale-102'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#123B5D]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isNe ? 'डेटाबेस ब्याकअप र रिस्टोर' : 'Database Backup & Restore'}</span>
            <span className="rounded-full bg-teal-100 px-2 py-0.2 text-[10px] font-bold text-[#18A999] font-outfit">
              {backups.length}
            </span>
          </button>
        </div>

        {/* ─── TAB 1: PHP MIGRATIONS ─── */}
        {activeTab === 'migrations' && (
          <div className="space-y-6 animate-admin-page-in">
            {/* Global Action Bar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'माइग्रेसन स्थिति' : 'Migration Status'}
                  </p>
                  <p className="text-xs text-slate-500 font-outfit">
                    {isNe
                      ? `कुल: ${migrations.length} | सफल: ${ranCount} | बाँकी: ${pendingCount}`
                      : `Total: ${migrations.length} | Executed: ${ranCount} | Pending: ${pendingCount}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunMigrations}
                  disabled={migrationRunning || pendingCount === 0}
                  className="widget-click inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isNe ? 'सबै बाँकी माइग्रेसन चलाउनुहोस्' : 'Run Pending Migrations'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={migrationRunning || ranCount === 0}
                  className="widget-click inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{isNe ? 'पछिल्लो ब्याच रोलब्याक' : 'Rollback Batch'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunSeeders}
                  disabled={migrationRunning}
                  className="widget-click inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{isNe ? 'सिडर चलाउनुहोस् (Seed)' : 'Run Seeders'}</span>
                </button>
              </div>
            </div>

            {/* Floating / Sticky Selected Migration Action Bar */}
            {selectedMigrations.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#18A999] bg-teal-50/95 p-4 shadow-md transition-all animate-admin-page-in">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18A999] text-sm font-bold text-white shadow-xs font-outfit">
                    {selectedMigrations.length}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#123B5D]">
                      {isNe
                        ? `${selectedMigrations.length} वटा माइग्रेसन चयन गरिएको छ`
                        : `${selectedMigrations.length} migration(s) selected`}
                    </p>
                    <p className="text-[11px] text-teal-800">
                      {isNe
                        ? `चयनित सफल (Ran): ${selectedRanCount} | बाँकी (Pending): ${selectedPendingCount}`
                        : `Selected Ran: ${selectedRanCount} | Selected Pending: ${selectedPendingCount}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedPendingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleRunSelected}
                      disabled={migrationRunning}
                      className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isNe ? `चयनित चलाउनुहोस् (${selectedPendingCount})` : `Run Selected (${selectedPendingCount})`}</span>
                    </button>
                  )}

                  {selectedRanCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleRollbackSelected}
                        disabled={migrationRunning}
                        className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{isNe ? `चयनित रोलब्याक (${selectedRanCount})` : `Rollback Selected (${selectedRanCount})`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRefreshSelected}
                        disabled={migrationRunning}
                        className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-xs font-bold text-[#123B5D] transition hover:bg-teal-50 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{isNe ? `चयनित रिफ्रेस (${selectedRanCount})` : `Re-run Selected (${selectedRanCount})`}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedMigrations([])}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    {isNe ? 'चयन हटाउनुहोस्' : 'Deselect All'}
                  </button>
                </div>
              </div>
            )}

            {/* Migrations Table */}
            <div className="overflow-hidden rounded-3xl border border-teal-200/90 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isNe ? 'तालिका तथा माइग्रेसन फाइलहरूको सूची' : 'Database Migrations Ledger'}
                </h3>
                <span className="text-[11px] text-slate-400 font-outfit">
                  {isNe
                    ? 'कुनै एक वा धेरै माइग्रेसन छानेर चलाउन वा रोलब्याक गर्न सकिन्छ'
                    : 'Execute or rollback individually or by multi-selection'}
                </span>
              </div>

              {loadingMigrations ? (
                <div className="p-12 text-center text-xs text-slate-500 font-outfit">Loading migrations...</div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="w-12 px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={toggleSelectAllMigrations}
                            aria-label="Select all migrations"
                            className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all cursor-pointer ${
                              migrations.length > 0 && selectedMigrations.length === migrations.length
                                ? 'border-[#123B5D] bg-[#123B5D] text-white shadow-xs'
                                : selectedMigrations.length > 0
                                ? 'border-[#148C7E] bg-[#148C7E] text-white'
                                : 'border-slate-300 bg-white hover:border-[#148C7E]'
                            }`}
                          >
                            {migrations.length > 0 && selectedMigrations.length === migrations.length && (
                              <Check className="h-3.5 w-3.5 stroke-[3.5] text-white" />
                            )}
                            {selectedMigrations.length > 0 && selectedMigrations.length < migrations.length && (
                              <div className="h-1 w-2.5 rounded-full bg-white" />
                            )}
                          </button>
                        </th>
                        <th className="px-5 py-3">स्थिति (Status)</th>
                        <th className="px-5 py-3">माइग्रेसन नाम (Migration Name)</th>
                        <th className="px-5 py-3">ब्याच (Batch)</th>
                        <th className="px-5 py-3 text-right">कार्यहरू (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {migrations.map((m) => {
                        const isSelected = selectedMigrations.includes(m.filename);
                        const isThisRowOperating = rowOperating === m.filename;

                        return (
                          <tr
                            key={m.name}
                            className={`transition-colors ${
                              isSelected ? 'bg-teal-50/50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectMigration(m.filename)}
                                aria-label={`Select ${m.name}`}
                                className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#123B5D] bg-[#123B5D] text-white shadow-xs scale-105'
                                    : 'border-slate-300 bg-white hover:border-[#148C7E]'
                                }`}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3.5] text-white" />}
                              </button>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {m.status === 'Ran' ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Ran</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-mono text-[12px] font-semibold text-slate-800">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.filename}</div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap font-outfit text-slate-500">
                              {m.batch ? (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                                  Batch {m.batch}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unexecuted</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {m.status === 'Pending' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRunSingle(m.filename)}
                                    disabled={migrationRunning || isThisRowOperating}
                                    title={isNe ? 'यो माइग्रेसन मात्र चलाउनुहोस्' : 'Run this single migration'}
                                    className="widget-click inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    <Play className={`h-3 w-3 fill-current ${isThisRowOperating ? 'animate-spin' : ''}`} />
                                    <span>{isNe ? 'चलाउनुहोस्' : 'Run'}</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRollbackSingle(m.filename)}
                                      disabled={migrationRunning || isThisRowOperating}
                                      title={isNe ? 'यो माइग्रेसन रोलब्याक गर्नुहोस्' : 'Rollback this migration'}
                                      className="widget-click inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
                                    >
                                      <RotateCcw className={`h-3 w-3 ${isThisRowOperating ? 'animate-spin' : ''}`} />
                                      <span>{isNe ? 'रोलब्याक' : 'Rollback'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRefreshSingle(m.filename)}
                                      disabled={migrationRunning || isThisRowOperating}
                                      title={isNe ? 'पुन: चलाउनुहोस् (Rollback + Run)' : 'Re-run (Rollback & Run)'}
                                      className="widget-click inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-[11px] font-semibold text-[#148C7E] transition hover:bg-teal-100 disabled:opacity-50"
                                    >
                                      <RefreshCw className={`h-3 w-3 ${isThisRowOperating ? 'animate-spin' : ''}`} />
                                      <span>{isNe ? 'रिफ्रेस' : 'Re-run'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
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
        )}

        {/* ─── TAB 2: CACHE CLEARANCE ─── */}
        {activeTab === 'cache' && (
          <div className="space-y-6 animate-admin-page-in">
            {/* Quick Optimize Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#123B5D] to-[#0E2E4A] p-6 sm:p-8 text-white shadow-xl">
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18A999] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  <Zap className="h-3.5 w-3.5" />
                  <span>One-Click Full Clear</span>
                </span>
                <h3 className="mt-3 text-xl font-bold sm:text-2xl">
                  {isNe ? 'सबै क्यास एकैपटक खाली गर्नुहोस्' : 'Purge All System Caches'}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {isNe
                    ? 'यसले कन्फिग, रुट, भ्यू र एप्लिकेसन क्यासहरू तत्काल खाली गरी नयाँ सेटिङहरू लागू गर्दछ।'
                    : 'Runs optimize:clear to reset route, config, view, and compiled application caches in a single action.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleClearCache('all')}
                  disabled={clearingCache !== null}
                  className="mt-5 btn-shimmer widget-click inline-flex items-center gap-2 rounded-xl bg-[#18A999] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#148C7E] disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${clearingCache === 'all' ? 'animate-spin' : ''}`} />
                  <span>{isNe ? 'सबै क्यास सफा गर्नुहोस् (optimize:clear)' : 'Clear All Caches Now'}</span>
                </button>
              </div>
            </div>

            {/* Granular Cache Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Config Cache */}
              <div className="rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg mb-3">
                    ⚙️
                  </div>
                  <h4 className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'कन्फिग क्यास' : 'Config Cache'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {isNe ? '.env र config फाइलका नयाँ सेटिङहरू रिलोड गर्छ।' : 'Clears compiled config files.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('config')}
                  disabled={clearingCache !== null}
                  className="mt-4 widget-click rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#18A999] hover:text-white hover:border-[#18A999]"
                >
                  {clearingCache === 'config' ? 'Clearing...' : 'Clear Config'}
                </button>
              </div>

              {/* Route Cache */}
              <div className="rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-lg mb-3">
                    🛣️
                  </div>
                  <h4 className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'रुट क्यास' : 'Route Cache'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {isNe ? 'नयाँ API रुट र कन्ट्रोलरहरू दर्ता गर्छ।' : 'Clears registered route caches.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('route')}
                  disabled={clearingCache !== null}
                  className="mt-4 widget-click rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#18A999] hover:text-white hover:border-[#18A999]"
                >
                  {clearingCache === 'route' ? 'Clearing...' : 'Clear Routes'}
                </button>
              </div>

              {/* View Cache */}
              <div className="rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg mb-3">
                    👁️
                  </div>
                  <h4 className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'भ्यू / ब्लेड क्यास' : 'View / Blade Cache'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {isNe ? 'कम्पाइल भएका ब्लेड टेम्प्लेट सफा गर्छ।' : 'Clears compiled Blade views.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('view')}
                  disabled={clearingCache !== null}
                  className="mt-4 widget-click rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#18A999] hover:text-white hover:border-[#18A999]"
                >
                  {clearingCache === 'view' ? 'Clearing...' : 'Clear Views'}
                </button>
              </div>

              {/* Application Cache */}
              <div className="rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-lg mb-3">
                    📦
                  </div>
                  <h4 className="text-sm font-bold text-[#123B5D]">
                    {isNe ? 'डेटा क्यास' : 'Application Cache'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {isNe ? 'डाटाबेस क्वेरी र अस्थायी कुञ्जीहरू सफा गर्छ।' : 'Clears application key-value cache.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('app')}
                  disabled={clearingCache !== null}
                  className="mt-4 widget-click rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#18A999] hover:text-white hover:border-[#18A999]"
                >
                  {clearingCache === 'app' ? 'Clearing...' : 'Clear App Cache'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DATABASE BACKUP & RESTORE ─── */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-admin-page-in">
            {/* Action Bar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-teal-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#123B5D]">
                  {isNe ? 'डेटाबेस ब्याकअप भण्डारण' : 'Database Backups Repository'}
                </p>
                <p className="text-xs text-slate-500 font-outfit">
                  {isNe
                    ? `कुल ब्याकअपहरू: ${backups.length} फाइलहरू (भण्डारण: storage/app/backups)`
                    : `Total Backups: ${backups.length} file(s) available`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="widget-click inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0E2E4A] disabled:opacity-50"
              >
                <Database className={`h-4 w-4 ${creatingBackup ? 'animate-spin' : ''}`} />
                <span>{creatingBackup ? 'ब्याकअप बन्दैछ...' : isNe ? 'नयाँ ब्याकअप लिनुहोस्' : 'Create Backup Now'}</span>
              </button>
            </div>

            {/* Backups Table */}
            <div className="overflow-hidden rounded-3xl border border-teal-200/90 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isNe ? 'उपलब्ध SQL ब्याकअप फाइलहरू' : 'Available SQL Snapshot Backups'}
                </h3>
              </div>

              {loadingBackups ? (
                <div className="p-12 text-center text-xs text-slate-500 font-outfit">Loading backups...</div>
              ) : backups.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  {isNe ? 'अहिलेसम्म कुनै ब्याकअप सिर्जना गरिएको छैन।' : 'No database backups created yet.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-6 py-3">फाइलको नाम (File Name)</th>
                        <th className="px-6 py-3">साइज (Size)</th>
                        <th className="px-6 py-3">सिर्जना मिति (Created At)</th>
                        <th className="px-6 py-3 text-right">कार्यहरू (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backups.map((b) => (
                        <tr key={b.filename} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-[12px] font-bold text-[#123B5D]">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-[#18A999]" />
                              <span>{b.filename}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-outfit text-slate-600">
                            {b.size_human}
                          </td>
                          <td className="px-6 py-3.5 font-outfit text-slate-500">
                            {b.created_at}
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap space-x-2">
                            {/* Download */}
                            <button
                              type="button"
                              onClick={() => handleDownloadBackup(b.filename)}
                              className="widget-click inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white hover:border-[#18A999] hover:text-[#18A999]"
                            >
                              <Download className="h-3 w-3" />
                              <span>{isNe ? 'डाउनलोड' : 'Download'}</span>
                            </button>

                            {/* Restore */}
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(b.filename)}
                              disabled={restoringBackup !== null}
                              className="widget-click inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <RotateCcw className={`h-3 w-3 ${restoringBackup === b.filename ? 'animate-spin' : ''}`} />
                              <span>{restoringBackup === b.filename ? 'Restoring...' : isNe ? 'रिस्टोर' : 'Restore'}</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBackup(b.filename)}
                              className="widget-click inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
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

        {/* ─── Real-Time Live Console Terminal ─── */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#18A999]" />
              <span className="text-xs font-bold font-mono tracking-wider text-slate-300">
                LIVE ARTISAN CONSOLE
              </span>
            </div>
            {consoleOutput && (
              <button
                type="button"
                onClick={() => setConsoleOutput('')}
                className="text-[11px] font-mono text-slate-400 hover:text-white transition"
              >
                Clear Console
              </button>
            )}
          </div>
          <div className="p-5 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-all">
            {consoleOutput || (
              <span className="text-slate-600">
                $ Ready. Execute any migration, cache clear, or backup operation above to view real-time artisan output here...
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
