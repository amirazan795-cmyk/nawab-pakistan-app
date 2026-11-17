import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  Lock,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  AdminPublicConfig,
  BlueTickRequest,
  Product,
  SellerIdProof,
  SellerProfile,
  SellerType,
  UserRecord,
} from '../types';
import { NAWABI_CATEGORIES, matchesProductCategory } from '../data/categories';
import { NawabLogoBadge } from './NawabLogo';
import { SellerTypeBadge } from './SellerTypeBadge';
import {
  DEFAULT_PUBLIC_CONFIG,
  adminApproveBlueTick,
  adminApproveIdProof,
  adminDeleteListing,
  adminRejectBlueTick,
  adminRejectIdProof,
  adminSetUserBlocked,
  subscribeAdminCollections,
  updateAdminPassword,
  verifyAdminPassword,
} from '../services/adminFirebaseService';
import { normalizePhoneDigits } from '../utils/adminCrypto';
import { getAdExpiryInfo } from '../utils/adExpiry';

type HiddenAdminTab = 'bluetick' | 'users' | 'id_pending' | 'listings' | 'security';

interface HiddenAdminPortalProps {
  isUnlocked: boolean;
  onUnlocked: () => void;
  onClose: () => void;
}

export const HiddenAdminPortal: React.FC<HiddenAdminPortalProps> = ({
  isUnlocked,
  onUnlocked,
  onClose,
}) => {
  const [adminPhoneLoggedIn, setAdminPhoneLoggedIn] = useState<string>('');

  // Admin Login Password State
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Live Firebase Collections State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [blueTickRequests, setBlueTickRequests] = useState<BlueTickRequest[]>([]);
  const [idProofs, setIdProofs] = useState<Record<string, SellerIdProof>>({});
  const [publicConfig, setPublicConfig] = useState<AdminPublicConfig>(DEFAULT_PUBLIC_CONFIG);

  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState<HiddenAdminTab>('bluetick');
  const [userFilter, setUserFilter] = useState<'all' | 'sellers' | 'blocked'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [listingSearch, setListingSearch] = useState('');
  const [listingCatFilter, setListingCatFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Lightbox / Inspection modals
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [inspectingSellerId, setInspectingSellerId] = useState<string | null>(null);

  // Security Settings Form State (Change 6-Digit PIN)
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinNewPhone, setPinNewPhone] = useState('');
  const [pinBusy, setPinBusy] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem('nawab_hidden_admin_session');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    const unsub = subscribeAdminCollections({
      onUsers: setUsers,
      onSellers: setSellers,
      onProducts: setProducts,
      onBlueTickRequests: setBlueTickRequests,
      onIdProofs: setIdProofs,
      onPublicConfig: setPublicConfig,
    });
    return () => unsub();
  }, [isUnlocked]);

  const showToast = (msg: string) => {
    setErrorNotice(null);
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const showErr = (msg: string) => {
    setNotice(null);
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 5000);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await verifyAdminPassword(loginPassword);
      if (!res.ok) {
        setLoginError(res.error || 'Wrong Password');
        setLoginBusy(false);
        return;
      }
      setAdminPhoneLoggedIn(res.adminPhone || '');
      setLoginPassword('');
      onUnlocked();
    } catch {
      setLoginError('Verify karte waqt masla aaya. Dobara koshish karein.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleAdminLogout = () => {
    setLoginPassword('');
    setLoginError('');
    onClose();
  };

  const isAfterSixMonths = useMemo(() => {
    const start = new Date(
      publicConfig.blueTickOfferStartIso || DEFAULT_PUBLIC_CONFIG.blueTickOfferStartIso
    );
    if (Number.isNaN(start.getTime())) return false;
    const switchDate = new Date(start);
    switchDate.setMonth(switchDate.getMonth() + 6);
    return Date.now() >= switchDate.getTime();
  }, [publicConfig.blueTickOfferStartIso]);

  const currentBlueTickPrice = isAfterSixMonths ? 5000 : 2000;

  // Compute unique Total Users across users + sellers collections by phone
  const mergedUsersList = useMemo(() => {
    const byPhone = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        role: 'buyer' | 'seller';
        sellerType?: SellerType;
        location: string;
        isBlocked: boolean;
        hasBlueTick: boolean;
        idStatus: 'none' | 'pending' | 'verified';
        lastLoginAt: string;
      }
    >();

    users.forEach((u) => {
      const key = normalizePhoneDigits(u.phone) || u.id;
      byPhone.set(key, {
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        location: [u.area, u.city].filter(Boolean).join(', ') || 'Pakistan',
        isBlocked: !!u.isBlocked,
        hasBlueTick: false,
        idStatus: 'none',
        lastLoginAt: u.lastLoginAt || u.createdAtIso || '',
      });
    });

    sellers.forEach((s) => {
      const key = normalizePhoneDigits(s.phone) || s.id;
      const existing = byPhone.get(key);
      const proof = idProofs[s.id];
      const idStatus = proof?.status || s.idVerificationStatus || 'none';
      byPhone.set(key, {
        id: existing?.id || s.id,
        name: s.shopName || s.name || existing?.name || 'Seller',
        phone: s.phone || existing?.phone || '',
        role: 'seller',
        sellerType: s.sellerType || proof?.sellerType,
        location: s.location || existing?.location || 'Pakistan',
        isBlocked: !!(s.isBlocked || existing?.isBlocked),
        hasBlueTick: !!(s.hasBlueTick || s.blueTickStatus === 'verified'),
        idStatus,
        lastLoginAt: s.lastLoginAt || existing?.lastLoginAt || '',
      });
    });

    return Array.from(byPhone.values());
  }, [users, sellers, idProofs]);

  const totalUsersCount = mergedUsersList.length;
  const totalSellersCount = sellers.length;
  const pendingBlueTickReqs = useMemo(
    () => blueTickRequests.filter((r) => r.status === 'pending'),
    [blueTickRequests]
  );
  const pendingIdProofs = useMemo(
    () => Object.values(idProofs).filter((p) => p.status === 'pending'),
    [idProofs]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return mergedUsersList.filter((u) => {
      if (userFilter === 'sellers' && u.role !== 'seller') return false;
      if (userFilter === 'blocked' && !u.isBlocked) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
      );
    });
  }, [mergedUsersList, userFilter, userSearch]);

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (
        listingCatFilter !== 'All' &&
        !matchesProductCategory(p.category, listingCatFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.sellerName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, listingSearch, listingCatFilter]);

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinNew.trim() !== pinConfirm.trim()) {
      showErr('Naya Password aur Confirm Password match nahi kar rahe.');
      return;
    }
    setPinBusy(true);
    try {
      const res = await updateAdminPassword(pinCurrent, pinNew, pinNewPhone || undefined);
      if (!res.ok) {
        showErr(res.error || 'Password update fail ho gaya.');
        return;
      }
      if (pinNewPhone.trim()) {
        setAdminPhoneLoggedIn(pinNewPhone.trim());
      }
      setPinCurrent('');
      setPinNew('');
      setPinConfirm('');
      setPinNewPhone('');
      showToast('Admin Password successfully updated in Firebase!');
    } catch {
      showErr('Password update karne me error aaya.');
    } finally {
      setPinBusy(false);
    }
  };

  // =========================================================================
  // ADMIN LOGIN PAGE (OPENED ONLY VIA SECRET /admin URL)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-sm w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-amber-400/60 space-y-5">
          <div className="flex items-center gap-3">
            <NawabLogoBadge size="md" />
            <div>
              <h1 className="text-xl font-black text-emerald-950 tracking-tight leading-tight">
                Admin Login
              </h1>
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>NAWAB Control Panel</span>
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-3 rounded-xl">
                {loginError}
              </div>
            )}

            <div>
              <label
                htmlFor="nawab-admin-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Admin Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nawab-admin-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginError('');
                    setLoginPassword(e.target.value);
                  }}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 focus:outline-emerald-700 text-base font-bold bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginBusy || !loginPassword.trim()}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{loginBusy ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED HIDDEN ADMIN PANEL (IN-APP AFTER PIN UNLOCK)
  // =========================================================================
  const inspectingProof = inspectingSellerId ? idProofs[inspectingSellerId] : undefined;
  const inspectingSeller = inspectingSellerId
    ? sellers.find((s) => s.id === inspectingSellerId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Hidden Admin Header */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <NawabLogoBadge size="sm" />
            <div className="leading-tight">
              <span className="font-black text-sm sm:text-base text-white block">
                NAWAB Owner Control
              </span>
              <span className="text-[10px] text-amber-300 font-bold block">
                PIN Protected Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminPhoneLoggedIn && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-900 border border-emerald-700 px-2.5 py-1 rounded-lg text-[11px] font-mono text-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {adminPhoneLoggedIn}
              </span>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock &amp; Exit</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="bg-white border-t border-slate-200 text-slate-700">
          <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('bluetick')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bluetick'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <BadgeCheck className="w-4 h-4" />
              <span>Blue Tick Requests ({pendingBlueTickReqs.length} Pending)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users &amp; Sellers ({totalUsersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('id_pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'id_pending'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>ID Pending ({pendingIdProofs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Listings ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-5 space-y-5">
        {notice && (
          <div className="bg-emerald-700 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{notice}</span>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="bg-red-600 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-200 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{errorNotice}</span>
            </div>
            <button type="button" onClick={() => setErrorNotice(null)} className="text-xs font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* LIVE STATS CARDS FROM FIREBASE */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Users</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5 tabular-nums">
              {totalUsersCount}
            </div>
            <span className="text-[11px] text-slate-500 block">Buyers &amp; Sellers (Firebase)</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Sellers</span>
              <Store className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1.5 tabular-nums">
              {totalSellersCount}
            </div>
            <span className="text-[11px] text-slate-500 block">Registered Shops</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">Blue Tick Requests</span>
              <BadgeCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1.5 tabular-nums">
              {blueTickRequests.length}
            </div>
            <span className="text-[11px] text-blue-700 font-semibold block">
              {pendingBlueTickReqs.length} Pending · Rs {currentBlueTickPrice.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Listings</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5 tabular-nums">
              {products.length}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Live across {NAWABI_CATEGORIES.length} Home Service Categories
            </span>
          </div>
        </section>

        {/* TAB 1: BLUE TICK REQUESTS WITH JAZZCASH SCREENSHOT */}
        {activeTab === 'bluetick' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Blue Tick Requests &amp; JazzCash Screenshots
                </h2>
                <p className="text-xs text-slate-500">
                  Screenshot aur TID verify karke Approve / Reject Blue Tick karein
                </p>
              </div>
              <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                {pendingBlueTickReqs.length} Pending
              </span>
            </div>

            {blueTickRequests.length === 0 ? (
              <div className="p-10 text-center text-xs sm:text-sm text-slate-500">
                Abhi koi Blue Tick request Firebase me nahi aayi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {blueTickRequests.map((req) => {
                  const proof = idProofs[req.sellerId];
                  return (
                    <div
                      key={req.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* JazzCash Screenshot Thumbnail */}
                        {req.screenshot ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                title: `JazzCash Screenshot - ${req.shopName || req.sellerName} (TID: ${req.tid})`,
                                url: req.screenshot!,
                              })
                            }
                            className="w-20 h-20 rounded-xl border-2 border-blue-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer group relative"
                            title="Click to enlarge JazzCash Screenshot"
                          >
                            <img
                              src={req.screenshot}
                              alt="JazzCash Screenshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold py-0.5 text-center">
                              Zoom
                            </span>
                          </button>
                        ) : (
                          <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center p-1 shrink-0">
                            No Screenshot
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-extrabold text-slate-900">
                              {req.shopName || req.sellerName}
                            </strong>
                            <span className="text-xs font-mono text-slate-600">{req.phone}</span>
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
                              TID: {req.tid}
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                              Rs {req.fee}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Submitted: {req.createdAt}</span>
                            <span>
                              ID Card:{' '}
                              <strong
                                className={
                                  proof?.status === 'verified'
                                    ? 'text-emerald-700'
                                    : proof?.status === 'pending'
                                    ? 'text-amber-700'
                                    : 'text-slate-500'
                                }
                              >
                                {proof?.status === 'verified'
                                  ? 'Verified'
                                  : proof?.status === 'pending'
                                  ? 'Pending'
                                  : 'Not Uploaded'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {proof && (proof.frontPhoto || proof.backPhoto) && (
                          <button
                            type="button"
                            onClick={() => setInspectingSellerId(req.sellerId)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View ID</span>
                          </button>
                        )}

                        {req.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                await adminApproveBlueTick(req);
                                showToast(`${req.shopName || req.sellerName} Blue Tick Approved!`);
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Blue Tick</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await adminRejectBlueTick(req);
                                showToast(`Blue Tick request rejected.`);
                              }}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : req.status === 'approved' ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <BadgeCheck className="w-4 h-4" /> Approved
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: USERS & SELLERS WITH BLOCK USER BUTTON */}
        {activeTab === 'users' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    userFilter === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  All Users ({totalUsersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter('sellers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    userFilter === 'sellers' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Sellers Only ({totalSellersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter('blocked')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    userFilter === 'blocked' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Blocked ({mergedUsersList.filter((u) => u.isBlocked).length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user or mobile..."
                  className="w-full pl-9 pr-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                Koi user nahi mila.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <div
                    key={`${u.id}-${u.phone}`}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      u.isBlocked ? 'bg-red-50/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-extrabold text-slate-900">{u.name}</strong>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'seller'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.role === 'seller' && <SellerTypeBadge sellerType={u.sellerType} />}
                        {u.hasBlueTick && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" /> Blue Tick
                          </span>
                        )}
                        {u.isBlocked && (
                          <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-mono font-semibold text-slate-800">{u.phone}</span>
                        <span>{u.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextBlock = !u.isBlocked;
                          await adminSetUserBlocked(u.phone, nextBlock, u.id);
                          showToast(
                            nextBlock
                              ? `${u.name} (${u.phone}) ko Block kar diya gaya.`
                              : `${u.name} (${u.phone}) ko Unblock kar diya gaya.`
                          );
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          u.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{u.isBlocked ? 'Unblock User' : 'Block User'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: ID VERIFICATION PENDING */}
        {activeTab === 'id_pending' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                One-Time Seller ID Verification ({pendingIdProofs.length} Pending)
              </h2>
              <p className="text-xs text-slate-500">
                1-Time Verification ke baad sellers foran Ads post kar sakte hain · Yahan Shop/Work photo aur ID check karein
              </p>
            </div>

            {pendingIdProofs.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                Abhi koi ID verification pending nahi hai.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingIdProofs.map((proof) => (
                  <div
                    key={proof.sellerId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/30"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-extrabold text-slate-900">
                          {proof.shopName || proof.sellerName}
                        </strong>
                        <SellerTypeBadge sellerType={proof.sellerType} />
                        <span className="text-xs font-mono text-slate-600">{proof.sellerPhone}</span>
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ID Pending
                        </span>
                      </div>

                      {proof.location && (
                        <p className="text-xs text-slate-600">
                          <strong>{proof.sellerType === 'home' ? 'Area:' : 'Shop Location:'}</strong>{' '}
                          {proof.location}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-2">
                        {proof.sellerPhoto && (
                          <img
                            src={proof.sellerPhoto}
                            alt={proof.sellerType === 'home' ? 'Work Photo' : 'Shop Photo'}
                            onClick={() =>
                              setPreviewImage({
                                title: `${proof.shopName || proof.sellerName} - ${
                                  proof.sellerType === 'home' ? 'Work Photo' : 'Shop Photo'
                                }`,
                                url: proof.sellerPhoto!,
                              })
                            }
                            className="w-20 h-16 object-cover rounded-lg border-2 border-emerald-300 cursor-pointer"
                            title={proof.sellerType === 'home' ? 'Work Photo' : 'Shop Photo'}
                          />
                        )}
                        {proof.frontPhoto && (
                          <img
                            src={proof.frontPhoto}
                            alt="ID Front"
                            onClick={() =>
                              setPreviewImage({
                                title: `${proof.sellerName} - ID Front`,
                                url: proof.frontPhoto!,
                              })
                            }
                            className="w-24 h-16 object-cover rounded-lg border border-slate-300 cursor-pointer"
                          />
                        )}
                        {proof.backPhoto && (
                          <img
                            src={proof.backPhoto}
                            alt="ID Back"
                            onClick={() =>
                              setPreviewImage({
                                title: `${proof.sellerName} - ID Back`,
                                url: proof.backPhoto!,
                              })
                            }
                            className="w-24 h-16 object-cover rounded-lg border border-slate-300 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={async () => {
                          await adminApproveIdProof(proof.sellerId);
                          showToast(`${proof.sellerName} ID Verified!`);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve ID</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminRejectIdProof(proof.sellerId);
                          showToast(`${proof.sellerName} ID Rejected.`);
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: ALL LISTINGS */}
        {activeTab === 'listings' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  All Live Ads in Firebase ({filteredListings.length})
                </h2>
                <p className="text-xs text-slate-500">
                  No Ad Approval Required · Har Ad foran live hota hai · Admin sirf Wrong Ad Delete ya User Block kar sakta hai
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search title or seller..."
                    className="w-full pl-9 pr-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <select
                  value={listingCatFilter}
                  onChange={(e) => setListingCatFilter(e.target.value)}
                  className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="All">
                    All {NAWABI_CATEGORIES.length} Categories ({products.length})
                  </option>
                  {NAWABI_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                Koi listing nahi mili.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredListings.map((p) => {
                  const expiry = getAdExpiryInfo(p);
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        expiry.isExpired ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate">{p.title}</h4>
                            <SellerTypeBadge sellerType={p.sellerType} />
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                expiry.isExpired
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {expiry.isExpired ? 'Expired · Hidden' : expiry.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600">
                            <span className="font-bold text-emerald-700">
                              Rs {p.price.toLocaleString()}
                            </span>
                            <span>·</span>
                            <span>{p.category}</span>
                            <span>·</span>
                            <span>
                              Seller: {p.sellerName} ({p.sellerPhone})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await adminDeleteListing(p.id);
                            showToast(`Ad "${p.title}" deleted from Firebase.`);
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Ad</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await adminSetUserBlocked(p.sellerPhone || '', true, p.sellerId);
                            showToast(`${p.sellerName} ko Block kar diya gaya.`);
                          }}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Block Seller</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: ADMIN SECURITY - CHANGE PASSWORD */}
        {activeTab === 'security' && (
          <section className="max-w-lg mx-auto">
            {/* Change Admin Password */}
            <form
              onSubmit={handleSaveNewPin}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Change Admin Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sirf Admin apna password change kar sakta hai (minimum 4 characters)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pinCurrent}
                  onChange={(e) => setPinCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={pinNew}
                    onChange={(e) => setPinNew(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Login Number (Optional update)
                </label>
                <input
                  type="tel"
                  value={pinNewPhone}
                  onChange={(e) => setPinNewPhone(e.target.value)}
                  placeholder={adminPhoneLoggedIn || '03181563300'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono font-bold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={pinBusy}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                {pinBusy ? 'Saving Password...' : 'Update Admin Password'}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Full Screenshot Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {previewImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ID Card Inspection Modal */}
      {inspectingSellerId && inspectingProof && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {inspectingSeller?.shopName || inspectingProof.shopName || inspectingProof.sellerName}
                  </h3>
                  <SellerTypeBadge sellerType={inspectingProof.sellerType || inspectingSeller?.sellerType} />
                </div>
                <p className="text-xs font-mono text-slate-500">{inspectingProof.sellerPhone}</p>
                {inspectingProof.location && (
                  <p className="text-xs text-slate-600">{inspectingProof.location}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectingSellerId(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inspectingProof.sellerPhoto && (
                <div className="sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    {inspectingProof.sellerType === 'home' ? 'Work Photo' : 'Shop Photo'}
                  </span>
                  <img
                    src={inspectingProof.sellerPhoto}
                    alt={inspectingProof.sellerType === 'home' ? 'Work Photo' : 'Shop Photo'}
                    className="w-full h-44 object-cover rounded-xl border border-emerald-300"
                  />
                </div>
              )}
              {inspectingProof.frontPhoto && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">ID Front</span>
                  <img
                    src={inspectingProof.frontPhoto}
                    alt="ID Front"
                    className="w-full h-44 object-cover rounded-xl border border-slate-300"
                  />
                </div>
              )}
              {inspectingProof.backPhoto && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">ID Back</span>
                  <img
                    src={inspectingProof.backPhoto}
                    alt="ID Back"
                    className="w-full h-44 object-cover rounded-xl border border-slate-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
