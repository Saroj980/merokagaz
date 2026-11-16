'use client';

import React, { useState } from 'react';
import { X, Delete, Space, Check } from 'lucide-react';

export interface NepaliVirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClear: () => void;
}

// 1. Full Consonants (पूर्ण व्यञ्जन वर्णहरू)
const FULL_CONSONANTS = [
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह',
  'क्ष', 'त्र', 'ज्ञ', 'श्र'
];

// 2. Half Consonants (आधा अक्षरहरू - हलन्त लागेका)
const HALF_CONSONANTS = [
  'क्', 'ख्', 'ग्', 'घ्', 'ङ्',
  'च्', 'छ्', 'ज्', 'झ्', 'ञ्',
  'ट्', 'ठ्', 'ड्', 'ढ्', 'ण्',
  'त्', 'थ्', 'द्', 'ध्', 'न्',
  'प्', 'फ्', 'ब्', 'भ्', 'म्',
  'य्', 'र्', 'ल्', 'व्',
  'श्', 'ष्', 'स्', 'ह्',
  'क्ष्', 'त्र्', 'ज्ञ्', 'श्र्'
];

// 3. Common Conjuncts & Ligatures (प्रचलित संयुक्ताक्षरहरू)
const CONJUNCTS = [
  'क्त', 'क्ष', 'त्र', 'ज्ञ', 'श्र',
  'द्व', 'द्य', 'द्ध', 'द्भ', 'ह्न',
  'ष्ट', 'ष्ठ', 'ष्ण', 'ण्ड',
  'न्त', 'न्द', 'न्ध', 'न्न',
  'म्प', 'म्ब', 'म्भ', 'म्म',
  'स्त', 'स्थ', 'स्प', 'स्म', 'स्य',
  'प्र', 'क्र', 'ग्र', 'द्र', 'ह्र'
];

// 4. Matras & Diacritics (मात्रा तथा चिन्हहरू)
const MATRAS = [
  { label: '् (हलन्त)', char: '्', desc: 'आधा अक्षर बनाउने' },
  { label: 'ा (आकार)', char: 'ा', desc: 'का, मा' },
  { label: 'ि (ह्रस्व इकार)', char: 'ि', desc: 'कि, मि' },
  { label: 'ी (दीर्घ ईकार)', char: 'ी', desc: 'की, मी' },
  { label: 'ु (ह्रस्व उकार)', char: 'ु', desc: 'कु, मु' },
  { label: 'ू (दीर्घ ऊकार)', char: 'ू', desc: 'कू, मू' },
  { label: 'ृ (ऋकार)', char: 'ृ', desc: 'कृ, मृ' },
  { label: 'े (एकार)', char: 'े', desc: 'के, मे' },
  { label: 'ै (ऐकार)', char: 'ै', desc: 'कै, मै' },
  { label: 'ो (ओकार)', char: 'ो', desc: 'को, मो' },
  { label: 'ौ (औकार)', char: 'ौ', desc: 'कौ, मौ' },
  { label: 'ं (अनुस्वार)', char: 'ं', desc: 'शिरविन्दु' },
  { label: 'ँ (चन्द्रविन्दु)', char: 'ँ', desc: 'गाउँ' },
  { label: 'ः (विसर्ग)', char: 'ः', desc: 'दुःख' },
  { label: '्र (रकार)', char: '्र', desc: 'प्र, क्र' },
  { label: 'र् (रेफ)', char: 'र्', desc: 'कर्म, धर्म' },
  { label: '। (पूर्णविराम)', char: '।', desc: 'दण्डी' },
  { label: '?', char: '?', desc: 'प्रश्न' }
];

// 5. Independent Vowels (स्वर वर्णहरू)
const VOWELS = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'
];

