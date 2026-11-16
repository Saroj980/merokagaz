'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'animate-slide-up' | 'animate-slide-down' | 'animate-fade-in' | 'animate-scale-up';
  delay?: 'delay-50' | 'delay-100' | 'delay-150' | 'delay-200' | 'delay-250' | 'delay-300' | 'delay-400' | 'delay-500' | 'delay-600' | string;
  delayClass?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  animation = 'animate-slide-up',
  delay = '',
  delayClass = '',
  threshold = 0.08,
  triggerOnce = false, // Set to false so it re-triggers every time on scroll up and down
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else {
            // When leaving viewport, reset so scrolling up/down re-triggers the animation!
            if (!triggerOnce) {
              setIsVisible(false);
            }
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, [threshold, triggerOnce]);

  const activeDelay = delayClass || delay;

  return (
    <div
      ref={elementRef}
      className={`${className} ${
        isVisible
          ? `${animation} ${activeDelay}`
          : 'opacity-0 translate-y-7 pointer-events-none transition-all duration-300'
      }`}
    >
      {children}
    </div>
  );
}
