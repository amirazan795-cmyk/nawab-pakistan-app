import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  BadgeCheck,
  Check,
  Copy,
  AlertTriangle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  FileCheck,
  Camera,
  TrendingUp,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { IdCardVerificationBox } from './IdCardVerificationBox';
import { compressDataUrlOrFile } from '../utils/imageCompress';

interface BlueTickPageProps {
  onBack?: () => void;
}

type PlanId = 'monthly' | 'quarterly' | 'yearly';

interface BlueTickPlan {
  id: PlanId;
  name: string;
  durationLabel: string;
  price: number;
  subPriceLabel: string;
  highlight?: string;
  benefits: string[];
}

export const BlueTickPage: React.FC<BlueTickPageProps> = ({ onBack }) => {
  const {
    authUser,
    currentSeller,
    submitBlueTickRequest,
    setSellerTab,
    hasSellerUploadedId,
    blueTickPrice,
    adminJazzCashNumber,
    adminJazzCashTitle,
  } = useApp();

  const yearlyPrice = blueTickPrice || 2000;

  const plans: BlueTickPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      durationLabel: '1 Month',
      price: 500,
      subPriceLabel: 'Per month plan',
      benefits: [
        'Trusted Seller Blue Tick badge on your profile & ads',
        'Higher buyer confidence for faster responses',
        'Priority visibility in category listings',
      ],
    },
    {
      id: 'quarterly',
      name: '3 Months',
      durationLabel: '3 Months',
      price: 1200,
      subPriceLabel: 'Rs 400 / month · Save Rs 300',
      highlight: 'POPULAR',
      benefits: [
        'Trusted Seller Blue Tick badge across all ads',
        'Top ranking boost in category & search results',
        'More direct orders and buyer inquiries',
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly',
      durationLabel: '12 Months',
      price: yearlyPrice,
      subPriceLabel: `Rs ${Math.round(yearlyPrice / 12)} / month · Save 67%`,
      highlight: 'BEST VALUE',
      benefits: [
        'Official Trusted Seller Badge for a full year',
        '#1 Top Ranking priority in buyer searches',
        'Maximum orders & fast-track customer trust',
        'Full 12 months uninterrupted verification',
      ],
    },
  ];

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('yearly');
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[2];

  const [tid, setTid] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [tidError, setTidError] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(
    currentSeller.blueTickStatus === 'pending' || !!currentSeller.blueTickTid
  );
  const [submittedTid, setSubmittedTid] = useState(currentSeller.blueTickTid || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(adminJazzCashNumber || '03181563300');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      try {
        const compressed = await compressDataUrlOrFile(file, 820, 0.7);
        setScreenshot(compressed);
      } catch {
        // Fallback ignore
      }
    }
  };

  const hasIdPhotos = hasSellerUploadedId(currentSeller.id);
  const isSellerMode = authUser?.role === 'seller';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasIdPhotos) {
      setTidError('Blue Tick ke liye pehle ID Card - Front aur Back Photo upload karein.');
      return;
    }
    if (!tid.trim()) {
      setTidError('Please enter your JazzCash Transaction ID (TID).');
      return;
    }
    setTidError('');

    submitBlueTickRequest(tid.trim(), screenshot || undefined, selectedPlan.price);
    setSubmittedTid(tid.trim());
    setIsSubmitted(true);
  };

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else {
      setSellerTab('products');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-3.5 sm:p-4 space-y-4 animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={handleReturn}
          className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase block">
            Official Verification
          </span>
          <span className="text-xs font-extrabold text-emerald-950 tracking-tight">
            NAWAB Blue Tick Plans
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-[#0B3D2E] to-emerald-900 text-white rounded-3xl p-5 border border-amber-400/50 shadow-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-sky-500/20 border border-sky-400/60 mx-auto">
          <BadgeCheck className="w-8 h-8 fill-sky-500 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center justify-center gap-2">
          <span>Get Verified Blue Tick</span>
          <BadgeCheck className="w-5 h-5 fill-sky-400 text-emerald-950 shrink-0" />
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed">
          Build instant buyer trust on NAWAB, appear higher in search results, and win more daily orders.
        </p>

        {/* Core 3 Benefits Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center space-y-1">
            <Award className="w-4 h-4 text-sky-400 mx-auto" />
            <span className="text-[11px] font-bold text-white block leading-tight">
              Trusted Seller Badge
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center space-y-1">
            <TrendingUp className="w-4 h-4 text-amber-400 mx-auto" />
            <span className="text-[11px] font-bold text-white block leading-tight">
              Top Ranking
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center space-y-1">
            <ShoppingBag className="w-4 h-4 text-emerald-300 mx-auto" />
            <span className="text-[11px] font-bold text-white block leading-tight">
              More Orders
            </span>
          </div>
        </div>
      </div>

      {/* 3 Verification Plans: Monthly, 3 Months, Yearly */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-900">
            Choose Your Verification Plan
          </h2>
          <span className="text-[11px] font-bold text-blue-700">
            3 Plans Available
          </span>
        </div>

        <div className="space-y-2.5">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full text-left rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-500/15'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">
                        {plan.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        · {plan.durationLabel}
                      </span>
                      {plan.highlight && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            plan.id === 'yearly'
                              ? 'bg-amber-400 text-emerald-950'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {plan.highlight}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 block">
                      {plan.subPriceLabel}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-blue-700 block leading-none">
                      Rs {plan.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 block mt-1">
                      {isSelected ? 'Selected ✓' : 'Tap to select'}
                    </span>
                  </div>
                </div>

                <ul className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                  {plan.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-xs text-slate-700 font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* Buyer view notice vs Seller verification payment & submission */}
      {!isSellerMode ? (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center space-y-2.5 shadow-2xs">
          <p className="text-xs font-bold text-slate-800">
            Blue Tick verification is available for Seller accounts.
          </p>
          <p className="text-[11px] text-slate-500">
            Switch to Seller account to upload your ID and activate the {selectedPlan.name} plan (Rs {selectedPlan.price.toLocaleString()}).
          </p>
          <button
            type="button"
            onClick={handleReturn}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0B3D2E] hover:bg-[#0e4d3b] text-white text-xs font-extrabold cursor-pointer transition-colors"
          >
            Back to Shopping
          </button>
        </div>
      ) : (
        <>
          {/* Fraud Note */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-3 text-amber-950 flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-amber-950 font-extrabold">Fraud Note:</strong>{' '}
              <span className="text-amber-900 font-semibold">
                If fraud found, Blue Tick will be removed. No refund.
              </span>
            </div>
          </div>

          {/* One-Time ID Card Status */}
          {hasIdPhotos ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-emerald-950 font-extrabold block">
                  ✓ ID Card Already Saved (One-Time Verification Complete)
                </strong>
                <span className="text-emerald-800 text-[11px]">
                  Ab sirf {selectedPlan.name} plan payment screenshot aur TID neeche submit karein.
                </span>
              </div>
            </div>
          ) : (
            <IdCardVerificationBox compact />
          )}

          {/* JazzCash Payment Box for Selected Plan */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="text-center space-y-1">
              <span className="inline-block bg-amber-400 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-xl shadow-xs">
                {selectedPlan.name} Plan: Send Rs {selectedPlan.price.toLocaleString()} via JazzCash
              </span>
              <p className="text-[11px] font-extrabold text-emerald-900">
                JazzCash se Pay Karein aur Screenshot Bhejein
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Selected Plan:</span>
                <strong className="text-blue-700 font-black">
                  {selectedPlan.name} ({selectedPlan.durationLabel})
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 text-xs">
                  JazzCash (Admin Only)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Account Title:</span>
                <strong className="text-slate-900 font-black text-xs sm:text-sm">
                  {adminJazzCashTitle || 'AMIR MAQSOOD'}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Admin JazzCash Number:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="font-mono text-sm sm:text-base font-black text-slate-950 tracking-wider">
                    {adminJazzCashNumber || '03181563300'}
                  </strong>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-amber-300"
                    title="Copy Admin JazzCash Number"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-emerald-800">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-800" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Plan Fee:</span>
                <strong className="text-blue-700 font-black text-sm">
                  Rs {selectedPlan.price.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Submission Form / Already Submitted View */}
          {isSubmitted ? (
            <div className="bg-gradient-to-br from-amber-50/70 via-blue-50/50 to-emerald-50/50 border-2 border-amber-300/80 rounded-2xl p-4 text-center space-y-3 shadow-sm animate-in zoom-in-95">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-black">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Verification Pending</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Request Sent to Admin Panel
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aapki Blue Tick verification request Admin ko mil chuki hai. JazzCash TID:{' '}
                <strong className="font-mono text-slate-900">{submittedTid || tid}</strong>
              </p>
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1.5 text-left">
                <p className="font-bold text-amber-950">
                  Status: Verification Pending (Admin Review)
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Admin panel par aapka JazzCash payment receipt aur TID check kiya jayega. Admin ke approve karne ke baad aapki shop par Blue Tick show hoga.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReturn}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Edit TID / Re-submit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Upload Payment Screenshot
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-3.5 text-center bg-blue-50/40 hover:bg-blue-50/80 transition-colors cursor-pointer group"
                >
                  {screenshot ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={screenshot}
                        alt="Receipt"
                        className="w-12 h-12 object-cover rounded-xl border border-blue-300 shadow-2xs"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{screenshotName || 'screenshot_receipt.jpg'}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          ✓ Screenshot Attached · Tap to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-9 h-9 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-blue-950 block">
                        Tap to Upload Payment Screenshot
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Take photo or choose from phone gallery
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Transaction ID (TID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 11 or 12 digit JazzCash TID"
                  value={tid}
                  onChange={(e) => {
                    setTid(e.target.value);
                    if (tidError) setTidError('');
                  }}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-base font-mono font-bold"
                />
                {tidError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {tidError}
                  </p>
                )}
              </div>

              {!hasIdPhotos && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 text-center">
                  ⚠️ Blue Tick submit karne se pehle upar ID Card (Front &amp; Back Photo) upload karein.
                </div>
              )}

              <button
                type="submit"
                disabled={!hasIdPhotos}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  hasIdPhotos
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <BadgeCheck className="w-4 h-4 fill-white text-blue-600" />
                <span>Submit {selectedPlan.name} Verification (Rs {selectedPlan.price.toLocaleString()})</span>
              </button>
            </form>
          )}
        </>
      )}

      <div className="pt-1 text-center">
        <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>NAWAB Pakistan Official Verification Guarantee</span>
        </span>
      </div>
    </div>
  );
};
