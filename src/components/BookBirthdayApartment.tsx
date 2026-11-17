import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  MessageCircle,
  Search,
  ImageOff,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { BOOK_FOR_BIRTHDAY_CATEGORY_ID, matchesProductCategory } from '../data/categories';
import { buildWhatsAppBookingUrl } from '../data/birthdayAndGifts';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { SellerVerifiedBadge } from './SellerVerifiedBadge';
import { SellerTypeBadge } from './SellerTypeBadge';
import { ReportDhokaModal } from './ReportDhokaModal';
import { getAdPostedAgoLabel, getAdSortTimestampMs } from '../utils/adExpiry';

interface BookBirthdayApartmentProps {
  onBack: () => void;
}

export const BookBirthdayApartment: React.FC<BookBirthdayApartmentProps> = ({ onBack }) => {
  const {
    products,
    authUser,
    selectedCity,
    selectedArea,
    isSellerVerified,
    getProductSellerType,
    setSelectedProduct,
    openChatWithSeller,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [reportingApartment, setReportingApartment] = useState<Product | null>(null);

  const realApartments = products
    .filter((prod) => {
      const isBirthdayApt = matchesProductCategory(prod.category, BOOK_FOR_BIRTHDAY_CATEGORY_ID);
      if (!isBirthdayApt) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        prod.title.toLowerCase().includes(q) ||
        prod.description.toLowerCase().includes(q) ||
        prod.location.toLowerCase().includes(q) ||
        prod.sellerName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => getAdSortTimestampMs(b) - getAdSortTimestampMs(a));

  const locationSummary =
    selectedArea && !selectedArea.toLowerCase().startsWith('all ')
      ? `${selectedArea}, ${selectedCity || 'Rawalpindi'}`
      : selectedCity || 'Rawalpindi';

  return (
    <section className="space-y-4">
      {/* Dark Green & Gold Category Header */}
      <div className="bg-[#0B3D2E] rounded-2xl p-4 border-2 border-amber-400/80 shadow-sm text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-950/80 hover:bg-emerald-950 border border-amber-400/60 text-amber-400 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            aria-label="Back to Select"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-amber-400/60 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-white truncate">
              Book for Birthday
            </h1>
            <p className="text-[11px] text-amber-300 font-semibold truncate">
              {realApartments.length === 0
                ? 'Real Seller Apartments · 0 Available'
                : `${realApartments.length} Real Apartments Available · ${locationSummary}`}
            </p>
          </div>
        </div>
      </div>

      {/* Only show search when real apartments exist */}
      {realApartments.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search real apartments by area or name..."
            className="w-full pl-10 pr-14 py-2.5 rounded-xl bg-white border border-emerald-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
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
      )}

      {/* Empty State when NO real seller has added an apartment */}
      {realApartments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-emerald-200 shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0B3D2E] border-2 border-amber-400/80 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-emerald-950">
            Abhi koi Apartment available nahi hai
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery.trim()
              ? `"${searchQuery}" ke liye koi real seller apartment nahi mila.`
              : 'Jab koi real seller apna Birthday / Anniversary Apartment add karega to woh yahan foran nazar aayega.'}
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 bg-[#0B3D2E] hover:bg-[#0e4d3b] text-amber-300 border border-amber-400/70 text-xs font-extrabold rounded-xl cursor-pointer transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 bg-[#0B3D2E] hover:bg-[#0e4d3b] text-amber-300 border border-amber-400/70 text-xs font-extrabold rounded-xl cursor-pointer transition-colors"
            >
              Back to Select
            </button>
          )}
        </div>
      ) : (
        /* Compact Daraz-Style Real Seller Apartments */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {realApartments.map((apt) => {
            const photoCount = apt.images && apt.images.length > 0 ? Math.min(apt.images.length, 5) : apt.image ? 1 : 0;
            const waMsg = [
              `*NAWAB Apartment Booking Inquiry*`,
              `Apartment: ${apt.title}`,
              `Price: Rs ${apt.price.toLocaleString()}`,
              `Location: ${apt.location}`,
              authUser?.name ? `Customer: ${authUser.name}` : null,
              authUser?.phone ? `Phone: ${authUser.phone}` : null,
            ]
              .filter(Boolean)
              .join('\n');
            const sellerWhatsAppUrl = buildWhatsAppBookingUrl(apt.sellerPhone, waMsg);

            return (
              <div
                key={apt.id}
                onClick={() => setSelectedProduct(apt)}
                className="bg-white rounded-xl border border-emerald-200 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {apt.image ? (
                      <img
                        src={apt.image}
                        alt={apt.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                        <ImageOff className="w-6 h-6 text-amber-400 mb-0.5" />
                        <span className="text-[10px] font-bold text-slate-500">No Photo</span>
                      </div>
                    )}

                    <SellerTypeBadge
                      sellerType={getProductSellerType(apt)}
                      className="absolute top-1.5 left-1.5 shadow-2xs scale-90 origin-top-left"
                    />

                    <div className="absolute top-1.5 right-1.5 bg-white/95 text-emerald-950 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 shadow-2xs max-w-[55%]">
                      <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      <span className="truncate">{apt.location}</span>
                    </div>

                    {photoCount > 1 && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/65 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums">
                        1/{photoCount}
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-0.5">
                    <SellerVerifiedBadge
                      sellerName={apt.sellerName || 'Seller'}
                      isVerified={isSellerVerified(apt.sellerId, apt.sellerName)}
                      nameClassName="text-[10px] font-bold text-slate-600"
                      rating={apt.rating || 0}
                      reviewsCount={apt.reviewsCount || 0}
                    />

                    <h3 className="font-extrabold text-emerald-950 text-xs leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {apt.title}
                    </h3>

                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-sm font-black text-emerald-800 tabular-nums">
                        Rs {apt.price.toLocaleString()}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                        {getAdPostedAgoLabel(apt)}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingApartment(apt);
                        }}
                        className="text-[9px] text-slate-400 hover:text-red-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Report / Dhoka"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="px-2 pb-2 pt-1.5 border-t border-emerald-100 grid grid-cols-2 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openChatWithSeller({
                        sellerId: apt.sellerId,
                        sellerName: apt.sellerName || 'Seller',
                        sellerPhone: apt.sellerPhone || '',
                        productId: apt.id,
                        productTitle: apt.title,
                        category: apt.category,
                      })
                    }
                    className="py-1.5 px-1 rounded-lg bg-[#0B3D2E] hover:bg-[#0e4d3b] text-amber-300 border border-amber-400/60 font-extrabold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">Chat</span>
                  </button>

                  {sellerWhatsAppUrl ? (
                    <a
                      href={sellerWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Phone className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(apt)}
                      className="py-1.5 px-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Building2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">Details</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reportingApartment && (
        <ReportDhokaModal
          isOpen={!!reportingApartment}
          onClose={() => setReportingApartment(null)}
          productId={reportingApartment.id}
          productTitle={reportingApartment.title}
          sellerId={reportingApartment.sellerId}
          sellerName={reportingApartment.sellerName}
        />
      )}
    </section>
  );
};
