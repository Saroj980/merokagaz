'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, AdminUserItem, AdminUserStats, AdminUserDetail } from '@/lib/api';
import toast, { alertModal } from '@/lib/toast';
import { formatBsDate } from '@/lib/nepaliDate';
import { encodeUserId } from '@/lib/userCode';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  Shield,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  MoreVertical,
  X,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Check,
  ExternalLink,
  Lock,
  Key,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  // Stats & User List State
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Drawer / Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Portal mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load overall user stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.admin.users.stats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load users list with current filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.users.list(undefined, {
        role: roleFilter,
        status: statusFilter,
        search,
        page: currentPage,
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && (res as any).data) {
        setUsers((res as any).data);
        if ((res as any).meta) {
          setTotalPages((res as any).meta.last_page || 1);
          setTotalCount((res as any).meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error(isNe ? 'प्रयोगकर्ता विवरण लोड गर्न सकिएन।' : 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, currentPage, sortBy, sortDir, isNe]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // View User Profile Drawer
  const handleViewUser = async (id: number) => {
    setLoadingDetail(true);
    try {
      const detail = await api.admin.users.get(id);
      setSelectedUserDetail(detail);
    } catch (err) {
      toast.error(isNe ? 'विवरण लोड गर्न सकिएन।' : 'Failed to load user profile.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Toggle User Active / Suspended Status
  const handleToggleStatus = async (user: AdminUserItem) => {
    const nextStatus = !user.is_active;
    const confirmTitle = nextStatus
      ? isNe ? 'खाता पुनः सक्रिय गर्ने?' : 'Reactivate User Account?'
      : isNe ? 'खाता निलम्बन (Suspend) गर्ने?' : 'Suspend User Account?';

    const confirmMsg = nextStatus
      ? isNe ? `${user.name} को खाता पुनः सक्रिय हुनेछ र लगइन गर्न पाउनेछन्।` : `Allow ${user.name} to log in and use Mero Kagaz services.`
      : isNe ? `${user.name} को खाता निलम्बित हुनेछ र कुनै पनि सेवा प्रयोग गर्न पाउने छैनन्।` : `Prevent ${user.name} from logging in and generating legal documents.`;

    const ok = await alertModal.confirm(
      confirmTitle,
      confirmMsg,
      nextStatus ? (isNe ? 'सक्रिय गर्नुहोस्' : 'Activate') : (isNe ? 'निलम्बन गर्नुहोस्' : 'Suspend'),
      isNe ? 'रद्द' : 'Cancel'
    );

    if (!ok) return;

    setActionLoading(user.id);
    try {
      await api.admin.users.updateStatus(user.id, nextStatus);
      toast.success(
        nextStatus
          ? isNe ? 'प्रयोगकर्ता खाता सक्रिय गरियो।' : 'User account activated successfully.'
          : isNe ? 'प्रयोगकर्ता खाता निलम्बित गरियो।' : 'User account suspended.'
      );
      fetchUsers();
      fetchStats();
      if (selectedUserDetail && selectedUserDetail.user.id === user.id) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          user: { ...selectedUserDetail.user, is_active: nextStatus },
        });
      }
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'स्थिति परिवर्तन गर्न सकिएन।' : 'Failed to update user status.'));
    } finally {
      setActionLoading(null);
    }
  };

  // Change Role (e.g. promote to business or admin)
  const handleChangeRole = async (user: AdminUserItem, newRole: string) => {
    if (user.role === newRole) return;

    const ok = await alertModal.confirm(
      isNe ? 'भूमिका (Role) परिवर्तन गर्ने?' : 'Change Account Role?',
      isNe ? `${user.name} को भूमिका '${newRole}' मा परिवर्तन गरिनेछ।` : `Update ${user.name}'s role to '${newRole}'.`,
      isNe ? 'परिवर्तन गर्नुहोस्' : 'Update Role',
      isNe ? 'रद्द' : 'Cancel'
    );

    if (!ok) return;

    setActionLoading(user.id);
    try {
      await api.admin.users.updateRole(user.id, newRole);
      toast.success(isNe ? 'भूमिका सफलतापूर्वक अद्यावधिक गरियो।' : 'User role updated.');
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'भूमिका अद्यावधिक गर्न सकिएन।' : 'Failed to update user role.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserDetail) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error(isNe ? 'पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।' : 'Password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.admin.users.updatePassword(selectedUserDetail.user.id, newPassword);
      toast.success(
        isNe
          ? `${selectedUserDetail.user.name} को नयाँ पासवर्ड सफलतापूर्वक सेट भयो।`
          : `Password for ${selectedUserDetail.user.name} has been updated successfully.`
      );
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'पासवर्ड परिवर्तन गर्न सकिएन।' : 'Failed to update password.'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowNewPassword(true);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#123B5D]">
              {isNe ? 'प्रयोगकर्ता तथा खाता व्यवस्थापन' : 'User Accounts Management'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {isNe
                ? 'व्यक्तिगत नागरिक, व्यवसायिक संस्था र प्रशासकीय खाताहरूको निगरानी तथा नियन्त्रण'
                : 'Monitor, verify, and manage citizen and enterprise accounts registered on Mero Kagaz'}
            </p>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchUsers();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#123B5D] hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#18A999]' : ''}`} />
            <span>{isNe ? 'ताजा गर्नुहोस्' : 'Refresh'}</span>
          </button>
        </div>

        {/* ─── Metric Stat Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Accounts */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">
                {isNe ? 'कुल दर्ता खाताहरू' : 'Total Accounts'}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-[#18A999]">
                <Users className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#123B5D]">
                {stats?.total_users ?? 0}
              </span>
              {stats?.new_this_month ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +{stats.new_this_month} {isNe ? 'यो महिना' : 'this month'}
                </span>
              ) : null}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isNe ? 'प्रणालीमा सक्रिय तथा निष्क्रिय नागरिक' : 'Active and inactive registered identities'}
            </div>
          </div>

          {/* Card 2: Individual Citizens */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">
                {isNe ? 'व्यक्तिगत खाताहरू' : 'Individual Citizens'}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <UserCheck className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-700">
                {stats?.individual_count ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{isNe ? 'नागरिक' : 'citizens'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isNe ? 'व्यक्तिगत कानूनी कागजात बनाउने खाताहरू' : 'Personal legal forms and tax filings'}
            </div>
          </div>

          {/* Card 3: Business Enterprises */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">
                {isNe ? 'दर्ता व्यवसायहरू' : 'Businesses & Orgs'}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {stats?.total_businesses ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{isNe ? 'कम्पनीहरू' : 'enterprises'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isNe ? 'PAN / VAT दर्ता र कम्पनी खाताहरू' : 'Corporate accounts generating resolutions'}
            </div>
          </div>

          {/* Card 4: Account Health */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">
                {isNe ? 'खाता सुरक्षा स्थिति' : 'Account Health'}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Shield className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{stats?.active_count ?? 0} {isNe ? 'सक्रिय' : 'Active'}</span>
              </div>
              {stats?.inactive_count ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>{stats.inactive_count} {isNe ? 'निलम्बित' : 'Suspended'}</span>
                </div>
              ) : null}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats?.admin_count ?? 1} {isNe ? 'प्रशासक (Super Admins)' : 'Super Admin accounts'}
            </div>
          </div>
        </div>

        {/* ─── Filter & Search Bar ─── */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isNe ? 'नाम, इमेल वा फोन नम्बर खोज्नुहोस्...' : 'Search by name, email, or phone...'}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#18A999] focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="w-40 sm:w-44">
              <CustomSelect
                value={roleFilter}
                onChange={(val) => setRoleFilter(val)}
                searchable={false}
                options={[
                  { value: 'all', label: isNe ? 'सबै भूमिकाहरू' : 'All Roles' },
                  { value: 'user', label: isNe ? 'व्यक्तिगत (Citizen)' : 'Citizen', badge: isNe ? 'नागरिक' : 'Citizen' },
                  { value: 'business', label: isNe ? 'व्यवसाय (Business)' : 'Business', badge: isNe ? 'संस्था' : 'Business' },
                  { value: 'admin', label: isNe ? 'प्रशासक (Admin)' : 'Admin', badge: 'Admin' },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="w-38 sm:w-42">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                searchable={false}
                options={[
                  { value: 'all', label: isNe ? 'सबै स्थिति' : 'All Status' },
                  { value: 'active', label: isNe ? 'सक्रिय (Active)' : 'Active', badge: 'Active' },
                  { value: 'inactive', label: isNe ? 'निलम्बित (Suspended)' : 'Suspended', badge: 'Suspended' },
                ]}
              />
            </div>

            {/* Sort Order */}
            <div className="w-44 sm:w-48">
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                searchable={false}
                options={[
                  { value: 'created_at', label: isNe ? 'दर्ता मिति (Latest)' : 'Registered Date' },
                  { value: 'name', label: isNe ? 'नाम अनुसार (Name)' : 'User Name' },
                  { value: 'orders_count', label: isNe ? 'कागजात अर्डर (Orders)' : 'Orders Count' },
                  { value: 'total_spent', label: isNe ? 'कुल खर्च (Total Spent)' : 'Total Spent' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ─── Users Table ─── */}
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
                  <th className="py-3.5 px-6">{isNe ? 'प्रयोगकर्ता' : 'User Details'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'भूमिका' : 'Role'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'इमेल स्थिति' : 'Verification'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'अर्डर / खर्च' : 'Orders & Spending'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'दर्ता मिति (B.S.)' : 'Joined Date'}</th>
                  <th className="py-3.5 px-4">{isNe ? 'स्थिति' : 'Status'}</th>
                  <th className="py-3.5 px-6 text-right">{isNe ? 'कार्यहरू' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#18A999] mb-2" />
                      <span>{isNe ? 'प्रयोगकर्ताहरू लोड हुँदैछन्...' : 'Loading user accounts...'}</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">{isNe ? 'कुनै प्रयोगकर्ता भेटिएन।' : 'No users match the criteria.'}</p>
                      <p className="text-[11px] mt-0.5">{isNe ? 'खोज शब्द वा फिल्टर परिवर्तन गर्नुहोस्।' : 'Try adjusting your search or filters.'}</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const initials = u.name
                      ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'U';

                    return (
                      <tr key={u.id} className="hover:bg-teal-50/20 transition-colors">
                        {/* Name & Contact */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#123B5D] to-[#18A999] text-white font-black text-xs shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.role === 'admin' ? (
                                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                    ADMIN
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                                <span className="truncate">{u.email}</span>
                                {u.phone ? <span>• {u.phone}</span> : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                              <Shield className="h-3 w-3" />
                              <span>{isNe ? 'प्रशासक' : 'Admin'}</span>
                            </span>
                          ) : u.role === 'business' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl">
                              <Building2 className="h-3 w-3" />
                              <span>{isNe ? 'व्यवसाय' : 'Business'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                              <span>{isNe ? 'व्यक्तिगत' : 'Citizen'}</span>
                            </span>
                          )}
                        </td>

                        {/* Email Verification */}
                        <td className="py-3.5 px-4">
                          {u.email_verified_at ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <span>{isNe ? 'सत्यापित' : 'Verified'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <XCircle className="h-3 w-3 text-amber-500" />
                              <span>{isNe ? 'अपुष्ट' : 'Unverified'}</span>
                            </span>
                          )}
                        </td>

                        {/* Orders & Spent */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-mono">
                            NPR {Number(u.total_spent || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.orders_count || 0} {isNe ? 'कागजात अर्डर' : 'orders'}
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700 font-outfit">
                            {formatBsDate(u.created_at, 'DD MMMM YYYY', isNe ? 'ne' : 'en')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Status (Active / Suspended) */}
                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{isNe ? 'सक्रिय' : 'Active'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>{isNe ? 'निलम्बित' : 'Suspended'}</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Full Screen Page */}
                            <Link
                              href={`/admin/users/${u.public_id || encodeUserId(u.id)}`}
                              title={isNe ? 'विस्तृत रिपोर्ट तथा विवरण' : 'Full User Record & Date-wise Reports'}
                              className="inline-flex items-center justify-center h-8 px-2.5 gap-1 rounded-xl border border-teal-200 bg-teal-50/80 text-teal-700 hover:bg-teal-100 transition-colors shadow-2xs font-bold text-[11px]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>{isNe ? 'रिपोर्ट' : 'Report'}</span>
                            </Link>

                            {/* View Details Drawer Button */}
                            <button
                              onClick={() => handleViewUser(u.id)}
                              title={isNe ? 'द्रुत विवरण' : 'Quick Drawer Preview'}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#18A999] hover:border-teal-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Status Toggle Button (Except self) */}
                            <button
                              onClick={() => handleToggleStatus(u.id === 1 ? u : u)}
                              disabled={actionLoading === u.id || u.role === 'admin'}
                              title={
                                u.is_active
                                  ? isNe ? 'निलम्बन गर्नुहोस्' : 'Suspend Account'
                                  : isNe ? 'सक्रिय गर्नुहोस्' : 'Reactivate Account'
                              }
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-xl border transition-colors shadow-2xs cursor-pointer ${
                                u.is_active
                                  ? 'border-rose-200 bg-rose-50/70 text-rose-600 hover:bg-rose-100'
                                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-600 hover:bg-emerald-100'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── User Profile Slide-over Drawer (Portaled to document.body) ─── */}
        {mounted && selectedUserDetail ? createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-admin-page-in">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#123B5D] text-white font-black text-sm">
                    {selectedUserDetail.user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-[#123B5D]">
                      {selectedUserDetail.user.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      User Code: {selectedUserDetail.user.public_id || encodeUserId(selectedUserDetail.user.id)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users/${selectedUserDetail.user.public_id || encodeUserId(selectedUserDetail.user.id)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition shadow-2xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                    <span>{isNe ? 'पूरा रिपोर्ट हेर्नुहोस्' : 'Full Report'}</span>
                  </Link>

                  <button
                    onClick={() => setSelectedUserDetail(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Account Status Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {isNe ? 'खाता स्थिति' : 'Account Status'}
                    </div>
                    <div className="text-sm font-extrabold text-[#123B5D] mt-0.5 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${selectedUserDetail.user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{selectedUserDetail.user.is_active ? (isNe ? 'सक्रिय खाता' : 'Active Account') : (isNe ? 'निलम्बित' : 'Suspended')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {isNe ? 'कुल खर्च' : 'Lifetime Spent'}
                    </div>
                    <div className="text-base font-black text-emerald-600 font-mono">
                      NPR {selectedUserDetail.total_spent.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Profile Overview */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit">
                    {isNe ? 'सम्पर्क तथा परिचय' : 'Contact & Identity'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 font-semibold">{isNe ? 'इमेल ठेगाना' : 'Email Address'}</div>
                      <div className="font-bold text-slate-900 mt-0.5 break-all font-mono">
                        {selectedUserDetail.user.email}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 font-semibold">{isNe ? 'फोन नम्बर' : 'Phone Number'}</div>
                      <div className="font-bold text-slate-900 mt-0.5 font-mono">
                        {selectedUserDetail.user.phone || (isNe ? 'उपलब्ध छैन' : 'Not Provided')}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 font-semibold">{isNe ? 'भूमिका' : 'Role'}</div>
                      <div className="font-bold text-slate-900 mt-0.5 capitalize">
                        {selectedUserDetail.user.role}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 font-semibold">{isNe ? 'दर्ता मिति' : 'Joined Date'}</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {formatBsDate(selectedUserDetail.user.created_at, 'DD MMMM YYYY', isNe ? 'ne' : 'en')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password / Security Quick Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {isNe ? 'प्रयोगकर्ता पासवर्ड' : 'Account Password'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isNe ? 'प्रशासक द्वारा नयाँ पासवर्ड सेट गर्नुहोस्' : 'Reset or set new credential as admin'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewPassword('');
                      setShowNewPassword(false);
                      setShowPasswordModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition cursor-pointer shadow-2xs"
                  >
                    <Key className="h-3.5 w-3.5 text-amber-600" />
                    <span>{isNe ? 'पासवर्ड परिवर्तन' : 'Change Password'}</span>
                  </button>
                </div>

                {/* Owned Businesses */}
                {selectedUserDetail.user.ownedBusinesses && selectedUserDetail.user.ownedBusinesses.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit flex items-center justify-between">
                      <span>{isNe ? 'स्वामित्व भएका व्यवसायहरू' : 'Owned Business Accounts'}</span>
                      <span className="text-teal-600">{selectedUserDetail.user.ownedBusinesses.length}</span>
                    </h3>

                    <div className="space-y-2">
                      {selectedUserDetail.user.ownedBusinesses.map((b) => (
                        <div key={b.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Building2 className="h-4 w-4 text-[#18A999]" />
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{b.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">PAN: {b.pan_vat_number || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Recent Orders List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit flex items-center justify-between">
                    <span>{isNe ? 'हालैका अर्डरहरू' : 'Recent Document Orders'}</span>
                    <span className="text-teal-600">{selectedUserDetail.user.orders?.length || 0}</span>
                  </h3>

                  {!selectedUserDetail.user.orders || selectedUserDetail.user.orders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-slate-50 border border-slate-100">
                      {isNe ? 'कुनै कागजात अर्डर गरिएको छैन।' : 'No document orders placed yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedUserDetail.user.orders.map((o) => (
                        <div key={o.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">
                              {isNe ? (o.document?.name_np || o.document?.name || 'Document') : (o.document?.name || 'Document')}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              #{o.order_number} • {new Date(o.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-900 font-mono">
                              NPR {Number(o.total).toLocaleString()}
                            </div>
                            <div className={`text-[10px] font-bold ${o.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {o.payment_status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions - Fixed above screen bottom */}
              <div className="border-t border-slate-200 p-4 pb-6 bg-white flex items-center justify-between gap-3 shrink-0 shadow-lg">
                <button
                  onClick={() => handleToggleStatus(selectedUserDetail.user)}
                  disabled={selectedUserDetail.user.role === 'admin'}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    selectedUserDetail.user.is_active
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {selectedUserDetail.user.is_active
                    ? isNe ? 'खाता निलम्बन गर्नुहोस्' : 'Suspend Account'
                    : isNe ? 'खाता पुनः सक्रिय गर्नुहोस्' : 'Reactivate Account'}
                </button>

                <button
                  onClick={() => {
                    setNewPassword('');
                    setShowNewPassword(false);
                    setShowPasswordModal(true);
                  }}
                  className="py-2.5 px-3.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>{isNe ? 'पासवर्ड' : 'Password'}</span>
                </button>

                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {isNe ? 'बन्द' : 'Close'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        ) : null}

        {/* ─── Change Password Modal (Portaled to document.body) ─── */}
        {mounted && showPasswordModal && selectedUserDetail ? createPortal(
          <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-admin-page-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#123B5D]">
                      {isNe ? 'प्रयोगकर्ता पासवर्ड परिवर्तन' : 'Change User Password'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedUserDetail.user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {isNe ? 'नयाँ पासवर्ड (New Password)' : 'New Password'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-[#18A999] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{isNe ? 'स्वतः जेनेरेट गर्नुहोस्' : 'Auto Generate'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isNe ? 'नयाँ पासवर्ड (कम्तीमा ६ अक्षर)' : 'Min. 6 characters'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#18A999] focus:outline-none focus:ring-2 focus:ring-[#18A999]/20 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
                  {isNe
                    ? '⚠️ पासवर्ड परिवर्तन भएपछि प्रयोगकर्ताको पहिले सक्रिय भएका सबै लगइन सेसनहरू स्वतः समाप्त हुनेछन्।'
                    : '⚠️ Once updated, all active login sessions for this account will be revoked immediately.'}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {isNe ? 'रद्द' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#123B5D] to-[#18A999] text-white hover:opacity-95 disabled:opacity-50 transition cursor-pointer shadow-md"
                  >
                    {updatingPassword ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{isNe ? 'पासवर्ड सुरक्षित गर्नुहोस्' : 'Save Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        ) : null}
      </div>
    </AdminShell>
  );
}
