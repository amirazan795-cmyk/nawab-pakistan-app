import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  KeyRound,
  Lock,
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CitySelectModal } from './CitySelectModal';
import { PAKISTAN_CITIES, findNearestPakistanCity } from '../data/pakistanCities';
import { getCityAreas } from '../data/pakistanCityAreas';
import { NawabLogoBadge } from './NawabLogo';

interface LoginScreenProps {
  initialRole?: 'buyer' | 'seller';
  onBack?: () => void;
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialRole = 'buyer',
  onBack,
  onSuccess,
}) => {
  const {
    loginUser,
    checkPhoneBlocked,
    blockedNotice,
    clearBlockedNotice,
    selectedCity,
    selectedArea,
    setCityAndArea,
  } = useApp();

  const [selectedRole] = useState<'buyer' | 'seller'>(initialRole);
  // Step 1: Name -> Step 2: Mobile Number -> Step 3: Enter In-App Code
  const [step, setStep] = useState<'name' | 'phone' | 'code'>('name');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCityState, setSelectedCityStateLocal] = useState<string>(
    selectedCity || 'Rawalpindi'
  );
  const [selectedAreaState, setSelectedAreaStateLocal] = useState<string>(
    selectedArea || 'Satellite Town'
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsDetectedNotice, setGpsDetectedNotice] = useState<string | null>(null);
  const [gpsErrorNotice, setGpsErrorNotice] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [codeGenerated, setCodeGenerated] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLocationOnGPS = () => {
    setGpsErrorNotice(null);
    setGpsDetectedNotice(null);

    if (!navigator.geolocation) {
      setGpsErrorNotice('Device me GPS supported nahi hai. Neeche se shehr select karein.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });

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
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.state_district ||
              addr.county;
            const areaCandidate =
              addr.suburb ||
              addr.neighbourhood ||
              addr.quarter ||
              addr.residential ||
              addr.city_district ||
              addr.road;

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

        const cityAreas = getCityAreas(detectedCity).filter((a) => !a.toLowerCase().startsWith('all '));
        if (!detectedArea) {
          detectedArea = cityAreas[0] || 'Main Bazaar';
        } else {
          const matchedArea = cityAreas.find(
            (a) =>
              a.toLowerCase().includes(detectedArea.toLowerCase()) ||
              detectedArea.toLowerCase().includes(a.toLowerCase())
          );
          if (matchedArea) {
            detectedArea = matchedArea;
          }
        }

        setSelectedCityStateLocal(detectedCity);
        setSelectedAreaStateLocal(detectedArea);
        setCityAndArea(detectedCity, detectedArea);
        setGpsLoading(false);
        setGpsDetectedNotice(`${detectedArea}, ${detectedCity}`);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsErrorNotice('Location permission deny ho gayi. Manual select kar sakte hain.');
        } else {
          setGpsErrorNotice('Location detect nahi ho saki. Manual select kar sakte hain.');
        }
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (blockedNotice) clearBlockedNotice();
    if (!name.trim()) {
      setError('Meharbani karke apna Naam likhein.');
      return;
    }
    setStep('phone');
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (blockedNotice) clearBlockedNotice();
    const cleanPhone = phone.trim();
    const digits = cleanPhone.replace(/\D/g, '');
    const isValidPkLength = digits.startsWith('0') ? digits.length >= 11 : digits.length >= 10;
    if (!cleanPhone || !isValidPkLength) {
      setError(
        selectedRole === 'seller'
          ? 'Seller ke liye sahih Mobile Number likhna zaroori hai (e.g. 0300-1234567).'
          : 'Sahih Mobile Number darj karein (e.g. 0300-1234567).'
      );
      return;
    }
    setIsCheckingPhone(true);
    try {
      const blocked = await checkPhoneBlocked(cleanPhone);
      if (blocked) {
        setError('Aapka account Admin ne block kar diya hai.');
        return;
      }
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      setCodeGenerated(randomCode);
      setEnteredCode('');
      setStep('code');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!codeGenerated) {
      setError('Pehle Code hasil karein.');
      return;
    }

    if (enteredCode.trim() !== codeGenerated) {
      setError('Ghalat Code! Upar diya gaya 4-digit code darj karein.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginUser(
        name.trim(),
        phone.trim(),
        selectedRole,
        selectedCityState,
        selectedAreaState,
        gpsCoords,
        gpsDetectedNotice || undefined
      );
      if (!res.ok) {
        if (res.blocked) {
          setError('Aapka account Admin ne block kar diya hai.');
        } else {
          setError('Login nahi ho saka. Dobara koshish karein.');
        }
        return;
      }
      setIsSuccess(true);
      setCityAndArea(selectedCityState, selectedAreaState);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 350);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-200">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* Top Navigation Back + Brand Header */}
        <div className="space-y-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="text-center space-y-1.5 select-none">
            <NawabLogoBadge size="lg" className="mb-1" />
            <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
              NAWAB
            </h1>
            <p className="text-sm font-bold text-emerald-700">
              Ghar Baithe Nawabi
            </p>
          </div>
        </div>

        {/* Main Clean Login Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-emerald-950/5 border border-emerald-100 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {selectedRole === 'buyer' ? 'BUYER LOGIN' : 'SELLER LOGIN'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'name'
                  ? 'Step 1 of 3 · Apna Naam Likhein'
                  : step === 'phone'
                  ? 'Step 2 of 3 · Mobile Number Likhein'
                  : 'Step 3 of 3 · Code Darj Karein'}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {step === 'name' ? '1 / 3' : step === 'phone' ? '2 / 3' : '3 / 3'}
            </span>
          </div>

          {(error || blockedNotice) && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl font-medium">
              {error || blockedNotice}
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {`Login Kamyab! ${selectedRole === 'buyer' ? 'BUY page' : 'SELL page'} khul raha hai...`}
              </span>
            </div>
          )}

          {/* STEP 1: ASK NAME */}
          {step === 'name' && (
            <form onSubmit={handleNameNext} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Aapka Naam / Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Apna naam likhein..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-base font-medium bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next · Mobile Number</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: ASK MOBILE NUMBER (+ Optional Location) */}
          {step === 'phone' && (
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div className="bg-emerald-50/60 px-3.5 py-2 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Naam: <strong className="text-emerald-950">{name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('name')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {selectedRole === 'seller'
                    ? 'Seller Mobile Number (Zaroori / Mandatory) *'
                    : 'Mobile Number *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="03XX-XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-base font-bold tabular-nums bg-slate-50/50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedRole === 'seller'
                    ? 'Seller signup ke liye mobile number zaroori hai. Buyers aapko is number par call ya chat kar sakenge.'
                    : 'Number likhne ke baad app ke andar hi code nazar aayega.'}
                </p>
              </div>

              {/* Clean Compact Location Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold truncate">
                      {selectedAreaState}, {selectedCityState}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer shrink-0"
                  >
                    {showLocationPicker ? 'Hide' : 'Change City'}
                  </button>
                </div>

                {showLocationPicker && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleLocationOnGPS}
                      disabled={gpsLoading}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {gpsLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Location ON Karo (Auto-Detect)</span>
                        </>
                      )}
                    </button>

                    {gpsDetectedNotice && (
                      <div className="bg-emerald-100 text-emerald-950 text-[11px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Location Detected: {gpsDetectedNotice}</span>
                      </div>
                    )}

                    {gpsErrorNotice && (
                      <div className="bg-amber-50 text-amber-900 text-[11px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{gpsErrorNotice}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedCityState}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setSelectedCityStateLocal(newCity);
                          const cityAreas = getCityAreas(newCity).filter(
                            (a) => !a.toLowerCase().startsWith('all ')
                          );
                          const defaultArea = cityAreas[0] || 'Main Bazaar';
                          setSelectedAreaStateLocal(defaultArea);
                          setCityAndArea(newCity, defaultArea);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-900"
                      >
                        {PAKISTAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedAreaState}
                        onChange={(e) => {
                          const newArea = e.target.value;
                          setSelectedAreaStateLocal(newArea);
                          setCityAndArea(selectedCityState, newArea);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-900"
                      >
                        {getCityAreas(selectedCityState).map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCityModalOpen(true)}
                      className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Search Full Pakistan Cities List
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCheckingPhone}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingPhone ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Code Hasil Karein</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: SHOW CODE INSIDE APP ("Tumhara Code Hai: XXXX") & VERIFY */}
          {step === 'code' && codeGenerated && (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              <div className="bg-emerald-700 rounded-2xl p-4 text-white text-center shadow-md space-y-1.5">
                <span className="text-xs text-emerald-100 block font-medium">
                  Tumhara Code Hai:
                </span>
                <strong className="text-3xl font-black tracking-widest font-mono text-amber-300 block select-all">
                  {codeGenerated}
                </strong>
                <button
                  type="button"
                  onClick={() => setEnteredCode(codeGenerated)}
                  className="text-[11px] underline text-emerald-100 hover:text-white font-bold cursor-pointer pt-1"
                >
                  Tap to Fill Code
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Code Yahan Likhein
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    autoFocus
                    placeholder="4-digit code likhein..."
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-emerald-500 text-base font-black tracking-widest font-mono focus:outline-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!enteredCode.trim() || isSuccess || isLoggingIn}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login Karein</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Clean security note */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-700" />
          <span>Ek baar login ke baad hamesha yaad rahega · NAWAB</span>
        </div>
      </div>

      <CitySelectModal
        isOpen={isCityModalOpen}
        selectedCity={selectedCityState}
        selectedArea={selectedAreaState}
        onSelectCity={(newCity, newArea) => {
          setSelectedCityStateLocal(newCity);
          const safeArea = newArea || 'Main Bazaar';
          setSelectedAreaStateLocal(safeArea);
          setCityAndArea(newCity, safeArea);
        }}
        onClose={() => setIsCityModalOpen(false)}
        title="Aapka Shehr / Select Your City"
      />
    </div>
  );
};
