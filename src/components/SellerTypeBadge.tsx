import React from 'react';
import { Home, Store } from 'lucide-react';
import { SellerType } from '../types';

interface SellerTypeBadgeProps {
  sellerType?: SellerType;
  size?: 'xs' | 'sm';
  className?: string;
}

export const SellerTypeBadge: React.FC<SellerTypeBadgeProps> = ({
  sellerType,
  size = 'xs',
  className = '',
}) => {
  if (!sellerType) return null;

  const isHome = sellerType === 'home';
  const sizeClass =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1'
      : 'text-[10px] px-2 py-0.5 gap-1';

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-md border shrink-0 ${sizeClass} ${
        isHome
          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
          : 'bg-amber-50 text-amber-900 border-amber-300'
      } ${className}`}
    >
      {isHome ? (
        <Home className="w-3 h-3 text-emerald-700 shrink-0" />
      ) : (
        <Store className="w-3 h-3 text-amber-600 shrink-0" />
      )}
      <span>{isHome ? 'Home Wala' : 'Shop Wala'}</span>
    </span>
  );
};
