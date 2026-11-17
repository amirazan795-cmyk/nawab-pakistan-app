import React, { useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface WarningPoliciesPageProps {
  onBack: () => void;
}

const URDU_WARNINGS = [
  'ویریفائیڈ لوگوں پر زیادہ بھروسہ کریں۔',
  'بلیو ٹک سیلرز کمپنی کی طرف سے 100% ویریفائیڈ ہیں۔',
];

const URDU_POLICIES = [
  'ہوم سروسز آپ کو اس لیے دی جا رہی ہیں تاکہ آپ گھر بیٹھے بغیر تھکے اپنا کام کروا سکیں۔',
  'کام کے دوران سر پر کھڑے ہو کر کام کروانا ضروری ہے۔ خدانخواستہ کسی نقصان کی صورت میں کمپنی ذمہ دار نہیں ہوگی۔',
  'کسی بھی سیلر کو کام شروع ہونے سے پہلے ایڈوانس نہ دیں۔ ایڈوانس دینا آپ کی اپنی ذمہ داری ہوگی۔',
  'بلیو ٹک والے سیلر کی آئی ڈی، کام اور ریویوز کمپنی نے خود چیک کیے ہیں۔ ہمیشہ بلیو ٹک کو ترجیح دیں۔',
  'اگر کوئی سیلر غلط کام کرے یا زیادہ پیسے مانگے تو فوراً ایپ میں رپورٹ کریں۔ کمپنی ایکشن لے گی۔',
  'سیلر سے ایپ کے باہر رابطہ کر کے کام کروانا منع ہے۔ ایسا کرنے پر اکاؤنٹ بند ہو سکتا ہے۔',
  'امید ہے آپ ہماری پالیسیز کو سمجھیں گے۔',
];

const ENGLISH_WARNINGS = [
  'More Trust on Verifiers.',
  'Blue Tick Sellers are 100% Verified from Company.',
];

const ENGLISH_POLICIES = [
  'Home Services are given to you so that you can get your work done sitting at home, without any tiredness.',
  'It is necessary to stand over and supervise the work. In case of any loss / damage, God forbid, the company will not be responsible.',
  'Do not give advance to any seller before work starts. Giving advance will be your own responsibility.',
  "Blue Tick Seller's ID, Work & Reviews are checked by the company itself. Always prefer Blue Tick.",
  'If any seller does wrong work or asks for extra money, immediately Report in the App. Company will take action.',
  'Contacting seller outside the App to get work done is not allowed. Doing so can lead to account closure.',
  'I hope you understand our policies.',
];

export const WarningPoliciesPage: React.FC<WarningPoliciesPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      {/* Top Bar with Back Button */}
      <div className="sticky top-8 md:top-8 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D32F2F]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Warning &amp; Company Policies</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* URDU VERSION FIRST */}
        <section dir="rtl" lang="ur" className="space-y-5 text-right">
          <div className="flex items-center gap-2.5 border-b border-red-100 pb-3">
            <span className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#D32F2F] leading-snug">
              ⚠️ وارننگ اور کمپنی پالیسیز
            </h1>
          </div>

          <ol className="space-y-2.5 bg-red-50/60 border border-red-200/80 rounded-2xl p-4 sm:p-5">
            {URDU_WARNINGS.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm sm:text-base font-bold text-slate-900 leading-relaxed"
              >
                <span className="w-6 h-6 rounded-full bg-[#D32F2F] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-emerald-950">
              کمپنی پالیسیز:
            </h2>
            <ol className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              {URDU_POLICIES.map((policy, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm sm:text-base font-medium text-slate-800 leading-relaxed"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{policy}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* DIVIDER LINE IN MIDDLE */}
        <div className="relative py-2">
          <div className="border-t-2 border-slate-200" />
        </div>

        {/* ENGLISH VERSION BELOW */}
        <section dir="ltr" lang="en" className="space-y-5 text-left">
          <div className="flex items-center gap-2.5 border-b border-red-100 pb-3">
            <span className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#D32F2F] leading-snug">
              ⚠️ Warning &amp; Company Policies
            </h2>
          </div>

          <ol className="space-y-2.5 bg-red-50/60 border border-red-200/80 rounded-2xl p-4 sm:p-5">
            {ENGLISH_WARNINGS.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm sm:text-base font-bold text-slate-900 leading-relaxed"
              >
                <span className="w-6 h-6 rounded-full bg-[#D32F2F] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
              Company Policies:
            </h3>
            <ol className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              {ENGLISH_POLICIES.map((policy, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm sm:text-base font-medium text-slate-800 leading-relaxed"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{policy}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Bottom Back Button for convenience */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </main>
    </div>
  );
};
