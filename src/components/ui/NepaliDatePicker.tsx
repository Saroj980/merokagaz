'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import NepaliDate, { dateConfigMap } from 'nepali-date-converter';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { toNepaliDigits, toEnglishDigits } from '@/lib/nepaliDate';

export interface NepaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  useNepaliDigits?: boolean;
}

const MONTH_NAMES_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
];

const MONTH_NAMES_EN = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

const MONTH_KEYS = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

const WEEKDAY_NAMES_NE = ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'];

export default function NepaliDatePicker({
  value,
  onChange,
  placeholder = 'मिति छान्नुहोस् (उदा: २०७५/०३/१२)',
  disabled = false,
  hasError = false,
  className = '',
  useNepaliDigits = true,
}: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial year, month, date from value or today
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const clean = toEnglishDigits(value.trim()).replace(/[^\d]/g, '-');
    const parts = clean.split('-').filter(Boolean);
    if (parts.length >= 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const d = parseInt(parts[2], 10);
      if (y >= 2000 && y <= 2095 && m >= 0 && m <= 11 && d >= 1 && d <= 32) {
        return { year: y, month: m, date: d };
      }
    }
    return null;
  }, [value]);

  // Today in BS
  const todayBS = useMemo(() => {
    try {
      const now = new NepaliDate();
      return {
        year: now.getYear(),
        month: now.getMonth(),
        date: now.getDate(),
      };
    } catch {
      return { year: 2083, month: 5, date: 28 };
    }
  }, []);

  // Currently viewed Year & Month in picker
  const [viewYear, setViewYear] = useState<number>(parsedValue?.year || todayBS.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue !== null ? parsedValue.month : todayBS.month);

  // Sync viewed year/month when value changes externally
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [parsedValue]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Calculate days in the current view month and starting weekday
  const { totalDays, startDayOfWeek } = useMemo(() => {
    const safeYear = Math.max(2000, Math.min(2095, viewYear));
    const yearConfig = (dateConfigMap as any)?.[safeYear];
    let days = 30;
    if (yearConfig) {
      const monthKey = MONTH_KEYS[viewMonth] || 'Baisakh';
      days = yearConfig[monthKey] || 30;
    }

    let startDay = 0;
    try {
      const firstDay = new NepaliDate(safeYear, viewMonth, 1);
      startDay = firstDay.getDay(); // 0 = Sunday
    } catch {
      startDay = 0;
    }

    return { totalDays: days, startDayOfWeek: startDay };
  }, [viewYear, viewMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((prev) => Math.max(2000, prev - 1));
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => Math.min(2095, prev + 1));
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (d: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const yyyy = String(viewYear);

    const formatted = `${yyyy}/${mm}/${dd}`;
    const output = useNepaliDigits ? toNepaliDigits(formatted) : formatted;
    onChange(output);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const mm = String(todayBS.month + 1).padStart(2, '0');
    const dd = String(todayBS.date).padStart(2, '0');
    const yyyy = String(todayBS.year);

    const formatted = `${yyyy}/${mm}/${dd}`;
    const output = useNepaliDigits ? toNepaliDigits(formatted) : formatted;
    onChange(output);
    setViewYear(todayBS.year);
    setViewMonth(todayBS.month);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Year choices from 2005 to 2095 BS
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2095; y >= 2005; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Date Input Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-xs transition cursor-pointer ${disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100'
            : isOpen
              ? 'border-[#18A999] bg-white ring-2 ring-[#18A999]/20'
              : hasError
                ? 'border-rose-300 ring-2 ring-rose-100'
                : 'border-slate-200 hover:border-slate-300 hover:bg-white'
          }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <CalendarIcon className="h-4 w-4 text-[#18A999] shrink-0" />
          {value ? (
            <span className="font-mono font-bold text-slate-800 truncate">
              {value}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              title="खाली गर्नुहोस्"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-50 text-[#18A999] font-bold border border-teal-100">
            वि.सं.
          </span>
        </div>
      </div>

      {/* ─── Calendar Dropdown Popup ─── */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-[9999] animate-fadeIn select-none font-outfit">
          {/* Header: Month / Year Selectors and Prev / Next buttons */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="अघिल्लो महिना"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-[#123B5D] focus:border-[#18A999] focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES_NE.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m} ({MONTH_NAMES_EN[idx]})
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-[#123B5D] font-mono focus:border-[#18A999] focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {toNepaliDigits(y)} ({y})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="पछिल्लो महिना"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center text-[10.5px] font-bold text-slate-500">
            {WEEKDAY_NAMES_NE.map((w, idx) => (
              <div
                key={idx}
                className={idx === 6 ? 'text-rose-500 font-extrabold' : 'text-slate-600'}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {/* Blank leading slots */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected =
                parsedValue &&
                parsedValue.year === viewYear &&
                parsedValue.month === viewMonth &&
                parsedValue.date === dayNum;

              const isToday =
                todayBS.year === viewYear &&
                todayBS.month === viewMonth &&
                todayBS.date === dayNum;

              const dayOfWeek = (startDayOfWeek + idx) % 7;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDate(dayNum)}
                  className={`h-8 w-full rounded-xl flex items-center justify-center text-xs font-mono font-bold transition cursor-pointer ${isSelected
                      ? 'bg-[#18A999] text-white shadow-md'
                      : isToday
                        ? 'bg-teal-50 text-[#18A999] border border-teal-300 font-black'
                        : isSaturday
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {toNepaliDigits(dayNum)}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSetToday}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18A999] hover:underline cursor-pointer"
            >
              <Clock className="h-3 w-3" />
              <span>आज: {toNepaliDigits(`${todayBS.year}/${todayBS.month + 1}/${todayBS.date}`)}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              बन्द गर्नुहोस्
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
