import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TermsConditions = () => {
  useDocumentTitle('Terms of Service | CrickAuction', 'Terms of Service for CrickAuction.');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState('about');

  const sections = [
    { id: 'about', label: '1. About CrickAuction' },
    { id: 'acceptance', label: '2. Acceptance of these terms' },
    { id: 'virtual', label: '3. Virtual currency and mechanics' },
    { id: 'conduct', label: '4. User conduct' },
    { id: 'affiliation', label: '5. Fan-made / non-affiliation notice' },
    { id: 'ip', label: '6. Intellectual property' },
    { id: 'third-party', label: '7. Third-party services' },
    { id: 'availability', label: '8. Availability of the service' },
    { id: 'changes-service', label: '9. Changes to the service' },
    { id: 'liability', label: '10. Limitation of liability' },
    { id: 'changes-terms', label: '11. Changes to these terms' },
    { id: 'contact', label: '12. Contact' },
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
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-white/20 selection:text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-gray-500">Legal</span>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-white">Terms of Service</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12 lg:gap-24 items-start w-full flex-1">
        {/* Left TOC - sticky on desktop, hidden on mobile */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-28">
          <h3 className="text-white font-semibold text-sm mb-4">On this page</h3>
          <nav className="flex flex-col gap-2.5 border-l border-white/10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-sm text-left pl-4 -ml-[1px] border-l ${activeSection === s.id ? 'border-[#ff5500] text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/30'} transition-colors`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl w-full pb-20">
          <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: October 2, 2026</p>
            <p className="text-base text-gray-300 leading-relaxed">
              These Terms of Service govern your use of CrickAuction. By accessing or using the platform, you agree to be bound by these terms.
            </p>
          </div>

          <div className="space-y-12">
            <section id="about" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">1. About CrickAuction</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  CrickAuction is a real-time multiplayer web application that simulates the Indian Premier League (IPL) mega auction experience. It provides users with a virtual environment to manage a purse, bid on players, and construct simulated cricket squads.
                </p>
              </div>
            </section>

            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">2. Acceptance of these terms</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  By creating an account, hosting an auction room, or joining a room via a lobby code, you confirm that you have read, understood, and agreed to these Terms of Service. If you do not agree, you must not use the service.
                </p>
              </div>
            </section>

            <section id="virtual" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">3. Virtual currency and game mechanics</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  All monetary values, player prices, and team budgets (such as ₹120 Crore) represented within CrickAuction are <strong>strictly virtual points</strong> used solely for the purpose of the simulation game.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>No real money is deposited, wagered, earned, or paid out under any circumstances.</li>
                  <li>Virtual budgets have no real-world value and cannot be exchanged, transferred, or redeemed.</li>
                  <li>CrickAuction is not a gambling, betting, or fantasy sports money platform.</li>
                </ul>
              </div>
            </section>

            <section id="conduct" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">4. User conduct</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>To ensure a stable and fair environment for all users, you agree not to:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>Use automated scripts, bots, or browser extensions to manipulate the auction timer or bidding mechanisms.</li>
                  <li>Attempt to disrupt, overload, or reverse-engineer the underlying real-time database or API endpoints.</li>
                  <li>Use offensive, hateful, or abusive language in custom usernames or chat messages.</li>
                  <li>Impersonate other users or platform administrators.</li>
                </ul>
                <p>We reserve the right to ban accounts or terminate active auction rooms that violate these rules.</p>
              </div>
            </section>

            <section id="affiliation" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">5. Fan-made / non-affiliation notice</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  CrickAuction is an unofficial, non-commercial fan project created for entertainment and strategy practice. 
                </p>
                <p>
                  We are <strong>not affiliated with, endorsed by, sponsored by, or associated with</strong> the Board of Control for Cricket in India (BCCI), the Indian Premier League (IPL), or any official franchise team.
                </p>
              </div>
            </section>

            <section id="ip" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual property</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  All team names, player names, logos, and trademarks mentioned or displayed in the simulation belong to their respective owners. Their use within this platform falls under fair use for transformative, non-commercial entertainment purposes.
                </p>
                <p>
                  The underlying codebase, UI design, and specific auction algorithms of CrickAuction are the intellectual property of the developers, unless otherwise open-sourced.
                </p>
              </div>
            </section>

            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">7. Third-party services</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  CrickAuction relies on third-party infrastructure (such as Google Firebase) for hosting, database management, and authentication. Your use of the service is also subject to the terms and acceptable use policies of these providers.
                </p>
              </div>
            </section>

            <section id="availability" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">8. Availability of the service</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We strive to maintain high uptime, especially during active sessions. However, CrickAuction is provided "as is" and "as available." We do not guarantee that the service will be uninterrupted, error-free, or completely secure. Scheduled maintenance or unexpected outages may occur.
                </p>
              </div>
            </section>

            <section id="changes-service" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">9. Changes to the service</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of the service, including player databases, auction rules, or game modes, at any time without prior notice.
                </p>
              </div>
            </section>

            <section id="liability" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of liability</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  To the maximum extent permitted by law, CrickAuction and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of or inability to use the platform. This includes, but is not limited to, loss of data due to interrupted auction rooms or server failures.
                </p>
              </div>
            </section>

            <section id="changes-terms" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">11. Changes to these terms</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We may update these Terms of Service periodically. When we do, we will revise the "Last updated" date at the top of this page. Continued use of the platform after changes implies your acceptance of the updated terms.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  If you have questions or concerns regarding these Terms of Service, please contact us at:
                </p>
                <p>
                  <a href="mailto:shaurya01836@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">shaurya01836@gmail.com</a>
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TermsConditions;
