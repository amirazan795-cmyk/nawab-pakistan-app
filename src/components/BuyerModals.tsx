import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  ShieldCheck,
  Store,
  Phone,
  ArrowLeft,
  ListOrdered,
  ChevronRight,
  MessageSquare,
  Send,
  Bell,
  CheckCircle2,
  Settings,
  Edit3,
  LogOut,
  MapPin,
  Globe,
  Heart,
  HelpCircle,
  CalendarCheck,
  Clock,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { Order } from '../types';
import {
  loadSavedWorkers,
  removeSavedWorker,
  SavedWorkerRecord,
} from '../utils/savedWorkers';

interface OrdersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export const OrdersListModal: React.FC<OrdersListModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const { orders } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900">My Orders</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ListOrdered className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">No orders placed yet</p>
              <p className="text-xs text-slate-400">
                When you order products from local sellers, your orders will appear here.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => {
                  onSelectOrder(ord);
                  onClose();
                }}
                className="bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-3.5 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 font-mono">#{ord.id}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                    {ord.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-slate-600">
                  {ord.items.map((it) => it.product.title).join(', ')}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-slate-500">
                  <div>
                    <span className="font-extrabold text-emerald-700 text-sm tabular-nums block">
                      Rs {(ord.totalAmount ?? ord.subtotal ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Cash on Delivery / Cash on Work
                    </span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span>Track Order</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders?: () => void;
  onOpenCart?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    authUser,
    logoutUser,
    updateAuthUserProfile,
    selectedArea,
    selectedCity,
    homeBookings,
    openChatWithSeller,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showSavedWorkers, setShowSavedWorkers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  const [editName, setEditName] = useState(authUser?.name || 'Customer');
  const [editPhone, setEditPhone] = useState(authUser?.phone || '');
  const [editAddress, setEditAddress] = useState(authUser?.address || selectedArea || '');
  const [saveNotice, setSaveNotice] = useState(false);

  // Settings states (persisted)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nawab_buyer_notifications');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [language, setLanguage] = useState<'English' | 'Urdu'>(() => {
    try {
      const saved = localStorage.getItem('nawab_buyer_language');
      return saved === 'English' ? 'English' : 'Urdu';
    } catch {
      return 'Urdu';
    }
  });

  const buyerWorkerKey = authUser?.id || authUser?.phone || 'guest';
  const [savedWorkers, setSavedWorkers] = useState<SavedWorkerRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditName(authUser?.name || 'Customer');
      setEditPhone(authUser?.phone || '');
      setEditAddress(
        authUser?.address ||
          (selectedArea ? `${selectedArea}, ${selectedCity || 'Rawalpindi'}` : selectedCity || 'Rawalpindi')
      );
      setSavedWorkers(loadSavedWorkers(buyerWorkerKey));
    }
  }, [isOpen, authUser?.name, authUser?.phone, authUser?.address, selectedArea, selectedCity, buyerWorkerKey]);

  if (!isOpen) return null;

  const myPhoneDigits = (authUser?.phone || '').replace(/\D/g, '');
  const myBookings = homeBookings
    .filter((b) => {
      const bPhone = (b.buyerPhone || '').replace(/\D/g, '');
      if (myPhoneDigits && bPhone) return bPhone === myPhoneDigits;
      if (authUser?.name) return b.buyerName.toLowerCase() === authUser.name.toLowerCase();
      return false;
    })
    .slice()
    .reverse();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAuthUserProfile(editName, editPhone, editAddress);
    setIsEditing(false);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  const handleToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      localStorage.setItem('nawab_buyer_notifications', String(next));
    } catch {
      // ignore
    }
  };

  const handleSelectLanguage = (lang: 'English' | 'Urdu') => {
    setLanguage(lang);
    try {
      localStorage.setItem('nawab_buyer_language', lang);
    } catch {
      // ignore
    }
  };

  const initials = (authUser?.name || 'Buyer')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayLocation =
    authUser?.address ||
    (selectedArea && !selectedArea.toLowerCase().startsWith('all ')
      ? `${selectedArea}, ${selectedCity || 'Rawalpindi'}`
      : selectedCity || 'Rawalpindi');

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {/* 1. Top Card: Name, Phone, Location, BUYER badge */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-xs">
            {initials || 'NW'}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-base text-slate-900 truncate">
                {authUser?.name || 'Valued Buyer'}
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-emerald-200 shrink-0">
                BUYER
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{authUser?.phone || '0300-1234567'}</span>
            </p>
            <p className="text-xs text-emerald-700 font-semibold truncate flex items-center gap-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </p>
          </div>
        </div>

        {/* Clean Profile Menu Options (ONLY Edit Profile, My Bookings, Saved Workers, Settings, Help & Support) */}
        <div className="space-y-2.5 text-sm">
          {/* 2. Edit Profile (Name, Phone, Address) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="w-full p-4 hover:bg-slate-50 text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Edit Profile</span>
                  <span className="text-[11px] text-slate-500 block">Name, Phone, Address</span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isEditing ? 'rotate-90 text-emerald-600' : ''
                }`}
              />
            </button>

            {isEditing && (
              <form
                onSubmit={handleSaveProfile}
                className="p-4 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs animate-in fade-in"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white text-base font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white text-base font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="House, Street, Area, City"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white text-base font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. My Bookings / Booking History */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBookings((prev) => !prev)}
              className="w-full p-4 hover:bg-slate-50 text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    My Bookings / Booking History
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Past booked home services
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {myBookings.length}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showBookings ? 'rotate-90 text-emerald-600' : ''
                  }`}
                />
              </div>
            </button>

            {showBookings && (
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5 text-xs animate-in fade-in">
                {myBookings.length === 0 ? (
                  <div className="bg-white rounded-xl p-4 border border-slate-200 text-center space-y-1">
                    <CalendarCheck className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">Abhi koi booking history nahi hai</p>
                    <p className="text-[11px] text-slate-500">
                      Jab aap koi home service book karengay to woh yahan nazar aayegi.
                    </p>
                  </div>
                ) : (
                  myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-slate-900 font-extrabold block truncate">
                            {booking.productTitle}
                          </strong>
                          <span className="text-[11px] text-emerald-700 font-semibold block truncate">
                            {booking.sellerName} · {booking.category}
                          </span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{booking.preferredTime}</span>
                        </span>
                        <span className="font-extrabold text-emerald-700 font-mono">
                          Rs {booking.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 4. Saved Workers / Favourite Workers */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSavedWorkers((prev) => !prev)}
              className="w-full p-4 hover:bg-slate-50 text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500/20" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    Saved Workers / Favourite Workers
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Your trusted home service providers
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {savedWorkers.length}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showSavedWorkers ? 'rotate-90 text-emerald-600' : ''
                  }`}
                />
              </div>
            </button>

            {showSavedWorkers && (
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5 text-xs animate-in fade-in">
                {savedWorkers.length === 0 ? (
                  <div className="bg-white rounded-xl p-4 border border-slate-200 text-center space-y-1">
                    <Heart className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">Abhi koi Saved Worker nahi hai</p>
                    <p className="text-[11px] text-slate-500">
                      Kisi bhi service listing par &quot;Save Worker&quot; dabakar apni list banayein.
                    </p>
                  </div>
                ) : (
                  savedWorkers.map((worker) => (
                    <div
                      key={worker.sellerId}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="text-slate-900 font-extrabold block truncate">
                          {worker.sellerName}
                        </strong>
                        <span className="text-[11px] text-emerald-700 font-semibold block truncate">
                          {worker.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {worker.sellerPhone} · {worker.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            openChatWithSeller({
                              sellerId: worker.sellerId,
                              sellerName: worker.sellerName,
                              sellerPhone: worker.sellerPhone,
                              productId: worker.productId,
                              productTitle: worker.productTitle,
                              category: worker.category,
                            });
                          }}
                          className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          title="Chat with worker"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSavedWorkers(removeSavedWorker(worker.sellerId, buyerWorkerKey))
                          }
                          className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Remove worker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 5. Settings (Notifications, Language) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className="w-full p-4 hover:bg-slate-50 text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Settings</span>
                  <span className="text-[11px] text-slate-500 block">
                    Notifications, Language
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showSettings ? 'rotate-90 text-emerald-600' : ''
                }`}
              />
            </button>

            {showSettings && (
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <div>
                      <strong className="block text-slate-800">Push Notifications</strong>
                      <span className="text-[10px] text-slate-400">
                        Service booking &amp; chat alerts
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        notificationsEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-slate-200/70 pt-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <div>
                      <strong className="block text-slate-800">Language</strong>
                      <span className="text-[10px] text-slate-400">Select Urdu or English</span>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSelectLanguage('Urdu')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                        language === 'Urdu' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      اردو
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectLanguage('English')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                        language === 'English' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      ENG
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Help & Support */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelpSupport((prev) => !prev)}
              className="w-full p-4 hover:bg-slate-50 text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Help &amp; Support</span>
                  <span className="text-[11px] text-slate-500 block">NAWAB customer helpline</span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showHelpSupport ? 'rotate-90 text-emerald-600' : ''
                }`}
              />
            </button>

            {showHelpSupport && (
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5 text-xs animate-in fade-in">
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Official Support:</span>
                    <span className="font-bold text-emerald-700">NAWAB Helpdesk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Support Hours:</span>
                    <span className="font-semibold text-slate-800">9:00 AM - 10:00 PM (Daily)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-semibold text-slate-800">Rawalpindi, Pakistan</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                  Kisi bhi home service booking ya provider support ke liye NAWAB helpdesk se rabta karein.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Back to Marketplace just above BIG RED full-width Logout */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              logoutUser();
            }}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-red-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  time: string;
}

interface ChatThread {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  unreadCount: number;
  lastMessage: string;
  messages: ChatMessage[];
}

export const MessagesModal: React.FC<MessagesModalProps> = ({ isOpen, onClose }) => {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'support',
      name: 'NAWAB Support',
      role: 'Official Admin & Helpline',
      avatarBg: 'bg-emerald-600',
      unreadCount: 1,
      lastMessage: 'Welcome to NAWAB Pakistan! Direct Seller Cash on Delivery / Work ke sath order karein.',
      messages: [
        {
          id: 'm1',
          sender: 'other',
          text: 'Assalam o Alaikum! NAWAB Pakistan helpline me khush amdeed. Kisi order ya service ke baray me sawal hai to yahan likhein.',
          time: 'Today, 2:00 PM',
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId) return;

    const userMsgText = inputText.trim();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      time: 'Just now',
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: userMsgText,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    setInputText('');

    // Simulate instant automated reply from support/seller
    setTimeout(() => {
      const autoReplyText =
        activeThreadId === 'support'
          ? 'Shukriya! Aapka message record ho gaya hai. NAWAB Support team fori rabta karegi.'
          : 'Bohat shukriya! Aapka order tayar kiya ja raha hai.';

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'other',
        text: autoReplyText,
        time: 'Just now',
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                lastMessage: autoReplyText,
                messages: [...t.messages, replyMsg],
              }
            : t
        )
      );
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl h-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {activeThreadId ? (
              <button
                onClick={() => setActiveThreadId(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            )}
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                {activeThread ? activeThread.name : 'Messages & Chat'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {activeThread ? activeThread.role : 'Connect with sellers & support'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!activeThreadId ? (
          /* Threads List */
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setThreads((prev) =>
                    prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
                  );
                }}
                className="p-3.5 hover:bg-emerald-50/50 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${thread.avatarBg} text-white font-extrabold flex items-center justify-center text-sm shrink-0`}
                >
                  {thread.name[0]}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex justify-between items-center mb-0.5">
                    <strong className="text-slate-900 truncate">{thread.name}</strong>
                    {thread.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] truncate">{thread.role}</p>
                  <p className="text-slate-600 text-[11px] truncate mt-0.5">{thread.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Conversation Screen */
          <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeThread?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-medium shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 text-base"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 font-bold hover:text-slate-900 cursor-pointer"
          >
            Close Messages
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Cash on Delivery / Cash on Work',
      desc: 'Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa. Seller khud deliver karega aur spot par payment lega.',
      time: 'Now',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 2,
      title: 'Local Sellers Ready in Your Area',
      desc: 'Verified local sellers are active in your area for fast direct doorstep delivery and home services.',
      time: 'Today',
      icon: <Store className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900">Notifications</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0">
                {n.icon}
              </div>
              <div>
                <strong className="block text-slate-900">{n.title}</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">{n.desc}</p>
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">{n.time}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
