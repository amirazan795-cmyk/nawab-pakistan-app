import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  Check,
  X,
  Navigation,
  Loader2,
  PlusCircle,
  Building2,
  Compass,
  ArrowLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  PAKISTAN_CITIES,
  findNearestPakistanCity,
} from '../data/pakistanCities';
import { getCityAreas } from '../data/pakistanCityAreas';

export { PAKISTAN_CITIES } from '../data/pakistanCities';
export { getCityAreas } from '../data/pakistanCityAreas';
export type PakistanCity = string;

interface CitySelectModalProps {
  isOpen: boolean;
  selectedCity: string;
  selectedArea?: string;
  onSelectCity: (city: string, area?: string) => void;
  onClose: () => void;
  title?: string;
  startStep?: 1 | 2;
}

export const CitySelectModal: React.FC<CitySelectModalProps> = ({
  isOpen,
  selectedCity,
  selectedArea,
  onSelectCity,
  onClose,
  title = 'Aapka Shehr / Select Your City',
  startStep = 1,
}) => {
  // 2-Step Flow: Step 1 = City Selection, Step 2 = Area / Mohalla Selection
  const [step, setStep] = useState<1 | 2>(startStep);
  const [chosenCity, setChosenCity] = useState<string>(selectedCity || 'Rawalpindi');

  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccessNotice, setGpsSuccessNotice] = useState<string | null>(null);

  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityName, setCustomCityName] = useState('');

  const [showCustomAreaInput, setShowCustomAreaInput] = useState(false);
  const [customAreaName, setCustomAreaName] = useState('');

  // Keep chosenCity in sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setChosenCity(selectedCity || 'Rawalpindi');
      setStep(startStep);
      setCitySearch('');
      setAreaSearch('');
      setShowCustomCityInput(false);
      setShowCustomAreaInput(false);
      setGpsError(null);
      setGpsSuccessNotice(null);
    }
  }, [isOpen, selectedCity, startStep]);

  // Requirement 1: Keep TOP Popular Cities row SAME as now!
  const POPULAR_HUBS = [
    'Rawalpindi',
    'Islamabad',
    'Lahore',
    'Karachi',
    'Faisalabad',
    'Multan',
    'Gujranwala',
    'Peshawar',
    'Sialkot',
    'Quetta',
    'Gujrat',
    'Wazirabad',
    'Jhelum',
    'Chakwal',
    'Attock',
    'Abbottabad',
  ];

  // Instant fast search filter for Cities (Step 1)
  const filteredCities = useMemo(() => {
    const query = citySearch.toLowerCase().trim();
    if (!query) {
      return PAKISTAN_CITIES;
    }
    return PAKISTAN_CITIES.filter((city) =>
      city.toLowerCase().includes(query)
    );
  }, [citySearch]);

  // Instant fast search filter for Areas of Chosen City (Step 2)
  const areasList = useMemo(() => {
    return getCityAreas(chosenCity);
  }, [chosenCity]);

  const filteredAreas = useMemo(() => {
    const query = areaSearch.toLowerCase().trim();
    if (!query) {
      return areasList;
    }
    return areasList.filter((area) =>
      area.toLowerCase().includes(query)
    );
  }, [areasList, areaSearch]);

  if (!isOpen) return null;

  // Step 1: User clicks a City -> DO NOT CLOSE POPUP! Transition to Step 2! (Requirement 2)
  const handleCityPicked = (city: string) => {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    setChosenCity(cleanCity);
    setAreaSearch('');
    setShowCustomCityInput(false);
    setStep(2); // Open STEP 2 inside same popup!
  };

  // Step 2: User clicks an Area -> Save both City + Area, and close! (Requirement 5)
  const handleFinalSelect = (city: string, area: string) => {
    const cleanCity = city.trim();
    const cleanArea = area.trim();
    if (!cleanCity) return;

    // Persist both in localStorage
    localStorage.setItem('dba_selected_city', cleanCity);
    localStorage.setItem('dba_selected_area', cleanArea);
    localStorage.setItem('dba_user_mohalla', cleanArea);

    onSelectCity(cleanCity, cleanArea);
    onClose();
  };

  // GPS Auto-Detect -> Finds nearest city and opens its areas (Step 2)
  const handleAutoDetectLocation = () => {
    setGpsError(null);
    setGpsSuccessNotice(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser/device.');
      return;
    }

    setIsDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let detectedCity: string | null = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const candidate =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.county ||
              addr.state_district;

            if (candidate && typeof candidate === 'string') {
              const match = PAKISTAN_CITIES.find(
                (c) => c.toLowerCase() === candidate.toLowerCase()
              );
              detectedCity = match || candidate;
            }
          }
        } catch {
          // Fall back gracefully
        }

        if (!detectedCity) {
          detectedCity = findNearestPakistanCity(latitude, longitude);
        }

        setIsDetectingGps(false);
        setGpsSuccessNotice(`📍 Nearest City: ${detectedCity} · Ab Ilaqa select karein`);

        setTimeout(() => {
          handleCityPicked(detectedCity!);
        }, 600);
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please pick your city from the list below.');
        } else {
          setGpsError('Could not get GPS location. Please pick your city from the list below.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityName.trim()) return;
    handleCityPicked(customCityName.trim());
  };

  const handleCustomAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAreaName.trim()) return;
    handleFinalSelect(chosenCity, customAreaName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-200 border border-slate-100">
        
        {/* ============================================================ */}
        {/* MODAL HEADER: DYNAMIC STEP 1 / STEP 2                        */}
        {/* ============================================================ */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70 rounded-t-3xl">
          <div className="flex items-center gap-2.5 min-w-0">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors border border-slate-200 shadow-2xs shrink-0"
                title="Shehr Badlein / Back to Cities"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                {step === 1 ? title : `${chosenCity} ka Ilaqa Select Karo`}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                <span className="font-bold text-emerald-700">
                  {step === 1 ? 'Step 1: Shehr / City' : `Step 2: Mohalla in ${chosenCity}`}
                </span>
                <span>·</span>
                <span className="truncate">
                  {step === 1
                    ? '500+ Pakistan Cities'
                    : 'Societies, Towns & Mohallas'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================ */}
        {/* STEP 1: CITY SELECTION (Includes popular chips & GPS)         */}
        {/* ============================================================ */}
        {step === 1 && (
          <>
            {/* GPS Auto Detect Button */}
            <div className="px-3 pt-3 pb-2 shrink-0 border-b border-slate-100 bg-emerald-50/40">
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingGps}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
              >
                {isDetectingGps ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting nearest city via GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-emerald-200 animate-pulse" />
                    <span>Auto Detect My Location (GPS)</span>
                  </>
                )}
              </button>

              {gpsSuccessNotice && (
                <p className="text-[11px] text-emerald-800 font-bold text-center mt-1.5 animate-in fade-in">
                  {gpsSuccessNotice}
                </p>
              )}
              {gpsError && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-medium text-center mt-1.5 animate-in fade-in">
                  {gpsError}
                </p>
              )}
            </div>

            {/* City Search Bar */}
            <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/80">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    if (showCustomCityInput) setShowCustomCityInput(false);
                  }}
                  placeholder="Search your city, district or tehsil..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                />
                {citySearch && (
                  <button
                    type="button"
                    onClick={() => setCitySearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Requirement 1: Keep TOP Popular Cities row SAME as now! */}
              {!citySearch && (
                <div className="mt-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Popular Cities:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {POPULAR_HUBS.map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => handleCityPicked(hub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                          chosenCity.toLowerCase() === hub.toLowerCase()
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom City "Others" Form */}
            {showCustomCityInput && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 animate-in slide-in-from-top-2">
                <form onSubmit={handleCustomCitySubmit} className="space-y-2">
                  <label className="block text-xs font-bold text-amber-950">
                    Apna Shehr / Town Ka Naam Likhein:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Wazirabad, Dina, Bhalwal, Chakwal, etc."
                      value={customCityName}
                      onChange={(e) => setCustomCityName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Next: Choose Area →
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomCityInput(false)}
                      className="px-2 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* City List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredCities.length === 0 ? (
                <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-2 animate-in fade-in">
                  <Compass className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm text-slate-800">
                    Use "{citySearch.trim()}" as your City
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCityPicked(citySearch.trim())}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Select "{citySearch.trim()}" & Choose Area →</span>
                  </button>
                </div>
              ) : (
                <>
                  {citySearch.trim().length >= 2 && !filteredCities.some(c => c.toLowerCase() === citySearch.toLowerCase().trim()) && (
                    <button
                      type="button"
                      onClick={() => handleCityPicked(citySearch.trim())}
                      className="w-full mb-1.5 p-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-emerald-700" />
                        <span>Use custom city: <strong>"{citySearch.trim()}"</strong></span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                        <span>Areas</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  )}

                  {filteredCities.map((city) => {
                    const isSelected = chosenCity.toLowerCase() === city.toLowerCase();
                    const isOthers = city.toLowerCase() === 'others';

                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          if (isOthers) {
                            setShowCustomCityInput(true);
                          } else {
                            handleCityPicked(city);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isOthers
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                            : 'hover:bg-emerald-50/80 text-slate-800 bg-white border border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isOthers ? (
                            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                          ) : (
                            <MapPin
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-white' : 'text-emerald-600'
                              }`}
                            />
                          )}
                          <span>
                            {isOthers ? 'Others (Type custom City / Town name)' : city}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span>Areas</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 2: AREA / MOHALLA SELECTION (Inside same popup)          */}
        {/* ============================================================ */}
        {step === 2 && (
          <>
            {/* Step 2 Search Bar: "Apna Ilaqa search karo..." (Requirement 4) */}
            <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{chosenCity} ke Ilake / Areas ({areasList.length}):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomAreaInput(true)}
                  className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Custom Mohalla Likhein</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={areaSearch}
                  onChange={(e) => {
                    setAreaSearch(e.target.value);
                    if (showCustomAreaInput) setShowCustomAreaInput(false);
                  }}
                  placeholder="Apna Ilaqa search karo..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                />
                {areaSearch && (
                  <button
                    type="button"
                    onClick={() => setAreaSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Custom Area Write-In Form */}
            {showCustomAreaInput && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 animate-in slide-in-from-top-2">
                <form onSubmit={handleCustomAreaSubmit} className="space-y-2">
                  <label className="block text-xs font-bold text-emerald-950">
                    Apne Mohalle / Gali / Society Ka Naam Likhein:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder={`e.g. Block 5, Street 4, Gulshan Town ${chosenCity}...`}
                      value={customAreaName}
                      onChange={(e) => setCustomAreaName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Save & Select
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomAreaInput(false)}
                      className="px-2 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Area List (Requirement 3 & 7) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredAreas.length === 0 ? (
                <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-2 animate-in fade-in">
                  <Building2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm text-slate-800">
                    Use "{areaSearch.trim()}" in {chosenCity}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFinalSelect(chosenCity, areaSearch.trim())}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Select "{areaSearch.trim()}, {chosenCity}"</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Dynamic custom area shortcut if searching */}
                  {areaSearch.trim().length >= 2 && !filteredAreas.some(a => a.toLowerCase() === areaSearch.toLowerCase().trim()) && (
                    <button
                      type="button"
                      onClick={() => handleFinalSelect(chosenCity, areaSearch.trim())}
                      className="w-full mb-1.5 p-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-emerald-700" />
                        <span>Use custom area: <strong>"{areaSearch.trim()}"</strong></span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">
                        Select
                      </span>
                    </button>
                  )}

                  {filteredAreas.map((area, index) => {
                    const isAllCity = area.toLowerCase().startsWith('all ');
                    const isSelected =
                      selectedCity.toLowerCase() === chosenCity.toLowerCase() &&
                      (selectedArea || '').toLowerCase() === area.toLowerCase();

                    return (
                      <button
                        key={`${chosenCity}-${area}-${index}`}
                        type="button"
                        onClick={() => handleFinalSelect(chosenCity, area)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isAllCity
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : 'hover:bg-emerald-50/80 text-slate-800 bg-white border border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin
                            className={`w-4 h-4 shrink-0 ${
                              isSelected
                                ? 'text-white'
                                : isAllCity
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className={isAllCity ? 'font-black text-emerald-950' : 'font-bold'}>
                            {area}
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Selected</span>
                          </span>
                        ) : isAllCity ? (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs">
                            Full City
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}

        {/* Footer info banner */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium shrink-0 rounded-b-3xl flex items-center justify-between px-4">
          <span className="font-bold text-slate-700">
            {step === 1 ? 'Step 1 of 2: City' : `Step 2 of 2: Area in ${chosenCity}`}
          </span>
          <span>NAWAB Pakistan</span>
        </div>
      </div>
    </div>
  );
};
