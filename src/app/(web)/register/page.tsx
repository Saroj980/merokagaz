'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  FileText,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [mode, setMode] = useState<'individual' | 'business'>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // Individual Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Business Form Fields
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [panVatNumber, setPanVatNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError(isNe ? 'पासवर्ड र कन्फर्म पासवर्ड मिलेन।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'individual') {
        const res = await api.auth.register({
          name,
          email,
          phone,
          password,
        });

        login(res.token, res.user);
        setRegisteredEmail(res.user.email);
      } else {
        // Business Flow: First register user, then register business
        const userRes = await api.auth.register({
          name: adminName,
          email: businessEmail,
          phone,
          password,
        });

        const bizRes = await api.business.register(
          {
            name: businessName,
            email: businessEmail,
            phone,
            pan_vat_number: panVatNumber,
            registration_number: regNumber,
            address,
            city,
          },
          userRes.token
        );

        login(userRes.token, userRes.user, [bizRes.business]);
        setRegisteredEmail(userRes.user.email);
      }
    } catch (err: any) {
      setError(err.message || (isNe ? 'दर्ता प्रक्रियामा समस्या आयो।' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#123B5D]">
            {isNe ? 'दर्ता सफल भयो!' : 'Registration Successful!'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isNe
              ? `हामीले तपाईंको इमेल ठेगाना (${registeredEmail}) मा प्रमाणीकरण लिंक पठाएका छौं। कृपया इनबक्स जाँच गर्नुहोस्।`
              : `We have dispatched a verification email to ${registeredEmail}. Please click the link to verify your account.`}
          </p>
          <div className="pt-4 flex flex-col gap-2.5">
            <button
              onClick={() => router.push(mode === 'business' ? '/business/dashboard' : '/user/dashboard')}
              className="w-full py-3 rounded-xl bg-[#123B5D] text-xs font-bold text-white shadow-md hover:bg-[#0E2E4A] transition-all"
            >
              {isNe ? 'ड्यासबोर्डमा जानुहोस्' : 'Proceed to Dashboard'}
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {isNe ? 'गृहपृष्ठमा फर्कनुहोस्' : 'Return to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white shadow-lg shadow-teal-500/20">
            {mode === 'individual' ? <User className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#123B5D] tracking-tight">
            {isNe ? 'मेरो कागजमा खाता सिर्जना गर्नुहोस्' : 'Create Mero Kagaz Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isNe ? 'आधिकारिक सरकारी फारमहरू सजिलै भर्नुहोस् र डाउनलोड गर्नुहोस्' : 'Generate verified legal and government documents in minutes'}
          </p>

          {/* Toggle Type */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setMode('individual'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'individual' ? 'bg-white text-[#123B5D] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{isNe ? 'व्यक्तिगत खाता' : 'Individual'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('business'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'business' ? 'bg-white text-[#123B5D] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{isNe ? 'व्यवसाय / संस्था' : 'Business'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'individual' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'पूरा नाम' : 'Full Name'} *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'इमेल ठेगाना' : 'Email Address'} *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'फोन नम्बर' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isNe ? 'व्यवसाय / कम्पनीको नाम' : 'Business Name'} *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Everest Ventures Pvt Ltd"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden focus:ring-3 focus:ring-[#18A999]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'आधिकारिक इमेल' : 'Business Email'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setBusinessEmail(e.target.value);
                    }}
                    placeholder="info@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'प्रशासकको नाम' : 'Admin Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Primary Contact"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'दर्ता नम्बर' : 'Registration No.'}
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="OCR Reg No."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'ठेगाना' : 'Office Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ward, Street"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isNe ? 'सहर / जिल्ला' : 'City / District'}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kathmandu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'पासवर्ड' : 'Password'} *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNe ? 'पुष्टि गर्नुहोस्' : 'Confirm Password'} *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#18A999] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isNe ? 'खाता सिर्जना हुँदैछ...' : 'Registering...'}</span>
              </span>
            ) : (
              <>
                <span>{mode === 'individual' ? (isNe ? 'खाता खोल्नुहोस्' : 'Create Individual Account') : (isNe ? 'व्यवसाय दर्ता गर्नुहोस्' : 'Register Business Account')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isNe ? 'पहिल्यै खाता छ?' : 'Already have an account?'}{' '}
            <Link href="/login" className="font-bold text-[#18A999] hover:underline">
              {isNe ? 'लगइन गर्नुहोस्' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
