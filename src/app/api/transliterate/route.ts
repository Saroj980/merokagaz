import { NextRequest, NextResponse } from 'next/server';
import { getTransliterationSuggestions } from '@/lib/transliterate';

// In-memory server-side cache for high performance
const cache = new Map<string, string[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get('text') || '').trim();

  if (!text) {
    return NextResponse.json({ candidates: [] });
  }

  const lower = text.toLowerCase();
  if (cache.has(lower)) {
    return NextResponse.json({ candidates: cache.get(lower), source: 'cache' });
  }

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ne-t-i0-und&num=8`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MeroKagaz/1.0)',
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      // Format: ["SUCCESS", [["word", ["cand1", "cand2", ...]]]]
      if (
        Array.isArray(data) &&
        data[0] === 'SUCCESS' &&
        Array.isArray(data[1]) &&
        data[1][0] &&
        Array.isArray(data[1][0][1])
      ) {
        const rawCandidates: string[] = data[1][0][1];
        const candidates = Array.from(new Set([...rawCandidates, text])).slice(0, 6);
        cache.set(lower, candidates);
        return NextResponse.json({ candidates, source: 'google' });
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('Online transliteration API unavailable, using offline fallback');
  }

  // Offline fallback from local rules & dictionary
  const fallback = getTransliterationSuggestions(text);
  return NextResponse.json({ candidates: fallback, source: 'offline' });
}
