"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";

export default function SharedCartDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cart,
    cartOpen,
    totalItems,
    subtotal,
    setCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { isAuthenticated, setPendingAction } = useAuth();
  const authModal = useAuthModal();

  if (pathname?.startsWith("/shop")) {
    return null;
  }

  return (
    <>
      {totalItems > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-gold-intense transition-transform duration-300 hover:-translate-y-1"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>{totalItems}</span>
        </button>
      )}

      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setCartOpen(false)}
      >
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            cartOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-cream/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-navy" />
              <h2 className="text-lg font-semibold text-dark">Shopping Cart ({totalItems})</h2>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-lg p-2 text-muted hover:text-dark"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-sm text-muted py-10">
                Your cart is empty.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-cream/10 p-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-cream flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-dark">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-paragraph text-left">₹{item.price}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center rounded border border-border bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-sm text-paragraph hover:bg-cream"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm font-semibold text-dark">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-sm text-paragraph hover:bg-cream"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-dark">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-border bg-white p-5 md:p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10 relative">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-xs text-paragraph">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark font-poppins">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-paragraph">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-semibold uppercase tracking-wider text-[10px]">FREE</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-dark">
                  <span>Estimated Total</span>
                  <span className="font-bold text-navy font-poppins text-lg">₹{subtotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setPendingAction(() => {
                      setCartOpen(false);
                      router.push("/shop?checkout=true");
                    });
                    authModal.open("login");
                    return;
                  }
                  setCartOpen(false);
                  router.push("/shop?checkout=true");
                }}
                className="w-full bg-navy text-white hover:bg-navy-hover py-3 rounded-button font-semibold text-xs font-poppins flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
