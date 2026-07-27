"use client";

import { useState, useEffect } from "react";
import { X, User, Phone, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function QuickContactPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("consultation");

  useEffect(() => {
    // Show the popup after 8 seconds of page load to act as a lead magnet
    const timer = setTimeout(() => {
      const hasSeenPopup = sessionStorage.getItem("tsp_contact_popup_seen");
      if (!hasSeenPopup) {
        setIsVisible(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("tsp_contact_popup_seen", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    // Here you would typically send this data to your API
    // console.log("Lead captured:", { name, phone, interest });
    
    setHasSubmitted(true);
    
    // Auto dismiss after 3 seconds of success
    setTimeout(() => {
      handleDismiss();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1C1A17] border border-[#C8A04A]/30 rounded-2xl shadow-2xl overflow-hidden font-poppins"
          >
            {/* Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8A04A] via-[#E8D08B] to-[#C8A04A]"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {hasSubmitted ? (
              <div className="p-10 flex flex-col items-center justify-center text-center min-h-[350px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">धन्यवाद!</h3>
                <p className="text-white/70">
                  आपकी जानकारी हमें प्राप्त हो गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।
                </p>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-center mb-6 relative">
                  <div className="absolute -inset-4 bg-[#C8A04A]/20 blur-2xl rounded-full"></div>
                  <div className="relative bg-gradient-to-b from-[#C8A04A] to-[#8C6D23] p-4 rounded-full text-white shadow-lg border border-[#E8D08B]/30">
                    <Sparkles className="w-8 h-8" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    त्वरित परामर्श एवं सेवाएँ
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    क्या आप अपने भविष्य को लेकर चिंतित हैं या ज्योतिष सीखना चाहते हैं? आज ही जानकारी प्राप्त करें।
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">
                      आपकी रुचि (Your Interest)
                    </label>
                    <select 
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A] transition-all appearance-none"
                    >
                      <option value="consultation" className="bg-[#1C1A17] text-white">विशेषज्ञ परामर्श (Consultation)</option>
                      <option value="masterclass" className="bg-[#1C1A17] text-white">ज्योतिष मास्टरक्लास (Masterclass)</option>
                      <option value="pooja" className="bg-[#1C1A17] text-white">पूजा बुकिंग (Pooja Booking)</option>
                    </select>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-white/40" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="आपका पूरा नाम (Your Name)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5 text-white/40" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="मोबाइल नंबर (Mobile Number)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] hover:from-[#D4AC5A] hover:to-[#B8933E] text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(200,160,74,0.3)] hover:shadow-[0_6px_20px_rgba(200,160,74,0.4)] hover:-translate-y-0.5 mt-2"
                  >
                    सबमिट करें (Submit)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                
                <p className="text-center text-[10px] text-white/40 mt-4">
                  आपकी जानकारी हमारे पास सुरक्षित है। हम स्पैम नहीं भेजते।
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
