import React from 'react';

interface NawabPagriIconProps {
  className?: string;
}

export const NawabPagriIcon: React.FC<NawabPagriIconProps> = ({
  className = 'w-5 h-5',
}) => (
  <span
    className={`nawab-pagri-logo-wrap inline-flex items-center justify-center rounded-[22%] shrink-0 select-none ${className}`}
  >
    <img
      src="/assets/nawab-pagri-logo.png?v=2"
      alt="NAWAB Logo"
      draggable={false}
      className="w-full h-full object-cover block"
    />
    <span aria-hidden="true" className="nawab-pagri-shine" />
  </span>
);

interface NawabLogoBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const NawabLogoBadge: React.FC<NawabLogoBadgeProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-[22%]'
      : size === 'md'
      ? 'w-9 h-9 rounded-[22%]'
      : size === 'lg'
      ? 'w-14 h-14 rounded-[22%]'
      : 'w-16 h-16 rounded-[22%]';

  return (
    <div
      className={`nawab-pagri-logo-wrap inline-flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0 select-none ${sizeClasses} ${className}`}
    >
      <img
        src="/assets/nawab-pagri-logo.png?v=2"
        alt="NAWAB Pagri Logo"
        draggable={false}
        className="w-full h-full object-cover block"
      />
      <span aria-hidden="true" className="nawab-pagri-shine" />
    </div>
  );
};
