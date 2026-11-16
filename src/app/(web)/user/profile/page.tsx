'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/i18n';
import { api, UserProfile, BusinessItem, BusinessDirector, UserPaymentItem } from '@/lib/api';
import { formatBsDate } from '@/lib/nepaliDate';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import NepaliInput from '@/components/ui/NepaliInput';
import NepalAddressPicker from '@/components/ui/NepalAddressPicker';
import { toNepaliDigits } from '@/lib/nepaliDate';
import toast from '@/lib/toast';
import geoData from '@/data/nepal_administrative_divisions.json';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Calendar,
  Sparkles,
  MapPin,
  Home,
  CreditCard,
  Check,
  FileCheck2,
  Users,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Layers,
} from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'business' ? 'business' : 'individual';

  const { user, businesses, isLoggedIn, isLoaded, logout, refreshUser, refreshBusinesses } = useAuth();
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  // Active Tab: 'individual' | 'business' | 'security'
  const [activeTab, setActiveTab] = useState<'individual' | 'business' | 'security'>(initialTab);

  // ═══════════════════════════════════════════════════════════
  // 1. INDIVIDUAL PROFILE STATE
  // ═══════════════════════════════════════════════════════════
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Individual Address
  const [province, setProvince] = useState('');
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [municipality, setMunicipality] = useState('');
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [ward, setWard] = useState('');
  const [tole, setTole] = useState('');

  // Individual 3-Generation Legal Info
  const [citizenshipNo, setCitizenshipNo] = useState('');
  const [citizenshipIssuedDistrict, setCitizenshipIssuedDistrict] = useState('');
  const [citizenshipIssuedDistrictId, setCitizenshipIssuedDistrictId] = useState<number | null>(null);
  const [citizenshipIssuedDate, setCitizenshipIssuedDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [grandfatherName, setGrandfatherName] = useState('');
  const [spouseName, setSpouseName] = useState('');

  // ═══════════════════════════════════════════════════════════
  // 2. BUSINESS PROFILE STATE
  // ═══════════════════════════════════════════════════════════
  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizPan, setBizPan] = useState('');
  const [bizRegNo, setBizRegNo] = useState('');
  const [bizRegDateBs, setBizRegDateBs] = useState('');
  const [bizProvince, setBizProvince] = useState('');
  const [bizProvinceId, setBizProvinceId] = useState<number | null>(null);
  const [bizDistrict, setBizDistrict] = useState('');
  const [bizDistrictId, setBizDistrictId] = useState<number | null>(null);
  const [bizMunicipality, setBizMunicipality] = useState('');
  const [bizMunicipalityId, setBizMunicipalityId] = useState<number | null>(null);
  const [bizWard, setBizWard] = useState('');
  const [bizTole, setBizTole] = useState('');

  // Business Signatory & Capital
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  const [signatoryCitizenship, setSignatoryCitizenship] = useState('');
  const [issuedCapital, setIssuedCapital] = useState('');
  const [paidUpCapital, setPaidUpCapital] = useState('');
  const [directors, setDirectors] = useState<BusinessDirector[]>([]);

  // Director Add/Edit state
  const [showAddDirector, setShowAddDirector] = useState(false);
  const [editingDirectorIndex, setEditingDirectorIndex] = useState<number | null>(null);
  const [newDirName, setNewDirName] = useState('');
  const [newDirDesignation, setNewDirDesignation] = useState('सञ्चालक (Director)');
  const [newDirCitizenship, setNewDirCitizenship] = useState('');
  const [newDirPhone, setNewDirPhone] = useState('');
  const [newDirShare, setNewDirShare] = useState('');
  const [newDirAddress, setNewDirAddress] = useState('');
  const [newDirAddressData, setNewDirAddressData] = useState<any>(null);

  // ═══════════════════════════════════════════════════════════
  // 3. SECURITY / PASSWORD STATE
  // ═══════════════════════════════════════════════════════════
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status & Feedback
  const [savingIndividual, setSavingIndividual] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Quick Stats
  const [docCount, setDocCount] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  // ─── Initialize User & Business Data ───
  useEffect(() => {
    if (!isLoaded) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setPanNumber(user.pan_number || '');

      setProvince(user.province || '');
      setProvinceId(user.province_id || null);
      setDistrict(user.district || '');
      setDistrictId(user.district_id || null);
      setMunicipality(user.municipality || '');
      setMunicipalityId(user.municipality_id || null);
      setWard(user.ward || '');
      setTole(user.tole || '');

      setCitizenshipNo(user.citizenship_no || '');
      setCitizenshipIssuedDistrict(user.citizenship_issued_district || '');
      setCitizenshipIssuedDistrictId(user.citizenship_issued_district_id || null);
      setCitizenshipIssuedDate(user.citizenship_issued_date || '');
      setFatherName(user.father_name || '');
      setMotherName(user.mother_name || '');
      setGrandfatherName(user.grandfather_name || '');
      setSpouseName(user.spouse_name || '');
    }

    if (businesses && businesses.length > 0 && !selectedBizId) {
      const firstBiz = businesses[0];
      handleSelectBusiness(firstBiz.id);
    }

    // Stats
    Promise.all([
      api.user.documents().catch(() => []),
      api.user.payments().catch(() => []),
    ]).then(([docs, pays]) => {
      if (Array.isArray(docs)) setDocCount(docs.length);
      if (Array.isArray(pays)) {
        const spent = pays
          .filter((p: UserPaymentItem) => p.status === 'completed' || p.status === 'paid')
          .reduce((sum: number, p: UserPaymentItem) => sum + Number(p.amount || 0), 0);
        setTotalSpent(spent);
      }
    });
  }, [isLoaded, isLoggedIn, router, user, businesses]);

  const loadBusinessData = (biz: BusinessItem) => {
    setBizName(biz.name || '');
    setBizEmail(biz.email || '');
    setBizPhone(biz.phone || '');
    setBizPan(biz.pan_vat_number || '');
    setBizRegNo(biz.registration_number || '');
    setBizRegDateBs(biz.registered_date_bs || '');
    setBizProvince(biz.province || '');
    setBizProvinceId(biz.province_id || null);
    setBizDistrict(biz.district || '');
    setBizDistrictId(biz.district_id || null);
    setBizMunicipality(biz.municipality || '');
    setBizMunicipalityId(biz.municipality_id || null);
    setBizWard(biz.ward || '');
    setBizTole(biz.tole || '');

    setSignatoryName(biz.authorized_signatory_name || '');
    setSignatoryDesignation(biz.authorized_signatory_designation || '');
    setSignatoryCitizenship(biz.authorized_signatory_citizenship || '');
    setIssuedCapital(biz.issued_capital || '');
    setPaidUpCapital(biz.paid_up_capital || '');
    setDirectors(biz.directors || []);
  };

  const handleSelectBusiness = async (bizId: number) => {
    setSelectedBizId(bizId);
    try {
      const detailed = await api.business.get(bizId);
      loadBusinessData(detailed);
    } catch {
      const found = businesses?.find((b) => b.id === bizId);
      if (found) loadBusinessData(found);
    }
  };

  // ─── Nepal Administrative Data Derivations ───
  const provincesList = useMemo(() => geoData.provinces || [], []);
  const allDistricts = useMemo(() => provincesList.flatMap((p) => p.districts), [provincesList]);

  // Options for Individual Address
  const provinceOptions: SelectOption[] = useMemo(() => {
    return provincesList.map((p) => ({
      value: p.name_ne,
      label: isNe ? p.name_ne : `${p.name_en} (${p.name_ne})`,
      subLabel: p.name_en,
    }));
  }, [provincesList, isNe]);

  const individualDistrictOptions: SelectOption[] = useMemo(() => {
    let source = allDistricts;
    if (province) {
      const matchP = provincesList.find((p) => p.name_ne === province || p.name_en === province);
      if (matchP) source = matchP.districts;
    }
    return source.map((d) => ({
      value: d.name_ne,
      label: isNe ? d.name_ne : `${d.name_en} (${d.name_ne})`,
      subLabel: d.name_en,
    }));
  }, [province, allDistricts, provincesList, isNe]);

  const individualMuniOptions: SelectOption[] = useMemo(() => {
    if (!district) return [];
    const matchD = allDistricts.find((d) => d.name_ne === district || d.name_en === district);
    if (!matchD) return [];
    return matchD.local_levels.map((m) => ({
      value: m.name_ne,
      label: isNe ? `${m.name_ne} (${m.type_ne})` : `${m.name_en} (${m.type_ne})`,
      subLabel: m.type_ne,
    }));
  }, [district, allDistricts, isNe]);

  // Options for Business Address
  const bizDistrictOptions: SelectOption[] = useMemo(() => {
    let source = allDistricts;
    if (bizProvince) {
      const matchP = provincesList.find((p) => p.name_ne === bizProvince || p.name_en === bizProvince);
      if (matchP) source = matchP.districts;
    }
    return source.map((d) => ({
      value: d.name_ne,
      label: isNe ? d.name_ne : `${d.name_en} (${d.name_ne})`,
      subLabel: d.name_en,
    }));
  }, [bizProvince, allDistricts, provincesList, isNe]);

  const bizMuniOptions: SelectOption[] = useMemo(() => {
    if (!bizDistrict) return [];
    const matchD = allDistricts.find((d) => d.name_ne === bizDistrict || d.name_en === bizDistrict);
    if (!matchD) return [];
    return matchD.local_levels.map((m) => ({
      value: m.name_ne,
      label: isNe ? `${m.name_ne} (${m.type_ne})` : `${m.name_en} (${m.type_ne})`,
      subLabel: m.type_ne,
    }));
  }, [bizDistrict, allDistricts, isNe]);

  // Ward Options (1 to 35)
  const wardOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    for (let i = 1; i <= 35; i++) {
      list.push({
        value: String(i),
        label: isNe ? `वडा नं. ${toNepaliDigits(i)}` : `Ward No. ${i}`,
      });
    }
    return list;
  }, [isNe]);

  // All District Options (for Citizenship Issued District)
  const allDistrictOptions: SelectOption[] = useMemo(() => {
    return allDistricts.map((d) => ({
      value: d.name_ne,
      label: isNe ? d.name_ne : `${d.name_en} (${d.name_ne})`,
      subLabel: d.name_en,
    }));
  }, [allDistricts, isNe]);

  // Gender Options
  const genderOptions: SelectOption[] = [
    { value: 'पुरुष', label: isNe ? 'पुरुष (Male)' : 'Male' },
    { value: 'महिला', label: isNe ? 'महिला (Female)' : 'Female' },
    { value: 'अन्य', label: isNe ? 'अन्य (Other)' : 'Other' },
  ];

  // Designation Options for Company Directors
  const designationOptions: SelectOption[] = [
    { value: 'अध्यक्ष (Chairperson)', label: 'अध्यक्ष (Chairperson)' },
    { value: 'प्रबन्ध सञ्चालक (Managing Director)', label: 'प्रबन्ध सञ्चालक (Managing Director)' },
    { value: 'सञ्चालक (Director)', label: 'सञ्चालक (Director)' },
    { value: 'शेयरधनी (Shareholder)', label: 'शेयरधनी (Shareholder)' },
    { value: 'अधिकृत प्रतिनिधि (Authorized Representative)', label: 'अधिकृत प्रतिनिधि (Representative)' },
  ];

  // Formatted Nepali Address Preview
  const formattedIndividualAddress = useMemo(() => {
    const parts = [];
    if (tole) parts.push(tole);
    if (municipality) parts.push(ward ? `${municipality} - ${ward}` : municipality);
    if (district) parts.push(district);
    if (province) parts.push(province);
    return parts.join(', ');
  }, [tole, ward, municipality, district, province]);

  const formattedBusinessAddress = useMemo(() => {
    const parts = [];
    if (bizTole) parts.push(bizTole);
    if (bizMunicipality) parts.push(bizWard ? `${bizMunicipality} - ${bizWard}` : bizMunicipality);
    if (bizDistrict) parts.push(bizDistrict);
    if (bizProvince) parts.push(bizProvince);
    return parts.join(', ');
  }, [bizTole, bizWard, bizMunicipality, bizDistrict, bizProvince]);

  // ─── Actions: Save Individual Profile ───
  const handleSaveIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIndividual(true);

    try {
      const payload: Partial<UserProfile> = {
        name,
        phone,
        gender,
        pan_number: panNumber,
        province,
        province_id: provinceId,
        district,
        district_id: districtId,
        municipality,
        municipality_id: municipalityId,
        ward,
        tole,
        citizenship_no: citizenshipNo,
        citizenship_issued_district: citizenshipIssuedDistrict,
        citizenship_issued_district_id: citizenshipIssuedDistrictId,
        citizenship_issued_date: citizenshipIssuedDate,
        father_name: fatherName,
        mother_name: motherName,
        grandfather_name: grandfatherName,
        spouse_name: spouseName,
      };

      await api.user.updateProfile(payload);
      await refreshUser();
      toast.success(
        isNe
          ? 'तपाईंको व्यक्तिगत तथा ३ पुस्ते विवरण सफलतापूर्वक सुरक्षित भयो।'
          : 'Individual profile and 3-generation legal details saved successfully.'
      );
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'विवरण अद्यावधिक गर्न सकिएन।' : 'Failed to update profile.'));
    } finally {
      setSavingIndividual(false);
    }
  };

  // ─── Actions: Save Business Profile ───
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId) return;

    setSavingBusiness(true);

    try {
      const payload: Partial<BusinessItem> = {
        name: bizName,
        email: bizEmail,
        phone: bizPhone,
        pan_vat_number: bizPan,
        registration_number: bizRegNo,
        registered_date_bs: bizRegDateBs,
        province: bizProvince,
        province_id: bizProvinceId,
        district: bizDistrict,
        district_id: bizDistrictId,
        municipality: bizMunicipality,
        municipality_id: bizMunicipalityId,
        ward: bizWard,
        tole: bizTole,
        authorized_signatory_name: signatoryName,
        authorized_signatory_designation: signatoryDesignation,
        authorized_signatory_citizenship: signatoryCitizenship,
        issued_capital: issuedCapital,
        paid_up_capital: paidUpCapital,
        directors,
      };

      await api.business.update(selectedBizId, payload);
      await Promise.all([refreshUser(), refreshBusinesses?.()]);
      await handleSelectBusiness(selectedBizId);
      toast.success(
        isNe
          ? 'संस्थागत विवरण, ठेगाना तथा सञ्चालकहरूको नामावली सुरक्षित भयो।'
          : 'Business details, address, and directors list saved successfully.'
      );
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'संस्थागत विवरण अद्यावधिक हुन सकेन।' : 'Failed to update business profile.'));
    } finally {
      setSavingBusiness(false);
    }
  };

  // ─── Director Helpers ───
  const handleEditDirector = (index: number) => {
    const target = directors[index];
    if (!target) return;
    setEditingDirectorIndex(index);
    setNewDirName(target.name || '');
    setNewDirDesignation(target.designation || 'सञ्चालक (Director)');
    setNewDirCitizenship(target.citizenship_no || '');
    setNewDirPhone(target.phone || '');
    setNewDirShare(target.share_percent ? String(target.share_percent) : '');
    setNewDirAddress(target.address || '');
    setNewDirAddressData({
      province: target.province,
      province_id: target.province_id,
      district: target.district,
      district_id: target.district_id,
      municipality: target.municipality,
      municipality_id: target.municipality_id,
      ward: target.ward,
      tole: target.tole,
      formatted: target.address,
    });
    setShowAddDirector(true);
  };

  const handleCancelDirector = () => {
    setEditingDirectorIndex(null);
    setNewDirName('');
    setNewDirDesignation('सञ्चालक (Director)');
    setNewDirCitizenship('');
    setNewDirPhone('');
    setNewDirShare('');
    setNewDirAddress('');
    setNewDirAddressData(null);
    setShowAddDirector(false);
  };

  const handleAddDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    const newDir: BusinessDirector = {
      name: newDirName.trim(),
      designation: newDirDesignation,
      citizenship_no: newDirCitizenship.trim() || undefined,
      phone: newDirPhone.trim() || undefined,
      share_percent: newDirShare.trim() || undefined,
      address: newDirAddress.trim() || undefined,
      province: newDirAddressData?.province || undefined,
      province_id: newDirAddressData?.province_id || undefined,
      district: newDirAddressData?.district || undefined,
      district_id: newDirAddressData?.district_id || undefined,
      municipality: newDirAddressData?.municipality || undefined,
      municipality_id: newDirAddressData?.municipality_id || undefined,
      ward: newDirAddressData?.ward || undefined,
      tole: newDirAddressData?.tole || undefined,
    };

    if (editingDirectorIndex !== null && editingDirectorIndex >= 0) {
      const updated = [...directors];
      updated[editingDirectorIndex] = newDir;
      setDirectors(updated);
    } else {
      setDirectors([...directors, newDir]);
    }

    handleCancelDirector();
  };

  const handleRemoveDirector = (index: number) => {
    if (editingDirectorIndex === index) {
      handleCancelDirector();
    }
    setDirectors(directors.filter((_, i) => i !== index));
  };

  // ─── Password Change ───
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (password !== passwordConfirmation) {
      setPwdMsg({
        type: 'error',
        text: isNe ? 'नयाँ पासवर्ड र कन्फर्म पासवर्ड मिलेन।' : 'New passwords do not match.',
      });
      return;
    }

    if (password.length < 6) {
      setPwdMsg({
        type: 'error',
        text: isNe ? 'नयाँ पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।' : 'Password must be at least 6 characters.',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.user.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setPwdMsg({
        type: 'success',
        text: isNe ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो।' : 'Password updated successfully.',
      });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      setTimeout(() => setPwdMsg(null), 4000);
    } catch (err: any) {
      setPwdMsg({
        type: 'error',
        text: err.message || (isNe ? 'पासवर्ड परिवर्तन गर्न सकिएन।' : 'Failed to change password.'),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendStatus(null);
    try {
      await api.auth.resendVerification({ email: user?.email });
      setResendStatus(isNe ? 'प्रमाणीकरण इमेल पुनः पठाइएको छ।' : 'Verification email resent.');
      setTimeout(() => setResendStatus(null), 4000);
    } catch {
      setResendStatus(isNe ? 'इमेल पठाउन असफल भयो।' : 'Failed to resend email.');
    } finally {
      setResendingEmail(false);
    }
  };

  if (!isLoaded || !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18A999]" />
        <p className="mt-3 text-xs font-semibold text-slate-500 font-outfit">
          {isNe ? 'प्रोफाइल लोड हुँदैछ...' : 'Loading profile...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-8 px-4 sm:px-6 lg:px-8 font-outfit">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#18A999] transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{isNe ? 'ड्यासबोर्डमा फर्कनुहोस्' : 'Back to Dashboard'}</span>
          </Link>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isNe ? 'लगआउट' : 'Sign Out'}</span>
          </button>
        </div>

        {/* ─── Profile Header Hero Card ─── */}
        <div className="rounded-3xl border border-teal-200/80 bg-gradient-to-r from-white via-white to-teal-50/40 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#18A999]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#123B5D] to-[#18A999] text-white text-2xl font-black shadow-lg">
                {activeTab === 'business' ? (
                  <Building2 className="h-9 w-9 text-teal-100" />
                ) : (
                  user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-[#123B5D]">
                    {activeTab === 'business' ? (bizName || 'संस्थागत प्रोफाइल') : (user?.name || 'Mero Kagaz User')}
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#18A999] border border-teal-200 uppercase tracking-wider">
                    <Shield className="h-3 w-3" />
                    <span>{activeTab === 'business' ? (isNe ? 'संस्थागत' : 'Business') : (isNe ? 'नागरिक' : 'Citizen')}</span>
                  </span>

                  {user?.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{isNe ? 'प्रमाणित खाता' : 'Verified'}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {activeTab === 'business' ? bizEmail || user?.email : user?.email}{' '}
                  {(activeTab === 'business' ? bizPhone : user?.phone) ? `• ${activeTab === 'business' ? bizPhone : user?.phone}` : ''}
                </p>

                {(activeTab === 'business' ? formattedBusinessAddress : formattedIndividualAddress) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#18A999] shrink-0" />
                    <span className="font-semibold">{activeTab === 'business' ? formattedBusinessAddress : formattedIndividualAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[100px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isNe ? 'कागजातहरू' : 'Documents'}
                </div>
                <div className="text-xl font-black text-[#123B5D] mt-0.5 font-mono">
                  {docCount}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[110px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isNe ? 'कुल खर्च' : 'Lifetime Spent'}
                </div>
                <div className="text-xl font-black text-emerald-600 mt-0.5 font-mono">
                  NPR {totalSpent.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* ─── Profile Mode Switcher Tabs ─── */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-[#123B5D] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <User className="h-4 w-4" />
            <span>{isNe ? 'व्यक्तिगत प्रोफाइल (Individual)' : 'Individual Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'business'
                ? 'bg-[#18A999] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>{isNe ? 'संस्थागत प्रोफाइल (Business)' : 'Business Profile'}</span>
            {businesses && businesses.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'business' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {businesses.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>{isNe ? 'सुरक्षा तथा पासवर्ड' : 'Security & Password'}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: INDIVIDUAL PROFILE */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'individual' && (
          <form onSubmit={handleSaveIndividual} className="space-y-6">
            {/* 1. Basic Identity */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#123B5D]">
                    {isNe ? '१. आधारभूत व्यक्तिगत विवरण (Basic Identity)' : '1. Basic Identity'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isNe ? 'आधिकारिक नाम, फोन, लिङ्ग र व्यक्तिगत स्थायी लेखा नम्बर' : 'Official personal name, phone, gender, and PAN'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                  </label>
                  <NepaliInput
                    value={name}
                    onChange={(val) => setName(val)}
                    placeholder={isNe ? 'तपाईंको पूरा नाम' : 'Your full name'}
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isNe ? 'इमेल (Email)' : 'Email'}
                    </label>
                    {!user?.is_verified && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="text-[11px] font-bold text-[#18A999] hover:underline cursor-pointer"
                      >
                        {resendingEmail ? (isNe ? 'पठाउँदैछ...' : 'Sending...') : (isNe ? 'पुष्टि गर्नुहोस्' : 'Verify')}
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                  {resendStatus && (
                    <p className="text-[11px] text-teal-600 font-semibold mt-1">{resendStatus}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'सम्पर्क फोन नम्बर (Phone Number)' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Gender (CustomSelect) & PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'लिङ्ग (Gender)' : 'Gender'}
                  </label>
                  <CustomSelect
                    value={gender}
                    onChange={(val) => setGender(val)}
                    options={genderOptions}
                    placeholder={isNe ? 'लिङ्ग छान्नुहोस्...' : 'Select Gender...'}
                    searchable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'स्थायी लेखा नम्बर / PAN Number' : 'Personal PAN Number'}
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="उदा: 123456789"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. Individual Address via CustomSelect */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#123B5D]">
                      {isNe ? '२. नेपाल प्रशासनिक स्थायी ठेगाना (Administrative Address)' : '2. Administrative Address'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isNe
                        ? 'प्रदेश, जिल्ला, नगरपालिका/गाउँपालिका (खोज्न मिल्ने CustomSelect मार्फत)'
                        : 'Province, District, Municipality via searchable CustomSelect'}
                    </p>
                  </div>
                </div>

                {formattedIndividualAddress && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#123B5D]">
                    <Home className="h-3.5 w-3.5 text-[#18A999]" />
                    <span>{formattedIndividualAddress}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Province CustomSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'प्रदेश (Province) *' : 'Province *'}
                  </label>
                  <CustomSelect
                    value={province}
                    onChange={(val) => {
                      setProvince(val);
                      const matchP = provincesList.find((p) => p.name_ne === val || p.name_en === val);
                      setProvinceId(matchP ? matchP.id : null);
                      setDistrict('');
                      setDistrictId(null);
                      setMunicipality('');
                      setMunicipalityId(null);
                    }}
                    options={provinceOptions}
                    placeholder={isNe ? 'प्रदेश छान्नुहोस्...' : 'Select Province...'}
                    searchPlaceholder={isNe ? 'प्रदेश खोज्नुहोस्...' : 'Search province...'}
                    searchable={true}
                  />
                </div>

                {/* District CustomSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'जिल्ला (District) *' : 'District *'}
                  </label>
                  <CustomSelect
                    value={district}
                    onChange={(val) => {
                      setDistrict(val);
                      const matchD = allDistricts.find((d) => d.name_ne === val || d.name_en === val);
                      setDistrictId(matchD ? matchD.id : null);
                      setMunicipality('');
                      setMunicipalityId(null);
                    }}
                    options={individualDistrictOptions}
                    disabled={!province}
                    placeholder={isNe ? 'जिल्ला छान्नुहोस्...' : 'Select District...'}
                    searchPlaceholder={isNe ? 'जिल्ला खोज्नुहोस्...' : 'Search district...'}
                    searchable={true}
                  />
                </div>

                {/* Municipality CustomSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नगरपालिका / गाउँपालिका *' : 'Municipality *'}
                  </label>
                  <CustomSelect
                    value={municipality}
                    onChange={(val) => {
                      setMunicipality(val);
                      const matchD = allDistricts.find((d) => d.name_ne === district || d.name_en === district);
                      const matchM = matchD?.local_levels.find((m) => m.name_ne === val || m.name_en === val);
                      setMunicipalityId(matchM ? matchM.id : null);
                    }}
                    options={individualMuniOptions}
                    disabled={!district}
                    placeholder={isNe ? 'नगरपालिका छान्नुहोस्...' : 'Select Municipality...'}
                    searchPlaceholder={isNe ? 'नगरपालिका खोज्नुहोस्...' : 'Search municipality...'}
                    searchable={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Ward */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'वडा नम्बर (Ward Number)' : 'Ward Number'}
                  </label>
                  <CustomSelect
                    value={ward}
                    onChange={(val) => setWard(val)}
                    options={wardOptions}
                    placeholder={isNe ? 'वडा छान्नुहोस्...' : 'Select Ward...'}
                    searchPlaceholder={isNe ? 'वडा खोज्नुहोस्...' : 'Search ward...'}
                    searchable={true}
                  />
                </div>

                {/* Tole */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'टोल / मार्ग (Tole / Street)' : 'Tole / Street Address'}
                  </label>
                  <NepaliInput
                    value={tole}
                    onChange={(val) => setTole(val)}
                    placeholder="उदा: नयाँ बानेश्वर, शान्ति मार्ग"
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>
              </div>
            </div>

            {/* 3. Citizen & 3-Generation Legal Info */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#123B5D]">
                    {isNe ? '३. कानूनी तथा ३ पुस्ते विवरण (Citizen & 3-Generation Legal Info)' : '3. Citizen & Family Legal Info'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isNe
                      ? 'नागरिकता, जारी मिति, बाबु, आमा, बाजे तथा पति/पत्नीको नाम'
                      : 'Citizenship, issued date, father, mother, grandfather & spouse details'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Citizenship No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नागरिकता नम्बर (Citizenship No)' : 'Citizenship Number'}
                  </label>
                  <input
                    type="text"
                    value={citizenshipNo}
                    onChange={(e) => setCitizenshipNo(e.target.value)}
                    placeholder="उदा: २७-०१-७५-१२३४५"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                  />
                </div>

                {/* Issued District via CustomSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नागरिकता जारी जिल्ला (Issued District)' : 'Citizenship Issued District'}
                  </label>
                  <CustomSelect
                    value={citizenshipIssuedDistrict}
                    onChange={(val) => {
                      setCitizenshipIssuedDistrict(val);
                      const matchD = allDistricts.find((d) => d.name_ne === val || d.name_en === val);
                      setCitizenshipIssuedDistrictId(matchD ? matchD.id : null);
                    }}
                    options={allDistrictOptions}
                    placeholder={isNe ? 'जारी जिल्ला छान्नुहोस्...' : 'Select District...'}
                    searchPlaceholder={isNe ? 'जिल्ला खोज्नुहोस्...' : 'Search district...'}
                    searchable={true}
                  />
                </div>

                {/* Issued Date BS with Nepali Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नागरिकता जारी मिति (Issued Date BS)' : 'Citizenship Issued Date (BS)'}
                  </label>
                  <NepaliDatePicker
                    value={citizenshipIssuedDate}
                    onChange={(val) => setCitizenshipIssuedDate(val)}
                    placeholder={isNe ? 'मिति छान्नुहोस् (उदा: २०७५/०३/१२)' : 'Select Date (BS)'}
                  />
                </div>
              </div>

              {/* 3-Generation Details (2 per row for generous, uncompressed input) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'बाबुको नाम (Father\'s Name)' : 'Father\'s Name'}
                  </label>
                  <NepaliInput
                    value={fatherName}
                    onChange={(val) => setFatherName(val)}
                    placeholder={isNe ? 'बाबुको पूरा नाम' : 'Father\'s full name'}
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'आमाको नाम (Mother\'s Name)' : 'Mother\'s Name'}
                  </label>
                  <NepaliInput
                    value={motherName}
                    onChange={(val) => setMotherName(val)}
                    placeholder={isNe ? 'आमाको पूरा नाम' : 'Mother\'s full name'}
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'बाजेको नाम (Grandfather\'s Name)' : 'Grandfather\'s Name'}
                  </label>
                  <NepaliInput
                    value={grandfatherName}
                    onChange={(val) => setGrandfatherName(val)}
                    placeholder={isNe ? 'बाजेको पूरा नाम' : 'Grandfather\'s full name'}
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'पति / पत्नीको नाम (Spouse\'s Name)' : 'Spouse\'s Name'}
                  </label>
                  <NepaliInput
                    value={spouseName}
                    onChange={(val) => setSpouseName(val)}
                    placeholder={isNe ? 'पति वा पत्नीको नाम (यदि भए)' : 'Spouse\'s name (if any)'}
                    isNe={isNe}
                    defaultNepaliMode={false}
                  />
                </div>
              </div>

              {/* Auto-fill Tip */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#18A999] shrink-0 mt-0.5" />
                <div className="text-xs text-[#123B5D] leading-relaxed">
                  <span className="font-extrabold">{isNe ? '💡 व्यक्तिगत फारम स्वतः भर्ने ग्यारेन्टी:' : '💡 Smart Auto-Fill Guarantee:'}</span>{' '}
                  {isNe
                    ? 'कुनै पनि कानूनी वा सरकारी कागजात बनाउँदा यो विवरण एकै क्लिकमा स्वतः लोड हुनेछ।'
                    : 'This individual info will instantly auto-fill into any legal document form with a single click.'}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingIndividual}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition cursor-pointer shadow-md"
                >
                  {savingIndividual ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{savingIndividual ? (isNe ? 'सुरक्षित गर्दै...' : 'Saving...') : (isNe ? 'व्यक्तिगत विवरण सुरक्षित गर्नुहोस्' : 'Save Individual Details')}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: BUSINESS PROFILE */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            {(!businesses || businesses.length === 0) ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-4">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                  <Building2 className="h-7 w-7" />
                </div>
                <h3 className="text-base font-extrabold text-[#123B5D]">
                  {isNe ? 'कुनै संस्थागत खाता दर्ता भएको छैन' : 'No Business Registered Yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isNe
                    ? 'कम्पनीको नाम, प्यान, दर्ता नम्बर र सञ्चालकहरूको नामावली सहित आधिकारिक कागजात सिर्जना गर्न नयाँ व्यवसाय थप्नुहोस्।'
                    : 'Register your business profile to manage corporate documents, address, and directors.'}
                </p>
                <Link
                  href="/business/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#18A999] text-xs font-bold text-white hover:bg-[#148C7E] transition shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isNe ? 'नयाँ व्यवसाय दर्ता गर्नुहोस्' : 'Register New Business'}</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSaveBusiness} className="space-y-6">
                {/* Business Selector Header */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#123B5D]">
                        {isNe ? 'संस्थागत विवरण तथा कम्पनी सञ्चालकहरू' : 'Business Details & Company Directors'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {isNe ? 'कम्पनीको आधिकारिक ठेगाना, प्यान तथा सञ्चालकहरूको ३ पुस्ते नामावली' : 'Official company address, PAN, and shareholders/directors'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">{isNe ? 'संस्था छान्नुहोस्:' : 'Select Entity:'}</span>
                    <select
                      value={selectedBizId || ''}
                      onChange={(e) => handleSelectBusiness(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#123B5D] focus:bg-white focus:border-[#18A999] focus:outline-none transition cursor-pointer"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (PAN: {b.pan_vat_number || 'N/A'})
                        </option>
                      ))}
                    </select>

                    <Link
                      href="/business/register"
                      className="inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-bold text-[#18A999] hover:bg-teal-50 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isNe ? 'थप्नुहोस्' : 'Add'}</span>
                    </Link>
                  </div>
                </div>

                {/* Business Section 1: Official Corporate Identity */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                    <span>🏢</span>
                    <span>{isNe ? '१. कम्पनी / फर्मको आधिकारिक विवरण (Corporate Info)' : '1. Corporate Info'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'कम्पनी / संस्थाको पूरा नाम *' : 'Company Name *'}
                      </label>
                      <NepaliInput
                        value={bizName}
                        onChange={(val) => setBizName(val)}
                        placeholder={isNe ? 'कम्पनीको पूरा नाम' : 'Company Name'}
                        isNe={isNe}
                        defaultNepaliMode={false}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'कम्पनी दर्ता नम्बर (Company Reg. No)' : 'Company Registration No'}
                      </label>
                      <input
                        type="text"
                        value={bizRegNo}
                        onChange={(e) => setBizRegNo(e.target.value)}
                        placeholder="उदा: १२३४५६/०७८/०७९"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'कम्पनी दर्ता मिति विसं (Reg Date BS)' : 'Registration Date (BS)'}
                      </label>
                      <NepaliDatePicker
                        value={bizRegDateBs}
                        onChange={(val) => setBizRegDateBs(val)}
                        placeholder={isNe ? 'मिति छान्नुहोस् (उदा: २०७८/०४/१५)' : 'Select Date (BS)'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'स्थायी लेखा नम्बर / PAN/VAT No.' : 'PAN / VAT Number'}
                      </label>
                      <input
                        type="text"
                        value={bizPan}
                        onChange={(e) => setBizPan(e.target.value)}
                        placeholder="उदा: 601234567"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'आधिकारिक इमेल (Official Email) *' : 'Official Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'आधिकारिक फोन नम्बर (Official Phone)' : 'Official Phone'}
                      </label>
                      <input
                        type="tel"
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        placeholder="०१-४XXXXXX वा ९८XXXXXXXX"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Section 2: Registered Office Address via CustomSelect */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                      <span>📍</span>
                      <span>{isNe ? '२. कम्पनीको दर्ता भएको रजिष्टर्ड कार्यालय ठेगाना' : '2. Registered Office Address'}</span>
                    </h3>

                    {formattedBusinessAddress && (
                      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#123B5D]">
                        <Building2 className="h-3.5 w-3.5 text-[#18A999]" />
                        <span>{formattedBusinessAddress}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Business Province */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'प्रदेश (Province) *' : 'Province *'}
                      </label>
                      <CustomSelect
                        value={bizProvince}
                        onChange={(val) => {
                          setBizProvince(val);
                          const matchP = provincesList.find((p) => p.name_ne === val || p.name_en === val);
                          setBizProvinceId(matchP ? matchP.id : null);
                          setBizDistrict('');
                          setBizDistrictId(null);
                          setBizMunicipality('');
                          setBizMunicipalityId(null);
                        }}
                        options={provinceOptions}
                        placeholder={isNe ? 'प्रदेश छान्नुहोस्...' : 'Select Province...'}
                        searchPlaceholder={isNe ? 'प्रदेश खोज्नुहोस्...' : 'Search province...'}
                        searchable={true}
                      />
                    </div>

                    {/* Business District */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'जिल्ला (District) *' : 'District *'}
                      </label>
                      <CustomSelect
                        value={bizDistrict}
                        onChange={(val) => {
                          setBizDistrict(val);
                          const matchD = allDistricts.find((d) => d.name_ne === val || d.name_en === val);
                          setBizDistrictId(matchD ? matchD.id : null);
                          setBizMunicipality('');
                          setBizMunicipalityId(null);
                        }}
                        options={bizDistrictOptions}
                        disabled={!bizProvince}
                        placeholder={isNe ? 'जिल्ला छान्नुहोस्...' : 'Select District...'}
                        searchPlaceholder={isNe ? 'जिल्ला खोज्नुहोस्...' : 'Search district...'}
                        searchable={true}
                      />
                    </div>

                    {/* Business Municipality */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'नगरपालिका / गाउँपालिका *' : 'Municipality *'}
                      </label>
                      <CustomSelect
                        value={bizMunicipality}
                        onChange={(val) => {
                          setBizMunicipality(val);
                          const matchD = allDistricts.find((d) => d.name_ne === bizDistrict || d.name_en === bizDistrict);
                          const matchM = matchD?.local_levels.find((m) => m.name_ne === val || m.name_en === val);
                          setBizMunicipalityId(matchM ? matchM.id : null);
                        }}
                        options={bizMuniOptions}
                        disabled={!bizDistrict}
                        placeholder={isNe ? 'नगरपालिका छान्नुहोस्...' : 'Select Municipality...'}
                        searchPlaceholder={isNe ? 'नगरपालिका खोज्नुहोस्...' : 'Search municipality...'}
                        searchable={true}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'वडा नम्बर (Ward Number)' : 'Ward Number'}
                      </label>
                      <CustomSelect
                        value={bizWard}
                        onChange={(val) => setBizWard(val)}
                        options={wardOptions}
                        placeholder={isNe ? 'वडा छान्नुहोस्...' : 'Select Ward...'}
                        searchPlaceholder={isNe ? 'वडा खोज्नुहोस्...' : 'Search ward...'}
                        searchable={true}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'टोल / मार्ग (Tole / Street)' : 'Tole / Street'}
                      </label>
                      <NepaliInput
                        value={bizTole}
                        onChange={(val) => setBizTole(val)}
                        placeholder="उदा: टेकु मार्ग, काठमाडौं"
                        isNe={isNe}
                        defaultNepaliMode={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Section 3: Authorized Signatory & Capital */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                    <span>✍️</span>
                    <span>{isNe ? '३. अधिकारप्राप्त हस्ताक्षरकर्ता तथा पूँजी विवरण' : '3. Signatory & Capital'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'हस्ताक्षरकर्ताको नाम (Signatory Name)' : 'Authorized Signatory Name'}
                      </label>
                      <NepaliInput
                        value={signatoryName}
                        onChange={(val) => setSignatoryName(val)}
                        placeholder={isNe ? 'अधिकारप्राप्त व्यक्तिको नाम' : 'Signatory full name'}
                        isNe={isNe}
                        defaultNepaliMode={false}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'हस्ताक्षरकर्ताको पद (Designation)' : 'Designation'}
                      </label>
                      <NepaliInput
                        value={signatoryDesignation}
                        onChange={(val) => setSignatoryDesignation(val)}
                        placeholder="उदा: प्रबन्ध सञ्चालक / अध्यक्ष"
                        isNe={isNe}
                        defaultNepaliMode={false}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'हस्ताक्षरकर्ताको नागरिकता नं.' : 'Signatory Citizenship No'}
                      </label>
                      <input
                        type="text"
                        value={signatoryCitizenship}
                        onChange={(e) => setSignatoryCitizenship(e.target.value)}
                        placeholder="उदा: २७-०१-७२-१२३४"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'जारी पूँजी (Issued Capital NPR)' : 'Issued Capital (NPR)'}
                      </label>
                      <input
                        type="text"
                        value={issuedCapital}
                        onChange={(e) => setIssuedCapital(e.target.value)}
                        placeholder="उदा: २५,००,०००"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isNe ? 'चुक्ता पूँजी (Paid-up Capital NPR)' : 'Paid-up Capital (NPR)'}
                      </label>
                      <input
                        type="text"
                        value={paidUpCapital}
                        onChange={(e) => setPaidUpCapital(e.target.value)}
                        placeholder="उदा: २५,००,०००"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#18A999] focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Section 4: Company Members / Directors List */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#18A999]" />
                        <span>{isNe ? '४. कम्पनीका सञ्चालक तथा शेयरधनीहरूको नामावली' : '4. Company Directors & Shareholders'}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isNe
                          ? 'कम्पनीका माइन्युट, प्रबन्धपत्र, नियमावली र निर्णय फारमहरूमा यो नामावली स्वतः भरिन्छ।'
                          : 'Used for auto-filling company minutes, board resolutions, MOA/AOA, and suites.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (showAddDirector) {
                          handleCancelDirector();
                        } else {
                          setShowAddDirector(true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#18A999] hover:bg-teal-100/70 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showAddDirector ? (isNe ? 'फारम बन्द गर्नुहोस्' : 'Close Form') : (isNe ? 'सदस्य थप्नुहोस्' : 'Add Member')}</span>
                    </button>
                  </div>

                  {/* Add / Edit Member Dropdown/Drawer form */}
                  {showAddDirector && (
                    <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                          {editingDirectorIndex !== null ? (
                            <>
                              <Pencil className="h-3.5 w-3.5 text-amber-600" />
                              <span>{isNe ? 'सञ्चालक / शेयरधनी विवरण सम्पादन:' : 'Edit Director / Shareholder Details:'}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 text-[#18A999]" />
                              <span>{isNe ? 'नयाँ सञ्चालक / शेयरधनीको विवरण:' : 'New Director / Shareholder Details:'}</span>
                            </>
                          )}
                        </div>
                        {editingDirectorIndex !== null && (
                          <button
                            type="button"
                            onClick={handleCancelDirector}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                          >
                            {isNe ? 'रद्द गर्नुहोस्' : 'Cancel Edit'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">{isNe ? 'पूरा नाम *' : 'Name *'}</label>
                          <NepaliInput
                            value={newDirName}
                            onChange={(val) => setNewDirName(val)}
                            placeholder={isNe ? 'सदस्यको नाम' : 'Director name'}
                            isNe={isNe}
                            defaultNepaliMode={false}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">{isNe ? 'पद *' : 'Designation *'}</label>
                          <CustomSelect
                            value={newDirDesignation}
                            onChange={(val) => setNewDirDesignation(val)}
                            options={designationOptions}
                            searchable={false}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">{isNe ? 'नागरिकता नं.' : 'Citizenship No'}</label>
                          <input
                            type="text"
                            value={newDirCitizenship}
                            onChange={(e) => setNewDirCitizenship(e.target.value)}
                            placeholder="२७-०१-७२-१२३४"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">{isNe ? 'फोन नम्बर' : 'Phone'}</label>
                          <input
                            type="tel"
                            value={newDirPhone}
                            onChange={(e) => setNewDirPhone(e.target.value)}
                            placeholder="९८XXXXXXXX"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">{isNe ? 'शेयर हिस्सा (%)' : 'Share %'}</label>
                          <input
                            type="text"
                            value={newDirShare}
                            onChange={(e) => setNewDirShare(e.target.value)}
                            placeholder="उदा: 50%"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                          />
                        </div>

                      </div>

                      {/* Director Address: NepalAddressPicker */}
                      <div className="pt-1">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {isNe ? 'स्थायी ठेगाना (प्रदेश, जिल्ला, पालिका, वडा) *' : 'Permanent Address (Province, District, Municipality, Ward)'}
                        </label>
                        <NepalAddressPicker
                          value={newDirAddress}
                          onChange={(val, structured) => {
                            setNewDirAddress(val);
                            if (structured) {
                              setNewDirAddressData(structured);
                            }
                          }}
                          placeholder={isNe ? 'प्रदेश, जिल्ला, पालिका र वडा छान्नुहोस्' : 'Select Province, District, Municipality and Ward'}
                          isNe={isNe}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        {editingDirectorIndex !== null && (
                          <button
                            type="button"
                            onClick={handleCancelDirector}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {isNe ? 'रद्द गर्नुहोस्' : 'Cancel'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleAddDirector}
                          disabled={!newDirName.trim()}
                          className="px-4 py-2 rounded-xl bg-[#18A999] text-xs font-bold text-white hover:bg-[#148C7E] disabled:opacity-50 transition cursor-pointer shadow-xs"
                        >
                          {editingDirectorIndex !== null
                            ? (isNe ? 'अपडेट गर्नुहोस् (Update)' : 'Update Member')
                            : (isNe ? 'सूचीमा थप्नुहोस् (Add to List)' : 'Add to List')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Directors Table */}
                  {directors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      {isNe ? 'कुनै सञ्चालक थपिएको छैन। माथिको "सदस्य थप्नुहोस्" बटन थिचेर थप्नुहोस्।' : 'No directors added yet. Click "Add Member" above.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">{isNe ? 'नाम' : 'Name'}</th>
                            <th className="p-3">{isNe ? 'पद' : 'Designation'}</th>
                            <th className="p-3">{isNe ? 'नागरिकता नं.' : 'Citizenship'}</th>
                            <th className="p-3">{isNe ? 'शेयर %' : 'Share %'}</th>
                            <th className="p-3">{isNe ? 'ठेगाना' : 'Address'}</th>
                            <th className="p-3 text-right">{isNe ? 'कार्य' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {directors.map((d, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50/80 transition ${editingDirectorIndex === idx ? 'bg-amber-50/60 font-medium' : ''}`}>
                              <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-[#123B5D]">{d.name}</td>
                              <td className="p-3">
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-teal-50 text-[#18A999] font-bold text-[11px] border border-teal-100">
                                  {d.designation}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-600">{d.citizenship_no || '—'}</td>
                              <td className="p-3 font-mono text-emerald-600 font-bold">{d.share_percent ? `${d.share_percent}%` : '—'}</td>
                              <td className="p-3 text-slate-600">{d.address || '—'}</td>
                              <td className="p-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditDirector(idx)}
                                    className="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-100/60 transition cursor-pointer"
                                    title={isNe ? 'सम्पादन गर्नुहोस्' : 'Edit'}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDirector(idx)}
                                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                    title={isNe ? 'हटाउनुहोस्' : 'Remove'}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Save Business Profile Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingBusiness}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition cursor-pointer shadow-md"
                    >
                      {savingBusiness ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>{savingBusiness ? (isNe ? 'सुरक्षित गर्दै...' : 'Saving...') : (isNe ? 'संस्थागत विवरण सुरक्षित गर्नुहोस्' : 'Save Business Details')}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: SECURITY & PASSWORD */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#123B5D]">
                  {isNe ? 'सुरक्षा तथा पासवर्ड परिवर्तन (Security & Password)' : 'Security & Password'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isNe ? 'आफ्नो खाताको सुरक्षाका लागि पासवर्ड परिवर्तन गर्नुहोस्' : 'Update your password regularly to keep your account safe'}
                </p>
              </div>
            </div>

            {pwdMsg && (
              <div
                className={`rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {pwdMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'हालको पासवर्ड (Current Password)' : 'Current Password'}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#18A999] focus:outline-none focus:ring-2 focus:ring-[#18A999]/20 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नयाँ पासवर्ड (New Password)' : 'New Password'}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#18A999] focus:outline-none focus:ring-2 focus:ring-[#18A999]/20 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isNe ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस् (Confirm)' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#18A999] focus:outline-none focus:ring-2 focus:ring-[#18A999]/20 font-mono transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition cursor-pointer shadow-md"
                >
                  {changingPassword ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  <span>{changingPassword ? (isNe ? 'परिवर्तन हुँदैछ...' : 'Updating...') : (isNe ? 'पासवर्ड परिवर्तन गर्नुहोस्' : 'Change Password')}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
