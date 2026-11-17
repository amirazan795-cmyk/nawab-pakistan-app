import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  MapPin,
  ShieldCheck,
  Phone,
  ImageOff,
  Star,
  MessageSquare,
  ThumbsUp,
  Home,
  Clock,
  CheckCircle2,
  User,
  Eye,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  Trash2,
  Pencil,
  Heart,
} from 'lucide-react';
import { SellerVerifiedBadge } from './SellerVerifiedBadge';
import { SellerTypeBadge } from './SellerTypeBadge';
import { ReportDhokaModal } from './ReportDhokaModal';
import { isNearbyPakistanCity } from '../data/pakistanCities';
import { NAWABI_CATEGORIES, matchesProductCategory } from '../data/categories';
import { ServicePackage } from '../types';
import { getAdPostedAgoLabel } from '../utils/adExpiry';
import { isWorkerSaved, toggleSavedWorker } from '../utils/savedWorkers';

interface ProductDetailModalProps {
  onBuyNow?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    isSellerVerified,
    isSellerIdVerified,
    getSellerIdProof,
    getProductSellerType,
    selectedCity,
    selectedArea,
    reviews,
    addProductReview,
    authUser,
    openChatWithSeller,
    orderViaChat,
    bookHomeService,
    setIsChatModalOpen,
    startInAppCall,
    isMyAd,
    updateProductPrice,
    deleteProduct,
  } = useApp();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showMaskedIdModal, setShowMaskedIdModal] = useState(false);
  const [screenshotShieldActive, setScreenshotShieldActive] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFullscreenZoomOpen, setIsFullscreenZoomOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [isEditingOwnPrice, setIsEditingOwnPrice] = useState(false);
  const [ownPriceInput, setOwnPriceInput] = useState('');
  const [confirmOwnDelete, setConfirmOwnDelete] = useState(false);
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const zoomScrollRef = useRef<HTMLDivElement>(null);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [workerSaved, setWorkerSaved] = useState(false);

  const buyerWorkerStorageKey = authUser?.id || authUser?.phone || 'guest';

  useEffect(() => {
    if (selectedProduct) {
      setWorkerSaved(isWorkerSaved(selectedProduct.sellerId, buyerWorkerStorageKey));
    }
  }, [selectedProduct?.id, selectedProduct?.sellerId, buyerWorkerStorageKey]);

  // Selected package for Car Wash / Home Services
  const [selectedPkg, setSelectedPkg] = useState<ServicePackage | null>(null);

  // Book at Home state
  const [showBookAtHomeForm, setShowBookAtHomeForm] = useState(false);
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingTime, setBookingTime] = useState('Today (As soon as possible)');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedPkg(
        selectedProduct.packages && selectedProduct.packages.length > 0
          ? selectedProduct.packages[0]
          : null
      );
      setOrderQty(1);
      setShowBookAtHomeForm(false);
      setBookingSuccess(false);
      setShowMaskedIdModal(false);
      setScreenshotShieldActive(false);
      setActivePhotoIdx(0);
      setIsFullscreenZoomOpen(false);
      setIsZoomedIn(false);
      setIsEditingOwnPrice(false);
      setOwnPriceInput(selectedProduct.price.toString());
      setConfirmOwnDelete(false);
      if (galleryScrollRef.current) {
        galleryScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
      }
      setBookingAddress(
        authUser?.address ||
          (selectedArea && selectedCity ? `${selectedArea}, ${selectedCity}` : selectedCity || '')
      );
    }
  }, [selectedProduct?.id]);

  // JS Screenshot / Visibility Change Protection while Masked ID Proof Modal is open
  useEffect(() => {
    if (!showMaskedIdModal) return;

    const triggerBlurLock = () => {
      setScreenshotShieldActive(true);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        triggerBlurLock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey) || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
        triggerBlurLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', triggerBlurLock);
    window.addEventListener('pagehide', triggerBlurLock);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', triggerBlurLock);
      window.removeEventListener('pagehide', triggerBlurLock);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showMaskedIdModal]);

  if (!selectedProduct) return null;

  const matchedCat = NAWABI_CATEGORIES.find((c) =>
    matchesProductCategory(selectedProduct.category, c.id)
  );
  const isServiceListing = matchedCat
    ? matchedCat.isService
    : /facial|plumber|electrician|car wash|darzi|tailor|mehndi|hair|decor|service/i.test(
        `${selectedProduct.category} ${selectedProduct.title}`
      );

  const sellerIsIdVerified = isSellerIdVerified(selectedProduct.sellerId, selectedProduct.sellerName);
  const privateProof = sellerIsIdVerified
    ? getSellerIdProof(selectedProduct.sellerId, selectedProduct.sellerName, selectedProduct.sellerPhone)
    : null;
  const buyerWatermarkName = authUser?.name || 'NAWAB Buyer';

  const activePrice = selectedPkg ? selectedPkg.price : selectedProduct.price;
  const activeTime = selectedPkg?.time || selectedProduct.serviceTime;
  const sellerPhoneDisplay = selectedProduct.sellerPhone || '0300-0000000';
  const sellerInitials = (selectedProduct.sellerName || 'SL')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleOpenChat = () => {
    openChatWithSeller({
      sellerId: selectedProduct.sellerId,
      sellerName: selectedProduct.sellerName || 'Seller',
      sellerPhone: sellerPhoneDisplay,
      productId: selectedProduct.id,
      productTitle: selectedProduct.title,
      category: selectedProduct.category,
    });
    setSelectedProduct(null);
  };

  const handleInAppVoiceCall = () => {
    startInAppCall({
      calleeId: selectedProduct.sellerId,
      calleeName: selectedProduct.sellerName || 'Seller',
      calleePhone: sellerPhoneDisplay,
      calleePhoto: selectedProduct.sellerPhoto || selectedProduct.image,
      calleeRole: 'seller',
      productTitle: selectedProduct.title,
    });
  };

  const handleOrderViaChat = () => {
    orderViaChat({
      product: selectedProduct,
      quantity: orderQty,
    });
    setSelectedProduct(null);
  };

  const handleConfirmHomeBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingAddress.trim()) return;

    bookHomeService({
      product: selectedProduct,
      address: bookingAddress.trim(),
      preferredTime: bookingTime.trim() || 'As soon as possible',
      notes: bookingNotes.trim() || undefined,
      packageName: selectedPkg?.name,
      priceOverride: activePrice,
    });

    setBookingSuccess(true);
    setBookingNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Top Swipeable Photo Gallery Slider, Dots, Thumbnails & Click-to-Zoom */}
          {(() => {
            const rawGallery = [
              ...(selectedProduct.images && selectedProduct.images.length > 0
                ? selectedProduct.images
                : []),
              ...(selectedProduct.image ? [selectedProduct.image] : []),
            ].filter(Boolean);
            const gallery = Array.from(new Set(rawGallery)).slice(0, 5);
            const safeIdx = gallery.length > 0 ? Math.min(activePhotoIdx, gallery.length - 1) : 0;

            const scrollToPhoto = (idx: number) => {
              const clamped = Math.max(0, Math.min(idx, gallery.length - 1));
              setActivePhotoIdx(clamped);
              const el = galleryScrollRef.current;
              if (el) {
                el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
              }
              const zoomEl = zoomScrollRef.current;
              if (zoomEl) {
                zoomEl.scrollTo({ left: clamped * zoomEl.clientWidth, behavior: 'smooth' });
              }
            };

            const handleGalleryScroll = () => {
              const el = galleryScrollRef.current;
              if (!el || el.clientWidth <= 0) return;
              const nextIdx = Math.round(el.scrollLeft / el.clientWidth);
              if (nextIdx !== activePhotoIdx && nextIdx >= 0 && nextIdx < gallery.length) {
                setActivePhotoIdx(nextIdx);
              }
            };

            return (
              <>
                <div className="relative w-full bg-slate-100 shrink-0">
                  {gallery.length > 0 ? (
                    <div
                      ref={galleryScrollRef}
                      onScroll={handleGalleryScroll}
                      className="flex w-full h-64 sm:h-72 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {gallery.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActivePhotoIdx(idx);
                            setIsZoomedIn(false);
                            setIsFullscreenZoomOpen(true);
                            setTimeout(() => {
                              const zEl = zoomScrollRef.current;
                              if (zEl) {
                                zEl.scrollTo({ left: idx * zEl.clientWidth, behavior: 'auto' });
                              }
                            }, 20);
                          }}
                          className="w-full h-full shrink-0 snap-center relative cursor-zoom-in block focus:outline-none"
                          aria-label={`View photo ${idx + 1} full screen`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${selectedProduct.title} ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-56 w-full flex flex-col items-center justify-center text-slate-400 p-6">
                      <ImageOff className="w-12 h-12 text-amber-400 mb-2" />
                      <span className="text-sm font-bold text-slate-500">No Photo</span>
                    </div>
                  )}

                  {/* Close Modal Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Tap to Zoom hint */}
                  {gallery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoomedIn(false);
                        setIsFullscreenZoomOpen(true);
                        setTimeout(() => {
                          const zEl = zoomScrollRef.current;
                          if (zEl) {
                            zEl.scrollTo({ left: safeIdx * zEl.clientWidth, behavior: 'auto' });
                          }
                        }, 20);
                      }}
                      className="absolute top-3 left-3 z-10 bg-black/55 hover:bg-black/75 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                      <span>Zoom</span>
                    </button>
                  )}

                  {/* Left / Right Navigation Arrows */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => scrollToPhoto(safeIdx === 0 ? gallery.length - 1 : safeIdx - 1)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPhoto(safeIdx === gallery.length - 1 ? 0 : safeIdx + 1)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Category label & 1/5 counter */}
                  <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-900 shadow-sm pointer-events-none">
                    {selectedProduct.category}
                  </div>
                  {gallery.length > 0 && (
                    <div className="absolute bottom-3 right-3 z-10 bg-black/70 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full pointer-events-none tabular-nums">
                      {safeIdx + 1}/{gallery.length}
                    </div>
                  )}
                </div>

                {/* Dots + Small Clickable Thumbnails below Main Pic */}
                {gallery.length > 0 && (
                  <div className="px-4 pt-2.5 pb-1 space-y-2 shrink-0 bg-white border-b border-slate-100">
                    {gallery.length > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {gallery.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => scrollToPhoto(idx)}
                              aria-label={`Photo ${idx + 1} of ${gallery.length}`}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                idx === safeIdx
                                  ? 'w-5 bg-[#0B3D2E]'
                                  : 'w-2 bg-slate-300 hover:bg-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-extrabold text-emerald-900 tabular-nums">
                          {safeIdx + 1}/{gallery.length}
                        </span>
                      </div>
                    )}

                    {gallery.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
                        {gallery.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => scrollToPhoto(idx)}
                            className={`w-13 h-12 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                              idx === safeIdx
                                ? 'border-[#0B3D2E] ring-2 ring-amber-400 scale-[1.03]'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* Main Detail Content */}
          <div className="p-5 flex-1 space-y-4">
            {/* Title & Price */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {selectedProduct.title}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {selectedProduct.location}
                  </span>
                  {activeTime && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Time: {activeTime}
                      </span>
                    </>
                  )}
                  {(selectedProduct.location.toLowerCase().includes((selectedCity || 'Rawalpindi').toLowerCase()) ||
                    isNearbyPakistanCity(selectedCity || 'Rawalpindi', selectedProduct.location)) && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-emerald-700">Aapke Kareeb</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {getAdPostedAgoLabel(selectedProduct)}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl font-extrabold text-emerald-700 tabular-nums block">
                  Rs {activePrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block">PKR</span>
              </div>
            </div>

            {/* Car Wash / Home Service Packages Selector */}
            {selectedProduct.packages && selectedProduct.packages.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                  Available Packages (Select One)
                </h4>
                <div className="space-y-2">
                  {selectedProduct.packages.map((pkg, idx) => {
                    const isSelected = selectedPkg?.name === pkg.name && selectedPkg?.price === pkg.price;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPkg(pkg)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs'
                            : 'bg-white/80 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <strong className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                            {pkg.name}
                          </strong>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Service Time: {pkg.time}</span>
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-700 tabular-nums shrink-0">
                          Rs {pkg.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SELLER DETAIL CARD: Name, Photo, Rating, Category, Visible Mobile Number */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
              <div className="flex items-center gap-3">
                {/* Seller Photo / Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-amber-300 font-extrabold flex items-center justify-center text-lg overflow-hidden shrink-0 border-2 border-white shadow-xs">
                  {selectedProduct.sellerPhoto ? (
                    <img
                      src={selectedProduct.sellerPhoto}
                      alt={selectedProduct.sellerName}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.sellerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{sellerInitials || <User className="w-6 h-6" />}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SellerVerifiedBadge
                      sellerName={selectedProduct.sellerName || 'Seller'}
                      isVerified={isSellerVerified(selectedProduct.sellerId, selectedProduct.sellerName)}
                      rating={selectedProduct.rating || 0}
                      reviewsCount={selectedProduct.reviewsCount || 0}
                      showProfileIcon={false}
                      nameClassName="font-extrabold text-slate-900 text-sm"
                    />
                    <SellerTypeBadge sellerType={getProductSellerType(selectedProduct)} size="sm" />
                  </div>

                  {/* Small box under seller name: ✅ ID Verified Seller + Eye icon "View ID Proof" */}
                  {sellerIsIdVerified && (
                    <div className="inline-flex items-center gap-2 bg-white border border-emerald-300 rounded-xl px-2.5 py-1 shadow-2xs my-0.5">
                      <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                        <span>✅ ID Verified Seller</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotShieldActive(false);
                          setShowMaskedIdModal(true);
                        }}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Eye className="w-3 h-3 shrink-0" />
                        <span>View ID Proof</span>
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span>Category: <strong className="text-emerald-900">{selectedProduct.category}</strong></span>
                  </div>

                  {/* Mandatory Visible Seller Mobile Number + Save Worker button for Buyer */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-extrabold text-emerald-950 font-mono">
                      <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{sellerPhoneDisplay}</span>
                    </div>

                    {authUser?.role !== 'seller' && (
                      <button
                        type="button"
                        onClick={() => {
                          const nowSaved = toggleSavedWorker(
                            {
                              sellerId: selectedProduct.sellerId,
                              sellerName: selectedProduct.sellerName || 'Worker',
                              sellerPhone: sellerPhoneDisplay,
                              category: selectedProduct.category,
                              location: selectedProduct.location,
                              sellerPhoto: selectedProduct.sellerPhoto || selectedProduct.image,
                              productId: selectedProduct.id,
                              productTitle: selectedProduct.title,
                            },
                            buyerWorkerStorageKey
                          );
                          setWorkerSaved(nowSaved);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          workerSaved
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-white border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            workerSaved ? 'fill-rose-500 text-rose-500' : 'text-rose-500'
                          }`}
                        />
                        <span>{workerSaved ? 'Saved Worker' : 'Save Worker'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OWN AD CONTROLS (Visible ONLY when logged-in seller's User ID owns this ad) */}
            {authUser?.role === 'seller' && isMyAd(selectedProduct) && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-950">
                    Your Ad Controls
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOwnPriceInput(selectedProduct.price.toString());
                        setIsEditingOwnPrice((prev) => !prev);
                        setConfirmOwnDelete(false);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit Price</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmOwnDelete((prev) => !prev);
                        setIsEditingOwnPrice(false);
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {isEditingOwnPrice && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      value={ownPriceInput}
                      onChange={(e) => setOwnPriceInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-bold font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = Number(ownPriceInput);
                        if (parsed > 0) {
                          updateProductPrice(selectedProduct.id, parsed);
                          setSelectedProduct({ ...selectedProduct, price: Math.round(parsed) });
                        }
                        setIsEditingOwnPrice(false);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}

                {confirmOwnDelete && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-red-800">Delete this ad permanently?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmOwnDelete(false)}
                        className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteProduct(selectedProduct.id);
                          setSelectedProduct(null);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SERVICE FLOW vs PRODUCT FLOW */}
            {isServiceListing ? (
              /* SERVICES ONLY 2 BUTTONS: "Chat with Seller" & "Book at Home" */
              <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-slate-900 block">
                      Doorstep Home Service · Cash on Work
                    </strong>
                    <span className="text-[11px] text-slate-500 block">
                      Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                    </span>
                  </div>
                </div>

                {!showBookAtHomeForm && !bookingSuccess && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Chat with Seller</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBookAtHomeForm(true)}
                      className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Home className="w-4 h-4 shrink-0" />
                      <span>Book at Home</span>
                    </button>
                  </div>
                )}

                {showBookAtHomeForm && !bookingSuccess && (
                  <form onSubmit={handleConfirmHomeBooking} className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Aapka Ghar Ka Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingAddress}
                        onChange={(e) => setBookingAddress(e.target.value)}
                        placeholder="House #, Street #, Mohalla, City..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base font-medium focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pasandeeda Time (Kab aayein?)
                      </label>
                      <input
                        type="text"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        placeholder="e.g. Today 5:00 PM / ASAP"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base font-medium focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Extra Details (Optional)
                      </label>
                      <input
                        type="text"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="e.g. Car model, service details"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base font-medium focus:outline-emerald-600"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBookAtHomeForm(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm cursor-pointer shadow-sm"
                      >
                        Confirm &amp; Send Address to Seller
                      </button>
                    </div>
                  </form>
                )}

                {bookingSuccess && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Booking Confirmed! Aapka address live chat me seller ko bhej diya gaya hai.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setIsChatModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-300" />
                      <span>Open Live Chat with Seller</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* PRODUCTS: "Order via Chat" + Send Location inside Chat + Cash on Spot */
              <div className="bg-emerald-50/70 rounded-2xl border-2 border-emerald-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <strong className="text-sm font-extrabold text-emerald-950 block">
                      Direct Order · Cash on Delivery
                    </strong>
                    <span className="text-[11px] text-emerald-800 font-semibold block">
                      Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-2 py-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-extrabold text-sm text-slate-900 min-w-[20px] text-center">
                      {orderQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOrderQty((q) => q + 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOrderViaChat}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>
                    Order via Chat · Rs {(activePrice * orderQty).toLocaleString()}
                  </span>
                </button>
                <p className="text-[11px] text-slate-600 text-center">
                  Chat me &quot;Send Location&quot; dabakar ghar ka address bhejein. Seller khud deliver karega aur spot par cash lega.
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Details
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedProduct.description}
              </p>
            </div>

            {/* Customer Rating & Reviews (0 stars default until real review) */}
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Customer Rating &amp; Reviews</span>
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedProduct.rating && selectedProduct.rating > 0 && selectedProduct.reviewsCount && selectedProduct.reviewsCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-500 font-black text-sm">★ {selectedProduct.rating.toFixed(1)}</span>
                        <span className="text-xs font-bold text-slate-600">
                          ({selectedProduct.reviewsCount} {selectedProduct.reviewsCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-xs">☆ No reviews yet (0 reviews)</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(!showReviewForm);
                    setReviewSuccess(false);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Star className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showReviewForm ? 'Cancel' : 'Write a Review'}</span>
                </button>
              </div>

              {showReviewForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addProductReview(
                      selectedProduct.id,
                      userRating,
                      reviewComment,
                      reviewerName.trim() || authUser?.name || 'Verified Buyer'
                    );
                    setReviewSuccess(true);
                    setReviewComment('');
                    setTimeout(() => {
                      setShowReviewForm(false);
                      setReviewSuccess(false);
                    }, 2000);
                  }}
                  className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Your Rating (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (hoverRating || userRating) >= star
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-extrabold text-amber-600 ml-2">
                        {hoverRating || userRating} / 5
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder={authUser?.name || 'Aapka Naam (Optional)'}
                    className="w-full px-3 py-1.5 text-base rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Product ya service kaisi lagi?"
                    className="w-full px-3 py-1.5 text-base rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              )}

              {reviewSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-300 text-xs font-bold flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>Shukriya! Aapka review add ho gaya.</span>
                </div>
              )}

              {(() => {
                const prodReviews = reviews.filter((r) => r.productId === selectedProduct.id);
                if (prodReviews.length === 0) return null;
                return (
                  <div className="space-y-2 pt-1 divide-y divide-slate-100">
                    {prodReviews.slice(0, 4).map((r) => (
                      <div key={r.id} className="pt-2 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-extrabold">{r.buyerName}</strong>
                          <div className="text-amber-500 font-bold text-[11px]">
                            {'★'.repeat(r.rating)}
                            {'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>
                        {r.comment && <p className="text-slate-600 text-[11px]">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Bharosa Banner + Report */}
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="text-[11px]">
                  <strong className="text-emerald-950 block font-extrabold">
                    Yahan Dhoka Nahi Hota - Bharosa Hi Pehchan Hai
                  </strong>
                  <span className="text-emerald-700 font-semibold">NAWAB · Ghar Baithe Nawabi</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="py-1 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold cursor-pointer shrink-0"
              >
                Report / Dhoka
              </button>
            </div>
          </div>
        </div>

        {/* ALWAYS-VISIBLE STICKY BOTTOM BAR: 1. "Chat Now" & 2. "Call Now" (Blue In-App Call) */}
        <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={handleOpenChat}
            className="py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-white/20" />
            <span>Chat Now</span>
          </button>

          <button
            type="button"
            onClick={handleInAppVoiceCall}
            className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 text-amber-300" />
            <span>Call Now</span>
          </button>
        </div>
      </div>

      <ReportDhokaModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        productId={selectedProduct.id}
        productTitle={selectedProduct.title}
        sellerId={selectedProduct.sellerId}
        sellerName={selectedProduct.sellerName}
      />

      {/* MASKED BUYER VIEW: ID PROOF MODAL (Heavy Blur + Watermark + Black Number Box + Screenshot Protection) */}
      {showMaskedIdModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl border-2 border-emerald-200 select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Header: Seller Name + Verified ONLY */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedProduct.sellerPhoto || selectedProduct.image ? (
                    <img
                      src={selectedProduct.sellerPhoto || selectedProduct.image}
                      alt={selectedProduct.sellerName}
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  ) : (
                    <span className="font-extrabold text-xs text-emerald-900">{sellerInitials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <strong className="text-sm font-extrabold text-slate-900 block truncate">
                    {selectedProduct.sellerName}
                  </strong>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMaskedIdModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close ID Proof"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Heavily Blurred ID Image + Watermark + Black Box over ID Card Number */}
            <div
              className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/40 select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {privateProof?.frontPhoto ? (
                <img
                  src={privateProof.frontPhoto}
                  alt="Protected Masked ID Verification"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover transition-all duration-150"
                  style={{
                    filter: screenshotShieldActive ? 'blur(28px) brightness(0.4)' : 'blur(16px)',
                    transform: 'scale(1.12)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-emerald-800 via-slate-800 to-emerald-950"
                  style={{
                    filter: screenshotShieldActive ? 'blur(28px)' : 'blur(14px)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <div
                className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-9 bg-black rounded-md border border-slate-700 flex items-center justify-center z-10 pointer-events-none select-none shadow-lg"
                aria-hidden="true"
              >
                <span className="text-[11px] font-mono font-extrabold text-white/90 tracking-widest uppercase">
                  █████-███████-█ · HIDDEN
                </span>
              </div>

              <div
                className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col items-center justify-between p-3 overflow-hidden"
                aria-hidden="true"
              >
                <div className="w-full flex justify-between text-[10px] font-black uppercase tracking-wider text-white/80 -rotate-12">
                  <span>{buyerWatermarkName}</span>
                  <span>NAWAB Verified Only</span>
                </div>
                <div className="bg-emerald-950/80 border border-amber-400/60 px-3 py-1 rounded-full text-[11px] font-black text-amber-300 tracking-wide shadow-md">
                  {buyerWatermarkName} · NAWAB Verified Only
                </div>
                <div className="w-full flex justify-between text-[10px] font-black uppercase tracking-wider text-white/80 rotate-12">
                  <span>NAWAB Verified Only</span>
                  <span>{buyerWatermarkName}</span>
                </div>
              </div>

              {screenshotShieldActive && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <Lock className="w-7 h-7 text-amber-400" />
                  <p className="text-xs font-extrabold text-white">
                    Privacy Shield Locked (Blur Protection Active)
                  </p>
                  <button
                    type="button"
                    onClick={() => setScreenshotShieldActive(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer"
                  >
                    Tap to View Masked Preview
                  </button>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1">
              <p className="text-xs font-extrabold text-amber-950 leading-snug">
                Screenshot lene par ye blur hi rahega, poora number kabhi show nahi hota
              </p>
              <p className="text-[11px] text-slate-600">
                Seller: <strong>{selectedProduct.sellerName}</strong> · Verified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN SWIPEABLE ZOOM GALLERY MODAL */}
      {isFullscreenZoomOpen && (() => {
        const rawGallery = [
          ...(selectedProduct.images && selectedProduct.images.length > 0
            ? selectedProduct.images
            : []),
          ...(selectedProduct.image ? [selectedProduct.image] : []),
        ].filter(Boolean);
        const gallery = Array.from(new Set(rawGallery)).slice(0, 5);
        if (gallery.length === 0) return null;
        const safeIdx = Math.min(activePhotoIdx, gallery.length - 1);

        const jumpZoomPhoto = (idx: number) => {
          const clamped = Math.max(0, Math.min(idx, gallery.length - 1));
          setActivePhotoIdx(clamped);
          setIsZoomedIn(false);
          const zEl = zoomScrollRef.current;
          if (zEl) {
            zEl.scrollTo({ left: clamped * zEl.clientWidth, behavior: 'smooth' });
          }
          const gEl = galleryScrollRef.current;
          if (gEl) {
            gEl.scrollTo({ left: clamped * gEl.clientWidth, behavior: 'smooth' });
          }
        };

        const handleZoomScroll = () => {
          const zEl = zoomScrollRef.current;
          if (!zEl || zEl.clientWidth <= 0) return;
          const nextIdx = Math.round(zEl.scrollLeft / zEl.clientWidth);
          if (nextIdx !== activePhotoIdx && nextIdx >= 0 && nextIdx < gallery.length) {
            setActivePhotoIdx(nextIdx);
            setIsZoomedIn(false);
            const gEl = galleryScrollRef.current;
            if (gEl) {
              gEl.scrollTo({ left: nextIdx * gEl.clientWidth, behavior: 'auto' });
            }
          }
        };

        return (
          <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col justify-between select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 text-white z-20">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-extrabold text-amber-300 tabular-nums shrink-0">
                  {safeIdx + 1} / {gallery.length}
                </span>
                <span className="text-xs font-semibold text-white/80 truncate">
                  {selectedProduct.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsZoomedIn((z) => !z)}
                  className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {isZoomedIn ? (
                    <>
                      <ZoomOut className="w-4 h-4 text-amber-300" />
                      <span>1x</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-4 h-4 text-amber-300" />
                      <span>Zoom 2x</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsZoomedIn(false);
                    setIsFullscreenZoomOpen(false);
                  }}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Close Full Screen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Swipeable Full-Screen Carousel */}
            <div className="relative flex-1 flex items-center overflow-hidden">
              <div
                ref={zoomScrollRef}
                onScroll={handleZoomScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsZoomedIn((z) => !z)}
                    className={`w-full h-full shrink-0 snap-center flex items-center justify-center p-2 sm:p-6 ${
                      isZoomedIn ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${selectedProduct.title} zoom ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className={`transition-transform duration-200 rounded-lg ${
                        isZoomedIn
                          ? 'scale-[1.85] max-w-none max-h-none object-contain'
                          : 'max-w-full max-h-[75vh] object-contain'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => jumpZoomPhoto(safeIdx === 0 ? gallery.length - 1 : safeIdx - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpZoomPhoto(safeIdx === gallery.length - 1 ? 0 : safeIdx + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Dots & Thumbnails */}
            {gallery.length > 1 && (
              <div className="px-4 py-3 bg-black/80 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-center gap-1.5">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => jumpZoomPhoto(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === safeIdx ? 'w-5 bg-amber-400' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => jumpZoomPhoto(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                        idx === safeIdx
                          ? 'border-amber-400 scale-105'
                          : 'border-white/25 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Zoom thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
