import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  X,
  Copy,
  Check,
  Pizza,
  Rocket,
  Heart
} from 'lucide-react';

const BuyMeACoffee = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState('coffee');
  const [customAmount, setCustomAmount] = useState('100');


  const developerName = "Shaurya";
  const upiId = "shaurya69889@oksbi";

  const tiers = {
    coffee: {
      name: "Coffee",
      amountINR: 150,
      icon: <Coffee className="w-4 h-4 text-amber-500" />,
      tagline: "Late-night coding fuel ☕"
    },
    pizza: {
      name: "Pizza",
      amountINR: 350,
      icon: <Pizza className="w-4 h-4 text-orange-500" />,
      tagline: "Hosting & database funds 🍕"
    },
    rocket: {
      name: "Super Fan",
      amountINR: 750,
      icon: <Rocket className="w-4 h-4 text-red-500" />,
      tagline: "Future features support 🚀"
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine actual payment amount and tagline based on selection
  const currentAmount = selectedTier === 'custom'
    ? (parseInt(customAmount) || 0)
    : tiers[selectedTier].amountINR;

  const currentTagline = selectedTier === 'custom'
    ? "Enter any amount you'd like to support! 💖"
    : tiers[selectedTier].tagline;

  // UPI Deep Link Generation
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(developerName)}&am=${currentAmount}&cu=INR&tn=IPL%20Auction%20Support`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayUrl)}&color=0-0-0&bgcolor=255-255-255`;

  return (
    <>

      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{
          scale: 1.05,
          y: -2,
          boxShadow: "0 0 25px rgba(245, 158, 11, 0.15)"
        }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 bg-[#0a0a0a]/80 hover:bg-white/[0.05] text-white px-3.5 py-2 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-300 group cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors duration-300">
          Support ☕
        </span>
      </motion.button>

      {/* 🔮 Support Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-[340px] bg-[#0c0c0c] border border-white/10 rounded-[2rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all duration-300 cursor-pointer animate-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center mt-1 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                  <Coffee className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  Support Session
                </h3>
                <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest mt-1">
                  Keep it running ad-free
                </p>
              </div>

              {/* Support Tiers Selector */}
              <div className="space-y-2 mb-3">
                <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                  Choose Amount
                </label>

                {/* Balanced 2x2 grid for preset options and Custom amount option */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(tiers).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTier(key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${selectedTier === key
                          ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                          : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                        }`}
                    >
                      <div className="scale-90 flex-shrink-0">{tier.icon}</div>
                      <div className="text-left leading-tight">
                        <span className={`block text-[8px] font-black uppercase tracking-wider ${selectedTier === key ? 'text-white' : 'text-gray-500'}`}>
                          {tier.name}
                        </span>
                        <span className="text-[9px] font-black italic text-amber-400">
                          ₹{tier.amountINR}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Custom pricing trigger button */}
                  <button
                    onClick={() => setSelectedTier('custom')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${selectedTier === 'custom'
                        ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                        : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                      }`}
                  >
                    <div className="scale-90 flex-shrink-0"><Heart className="w-4 h-4 text-pink-500" /></div>
                    <div className="text-left leading-tight">
                      <span className={`block text-[8px] font-black uppercase tracking-wider ${selectedTier === 'custom' ? 'text-white' : 'text-gray-500'}`}>
                        Custom
                      </span>
                      <span className="text-[9px] font-black italic text-amber-400">
                        ₹{customAmount || 'Any'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Smooth expandable Input for custom pricing */}
                <AnimatePresence>
                  {selectedTier === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-1"
                    >
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCustomAmount(val);
                        }}
                        placeholder="Enter custom amount (₹)"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-center text-xs focus:outline-none focus:border-amber-500 transition-all font-black text-amber-400 placeholder:text-gray-700"
                        min="1"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tagline */}
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-wider text-center bg-white/[0.02] border border-white/5 py-1.5 px-2 rounded-lg mb-3">
                {currentTagline}
              </p>

              {/* QR Code and Payment Container */}
              <div className="flex flex-col items-center space-y-3 w-full bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                {/* Compact QR Container */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>

                <p className="text-[7.5px] font-black text-gray-500 uppercase tracking-widest text-center">
                  Scan to pay with any UPI app
                </p>

                {/* Copy UPI Container */}
                <div className="flex w-full bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                  <div className="flex-1 px-3 py-2 text-[8px] font-black text-gray-400 tracking-wider truncate uppercase flex items-center select-all">
                    {upiId}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-1 transition-all text-[8px] font-black uppercase tracking-widest cursor-pointer border-l border-white/5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Thank you footer */}
              <div className="mt-4 text-center border-t border-white/5 pt-3">
                <p className="text-[7px] font-bold text-gray-700 uppercase tracking-[0.25em]">
                  Direct UPI Support
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BuyMeACoffee;
