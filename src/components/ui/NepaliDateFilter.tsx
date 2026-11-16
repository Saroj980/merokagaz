'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import NepaliDate from 'nepali-date-converter';
import { toNepaliDigits, resolveBsPresetDateRange } from '@/lib/nepaliDate';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateFilterValue {
  preset: DatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  labelNe: string;
  labelEn: string;
  bsSummary?: string;
}

interface NepaliDateFilterProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
  className?: string;
}

const PRESETS: Array<{ id: DatePreset; labelNe: string; labelEn: string }> = [
  { id: 'today', labelNe: 'आज', labelEn: 'Today' },
  { id: 'yesterday', labelNe: 'हिजो', labelEn: 'Yesterday' },
  { id: 'this_week', labelNe: 'यो हप्ता', labelEn: 'This Week' },
  { id: 'last_week', labelNe: 'गएको हप्ता', labelEn: 'Last Week' },
  { id: 'this_month', labelNe: 'यो महिना', labelEn: 'This Month' },
  { id: 'last_month', labelNe: 'गएको महिना', labelEn: 'Last Month' },
  { id: 'custom', labelNe: 'आफूले छानेको मिति', labelEn: 'Custom Date Range' },
];

export function NepaliDateFilter({ value, onChange, className = '' }: NepaliDateFilterProps) {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');

  const activePreset = PRESETS.find((p) => p.id === value.preset) || PRESETS[4];

  // Helper to format a date to Bikram Sambat representation
  const formatBsDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && parts[0] > 1900) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const bs = new NepaliDate(d);
        return isNe
          ? bs.format('YYYY MMMM DD', 'np')
          : `${bs.format('YYYY MMMM DD', 'en')} B.S.`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      // Keep menu open for date input
      return;
    }

    const item = PRESETS.find((p) => p.id === preset)!;

    if (preset === 'this_month' || preset === 'last_month') {
      const bsRange = resolveBsPresetDateRange(preset);
      onChange({
        preset,
        startDate: bsRange.startDate,
        endDate: bsRange.endDate,
        labelNe: `${item.labelNe} (${bsRange.monthNameNe})`,
        labelEn: `${item.labelEn} (${bsRange.monthNameEn})`,
        bsSummary: isNe ? bsRange.bsSummaryNe : bsRange.bsSummaryEn,
      });
    } else {
      onChange({
        preset,
        labelNe: item.labelNe,
        labelEn: item.labelEn,
      });
    }
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    const item = PRESETS.find((p) => p.id === 'custom')!;
    const bsSummary = `${formatBsDisplay(customStart)} — ${formatBsDisplay(customEnd)}`;

    onChange({
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd,
      labelNe: item.labelNe,
      labelEn: item.labelEn,
      bsSummary,
    });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#18A999]/20"
      >
        <Calendar className="h-4 w-4 text-[#18A999]" />
        <span>{isNe ? activePreset.labelNe : activePreset.labelEn}</span>
        {value.preset === 'custom' && value.bsSummary && (
          <span className="hidden sm:inline font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {value.bsSummary}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5 animate-fade-in">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span>{isNe ? 'मिति फिल्टर (नेपाली क्यालेन्डर)' : 'Date Filter (B.S. Calendar)'}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Standard Presets List */}
          <div className="mt-2 space-y-1">
            {PRESETS.map((preset) => {
              const isSelected = value.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium text-left transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-[#123B5D] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{isNe ? preset.labelNe : preset.labelEn}</span>
                    <span className="text-[10px] text-slate-400">
                      ({isNe ? preset.labelEn : preset.labelNe})
                    </span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker Block */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="text-[11px] font-bold text-slate-700 px-1 mb-2">
              {isNe ? 'आफूले छानेको मिति दायरा (Gregorian / AD)' : 'Custom Range'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                  {isNe ? 'सुरु मिति' : 'From'}
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-[#18A999] focus:outline-hidden"
                />
                {customStart && (
                  <div className="text-[10px] text-[#18A999] font-medium mt-1 truncate">
                    {formatBsDisplay(customStart)}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                  {isNe ? 'अन्त्य मिति' : 'To'}
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-[#18A999] focus:outline-hidden"
                />
                {customEnd && (
                  <div className="text-[10px] text-[#18A999] font-medium mt-1 truncate">
                    {formatBsDisplay(customEnd)}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
              className="mt-2.5 w-full rounded-xl bg-[#123B5D] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0E2E4A] disabled:opacity-50 transition-colors"
            >
              {isNe ? 'मिति लागु गर्नुहोस्' : 'Apply Range'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
