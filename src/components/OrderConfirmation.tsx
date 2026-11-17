import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Check,
  Copy,
  Clock,
  MapPin,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Order } from '../types';
import { NawabLogoBadge } from './NawabLogo';

interface OrderConfirmationProps {
  order?: Order | null;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order: propOrder,
  onContinueShopping,
  onTrackOrder,
}) => {
  const { activeOrder, orders } = useApp();
  const order = propOrder || activeOrder || orders[0];
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">No active order</h2>
        <button
          onClick={onContinueShopping}
          className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(`#${order.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100/90 via-emerald-50/60 to-white text-slate-800 p-4 sm:p-6 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Top NAWAB Logo */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center gap-2.5">
            <NawabLogoBadge size="sm" />
            <div className="text-left leading-tight">
              <span className="font-black text-xl tracking-tight text-emerald-950 block">
                NAWAB
              </span>
              <span className="text-[11px] font-bold text-emerald-700 block">
                Ghar Baithe Nawabi
              </span>
            </div>
          </div>
        </div>

        {/* Big Green Circle Checkmark matching screenshot 2 */}
        <div className="flex flex-col items-center justify-center text-center pt-2">
          <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 animate-in zoom-in-50 duration-300">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            Your Order is Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-emerald-800/80 mt-1">
            Thank you! Your order has been placed successfully.
          </p>
        </div>

        {/* Order Details Card matching screenshot 2 */}
        <div className="bg-white rounded-3xl p-5 shadow-md shadow-emerald-900/5 border border-emerald-100/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Order Number
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                #{order.id}
              </span>
            </div>
            <button
              onClick={handleCopyOrderNumber}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Copy Order ID"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Estimated Delivery</span>
                <span className="font-bold text-slate-900">{order.estimatedDelivery}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Delivery Address</span>
                <span className="font-semibold text-slate-900">{order.deliveryAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Delivery Banner */}
        <div className="bg-emerald-100/90 rounded-2xl p-4 border border-emerald-200/80 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-extrabold text-emerald-950">
              {order.status === 'delivered'
                ? 'Order Delivered Successfully'
                : 'Seller Direct Delivery / Work'}
            </h4>
            <p className="text-[11px] text-emerald-800">
              {order.status === 'delivered'
                ? 'Order delivered and settled directly with seller'
                : 'Seller khud deliver karega aur spot par payment lega'}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-md shadow-emerald-900/5 border border-emerald-100/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900">
              Order Summary · {totalItemCount} items
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
              Cash on Delivery / Work
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-slate-700">
                <span className="truncate max-w-[220px]">
                  • {item.product.title} × {item.quantity}
                </span>
                <span className="font-bold tabular-nums">
                  Rs. {item.product.price * item.quantity}
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Order Total (Pay to Seller)</span>
              <span className="text-emerald-700 text-base tabular-nums">
                Rs. {(order.totalAmount ?? order.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-2">
              Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onTrackOrder}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Track Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onContinueShopping}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-600 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Continue Shopping</span>
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold underline cursor-pointer"
            >
              {showHelp ? 'Hide Support Info' : 'Need help? Contact NAWAB Support'}
            </button>

            {showHelp && (
              <div className="mt-3 p-3.5 bg-white border border-emerald-200 rounded-2xl text-left shadow-sm space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">NAWAB · Ghar Baithe Nawabi</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">24/7 Active</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Order ya delivery ke liye direct seller ya in-app support par rabta karein:
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In-App 24/7 Support</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
