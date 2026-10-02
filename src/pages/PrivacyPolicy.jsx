import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PrivacyPolicy = () => {
  useDocumentTitle('Privacy Policy | CrickAuction', 'Privacy Policy for CrickAuction.');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState('info-collect');

  const sections = [
    { id: 'info-collect', label: '1. Information we collect' },
    { id: 'how-use', label: '2. How we use information' },
    { id: 'auth', label: '3. Authentication' },
    { id: 'auction-data', label: '4. Auction and room data' },
    { id: 'analytics', label: '5. Analytics and diagnostics' },
    { id: 'storage', label: '6. Data storage and retention' },
    { id: 'third-party', label: '7. Third-party services' },
    { id: 'choices', label: '8. Your choices' },
    { id: 'children', label: '9. Children\'s privacy' },
    { id: 'changes', label: '10. Changes to this policy' },
    { id: 'contact', label: '11. Contact' },
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
          <span className="text-white">Privacy Policy</span>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: October 2, 2026</p>
            <p className="text-base text-gray-300 leading-relaxed">
              This policy explains what information CrickAuction collects, how it is used, and which third-party services are involved. We aim to collect only the minimal data necessary to provide a real-time multiplayer auction experience.
            </p>
          </div>

          <div className="space-y-12">
            <section id="info-collect" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">1. Information we collect</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>When you use CrickAuction, we collect the following information:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li><strong className="text-gray-200">Account information:</strong> If you sign in with Google, we collect your display name, email address, and profile picture URL.</li>
                  <li><strong className="text-gray-200">Auction data:</strong> We store the state of the auction rooms you create or join, including team configurations, bids, and chat messages.</li>
                  <li><strong className="text-gray-200">Device information:</strong> We may collect non-personally identifiable information such as browser type, screen resolution, and operating system for diagnostic purposes.</li>
                </ul>
              </div>
            </section>

            <section id="how-use" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">2. How we use information</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>Synchronize state across connected clients in real-time.</li>
                  <li>Maintain user sessions and authentication.</li>
                  <li>Identify and troubleshoot bugs or performance issues.</li>
                  <li>Improve the overall user experience and stability of the platform.</li>
                </ul>
              </div>
            </section>

            <section id="auth" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">3. Authentication</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We use Firebase Authentication (via Google OAuth 2.0) to handle user sign-in. CrickAuction never receives, processes, or stores your Google password. Your authentication token is managed entirely by Firebase and your browser.
                </p>
              </div>
            </section>

            <section id="auction-data" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">4. Auction and room data</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  Auction rooms, bids, rosters, and associated configurations are stored in the Firebase Realtime Database. This data is retained to allow users to resume interrupted auctions and review past auction results. We do not use this data for any marketing or advertising purposes.
                </p>
              </div>
            </section>

            <section id="analytics" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">5. Analytics and diagnostics</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We may use privacy-respecting analytics tools to understand how the platform is used. These tools do not track you across other websites and do not sell your data. We rely on aggregate telemetry to identify which features are most popular and where errors occur.
                </p>
              </div>
            </section>

            <section id="storage" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">6. Data storage and retention</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  Your data is stored securely on Google Cloud Platform via Firebase services. We retain your account data and auction history for as long as your account is active. Non-active auction rooms may be periodically purged to minimize our storage footprint.
                </p>
                <p>
                  Certain application preferences, such as volume level and active room IDs, are stored locally on your device using <code>localStorage</code>. You can clear these at any time via your browser settings.
                </p>
              </div>
            </section>

            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">7. Third-party services</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>CrickAuction integrates with the following third-party services:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li><strong>Firebase (Google):</strong> For authentication, real-time database, and hosting.</li>
                </ul>
                <p>
                  These services have their own privacy policies governing how they handle data processed on our behalf.
                </p>
              </div>
            </section>

            <section id="choices" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">8. Your choices</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  You have the right to request the deletion of your account and associated data. If you wish to have your data removed from our systems, please contact us. You can also revoke CrickAuction's access to your Google account via your Google Account permissions dashboard.
                </p>
              </div>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">9. Children's privacy</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  CrickAuction is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information.
                </p>
              </div>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">10. Changes to this policy</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date at the top.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-4">11. Contact</h2>
              <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                <p>
                  If you have questions about this Privacy Policy or how we handle your data, please contact the engineering team at:
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

export default PrivacyPolicy;
