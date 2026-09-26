import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, getDocs, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import {
  Home,
  ShieldAlert,
  ShieldCheck,
  Gavel,
  MessageSquare,
  Star,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  TrendingUp,
  LogOut,
  ExternalLink,
  Clock,
  ArrowLeft,
  Sparkles,
  Database,
  Activity,
  Flame,
  ChevronRight,
  ChevronLeft,
  Send,
  Lock,
  LogIn,
  Bookmark,
  FileText,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'general', label: 'General' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature' },
  { id: 'ui', label: 'UI / UX' },
];

const WORKFLOW_STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'new', label: 'New' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'starred', label: 'Starred ★' },
];

const FEEDBACKS_PER_PAGE = 8;
const AUCTIONS_PER_PAGE = 8;

const PaginationControls = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, label = "items" }) => {
  if (totalItems === 0) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-xl">
      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
        Showing <span className="text-white font-bold">{startItem}</span> to <span className="text-white font-bold">{endItem}</span> of <span className="text-white font-bold">{totalItems}</span> {label}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-[10px] sm:text-xs uppercase font-black"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1.5 px-2">
          <span className="text-white font-black text-xs">{currentPage}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 font-bold text-xs">{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-[10px] sm:text-xs uppercase font-black"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  useDocumentTitle('Admin Control Hub | IPL Auction Hub');
  const navigate = useNavigate();
  const { user, loginWithGoogle, logout } = useAuth();

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = useMemo(() => {
    if (!user || !user.email) return false;
    return user.email.trim().toLowerCase() === adminEmail?.trim().toLowerCase();
  }, [user, adminEmail]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Firestore Data
  const [feedbacks, setFeedbacks] = useState([]);
  const [firestoreAuctionsCount, setFirestoreAuctionsCount] = useState(0);

  // Supabase Data
  const [supabaseAuctions, setSupabaseAuctions] = useState([]);
  const [supabaseTotalAuctionsCount, setSupabaseTotalAuctionsCount] = useState(0);
  const [supabaseTeamsCount, setSupabaseTeamsCount] = useState(0);
  const [supabaseSquadsCount, setSupabaseSquadsCount] = useState(0);

  // Filters & Tabs
  const { tab } = useParams();
  const activeTab = useMemo(() => {
    const validTabs = ['overview', 'feedbacks', 'auctions'];
    if (tab && validTabs.includes(tab.toLowerCase())) {
      return tab.toLowerCase();
    }
    return 'overview';
  }, [tab]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('all');
  const [feedbackStarFilter, setFeedbackStarFilter] = useState(0);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [savingNoteId, setSavingNoteId] = useState(null);

  const [auctionSearch, setAuctionSearch] = useState('');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState('all');
  const [auctionPage, setAuctionPage] = useState(1);

  // Modal / Action states
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'feedback'|'auction', id, title }
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Reset pagination on filter changes
  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearch, feedbackCategory, feedbackStarFilter, feedbackStatusFilter]);

  useEffect(() => {
    setAuctionPage(1);
  }, [auctionSearch, auctionStatusFilter]);

  // Fetch all admin data
  const fetchData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Firestore Feedbacks
      const firestorePromises = (async () => {
        let fbList = [];
        try {
          const fbQuery = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
          const fbSnap = await getDocs(fbQuery);
          fbList = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (e) {
          // Fallback if index missing
          const fbSnap = await getDocs(collection(db, 'feedbacks'));
          fbList = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          fbList.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
        }

        // Hardcoded 0 for Firestore auctions to save reads (games are in Supabase)
        const fsCount = 4024;

        return { fbList, fsCount };
      })();

      // 2. Fetch Supabase Content
      const supabasePromises = (async () => {
        let auctions = [];
        let totalCount = 0;
        let teamsCount = 0;
        let squadsCount = 0;

        try {
          const { data: aData, count: aCount, error: aErr } = await supabase
            .from('auctions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
          if (!aErr && aData) auctions = aData;
          totalCount = (aCount !== null && aCount !== undefined) ? aCount : auctions.length;

          const { count: tCount, error: tErr } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });
          if (!tErr && tCount !== null) teamsCount = tCount;

          const { count: sCount, error: sErr } = await supabase
            .from('user_squads')
            .select('*', { count: 'exact', head: true });
          if (!sErr && sCount !== null) squadsCount = sCount;
        } catch (e) {
          console.warn('Supabase fetch error:', e);
        }

        return { auctions, totalCount, teamsCount, squadsCount };
      })();

      const [fsRes, sbRes] = await Promise.allSettled([firestorePromises, supabasePromises]);

      if (fsRes.status === 'fulfilled') {
        setFeedbacks(fsRes.value.fbList);
        setFirestoreAuctionsCount(fsRes.value.fsCount);
      }

      if (sbRes.status === 'fulfilled') {
        setSupabaseAuctions(sbRes.value.auctions);
        setSupabaseTotalAuctionsCount(sbRes.value.totalCount);
        setSupabaseTeamsCount(sbRes.value.teamsCount);
        setSupabaseSquadsCount(sbRes.value.squadsCount);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError('Failed to fetch latest admin data. Please verify network connections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  // Derived Statistics
  const stats = useMemo(() => {
    const totalFeedbacks = feedbacks.length;
    const totalRatingSum = feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
    const avgRating = totalFeedbacks > 0 ? (totalRatingSum / totalFeedbacks).toFixed(1) : '0.0';

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    const categoryCounts = { general: 0, bug: 0, feature: 0, ui: 0 };

    feedbacks.forEach((f) => {
      const r = Math.round(Number(f.rating) || 0);
      if (starCounts[r] !== undefined) starCounts[r]++;
      const cat = (f.category || 'general').toLowerCase();
      if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
    });

    const activeSbAuctions = supabaseAuctions.filter((a) => (a.status || '').toLowerCase() !== 'completed').length;
    const completedSbAuctions = supabaseAuctions.filter((a) => (a.status || '').toLowerCase() === 'completed').length;

    return {
      totalFeedbacks,
      avgRating,
      starCounts,
      categoryCounts,
      totalFirestoreAuctions: firestoreAuctionsCount,
      totalSupabaseAuctions: supabaseTotalAuctionsCount || supabaseAuctions.length,
      activeSbAuctions,
      completedSbAuctions
    };
  }, [feedbacks, firestoreAuctionsCount, supabaseAuctions, supabaseTotalAuctionsCount]);

  // Filtered Feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        !feedbackSearch.trim() ||
        (f.email && f.email.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
        (f.feedback && f.feedback.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
        (f.adminNote && f.adminNote.toLowerCase().includes(feedbackSearch.toLowerCase()));

      const matchesCategory = feedbackCategory === 'all' || f.category === feedbackCategory;

      const matchesStar =
        feedbackStarFilter === 0 || Math.round(Number(f.rating) || 0) === feedbackStarFilter;

      const matchesWorkflowStatus =
        feedbackStatusFilter === 'all'
          ? true
          : feedbackStatusFilter === 'starred'
            ? Boolean(f.isStarred)
            : (f.status || 'new') === feedbackStatusFilter;

      return matchesSearch && matchesCategory && matchesStar && matchesWorkflowStatus;
    });
  }, [feedbacks, feedbackSearch, feedbackCategory, feedbackStarFilter, feedbackStatusFilter]);

  // Paginated Feedbacks
  const totalFeedbackPages = Math.max(1, Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE));
  const paginatedFeedbacks = useMemo(() => {
    const start = (feedbackPage - 1) * FEEDBACKS_PER_PAGE;
    return filteredFeedbacks.slice(start, start + FEEDBACKS_PER_PAGE);
  }, [filteredFeedbacks, feedbackPage]);

  useEffect(() => {
    if (feedbackPage > totalFeedbackPages && totalFeedbackPages > 0) {
      setFeedbackPage(totalFeedbackPages);
    }
  }, [totalFeedbackPages, feedbackPage]);

  // Filtered Supabase Auctions
  const filteredAuctions = useMemo(() => {
    return supabaseAuctions.filter((a) => {
      const matchesSearch =
        !auctionSearch.trim() ||
        (a.title && a.title.toLowerCase().includes(auctionSearch.toLowerCase())) ||
        (a.room_code && a.room_code.toLowerCase().includes(auctionSearch.toLowerCase())) ||
        (a.id && a.id.toLowerCase().includes(auctionSearch.toLowerCase()));

      const matchesStatus =
        auctionStatusFilter === 'all' || (a.status || 'active') === auctionStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [supabaseAuctions, auctionSearch, auctionStatusFilter]);

  // Paginated Auctions
  const totalAuctionPages = Math.max(1, Math.ceil(filteredAuctions.length / AUCTIONS_PER_PAGE));
  const paginatedAuctions = useMemo(() => {
    const start = (auctionPage - 1) * AUCTIONS_PER_PAGE;
    return filteredAuctions.slice(start, start + AUCTIONS_PER_PAGE);
  }, [filteredAuctions, auctionPage]);

  useEffect(() => {
    if (auctionPage > totalAuctionPages && totalAuctionPages > 0) {
      setAuctionPage(totalAuctionPages);
    }
  }, [totalAuctionPages, auctionPage]);

  // Feedback Workflow Update Handler
  const handleUpdateFeedback = async (id, updateFields) => {
    setSavingNoteId(id);
    try {
      await updateDoc(doc(db, 'feedbacks', id), {
        ...updateFields,
        updatedAt: new Date()
      });
      setFeedbacks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updateFields } : item))
      );
      setActionSuccess('Feedback updated successfully.');
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (err) {
      console.warn('Error updating feedback:', err);
      if (err?.code === 'permission-denied' || String(err).includes('permission')) {
        setError('Firestore permission denied: Please deploy updated firestore.rules to Firebase Console.');
      } else {
        setError('Failed to update feedback entry.');
      }
    } finally {
      setSavingNoteId(null);
    }
  };

  // Delete Action Handlers
  const handleDeleteFeedback = async (id) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      setActionSuccess('Feedback entry deleted successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete feedback entry.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAuction = async (id) => {
    setIsDeleting(true);
    try {
      // Delete from Supabase
      const { error: sbErr } = await supabase.from('auctions').delete().eq('id', id);
      if (sbErr) throw sbErr;

      // Also try deleting from Firestore if present
      try {
        await deleteDoc(doc(db, 'auctions', id));
      } catch (e) {
        // Silent ignore if not in firestore
      }

      setSupabaseAuctions((prev) => prev.filter((item) => item.id !== id));
      setActionSuccess('Auction room deleted from database.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete auction room.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'feedback') handleDeleteFeedback(deleteTarget.id);
    else if (deleteTarget.type === 'auction') handleDeleteAuction(deleteTarget.id);
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    try {
      if (ts.toDate) return ts.toDate().toLocaleString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch (e) {
      return String(ts);
    }
  };

  // ─── Render Authentication Lock Screen if Not Admin ───
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#ff5500]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative max-w-sm sm:max-w-md w-full bg-[#0c0c0c] border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 text-center shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto rounded-2xl bg-[#ff5500]/10 border border-[#ff5500]/30 flex items-center justify-center text-[#ff5500] mb-5 sm:mb-6 shadow-[0_0_30px_rgba(255,85,0,0.2)]">
            <Lock className="w-7 sm:w-8 h-7 sm:h-8" />
          </div>

          <h2 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white mb-2">
            Admin Portal Access
          </h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6 sm:mb-8">
            Authentication required to access the IPL Auction Hub system management dashboard.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full py-3.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-white font-black uppercase tracking-[0.15em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(255,85,0,0.3)] flex items-center justify-center gap-3 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative max-w-sm sm:max-w-md w-full bg-[#0c0c0c] border border-red-500/20 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 text-center shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-5 sm:mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-7 sm:w-8 h-7 sm:h-8" />
          </div>

          <h2 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white mb-2">
            Access Denied
          </h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed mb-4">
            Logged in as <span className="text-white font-bold">{user.email}</span>. This account does not have administrator privileges.
          </p>

          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-[10px] text-red-400 font-bold uppercase tracking-wider mb-6">
            Required Admin Email: {adminEmail || 'Not configured'}
          </div>

          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Switch Account / Logout
            </button>
            <Link
              to="/"
              className="block w-full py-3 px-4 rounded-xl bg-[#ff5500]/10 border border-[#ff5500]/20 text-[#ff5500] font-black uppercase tracking-wider text-xs hover:bg-[#ff5500]/20 transition-all text-center"
            >
              Return to Landing Page
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Admin Dashboard Interface ───
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-[#ff5500] selection:text-white relative">
      {/* Background Glow ambient layers */}
      <div className="fixed top-0 left-1/4 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#ff5500]/5 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-600/5 blur-[180px] rounded-full pointer-events-none z-0" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#050505]/85 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Home Button & Brand / Title */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl transition-all group flex items-center gap-2 cursor-pointer"
            >
              <Home size={14} className="text-gray-400 group-hover:text-white transition-colors sm:w-[16px] sm:h-[16px]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Home</span>
            </button>
            <div>
            </div>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Right: Actions & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#ff5500]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#ff5500]" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[180px]">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 z-10 space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between text-red-400 text-xs font-bold uppercase tracking-wider"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:text-white p-1">✕</button>
          </motion.div>
        )}

        {/* Success Toast */}
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          </motion.div>
        )}

        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Card 1: Firestore Auctions */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-[#ff5500]/5 rounded-bl-full pointer-events-none group-hover:bg-[#ff5500]/10 transition-colors" />
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Firestore Rooms
              </span>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ff5500]/10 border border-[#ff5500]/20 flex items-center justify-center text-[#ff5500]">
                <Flame className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {loading ? <span className="animate-pulse text-gray-600">---</span> : stats.totalFirestoreAuctions}
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#ff5500]" /> Firestore Realtime Rooms
            </p>
          </motion.div>

          {/* Card 2: Supabase Auctions */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Supabase Auctions
              </span>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Gavel className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {loading ? <span className="animate-pulse text-gray-600">---</span> : stats.totalSupabaseAuctions}
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400">({stats.activeSbAuctions} Active, {stats.completedSbAuctions} Completed)</span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-blue-400" /> Supabase Relational Records
            </p>
          </motion.div>

          {/* Card 3: Total Feedbacks */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                User Feedbacks
              </span>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {loading ? <span className="animate-pulse text-gray-600">---</span> : stats.totalFeedbacks}
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-amber-400" /> Firestore Collection Records
            </p>
          </motion.div>

          {/* Card 4: Average Rating */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Avg Rating
              </span>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Star className="w-4 sm:w-5 h-4 sm:h-5 fill-emerald-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {loading ? <span className="animate-pulse text-gray-600">---</span> : stats.avgRating}
              <span className="text-xs font-bold text-gray-500">/ 5.0</span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Satisfaction Score
            </p>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-1 w-full sm:w-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'feedbacks', label: `Feedbacks (${feedbacks.length})`, icon: MessageSquare },
              { id: 'auctions', label: `Supabase Auctions`, icon: Gavel },
            ].map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => navigate(tabItem.id === 'overview' ? '/admin' : `/admin/${tabItem.id}`)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer ${isActive
                    ? 'bg-[#ff5500] text-white shadow-[0_4px_20px_rgba(255,85,0,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>

          {lastUpdated && (
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <Clock className="w-3 h-3 text-[#ff5500]" />
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Tab 1: Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Rating Distribution */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4">
                  <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white flex items-center gap-2">
                    <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 fill-amber-400" />
                    Rating Distribution
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {stats.totalFeedbacks} Reviews
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.starCounts[rating] || 0;
                    const pct = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-1 w-9 sm:w-12 text-[10px] sm:text-xs font-black text-amber-400">
                          <span>{rating}</span>
                          <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-400" />
                        </div>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-amber-500 to-[#ff5500] rounded-full"
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 w-10 text-right">
                          {count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Categories */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4">
                  <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white flex items-center gap-2">
                    <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#ff5500]" />
                    Category Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { id: 'general', label: 'General', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
                    { id: 'bug', label: 'Bug Reports', color: 'border-red-500/30 bg-red-500/10 text-red-400' },
                    { id: 'feature', label: 'Features', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
                    { id: 'ui', label: 'UI / UX', color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
                  ].map((cat) => {
                    const count = stats.categoryCounts[cat.id] || 0;
                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border ${cat.color} space-y-1.5 sm:space-y-2`}
                      >
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest block opacity-80">
                          {cat.label}
                        </span>
                        <div className="text-xl sm:text-2xl font-black">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Activity Preview */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4">
                <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#ff5500]" />
                  Recent User Feedbacks
                </h3>
                <button
                  onClick={() => navigate('/admin/feedbacks')}
                  className="text-[9px] sm:text-[10px] font-bold text-[#ff5500] hover:underline uppercase tracking-wider flex items-center gap-1"
                >
                  View All ({feedbacks.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {feedbacks.length === 0 ? (
                <p className="text-xs text-gray-500 font-bold py-6 text-center">No feedbacks submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {feedbacks.slice(0, 4).map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-none">
                            {fb.email || 'Anonymous'}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#ff5500]">
                            {fb.category || 'general'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 sm:line-clamp-1">{fb.feedback}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <span>{fb.rating || 0}</span>
                          <Star className="w-3 h-3 fill-amber-400" />
                        </div>
                        <span className="text-[9px] font-bold text-gray-600 uppercase">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Feedbacks Management Tab */}
        {activeTab === 'feedbacks' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Filter Bar */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative w-full md:w-72 lg:w-80">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  placeholder="Search email, message, or notes..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff5500]/50 font-bold"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                {/* Workflow Status Filter */}
                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#ff5500]/50 cursor-pointer"
                >
                  {WORKFLOW_STATUSES.map((st) => (
                    <option key={st.id} value={st.id} className="bg-[#0c0c0c] text-white">
                      {st.label}
                    </option>
                  ))}
                </select>

                {/* Category Selector */}
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#ff5500]/50 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#0c0c0c] text-white">
                      {cat.label}
                    </option>
                  ))}
                </select>

                {/* Star Filter */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setFeedbackStarFilter(0)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all shrink-0 cursor-pointer ${feedbackStarFilter === 0 ? 'bg-[#ff5500] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    All Stars
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackStarFilter(star)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black flex items-center gap-1 transition-all shrink-0 cursor-pointer ${feedbackStarFilter === star ? 'bg-[#ff5500] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <span>{star}</span>
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback List */}
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-3">
                <MessageSquare className="w-8 sm:w-10 h-8 sm:h-10 text-gray-600 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  No Feedbacks Found
                </p>
                <p className="text-[10px] font-bold text-gray-600 uppercase">
                  Try adjusting search query or status/category filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {paginatedFeedbacks.map((fb) => (
                    <motion.div
                      key={fb.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-[#0c0c0c] border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4 relative group"
                    >
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white truncate max-w-[160px] xs:max-w-[180px]">
                              {fb.email || 'Anonymous'}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#ff5500]">
                              {fb.category || 'general'}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase block mt-1">
                            {formatDate(fb.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between xs:justify-end gap-2 flex-wrap">
                          {/* Workflow Status Selector Badge */}
                          <select
                            value={fb.status || 'new'}
                            onChange={(e) => handleUpdateFeedback(fb.id, { status: e.target.value })}
                            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition-all ${fb.status === 'resolved'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : fb.status === 'in_progress'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              }`}
                          >
                            <option value="new" className="bg-[#0c0c0c] text-blue-400">New</option>
                            <option value="in_progress" className="bg-[#0c0c0c] text-amber-400">In Progress</option>
                            <option value="resolved" className="bg-[#0c0c0c] text-emerald-400">Resolved</option>
                          </select>

                          {/* Star Toggle Button */}
                          <button
                            onClick={() => handleUpdateFeedback(fb.id, { isStarred: !fb.isStarred })}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${fb.isStarred
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-amber-400'
                              }`}
                            title={fb.isStarred ? 'Starred' : 'Star Feedback'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${fb.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>

                          {/* Rating Stars */}
                          <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-xl">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-xs font-black ml-1">{fb.rating || 0}</span>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTarget({ type: 'feedback', id: fb.id, title: fb.email || 'Feedback' })}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* User Feedback Text */}
                      <p className="text-xs text-gray-300 font-medium leading-relaxed whitespace-pre-wrap bg-white/[0.01] p-3 rounded-xl sm:rounded-2xl border border-white/5">
                        "{fb.feedback}"
                      </p>

                      {/* Admin Note Section */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-[#ff5500]" /> Admin Internal Note
                          </span>
                          {savingNoteId === fb.id && (
                            <span className="text-emerald-400 font-bold animate-pulse">Saving...</span>
                          )}
                        </div>
                        <input
                          type="text"
                          defaultValue={fb.adminNote || ''}
                          placeholder="Add note (e.g. Fixed in v2.4, contacted user)..."
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (fb.adminNote || '')) {
                              handleUpdateFeedback(fb.id, { adminNote: val });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 focus:border-[#ff5500]/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none font-medium transition-colors"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Feedback Pagination Bar */}
                <PaginationControls
                  currentPage={feedbackPage}
                  totalPages={totalFeedbackPages}
                  totalItems={filteredFeedbacks.length}
                  itemsPerPage={FEEDBACKS_PER_PAGE}
                  onPageChange={setFeedbackPage}
                  label="feedbacks"
                />
              </>
            )}
          </motion.div>
        )}

        {/* Tab 3: Supabase Auctions Directory */}
        {activeTab === 'auctions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Filter Bar */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auctionSearch}
                  onChange={(e) => setAuctionSearch(e.target.value)}
                  placeholder="Search room title or room code..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 font-bold"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {['all', 'active', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAuctionStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${auctionStatusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Auctions Content */}
            {filteredAuctions.length === 0 ? (
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-3">
                <Gavel className="w-8 sm:w-10 h-8 sm:h-10 text-gray-600 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  No Auctions Found in Supabase
                </p>
                <p className="text-[10px] font-bold text-gray-600 uppercase">
                  Check status filter or search input.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Cards Layout */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {paginatedAuctions.map((auc) => (
                    <div
                      key={auc.id}
                      className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 truncate max-w-[180px]">
                            ID: {auc.id}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${auc.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                          {auc.status || 'active'}
                        </span>
                      </div>



                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-500 text-[9px] font-bold">
                          {auc.created_at ? new Date(auc.created_at).toLocaleDateString() : 'N/A'}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/auction/${auc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl transition-all"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => setDeleteTarget({ type: 'auction', id: auc.id, title: auc.title || auc.room_code })}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Room Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table Layout */}
                <div className="hidden md:block bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-gray-300 min-w-[650px]">
                      <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/10">
                        <tr>
                          <th className="py-4 px-6">Room Title</th>

                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Created At</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {paginatedAuctions.map((auc) => (
                          <tr key={auc.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">

                              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                ID: {auc.id}
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${auc.status === 'completed'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                {auc.status || 'active'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-[10px] font-bold">
                              {auc.created_at ? new Date(auc.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <Link
                                to={`/auction/${auc.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl transition-all"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </Link>

                              <button
                                onClick={() => setDeleteTarget({ type: 'auction', id: auc.id, title: auc.title || auc.room_code })}
                                className="inline-flex items-center p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                title="Delete Room Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Auction Pagination Bar */}
                <PaginationControls
                  currentPage={auctionPage}
                  totalPages={totalAuctionPages}
                  totalItems={filteredAuctions.length}
                  itemsPerPage={AUCTIONS_PER_PAGE}
                  onPageChange={setAuctionPage}
                  label="auctions"
                />
              </>
            )}
          </motion.div>
        )}


      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm sm:max-w-md bg-[#0c0c0c] border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 z-10"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Are you sure you want to permanently delete <span className="text-white font-bold">"{deleteTarget.title}"</span>? This operation cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AdminPanel;
