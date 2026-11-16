'use client';

import { useLanguage } from '@/lib/i18n';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200/90 bg-white/90 p-1 text-xs font-semibold shadow-xs backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setLang('ne')}
        aria-label="नेपाली भाषा"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all ${
          lang === 'ne'
            ? 'bg-[#123B5D] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#123B5D]'
        }`}
      >
        <span>🇳🇵</span>
        <span>नेपाली</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-label="English language"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all ${
          lang === 'en'
            ? 'bg-[#123B5D] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#123B5D]'
        }`}
      >
        <span>🇬🇧</span>
        <span>English</span>
      </button>
    </div>
  );
}
