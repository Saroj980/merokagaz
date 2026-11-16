'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Building2, ArrowRight, AlertCircle, MapPin, Phone, Mail, FileText } from 'lucide-react';

export default function BusinessRegisterPage() {
  const router = useRouter();
  const { isLoggedIn, refreshBusinesses, setActiveBusiness } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [panVatNumber, setPanVatNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.business.register({
        name,
        email,
        phone,
        pan_vat_number: panVatNumber,
        registration_number: registrationNumber,
        address,
        city,
      });

      await refreshBusinesses();
      setActiveBusiness(res.business);
      router.push('/business/dashboard');
    } catch (err: any) {
      setError(err.message || (isNe ? 'व्यवसाय दर्ता असफल भयो।' : 'Business registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#123B5D]">
            {isNe ? 'नयाँ व्यवसाय / संस्था दर्ता' : 'Register New Business'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isNe
              ? 'आफ्नो कम्पनीको आधिकारिक विवरण प्रविष्ट गरी संस्थागत खाता सुरु गर्नुहोस्।'
              : 'Add a new business profile to generate official documents with company identity.'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isNe ? 'कम्पनी / व्यवसायको नाम' : 'Business / Organization Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kathmandu Agro Industries Pvt Ltd"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'आधिकारिक इमेल' : 'Business Email'} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'सम्पर्क फोन' : 'Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01-XXXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'PAN / VAT नम्बर' : 'PAN / VAT No.'}
              </label>
              <input
                type="text"
                value={panVatNumber}
                onChange={(e) => setPanVatNumber(e.target.value)}
                placeholder="9-digit PAN"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'कम्पनी दर्ता नम्बर' : 'Registration No.'}
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. 123456/080/081"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'ठेगाना' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ward, Street"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'सहर / जिल्ला' : 'City'}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pokhara"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span>{isNe ? 'दर्ता हुँदैछ...' : 'Registering...'}</span>
            ) : (
              <>
                <span>{isNe ? 'व्यवसाय दर्ता सम्पन्न गर्नुहोस्' : 'Complete Registration'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/business/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            {isNe ? 'ड्यासबोर्डमा फर्कनुहोस्' : 'Cancel and return to dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
