'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import LanguageToggle from '@/components/LanguageToggle';
import ScrollReveal from '@/components/ScrollReveal';
import { api, SiteSettings, CmsContent } from '@/lib/api';

/**
 * Public Web Layout
 * Modern, glassmorphic header and professional footer with Language Switcher in top right.
 */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cms, setCms] = useState<CmsContent | null>(null);

  useEffect(() => {
    api.settings.get().then(s => setSettings(s)).catch(() => {});
    api.cms.get().then(c => setCms(c)).catch(() => {});
  }, []);

  const showBanner = settings ? settings.notice_banner_enabled : true;
  const bannerText = settings
    ? (lang === 'ne' ? settings.notice_banner_text_ne : settings.notice_banner_text_en)
    : t('topNoticeText');
  const bannerLink = settings?.notice_banner_link || '/documents';

  return (
    <div className="flex min-h-screen flex-col bg-[#E6F6F3] text-[#17212B]">
      {/* Top Banner Notice */}
      {showBanner && (
        <div className="border-b border-teal-100 bg-white/70 px-4 py-1.5 text-center text-xs font-medium text-[#123B5D] backdrop-blur-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#18A999] px-2 py-0.5 text-[10px] font-semibold text-white">
              {t('topNoticeBadge')}
            </span>
            <span>{bannerText}</span>
            <Link href={bannerLink} className="ml-1 font-semibold text-[#18A999] underline hover:text-[#148C7E]">
              {t('topNoticeLink')}
            </Link>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Brand (Bigger & Crisp) */}
          <Link href="/" className="group flex items-center gap-3 transition">
            <div className="relative h-14 w-48 sm:h-16 sm:w-56">
              <Image
                src="/assets/logo.png"
                alt="Mero Kagaz मेरो कागज"
                fill
                priority
                className="object-contain object-left transition group-hover:scale-102"
              />
            </div>
          </Link>

          {/* Center Navigation Links (Clean translated labels) */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#123B5D]"
            >
              {t('navHome')}
            </Link>
            <Link
              href="/documents?category=ird"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#123B5D]"
            >
              {t('navIrd')}
            </Link>
            <Link
              href="/documents?category=ocr"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#123B5D]"
            >
              {t('navOcr')}
            </Link>
            <Link
              href="/documents"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#123B5D]"
            >
              {t('navAllDocs')}
            </Link>
          </nav>

          {/* Right Action CTAs & Language Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Top Right Language Switcher */}
            <LanguageToggle />

            {/* Quick Search */}
            <Link
              href="/documents"
              className="hidden items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-[#123B5D] sm:inline-flex"
            >
              <span>🔎 {t('navSearch')}</span>
            </Link>

            {/* User Account / Login State */}
            {isLoggedIn ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#123B5D] shadow-xs hover:border-[#18A999] transition-all"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#123B5D] text-white text-[11px] font-black">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:inline max-w-[100px] truncate">{user?.name}</span>
                  <span className="text-slate-400 text-[10px]">▼</span>
                </button>

                {/* Dropdown Menu */}
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#123B5D] truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/user/dashboard"
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>📄</span>
                      <span>{lang === 'ne' ? 'मेरा कागजातहरू' : 'My Documents'}</span>
                    </Link>

                    <Link
                      href="/user/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>👤</span>
                      <span>{lang === 'ne' ? 'मेरो प्रोफाइल तथा सुरक्षा' : 'Profile & Security'}</span>
                    </Link>

                    <Link
                      href="/business/dashboard"
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>🏢</span>
                      <span>{lang === 'ne' ? 'संस्थागत ड्यासबोर्ड' : 'Business Dashboard'}</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50 font-bold transition-colors"
                      >
                        <span>⚡</span>
                        <span>{lang === 'ne' ? 'एडमिन ड्यासबोर्ड' : 'Admin Panel'}</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <span>🚪</span>
                      <span>{lang === 'ne' ? 'लगआउट' : 'Sign out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#123B5D] hover:bg-slate-50 transition-colors shadow-xs"
                >
                  {lang === 'ne' ? 'लगइन' : 'Sign in'}
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 transition-all shadow-xs"
                >
                  {lang === 'ne' ? 'दर्ता गर्नुहोस्' : 'Register'}
                </Link>
              </div>
            )}

            {/* CTA Button */}
            <Link
              href="/documents"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0E2E4A] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#18A999] focus:ring-offset-2 sm:text-sm"
            >
              <span>{t('navGetStarted')}</span>
              <span className="text-[#F4B942]">&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>

      {/* Professional Footer with Animated Reveal & Micro-Interactions */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white relative overflow-hidden">
        {/* Subtle decorative gradient top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#123B5D] via-[#18A999] to-[#F4B942]"></div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Col 1: Brand Info */}
            <ScrollReveal animation="animate-slide-up" delay="delay-100" className="space-y-4 md:col-span-1">
              <div className="relative h-12 w-44 transition-transform duration-300 hover:scale-102">
                <Image
                  src="/assets/logo.png"
                  alt="Mero Kagaz Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {cms ? (lang === 'ne' ? cms.footer.about_ne : cms.footer.about_en) : t('footerAbout')}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/70 px-3 py-1 text-xs text-[#18A999] font-medium shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#18A999] animate-pulse"></span>
                <span>{cms ? (lang === 'ne' ? cms.footer.verified_badge_ne : cms.footer.verified_badge_en) : t('footerVerifiedBadge')}</span>
              </div>
            </ScrollReveal>

            {/* Col 2: Services */}
            <ScrollReveal animation="animate-slide-up" delay="delay-200" className="space-y-3">
              <p className="text-sm font-bold text-[#123B5D]">{t('footerServicesTitle')}</p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <Link
                    href="/documents?category=ird"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'स्थायी लेखा नम्बर (PAN) दर्ता' : 'PAN Registration'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents?category=ird"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'मूल्य अभिवृद्धि कर (VAT) फारम' : 'VAT Registration Forms'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents?category=ocr"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'कम्पनी दर्ता प्रबन्धपत्र (MOA)' : 'Company MOA Templates'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents?category=ocr"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'कम्पनी नियमावली (AOA)' : 'Company AOA Templates'}</span>
                  </Link>
                </li>
              </ul>
            </ScrollReveal>

            {/* Col 3: Quick Links */}
            <ScrollReveal animation="animate-slide-up" delay="delay-300" className="space-y-3">
              <p className="text-sm font-bold text-[#123B5D]">{t('footerLinksTitle')}</p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <Link
                    href="/documents"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{t('navAllDocs')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1.5 hover:text-[#18A999]"
                  >
                    <span className="text-[#18A999]/60 text-[10px]">›</span>
                    <span>{t('footerAdminLink')}</span>
                  </Link>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-300 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'गोपनीयता नीति' : 'Privacy Policy'}</span>
                  </span>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-300 text-[10px]">›</span>
                    <span>{lang === 'ne' ? 'नियम र सर्तहरू' : 'Terms of Service'}</span>
                  </span>
                </li>
              </ul>
            </ScrollReveal>

            {/* Col 4: Payments & Security */}
            <ScrollReveal animation="animate-slide-up" delay="delay-400" className="space-y-3">
              <p className="text-sm font-bold text-[#123B5D]">{t('footerPaymentsTitle')}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'ne'
                  ? 'नेपालका प्रमुख वालेटहरूबाट तत्काल सुरक्षित भुक्तानी गर्नुहोस्:'
                  : 'Pay instantly and securely via leading Nepal digital wallets:'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs transition-all duration-300 hover:scale-105 hover:bg-emerald-100/80 hover:shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>eSewa</span>
                </span>
                <span className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs transition-all duration-300 hover:scale-105 hover:bg-purple-100/80 hover:shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                  <span>Khalti</span>
                </span>
                <span className="widget-click inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs transition-all duration-300 hover:scale-105 hover:bg-blue-100/80 hover:shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  <span>ConnectIPS</span>
                </span>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal animation="animate-fade-in" delay="delay-200">
            <div className="mt-10 flex flex-col items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row gap-3">
              <p>© {new Date().getFullYear()} <strong className="font-semibold text-slate-700">{settings?.company_name || 'Dig Nepal Technologies Pvt. Ltd.'}</strong> ({settings?.site_name || 'मेरो कागज'}). {t('footerCopyright')}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-outfit text-[11px]">
                {settings?.contact_phones && settings.contact_phones.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <span>{settings.contact_phones.join(' / ')}</span>
                  </div>
                )}
                {settings?.contact_emails && settings.contact_emails.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">✉️</span>
                    <a href={`mailto:${settings.contact_emails[0]}`} className="hover:text-[#18A999] transition underline-offset-2 hover:underline">
                      {settings.contact_emails.join(', ')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  );
}
