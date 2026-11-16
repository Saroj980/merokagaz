/**
 * Utility to encode and decode user IDs into branded, non-enumerable public codes (e.g. MKU-4D6A-32)
 * so that sequential numeric user IDs are not openly exposed in browser URLs.
 */

export function encodeUserId(id: number | string): string {
  const num = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (isNaN(num) || num <= 0) return String(id);
  const val = num ^ 0x4d4b;
  const check = ((num * 7 + 13) % 97).toString(16).padStart(2, '0');
  return `MKU-${val.toString(16).toUpperCase()}-${check.toUpperCase()}`;
}

export function decodeUserId(str: string): string {
  if (!str) return '';
  if (/^\d+$/.test(str)) return str;
  const match = str.match(/^MKU-([0-9A-Fa-f]+)-([0-9A-Fa-f]+)$/i);
  if (match) {
    const val = parseInt(match[1], 16);
    const num = val ^ 0x4d4b;
    const check = ((num * 7 + 13) % 97).toString(16).padStart(2, '0');
    if (check.toUpperCase() === match[2].toUpperCase()) {
      return String(num);
    }
  }
  return str;
}

