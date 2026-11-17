import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Banknote,
  Truck,
} from 'lucide-react';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess }) => {
  const {
    cart,
    cartSubtotal,
    cartCount,
    placeOrder,
    selectedArea,
    authUser,
  } = useApp();

  // Form states (preserve user Ali / authUser details & defaults)
  const [buyerName, setBuyerName] = useState(authUser?.name || 'Asad Ali');
  const [buyerPhone, setBuyerPhone] = useState(authUser?.phone || '0322-8765432');
  const [deliveryAddress, setDeliveryAddress] = useState(
    authUser?.address || 'House 42, Street 7, Satellite Town, Rawalpindi, Pakistan'
  );
  const [deliveryArea] = useState(
    selectedArea === 'All Rawalpindi' ? 'Satellite Town' : selectedArea
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cartSubtotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim() || !deliveryAddress.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      placeOrder({
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryArea,
      });
      setIsSubmitting(false);
      onOrderSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <header className="sticky top-8 md:top-8 z-30 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-extrabold text-slate-900">
            Checkout · Cash on Delivery / Cash on Work
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Cash on Delivery / Direct Seller Notice */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-start gap-3">
          <Banknote className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-extrabold text-emerald-950 uppercase tracking-wide">
              Cash on Delivery / Cash on Work Only
            </h4>
            <p className="text-emerald-900 font-bold mt-1">
              Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
            </p>
            <p className="text-emerald-800 mt-1 leading-relaxed">
              Seller aapke address par khud deliver karega aur spot par payment lega. NAWAB koi order money nahi leta, hold nahi karta, aur transfer nahi karta.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Delivery Details */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Local Delivery Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 text-base"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number (Jazz / Zong / Telenor)</label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 text-base"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-600 font-semibold mb-1">
                Complete Delivery Address (House / Street / Sector)
              </label>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500 text-base"
              />
            </div>
          </div>

          {/* Section 2: Order Summary */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Order Summary ({cartCount} items)</span>
            </h3>

            <div className="space-y-1.5 border-b border-slate-100 pb-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-slate-700">
                  <span className="truncate max-w-[240px]">
                    {item.product.title} × {item.quantity}
                  </span>
                  <span className="font-semibold tabular-nums">
                    Rs {item.product.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="tabular-nums font-semibold text-slate-900">Rs {cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-700">Direct by Seller</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Order Total (Pay on Delivery / Work)</span>
                <span className="text-emerald-700 text-lg tabular-nums">Rs {totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Cash on Delivery / Cash on Work Only */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-black">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Cash on Delivery / Cash on Work Only
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    No Online Payment · No Card · Direct Seller Dealing
                  </span>
                </div>
              </div>
              <span className="text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg font-black border border-emerald-300">
                Rs {totalAmount} on Spot
              </span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Seller khud aapke paas aayega aur kaam / delivery ke baad aap direct seller ko Cash, JazzCash ya EasyPaisa de sakte hain.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NAWAB · Ghar Baithe Nawabi · Zero Platform Fee</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Order (COD) · Rs {totalAmount}</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
