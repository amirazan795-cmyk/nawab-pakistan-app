import React from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, User, ArrowLeft, BadgeCheck } from 'lucide-react';
import { NawabPagriIcon } from './NawabLogo';

interface RoleSwitcherBarProps {
  onBackToWelcome?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ onBackToWelcome }) => {
  const {
    authUser,
    refreshData,
    setIsBlueTickPageOpen,
    currentSeller,
  } = useApp();

  const isVerifiedSeller =
    authUser?.role === 'seller' &&
    (currentSeller.hasBlueTick || currentSeller.blueTickStatus === 'verified');

  return (
    <aside aria-label="Top Controls" className="bg-emerald-950 text-white text-xs border-b border-emerald-900 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!authUser?.isLoggedIn && onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Home</span>
            </button>
          )}
          <div className="leading-tight select-none">
            <span className="font-black tracking-tight text-amber-400 flex items-center gap-1.5 text-sm">
              <NawabPagriIcon className="w-5 h-5 shrink-0" />
              NAWAB
            </span>
            <span className="text-[10px] text-emerald-200 font-semibold block">
              Ghar Baithe Nawabi
            </span>
          </div>
        </div>

        {authUser?.role === 'seller' && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setIsBlueTickPageOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 via-blue-500/25 to-indigo-500/20 hover:from-sky-500/35 hover:via-blue-500/40 hover:to-indigo-500/35 active:scale-95 text-white border border-sky-400/70 shadow-sm shadow-sky-500/20 text-[11px] font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-all"
            >
              <BadgeCheck className="w-4 h-4 fill-sky-500 text-white shrink-0" />
              <span>{isVerifiedSeller ? 'Blue Tick Active' : 'Get Blue Tick'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {authUser?.isLoggedIn && (
            <div className="flex items-center gap-1.5 bg-emerald-900/90 px-2.5 py-1 rounded-lg border border-emerald-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-100">
                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="max-w-[120px] sm:max-w-[150px] truncate font-semibold text-white">
                  {authUser.name}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={refreshData}
            title="Refresh and reload data"
            aria-label="Refresh and reload data"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer text-xs min-h-[32px]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

