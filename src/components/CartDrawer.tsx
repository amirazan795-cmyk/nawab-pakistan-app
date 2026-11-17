import { useApp } from '../context/AppContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  ImageOff,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartCount,
  } = useApp();

  if (!isOpen) return null;

  const finalOrderTotal = cartSubtotal;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                Shopping Cart
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your basket
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-extrabold text-base text-slate-800">Your Cart is Empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Browse products and tap "+ Add" to put items in your shopping cart.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Product Items List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Added Products ({cartCount})
                </span>

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    {/* Item Image */}
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                        <ImageOff className="w-5 h-5 text-slate-300" />
                        <span className="text-[9px] font-bold">No Photo</span>
                      </div>
                    )}

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {item.product.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {item.product.sellerName || 'Seller'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-extrabold text-emerald-700 text-xs">
                          Rs {item.product.price}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total: <strong className="text-slate-700 font-mono">Rs {item.product.price * item.quantity}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Quantity + / - Controls */}
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black tabular-nums text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Option */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                      title="Remove product from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cash on Delivery / Cash on Work Notice */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-emerald-700 text-white px-2 py-0.5 rounded">
                      COD
                    </span>
                    <strong className="text-xs text-emerald-950 font-bold">Cash on Delivery / Cash on Work Only</strong>
                  </div>
                </div>

                <p className="text-xs font-extrabold text-emerald-900">
                  Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-white border border-emerald-100 p-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Seller khud deliver karega aur spot par payment lega. NAWAB koi order money nahi leta ya hold karta.</span>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100">
                  Order Summary
                </span>

                <div className="flex justify-between text-slate-600">
                  <span>Products Subtotal</span>
                  <span className="font-bold text-slate-900 tabular-nums">Rs {cartSubtotal}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode</span>
                  <span className="font-bold text-emerald-700">Cash on Delivery / Work</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Order Total (Pay to Seller)</span>
                  <span className="text-emerald-700 font-mono text-base tabular-nums">
                    Rs {finalOrderTotal}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Proceed to Checkout (Rs {finalOrderTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-500 text-center font-semibold">
              Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
