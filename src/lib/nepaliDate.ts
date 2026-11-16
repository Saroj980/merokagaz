/**
 * Nepali Date (Bikram Sambat) Utility powered by nepali-date-converter
 * https://www.npmjs.com/package/nepali-date-converter
 */

import NepaliDate from 'nepali-date-converter';

export { NepaliDate };

// Number mapping to Nepali Unicode digits
export function toNepaliDigits(num: number | string): string {
  const nepaliNumbers = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, (digit) => nepaliNumbers[parseInt(digit, 10)]);
}

// Convert Devanagari numbers to standard ASCII digits
export function toEnglishDigits(str: string): string {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return String(str).replace(/[०-९]/g, (char) => map[char] || char);
}

/**
 * Helper to ensure string dates are parsed as standard JS Date objects
 * so nepali-date-converter correctly converts from Gregorian (AD) to Bikram Sambat (BS).
 */
export function toGregorianJsDate(date?: Date | string | number): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    // If format is YYYY-MM-DD, parse year, month, day explicitly at noon UTC/local to avoid timezone shifts
    const parts = date.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && parts[0] > 1900 && parts[0] < 2100) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }
  return new Date(date);
}

/**
 * Creates or wraps a NepaliDate instance
 */
export function getNepaliDate(date?: Date | string | number): NepaliDate {
  if (!date) {
    return new NepaliDate();
  }
  return new NepaliDate(date);
}

/**
 * Returns today's formatted Nepali and English date representation using nepali-date-converter
 * 
 * - When lang is 'ne': 'बुधबार, १४ आश्विन २०८३'
 * - When lang is 'en': 'Wednesday, 30 Sep 2026 (14 Aswin 2083 B.S.)'
 */
export function getTodayFormatted(lang: 'ne' | 'en' = 'en'): string {
  try {
    const today = new Date();
    const bsDate = new NepaliDate(today);

    if (lang === 'ne') {
      // nepali-date-converter format: 'ddd, DD MMMM YYYY' in 'np' gives e.g. 'बुधबार, १४ आश्विन २०८३'
      return bsDate.format('ddd, DD MMMM YYYY', 'np');
    }

    // English view with AD date and BS equivalent
    const enDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    const enDayOfMonth = today.getDate();
    const enAdMonth = today.toLocaleDateString('en-US', { month: 'short' });
    const enAdYear = today.getFullYear();
    const bsFormatted = bsDate.format('DD MMMM YYYY', 'en'); // e.g. "14 Aswin 2083"

    return `${enDay}, ${enDayOfMonth} ${enAdMonth} ${enAdYear} (${bsFormatted} B.S.)`;
  } catch (err) {
    console.error('Error formatting Nepali date:', err);
    return new Date().toLocaleDateString();
  }
}

/**
 * Format any date using nepali-date-converter
 */
export function formatBsDate(
  date: Date | string | number,
  formatString: string = 'YYYY-MM-DD',
  lang: 'ne' | 'en' = 'en'
): string {
  try {
    const jsDate = toGregorianJsDate(date);
    const bsDate = new NepaliDate(jsDate);
    return bsDate.format(formatString, lang === 'ne' ? 'np' : 'en');
  } catch {
    return String(date);
  }
}

/**
 * Detailed timestamp breakdown for Audit Logs: Nepali Date (BS), AD Date, and formatted Time
 */
export function formatAuditTimestamp(
  dateInput: Date | string,
  lang: 'ne' | 'en' = 'en'
): {
  time: string;
  bsDate: string;
  adDate: string;
  fullBs: string;
  fullAd: string;
} {
  try {
    const d = new Date(dateInput);
    const bs = new NepaliDate(d);
    const isNe = lang === 'ne';

    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const bsDate = bs.format('DD MMMM YYYY', isNe ? 'np' : 'en') + (isNe ? '' : ' B.S.');
    const adDate = d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const fullBs = bs.format('ddd, DD MMMM YYYY', isNe ? 'np' : 'en');
    const fullAd = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    return {
      time: isNe ? toNepaliDigits(time) : time,
      bsDate,
      adDate,
      fullBs,
      fullAd,
    };
  } catch {
    return {
      time: String(dateInput),
      bsDate: '',
      adDate: String(dateInput),
      fullBs: '',
      fullAd: String(dateInput),
    };
  }
}

/**
 * Formats a YYYY-MM-DD key into a grouped date header label (Today, Yesterday, or Day Name with BS + AD)
 */
export function getAuditDateGroupLabel(
  dateKey: string,
  lang: 'ne' | 'en' = 'en'
): {
  title: string;
  sub: string;
  isToday: boolean;
  isYesterday: boolean;
} {
  try {
    const parts = dateKey.split('-').map(Number);
    const target = new Date(parts[0], parts[1] - 1, parts[2]);

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestKey = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

    const isNe = lang === 'ne';
    const bs = new NepaliDate(target);
    const bsFormatted = bs.format('DD MMMM YYYY', isNe ? 'np' : 'en') + (isNe ? '' : ' B.S.');
    const adFormatted = target.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const dayName = isNe ? bs.format('ddd', 'np') : target.toLocaleDateString('en-US', { weekday: 'long' });

    if (dateKey === todayKey) {
      return {
        title: isNe ? 'आज' : 'Today',
        sub: `${bsFormatted} (${adFormatted})`,
        isToday: true,
        isYesterday: false,
      };
    }

    if (dateKey === yestKey) {
      return {
        title: isNe ? 'हिजो' : 'Yesterday',
        sub: `${bsFormatted} (${adFormatted})`,
        isToday: false,
        isYesterday: true,
      };
    }

    return {
      title: dayName,
      sub: `${bsFormatted} (${adFormatted})`,
      isToday: false,
      isYesterday: false,
    };
  } catch {
    return {
      title: dateKey,
      sub: '',
      isToday: false,
      isYesterday: false,
    };
  }
}

