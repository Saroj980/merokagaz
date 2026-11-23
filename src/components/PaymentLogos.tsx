import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'badge' | 'icon' | 'full';
}

/**
 * Official eSewa Logo Component
 * Source: Official eSewa CDN (cdn.esewa.com.np)
 */
export function EsewaLogo({ className = '', variant = 'badge' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className || 'h-7 w-16'}`}>
        <Image
          src="/assets/payments/esewa.png"
          alt="eSewa"
          width={70}
          height={28}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs transition-all duration-200 hover:border-emerald-400 hover:shadow-xs hover:scale-105 h-9.5 ${className}`}
      title="eSewa Digital Wallet"
    >
      <div className="relative h-5 w-16">
        <Image
          src="/assets/payments/esewa.png"
          alt="eSewa"
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>
    </div>
  );
}

/**
 * Official Khalti Logo Component
 * Source: Official Khalti CDN (khalti-static.s3.ap-south-1.amazonaws.com)
 */
export function KhaltiLogo({ className = '', variant = 'badge' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className || 'h-7 w-16'}`}>
        <Image
          src="/assets/payments/khalti.png"
          alt="Khalti"
          width={70}
          height={28}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs transition-all duration-200 hover:border-purple-400 hover:shadow-xs hover:scale-105 h-9.5 ${className}`}
      title="Khalti Digital Wallet"
    >
      <div className="relative h-5.5 w-16">
        <Image
          src="/assets/payments/khalti.png"
          alt="Khalti"
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>
    </div>
  );
}

/**
 * Official connectIPS Logo Component
 * Source: Official NCHL (nchl.com.np)
 */
export function ConnectIpsLogo({ className = '', variant = 'badge' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className || 'h-7 w-16'}`}>
        <Image
          src="/assets/payments/connectips.png"
          alt="connectIPS"
          width={70}
          height={28}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs transition-all duration-200 hover:border-blue-400 hover:shadow-xs hover:scale-105 h-9.5 ${className}`}
      title="connectIPS e-Payment"
    >
      <div className="relative h-6 w-16">
        <Image
          src="/assets/payments/connectips.png"
          alt="connectIPS"
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
