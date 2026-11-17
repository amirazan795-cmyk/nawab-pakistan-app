import React from 'react';
import { ShoppingBag, Store, ArrowRight } from 'lucide-react';
import { NawabLogoBadge } from './NawabLogo';
import { useApp } from '../context/AppContext';

interface WelcomePageProps {
  onSelectRole?: (selected: 'buyer' | 'seller') => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onSelectRole }) => {
  const { savedSellerProfile, restoreSavedSellerSession } = useApp();

  const handlePick = async (target: 'buyer' | 'seller') => {
    if (target === 'seller' && savedSellerProfile) {
      const res = await restoreSavedSellerSession();
      if (res.ok) {
        return;
      }
    }
    if (onSelectRole) {
      onSelectRole(target);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 text-slate-800 flex flex-col justify-between items-center p-5 sm:p-8 selection:bg-emerald-200">
      <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto">
        <div className="w-full space-y-8">
          {/* Top Brand Title: NAWAB & Ghar Baithe Nawabi */}
          <header className="text-center space-y-2.5 select-none">
            <NawabLogoBadge size="xl" className="mb-1" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-emerald-950 tracking-tight leading-tight">
                NAWAB
              </h1>
              <p className="text-sm sm:text-base font-bold text-emerald-700 mt-1">
                Ghar Baithe Nawabi
              </p>
            </div>
          </header>

          {/* 2 Clean Roles Only: 1. BUY  2. SELL */}
          <main className="space-y-4">
            {/* 1. BUY */}
            <button
              type="button"
              onClick={() => handlePick('buyer')}
              className="w-full bg-white hover:bg-emerald-50/70 rounded-3xl p-5 sm:p-6 shadow-md shadow-emerald-900/5 border-2 border-emerald-200 hover:border-emerald-500 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-950 block tracking-tight">
                    1. BUY
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-0.5">
                    Ghar Baithe Home Services Book Karein
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* 2. SELL */}
            <button
              type="button"
              onClick={() => handlePick('seller')}
              className="w-full bg-white hover:bg-emerald-50/70 rounded-3xl p-5 sm:p-6 shadow-md shadow-emerald-900/5 border-2 border-emerald-200 hover:border-emerald-500 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Store className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-950 block tracking-tight">
                    2. SELL
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-0.5">
                    Apni Home Service Free Post Karein
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </main>
        </div>
      </div>

      <footer className="pt-8 pb-2 text-center">
        <span className="text-xs font-extrabold tracking-wide text-emerald-900/70 block">
          NAWAB
        </span>
      </footer>
    </div>
  );
};