/**
 * Calculate genuine Bikram Sambat (BS) date boundaries for filter presets.
 * For 'this_month', returns the start of the current BS month (e.g., 1 Aswin 2083) to today in BS.
 * For 'last_month', returns the 1st of the previous BS month (e.g., 1 Bhadra 2083) to the last day of that BS month.
 */
export function resolveBsPresetDateRange(preset: string): {
  startDate: string;
  endDate: string;
  bsSummaryNe: string;
  bsSummaryEn: string;
  monthNameNe: string;
  monthNameEn: string;
} {
  const now = new Date();
  const bsNow = new NepaliDate(now);
  const curY = bsNow.getYear();
  const curM = bsNow.getMonth(); // 0-indexed (0 = Baisakh, 5 = Aswin, etc.)

  if (preset === 'this_month') {
    const startBs = new NepaliDate(curY, curM, 1);
    const formatLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const startStr = formatLocalDate(startBs.toJsDate());
    const todayStr = formatLocalDate(now);

    const mNe = startBs.format('MMMM', 'np');
    const mEn = startBs.format('MMMM', 'en');

    return {
      startDate: startStr,
      endDate: todayStr, // up to today as requested
      bsSummaryNe: `${mNe} १, ${toNepaliDigits(curY)} — ${bsNow.format('MMMM DD, YYYY', 'np')}`,
      bsSummaryEn: `1 ${mEn} ${curY} — ${bsNow.format('DD MMMM YYYY', 'en')} B.S.`,
      monthNameNe: mNe,
      monthNameEn: mEn,
    };
  }

  if (preset === 'last_month') {
    const prevY = curM === 0 ? curY - 1 : curY;
    const prevM = curM === 0 ? 11 : curM - 1;
    const startBs = new NepaliDate(prevY, prevM, 1);
    const thisMBs = new NepaliDate(curY, curM, 1);
    const endAd = new Date(thisMBs.toJsDate().getTime() - 24 * 60 * 60 * 1000);

    const formatLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const mNe = startBs.format('MMMM', 'np');
    const mEn = startBs.format('MMMM', 'en');

    return {
      startDate: formatLocalDate(startBs.toJsDate()),
      endDate: formatLocalDate(endAd),
      bsSummaryNe: `${mNe} १ — मसान्त, ${toNepaliDigits(prevY)}`,
      bsSummaryEn: `1 ${mEn} — End, ${prevY} B.S.`,
      monthNameNe: mNe,
      monthNameEn: mEn,
    };
  }

  // Fallback for other presets
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    startDate: todayStr,
    endDate: todayStr,
    bsSummaryNe: bsNow.format('MMMM DD, YYYY', 'np'),
    bsSummaryEn: `${bsNow.format('DD MMMM YYYY', 'en')} B.S.`,
    monthNameNe: bsNow.format('MMMM', 'np'),
    monthNameEn: bsNow.format('MMMM', 'en'),
  };
}

/**
 * Convert Bikram Sambat date string (YYYY-MM-DD or YYYY/MM/DD) to Gregorian AD (YYYY-MM-DD)
 */
export function bsStringToAdString(bsDateStr: string): string | null {
  try {
    const clean = toEnglishDigits(bsDateStr).trim();
    const parts = clean.split(/[-/]/).map(Number);
    if (parts.length === 3 && parts[0] >= 1990 && parts[0] <= 2110) {
      const year = parts[0];
      const month = Math.max(0, Math.min(11, parts[1] - 1)); // 0-indexed
      const day = Math.max(1, Math.min(32, parts[2]));
      const nepaliDate = new NepaliDate(year, month, day);
      const jsDate = nepaliDate.toJsDate();
      const y = jsDate.getFullYear();
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const d = String(jsDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (_) {}
  return null;
}

/**
 * Convert Gregorian AD date string to Bikram Sambat string (YYYY-MM-DD)
 */
export function adStringToBsString(adDateStr: string): string {
  try {
    const jsDate = toGregorianJsDate(adDateStr);
    const bs = new NepaliDate(jsDate);
    const y = bs.getYear();
    const m = String(bs.getMonth() + 1).padStart(2, '0');
    const d = String(bs.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return adDateStr;
  }
}

/**
 * Format date in Bikram Sambat with prominent Nepali or English BS representation
 */
export function formatBsDisplay(
  date: Date | string | number,
  lang: 'ne' | 'en' = 'ne'
): {
  bsDate: string;
  adDate: string;
  fullBs: string;
} {
  try {
    const jsDate = toGregorianJsDate(date);
    const bs = new NepaliDate(jsDate);
    const isNe = lang === 'ne';

    const bsDate = bs.format('YYYY-MM-DD', isNe ? 'np' : 'en');
    const fullBs = bs.format('DD MMMM YYYY', isNe ? 'np' : 'en') + (isNe ? '' : ' B.S.');
    const adDate = jsDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return { bsDate, adDate, fullBs };
  } catch {
    return { bsDate: String(date), adDate: String(date), fullBs: String(date) };
  }
}


