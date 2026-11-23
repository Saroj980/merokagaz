'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import LanguageToggle from '@/components/LanguageToggle';
import ScrollReveal from '@/components/ScrollReveal';
import { api, SiteSettings, CmsContent } from '@/lib/api';
import {
  FileText,
  User,
  CreditCard,
  SlidersHorizontal,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { EsewaLogo, KhaltiLogo, ConnectIpsLogo } from '@/components/PaymentLogos';

/**
 * Public Web Layout
 * Modern, glassmorphic header and professional footer with Language Switcher in top right.
 */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cms, setCms] = useState<CmsContent | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.settings.get().then(s => setSettings(s)).catch(() => {});
    api.cms.get().then(c => setCms(c)).catch(() => {});
  }, []);

  const showBanner = Boolean(settings?.notice_banner_enabled);
  const bannerText = settings
    ? (lang === 'ne' ? settings.notice_banner_text_ne : settings.notice_banner_text_en)
    : '';
  const bannerLink = settings?.notice_banner_link || '/documents';

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-x-hidden max-w-full">
      {/* Top Banner Notice - Hidden on mobile, shown on tablet/desktop */}
      <div className="hidden sm:block">
        <div className="h-0.5 w-full bg-gradient-to-r from-[#DC2626] via-[#123B5D] to-[#18A999]"></div>
        <div className="border-b border-slate-200/70 bg-slate-50/90 px-3 py-1.5 text-center text-xs text-slate-700">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#148C7E] shrink-0">
              <ShieldCheck className="h-3 w-3 text-[#148C7E]" />
              <span>{lang === 'ne' ? 'आधिकारिक प्रारूप' : 'Official Portal'}</span>
            </span>
            <span className="text-slate-600 font-medium text-center">
              {lang === 'ne'
                ? 'आन्तरिक राजस्व (IRD), कम्पनी रजिष्ट्रार (OCR) तथा वडा कार्यालय मान्य'
                : 'Statutory document formats accepted across Nepal Government offices'}
            </span>
            <Link href="/documents" className="font-semibold text-[#18A999] hover:underline whitespace-nowrap">
              {lang === 'ne' ? 'हेर्नुहोस् →' : 'Browse →'}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar - Prominent Logo & Essential Clean Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all w-full max-w-full overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 gap-2">
          {/* Prominent, Sharp Brand Logo */}
          <Link href="/" className="group flex items-center transition shrink min-w-0">
            <div className="relative h-10 w-28 xs:w-34 sm:h-14 sm:w-48 md:h-16 md:w-60">
              <Image
                src="/assets/logo.png"
                alt="Mero Kagaz मेरो कागज"
                fill
                priority
                className="object-contain object-left transition duration-200 group-hover:opacity-95"
              />
            </div>
          </Link>

          {/* Center Navigation Links - Important Government Categories */}
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
            <Link
              href="/documents"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#18A999]"
            >
              {lang === 'ne' ? 'सबै कागजातहरू' : 'All Documents'}
            </Link>
            <Link
              href="/documents?category=ocr"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#18A999]"
            >
              {lang === 'ne' ? 'कम्पनी दर्ता (OCR)' : 'Company OCR'}
            </Link>
            <Link
              href="/documents?category=ird"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#18A999]"
            >
              {lang === 'ne' ? 'कर तथा PAN' : 'Tax & PAN'}
            </Link>
            <Link
              href="/documents?category=ward"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#18A999]"
            >
              {lang === 'ne' ? 'वडा तथा सम्झौता' : 'Ward & Deeds'}
            </Link>
            <Link
              href="/#how-it-works"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#18A999]"
            >
              {lang === 'ne' ? 'कसरी काम गर्छ?' : 'How It Works'}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* User Account / Login State for Desktop / Tablet */}
            {isLoggedIn ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs font-bold text-[#123B5D] shadow-xs hover:border-[#18A999] transition-all"
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
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lang === 'ne' ? 'मेरा कागजातहरू' : 'My Documents'}</span>
                    </Link>

                    <Link
                      href="/user/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lang === 'ne' ? 'मेरो प्रोफाइल तथा सुरक्षा' : 'Profile & Security'}</span>
                    </Link>

                    <Link
                      href="/checkout"
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lang === 'ne' ? 'भुक्तानी विवरण' : 'Payments'}</span>
                    </Link>
                  </div>

                  {isAdmin && (
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-[#18A999] hover:bg-teal-50 transition-colors"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
                        <span>{lang === 'ne' ? 'प्रशासन प्यानल' : 'Admin Panel'}</span>
                      </Link>
                    </div>
                  )}

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-600" />
                      <span>{lang === 'ne' ? 'लगआउट गर्नुहोस्' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:text-[#18A999]"
                >
                  {lang === 'ne' ? 'लगइन' : 'Sign In'}
                </Link>
                <Link
                  href="/documents"
                  className="rounded-xl bg-[#18A999] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#148C7E]"
                >
                  {lang === 'ne' ? 'सुरु गर्नुहोस्' : 'Get Started'}
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 bg-white px-4 py-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col space-y-1">
              <Link
                href="/documents"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#18A999] transition"
              >
                {lang === 'ne' ? 'सबै कागजातहरू' : 'All Documents'}
              </Link>
              <Link
                href="/documents?category=ocr"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#18A999] transition"
              >
                {lang === 'ne' ? 'कम्पनी दर्ता (OCR)' : 'Company OCR'}
              </Link>
              <Link
                href="/documents?category=ird"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#18A999] transition"
              >
                {lang === 'ne' ? 'कर तथा PAN' : 'Tax & PAN'}
              </Link>
              <Link
                href="/documents?category=ward"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#18A999] transition"
              >
                {lang === 'ne' ? 'वडा तथा सम्झौता' : 'Ward & Deeds'}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#18A999] transition"
              >
                {lang === 'ne' ? 'कसरी काम गर्छ?' : 'How It Works'}
              </Link>
            </div>

            {/* Mobile Auth Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/user/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#123B5D]"
                  >
                    {lang === 'ne' ? 'मेरा कागजातहरू' : 'My Documents'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600"
                  >
                    {lang === 'ne' ? 'लगआउट' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    {lang === 'ne' ? 'लगइन' : 'Sign In'}
                  </Link>
                  <Link
                    href="/documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl bg-[#18A999] px-3 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    {lang === 'ne' ? 'सुरु गर्नुहोस्' : 'Get Started'}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
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
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <EsewaLogo />
                <KhaltiLogo />
                <ConnectIpsLogo />
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal animation="animate-fade-in" delay="delay-200">
            <div className="mt-10 flex flex-col items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row gap-3">
              <p>© {new Date().getFullYear()} <strong className="font-semibold text-slate-700">{settings?.company_name || 'Dig Nepal Technologies Pvt. Ltd.'}</strong> ({settings?.site_name || 'मेरो कागज'}). {t('footerCopyright')}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-outfit text-[11px]">
                {settings?.contact_phones && settings.contact_phones.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{settings.contact_phones.join(' / ')}</span>
                  </div>
                )}
                {settings?.contact_emails && settings.contact_emails.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400" />
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
