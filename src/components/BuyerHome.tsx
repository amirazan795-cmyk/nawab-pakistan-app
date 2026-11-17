import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Bell,
  Search,
  ChevronDown,
  ShoppingBag,
  User,
  MessageSquare,
  MessageCircle,
  ListOrdered,
  Home,
  ImageOff,
  ArrowLeft,
  Clock,
  Smile,
  Scissors,
  UserCheck,
  Shirt,
  Flower2,
  Hand,
  Car,
  Wrench,
  Snowflake,
  Sparkles,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Product } from '../types';
import { SellerVerifiedBadge } from './SellerVerifiedBadge';
import { SellerTypeBadge } from './SellerTypeBadge';
import { CitySelectModal } from './CitySelectModal';
import { ReportDhokaModal } from './ReportDhokaModal';
import { ShadiCarDecorCard } from './ShadiCarDecorCard';
import { BookBirthdayApartment } from './BookBirthdayApartment';
import { isNearbyPakistanCity } from '../data/pakistanCities';
import {
  NAWABI_CATEGORIES,
  CategoryDefinition,
  matchesProductCategory,
  isCarWashCategory,
  isAllowedHomeServiceCategory,
  matchesServiceSearch,
  searchMatchingCategories,
  SHADI_CAR_DECOR_CATEGORY_ID,
} from '../data/categories';
import { getAdPostedAgoLabel, getAdSortTimestampMs } from '../utils/adExpiry';

interface BuyerHomeProps {
  onOpenCart?: () => void;
  onOpenOrders: () => void;
  onOpenProfile: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onOpenPolicies: () => void;
}

