'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from './i18n';

interface LoaderContextType {
  isLoading: boolean;
  message: string | null;
  showLoader: (msg?: string) => void;
  hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType>({
  isLoading: false,
  message: null,
  showLoader: () => {},
  hideLoader: () => {},
});

function NavigationWatcher({ onFinished }: { onFinished: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onFinished();
  }, [pathname, searchParams, onFinished]);

  return null;
}

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { lang } = useLanguage();

  const showLoader = useCallback((msg?: string) => {
    setMessage(msg || null);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
    setMessage(null);
  }, []);

  // Intercept all internal Link clicks for instant Screen-to-Screen loading feedback
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Only handle internal links (not external, not new tab, not hash anchor)
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/#') &&
        targetAttr !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // If clicking on the exact current path, skip
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        setIsLoading(true);
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, []);

  const defaultLoadingText = lang === 'ne' ? 'कागजात लोड हुँदैछ...' : 'Loading, please wait...';

  return (
    <LoaderContext.Provider value={{ isLoading, message, showLoader, hideLoader }}>
      <Suspense fallback={null}>
        <NavigationWatcher onFinished={hideLoader} />
      </Suspense>

      {children}

      {/* ─── Global Top Glow Progress Bar ─── */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1.5 overflow-hidden bg-slate-200/50">
          <div className="h-full w-full bg-gradient-to-r from-[#18A999] via-[#F4B942] to-[#123B5D] animate-pulse" />
        </div>
      )}

      {/* ─── Global Glassmorphic Center Loading Modal ─── */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#123B5D]/25 backdrop-blur-xs transition-all"
        >
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/95 px-8 py-7 shadow-2xl shadow-[#123B5D]/20 backdrop-blur-md">
            {/* Spinning Brand Rings with Pulsing Icon */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#18A999] border-r-[#123B5D] animate-spin" />
              <div className="relative h-9 w-9 animate-pulse">
                <Image
                  src="/assets/icon.png"
                  alt="Loading"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Loading text in active language */}
            <p className="mt-4 text-xs font-semibold text-[#123B5D] tracking-wide">
              {message || defaultLoadingText}
            </p>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}
