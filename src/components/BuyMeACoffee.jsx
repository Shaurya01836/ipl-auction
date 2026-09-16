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
      icon: <Coffee className="w-3.5 h-3.5 text-[#ff5500]" />,
      tagline: "Late-night coding fuel ☕"
    },
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAmount = selectedTier === 'custom'
    ? (parseInt(customAmount) || 0)
    : tiers[selectedTier].amountINR;

  const currentTagline = selectedTier === 'custom'
    ? "Enter any amount you'd like to support! 💖"
    : tiers[selectedTier].tagline;

  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(developerName)}&am=${currentAmount}&cu=INR&tn=IPL%20Auction%20Support`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayUrl)}&color=0-0-0&bgcolor=255-255-255`;

  return (
    <>
      {/* FAB — anchored bottom-right */}
      <motion.button
        id="support-fab-button"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 bg-[#0a0a0a]/80 hover:bg-[#ff5500]/10 text-white px-3.5 py-2 rounded-full border border-white/10 hover:border-[#ff5500]/30 backdrop-blur-xl shadow-2xl transition-all duration-300 group cursor-pointer"
      >
        <Coffee className="w-3.5 h-3.5 text-[#ff5500]" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors duration-300">
          Support
        </span>
      </motion.button>

      {/* Modal Overlay */}
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
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-[340px] bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col"
            >
              {/* Glow orbs */}
              <div className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] bg-[#ff5500]/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-blue-600/5 blur-[60px] rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 z-10 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center px-6 pt-7 pb-5 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  Support the Dev
                </h3>
                <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest mt-1">
                  Keep it running ad-free
                </p>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Tier Selection */}
                <div className="space-y-2">
                  <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                    Choose Amount
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(tiers).map(([key, tier]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTier(key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          selectedTier === key
                            ? 'border-[#ff5500]/50 bg-[#ff5500]/10 shadow-[0_0_12px_rgba(255,85,0,0.1)]'
                            : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex-shrink-0">{tier.icon}</div>
                        <div className="text-left leading-tight">
                          <span className={`block text-[8px] font-black uppercase tracking-wider ${
                            selectedTier === key ? 'text-white' : 'text-gray-500'
                          }`}>
                            {tier.name}
                          </span>
                          <span className={`text-[9px] font-black italic ${
                            selectedTier === key ? 'text-[#ff5500]' : 'text-gray-600'
                          }`}>
                            ₹{tier.amountINR}
                          </span>
                        </div>
                      </button>
                    ))}

                    {/* Custom Amount Button */}
                    <button
                      onClick={() => setSelectedTier('custom')}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedTier === 'custom'
                          ? 'border-[#ff5500]/50 bg-[#ff5500]/10 shadow-[0_0_12px_rgba(255,85,0,0.1)]'
                          : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 flex-shrink-0 ${
                        selectedTier === 'custom' ? 'text-[#ff5500]' : 'text-gray-600'
                      }`} />
                      <div className="text-left leading-tight">
                        <span className={`block text-[8px] font-black uppercase tracking-wider ${
                          selectedTier === 'custom' ? 'text-white' : 'text-gray-500'
                        }`}>
                          Custom
                        </span>
                        <span className={`text-[9px] font-black italic ${
                          selectedTier === 'custom' ? 'text-[#ff5500]' : 'text-gray-600'
                        }`}>
                          ₹{customAmount || 'Any'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Custom amount input */}
                  <AnimatePresence>
                    {selectedTier === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Enter amount (₹)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-center text-[10px] font-black text-[#ff5500] placeholder:text-gray-700 focus:outline-none focus:border-[#ff5500]/50 transition-all mt-1"
                          min="1"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tagline */}
                <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-wider text-center bg-white/[0.02] border border-white/5 py-1.5 px-2 rounded-xl">
                  {currentTagline}
                </p>

                {/* QR + UPI */}
                <div className="flex flex-col items-center space-y-3 w-full bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest text-center">
                    Scan with any UPI app
                  </p>

                  {/* Copy UPI ID */}
                  <div className="flex w-full bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex-1 px-3 py-2 text-[8px] font-black text-gray-400 tracking-wider truncate uppercase flex items-center select-all">
                      {upiId}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-3 bg-white/5 hover:bg-[#ff5500]/10 text-white hover:text-[#ff5500] flex items-center justify-center gap-1 transition-all text-[8px] font-black uppercase tracking-widest cursor-pointer border-l border-white/5"
                    >
                      {copied ? (
                        <><Check className="w-2.5 h-2.5 text-[#ff5500]" />Copied</>
                      ) : (
                        <><Copy className="w-2.5 h-2.5" />Copy</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer note */}
                <div className="text-center border-t border-white/5 pt-3">
                  <p className="text-[7px] font-black text-gray-700 uppercase tracking-[0.25em]">
                    Direct UPI Support — No fees
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BuyMeACoffee;
