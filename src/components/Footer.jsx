import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, Mail, Cpu, Award } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>, href: "https://github.com/Shaurya01836", label: "GitHub" },
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, href: "https://shaurya-upadhyay.me", label: "Portfolio" },
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, href: "https://www.linkedin.com/in/this-is-shaurya-upadhyay/", label: "LinkedIn" }
  ];

  const techStack = [
    { name: "React & Vite", href: "https://vite.dev" },
    { name: "Tailwind CSS", href: "https://tailwindcss.com" },
    { name: "Firebase Firestore", href: "https://firebase.google.com" },
    { name: "Framer Motion", href: "https://motion.dev" }
  ];

  return (
    <footer className="mt-32 w-full max-w-6xl mx-auto px-6 border-t border-white/5 pt-16 pb-12 z-10 relative">
      {/* Background glow effects inside footer area */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-72 h-72 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-72 h-72 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 md:gap-8 pb-12">
        {/* Brand / Intro */}
        <div className="col-span-1 sm:col-span-12 md:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
       
            <span className="text-sm font-black tracking-[0.2em] uppercase text-white bg-clip-text">
              IPL Auction Hub
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium pr-4">
            The ultimate real-time multiplayer IPL auction simulator. Build your dream franchise squad, manage team budget and overseas slots, and compete dynamically in live bidding wars.
          </p>
          {/* Social Icons */}
          <div className="flex gap-3 pt-2">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300"
                title={social.label}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="col-span-1 sm:col-span-6 md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Built With</h4>
          <ul className="space-y-2">
            {techStack.map((tech) => (
              <li key={tech.name}>
                <a
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 group"
                >
                  {tech.name}
                  <Cpu size={10} className="text-gray-700 group-hover:text-white transition-colors duration-200" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Developer Info */}
        <div className="col-span-1 sm:col-span-6 md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Developer</h4>
          <div className="space-y-2">
            <a
              href="https://shaurya-upadhyay.me"
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <span className="text-xs font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest block">
                Shaurya Upadhyay
              </span>
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block">
                Full-Stack Engineer
              </span>
            </a>
            <div className="pt-1">
              <a
                href="mailto:contact@shaurya-upadhyay.me"
                className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors"
              >
                <Mail size={12} /> Email Me
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/5 mb-8" />

      {/* Bottom Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center sm:text-left leading-relaxed">
          &copy; {currentYear} IPL Auction Hub. All rights reserved. 🏏
        </p>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={12} className="text-[#ff5500]/70" />
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] leading-none">
            Secure Realtime Sync Enabled
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
