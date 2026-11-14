import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, ShieldCheck, Mail, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PhotoCredits = () => {
  useDocumentTitle('Photo Credits & Attribution | CrickAuction', 'Attribution, licensing, and fair use disclosures for cricketer portraits on CrickAuction.');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState('fan-disclaimer');

  const sections = [
    { id: 'fan-disclaimer', label: '1. Fan-Made Project Disclaimer' },
    { id: 'nominative-fair-use', label: '2. Purpose & Nominative Fair Use' },
    { id: 'wikimedia-commons', label: '3. Creative Commons & Wikimedia' },
    { id: 'public-roster', label: '4. Public Franchise & Editorial Headshots' },
    { id: 'fallback-initials', label: '5. Dynamic Initials Fallback Policy' },
    { id: 'takedown-procedure', label: '6. Notice & Takedown Requests' },
    { id: 'source-directory', label: '7. Summary of Sources & Licenses' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
        setActiveSection(sections[sections.length - 1].id);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#E5E5E5] font-sans selection:bg-white/20 selection:text-white flex flex-col">
      <PageBackground showArt={false} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-gray-500">Legal</span>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-white">Photo Credits</span>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row gap-8 lg:gap-24 items-start w-full flex-1">
        {/* Left TOC - desktop */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-28">
          <h3 className="text-white font-semibold text-sm mb-4">On this page</h3>
          <nav className="flex flex-col gap-2.5 border-l border-white/10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-sm text-left pl-4 -ml-[1px] border-l ${
                  activeSection === s.id
                    ? 'border-slate-400/70 text-white font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/30'
                } transition-colors`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl w-full pb-16 sm:pb-20">
          {/* Mobile TOC */}
          <details className="lg:hidden mb-6 border border-white/10 rounded-md p-4 bg-white/[0.01]">
            <summary className="cursor-pointer text-sm font-medium text-white">On this page</summary>
            <nav className="flex flex-col gap-2 mt-3 border-l border-white/10">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`text-sm text-left pl-3 -ml-[1px] border-l ${
                    activeSection === s.id ? 'border-slate-400/70 text-white' : 'border-transparent text-gray-400'
                  } transition-colors`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </details>

          {/* Heading */}
          <div className="mb-8 sm:mb-12 border-b border-white/10 pb-6 sm:pb-8">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-pixel mb-3">
              Player Photo Credits & Attribution
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Disclosures regarding image licensing, source attribution, and fair use identification of cricketers on the CrickAuction platform.
            </p>
          </div>

          <div className="space-y-10 sm:space-y-12 text-sm sm:text-base leading-relaxed text-gray-300">
            {/* Section 1 */}
            <section id="fan-disclaimer" className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">1.</span> Fan-Made Independent Project
              </h2>
              <p>
                <strong>CrickAuction</strong> (accessible at <code className="bg-white/10 px-1 py-0.5 rounded text-white text-xs">crickauction.in</code>) is an independent, non-commercial, fan-made cricket auction strategy simulator.
              </p>
              <p>
                CrickAuction is <strong>not affiliated with, associated with, authorized by, sponsored by, or endorsed by</strong> the Board of Control for Cricket in India (BCCI), the Indian Premier League (IPL), the International Cricket Council (ICC), or any official franchise, team owner, or tournament organizer.
              </p>
            </section>

            {/* Section 2 */}
            <section id="nominative-fair-use" className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">2.</span> Purpose & Nominative Fair Use
              </h2>
              <p>
                Photographic portraits displayed across the simulator are included strictly for the informational purpose of identifying real-world cricketers participating in fantasy auction lots.
              </p>
              <p>
                All photographs remain the property of their respective creators, photographers, and rights holders. Use of these portraits constitutes non-commercial, descriptive <em>nominative fair use</em>. Images may be cropped or scaled into standardized UI card frames to maintain visual legibility on mobile and desktop devices.
              </p>
            </section>

            {/* Section 3 */}
            <section id="wikimedia-commons" className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">3.</span> Creative Commons & Wikimedia Attribution
              </h2>
              <p>
                Numerous player portraits are sourced from <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4 hover:text-slate-300">Wikimedia Commons</a> and Wikipedia under their respective open-access licenses, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-sm">
                <li><strong className="text-white">Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong></li>
                <li><strong className="text-white">Creative Commons Attribution 3.0 Unported (CC BY 3.0)</strong></li>
                <li><strong className="text-white">Creative Commons CC0 1.0 Universal Public Domain Dedication</strong></li>
                <li><strong className="text-white">Government of India Open Data / PMO Public Release (GODL-India)</strong></li>
              </ul>
              <p className="text-sm">
                Each Wikimedia-hosted photograph is attributed to its respective author as cataloged on Wikimedia Commons. In accordance with license requirements, images are provided without alteration to their original legal terms.
              </p>
            </section>

            {/* Section 4 */}
            <section id="public-roster" className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">4.</span> Public Franchise & Editorial Headshots
              </h2>
              <p>
                Certain headshots identify cricketers through publicly accessible media assets published on official team rosters and editorial cricket archives.
              </p>
              <p className="text-sm">
                These reference portraits are displayed solely for genuine player identification. Portrait uniforms or jersey trims may reflect previous tournament editions and do not imply current sponsorship or contractual affiliation.
              </p>
            </section>

            {/* Section 5 */}
            <section id="fallback-initials" className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">5.</span> Dynamic Client-Side Initials Fallback
              </h2>
              <p>
                To prevent mismatched, unauthorized, or inaccurate photos, CrickAuction does not use unverified automated web scrapers.
              </p>
              <p>
                If a photograph is unavailable, encounters a network error, or has been removed, the platform renders a clean, local vector badge displaying the cricketer&apos;s initials. This fallback executes purely in the browser with zero external server dependencies.
              </p>
            </section>

            {/* Section 6 */}
            <section id="takedown-procedure" className="space-y-3 border border-white/10 rounded-xl p-5 sm:p-6 bg-white/[0.02]">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                <span>6. Notice & Takedown Procedure</span>
              </h2>
              <p className="text-sm">
                CrickAuction takes intellectual property rights seriously and operates in full compliance with applicable notice-and-takedown guidelines.
              </p>
              <p className="text-sm">
                If you are a photographer, creator, agency, or player representative and believe that any portrait used on CrickAuction infringes your copyright or requires updated attribution, please contact us with:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-400">
                <li>The name of the cricketer and URL where the image appears on CrickAuction.</li>
                <li>Proof of copyright ownership or authorized representation.</li>
                <li>Your preferred action: updated credit line, replacement with an alternate image, or complete removal.</li>
              </ol>
              <div className="pt-2">
                <a
                  href="mailto:shaurya01836@gmail.com?subject=Photo%20Credit%20/%20Takedown%20Inquiry"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs tracking-wider uppercase transition-colors"
                >
                  <Mail size={14} />
                  <span>Contact: shaurya01836@gmail.com</span>
                </a>
              </div>
              <p className="text-xs text-gray-500 pt-1">
                All legitimate takedown or credit requests are acknowledged and resolved promptly, typically within 24 to 48 hours.
              </p>
            </section>

            {/* Section 7 */}
            <section id="source-directory" className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-slate-400 font-pixel">7.</span> Summary of Sources & Licenses
              </h2>
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                  <thead className="bg-white/5 border-b border-white/10 text-white uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Primary Source</th>
                      <th className="py-3 px-4">License / Basis</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Creative Commons Portraits</td>
                      <td className="py-3 px-4">Wikimedia Commons / Wikipedia</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono text-xs">CC BY-SA 4.0 / CC BY 3.0 / CC0</td>
                      <td className="py-3 px-4 text-gray-400">Open-access contributor photography</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Public Reference Headshots</td>
                      <td className="py-3 px-4">Public franchise & tournament rosters</td>
                      <td className="py-3 px-4 text-amber-400 font-mono text-xs">Nominative Fair Use</td>
                      <td className="py-3 px-4 text-gray-400">Descriptive identification for mock lots</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Missing Image Fallback</td>
                      <td className="py-3 px-4">Client-Side Procedural Vector</td>
                      <td className="py-3 px-4 text-sky-400 font-mono text-xs">Proprietary (In-Code)</td>
                      <td className="py-3 px-4 text-gray-400">Dynamic player initials; 0 external calls</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PhotoCredits;

