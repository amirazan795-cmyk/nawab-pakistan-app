import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Store,
  Upload,
  User,
} from 'lucide-react';
import { SellerType } from '../types';
import { NawabLogoBadge } from './NawabLogo';
import { compressDataUrlOrFile } from '../utils/imageCompress';
import { PAKISTAN_CITIES, findNearestPakistanCity } from '../data/pakistanCities';
import { getCityAreas } from '../data/pakistanCityAreas';

interface OneTimeSellerVerificationProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const OneTimeSellerVerification: React.FC<OneTimeSellerVerificationProps> = ({
  onComplete,
  onCancel,
}) => {
  const {
    authUser,
    currentSeller,
    selectedCity,
    selectedArea,
    savedSellerProfile,
    getSellerIdProof,
    saveOneTimeSellerDetails,
    clearSavedSellerAndLogout,
  } = useApp();

  const existingProof = getSellerIdProof(
    currentSeller.id,
    currentSeller.shopName || currentSeller.name,
    currentSeller.phone
  );

  const initialCity =
    savedSellerProfile?.city ||
    currentSeller.city ||
    authUser?.city ||
    selectedCity ||
    'Rawalpindi';

  const initialArea =
    savedSellerProfile?.area ||
    (authUser?.area && !authUser.area.toLowerCase().startsWith('all ') ? authUser.area : '') ||
    (selectedArea && !selectedArea.toLowerCase().startsWith('all ') ? selectedArea : '') ||
    'Main Bazaar';

  const [sellerType, setSellerType] = useState<SellerType>(
    savedSellerProfile?.sellerType || currentSeller.sellerType || existingProof?.sellerType || 'shop'
  );
  const [sellerName, setSellerName] = useState<string>(
    savedSellerProfile?.name || authUser?.name || currentSeller.name || ''
  );
  const [shopName, setShopName] = useState<string>(
    savedSellerProfile?.shopName ||
      (currentSeller.shopName && currentSeller.shopName !== authUser?.name ? currentSeller.shopName : '') ||
      ''
  );
  const [phone, setPhone] = useState<string>(
    savedSellerProfile?.phone || authUser?.phone || currentSeller.phone || ''
  );
  const [cnicNumber, setCnicNumber] = useState<string>(
    savedSellerProfile?.cnicNumber || currentSeller.cnicNumber || ''
  );
  const [city, setCity] = useState<string>(initialCity);
  const [area, setArea] = useState<string>(initialArea);

  const [workOrShopPhoto, setWorkOrShopPhoto] = useState<string>(
    savedSellerProfile?.workOrShopPhoto || currentSeller.photo || existingProof?.sellerPhoto || ''
  );
  const [idFrontPhoto, setIdFrontPhoto] = useState<string>(existingProof?.frontPhoto || '');
  const [idBackPhoto, setIdBackPhoto] = useState<string>(existingProof?.backPhoto || '');
  const [showOptionalPhotos, setShowOptionalPhotos] = useState<boolean>(false);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const workCamRef = useRef<HTMLInputElement>(null);
  const workGalleryRef = useRef<HTMLInputElement>(null);
  const frontCamRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCamRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);

  const handleSelectSellerType = (nextType: SellerType) => {
    setSellerType(nextType);
    setError('');
  };

  const formatCnicInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const handlePickPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'work' | 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressDataUrlOrFile(file, 720, 0.64);
      if (!compressed) return;
      if (target === 'work') setWorkOrShopPhoto(compressed);
      if (target === 'front') setIdFrontPhoto(compressed);
      if (target === 'back') setIdBackPhoto(compressed);
    } catch {
      setError('Photo load nahi ho saki. Dobara try karein.');
    }
    e.target.value = '';
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Device me GPS supported nahi hai. Neeche City select karein.');
      return;
    }
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedCity = '';
        let detectedArea = '';
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { signal: ctrl.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const cityCandidate =
              addr.city || addr.town || addr.municipality || addr.state_district || addr.county;
            const areaCandidate =
              addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.road;
            if (cityCandidate && typeof cityCandidate === 'string') {
              const matched = PAKISTAN_CITIES.find(
                (c) => c.toLowerCase() === cityCandidate.toLowerCase()
              );
              detectedCity = matched || cityCandidate;
            }
            if (areaCandidate && typeof areaCandidate === 'string') {
              detectedArea = areaCandidate;
            }
          }
        } catch {
          // Graceful fallback
        }
        if (!detectedCity) {
          detectedCity = findNearestPakistanCity(latitude, longitude);
        }
        if (!detectedArea) {
          const areas = getCityAreas(detectedCity).filter((a) => !a.toLowerCase().startsWith('all '));
          detectedArea = areas[0] || 'Main Bazaar';
        }
        setCity(detectedCity);
        setArea(detectedArea);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError('GPS detect nahi ho saka. Manual City aur Area select karein.');
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sellerName.trim();
    const cleanShopName = shopName.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    const cleanCnic = cnicNumber.trim();
    const cnicDigits = cleanCnic.replace(/\D/g, '');
    const cleanCity = city.trim();

    if (!cleanName) {
      setError('Meharbani karke apna Naam (Name) likhein.');
      return;
    }
    if (phoneDigits.length < 10) {
      setError('Sahih 11-digit Mobile Number (Phone) likhein.');
      return;
    }
    if (cnicDigits.length < 13) {
      setError('Sahih 13-digit CNIC Number likhein (e.g. 37405-1234567-1).');
      return;
    }
    if (!cleanCity) {
      setError('Meharbani karke apna Shehr (City) select karein.');
      return;
    }

    setSubmitting(true);
    try {
      await saveOneTimeSellerDetails({
        sellerType,
        name: cleanName,
        shopName: sellerType === 'shop' ? cleanShopName || cleanName : cleanName,
        phone: cleanPhone,
        cnicNumber: cleanCnic,
        city: cleanCity,
        area: area.trim() || cleanCity,
        workOrShopPhoto: workOrShopPhoto || undefined,
        idFrontPhoto: idFrontPhoto || undefined,
        idBackPhoto: idBackPhoto || undefined,
      });
      if (onComplete) {
        onComplete();
      }
    } catch {
      setError('Details save nahi ho sakin. Dobara try karein.');
    } finally {
      setSubmitting(false);
    }
  };

  const isShop = sellerType === 'shop';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 text-slate-800 py-5 px-3 sm:px-6">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Top Bar with Optional Back Button */}
        <div className="flex items-center justify-between">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={clearSavedSellerAndLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-extrabold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout / Change Seller</span>
          </button>
        </div>

        {/* Top NAWAB Header */}
        <div className="text-center space-y-1.5 select-none">
          <NawabLogoBadge size="md" className="mb-1" />
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
            Seller Details (Sirf 1 Dafa)
          </h1>
          <p className="text-xs sm:text-sm font-bold text-emerald-700">
            Apni detail ek dafa bharein · Agli dafa direct Add New Post aur auto-fill milega
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-[#0B3D2E] text-white rounded-2xl p-3.5 shadow-sm border border-amber-400/60 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-extrabold block text-sm text-amber-300">
              Sirf Pehli Dafa · Browser Me Save Rahega
            </strong>
            <span className="text-emerald-100 block leading-relaxed">
              Name, Phone, CNIC aur City ek baar save ho jayenge. Phir jab bhi app kholeinge to dobara ID Card ya detail nahi mangi jayegi.
            </span>
          </div>
        </div>

        {/* Main Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-200 shadow-lg shadow-emerald-950/5 space-y-4"
        >
          {/* Step 1: Select Seller Type */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
              Seller Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectSellerType('shop')}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                  isShop
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isShop ? 'bg-emerald-600 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                  </div>
                  {isShop && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                  1. Shop Seller
                </strong>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSellerType('home')}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                  !isShop
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      !isShop ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                  </div>
                  {!isShop && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                  2. Home Seller
                </strong>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Name (Aapka Naam) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="e.g. Hamza Ali"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-semibold bg-slate-50/50"
              />
            </div>
          </div>

          {/* Shop Name (Optional if Shop Seller) */}
          {isShop && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Shop Name (Dukan ka Naam — Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Al-Madina Store"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-semibold bg-slate-50/50"
                />
              </div>
            </div>
          )}

          {/* 2. Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Phone (Mobile Number) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-bold font-mono bg-slate-50/50"
              />
            </div>
          </div>

          {/* 3. CNIC Number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              CNIC Number (Shanakhti Card Number) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={cnicNumber}
                onChange={(e) => setCnicNumber(formatCnicInput(e.target.value))}
                placeholder="37405-1234567-1"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-bold font-mono bg-slate-50/50"
              />
            </div>
          </div>

          {/* 4. City & Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                City (Shehr) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 cursor-pointer"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>{gpsLoading ? 'Detecting...' : 'GPS Detect'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={city}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    setCity(nextCity);
                    const areas = getCityAreas(nextCity).filter(
                      (a) => !a.toLowerCase().startsWith('all ')
                    );
                    if (areas.length > 0) setArea(areas[0]);
                  }}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-semibold bg-slate-50/50"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area / Mohalla (e.g. Satellite Town)"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base font-medium bg-slate-50/50"
              />
            </div>
          </div>

          {/* Optional Photos Toggle (Shop/Work + ID Card Front/Back) */}
          <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-emerald-50/30">
            <button
              type="button"
              onClick={() => setShowOptionalPhotos((v) => !v)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-emerald-950 cursor-pointer hover:bg-emerald-50"
            >
              <span>
                {showOptionalPhotos ? '▼' : '▶'} Optional: Shop/Work Photo &amp; ID Card Photos
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">Optional</span>
            </button>

            {showOptionalPhotos && (
              <div className="p-3.5 pt-1 space-y-3 border-t border-emerald-100">
                {/* Shop or Work Photo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    {isShop ? 'Shop Photo' : 'Work Photo'} (Optional)
                  </label>
                  <input
                    type="file"
                    ref={workCamRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePickPhoto(e, 'work')}
                  />
                  <input
                    type="file"
                    ref={workGalleryRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePickPhoto(e, 'work')}
                  />
                  {workOrShopPhoto && (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-emerald-200">
                      <img src={workOrShopPhoto} alt="Seller" className="w-14 h-14 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setWorkOrShopPhoto('')}
                        className="text-xs text-red-600 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => workCamRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => workGalleryRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-white text-emerald-800 border border-emerald-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Gallery</span>
                    </button>
                  </div>
                </div>

                {/* ID Front & Back Optional */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block">ID Front</span>
                    <input type="file" ref={frontCamRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePickPhoto(e, 'front')} />
                    <input type="file" ref={frontGalleryRef} accept="image/*" className="hidden" onChange={(e) => handlePickPhoto(e, 'front')} />
                    {idFrontPhoto && <img src={idFrontPhoto} alt="ID Front" className="w-full h-16 object-cover rounded-lg" />}
                    <div className="grid grid-cols-2 gap-1">
                      <button type="button" onClick={() => frontCamRef.current?.click()} className="py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">Cam</button>
                      <button type="button" onClick={() => frontGalleryRef.current?.click()} className="py-1 rounded-lg bg-slate-100 text-emerald-900 text-[10px] font-bold cursor-pointer">Gal</button>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block">ID Back</span>
                    <input type="file" ref={backCamRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePickPhoto(e, 'back')} />
                    <input type="file" ref={backGalleryRef} accept="image/*" className="hidden" onChange={(e) => handlePickPhoto(e, 'back')} />
                    {idBackPhoto && <img src={idBackPhoto} alt="ID Back" className="w-full h-16 object-cover rounded-lg" />}
                    <div className="grid grid-cols-2 gap-1">
                      <button type="button" onClick={() => backCamRef.current?.click()} className="py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">Cam</button>
                      <button type="button" onClick={() => backGalleryRef.current?.click()} className="py-1 rounded-lg bg-slate-100 text-emerald-900 text-[10px] font-bold cursor-pointer">Gal</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
                <span>Save Details &amp; Add New Post</span>
              </>
            )}
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Aapki details aapke browser me save hongi. Agli dafa direct Add New Post aur auto-fill milega.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
