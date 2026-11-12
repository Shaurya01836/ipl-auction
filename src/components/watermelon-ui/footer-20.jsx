import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isUserAdmin } from '../../lib/adminAuth';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const riseItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.5, bounce: 0 },
  },
};

const giantTextVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.7, bounce: 0 },
  },
};

export default function Footer20() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user, import.meta.env.VITE_ADMIN_EMAIL);
  const shouldReduceMotion = useReducedMotion();

  const containerProps = shouldReduceMotion
    ? {}
    : {
        variants: staggerContainer,
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, amount: 0.12 },
      };

  const itemProps = shouldReduceMotion ? {} : { variants: riseItem };
  const textProps = shouldReduceMotion ? {} : { variants: giantTextVariant };

  return (
    <motion.footer
      {...containerProps}
      className="relative w-full bg-transparent text-gray-400 font-sans overflow-hidden flex flex-col justify-between border-t border-white/[0.06] mt-20 sm:mt-32 z-10"
    >
      {/* Main content wrapper with dashed borders */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 pt-16 md:pt-24 flex flex-col">
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12 md:mb-16">
          {/* Left Column (Brand info) */}
          <motion.div
            {...itemProps}
            className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 md:gap-6"
          >
            {/* Logo */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-pixel text-xl sm:text-2xl text-white select-none tracking-tight w-fit"
            >
              CrickAuction
            </Link>

            {/* Description */}
            <p className="text-[14px] leading-relaxed text-gray-400 max-w-sm">
              The ultimate multiplayer IPL auction simulator and game. Host live
              IPL mega auctions with friends in real-time, choose your franchise,
              bid strategically, and build championship squads.
            </p>

            {/* Creator / Craft Attribution */}
            <div className="pt-2">
              <a
                href="https://ershaurya.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors group/craft"
              >
                <span>
                  Concept crafted by{' '}
                  <span className="text-white underline underline-offset-2">
                    Shaurya Upadhyay
                  </span>
                </span>
                <ArrowUpRight
                  size={14}
                  className="group-hover/craft:translate-x-0.5 group-hover/craft:-translate-y-0.5 transition-transform"
                />
              </a>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-2">
                © {currentYear} CrickAuction. All rights reserved.
              </p>
            </div>
          </motion.div>

          {/* Right Columns (Links Grid) */}
          <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-10">
            {/* Navigation Column */}
            <motion.div {...itemProps} className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Platform
              </span>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <Link
                    to="/"
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/guide"
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    Game Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      className="text-[14px]  text-gray-400 hover:text-white font-semibold transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Legal Column */}
            <motion.div {...itemProps} className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Legal
              </span>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <Link
                    to="/terms"
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Connect Column */}
            <motion.div {...itemProps} className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Connect
              </span>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a
                    href="https://github.com/Shaurya01836/ipl-auction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[14px] text-gray-400 hover:text-white transition-colors group/git"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      className="fill-current shrink-0"
                    >
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.22-1.552 3.32-1.23 3.32-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    <span>GitHub Star</span>
                    <ArrowUpRight
                      size={12}
                      className="group-hover/git:translate-x-0.5 group-hover/git:-translate-y-0.5 transition-transform"
                    />
                  </a>
                </li>
                <li>
                  <a
                    href="https://ershaurya.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[14px] text-gray-400 hover:text-white transition-colors group/dev"
                  >
                    <Globe size={15} className="shrink-0" />
                    <span>Developer Site</span>
                    <ArrowUpRight
                      size={12}
                      className="group-hover/dev:translate-x-0.5 group-hover/dev:-translate-y-0.5 transition-transform"
                    />
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Giant Watermark Text SVG */}
        <motion.div
          {...textProps}
          className="w-full flex justify-center md:mt-auto pb-0 select-none overflow-hidden"
        >
          <svg
            className="w-full h-auto select-none transition-colors duration-300"
            viewBox="0 32 1100 80"
            preserveAspectRatio="xMidYMid meet"
            aria-label="CRICKAUCTION"
          >
            <defs>
              <linearGradient
                id="crickauction-watermark-gradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#454b59" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#2e333e" stopOpacity="0.25" />
                <stop offset="65%" stopColor="#1a1d24" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0c0e13" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <text
              x="0"
              y="130"
              dominantBaseline="alphabetic"
              textAnchor="start"
              textLength="100%"
              lengthAdjust="spacing"
              fill="url(#crickauction-watermark-gradient)"
              className="font-pixel font-black tracking-tighter"
              fontSize="135"
            >
              CRICKAUCTION
            </text>
          </svg>
        </motion.div>
      </div>
    </motion.footer>
  );
}

