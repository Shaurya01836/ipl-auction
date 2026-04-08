import React, { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const GithubStarButton = () => {
  const [stars, setStars] = useState(null);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Shaurya01836/ipl-auction');
        const data = await response.json();
        if (data.stargazers_count !== undefined) {
          const count = data.stargazers_count;
          if (count >= 1000) {
            setStars((count / 1000).toFixed(1) + 'K');
          } else {
            setStars(count.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching stars:', error);
        // Fallback to a static number if API fails, or keep loading state
        setStars('0'); 
      }
    };

    fetchStars();
  }, []);

  return (
    <motion.a
      href="https://github.com/Shaurya01836/ipl-auction"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      whileTap={{ scale: 0.98 }}
      className="fixed top-6 right-6 z-[100] flex items-center gap-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full transition-all duration-300 group shadow-2xl scale-90 sm:scale-100"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" className="fill-white/70 group-hover:fill-white transition-colors duration-300">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.22-1.552 3.32-1.23 3.32-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
      
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5">
        <span className="text-[10px] font-black text-white/50 group-hover:text-white transition-colors duration-300 uppercase tracking-[0.15em] pt-0.5">
          {stars === null ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            stars
          )}
        </span>
        <Star size={12} className="text-yellow-500/60 fill-transparent group-hover:fill-yellow-500 transition-all duration-500" />
      </div>
    </motion.a>
  );
};

export default GithubStarButton;
