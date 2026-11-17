import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  CheckCircle2,
  ImageOff,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { Product, SellerType } from '../types';
import { SellerVerifiedBadge } from './SellerVerifiedBadge';
import { SellerTypeBadge } from './SellerTypeBadge';
import { getAdPostedAgoLabel } from '../utils/adExpiry';

export const CarWithRosesIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Car body in rich rose/pink-red */}
    <path
      d="M7.5 18.5L10.4 11.8C11.1 10.2 12.6 9.2 14.3 9.2H21.7C23.4 9.2 24.9 10.2 25.6 11.8L28.5 18.5H7.5Z"
      fill="#F43F5E"
      stroke="#BE123C"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Windshield */}
    <path
      d="M11.6 17L13.3 12.2C13.7 11.4 14.4 11 15.2 11H20.8C21.6 11 22.3 11.4 22.7 12.2L24.4 17H11.6Z"
      fill="#FFE4E6"
    />
    {/* Lower chassis */}
    <rect
      x="5"
      y="17.5"
      width="26"
      height="7.5"
      rx="3"
      fill="#E11D48"
      stroke="#9F1239"
      strokeWidth="1.5"
    />
    {/* Wheels */}
    <circle cx="10.5" cy="25.5" r="3" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.2" />
    <circle cx="25.5" cy="25.5" r="3" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.2" />
    {/* Green flower leaves / garland ribbon across hood */}
    <path
      d="M8.5 18.2C12 20.8 24 20.8 27.5 18.2"
      stroke="#16A34A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Red & Pink Roses on top and hood */}
    <circle cx="18" cy="7.5" r="3.2" fill="#EC4899" stroke="#9D174D" strokeWidth="1.1" />
    <circle cx="18" cy="7.5" r="1.3" fill="#FFF1F2" />
    <circle cx="12.5" cy="19.5" r="2.7" fill="#FB7185" stroke="#9F1239" strokeWidth="1.1" />
    <circle cx="18" cy="20.4" r="3" fill="#E11D48" stroke="#881337" strokeWidth="1.1" />
    <circle cx="23.5" cy="19.5" r="2.7" fill="#EC4899" stroke="#9D174D" strokeWidth="1.1" />
  </svg>
);

interface ShadiCarDecorCardProps {
  product: Product;
  sellerType?: SellerType;
  isBlueTickVerified: boolean;
  isIdVerified: boolean;
  onSelect: (product: Product) => void;
  onChat: (product: Product) => void;
  onReport: (product: Product) => void;
}

export const ShadiCarDecorCard: React.FC<ShadiCarDecorCardProps> = ({
  product,
  sellerType,
  isBlueTickVerified,
  isIdVerified,
  onSelect,
  onChat,
  onReport,
}) => {
  const galleryPhotos =
    product.images && product.images.length > 0
      ? product.images.slice(0, 5)
      : product.image
      ? [product.image]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = galleryPhotos.length > 0 ? Math.min(activeIndex, galleryPhotos.length - 1) : 0;
  const activePhoto = galleryPhotos[safeIndex] || '';

  const goPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryPhotos.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1));
  };

  const goNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryPhotos.length <= 1) return;
    setActiveIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || galleryPhotos.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 35) {
      goNext();
    } else if (diff < -35) {
      goPrev();
    }
    touchStartX.current = null;
  };

  const phoneDisplay = product.sellerPhone || '0300-0000000';

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl border border-emerald-100 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col justify-between group"
    >
      {/* COMPACT SWIPEABLE PHOTO */}
      <div
        className="relative w-full h-28 sm:h-32 bg-slate-100 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activePhoto ? (
          <img
            src={activePhoto}
            alt={`${product.title} photo ${safeIndex + 1}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
            <ImageOff className="w-6 h-6 text-amber-400 mb-0.5" />
            <span className="text-[10px] font-bold">No Photo</span>
          </div>
        )}

        <SellerTypeBadge
          sellerType={sellerType || product.sellerType || 'shop'}
          className="absolute top-1.5 left-1.5 shadow-2xs scale-90 origin-top-left"
        />

        {/* Top-right Photo Counter */}
        {galleryPhotos.length > 1 && (
          <div className="absolute top-1.5 right-1.5 bg-black/65 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums">
            {safeIndex + 1}/{galleryPhotos.length}
          </div>
        )}

        {/* Swipe Arrows */}
        {galleryPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Bottom Dots */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/45 px-1.5 py-0.5 rounded-full">
              {galleryPhotos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  aria-label={`View photo ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/55'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* COMPACT CARD BODY */}
      <div className="p-2 flex flex-col flex-1 justify-between space-y-1.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            <SellerVerifiedBadge
              sellerName={product.sellerName || 'Seller'}
              isVerified={isBlueTickVerified}
              nameClassName="text-[10px] font-bold text-slate-600"
              rating={product.rating || 0}
              reviewsCount={product.reviewsCount || 0}
            />
            {isIdVerified && (
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            )}
          </div>

          <h3 className="font-extrabold text-xs text-slate-900 line-clamp-1 leading-snug group-hover:text-emerald-700 transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="truncate">{product.location || 'Ghar aake karenge'}</span>
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
              {getAdPostedAgoLabel(product)}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-sm font-black text-emerald-700 tabular-nums">
              Rs {product.price.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReport(product);
              }}
              className="text-[9px] text-slate-400 hover:text-red-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onChat(product)}
            className="py-1.5 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <MessageCircle className="w-2.5 h-2.5 text-amber-300 shrink-0" />
            <span>Chat</span>
          </button>

          <a
            href={`tel:${phoneDisplay}`}
            className="py-1.5 px-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span>Call</span>
          </a>
        </div>
      </div>
    </div>
  );
};
