import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, getDocs, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import {
  Home,
  ShieldAlert,
  Gavel,
  MessageSquare,
  Star,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  Clock,
  ArrowLeft,
  Sparkles,
  Database,
  Activity,
  Flame,
  Lock,
  LogIn,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { IPL_PLAYERS } from '../data/players';

// Admin Components
import OverviewTab from '../components/admin/OverviewTab';
import FeedbacksTab from '../components/admin/FeedbacksTab';
import AuctionsTab from '../components/admin/AuctionsTab';
import PlayersTab from '../components/admin/PlayersTab';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal';
import PlayerDetailModal from '../components/admin/PlayerDetailModal';

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

const getRatingBadgeStyle = (rating = 0) => {
  if (rating >= 75) {
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]';
  }
  return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
};

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case 'Batter':
    case 'Batsman':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Bowler':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'All-Rounder':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'Wicket-Keeper':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const getFeedbackCategoryStyle = (category = 'general') => {
  switch (category?.toLowerCase()) {
    case 'bug':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400',
        label: 'Bug Report'
      };
    case 'feature':
      return {
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        dot: 'bg-sky-400',
        label: 'Feature'
      };
    case 'ui':
      return {
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        dot: 'bg-purple-400',
        label: 'UI / UX'
      };
    default:
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
        label: 'General'
      };
  }
};

const getFeedbackStatusStyle = (status = 'new') => {
  switch (status?.toLowerCase()) {
    case 'resolved':
      return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    case 'in_progress':
      return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
    default:
      return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
  }
};

