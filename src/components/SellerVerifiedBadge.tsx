import React from 'react';
import { BadgeCheck, User, Star } from 'lucide-react';

interface SellerVerifiedBadgeProps {
  sellerName: string;
  isVerified: boolean;
  className?: string;
  nameClassName?: string;
  showProfileIcon?: boolean;
  showRating?: boolean;
  rating?: number;
  reviewsCount?: number;
}

/**
 * Standard BHAROSA SYSTEM Seller Badge Display:
 * - Small circular profile icon with person silhouette (👤)
 * - Seller Shop Name
 * - For Verified sellers: small Blue Tick icon (✅) + small blue "Verified" text
 * - Rating: 0 Stars / "No reviews yet" by default until real buyer review
 */
export const SellerVerifiedBadge: React.FC<SellerVerifiedBadgeProps> = ({
  sellerName,
  isVerified,
  className = '',
  nameClassName = 'text-xs font-bold text-slate-800',
  showProfileIcon = true,
  showRating = true,
  rating = 0,
  reviewsCount = 0,
}) => {
  const hasReviews = (rating && rating > 0) && (reviewsCount && reviewsCount > 0);

  return (
    <div className={`inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap ${className}`}>
      {/* Small circular profile icon with person silhouette */}
      {showProfileIcon && (
        <span
          className="w-4 h-4 rounded-full bg-slate-200/90 text-slate-600 flex items-center justify-center shrink-0 border border-slate-300/80 shadow-2xs"
          aria-hidden="true"
        >
          <User className="w-2.5 h-2.5 text-slate-600 stroke-[2.5]" />
        </span>
      )}

      {/* Seller Shop Name */}
      <span className={`truncate ${nameClassName}`} title={sellerName}>
        {sellerName}
      </span>

      {/* Verified: Small Blue Tick + small blue Verified text */}
      {isVerified && (
        <span
          className="inline-flex items-center gap-0.5 text-blue-600 font-extrabold shrink-0"
          title="Verified / Blue Tick"
        >
          <BadgeCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-500 text-white shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 leading-none">
            Verified
          </span>
        </span>
      )}

      {/* Rating: 0 Stars / "No reviews yet" by default until real reviews */}
      {showRating && (
        hasReviews ? (
          <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold text-[10px] shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
            <span className="ml-0.5 text-amber-900 font-extrabold font-mono leading-none">
              {rating.toFixed(1)}
            </span>
            <span className="text-[9px] text-amber-700 ml-0.5 font-normal">
              ({reviewsCount})
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-slate-500 font-bold text-[9px] shrink-0 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            <Star className="w-2.5 h-2.5 text-slate-400" />
            <span>No reviews yet</span>
          </span>
        )
      )}
    </div>
  );
};
