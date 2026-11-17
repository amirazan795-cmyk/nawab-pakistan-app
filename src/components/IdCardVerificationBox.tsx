import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { compressDataUrlOrFile } from '../utils/imageCompress';

interface IdCardVerificationBoxProps {
  compact?: boolean;
}

export const IdCardVerificationBox: React.FC<IdCardVerificationBoxProps> = ({ compact = false }) => {
  const { currentSeller, getSellerIdProof, submitSellerIdPhotos } = useApp();

  const existingProof = getSellerIdProof(
    currentSeller.id,
    currentSeller.shopName || currentSeller.name,
    currentSeller.phone
  );

  const [frontPhoto, setFrontPhoto] = useState<string>(existingProof?.frontPhoto || '');
  const [backPhoto, setBackPhoto] = useState<string>(existingProof?.backPhoto || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const frontCamRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCamRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingProof?.frontPhoto && !frontPhoto) {
      setFrontPhoto(existingProof.frontPhoto);
    }
    if (existingProof?.backPhoto && !backPhoto) {
      setBackPhoto(existingProof.backPhoto);
    }
  }, [existingProof?.frontPhoto, existingProof?.backPhoto]);

  const status =
    existingProof?.status ||
    currentSeller.idVerificationStatus ||
    (frontPhoto && backPhoto ? 'pending' : 'none');

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressDataUrlOrFile(file, 800, 0.68);
      if (!compressed) return;

      const nextFront = side === 'front' ? compressed : frontPhoto;
      const nextBack = side === 'back' ? compressed : backPhoto;

      if (side === 'front') setFrontPhoto(compressed);
      if (side === 'back') setBackPhoto(compressed);

      if (nextFront && nextBack) {
        submitSellerIdPhotos(nextFront, nextBack, currentSeller.id);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3500);
      }
    } catch {
      // Ignore invalid image read
    }
  };

  const handleManualSubmit = () => {
    if (!frontPhoto || !backPhoto) return;
    submitSellerIdPhotos(frontPhoto, backPhoto, currentSeller.id);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${
        status === 'verified'
          ? 'border-emerald-300'
          : status === 'pending'
          ? 'border-amber-300'
          : 'border-emerald-200'
      } ${compact ? 'p-3.5' : 'p-4'} space-y-3 shadow-2xs`}
    >
      {/* Header + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950 leading-snug">
              ID Card Verification - Fraud se bachne ke liye
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Listing publish aur Blue Tick ke liye Front &amp; Back photo zaroori hai
            </p>
          </div>
        </div>

        {/* Status Pill: ID Pending (Yellow) or ID Verified (Green) */}
        {status === 'verified' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ID Verified</span>
          </span>
        ) : status === 'pending' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>ID Pending</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>ID Required</span>
          </span>
        )}
      </div>

      {/* Two Photo Upload Boxes: Front Photo & Back Photo with Camera / Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. ID Card - Front Photo */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-950">
              ID Card - Front Photo <span className="text-red-500">*</span>
            </span>
            {frontPhoto && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                ✓ Uploaded
              </span>
            )}
          </div>

          <input
            type="file"
            ref={frontCamRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e, 'front')}
          />
          <input
            type="file"
            ref={frontGalleryRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e, 'front')}
          />

          {frontPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-white h-24">
              <img
                src={frontPhoto}
                alt="ID Card Front"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-[11px] font-semibold">
              <CreditCard className="w-5 h-5 text-amber-400 mb-1" />
              <span>Front side upload karein</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => frontCamRef.current?.click()}
              className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => frontGalleryRef.current?.click()}
              className="py-2 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-500 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Gallery</span>
            </button>
          </div>
        </div>

        {/* 2. ID Card - Back Photo */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-950">
              ID Card - Back Photo <span className="text-red-500">*</span>
            </span>
            {backPhoto && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                ✓ Uploaded
              </span>
            )}
          </div>

          <input
            type="file"
            ref={backCamRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e, 'back')}
          />
          <input
            type="file"
            ref={backGalleryRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e, 'back')}
          />

          {backPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-white h-24">
              <img
                src={backPhoto}
                alt="ID Card Back"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-[11px] font-semibold">
              <CreditCard className="w-5 h-5 text-amber-400 mb-1" />
              <span>Back side upload karein</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => backCamRef.current?.click()}
              className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => backGalleryRef.current?.click()}
              className="py-2 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-500 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explicit Save button if both uploaded and not yet submitted */}
      {frontPhoto && backPhoto && status === 'none' && (
        <button
          type="button"
          onClick={handleManualSubmit}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Save ID Photos for Verification</span>
        </button>
      )}

      {savedNotice && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>ID Photos privately save ho gayin! Status: ID Pending (Admin Approval ka intezar)</span>
        </div>
      )}

      {/* Privacy Guarantee Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
        <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          Ye photos sirf Admin verification ke liye hain, buyers ko poora ID card kabhi nahi dikhaya jayega. Aapki privacy safe hai.
        </span>
      </div>
    </div>
  );
};