const getPlayerKeyStats = (player) => {
  const s = player.stats || {};
  const role = player.role;

  if (role === 'Bowler') {
    return [
      { label: 'Wkts', value: s.wickets ?? '—', accent: 'text-rose-400' },
      { label: 'Econ', value: s.econ ?? '—', accent: 'text-white' },
      { label: 'Avg', value: s.avg ?? '—', accent: 'text-white' },
      { label: 'BBI', value: s.bb ?? '—', accent: 'text-white' },
    ];
  }

  if (role === 'All-Rounder') {
    return [
      { label: 'Runs', value: s.runs ?? '—', accent: 'text-blue-400' },
      { label: 'SR', value: s.sr ?? '—', accent: 'text-white' },
      { label: 'Wkts', value: s.wickets ?? '—', accent: 'text-rose-400' },
      { label: 'Econ', value: s.econ ?? '—', accent: 'text-white' },
    ];
  }

  return [
    { label: 'Runs', value: s.runs ?? '—', accent: 'text-blue-400' },
    { label: 'Avg', value: s.avg ?? '—', accent: 'text-white' },
    { label: 'SR', value: s.sr ?? '—', accent: 'text-amber-300' },
    { label: 'HS', value: s.hs ?? '—', accent: 'text-white' },
  ];
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
  const [supabaseActiveCount, setSupabaseActiveCount] = useState(0);
  const [supabaseCompletedCount, setSupabaseCompletedCount] = useState(0);

  // Filters & Tabs
  const { tab } = useParams();
  const activeTab = useMemo(() => {
    const validTabs = ['overview', 'feedbacks', 'auctions', 'players'];
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
  const [expandedFeedbackIds, setExpandedFeedbackIds] = useState(new Set());

  const [auctionSearch, setAuctionSearch] = useState('');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState('all');
  const [auctionPage, setAuctionPage] = useState(1);

  const [playerSearch, setPlayerSearch] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('all');
  const [playerSortBy, setPlayerSortBy] = useState('default');
  const [playerPage, setPlayerPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Modal / Action states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Reset pagination on filter changes
  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearch, feedbackCategory, feedbackStarFilter, feedbackStatusFilter]);

  useEffect(() => {
    setAuctionPage(1);
  }, [auctionSearch, auctionStatusFilter]);

  useEffect(() => {
    setPlayerPage(1);
  }, [playerSearch, playerRoleFilter, playerSortBy]);

  // Fetch all admin data
  const fetchData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Firestore Feedbacks & auto-heal legacy 0-star ratings to 1
      const firestorePromises = (async () => {
        let fbList = [];
        try {
          const fbQuery = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
          const fbSnap = await getDocs(fbQuery);
          fbList = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          // orderBy may fail when the index is missing; fall back to an
          // unordered read so feedback still loads.
          const fbSnap = await getDocs(collection(db, 'feedbacks'));
          fbList = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        // Migrate any 0 or unrated feedbacks to 1 star in Firestore
        const zeroRatingItems = fbList.filter(
          (f) => f.rating === 0 || f.rating === '0' || Number(f.rating) < 1 || f.rating === undefined || f.rating === null
        );

        if (zeroRatingItems.length > 0) {
          try {
            await Promise.all(
              zeroRatingItems.map((item) =>
                updateDoc(doc(db, 'feedbacks', item.id), {
                  rating: 1,
                  updatedAt: new Date(),
                })
              )
            );
            // Reflect in local state
            fbList = fbList.map((f) => {
              const r = Number(f.rating);
              if (isNaN(r) || r < 1) {
                return { ...f, rating: 1 };
              }
              return f;
            });
          } catch (migrateErr) {
            console.warn('Could not auto-migrate 0-rating feedbacks in Firestore:', migrateErr);
            // Ensure local state at least displays as 1
            fbList = fbList.map((f) => {
              const r = Number(f.rating);
              if (isNaN(r) || r < 1) {
                return { ...f, rating: 1 };
              }
              return f;
            });
          }
        }

        let fsCount = 0;
        try {
          const fsAuctionsSnap = await getDocs(collection(db, 'auctions'));
          fsCount = fsAuctionsSnap.size;
        } catch (e) {
          console.warn('Could not count firestore auctions:', e);
        }

        return { fbList, fsCount };
      })();

      // 2. Fetch Supabase Auctions with Exact Counts (no 1k ceiling)
      const supabasePromises = (async () => {
        try {
          const [totalRes, activeRes, completedRes, listRes] = await Promise.all([
            supabase.from('auctions').select('*', { count: 'exact', head: true }),
            supabase.from('auctions').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
            supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            supabase
              .from('auctions')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1000)
          ]);

          if (listRes.error) throw listRes.error;

          const exactTotal = typeof totalRes.count === 'number' ? totalRes.count : (listRes.data?.length || 0);
          const exactActive = typeof activeRes.count === 'number' ? activeRes.count : (listRes.data?.filter((a) => (a.status || '').toLowerCase() !== 'completed').length || 0);
          const exactCompleted = typeof completedRes.count === 'number' ? completedRes.count : (listRes.data?.filter((a) => (a.status || '').toLowerCase() === 'completed').length || 0);

          return {
            auctions: listRes.data || [],
            totalCount: exactTotal,
            activeCount: exactActive,
            completedCount: exactCompleted,
          };
        } catch (sbErr) {
          console.warn('Supabase fetch error:', sbErr);
          return {
            auctions: [],
            totalCount: 0,
            activeCount: 0,
            completedCount: 0,
          };
        }
      })();

      const [fsRes, sbRes] = await Promise.all([firestorePromises, supabasePromises]);

      setFeedbacks(fsRes.fbList);
      setFirestoreAuctionsCount(fsRes.fsCount);

      setSupabaseAuctions(sbRes.auctions);
      setSupabaseTotalAuctionsCount(sbRes.totalCount);
      setSupabaseActiveCount(sbRes.activeCount);
      setSupabaseCompletedCount(sbRes.completedCount);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please check connection and permissions.');
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

  // Derived Stats
  const stats = useMemo(() => {
    const totalFeedbacks = feedbacks.length;

    // Accurately parse ratings (handling numbers, numeric strings, and alternatives like stars)
    const validRatings = feedbacks
      .map((f) => {
        const val = f.rating !== undefined && f.rating !== null ? f.rating : f.stars;
        const num = Number(val);
        return !isNaN(num) && num > 0 ? num : null;
      })
      .filter((r) => r !== null);

    const ratedCount = validRatings.length;
    const avgRating =
      ratedCount > 0
        ? (validRatings.reduce((sum, r) => sum + r, 0) / ratedCount).toFixed(1)
        : '0.0';

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      const val = f.rating !== undefined && f.rating !== null ? f.rating : f.stars;
      const num = Number(val);
      if (!isNaN(num) && num > 0) {
        const rounded = Math.min(5, Math.max(1, Math.round(num)));
        if (starCounts[rounded] !== undefined) {
          starCounts[rounded]++;
        }
      }
    });

    const categoryCounts = { general: 0, bug: 0, feature: 0, ui: 0 };
    feedbacks.forEach((f) => {
      const c = (f.category || 'general').toLowerCase();
      if (categoryCounts[c] !== undefined) categoryCounts[c]++;
      else categoryCounts.general++;
    });

    return {
      totalFeedbacks,
      ratedCount,
      avgRating,
      starCounts,
      categoryCounts,
      totalFirestoreAuctions: firestoreAuctionsCount,
      totalSupabaseAuctions: supabaseTotalAuctionsCount || supabaseAuctions.length,
      activeSbAuctions: supabaseActiveCount,
      completedSbAuctions: supabaseCompletedCount,
    };
  }, [feedbacks, firestoreAuctionsCount, supabaseAuctions.length, supabaseTotalAuctionsCount, supabaseActiveCount, supabaseCompletedCount]);

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
      console.error('[admin] Failed to delete feedback entry', err);
      setError('Failed to delete feedback entry.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAuction = async (id) => {
    setIsDeleting(true);
    try {
      const { error: sbErr } = await supabase.from('auctions').delete().eq('id', id);
      if (sbErr) throw sbErr;

      try {
        await deleteDoc(doc(db, 'auctions', id));
      } catch (e) {
        // The Supabase row is already deleted; the Firestore mirror is
        // best-effort cleanup, so log without failing the whole action.
        console.warn('[admin] Failed to delete Firestore auction mirror', e);
      }

      setSupabaseAuctions((prev) => prev.filter((item) => item.id !== id));
      setActionSuccess('Auction room deleted from database.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('[admin] Failed to delete auction room', err);
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
    } catch {
      // Unknown timestamp shape; show a stable string fallback.
      return String(ts);
    }
  };

  // ─── Render Authentication Lock Screen if Not Admin ───
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl transition-all group flex items-center gap-2 cursor-pointer"
            >
              <Home size={14} className="text-gray-400 group-hover:text-white transition-colors sm:w-[16px] sm:h-[16px]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Home</span>
            </button>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Admin Panel
              </span>
            </div>
          </div>

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
              <Database className="w-3 h-3 text-[#ff5500]" /> Legacy Room Docs
            </p>
          </motion.div>

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
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {loading ? <span className="animate-pulse text-gray-600">---</span> : stats.totalSupabaseAuctions}
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400" /> {stats.activeSbAuctions} Active · {stats.completedSbAuctions} Done
            </p>
          </motion.div>

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
              { id: 'players', label: `Players (${IPL_PLAYERS.length})`, icon: Users },
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
          <OverviewTab
            stats={stats}
            feedbacks={feedbacks}
            formatDate={formatDate}
            onViewAllFeedbacks={() => navigate('/admin/feedbacks')}
          />
        )}

        {/* Tab 2: Feedbacks Management Tab */}
        {activeTab === 'feedbacks' && (
          <FeedbacksTab
            feedbacks={feedbacks}
            filteredFeedbacks={filteredFeedbacks}
            paginatedFeedbacks={paginatedFeedbacks}
            feedbackSearch={feedbackSearch}
            setFeedbackSearch={setFeedbackSearch}
            feedbackStatusFilter={feedbackStatusFilter}
            setFeedbackStatusFilter={setFeedbackStatusFilter}
            feedbackCategory={feedbackCategory}
            setFeedbackCategory={setFeedbackCategory}
            feedbackStarFilter={feedbackStarFilter}
            setFeedbackStarFilter={setFeedbackStarFilter}
            feedbackPage={feedbackPage}
            setFeedbackPage={setFeedbackPage}
            totalFeedbackPages={totalFeedbackPages}
            feedbacksPerPage={FEEDBACKS_PER_PAGE}
            savingNoteId={savingNoteId}
            expandedFeedbackIds={expandedFeedbackIds}
            setExpandedFeedbackIds={setExpandedFeedbackIds}
            handleUpdateFeedback={handleUpdateFeedback}
            setDeleteTarget={setDeleteTarget}
            formatDate={formatDate}
            categories={CATEGORIES}
            workflowStatuses={WORKFLOW_STATUSES}
            getFeedbackCategoryStyle={getFeedbackCategoryStyle}
            getFeedbackStatusStyle={getFeedbackStatusStyle}
          />
        )}

        {/* Tab 3: Supabase Auctions Directory */}
        {activeTab === 'auctions' && (
          <AuctionsTab
            filteredAuctions={filteredAuctions}
            paginatedAuctions={paginatedAuctions}
            auctionSearch={auctionSearch}
            setAuctionSearch={setAuctionSearch}
            auctionStatusFilter={auctionStatusFilter}
            setAuctionStatusFilter={setAuctionStatusFilter}
            auctionPage={auctionPage}
            setAuctionPage={setAuctionPage}
            totalAuctionPages={totalAuctionPages}
            auctionsPerPage={AUCTIONS_PER_PAGE}
            setDeleteTarget={setDeleteTarget}
          />
        )}

        {/* Tab 4: Players Tab */}
        {activeTab === 'players' && (
          <PlayersTab
            allPlayers={IPL_PLAYERS}
            playerSearch={playerSearch}
            setPlayerSearch={setPlayerSearch}
            playerRoleFilter={playerRoleFilter}
            setPlayerRoleFilter={setPlayerRoleFilter}
            playerSortBy={playerSortBy}
            setPlayerSortBy={setPlayerSortBy}
            playerPage={playerPage}
            setPlayerPage={setPlayerPage}
            setSelectedPlayer={setSelectedPlayer}
            getRatingBadgeStyle={getRatingBadgeStyle}
            getPlayerKeyStats={getPlayerKeyStats}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Selected Player Detailed Profile Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        getRoleBadgeStyle={getRoleBadgeStyle}
        getRatingBadgeStyle={getRatingBadgeStyle}
      />

      <Footer />
    </div>
  );
};

export default AdminPanel;
