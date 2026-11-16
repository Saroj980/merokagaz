'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { getTodayFormatted } from '@/lib/nepaliDate';
import toast, { alertModal } from '@/lib/toast';

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  icon: string;
  labelNe: string;
  labelEn: string;
}

interface NavGroup {
  id: string;
  titleNe: string;
  titleEn: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    titleNe: 'अवलोकन',
    titleEn: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: '📊', labelNe: 'ड्यासबोर्ड', labelEn: 'Dashboard' },
    ],
  },
  {
    id: 'operations',
    titleNe: 'कागजात तथा सेवाहरू',
    titleEn: 'Services & Operations',
    items: [
      { href: '/admin/users', icon: '👥', labelNe: 'प्रयोगकर्ताहरू', labelEn: 'Users' },
      { href: '/admin/documents', icon: '📄', labelNe: 'कागजातहरू', labelEn: 'Documents' },
      { href: '/admin/templates', icon: '🗂️', labelNe: 'टेम्प्लेटहरू', labelEn: 'Templates' },
      { href: '/admin/orders', icon: '📦', labelNe: 'अर्डरहरू', labelEn: 'Orders' },
      { href: '/admin/payments', icon: '💳', labelNe: 'भुक्तानीहरू', labelEn: 'Payments' },
      { href: '/admin/vault-types', icon: '🗄️', labelNe: 'भल्ट कागजात प्रकार', labelEn: 'Vault Doc Types' },
    ],
  },
  {
    id: 'portal',
    titleNe: 'वेबसाइट तथा सामग्री',
    titleEn: 'Portal & Content',
    items: [
      { href: '/admin/emails', icon: '✉️', labelNe: 'इमेल व्यवस्थापन', labelEn: 'Email Automation' },
      { href: '/admin/cms', icon: '📝', labelNe: 'सामग्री (CMS)', labelEn: 'Website CMS' },
      { href: '/admin/portals-contacts', icon: '🏛️', labelNe: 'सरकारी लिंक र आपतकालीन', labelEn: 'Gov Links & Emergency' },
      { href: '/admin/settings', icon: '⚙️', labelNe: 'साइट सेटिङहरू', labelEn: 'Settings' },
    ],
  },
  {
    id: 'security_system',
    titleNe: 'सुरक्षा तथा प्रणाली',
    titleEn: 'Security & DevOps',
    items: [
      { href: '/admin/audit-logs', icon: '🔍', labelNe: 'अडिट लगहरू', labelEn: 'Audit Logs' },
      { href: '/admin/system', icon: '🛠️', labelNe: 'सिस्टम तथा मर्मत', labelEn: 'System & Maintenance' },
    ],
  },
];

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentDate(getTodayFormatted(lang));
  }, [lang]);

  async function handleSignOut() {
    const confirmed = await alertModal.confirm(
      isNe ? 'के तपाईं साइन आउट गर्न चाहनुहुन्छ?' : 'Do you want to sign out?',
      isNe ? 'तपाईंको सत्र समाप्त हुनेछ।' : 'Your administrator session will end.',
      isNe ? 'साइन आउट' : 'Sign Out',
      isNe ? 'रद्द' : 'Cancel'
    );

    if (confirmed) {
      localStorage.removeItem('mk_admin_token');
      toast.success(isNe ? 'सफलतापूर्वक साइन आउट भयो।' : 'Signed out successfully.');
      router.push('/admin/login');
    }
  }

  return (
    <div className="flex min-h-screen bg-[#E6F6F3] text-[#17212B]">
      {/* ─── 1. Sidebar with Light Accent Background & Nature-wise Grouping ─── */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-teal-200/70 bg-[#E6F6F3] p-4 shadow-xs">
        {/* Top: Logo & Brand Badge */}
        <div className="shrink-0 px-1 pb-3">
          <Link href="/admin/dashboard" className="block">
            <div className="relative h-12 w-44">
              <Image
                src="/assets/logo.png"
                alt="Mero Kagaz"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#123B5D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18A999] animate-pulse"></span>
              <span>{isNe ? 'प्रशासक नियन्त्रण' : 'Admin Control Center'}</span>
            </div>
          </Link>
        </div>

        {/* Scrollable Nature-wise Navigation Groups */}
        <nav className="flex-1 overflow-y-auto pr-1 space-y-4 py-1.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              {/* Group Header Label */}
              <div className="flex items-center gap-2 px-3 pt-1 pb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
                  {isNe ? group.titleNe : group.titleEn}
                </span>
                <span className="h-px flex-1 bg-teal-200/60"></span>
              </div>

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                  const label = isNe ? item.labelNe : item.labelEn;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group admin-nav-item flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold relative overflow-hidden transition-all duration-200 ${
                        isActive
                          ? 'bg-[#123B5D] text-white shadow-xs font-bold pl-3.5'
                          : 'text-slate-700 hover:bg-white/80 hover:text-[#123B5D]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#18A999] shadow-xs"></span>
                      )}
                      <span className="text-base transition-transform duration-200 group-hover:scale-115">
                        {item.icon}
                      </span>
                      <span className="transition-transform duration-200 truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Session Info & Sign Out */}
        <div className="shrink-0 border-t border-teal-200/70 pt-3">
          <div className="mb-2.5 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#123B5D] text-white text-xs font-bold shadow-xs transition-transform duration-200 hover:scale-105">
              AD
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-[#123B5D]">Administrator</p>
              <p className="truncate text-[10px] text-slate-500 font-outfit">admin@merokagaz.com</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="admin-btn flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
          >
            <span className="transition-transform duration-200 group-hover:rotate-12">🚪</span>
            <span>{isNe ? 'साइन आउट गर्नुहोस्' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ─── 2. Main Content Wrapper ─── */}
      <div className="flex flex-1 flex-col min-h-screen overflow-x-hidden">
        {/* ─── Header Bar with Search & Standard Options ─── */}
        <header className="sticky top-0 z-40 flex h-18 items-center justify-between border-b border-teal-200/70 bg-white/90 px-6 backdrop-blur-md">
          {/* Left: Search Bar */}
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative flex w-full items-center group">
              <span className="absolute left-3.5 text-slate-400 text-sm transition-transform duration-200 group-focus-within:scale-110 group-focus-within:text-[#18A999]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isNe ? 'कागजात, अर्डर वा ग्राहक खोज्नुहोस्...' : 'Search orders, documents, templates...'}
                className="w-full rounded-xl border border-slate-200 bg-[#F7F9FC] py-2 pl-9 pr-4 text-xs font-outfit text-[#17212B] placeholder-slate-400 transition-all duration-200 focus:border-[#18A999] focus:bg-white focus:ring-3 focus:ring-[#18A999]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Standard Admin Controls & Nepali Date */}
          <div className="flex items-center gap-4">
            {/* Nepali / Today's Date Badge */}
            {currentDate && (
              <div className="hidden items-center gap-2 rounded-xl border border-teal-100 bg-[#E6F6F3] px-3.5 py-1.5 text-xs font-semibold text-[#123B5D] md:inline-flex shadow-2xs transition-transform duration-200 hover:scale-102">
                <span className="text-sm">📅</span>
                <span>{currentDate}</span>
              </div>
            )}

            {/* Notification Bell with Wiggle Effect */}
            <button
              type="button"
              onClick={() => toast.info(isNe ? 'कुनै नयाँ सूचना छैन।' : 'No unread notifications.')}
              aria-label="Notifications"
              className="bell-hover admin-btn relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#123B5D] hover:border-teal-200"
            >
              <span className="bell-icon text-sm">🔔</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#18A999] animate-pulse"></span>
            </button>

            {/* Language Switcher */}
            <LanguageToggle />

            {/* View Live Site Link */}
            <Link
              href="/"
              target="_blank"
              className="admin-btn hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#123B5D] transition hover:bg-slate-50 hover:border-teal-300 lg:inline-flex"
            >
              <span className="transition-transform duration-200 group-hover:rotate-12">🌐</span>
              <span>{isNe ? 'वेबसाइट हेर्नुहोस्' : 'Visit Site'}</span>
            </Link>
          </div>
        </header>

        {/* ─── Main Content Canvas with Route Entrance Animation (pb-32 ensures ample breathing room above the fixed footer) ─── */}
        <main key={pathname} className="flex-1 p-6 md:p-8 pb-32 animate-admin-page-in">{children}</main>

        {/* ─── Admin Fixed Footer with Dig Nepal Technologies Pvt. Ltd. Copyright ─── */}
        <footer className="fixed bottom-0 left-0 md:left-64 right-0 z-30 border-t border-teal-200/80 bg-white/95 px-6 py-2.5 backdrop-blur-md font-outfit shadow-sm">
          <div className="mx-auto flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#123B5D]">मेरो कागज</span>
              <span className="text-slate-300">•</span>
              <span>
                © {new Date().getFullYear()} <strong className="font-semibold text-slate-700">Dig Nepal Technologies Pvt. Ltd.</strong> {isNe ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="font-outfit font-medium">v1.0.0</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 font-outfit">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700 font-medium">System Online</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
