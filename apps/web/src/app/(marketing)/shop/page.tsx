"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, ShoppingBag, Star, X, Plus, Minus, Heart, ArrowUpDown, ArrowRight, MessageCircle, MapPin, Truck } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { apiClient } from "@/lib/http/client";
import { SHOP_PRODUCTS, type Product } from "@/lib/data/shop";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";
import FormField from "@/components/ui/FormField";
import { filterNameInput, filterPhoneInput, filterLocationInput } from "@/lib/validations/validators";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc">("popular");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cart, cartOpen, addToCart, updateQuantity, removeFromCart, clearCart, setCartOpen, totalItems, subtotal } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "shipping" | "success">("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, setPendingAction, user } = useAuth();
  const authModal = useAuthModal();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Shipping form state
  const [shippingData, setShippingData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [isMounted, setIsMounted] = useState(false);

  // Open cart drawer when coming from home checkout flow
  useEffect(() => {
    if (searchParams?.get("checkout") === "true") {
      setCartOpen(true);
      setCheckoutStep("shipping");
      // Remove checkout param from URL to prevent infinite re-triggering or freeze on back navigation
      router.replace("/shop");
    }
  }, [searchParams, setCartOpen, router]);

  // Load initial cart and shipping details from localStorage
  React.useEffect(() => {
    try {
      const savedShipping = localStorage.getItem("tsp_shop_shipping");
      if (savedShipping) {
        setShippingData((prev) => ({
          ...prev,
          ...JSON.parse(savedShipping),
        }));
      }
    } catch (e) {
      console.error("Failed to load shop state from localStorage", e);
    }
    setIsMounted(true);
  }, []);

  // Save shipping details to localStorage when they change
  React.useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("tsp_shop_shipping", JSON.stringify(shippingData));
    } catch (e) {
      console.error("Failed to save shipping data to localStorage", e);
    }
  }, [shippingData, isMounted]);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "bracelets", label: "Bracelets" },
    { id: "rudraksha", label: "Rudraksha" },
    { id: "vastu", label: "Vastu Correction" },
    { id: "gemstones", label: "Gemstones" },
    { id: "crystals", label: "Crystals" },
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...SHOP_PRODUCTS];

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [search, selectedCategory, sortBy]);

  // Cart actions
  const addProductToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      type: "product",
      image: product.image,
      description: product.description,
    });
    setCheckoutStep("cart");
  };

  const removeProductFromCart = (productId: string) => {
    removeFromCart(productId);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setPendingAction(() => handleCheckout());
      authModal.open("login");
      return;
    }

    if (!shippingData.customerName || !shippingData.customerPhone || !shippingData.shippingAddress) {
      alert("Please fill in all required shipping details.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        ...shippingData,
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          itemType: item.type,
        })),
        totalAmount: subtotal,
        userId: user?.id || undefined
      };

      const res: any = await apiClient.post('/shop/orders', orderPayload);

      if (res.razorpayOrderId?.startsWith("order_mock_") || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        // Simulate successful payment for mock orders
        try {
          await apiClient.post('/shop/orders/verify', {
            razorpayOrderId: res.razorpayOrderId,
            paymentId: `pay_mock_${Math.random().toString(36).substring(2, 15)}`,
            signature: "mock_signature"
          });
          setCheckoutStep("success");
          clearCart();
        } catch (verifyError) {
          alert("Payment verification failed.");
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Payment gateway failed to load. Please check your internet connection.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'mock_key',
        amount: subtotal * 100,
        currency: "INR",
        name: "Time Space & Planets",
        description: "Divine Shop Order",
        order_id: res.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await apiClient.post('/shop/orders/verify', {
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            setCheckoutStep("success");
            clearCart();
          } catch (verifyError) {
            alert("Payment verification failed.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingData.customerName,
          email: shippingData.customerEmail,
          contact: shippingData.customerPhone
        },
        theme: {
          color: "#0A2540"
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response?.error?.description);
      });
      rzp.open();

    } catch (error) {
      alert("Failed to initiate checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-20 relative">
      {/* Hero Banner Section */}
      <section className="bg-gradient-navy text-white pt-[125px] pb-16 lg:pt-[140px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-gold font-poppins text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Pure & Energized Divine Remedies
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-gold">
            TSP Divine Shop
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter">
            Authentic, lab-certified crystals, energized bracelets, and Vastu remedies, ritualistically blessed by Vedic scholars to bring prosperity, protection, and positive vibrations.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters - Desktop */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="bg-white rounded-card border border-border p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-dark mb-4 border-b border-border pb-2">
                Categories
              </h2>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors font-poppins",
                      selectedCategory === cat.id
                        ? "bg-navy text-white"
                        : "text-paragraph hover:bg-cream hover:text-navy"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Support / Trust Badge Widget */}
            <div className="bg-white rounded-card border border-border p-5 shadow-card text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 fill-gold" />
              </div>
              <h3 className="font-poppins text-sm font-semibold text-dark">100% Energized & Certified</h3>
              <p className="text-xs text-paragraph mt-1">
                All products undergo strict planetary energization procedures by expert pandits prior to packaging.
              </p>
            </div>
          </aside>

          {/* Product Feed */}
          <main className="flex-1">
            {/* Search & Sort Panel */}
            <div className="bg-white rounded-card border border-border p-4 mb-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search bracelets, gemstones, pyramids..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-cream/50 rounded-lg border border-border focus:outline-none focus:border-gold transition-colors font-poppins"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted hover:text-dark" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown className="w-4 h-4 text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-border rounded-lg bg-white px-3 py-2 font-poppins focus:outline-none focus:border-gold"
                >
                  <option value="popular">Best Sellers</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-card-lg border border-border p-12 text-center shadow-card">
                <p className="text-paragraph text-base">No products found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4 text-navy font-semibold text-sm hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const discountPct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                  const isWishlisted = wishlist.includes(product.id);

                  return (
                    <article
                      key={product.id}
                      className="bg-white rounded-card border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 flex flex-col group relative"
                    >
                      {/* Image container */}
                      <div className="relative h-64 w-full bg-cream/35 overflow-hidden shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Wishlist Button */}
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-card transition-colors z-10"
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isWishlisted ? "text-rose-500 fill-rose-500" : "text-paragraph hover:text-rose-500"
                            )}
                          />
                        </button>
                        {/* Custom Badge */}
                        {product.badge && (
                          <span className="absolute left-3 top-3 text-[10px] uppercase font-bold tracking-wider bg-gold text-navy px-2.5 py-1 rounded-full shadow-sm z-10">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Rating & reviews count */}
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                            <span className="text-xs font-semibold text-dark font-poppins">
                              {product.rating.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-muted">
                              ({product.reviewCount} reviews)
                            </span>
                          </div>

                          <h3 className="font-heading text-base font-bold text-dark line-clamp-2 hover:text-navy transition-colors mb-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-paragraph line-clamp-3 mb-4">
                            {product.description}
                          </p>
                        </div>

                        <div>
                          {/* Price block */}
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-lg font-bold text-navy font-poppins">
                              ₹{product.price}
                            </span>
                            <span className="text-xs text-muted line-through font-poppins">
                              ₹{product.originalPrice}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold font-poppins">
                              {discountPct}% OFF
                            </span>
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() => addProductToCart(product)}
                            className="w-full bg-navy text-white hover:bg-navy-hover py-2.5 rounded-button text-xs font-semibold font-poppins flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Floating Shopping Cart Trigger (Shows when cart is populated but closed) */}
      {totalItems > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 bg-navy text-white p-4 rounded-full shadow-gold-intense hover:scale-105 transition-all duration-300 z-40 flex items-center gap-2 border border-gold"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="bg-gold text-navy font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        </button>
      )}

      {/* WhatsApp Help Floating Widget */}
      <a
        href="https://wa.me/+919810278102?text=Hello%20Time%20Space%20Planets%2C%20I%20have%20a%20question%20about%20spiritual%20remedies."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 z-40"
        title="Chat on WhatsApp"
      >
        <svg
          xmlns="http://w3.org"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </a>

      {/* Side Slide-Over Cart Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-none opacity-0",
          cartOpen && "opacity-100 pointer-events-auto"
        )}
        onClick={() => setCartOpen(false)}
      >
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between transform translate-x-full transition-transform duration-300 ease-in-out",
            cartOpen && "translate-x-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-cream/20">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-navy" />
              <h2 className="font-heading text-lg font-bold text-dark">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1 text-muted hover:text-dark rounded-lg hover:bg-cream/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {checkoutStep === "success" ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Star className="w-8 h-8 fill-emerald-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-dark">Order Placed Successfully!</h3>
                <p className="text-xs text-paragraph">
                  Thank you! Our Pandits will begin planetary energization calculations for your custom remedies. You will receive an SMS shipping link shortly.
                </p>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutStep("cart");
                  }}
                  className="bg-navy text-white hover:bg-navy-hover px-6 py-2.5 rounded-button text-xs font-semibold font-poppins transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-20 text-muted space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-poppins">Your cart is empty.</p>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-navy text-xs font-semibold hover:underline"
                >
                  Browse products
                </button>
              </div>
            ) : checkoutStep === "shipping" ? (
              <div className="space-y-4">
                <button onClick={() => setCheckoutStep("cart")} className="text-xs font-medium text-muted hover:text-dark flex items-center gap-1 mb-2">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Cart
                </button>
                <h3 className="font-heading text-lg font-bold text-dark flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gold" /> Shipping Details
                </h3>
                <div className="space-y-3">
                  <FormField
                    label=""
                    name="customerName"
                    placeholder="Full Name *"
                    value={shippingData.customerName}
                    onChange={(val) => setShippingData({ ...shippingData, customerName: filterNameInput(val) })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label=""
                      name="customerEmail"
                      type="email"
                      placeholder="Email"
                      value={shippingData.customerEmail}
                      onChange={(val) => setShippingData({ ...shippingData, customerEmail: val.trim() })}
                    />
                    <FormField
                      label=""
                      name="customerPhone"
                      type="tel"
                      placeholder="Phone *"
                      value={shippingData.customerPhone}
                      onChange={(val) => setShippingData({ ...shippingData, customerPhone: filterPhoneInput(val) })}
                      required
                    />
                  </div>
                  <FormField
                    label=""
                    name="shippingAddress"
                    placeholder="Street Address *"
                    value={shippingData.shippingAddress}
                    onChange={(val) => setShippingData({ ...shippingData, shippingAddress: val })}
                    required
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      label=""
                      name="city"
                      placeholder="City *"
                      value={shippingData.city}
                      onChange={(val) => setShippingData({ ...shippingData, city: filterLocationInput(val) })}
                      required
                    />
                    <FormField
                      label=""
                      name="state"
                      placeholder="State *"
                      value={shippingData.state}
                      onChange={(val) => setShippingData({ ...shippingData, state: filterLocationInput(val) })}
                      required
                    />
                    <FormField
                      label=""
                      name="pincode"
                      placeholder="PIN *"
                      value={shippingData.pincode}
                      onChange={(val) => setShippingData({ ...shippingData, pincode: filterPhoneInput(val) })} // Pincode should be numbers only
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 border border-border rounded-lg bg-cream/10"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-cream" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-semibold text-dark truncate font-poppins">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeProductFromCart(item.id)}
                          className="text-muted hover:text-rose-500 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-navy font-bold font-poppins mt-0.5">
                        ₹{item.price}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-cream"
                        >
                          <Minus className="w-3 h-3 text-paragraph" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-dark font-poppins">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-cream"
                        >
                          <Plus className="w-3 h-3 text-paragraph" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-dark font-poppins">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && checkoutStep !== "success" && (
            <div className="p-5 border-t border-border bg-cream/20 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-paragraph">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark font-poppins">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-paragraph">
                  <span>Planetary Energization Puja</span>
                  <span className="text-emerald-600 font-semibold uppercase tracking-wider text-[10px]">FREE</span>
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
                onClick={() => {
                  if (checkoutStep === "cart") {
                    if (!isAuthenticated) {
                      setPendingAction(() => setCheckoutStep("shipping"));
                      authModal.open("login");
                      return;
                    }
                    setCheckoutStep("shipping");
                  }
                  else handleCheckout();
                }}
                disabled={isProcessing}
                className="w-full bg-navy text-white hover:bg-navy-hover py-3 rounded-button font-semibold text-xs font-poppins flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-70"
              >
                {isProcessing ? "Processing..." : checkoutStep === "cart" ? "Proceed to Checkout" : "Pay Securely via Razorpay"}
                {!isProcessing && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