// 6. Nepali Digits (नेपाली अंकहरू)
const NUMBERS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export default function NepaliVirtualKeyboard({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
  onSpace,
  onClear,
}: NepaliVirtualKeyboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'half' | 'consonants' | 'matras' | 'vowels' | 'numbers'>('all');

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 top-full mt-2 z-50 w-full max-w-2xl rounded-2xl border border-teal-200 bg-white/98 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D]">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-100 text-[#148C7E] text-[10px]">
            ⌨️
          </span>
          <span>नेपाली अन-स्क्रिन किबोर्ड</span>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#18A999] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            सबै
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('half')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'half'
                ? 'bg-[#18A999] text-white shadow-2xs font-bold'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            आधा अक्षर (क्, ख्...)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consonants')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'consonants'
                ? 'bg-[#18A999] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            व्यञ्जन (क-ज्ञ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matras')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'matras'
                ? 'bg-[#18A999] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            मात्रा/हलन्त
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vowels')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'vowels'
                ? 'bg-[#18A999] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            स्वर (अ-औ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('numbers')}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
              activeTab === 'numbers'
                ? 'bg-[#18A999] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            अंक
          </button>
          <button
            type="button"
            onClick={onClose}
            title="किबोर्ड बन्द गर्नुहोस्"
            className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
        {/* ── 1. HALF CONSONANTS SECTION (आधा अक्षरहरू: क्, ख्, ग्, त्, म्...) ── */}
        {(activeTab === 'all' || activeTab === 'half') && (
          <div className="rounded-xl bg-emerald-50/50 p-2 border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 flex items-center justify-between mb-1.5">
              <span>आधा अक्षरहरू (Half Consonants - सिधै आधा अक्षर थप्न थिच्नुहोस्):</span>
              <span className="text-[9px] text-emerald-600 font-normal">उदा: क् + त = क्त, स् + त = स्त</span>
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
              {HALF_CONSONANTS.map((char, idx) => (
                <button
                  key={`half-${char}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(char);
                  }}
                  className="flex items-center justify-center h-8 rounded-lg bg-white border border-emerald-300 font-bold text-xs text-emerald-900 hover:bg-emerald-600 hover:text-white transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Common Ligatures (संयुक्ताक्षरहरू) */}
            <span className="text-[10px] font-bold text-emerald-800 block mt-2.5 mb-1">
              प्रचलित संयुक्ताक्षरहरू (Common Conjuncts):
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
              {CONJUNCTS.map((char, idx) => (
                <button
                  key={`conj-${char}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(char);
                  }}
                  className="flex items-center justify-center h-8 rounded-lg bg-white border border-teal-200 font-semibold text-xs text-[#123B5D] hover:bg-[#148C7E] hover:text-white transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. FULL CONSONANTS (पूर्ण व्यञ्जन वर्णहरू: क-ज्ञ) ── */}
        {(activeTab === 'all' || activeTab === 'consonants') && (
          <div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              पूर्ण व्यञ्जन वर्ण (Full Consonants: क-ज्ञ):
            </span>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1">
              {FULL_CONSONANTS.map((char, idx) => (
                <button
                  key={`full-${char}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(char);
                  }}
                  className="flex items-center justify-center h-8 rounded-lg bg-slate-50 border border-slate-200/90 font-medium text-xs text-slate-800 hover:bg-teal-50 hover:border-teal-300 hover:text-[#148C7E] transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. MATRAS & DIACRITICS (मात्रा तथा हलन्त चिन्हहरू) ── */}
        {(activeTab === 'all' || activeTab === 'matras') && (
          <div>
            <span className="text-[10px] font-bold text-teal-700 block mb-1">
              मात्रा र हलन्त (स्वर चिन्हहरू):
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
              {MATRAS.map((m, idx) => (
                <button
                  key={`matra-${m.label}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(m.char);
                  }}
                  title={m.desc}
                  className="flex flex-col items-center justify-center h-8 rounded-lg bg-teal-50/80 border border-teal-200 font-semibold text-xs text-[#123B5D] hover:bg-[#18A999] hover:text-white transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  <span className="text-sm font-bold leading-none">{m.char}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. INDEPENDENT VOWELS (स्वर वर्णहरू: अ-औ) ── */}
        {(activeTab === 'all' || activeTab === 'vowels') && (
          <div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              स्वर वर्ण (अ-औ):
            </span>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1">
              {VOWELS.map((char, idx) => (
                <button
                  key={`vow-${char}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(char);
                  }}
                  className="flex items-center justify-center h-8 rounded-lg bg-amber-50/60 border border-amber-200/70 font-medium text-xs text-amber-900 hover:bg-amber-100 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. NUMBERS (नेपाली अंकहरू: ०-९) ── */}
        {(activeTab === 'all' || activeTab === 'numbers') && (
          <div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              नेपाली अंक (०-९):
            </span>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {NUMBERS.map((char, idx) => (
                <button
                  key={`num-${char}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onKeyPress(char);
                  }}
                  className="flex items-center justify-center h-8 rounded-lg bg-sky-50/70 border border-sky-200/70 font-semibold text-xs text-[#123B5D] hover:bg-sky-100 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Keys Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onBackspace();
            }}
            className="flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition border border-rose-200 cursor-pointer shadow-2xs"
          >
            <Delete className="h-3.5 w-3.5" />
            <span>मेट्नुहोस्</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition border border-slate-200 cursor-pointer shadow-2xs"
          >
            सबै खाली
          </button>
        </div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSpace();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition border border-slate-200 cursor-pointer shadow-2xs"
        >
          <Space className="h-3.5 w-3.5" />
          <span>स्पेस (Space)</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-xl bg-[#148C7E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#11766a] transition cursor-pointer shadow-2xs"
        >
          <Check className="h-3.5 w-3.5" />
          <span>सम्पन्न</span>
        </button>
      </div>
    </div>
  );
}
