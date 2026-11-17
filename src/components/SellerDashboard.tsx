import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  PlusCircle,
  Package,
  ShoppingBag,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  Store,
  Clock,
  Phone,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  ImageOff,
  AlertTriangle,
  MapPin,
  Home,
  Car,
  ArrowLeft,
  Lock,
  Smile,
  Scissors,
  UserCheck,
  Shirt,
  Flower2,
  Hand,
  Wrench,
  Snowflake,
  Sparkles,
  LogOut,
  User,
  Loader2,
  Building2,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { Product } from '../types';
import { BlueTickPage } from './BlueTickPage';
import { SellerVerifiedBadge } from './SellerVerifiedBadge';
import { SellerTypeBadge } from './SellerTypeBadge';
import { IdCardVerificationBox } from './IdCardVerificationBox';
import { OneTimeSellerVerification } from './OneTimeSellerVerification';
import { ReportDhokaModal } from './ReportDhokaModal';
import {
  NAWABI_CATEGORIES,
  CategoryDefinition,
  matchesProductCategory,
  SHADI_CAR_DECOR_CATEGORY_ID,
} from '../data/categories';
import { fitImageUnderBytes } from '../utils/imageCompress';
import { getAdExpiryInfo, getAdPostedAgoLabel, getAdSortTimestampMs, toEnglishTimeText } from '../utils/adExpiry';

const renderSellerCategoryGoldIcon = (iconKey: CategoryDefinition['iconKey'], className = 'w-6 h-6') => {
  const goldClass = `${className} text-amber-400 stroke-[2]`;
  switch (iconKey) {
    case 'car_wash':
      return <Car className={goldClass} />;
    case 'electrician_plumber':
      return <Wrench className={goldClass} />;
    case 'barber_salon':
      return <UserCheck className={goldClass} />;
    case 'ac_fridge':
      return <Snowflake className={goldClass} />;
    case 'facial_girls':
      return <Smile className={goldClass} />;
    case 'hair_girls':
      return <Scissors className={goldClass} />;
    case 'tailor_boys':
      return <Shirt className={goldClass} />;
    case 'tailor_girls':
      return <Flower2 className={goldClass} />;
    case 'mehndi':
      return <Hand className={goldClass} />;
    case 'shadi_car_decor':
      return <Car className={goldClass} />;
    case 'home_cleaning':
      return <Sparkles className={goldClass} />;
    case 'birthday_apartment':
      return <Building2 className={goldClass} />;
    default:
      return <Wrench className={goldClass} />;
  }
};

