import React from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Store,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
  const { openChatWithSeller } = useApp();
  const sellerId = order.items[0]?.product.sellerId || 'seller-1';
  const sellerPhone = order.items[0]?.product.sellerPhone || '0300-0000000';
  const sellerName = order.items[0]?.product.sellerName || 'Local Seller';
  const productTitle = order.items[0]?.product.title;
  const productId = order.items[0]?.product.id;
  const category = order.items[0]?.product.category;

  const steps = [
    {
      title: 'Order Placed (Cash on Delivery / Cash on Work)',
      desc: 'Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa',
      done: true,
    },
    {
      title: 'Seller Confirmed',
      desc: 'Seller aapka order tayar kar raha hai',
      done: ['confirmed', 'out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      title: 'Seller On The Way',
      desc: 'Seller khud deliver karne aapke address par aa raha hai',
      done: ['out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      title: 'Delivered & Paid on Spot',
      desc: order.status === 'delivered' ? 'Successfully delivered and settled with seller' : 'Pay directly to seller on delivery/work',
      done: order.status === 'delivered',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Order Tracking #{order.id}
              </h3>
              <span className="text-[11px] text-slate-400">Direct Seller Delivery</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-200">
              Cash on Delivery / Cash on Work
            </span>
            <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded text-emerald-100 font-mono">
              DIRECT SELLER
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Store className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {order.status === 'delivered'
                  ? 'Delivered to Buyer'
                  : 'Seller will deliver directly to your doorstep'}
              </h4>
              <p className="text-xs text-emerald-300">
                {order.deliveryAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Contact Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
              {sellerName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">
                {sellerName}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">{sellerPhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${sellerPhone}`}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              title="Call Seller"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => {
                openChatWithSeller({
                  sellerId,
                  sellerName,
                  sellerPhone,
                  productId,
                  productTitle,
                  category,
                });
                onClose();
              }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
              title="NAWAB Secure Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Order Delivery Status
          </h4>

          <div className="space-y-4">
            {steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    st.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {st.done ? '✓' : idx + 1}
                </div>
                <div className="flex-1 pb-1">
                  <span
                    className={`text-xs font-bold block ${
                      st.done ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {st.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block">{st.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 mt-4">
            <strong>Direct Seller Order:</strong> Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa. NAWAB koi order money hold ya transfer nahi karta.
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
