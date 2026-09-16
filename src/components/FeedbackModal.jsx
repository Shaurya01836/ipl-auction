import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Star, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature' },
  { id: 'ui', label: 'UI / UX' },
];

const FeedbackModal = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [email, setEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Show feedback button strictly on landing page only
  if (location.pathname !== '/') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'feedbacks'), {
        email: email.trim() || 'Not provided',
        category,
        rating,
        feedback: feedbackText.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError('Unable to send right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
      setEmail('');
      setFeedbackText('');
      setRating(0);
      setCategory('general');
    }, 350);
  };

  return (
    <>
      {/* FAB — sits above Support button */}
      <motion.button
        id="feedback-fab-button"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-6 z-[90] flex items-center gap-2 bg-[#0a0a0a]/80 hover:bg-[#ff5500]/10 text-white px-3.5 py-2 rounded-full border border-white/10 hover:border-[#ff5500]/30 backdrop-blur-xl shadow-2xl transition-all duration-300 group cursor-pointer"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-[#ff5500] group-hover:text-[#ff5500]" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors duration-300">
          Feedback
        </span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-[380px] bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
            >
              {/* Glow orbs */}
              <div className="absolute -top-[15%] -left-[10%] w-[40%] h-[40%] bg-[#ff5500]/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-[10%] -right-[10%] w-[35%] h-[35%] bg-blue-600/5 blur-[60px] rounded-full pointer-events-none" />

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 z-10 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center px-6 pt-7 pb-5 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  Share Feedback
                </h3>
                <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest mt-1">
                  Help make IPL Auction Hub better
                </p>
              </div>

              {/* Body */}
              <div className="p-6">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#ff5500]/10 text-[#ff5500] flex items-center justify-center border border-[#ff5500]/20 shadow-[0_0_25px_rgba(255,85,0,0.15)]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white mt-2">Submitted!</p>
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                      Thanks for your response. We'll review it shortly.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-3 w-full h-10 relative overflow-hidden group/close rounded-xl cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/close:scale-105" />
                      <span className="relative text-[9px] font-black uppercase tracking-[0.2em] text-white">Close</span>
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div className="space-y-1.5">
                      <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                        Rating
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                star <= (hoverRating || rating)
                                  ? 'text-[#ff5500] fill-[#ff5500] drop-shadow-[0_0_6px_rgba(255,85,0,0.5)]'
                                  : 'text-gray-700'
                              }`}
                            />
                          </button>
                        ))}
                        {(hoverRating || rating) > 0 && (
                          <span className="ml-1 text-[8px] font-black uppercase tracking-widest text-[#ff5500]">
                            {hoverRating || rating} / 5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                        Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                              category === cat.id
                                ? 'border-[#ff5500]/50 bg-[#ff5500]/10 shadow-[0_0_12px_rgba(255,85,0,0.1)]'
                                : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                            }`}
                          >
                            <span className={`text-[8px] font-black uppercase tracking-wider ${
                              category === cat.id ? 'text-[#ff5500]' : 'text-gray-500'
                            }`}>
                              {cat.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                        Email <span className="text-gray-700 font-bold normal-case">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-[10px] font-black normal-case tracking-normal placeholder:text-gray-800 focus:outline-none focus:border-[#ff5500]/50 transition-all"
                      />
                    </div>

                    {/* Feedback Text */}
                    <div className="space-y-1.5">
                      <label className="block text-[7.5px] font-black text-gray-600 uppercase tracking-widest ml-1">
                        Message <span className="text-[#ff5500]">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Bugs, ideas, improvements..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-[10px] font-black uppercase tracking-widest placeholder:text-gray-800 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-[#ff5500]/50 transition-all resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-[8px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                        {error}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !feedbackText.trim()}
                      className="w-full h-11 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                      <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[9px]">
                        {isSubmitting ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Sending...</span></>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /><span>Submit Feedback</span></>
                        )}
                      </div>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackModal;