const renderCategoryGoldIcon = (iconKey: CategoryDefinition['iconKey'], className = 'w-6 h-6') => {
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

export const BuyerHome: React.FC<BuyerHomeProps> = ({
  onOpenOrders,
  onOpenProfile,
  onOpenMessages,
  onOpenNotifications,
  onOpenPolicies,
}) => {
  const {
    products,
    selectedArea,
    selectedCity,
    userMohalla,
    searchQuery,
    setSearchQuery,
    setSelectedProduct,
    buyerTab,
    setBuyerTab,
    isSellerVerified,
    isSellerIdVerified,
    getProductSellerType,
    setCityAndArea,
    chatThreads,
    authUser,
    openChatWithSeller,
    orderViaChat,
  } = useApp();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryDefinition | null>(null);
  const [decorFilter, setDecorFilter] = useState<'Sab' | 'Dulhan' | 'Mehndi' | 'Barat'>('Sab');
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityModalStartStep, setCityModalStartStep] = useState<1 | 2>(1);
  const [reportingProduct, setReportingProduct] = useState<Product | null>(null);

  // Unread messages badge for buyer
  const unreadMessagesCount = chatThreads
    .filter(
      (t) =>
        !authUser?.phone ||
        t.buyerPhone.replace(/\D/g, '') === authUser.phone.replace(/\D/g, '')
    )
    .reduce((sum, t) => sum + (t.unreadForBuyer || 0), 0);

  const getProductLocationTier = (location: string): 1 | 2 | 3 | 4 => {
    const userCity = (selectedCity || 'Rawalpindi').toLowerCase().trim();
    const activeArea = (selectedArea || userMohalla || '').toLowerCase().trim();
    const locLower = (location || '').toLowerCase().trim();

    const isAllCityArea = activeArea.startsWith('all ') || activeArea === 'all areas' || !activeArea;
    if (!isAllCityArea && activeArea !== 'mere mohalle ka') {
      const cleanArea = activeArea.replace(userCity, '').trim();
      if (cleanArea && locLower.includes(cleanArea)) {
        return 1;
      }
    } else if (activeArea === 'mere mohalle ka') {
      const cleanMohalla = (userMohalla || 'Satellite Town').toLowerCase().replace(userCity, '').trim();
      if (cleanMohalla && locLower.includes(cleanMohalla)) {
        return 1;
      }
    }

    if (
      userCity === 'others' ||
      locLower.includes(userCity) ||
      (userCity === 'rawalpindi' && (locLower.includes('rawalpindi') || locLower.includes('pindi')))
    ) {
      return 2;
    }

    if (isNearbyPakistanCity(userCity, location)) {
      return 3;
    }

    return 4;
  };

  const getProductDistanceInfo = (prod: Product) => {
    const tier = getProductLocationTier(prod.location);
    if (tier === 1) {
      const dist = prod.distanceKm <= 0.6 ? 0.5 : Math.min(prod.distanceKm, 2.0);
      const tag = dist <= 0.8 ? '500m door' : `${dist}km door`;
      return { tier, distanceKm: dist, tag };
    }
    if (tier === 2) {
      const dist = Math.max(prod.distanceKm, 2.0);
      const tag = dist <= 2.5 ? '2km door' : `${dist}km door`;
      return { tier, distanceKm: dist, tag };
    }
    if (tier === 3) {
      return { tier, distanceKm: Math.max(prod.distanceKm, 15), tag: 'Aapke Kareeb' };
    }
    return { tier, distanceKm: Math.max(prod.distanceKm, 120), tag: 'Pakistan' };
  };

  const getFilteredProducts = (categoryId: string | null) => {
    return products
      .filter((prod) => {
        if (!isAllowedHomeServiceCategory(prod.category)) return false;
        const matchesCat = categoryId ? matchesProductCategory(prod.category, categoryId) : true;
        const matchesSearch = matchesServiceSearch(prod, searchQuery);
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        const distA = getProductDistanceInfo(a);
        const distB = getProductDistanceInfo(b);
        if (distA.tier !== distB.tier) return distA.tier - distB.tier;
        const tsDiff = getAdSortTimestampMs(b) - getAdSortTimestampMs(a);
        if (tsDiff !== 0) return tsDiff;
        return distA.distanceKm - distB.distanceKm;
      });
  };

  const matchingSearchCategories =
    !activeCategory && searchQuery.trim() ? searchMatchingCategories(searchQuery) : [];

  const baseDisplayedProducts = activeCategory
    ? getFilteredProducts(activeCategory.id)
    : searchQuery.trim()
    ? getFilteredProducts(null)
    : [];

  const displayedProducts =
    activeCategory?.isShadiCarDecor && decorFilter !== 'Sab'
      ? baseDisplayedProducts.filter((p) => {
          const text = `${p.title} ${p.description}`.toLowerCase();
          if (decorFilter === 'Dulhan') return text.includes('dulhan') || text.includes('bridal');
          if (decorFilter === 'Mehndi') return text.includes('mehndi');
          if (decorFilter === 'Barat') return text.includes('barat') || text.includes('baraat');
          return true;
        })
      : baseDisplayedProducts;

  const renderProductOrServiceCard = (product: Product, isCarWashView = false) => {
    const distInfo = getProductDistanceInfo(product);
    const hasPackages = product.packages && product.packages.length > 0;
    const photoCount = product.images && product.images.length > 0 ? Math.min(product.images.length, 5) : product.image ? 1 : 0;
    const matchedCat = NAWABI_CATEGORIES.find((c) =>
      matchesProductCategory(product.category, c.id)
    );
    const isServiceCard = matchedCat ? matchedCat.isService : true;

    return (
      <div
        key={product.id}
        onClick={() => setSelectedProduct(product)}
        className="bg-white rounded-xl border border-emerald-100 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
      >
        {/* Compact Daraz-Style Photo */}
        <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-2">
              <ImageOff className="w-6 h-6 text-amber-400 mb-0.5" />
              <span className="text-[10px] font-bold text-slate-500">No Photo</span>
            </div>
          )}

          <SellerTypeBadge
            sellerType={getProductSellerType(product)}
            className="absolute top-1.5 left-1.5 shadow-2xs scale-90 origin-top-left"
          />

          <div className="absolute top-1.5 right-1.5 bg-white/95 text-emerald-900 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 shadow-2xs">
            <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            <span className="truncate max-w-[60px]">{distInfo.tag}</span>
          </div>

          {photoCount > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/65 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums">
              1/{photoCount}
            </div>
          )}
        </div>

        {/* Compact Card Body */}
        <div className="p-2 flex flex-col flex-1 justify-between space-y-1.5">
          <div className="space-y-0.5">
            <SellerVerifiedBadge
              sellerName={product.sellerName || 'Seller'}
              isVerified={isSellerVerified(product.sellerId, product.sellerName)}
              nameClassName="text-[10px] font-bold text-slate-600"
              rating={product.rating || 0}
              reviewsCount={product.reviewsCount || 0}
            />

            <h3 className="font-extrabold text-slate-900 text-xs line-clamp-1 group-hover:text-emerald-700 transition-colors leading-snug">
              {product.title}
            </h3>

            {/* Car Wash Packages & Time OR Service Time */}
            {(isCarWashView || hasPackages) && hasPackages ? (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-1.5 space-y-0.5 mt-0.5">
                {product.packages!.slice(0, 2).map((pkg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[10px] text-slate-700"
                  >
                    <span className="truncate font-semibold pr-1">{pkg.name}</span>
                    <span className="font-extrabold text-emerald-700 shrink-0 tabular-nums">
                      Rs {pkg.price}
                    </span>
                  </div>
                ))}
              </div>
            ) : product.serviceTime ? (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                <span className="truncate">{product.serviceTime}</span>
              </div>
            ) : null}

            <div className="flex items-baseline justify-between gap-1 pt-0.5">
              <span className="text-sm font-black text-emerald-700 tabular-nums">
                Rs {product.price.toLocaleString()}
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                {getAdPostedAgoLabel(product)}
              </span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportingProduct(product);
                }}
                className="text-[9px] text-slate-400 hover:text-red-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                title="Report / Dhoka"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {isServiceCard ? (
            <div className="grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() =>
                  openChatWithSeller({
                    sellerId: product.sellerId,
                    sellerName: product.sellerName || 'Seller',
                    sellerPhone: product.sellerPhone || '0300-0000000',
                    productId: product.id,
                    productTitle: product.title,
                    category: product.category,
                  })
                }
                className="py-1.5 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <MessageCircle className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                <span className="truncate">Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="py-1.5 px-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Home className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">Book</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                orderViaChat({ product, quantity: 1 });
              }}
              className="w-full py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
            >
              <MessageCircle className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="truncate">Order via Chat</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 text-slate-800 pb-28 md:pb-12">
      {/* Sub-Header Bar: Small RED Warning / Policies button + Chat & Notifications */}
      <header className="sticky top-8 md:top-8 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenPolicies}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D32F2F] hover:bg-[#b71c1c] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Warning / Policies</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenMessages}
              className="p-2.5 rounded-full hover:bg-emerald-50 text-emerald-900 transition-colors relative cursor-pointer"
              aria-label="Live Chat"
            >
              <MessageSquare className="w-5 h-5 text-amber-500" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenNotifications}
              className="p-2.5 rounded-full hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-emerald-800" />
            </button>
          </div>
        </div>

        {/* Compact City & Area Strip */}
        <div className="bg-emerald-50/70 border-t border-emerald-100/70 px-4 py-1.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs gap-2">
            <button
              type="button"
              onClick={() => {
                setCityModalStartStep(1);
                setShowCityModal(true);
              }}
              className="flex items-center gap-1 text-emerald-950 font-bold hover:text-emerald-700 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-emerald-200/80 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] font-extrabold">{selectedCity || 'Rawalpindi'}</span>
              <ChevronDown className="w-3 h-3 text-emerald-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCityModalStartStep(2);
                setShowCityModal(true);
              }}
              className="flex items-center gap-1 text-emerald-900 font-semibold hover:text-emerald-700 cursor-pointer min-w-0 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200/60"
            >
              <span className="truncate text-[11px] font-bold">
                {selectedArea && selectedArea.toLowerCase().startsWith('all ')
                  ? `All ${selectedCity || 'Rawalpindi'}`
                  : selectedArea || userMohalla || 'All Areas'}
              </span>
              <ChevronDown className="w-3 h-3 text-emerald-600 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        {activeCategory?.isBirthdayApartment ? (
          <BookBirthdayApartment
            onBack={() => {
              setActiveCategory(null);
              setSearchQuery('');
            }}
          />
        ) : !activeCategory ? (
          /* BUYER SELECT PAGE */
          <>
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search electrician, plumber, AC repair, car wash, salon..."
                  className="w-full pl-11 pr-14 py-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* If user searched, show matching Home Service Categories + matching Worker listings */}
            {searchQuery.trim() ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Search Results ({displayedProducts.length > 0 ? displayedProducts.length : matchingSearchCategories.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Back to Select
                  </button>
                </div>

                {matchingSearchCategories.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900/80">
                      Matching Service Categories ({matchingSearchCategories.length})
                    </h3>
                    <div className="nawab-cat-grid grid grid-cols-2 gap-3 sm:gap-4">
                      {matchingSearchCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setDecorFilter('Sab');
                            setSearchQuery('');
                            setActiveCategory(cat);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-[#0B3D2E] hover:bg-[#0e4d3b] rounded-2xl p-4 border-2 border-amber-400/80 hover:border-amber-300 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between min-h-[104px] cursor-pointer active:scale-[0.98] group"
                        >
                          <div className="nawab-cat-icon-wrap w-10 h-10 rounded-xl bg-emerald-950/80 border border-amber-400/60 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                            {renderCategoryGoldIcon(cat.iconKey, 'w-5 h-5')}
                            <span aria-hidden="true" className="nawab-cat-shine" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs sm:text-sm text-white leading-snug block">
                              {cat.title}
                            </span>
                            {cat.subtitle && (
                              <span className="text-[10px] sm:text-[11px] text-amber-300 font-semibold block mt-0.5">
                                {cat.subtitle}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {displayedProducts.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900/80">
                      Available Workers &amp; Services ({displayedProducts.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                      {displayedProducts.map((prod) =>
                        renderProductOrServiceCard(prod, isCarWashCategory(prod.category))
                      )}
                    </div>
                  </div>
                ) : matchingSearchCategories.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 space-y-2">
                    <Search className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="font-extrabold text-sm text-slate-800">
                      "{searchQuery}" ke liye koi home service nahi mili
                    </p>
                    <p className="text-xs text-slate-500">
                      Kisi aur lafz se search karein (maslan mehndi, naai, bijli wala, gari wash, AC).
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-4 text-center border border-emerald-100 text-xs text-slate-600 font-medium">
                    Upar category par tap karein. Jab is service mein naye workers ad lagayenge to yahan direct nazar aayenge.
                  </div>
                )}
              </section>
            ) : (
              /* Heading "Select" with all Dark Green #0B3D2E boxes in 2 columns */
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-emerald-950 tracking-tight">
                  Select
                </h2>

                <div className="nawab-cat-grid grid grid-cols-2 gap-3 sm:gap-4">
                  {NAWABI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDecorFilter('Sab');
                        setActiveCategory(cat);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-[#0B3D2E] hover:bg-[#0e4d3b] rounded-2xl p-4 border-2 border-amber-400/80 hover:border-amber-300 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between min-h-[112px] cursor-pointer active:scale-[0.98] group"
                    >
                      <div className="nawab-cat-icon-wrap w-11 h-11 rounded-xl bg-emerald-950/80 border border-amber-400/60 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                        {renderCategoryGoldIcon(cat.iconKey, 'w-6 h-6')}
                        <span aria-hidden="true" className="nawab-cat-shine" />
                      </div>

                      <div>
                        <span className="font-extrabold text-xs sm:text-sm text-white leading-snug block">
                          {cat.title}
                        </span>
                        {cat.subtitle && (
                          <span className="text-[10px] sm:text-[11px] text-amber-300 font-semibold block mt-0.5">
                            {cat.subtitle}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ACTIVE CATEGORY PAGE */
          <section className="space-y-4">
            {/* Category Header + Back Button */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer shrink-0 transition-colors"
                  aria-label="Back to Select"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-xl bg-[#0B3D2E] border border-amber-400/70 flex items-center justify-center shrink-0">
                  {renderCategoryGoldIcon(activeCategory.iconKey, 'w-5 h-5')}
                </div>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-extrabold text-emerald-950 truncate">
                    {activeCategory.title}
                  </h1>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {displayedProducts.length}{' '}
                    {activeCategory.isCarWash
                      ? 'Wash Providers'
                      : activeCategory.isShadiCarDecor
                      ? 'Car Decor Designs'
                      : 'Service Providers'}{' '}
                    Available
                  </p>
                </div>
              </div>
            </div>

            {/* Shadi Car Decor Filter Tabs: Sab / Dulhan / Mehndi / Barat */}
            {activeCategory.isShadiCarDecor && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {(['Sab', 'Dulhan', 'Mehndi', 'Barat'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDecorFilter(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
                      decorFilter === tab
                        ? 'bg-[#0B3D2E] text-amber-300 border-amber-400 shadow-xs'
                        : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Category Search Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeCategory.title}...`}
                className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-white border border-emerald-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 text-xs font-bold text-emerald-700 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Real Sellers List (NO DEMO/FAKE PRODUCTS) */}
            {displayedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-emerald-100 shadow-2xs space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#0B3D2E] border-2 border-amber-400/80 mx-auto flex items-center justify-center">
                  {renderCategoryGoldIcon(activeCategory.iconKey, 'w-7 h-7')}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Abhi is category mein koi listing nahi hai
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {activeCategory.isCarWash
                    ? 'Jab koi real Gari / Bike Wash provider apne packages, price aur time ke sath post karega to yahan foran nazar aayega.'
                    : activeCategory.isShadiCarDecor
                    ? 'Jab koi real Shadi Car Decor seller apne phool aur gari sajawat ke designs post karega to yahan foran nazar aayenge.'
                    : `Jab koi real provider "${activeCategory.title}" mein service post karega to woh yahan nazar aayegi.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-[#0B3D2E] hover:bg-[#0e4d3b] text-amber-300 border border-amber-400/70 text-xs font-extrabold rounded-xl cursor-pointer transition-colors"
                >
                  Back to Select
                </button>
              </div>
            ) : activeCategory.isShadiCarDecor || activeCategory.id === SHADI_CAR_DECOR_CATEGORY_ID ? (
              /* COMPACT DARAZ-STYLE 2-PER-ROW CARDS WITH SWIPEABLE GALLERY FOR SHADI CAR DECOR */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {displayedProducts.map((product) => (
                  <ShadiCarDecorCard
                    key={product.id}
                    product={product}
                    sellerType={getProductSellerType(product)}
                    isBlueTickVerified={isSellerVerified(product.sellerId, product.sellerName)}
                    isIdVerified={isSellerIdVerified(product.sellerId, product.sellerName)}
                    onSelect={(p) => setSelectedProduct(p)}
                    onChat={(p) =>
                      openChatWithSeller({
                        sellerId: p.sellerId,
                        sellerName: p.sellerName || 'Seller',
                        sellerPhone: p.sellerPhone || '0300-0000000',
                        productId: p.id,
                        productTitle: p.title,
                        category: p.category,
                      })
                    }
                    onReport={(p) => setReportingProduct(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {displayedProducts.map((product) =>
                  renderProductOrServiceCard(product, !!activeCategory.isCarWash)
                )}
              </div>
            )}
          </section>
        )}

        <footer className="pt-4 pb-2 text-center">
          <span className="text-xs font-extrabold tracking-wide text-emerald-900/70 block">
            NAWAB
          </span>
        </footer>
      </main>

      {/* Clean Bottom Navigation Bar (Center Cart replaced with Chat icon) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => {
              setBuyerTab('home');
              setActiveCategory(null);
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              buyerTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-1">Select</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBuyerTab('home');
              setActiveCategory(null);
              setTimeout(() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 50);
            }}
            className="flex flex-col items-center justify-center py-1 cursor-pointer text-slate-500 hover:text-emerald-700"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-1">Search</span>
          </button>

          <button
            type="button"
            onClick={onOpenMessages}
            className="flex flex-col items-center justify-center py-1 cursor-pointer text-slate-600 relative"
            aria-label="Chat"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-4 h-4 fill-white/15" />
              </div>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-extrabold text-emerald-800">Chat</span>
          </button>

          <button
            type="button"
            onClick={onOpenOrders}
            className="flex flex-col items-center justify-center py-1 cursor-pointer text-slate-500 hover:text-emerald-700"
          >
            <ListOrdered className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-1">Orders</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 cursor-pointer text-slate-500 hover:text-emerald-700"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1">Profile</span>
          </button>
        </div>
      </nav>

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

      <CitySelectModal
        isOpen={showCityModal}
        selectedCity={selectedCity || 'Rawalpindi'}
        selectedArea={selectedArea}
        startStep={cityModalStartStep}
        onSelectCity={(newCity, newArea) => {
          setCityAndArea(newCity, newArea);
        }}
        onClose={() => setShowCityModal(false)}
        title="Aapka Shehr / Select Your City"
      />
    </div>
  );
};