export const SellerDashboard: React.FC = () => {
  const {
    currentSeller,
    products,
    allProducts,
    addProduct,
    renewProduct,
    deleteProduct,
    updateProductPrice,
    isMyAd,
    orders,
    updateOrderStatus,
    sellerTab,
    setSellerTab,
    authUser,
    isSellerVerified,
    hasSellerUploadedId,
    getSellerIdProof,
    isSellerDataLoaded,
    savedSellerProfile,
    hasCompletedSellerSetup,
    clearSavedSellerAndLogout,
    getProductSellerType,
    updateSellerPhone,
    selectedCity,
    selectedArea,
    chatThreads,
    homeBookings,
    updateBookingStatus,
    setActiveChatThreadId,
    setIsChatModalOpen,
    openChatWithSeller,
    setSelectedProduct,
    startInAppCall,
  } = useApp();

  // Active tab state: categories (default Seller Home) | bluetick | orders | chats | profile
  const getNormalizedTab = (): 'categories' | 'bluetick' | 'orders' | 'chats' | 'profile' => {
    if (sellerTab === 'bluetick') return 'bluetick';
    if (sellerTab === 'orders' || sellerTab === 'sales') return 'orders';
    if (sellerTab === 'chats') return 'chats';
    if (sellerTab === 'profile') return 'profile';
    return 'categories';
  };

  const activeTab = getNormalizedTab();
  const setActiveTab = (tab: 'categories' | 'bluetick' | 'orders' | 'chats' | 'profile') => {
    if (tab === 'categories') {
      setSellerTab('products');
    } else {
      setSellerTab(tab);
    }
  };

  // Seller Categories Home, In-Category Add Post, and First-Time Seller Setup Gate
  const [selectedSellerCat, setSelectedSellerCat] = useState<CategoryDefinition | null>(null);
  const [showCategoryAddForm, setShowCategoryAddForm] = useState(false);
  const [showOneTimeSetupForm, setShowOneTimeSetupForm] = useState(false);
  const [pendingCategoryAfterSetup, setPendingCategoryAfterSetup] = useState<CategoryDefinition | null>(null);
  const [renewingProductId, setRenewingProductId] = useState<string | null>(null);
  const [renewNotice, setRenewNotice] = useState<string | null>(null);

  const [reportingProduct, setReportingProduct] = useState<Product | null>(null);

  const activeFormCategory: CategoryDefinition =
    selectedSellerCat || NAWABI_CATEGORIES[0];

  // Add Product Form state (Auto-fills saved seller details)
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [adPhotos, setAdPhotos] = useState<string[]>([]);
  const [newDesc, setNewDesc] = useState('');
  const [newPhone, setNewPhone] = useState(
    savedSellerProfile?.phone || authUser?.phone || currentSeller.phone || ''
  );
  const [formError, setFormError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Seller Profile & ID state (inside Profile tab)
  const [profilePhone, setProfilePhone] = useState(
    savedSellerProfile?.phone || currentSeller.phone || authUser?.phone || ''
  );
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [profilePhoneError, setProfilePhoneError] = useState('');

  const idProofRecord = getSellerIdProof(
    currentSeller.id,
    currentSeller.shopName || currentSeller.name,
    currentSeller.phone
  );
  const hasUploadedIdPhotos = hasSellerUploadedId(currentSeller.id);
  const sellerIdStatus: 'none' | 'pending' | 'verified' =
    idProofRecord?.status ||
    currentSeller.idVerificationStatus ||
    (hasUploadedIdPhotos ? 'pending' : 'none');

  const profileLocation =
    (savedSellerProfile?.area && savedSellerProfile?.city
      ? savedSellerProfile.area.toLowerCase() !== savedSellerProfile.city.toLowerCase()
        ? `${savedSellerProfile.area}, ${savedSellerProfile.city}`
        : savedSellerProfile.city
      : null) ||
    (authUser?.area && authUser?.city ? `${authUser.area}, ${authUser.city}` : null) ||
    (selectedArea && selectedCity && !selectedArea.toLowerCase().startsWith('all ')
      ? `${selectedArea}, ${selectedCity}`
      : null) ||
    currentSeller.location ||
    `${selectedCity || 'Rawalpindi'}, Pakistan`;

  const adCameraInputRef = useRef<HTMLInputElement>(null);
  const adGalleryInputRef = useRef<HTMLInputElement>(null);

  // Multi-photo upload (1 to 5 photos, 1st photo = Main pic) for ALL categories
  const handleAdPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFormError('');

    const remainingSlots = Math.max(0, 5 - adPhotos.length);
    if (remainingSlots === 0) {
      setFormError('Aap maximum 5 photos upload kar sakte hain.');
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const compressedList: string[] = [];
    for (const file of selectedFiles) {
      try {
        const compressed = await fitImageUnderBytes(file, 130000, 720, 0.6);
        if (compressed) {
          compressedList.push(compressed);
        }
      } catch {
        // Ignore invalid image
      }
    }
    if (compressedList.length > 0) {
      setAdPhotos((prev) => [...prev, ...compressedList].slice(0, 5));
    }
    e.target.value = '';
  };

  const handleSetMainPhoto = (index: number) => {
    setAdPhotos((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const chosen = prev[index];
      return [chosen, ...prev.filter((_, i) => i !== index)];
    });
  };

  const resetAddPostFormFields = () => {
    setFormError('');
    setPostSuccess(false);
    setNewTitle('');
    setNewPrice('');
    setAdPhotos([]);
    setNewDesc('');
    setNewPhone(savedSellerProfile?.phone || authUser?.phone || currentSeller.phone || '');
  };

  const handleOpenAddFormForCategory = (cat: CategoryDefinition) => {
    resetAddPostFormFields();
    if (!hasCompletedSellerSetup) {
      setPendingCategoryAfterSetup(cat);
      setShowOneTimeSetupForm(true);
      return;
    }
    setSelectedSellerCat(cat);
    setShowCategoryAddForm(true);
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPublishing || postSuccess) return;
    setFormError('');

    const targetCategory = activeFormCategory;
    if (!targetCategory) {
      setFormError('Category select karna zaroori hai.');
      return;
    }

    const isDecorCat = targetCategory.id === SHADI_CAR_DECOR_CATEGORY_ID;
    const isApartmentCat = !!targetCategory.isBirthdayApartment;

    if (!newTitle.trim()) {
      setFormError(
        isDecorCat
          ? 'Please enter Design Name.'
          : isApartmentCat
          ? 'Please enter Apartment Name.'
          : 'Please enter Service Title.'
      );
      return;
    }
    if (!newPrice || Number(newPrice) <= 0) {
      setFormError('Please enter a valid Price in Rs.');
      return;
    }
    if (adPhotos.length === 0) {
      setFormError('Kam az kam 1 photo upload karein (Max 5 photos · Pehli pic Main hogi).');
      return;
    }
    if (!newPhone.trim() || newPhone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid Mobile Number.');
      return;
    }

    if (newPhone.trim() !== currentSeller.phone) {
      updateSellerPhone(newPhone.trim());
    }

    const finalPhotos = adPhotos.slice(0, 5);
    setIsPublishing(true);
    const res = await addProduct({
      title: newTitle.trim(),
      price: Number(newPrice),
      category: targetCategory.id,
      location: isDecorCat ? 'Ghar aake karenge' : profileLocation,
      distanceKm: 0.8,
      image: finalPhotos[0],
      images: finalPhotos,
      condition: 'Brand New',
      description:
        newDesc.trim() ||
        (isDecorCat
          ? `${newTitle.trim()} - Ghar aake car decor service.`
          : `${newTitle.trim()} (${targetCategory.title}) available in ${profileLocation}.`),
      stock: 25,
      sellerPhoto: savedSellerProfile?.workOrShopPhoto || currentSeller.photo,
      sellerPhone: newPhone.trim(),
      isHomeService: targetCategory.isDoorstep,
    });
    setIsPublishing(false);

    if (!res.ok) {
      setFormError(res.error || 'Ad Firebase me save nahi ho saka. Dobara try karein.');
      return;
    }

    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setNewTitle('');
      setNewPrice('');
      setAdPhotos([]);
      setNewDesc('');
      setShowCategoryAddForm(false);
    }, 900);
  };

  // Edit & Delete Modals state
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editPriceVal, setEditPriceVal] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const mySellerIds = new Set(
    [currentSeller.id, authUser?.id].filter((id): id is string => !!id && id !== 'seller-guest')
  );

  const isOwnedByCurrentSeller = (p: Product) => isMyAd(p);

  const myProducts = allProducts
    .filter(isOwnedByCurrentSeller)
    .sort((a, b) => getAdSortTimestampMs(b) - getAdSortTimestampMs(a));

  const myExpiredProducts = myProducts.filter((p) => getAdExpiryInfo(p).isExpired);

  const getMyCategoryListings = (categoryId: string) => {
    return myProducts.filter((p) => matchesProductCategory(p.category, categoryId));
  };

  const getOtherCategoryListings = (categoryId: string) => {
    return products
      .filter((p) => matchesProductCategory(p.category, categoryId) && !isOwnedByCurrentSeller(p))
      .sort((a, b) => getAdSortTimestampMs(b) - getAdSortTimestampMs(a));
  };

  const handleRenewAd = async (prod: Product) => {
    if (!isOwnedByCurrentSeller(prod)) return;
    if (renewingProductId) return;
    setRenewingProductId(prod.id);
    const res = await renewProduct(prod.id);
    setRenewingProductId(null);
    if (res.ok) {
      setRenewNotice(`"${prod.title}" renewed for 7 days & moved to top ✓`);
      setTimeout(() => setRenewNotice(null), 4000);
    } else {
      setFormError(res.error || 'Renew failed.');
    }
  };

  const handleSavePrice = () => {
    if (!productToEdit || !editPriceVal || !isOwnedByCurrentSeller(productToEdit)) {
      setProductToEdit(null);
      return;
    }
    const num = Number(editPriceVal);
    if (num > 0) {
      updateProductPrice(productToEdit.id, num);
    }
    setProductToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (productToDelete && isOwnedByCurrentSeller(productToDelete)) {
      deleteProduct(productToDelete.id);
    }
    setProductToDelete(null);
  };

  // ----------------------------------------------------
  // TAB 4: MY ORDERS STATE (Matched strictly by User ID)
  // ----------------------------------------------------
  const sellerOrders = orders.filter((ord) =>
    ord.items.some((it) => isOwnedByCurrentSeller(it.product))
  );

  const [orderActionNotice, setOrderActionNotice] = useState<string | null>(null);

  // Seller Live Chat Threads & Home Bookings (Matched strictly by User ID)
  const sellerThreads = chatThreads.filter((t) => mySellerIds.has(t.sellerId));
  const sellerHomeBookings = homeBookings.filter((b) => mySellerIds.has(b.sellerId));
  const unreadSellerChats = sellerThreads.reduce((sum, t) => sum + (t.unreadForSeller || 0), 0);
  const pendingBookingsCount = sellerHomeBookings.filter((b) => b.status === 'pending').length;
  const chatsAndBookingsBadge = unreadSellerChats + pendingBookingsCount;

  if (!isSellerDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-emerald-950">Seller Profile load ho rahi hai...</p>
      </div>
    );
  }

  if (showOneTimeSetupForm) {
    return (
      <OneTimeSellerVerification
        onCancel={() => {
          setShowOneTimeSetupForm(false);
          setPendingCategoryAfterSetup(null);
        }}
        onComplete={() => {
          setShowOneTimeSetupForm(false);
          setNewPhone(savedSellerProfile?.phone || authUser?.phone || currentSeller.phone || '');
          if (pendingCategoryAfterSetup) {
            const cat = pendingCategoryAfterSetup;
            setPendingCategoryAfterSetup(null);
            setSelectedSellerCat(cat);
            setShowCategoryAddForm(true);
          }
        }}
      />
    );
  }

  const resolvedCurrentSellerType =
    currentSeller.sellerType || idProofRecord?.sellerType || 'shop';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 w-full max-w-full overflow-x-hidden selection:bg-emerald-200">
      {/* ======================================================== */}
      {/* MAIN CONTENT AREA (Clean Seller Home directly below NAWAB top bar) */}
      {/* ======================================================== */}
      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
        {/* ------------------------------------------------------ */}
        {/* TAB 1: SELLER CATEGORIES HOME -> CATEGORY LISTINGS -> ADD NEW POST */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* VIEW 1: SIMPLE & CLEAN SELLER HOME (7-Day Line + Categories Grid ONLY) */}
            {!selectedSellerCat && !showCategoryAddForm && (
              <div className="space-y-3.5">
                <p className="text-xs sm:text-sm text-emerald-900/80 font-semibold text-center px-2 pt-0.5">
                  Every ad stays live for 7 days. Click Renew Ad after 7 days to move it to top again
                </p>

                {/* Categories in 2 Columns - Dark Green #0B3D2E & Gold */}
                <div className="nawab-cat-grid grid grid-cols-2 gap-3 sm:gap-4">
                  {NAWABI_CATEGORIES.map((cat, idx) => {
                    const countInCat = getMyCategoryListings(cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedSellerCat(cat);
                          setShowCategoryAddForm(false);
                        }}
                        className="bg-[#0B3D2E] hover:bg-[#0e4d3b] rounded-2xl p-4 border-2 border-amber-400/80 hover:border-amber-300 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between min-h-[118px] cursor-pointer active:scale-[0.98] group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="nawab-cat-icon-wrap w-11 h-11 rounded-xl bg-emerald-950/80 border border-amber-400/60 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            {renderSellerCategoryGoldIcon(cat.iconKey, 'w-6 h-6')}
                            <span aria-hidden="true" className="nawab-cat-shine" />
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                              countInCat > 0
                                ? 'bg-amber-400 text-emerald-950 border-amber-300'
                                : 'bg-emerald-950/80 text-amber-300 border-amber-400/40'
                            }`}
                          >
                            {countInCat} Added
                          </span>
                        </div>

                        <div>
                          <span className="font-extrabold text-xs sm:text-sm text-white leading-snug block">
                            {idx + 1}. {cat.title}
                          </span>
                          {cat.subtitle && (
                            <span className="text-[10px] sm:text-[11px] text-amber-300 font-semibold block mt-0.5">
                              {cat.subtitle}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: INSIDE SELECTED CATEGORY - ONLY THIS CATEGORY'S SELLER LISTINGS */}
            {selectedSellerCat && !showCategoryAddForm && (
              <div className="space-y-4">
                {/* Category Header + Back Button */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellerCat(null);
                        setShowCategoryAddForm(false);
                      }}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer shrink-0 transition-colors"
                      aria-label="Back to Categories"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-[#0B3D2E] border border-amber-400/70 flex items-center justify-center shrink-0">
                      {renderSellerCategoryGoldIcon(selectedSellerCat.iconKey, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 truncate">
                        {selectedSellerCat.isShadiCarDecor
                          ? 'Shadi Car Decor - My Listings'
                          : `${selectedSellerCat.title} - My Listings`}
                      </h2>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        Sirf is category ki aapki home services
                      </p>
                    </div>
                  </div>
                </div>

                {/* Big Green Add New Post Button inside every Category */}
                <button
                  type="button"
                  onClick={() => handleOpenAddFormForCategory(selectedSellerCat)}
                  className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <PlusCircle className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>Add New Post</span>
                </button>

                {/* Seller's Own Ads (Edit/Delete/Renew ONLY on own ads) + Other Sellers' Ads (View & Contact ONLY) */}
                {(() => {
                  const categoryListings = getMyCategoryListings(selectedSellerCat.id);
                  const otherListings = getOtherCategoryListings(selectedSellerCat.id);

                  return (
                    <div className="space-y-5">
                      {renewNotice && (
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                            <span>{renewNotice}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRenewNotice(null)}
                            className="text-white/80 hover:text-white cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* MY ADS (Owned by current User ID only) */}
                      {categoryListings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-7 border border-emerald-100 text-center space-y-2.5 shadow-2xs">
                          <div className="w-12 h-12 rounded-2xl bg-[#0B3D2E] border-2 border-amber-400/80 flex items-center justify-center mx-auto">
                            {renderSellerCategoryGoldIcon(selectedSellerCat.iconKey, 'w-6 h-6')}
                          </div>
                          <p className="font-extrabold text-sm text-slate-800">
                            Abhi aap ne is category me apna koi ad nahi lagaya
                          </p>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            Upar <strong>&quot;Add New Post&quot;</strong> button dabakar apni home service add karein.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider px-1">
                            My Ads ({categoryListings.length})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categoryListings.map((prod) => {
                              const expiry = getAdExpiryInfo(prod);
                              return (
                                <div
                                  key={prod.id}
                                  className={`rounded-2xl p-3.5 border shadow-2xs flex gap-3 items-center justify-between ${
                                    expiry.isExpired
                                      ? 'bg-amber-50/60 border-amber-300'
                                      : 'bg-white border-emerald-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProduct(prod)}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                                  >
                                    {prod.image ? (
                                      <img
                                        src={prod.image}
                                        alt={prod.title}
                                        className="w-18 h-18 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                                      />
                                    ) : (
                                      <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
                                        <ImageOff className="w-4 h-4 text-slate-400 mb-0.5" />
                                        <span>No Photo</span>
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                            expiry.isExpired
                                              ? 'bg-red-50 text-red-700 border-red-200'
                                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          }`}
                                        >
                                          {expiry.label}
                                        </span>
                                        <SellerTypeBadge sellerType={getProductSellerType(prod)} />
                                        {prod.images && prod.images.length > 1 && (
                                          <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            📷 {prod.images.length} Photos
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                        {prod.title}
                                      </h4>
                                      <span className="text-sm font-extrabold text-emerald-700 font-mono block">
                                        Rs {prod.price.toLocaleString()}
                                      </span>
                                      <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                        <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                                        <span>{prod.sellerPhone}</span>
                                      </span>
                                    </div>
                                  </button>

                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={renewingProductId === prod.id}
                                      onClick={() => handleRenewAd(prod)}
                                      className={`px-2.5 py-1.5 text-[11px] rounded-lg font-extrabold cursor-pointer flex items-center justify-center gap-1 ${
                                        expiry.isExpired
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      <RefreshCw
                                        className={`w-3 h-3 ${renewingProductId === prod.id ? 'animate-spin' : ''}`}
                                      />
                                      <span>Renew Ad</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductToEdit(prod);
                                        setEditPriceVal(prod.price.toString());
                                      }}
                                      className="px-2.5 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                                    >
                                      Edit Price
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setProductToDelete(prod)}
                                      className="px-2.5 py-1.5 text-[11px] bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* OTHER SELLERS' ADS (View & Contact ONLY - Zero Edit / Delete buttons) */}
                      {otherListings.length > 0 && (
                        <div className="space-y-2.5">
                          <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider px-1">
                            Other Sellers in {selectedSellerCat.title} ({otherListings.length})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {otherListings.map((prod) => (
                              <div
                                key={prod.id}
                                className="rounded-2xl p-3.5 border border-slate-200 bg-white shadow-2xs flex gap-3 items-center justify-between"
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(prod)}
                                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                                >
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt={prod.title}
                                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
                                      <ImageOff className="w-4 h-4 text-slate-400 mb-0.5" />
                                      <span>No Photo</span>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-block bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                        {getAdPostedAgoLabel(prod)}
                                      </span>
                                      <SellerTypeBadge sellerType={getProductSellerType(prod)} />
                                    </div>
                                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                      {prod.title}
                                    </h4>
                                    <span className="text-sm font-extrabold text-emerald-700 font-mono block">
                                      Rs {prod.price.toLocaleString()}
                                    </span>
                                    <span className="text-[11px] text-slate-500 truncate block">
                                      {prod.sellerName || 'Seller'} · {prod.location}
                                    </span>
                                  </div>
                                </button>

                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProduct(prod)}
                                    className="px-3 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-extrabold cursor-pointer"
                                  >
                                    View Ad
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openChatWithSeller({
                                        sellerId: prod.sellerId,
                                        sellerName: prod.sellerName || 'Seller',
                                        sellerPhone: prod.sellerPhone || '',
                                        productId: prod.id,
                                        productTitle: prod.title,
                                        category: prod.category,
                                      })
                                    }
                                    className="px-3 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3 text-amber-300 shrink-0" />
                                    <span>Contact</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VIEW 3: ADD NEW POST FORM INSIDE SELECTED CATEGORY */}
            {showCategoryAddForm && selectedSellerCat && (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-200 shadow-sm space-y-4">
                  {/* Top Bar: Back + Heading */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setShowCategoryAddForm(false)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer shrink-0"
                        aria-label="Back to Listings"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h3 className="font-extrabold text-base text-emerald-950 truncate">
                        Add New Post
                      </h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                      7 Days Live · Free Renew
                    </span>
                  </div>

                  {/* Locked Category Display */}
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-950">
                      Category: {selectedSellerCat.title} (Locked)
                    </span>
                  </div>

                  {/* Auto-Filled Seller Info Card */}
                  {savedSellerProfile && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                          <span>Seller Details (Auto-Filled ✓)</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Saved in Browser</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                        <div>
                          <span className="text-slate-500">Name: </span>
                          <strong>{savedSellerProfile.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">City: </span>
                          <strong>{savedSellerProfile.city}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">CNIC: </span>
                          <strong className="font-mono">{savedSellerProfile.cnicNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Phone: </span>
                          <strong className="font-mono">{savedSellerProfile.phone}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-bold text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {postSuccess && (
                    <div className="p-4 bg-emerald-600 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Saved in {activeFormCategory.title}! (7 days live)</span>
                    </div>
                  )}

                  <form onSubmit={handlePublishProduct} className="space-y-4">
                    {/* 1. Title / Design Name / Apartment Name */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        {activeFormCategory.isShadiCarDecor
                          ? 'Design Name'
                          : activeFormCategory.isBirthdayApartment
                          ? 'Apartment / Suite Name'
                          : 'Service Title'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          activeFormCategory.isShadiCarDecor
                            ? 'Full Rose Dulhan Decor, Mehndi Simple Decor, Barat VIP Decor'
                            : activeFormCategory.isBirthdayApartment
                            ? 'e.g. Royal Birthday Apartment, 1-Bed Anniversary Suite'
                            : `e.g. ${activeFormCategory.title} service`
                        }
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-semibold bg-white"
                      />
                    </div>

                    {/* 2. Price in Rs */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Price in Rs <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-sm">
                          Rs
                        </span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder={activeFormCategory.isShadiCarDecor ? '5000, 8000, 12000' : '500'}
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full pl-11 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-bold font-mono bg-white"
                        />
                      </div>
                    </div>

                    {/* 3. Photos: 1 to 5 Photos (Pehli pic Main hogi) for ALL 16 Categories */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>
                            Photos (1 se 5 Pics · Pehli pic Main) <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <span className="bg-white border border-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                          {adPhotos.length} / 5 Photos
                        </span>
                      </div>

                      <input
                        type="file"
                        ref={adCameraInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleAdPhotosSelect}
                      />
                      <input
                        type="file"
                        ref={adGalleryInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAdPhotosSelect}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={adPhotos.length >= 5}
                          onClick={() => adCameraInputRef.current?.click()}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          <span>Camera</span>
                        </button>

                        <button
                          type="button"
                          disabled={adPhotos.length >= 5}
                          onClick={() => adGalleryInputRef.current?.click()}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 disabled:opacity-50 active:scale-95 text-emerald-800 border-2 border-emerald-600 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Gallery (Max 5)</span>
                        </button>
                      </div>

                      {adPhotos.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {adPhotos.map((imgSrc, idx) => (
                              <div
                                key={idx}
                                className={`relative aspect-square rounded-xl overflow-hidden bg-white ${
                                  idx === 0
                                    ? 'border-2 border-amber-500 ring-2 ring-amber-400/40'
                                    : 'border border-emerald-300'
                                }`}
                              >
                                <img
                                  src={imgSrc}
                                  alt={`Photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 ? (
                                  <span className="absolute bottom-1 left-1 bg-[#0B3D2E] text-amber-300 border border-amber-400/70 text-[9px] font-black px-1.5 py-0.5 rounded">
                                    Main #1
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMainPhoto(idx)}
                                    className="absolute bottom-1 left-1 bg-black/75 hover:bg-[#0B3D2E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                    title="Is pic ko Main banayein"
                                  >
                                    Set Main
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdPhotos((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs cursor-pointer"
                                  aria-label={`Remove photo ${idx + 1}`}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-emerald-800 font-bold">
                            Pehli photo Main pic hogi. Kisi bhi pic pe &quot;Set Main&quot; daba kar usay pehli pic bana sakte hain.
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-24 border-2 border-dashed border-emerald-300 rounded-2xl flex flex-col items-center justify-center bg-white text-slate-500 p-2 text-center">
                          <ImageOff className="w-5 h-5 text-emerald-500 mb-1" />
                          <span className="text-[11px] font-bold">
                            1 se 5 photos upload karein · Pehli pic Main hogi
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. Description */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        {activeFormCategory.isShadiCarDecor
                          ? 'Description'
                          : activeFormCategory.isBirthdayApartment
                          ? 'Apartment & Decoration Details'
                          : 'Short Description'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={
                          activeFormCategory.isShadiCarDecor
                            ? 'Phool konsay honge, kitna time lagega, ghar aake karenge ya shop pe'
                            : activeFormCategory.isBirthdayApartment
                            ? 'Balloons, rose petals, cake/decor setup, guest capacity aur area likhein...'
                            : 'Apni home service, rates aur timing ki tafseel likhein...'
                        }
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base focus:outline-emerald-600 bg-white"
                      />
                    </div>

                    {/* Shadi Car Decor Location Read-Only Badge: "Ghar aake karenge" */}
                    {activeFormCategory.isShadiCarDecor && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-extrabold text-emerald-950">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Location: Ghar aake karenge</span>
                      </div>
                    )}

                    {/* 5. Mobile Number (Direct Call & NAWAB Secure Chat) */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          placeholder="03XX-XXXXXXX"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-bold font-mono bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Buyers aapse NAWAB Secure Chat aur Call ke zariye rabta kar sakenge.
                      </p>
                    </div>

                    {/* 7-Day Live + 1-Click Renew Notice */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Ad goes live for 7 days · Renew with 1 click when expired
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isPublishing || postSuccess}
                      className="w-full py-3.5 px-4 font-extrabold text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 active:scale-[0.98] text-white shadow-emerald-600/20 cursor-pointer"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Publishing Ad...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Publish in {activeFormCategory.title} (7 Days)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* TAB 2: BLUE TICK (Accessed from Profile tab) */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'bluetick' && (
          <div className="animate-in fade-in duration-150">
            <BlueTickPage onBack={() => setActiveTab('profile')} />
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* TAB 3: MY ORDERS (Cash on Delivery / Cash on Work Only) */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Orders Summary KPI Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Direct Seller Orders
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {sellerOrders.length} {sellerOrders.length === 1 ? 'Order' : 'Orders'} Received
                </h3>
                <p className="text-xs text-slate-500">
                  Total Orders for {currentSeller.shopName || currentSeller.name}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-right max-w-xs">
                <span className="text-[10px] text-emerald-700 block font-extrabold uppercase">
                  Cash on Delivery / Cash on Work
                </span>
                <span className="text-xs font-bold text-emerald-950 block mt-0.5">
                  Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                </span>
              </div>
            </div>

            {orderActionNotice && (
              <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{orderActionNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderActionNotice(null)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Orders List */}
            {sellerOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-400 text-xs space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="font-extrabold text-slate-700 text-sm">0 Orders Received</h4>
                <p className="max-w-xs mx-auto text-slate-500 text-[11px]">
                  No orders yet. When local buyers place orders for your products, they will appear here so you can deliver directly and collect cash on spot.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sellerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-slate-900 text-xs">
                          #{ord.id}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {toEnglishTimeText(ord.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 font-mono">
                        Rs {(ord.totalAmount ?? ord.subtotal ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-700">
                        <strong>Buyer:</strong> {ord.buyerName} ({ord.buyerPhone})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        <strong>Address:</strong> {ord.deliveryAddress}, {ord.deliveryArea}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">Items:</span>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>{it.quantity}x {it.product.title}</span>
                          <span className="font-mono font-bold">Rs {(it.product.price * it.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Cash on Delivery / Cash on Work · Spot par direct payment lein</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${ord.buyerPhone.replace(/\D/g, '')}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Call Buyer</span>
                        </a>
                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderStatus(ord.id, 'confirmed');
                              setOrderActionNotice(`Order #${ord.id} confirmed! Buyer ko inform kar dein.`);
                              setTimeout(() => setOrderActionNotice(null), 3500);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            Confirm Order
                          </button>
                        )}
                        {ord.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderStatus(ord.id, 'out_for_delivery');
                              setOrderActionNotice(`Order #${ord.id} marked Out for Delivery / Work!`);
                              setTimeout(() => setOrderActionNotice(null), 3500);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            On The Way
                          </button>
                        )}
                        {ord.status === 'out_for_delivery' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderStatus(ord.id, 'delivered');
                              setOrderActionNotice(`Order #${ord.id} delivered & payment collected directly!`);
                              setTimeout(() => setOrderActionNotice(null), 3500);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {ord.status === 'delivered' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-extrabold">
                            Delivered ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* TAB 4: LIVE CHATS & HOME SERVICE BOOKINGS */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'chats' && (
          <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl mx-auto">
            {/* Header Summary + Open Live Chat Button */}
            <div className="bg-emerald-700 text-white rounded-3xl p-5 shadow-md flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-300" />
                  <span>Live Buyer Chats &amp; Home Bookings</span>
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Buyers ke sath app ke andar live chat karein aur Ghar Baithe service bookings dekhein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveChatThreadId(null);
                  setIsChatModalOpen(true);
                }}
                className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-amber-500" />
                <span>Open Live Chat ({sellerThreads.length})</span>
              </button>
            </div>

            {/* Home Service Bookings Section */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <span>Book at Home Requests ({sellerHomeBookings.length})</span>
                </h4>
              </div>

              {sellerHomeBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                  <Home className="w-8 h-8 text-amber-300 mx-auto" />
                  <p className="font-bold text-slate-600">Abhi koi Home Service booking nahi aayi</p>
                  <p className="text-[11px]">
                    Jab koi buyer "Book at Home" karega to uska address aur time yahan aayega.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerHomeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-sm font-extrabold text-slate-900 block">
                            {booking.productTitle}
                            {booking.packageName ? ` · ${booking.packageName}` : ''}
                          </strong>
                          <span className="text-[11px] text-emerald-800 font-bold">
                            {booking.category} · Preferred Time: {booking.preferredTime}
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-emerald-700 text-sm shrink-0">
                          Rs {booking.price}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-emerald-100 space-y-1 text-[11px] text-slate-700">
                        <p>
                          <strong>Customer:</strong> {booking.buyerName} ({booking.buyerPhone})
                        </p>
                        <p>
                          <strong>Home Address:</strong> {booking.buyerAddress}
                        </p>
                        {booking.notes && (
                          <p>
                            <strong>Note:</strong> {booking.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              booking.status === 'completed'
                                ? 'bg-emerald-600 text-white'
                                : booking.status === 'on_the_way'
                                ? 'bg-amber-500 text-white'
                                : booking.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {booking.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Accept
                            </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(booking.id, 'on_the_way')}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              On The Way
                            </button>
                          )}
                          {booking.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Mark Done
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              startInAppCall({
                                calleeId: booking.buyerPhone,
                                calleeName: booking.buyerName,
                                calleePhone: booking.buyerPhone,
                                calleeRole: 'buyer',
                                productTitle: booking.productTitle,
                              })
                            }
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Phone className="w-3 h-3 text-amber-300" />
                            <span>Call Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const existing = sellerThreads.find(
                                (t) =>
                                  t.buyerPhone.replace(/\D/g, '') ===
                                  booking.buyerPhone.replace(/\D/g, '')
                              );
                              if (existing) {
                                setActiveChatThreadId(existing.id);
                              } else {
                                openChatWithSeller({
                                  sellerId: booking.sellerId,
                                  sellerName: booking.sellerName,
                                  sellerPhone: booking.sellerPhone,
                                  productId: booking.productId,
                                  productTitle: booking.productTitle,
                                  category: booking.category,
                                });
                              }
                              setIsChatModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3 text-amber-500" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Saved Live Chat Threads */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-xs space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <MessageCircle className="w-4 h-4 text-amber-500" />
                <span>Saved Live Chats ({sellerThreads.length})</span>
              </h4>

              {sellerThreads.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Abhi kisi buyer ka chat message nahi aaya. Jab messages aayenge to yahan save rahenge.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sellerThreads.map((thread) => {
                    const last = thread.messages[thread.messages.length - 1];
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => {
                          setActiveChatThreadId(thread.id);
                          setIsChatModalOpen(true);
                        }}
                        className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-emerald-50/50 rounded-xl px-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-extrabold text-slate-900 truncate">
                              {thread.buyerName}
                            </strong>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {thread.buyerPhone}
                            </span>
                          </div>
                          {thread.productTitle && (
                            <span className="text-[11px] text-emerald-700 font-bold block truncate">
                              {thread.productTitle}
                            </span>
                          )}
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {last ? last.text : 'Tap to view chat'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(thread.unreadForSeller || 0) > 0 && (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              {thread.unreadForSeller}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* TAB 5: PROFILE TAB (All Seller Profile, ID Status, Name/Phone/CNIC/City, Blue Tick & Logout shifted here) */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl mx-auto">
            {/* Top Seller Profile Card (Photo, Name, Home Wala/Shop Wala, ID Pending/Verified, Phone, Change) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-200 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs overflow-hidden border border-emerald-200">
                    {currentSeller.photo ? (
                      <img
                        src={currentSeller.photo}
                        alt={currentSeller.shopName || currentSeller.name}
                        className="w-full h-full object-cover"
                      />
                    ) : resolvedCurrentSellerType === 'home' ? (
                      <Home className="w-5 h-5" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SellerVerifiedBadge
                        sellerName={currentSeller.shopName || currentSeller.name || 'My Seller Shop'}
                        isVerified={!!(currentSeller.hasBlueTick || currentSeller.blueTickStatus === 'verified')}
                        rating={currentSeller.rating || 0}
                        reviewsCount={currentSeller.reviewsCount || 0}
                        nameClassName="font-extrabold text-base sm:text-lg text-emerald-950 truncate"
                      />
                      <SellerTypeBadge sellerType={resolvedCurrentSellerType} size="sm" />
                      {sellerIdStatus === 'verified' ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold inline-flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>ID Verified</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold inline-flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>ID Pending</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{profileLocation}</span>
                    </p>
                    <p className="text-xs font-mono font-extrabold text-emerald-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{currentSeller.phone || authUser?.phone || 'Add Mobile Number'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSavedSellerAndLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Change</span>
                </button>
              </div>

              {/* Saved Seller Name / Phone / CNIC / City Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                    Profile &amp; ID Details
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Total Ads: {myProducts.length}
                  </span>
                </div>

                {hasCompletedSellerSetup && savedSellerProfile ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block font-semibold text-[11px]">Name</span>
                      <strong className="text-emerald-950 font-extrabold truncate block">
                        {savedSellerProfile.name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold text-[11px]">Phone</span>
                      <strong className="text-emerald-950 font-mono font-extrabold truncate block">
                        {savedSellerProfile.phone}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold text-[11px]">CNIC</span>
                      <strong className="text-emerald-950 font-mono font-extrabold truncate block">
                        {savedSellerProfile.cnicNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold text-[11px]">City</span>
                      <strong className="text-emerald-950 font-extrabold truncate block">
                        {savedSellerProfile.city}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div>
                      <strong className="text-amber-950 font-extrabold block">
                        Seller Details Not Completed Yet
                      </strong>
                      <span className="text-amber-800 text-[11px]">
                        Add Name, Phone, CNIC &amp; City once to auto-fill all future ads.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOneTimeSetupForm(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shrink-0"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Expired Ads Quick Renew Section inside Profile Tab */}
            {renewNotice && (
              <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{renewNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRenewNotice(null)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {myExpiredProducts.length > 0 && (
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-4 space-y-3 shadow-2xs">
                <div>
                  <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Expired Ads ({myExpiredProducts.length})</span>
                  </h3>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Hidden from buyers after 7 days. Click Renew Ad to make live again:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {myExpiredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl p-3 border border-amber-200 flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {prod.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {prod.category} · Rs {prod.price.toLocaleString()}
                          </span>
                          <span className="inline-block bg-red-50 text-red-700 border border-red-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5">
                            Expired
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={renewingProductId === prod.id}
                        onClick={() => handleRenewAd(prod)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${renewingProductId === prod.id ? 'animate-spin' : ''}`}
                        />
                        <span>Renew Ad</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Mobile Number Editor */}
            <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
              <label className="block text-xs font-extrabold text-emerald-950">
                Seller Mobile Number (Mandatory / Zaroori) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="03XX-XXXXXXX"
                  value={profilePhone}
                  onChange={(e) => {
                    setProfilePhone(e.target.value);
                    setProfilePhoneError('');
                  }}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-bold font-mono bg-white"
                />
              </div>

              {profilePhoneError && (
                <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {profilePhoneError}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  const digits = profilePhone.replace(/\D/g, '');
                  if (!profilePhone.trim() || digits.length < 10) {
                    setProfilePhoneError('Sahih 11-digit Seller Mobile Number darj karna zaroori hai.');
                    return;
                  }
                  setProfilePhoneError('');
                  updateSellerPhone(profilePhone);
                  setProfileSavedToast(true);
                  setTimeout(() => setProfileSavedToast(false), 3000);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Save Mobile Number
              </button>

              {profileSavedToast && (
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mobile number update ho gaya!</span>
                </div>
              )}
            </div>

            {/* One-Time Verification / ID Card Status */}
            {hasUploadedIdPhotos ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-950">
                      One-Time Seller Verification Saved
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      sellerIdStatus === 'verified'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {sellerIdStatus === 'verified' ? 'ID Verified ✓' : 'ID Pending · Instant Ads Active'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Aapka ID Card ek baar save ho chuka hai. Ab aglay kisi bhi Ad par ID Card upload karne ya Admin approval ka intezaar karne ki zaroorat nahi hai.
                </p>
              </div>
            ) : (
              <IdCardVerificationBox />
            )}

            {/* Logout / Change Seller Button at bottom of Profile tab */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={clearSavedSellerAndLogout}
                className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Logout / Change Seller</span>
              </button>
            </div>
          </div>
        )}

        <footer className="pt-4 pb-2 text-center">
          <span className="text-xs font-extrabold tracking-wide text-emerald-900/70 block">
            NAWAB
          </span>
        </footer>
      </main>

      {/* ======================================================== */}
      {/* EDIT PRICE MODAL */}
      {/* ======================================================== */}
      {productToEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-xl">
            <h4 className="font-extrabold text-sm text-slate-900">
              Edit Price: {productToEdit.title}
            </h4>
            <div>
              <label className="text-xs text-slate-500 block mb-1">New Price (Rs)</label>
              <input
                type="number"
                min="1"
                value={editPriceVal}
                onChange={(e) => setEditPriceVal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-bold font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProductToEdit(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRM MODAL */}
      {/* ======================================================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-xl text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Delete Permanent Ad?</h4>
            <p className="text-xs text-slate-500">
              Yeh Ad permanent hai aur khud delete karne tak live rehta hai. Are you sure you want to remove <strong>&quot;{productToDelete.title}&quot;</strong>?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bharosa System: Report / Dhoka Modal */}
      {reportingProduct && (
        <ReportDhokaModal
          isOpen={!!reportingProduct}
          onClose={() => setReportingProduct(null)}
          productId={reportingProduct.id}
          productTitle={reportingProduct.title}
          sellerId={reportingProduct.sellerId}
          sellerName={reportingProduct.sellerName}
        />
      )}

      {/* Bottom Seller Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-emerald-100 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-15 px-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setSelectedSellerCat(null);
              setShowCategoryAddForm(false);
            }}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              activeTab === 'categories' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-0.5">Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer relative ${
              activeTab === 'orders' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              {sellerOrders.length > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {sellerOrders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer relative ${
              activeTab === 'chats' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              {chatsAndBookingsBadge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {chatsAndBookingsBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Chats</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProfilePhone(savedSellerProfile?.phone || currentSeller.phone || authUser?.phone || '');
              setProfilePhoneError('');
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer relative ${
              activeTab === 'profile' || activeTab === 'bluetick'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <div className="relative">
              <User className="w-5 h-5" />
              {myExpiredProducts.length > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {myExpiredProducts.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
