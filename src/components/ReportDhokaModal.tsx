import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ReportDhokaModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
}

const REPORT_REASONS = [
  'Ghalat cheez ya naqis mayaar (Fake/Wrong Item)',
  'Qeemat zyada ya payment issue (Price/Payment Fraud)',
  'Rabta nahi ho raha / Phone band (Unresponsive Seller)',
  'Bad-tameezi ya dhoka bazi (Fraud or Misconduct)',
  'Product photo aur asal me farq (Photo Mismatch)',
];

export const ReportDhokaModal: React.FC<ReportDhokaModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  sellerId,
  sellerName,
}) => {
  const { submitReport } = useApp();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(productId, productTitle, sellerId, sellerName, selectedReason, details);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Report / Dhoka</h3>
              <span className="text-[10px] text-red-600 font-bold">Bharosa System · Zero Tolerance</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bharosa Promise Badge */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <strong className="block font-extrabold text-emerald-900 leading-tight">
              Yahan Dhoka Nahi Hota - Bharosa Hi Pehchan Hai
            </strong>
            <span className="text-[10px] text-emerald-700">
              NAWAB · Ghar Baithe Nawabi
            </span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Report Darj Ho Chuki Hai</h4>
            <p className="text-xs text-slate-600 leading-relaxed px-2">
              Shukriya! NAWAB admin team 10 minute me fori action legi. Agar dhoka paya gaya to seller ki shop fori band kar di jayegi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-0.5 border border-slate-200">
              <div className="text-slate-500 text-[10px]">Reporting Product & Seller:</div>
              <div className="font-bold text-slate-900 truncate">{productTitle}</div>
              <div className="text-[11px] text-emerald-800 font-semibold">Seller: {sellerName}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kiya Masla / Dhoka Hua?
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedReason === reason
                        ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-[11px] leading-tight">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mazeed Tafseelat (Optional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Apna masla wazeh karein taake team action le sake..."
                rows={2}
                className="w-full p-2 text-base border border-slate-200 rounded-xl focus:outline-emerald-600"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
