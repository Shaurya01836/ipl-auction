import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuction } from "../contexts/AuctionContext";
import {
  getActiveServer,
  getRtdb,
  getAvailableServers,
  goOfflineServer,
  isServerAvailable,
} from "../lib/firebase";
import { supabase } from "../lib/supabase";
import { generateRoomCode, normalizeRoomCode } from "../lib/roomCodes";
import { ref, remove } from "firebase/database";
import {
  DEFAULT_AUCTION_SERVER,
  getAuctionServer,
  getPreferredServer,
  getServerFromSearch,
  getServerMeta,
  setPreferredServer,
  withServerParam,
} from "../lib/auctionServers";
import { IPL_PLAYERS } from "../data/players";
import { TEAMS } from "../data/teams";
import {
  Zap,
  Loader2,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  Wifi,
  History,
  Trash2,
  RefreshCw,
  Clock,
} from "lucide-react";
import GithubStarButton from "../components/GithubStarButton";
import BuyMeACoffee from "../components/BuyMeACoffee";
import ConfirmDialog from "../components/ConfirmDialog";
import AuctionActivityFeed from "../components/AuctionActivityFeed";
import Footer from "../components/Footer";
import ServerSwitcher from "../components/ServerSwitcher";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  computeTeamSpent,
  countOverseas,
  formatCrores,
  isOverseasPlayer,
  toFiniteNumber,
} from "../lib/auctionDisplay";

const LandingPage = () => {
  useDocumentTitle(
    "IPL Auction Simulator & Game | Live IPL Mega Auction 2026",
    "Play the ultimate multiplayer IPL Auction Simulator online. Host live IPL Mega Auctions with friends, manage purse budgets, bid on top T20 players, and build championship squads!",
  );
  const [selectedTeam, setSelectedTeam] = useState("MI");
  const [activeTab, setActiveTab] = useState("new");
  const [auctionType, setAuctionType] = useState("mega"); 
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const availableServers = useMemo(() => getAvailableServers(), []);
  const [selectedServer, setSelectedServer] = useState(() => {
    const hinted = getServerFromSearch(window.location.search);
    if (hinted && isServerAvailable(hinted)) return hinted;
    const preferred = getPreferredServer();
    return isServerAvailable(preferred) ? preferred : DEFAULT_AUCTION_SERVER;
  });

  const handleServerChange = (server) => {
    if (!isServerAvailable(server)) return;
    setSelectedServer(server);
    setNotice("");
    // Keep the URL in sync so a refresh does not snap back to an older hint.
    const url = new URL(window.location.href);
    url.searchParams.set("server", server);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    setPreferredServer(selectedServer);
  }, [selectedServer]);

  // Public Lobbies state
  const [publicRooms, setPublicRooms] = useState([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");

  const { user, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const { createRoom, joinRoomDb } = useAuction();
  const navigate = useNavigate();

  // Check for URL errors (e.g., from being kicked)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "kicked") {
      setError(
        "ACCESS DENIED: You have been removed from that hub by the host.",
      );
      // Clean up the error flag without losing the server hint.
      params.delete("error");
      const query = params.toString();
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    }
  }, []);

  // Fetch Public Lobbies directly from Supabase (0 RTDB bandwidth download cost)
  const fetchPublicLobbies = async () => {
    setLobbiesLoading(true);
    try {
      if (supabase) {
        const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
        const threeHoursAgoISO = new Date(
          Date.now() - THREE_HOURS_MS,
        ).toISOString();

        const { data: supabaseRooms, error } = await supabase
          .from("auctions")
          .select("*")
          .in("status", ["waiting", "active"])
          .eq("is_public", true)
          .eq("host_online", true)
          .gte("created_at", threeHoursAgoISO)
          .order("created_at", { ascending: false })
          
        if (!error && supabaseRooms && supabaseRooms.length > 0) {
          const list = supabaseRooms.map((r) => {
            const players = r.players || [];
            const uniquePlayers = [];
            const seenIds = new Set();
            players.forEach((p) => {
              const pid = p?.id || p?.userId;
              if (pid && !seenIds.has(pid)) {
                seenIds.add(pid);
                uniquePlayers.push(p);
              }
            });

            const host =
              uniquePlayers.find((p) => p.isHost) || uniquePlayers[0];
            return {
              roomId: r.id,
              server: getAuctionServer(r),
              hostName: r.host_name || host?.name || "Manager",
              status: r.status,
              auctionType: r.auction_type || "mega",
              players: uniquePlayers,
              squadLimit: toFiniteNumber(r.squad_limit, 25),
              settings: r.settings || {},
            };
          });
          setPublicRooms(list);
          setLobbiesLoading(false);
          return;
        }
      }
      setPublicRooms([]);
    } catch {
      setPublicRooms([]);
    } finally {
      setLobbiesLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicLobbies();
  }, []);

  // Fetch auction history directly from Supabase
  const historyRequestRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    const userId = user?.uid;
    if (!userId || !supabase) {
      setHistoryData([]);
      setHistoryError(null);
      return;
    }
    // Guard against overlapping requests (and React StrictMode double effects).
    if (historyRequestRef.current) return;

    historyRequestRef.current = true;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data: supabaseTeams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      if (!supabaseTeams || supabaseTeams.length === 0) {
        setHistoryData([]);
        return;
      }

      const auctionIds = [
        ...new Set(supabaseTeams.map((t) => t.auction_id)),
      ].filter(Boolean);

      const { data: supabaseAuctions, error: auctionsError } = await supabase
        .from("auctions")
        .select("*")
        .in("id", auctionIds);

      if (auctionsError) throw auctionsError;

      const auctionMap = {};
      (supabaseAuctions || []).forEach((a) => {
        auctionMap[a.id] = a;
      });

      const sessions = supabaseTeams.map((teamData) => {
        const auctionData = auctionMap[teamData.auction_id];
        const totalBudget = toFiniteNumber(auctionData?.settings?.budget, 120);
        const spent = computeTeamSpent({
          budget: totalBudget,
          budgetRemaining: teamData.budget_remaining,
          spent: teamData.spent,
        });

        return {
          id: teamData.id,
          roomId: teamData.auction_id,
          server: getAuctionServer(auctionData),
          teamId: teamData.team_id,
          teamName: teamData.team_name,
          mode: auctionData?.auction_type || "mega",
          status: auctionData?.status || "waiting",
          budgetRemaining: teamData.budget_remaining ?? null,
          spent,
          overseasLimit: toFiniteNumber(auctionData?.overseas_limit, 8),
          squadLimit: toFiniteNumber(auctionData?.squad_limit, 25),
          squad: (teamData.squad || [])
            .map((s) => {
              const pid = typeof s === "string" ? s : s.id;
              // Legacy string entries carry no bid: keep it unknown (null)
              // rather than substituting the player's base price.
              const bid = typeof s === "string" ? null : (s.bid ?? null);
              const playerInfo = IPL_PLAYERS.find((p) => p.id === pid);
              return {
                id: pid,
                name: playerInfo?.name || pid,
                role: playerInfo?.role || "Player",
                image: playerInfo?.image || "",
                country: playerInfo?.country,
                type: playerInfo?.type,
                bid,
              };
            })
            .filter((p) => p.id),
          date: teamData.created_at
            ? new Date(teamData.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent Session",
        };
      });

      setHistoryData(sessions);
    } catch (error) {
      // Keep any previously loaded data visible; surface the failure instead.
      console.error("[history] Failed to load auction history", error);
      setHistoryError("Could not load your auction history. Please try again.");
    } finally {
      historyRequestRef.current = false;
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    // Load once when the signed-in user is available (entering the site or
    // switching accounts). Opening the History tab reuses this data; only the
    // explicit Refresh button triggers another request.
    if (!user?.uid) return;
    fetchHistory();
  }, [user?.uid, fetchHistory]);

  // Filtered public rooms
  const filteredPublicRooms = useMemo(() => {
    return publicRooms.filter((room) => {
      const matchesServer = room.server === selectedServer;
      const matchesSearch =
        room.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode =
        filterMode === "all" || room.auctionType === filterMode;
      return matchesServer && matchesSearch && matchesMode;
    });
  }, [publicRooms, selectedServer, searchQuery, filterMode]);

  const serverRoomCount = useMemo(
    () => publicRooms.filter((room) => room.server === selectedServer).length,
    [publicRooms, selectedServer],
  );

  const filteredHistory = useMemo(
    () => historyData.filter((session) => session.server === selectedServer),
    [historyData, selectedServer],
  );

  // Confirm + delete an individual session from Supabase history & public list
  const handleDeleteHistory = async () => {
    const session = sessionToDelete;
    if (!session) return;

    const roomId = session.roomId;
    const teamDocId = session.id;

    // Optimistically update the UI immediately so no refresh is needed
    setHistoryData((prev) => prev.filter((item) => item.id !== teamDocId));
    setPublicRooms((prev) => prev.filter((room) => room.roomId !== roomId));
    if (expandedSession === teamDocId) setExpandedSession(null);
    setSessionToDelete(null);

    try {
      if (supabase) {
        // 1. Delete user's team row from Supabase
        const { error: teamError } = await supabase
          .from("teams")
          .delete()
          .eq("id", teamDocId);
        if (teamError) throw teamError;

        // 2. Delete the auction room itself from Supabase
        const { error: roomError } = await supabase
          .from("auctions")
          .delete()
          .eq("id", roomId);
        if (roomError) throw roomError;
      }
    } catch (err) {
      console.error("[history] Failed to delete auction session", err);
      // Roll back the optimistic removal if the server delete failed
      setHistoryData((prev) =>
        prev.some((item) => item.id === teamDocId) ? prev : [session, ...prev],
      );
      setError("Could not delete this room. Please try again.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // 3. Remove room from the room's own Realtime Database if still sitting in
    // waiting state. Never clean up the other server's namespace.
    if (isServerAvailable(session.server)) {
      try {
        await remove(ref(getRtdb(session.server), `auctions/${roomId}`));
      } catch (err) {
        // The Supabase rows are already gone; RTDB cleanup is best-effort.
        console.warn(
          "[history] Failed to remove deleted auction from RTDB",
          err,
        );
      } finally {
        // Deleting history must not leave a browse-time socket open.
        goOfflineServer(session.server);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch {
      setError("Sign-in failed. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleGuestSignIn = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter a name");
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsGuest(guestName.trim());
      setIsSubmitting(false);
    } catch {
      setError("Guest login failed. Ensure Anonymous Auth is enabled.");
      setTimeout(() => setError(""), 3000);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const displayName = user.displayName || "Manager";

      if (activeTab === "new") {
        let newRoomId = null;
        let result = null;

        // Collisions are rare but possible; retry with a fresh code instead of
        // letting an upsert overwrite an existing room.
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const candidate = generateRoomCode();
          try {
            result = await createRoom(
              candidate,
              user.uid,
              { name: displayName, team: selectedTeam },
              auctionType,
              isPublicRoom,
              selectedServer,
            );
            newRoomId = candidate;
            break;
          } catch (createError) {
            if (
              createError?.code !== "ROOM_CODE_TAKEN" ||
              attempt === 3
            ) {
              throw createError;
            }
          }
        }

        if (!newRoomId) {
          throw new Error("Could not create a room code. Please try again.");
        }

        const actualServer = result?.server || selectedServer;
        setSelectedServer(actualServer);
        if (result?.fellBack) {
          setNotice(
            `${getServerMeta(result.requestedServer).label} was full, so this room was created on ${getServerMeta(actualServer).label}.`,
          );
          setTimeout(() => setNotice(""), 6000);
        }
        navigate(withServerParam(`/lobby/${newRoomId}`, actualServer));
      } else if (activeTab === "join") {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = normalizeRoomCode(roomCode);
        const resolvedServer = await joinRoomDb(code, user.uid, {
          name: displayName,
          team: "",
        });
        const actualServer = resolvedServer || selectedServer;
        setSelectedServer(actualServer);
        navigate(withServerParam(`/lobby/${code}`, actualServer));
      }
    } catch (error) {
      // createRoom/joinRoomDb may have opened a probe socket before failing.
      // The landing page must stay browse-only; the room page will reconnect.
      goOfflineServer(getActiveServer());
      setError(
        error.message || "Failed to create/join room. Please try again.",
      );
      setTimeout(() => setError(""), 3000);
      setIsSubmitting(false);
    }
  };

  // ─── Not Signed In: Show Google / Guest Login ───
  if (!user) {
    return (
      <main className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center pt-10 px-4 font-sans text-white overflow-x-hidden">
        <GithubStarButton />
        <BuyMeACoffee />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-800/20  md:bg-orange-700/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://res.cloudinary.com/drl6ky9as/image/upload/v1792012081/texture_os1ukf.jpg')] opacity-[0.25]" />
        </div>

        <div className="text-center mb-4 z-10 relative max-w-3xl px-4 mt-10">
          <h1 className="sr-only">
            IPL Auction Simulator & Game - Live IPL Mega Auction 2026
          </h1>
          <div className="text-2xl sm:text-4xl md:text-5xl lg:text-[64px] font-pixel leading-none text-balance bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            CREATE YOUR
          </div>
          <div className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-pixel text-[#ff5500] leading-none uppercase text-balance mt-1 drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
            AUCTION ROOM
          </div>

          <p className="text-[13px] sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed px-1">
            The ultimate multiplayer IPL auction simulator and game. Host live
            IPL mega auctions with friends in real-time, choose your favorite
            franchise, bid strategically, and build a championship T20 squad.
          </p>

          {/* Three-step visual story */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 sm:gap-x-6 mt-5 px-2 text-[9px] sm:text-[10px] font-black tracking-wider sm:tracking-widest text-gray-400 uppercase select-none">
            <span className="hover:text-orange-500/80 transition-colors">
              ① Create Room
            </span>
            <span className="text-gray-800">➔</span>
            <span className="hover:text-orange-500/80 transition-colors">
              ② Invite Friends
            </span>
            <span className="text-gray-800">➔</span>
            <span className="hover:text-orange-500/80 transition-colors">
              ③ Start Bidding
            </span>
          </div>
        </div>

        {/* Subtle gradient line / Faded Divider */}
        <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 mt-10 z-10 relative" />

        <div className="w-full max-w-6xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative mt-2">
          {/* Subtle Orange Glow behind panel */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.02] via-[#ff5500]/[0.01] to-transparent rounded-[2.5rem] blur-xl pointer-events-none -z-10" />
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff5500]/5 to-[#0088ff]/2 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none -z-10" />
          <div className="bg-[#0c0c0c] rounded-[2.2rem] border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden">
            {/* Left Side: Live Activity Feed */}
            <div className="lg:col-span-7 w-full flex flex-col p-6 md:p-8 relative">
              <AuctionActivityFeed activeCount={publicRooms.length} />
            </div>

            {/* Right Side: Welcome Login Form */}
            <div className="lg:col-span-5 w-full p-8 md:p-10 flex flex-col items-center justify-center">
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">
                {isGuestMode ? "Guest Access" : "Welcome, Manager"}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                {isGuestMode
                  ? "Enter a name to join"
                  : "Sign in to enter the auction hub"}
              </p>

              {!isGuestMode ? (
                <div className="w-full space-y-4">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full h-12 sm:h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-2.5 sm:gap-3 text-white font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-xs sm:text-sm">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        className="fill-white sm:w-[18px] sm:h-[18px]"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  </button>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5" />
                    </div>
                    <span className="relative bg-[#0c0c0c] px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                      Wait, I'm a guest
                    </span>
                  </div>

                  <button
                    onClick={() => setIsGuestMode(true)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase tracking-[0.2rem] text-xs cursor-pointer active:scale-[0.98]"
                  >
                    <Users size={18} /> Join as Guest
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGuestSignIn} className="w-full space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Your Manager Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. MS Dhoni"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black uppercase text-sm tracking-widest placeholder:text-gray-800 focus:outline-none focus:border-orange-500/50 transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <span>Start Auction Hub</span>
                      )}
                      {!isSubmitting && (
                        <ChevronRight
                          size={18}
                          className="group-hover/submit:translate-x-1 transition-transform"
                        />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuestMode(false)}
                    className="w-full text-[9px] font-black text-gray-400 hover:text-white uppercase tracking-[0.3em] transition-colors mt-2"
                  >
                    ← Back to Google Login
                  </button>
                </form>
              )}

              {error && (
                <p className="mt-4 text-xs text-red-500 font-bold">{error}</p>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  // ─── Signed In: Show Create / Join / History ───
  return (
    <main className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center pt-10 px-4 font-sans text-white overflow-x-hidden">
      <GithubStarButton />
      <BuyMeACoffee />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-800/20  md:bg-orange-700/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://res.cloudinary.com/drl6ky9as/image/upload/v1792012081/texture_os1ukf.jpg')] opacity-[0.25]" />
      </div>

      {/* Hero */}
      <div className="text-center mb-4 z-10 relative max-w-3xl px-4 mt-10">
        <h1 className="sr-only">
          IPL Auction Simulator & Game - Live IPL Mega Auction 2026
        </h1>
        <div className="text-2xl sm:text-4xl md:text-5xl lg:text-[64px] font-pixel leading-none text-balance bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          CREATE YOUR
        </div>
        <div className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-pixel text-[#ff5500] leading-none uppercase text-balance mt-1 drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
          AUCTION ROOM
        </div>

        <p className="text-[13px] sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed px-1">
          The ultimate multiplayer IPL auction simulator and game. Host live IPL
          mega auctions with friends in real-time, choose your favorite
          franchise, bid strategically, and build a championship T20 squad.
        </p>

        {/* Three-step visual story */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 sm:gap-x-6 mt-5 px-2 text-[9px] sm:text-[10px] font-black tracking-wider sm:tracking-widest text-gray-400 uppercase select-none">
          <span className="hover:text-orange-500/80 transition-colors">
            ① Create Room
          </span>
          <span className="text-gray-800">➔</span>
          <span className="hover:text-orange-500/80 transition-colors">
            ② Invite Friends
          </span>
          <span className="text-gray-800">➔</span>
          <span className="hover:text-orange-500/80 transition-colors">
            ③ Start Bidding
          </span>
        </div>
      </div>

      {/* Subtle gradient line / Faded Divider */}
      <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 mt-10 z-10 relative" />

      <div className="w-full max-w-6xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative mt-2">
        {/* Subtle Orange Glow behind panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.02] via-[#ff5500]/[0.01] to-transparent rounded-[2.5rem] blur-xl pointer-events-none -z-10" />
        <div className="absolute -inset-2 bg-gradient-to-r from-[#ff5500]/5 to-[#0088ff]/2 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none -z-10" />
        <div className="bg-[#0c0c0c] rounded-[2.2rem] border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden">
          {/* Left Side: Live signings */}
          <div className="lg:col-span-5 w-full flex flex-col p-6 md:p-8 relative">
            <AuctionActivityFeed activeCount={serverRoomCount} />
          </div>

          {/* Right Side: Create/Join/History form */}
          <div className="lg:col-span-7 w-full p-4 sm:p-6 md:p-8 flex flex-col">
            {availableServers.length > 1 && (
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Auction Server
                  </span>
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium">
                    Lobbies and history are separate per server.
                  </p>
                </div>
                <ServerSwitcher
                  servers={availableServers}
                  value={selectedServer}
                  onChange={handleServerChange}
                />
              </div>
            )}
            {/* Flat Tab Bar Navigation: Create / Join / History */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 mb-5 sm:mb-8 gap-3 sm:gap-4">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className={`pb-3 px-4 sm:pb-3.5 sm:px-6 font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative ${
                    activeTab === "new"
                      ? "border-[#ff5500] text-[#ff5500]"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("join")}
                  className={`pb-3 px-4 sm:pb-3.5 sm:px-6 font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative flex items-center gap-1.5 ${
                    activeTab === "join"
                      ? "border-[#ff5500] text-[#ff5500]"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <span>Join</span>
                  {serverRoomCount > 0 && (
                    <span className="bg-[#ff5500]/20 text-[#ff5500] text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                      {serverRoomCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 px-4 sm:pb-3.5 sm:px-6 font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative ${
                    activeTab === "history"
                      ? "border-[#ff5500] text-[#ff5500]"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  History
                </button>
              </div>

              {/* User Profile and Logout */}
              <div className="flex items-center gap-2 sm:gap-3 pb-3 px-4 sm:pb-3.5 sm:px-0 self-start sm:self-auto">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full border border-white/20"
                  />
                )}
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-[9px] font-black text-gray-400 hover:text-red-400 uppercase tracking-widest transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* ─── CREATE TAB ─── */}
            {activeTab === "new" && (
              <form
                key="create-tab"
                onSubmit={handleFormSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <div className="mb-2.5 sm:mb-4 ml-1">
                    <h2 className="text-[11px] sm:text-[13px] font-black uppercase text-gray-400 tracking-wider">
                      Franchise
                    </h2>
                    <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      Choose the team you'll manage.
                    </p>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                    {TEAMS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeam(t.id)}
                        aria-label={`Select ${t.name}`}
                        className={`relative group/team flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                          selectedTeam === t.id
                            ? "bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                            : "bg-[#151515] border border-transparent hover:bg-white/[0.04]"
                        }`}
                      >
                        {selectedTeam === t.id && (
                          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 text-white">
                            <Check
                              size={10}
                              className="sm:w-3 sm:h-3"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                        <div
                          className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white/5 p-1 sm:p-1.5 flex items-center justify-center mb-1 sm:mb-2 transition-transform duration-200 ${selectedTeam === t.id ? "scale-105" : "group-hover/team:scale-105"}`}
                        >
                          <img
                            src={t.logo}
                            alt={`${t.name} Logo`}
                            className="w-full h-full object-contain filter"
                          />
                        </div>
                        <span
                          className={`text-[7px] sm:text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${selectedTeam === t.id ? "text-white" : "text-gray-400"}`}
                        >
                          {t.name.split(" ").slice(0, 1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 sm:mb-4 ml-1">
                    <h2 className="text-[11px] sm:text-[13px] font-black uppercase text-gray-400 tracking-wider">
                      Mode
                    </h2>
                  </div>

                  <div className="flex flex-row gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setAuctionType("mega")}
                      className={`flex-1 p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${
                        auctionType === "mega"
                          ? "bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                          : "bg-[#151515] border border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      {auctionType === "mega" && (
                        <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 text-white">
                          <Check
                            size={10}
                            className="sm:w-3 sm:h-3"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                        <Trophy
                          size={12}
                          className={
                            auctionType === "mega"
                              ? "text-white sm:w-3.5 sm:h-3.5"
                              : "text-gray-400 sm:w-3.5 sm:h-3.5"
                          }
                        />
                        <span
                          className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight ${auctionType === "mega" ? "text-white" : "text-gray-400"}`}
                        >
                          Mega
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                        <div>25 Players</div>
                        <div>₹120 Cr Budget</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuctionType("sprint11")}
                      className={`flex-1 p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${
                        auctionType === "sprint11"
                          ? "bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                          : "bg-[#151515] border border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      {auctionType === "sprint11" && (
                        <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 text-white">
                          <Check
                            size={10}
                            className="sm:w-3 sm:h-3"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                        <Star
                          size={12}
                          className={
                            auctionType === "sprint11"
                              ? "text-white sm:w-3.5 sm:h-3.5"
                              : "text-gray-400 sm:w-3.5 sm:h-3.5"
                          }
                        />
                        <span
                          className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight ${auctionType === "sprint11" ? "text-white" : "text-gray-400"}`}
                        >
                          Classic
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                        <div>11 Players</div>
                        <div>₹90 Cr Budget</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuctionType("sprint5")}
                      className={`flex-1 p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${
                        auctionType === "sprint5"
                          ? "bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                          : "bg-[#151515] border border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      {auctionType === "sprint5" && (
                        <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 text-white">
                          <Check
                            size={10}
                            className="sm:w-3 sm:h-3"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                        <Zap
                          size={12}
                          className={
                            auctionType === "sprint5"
                              ? "text-white sm:w-3.5 sm:h-3.5"
                              : "text-gray-400 sm:w-3.5 sm:h-3.5"
                          }
                          fill={
                            auctionType === "sprint5" ? "currentColor" : "none"
                          }
                        />
                        <span
                          className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight ${auctionType === "sprint5" ? "text-white" : "text-gray-400"}`}
                        >
                          Sprint
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                        <div>5 Players</div>
                        <div>₹60 Cr Budget</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Room Visibility Toggle */}
                <div className="p-3 sm:p-4 bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[10px] sm:text-[11px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      Public Room Visibility
                    </h2>
                    <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium">
                      {isPublicRoom
                        ? "Listed in the Public Rooms Directory for anyone to join"
                        : "Private room — accessible only via Room Code link"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublicRoom(!isPublicRoom)}
                    aria-label="Toggle public room visibility"
                    className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 ${
                      isPublicRoom
                        ? "bg-orange-600 justify-end"
                        : "bg-white/10 justify-start"
                    }`}
                  >
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="pt-1 sm:pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 sm:h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[10px] sm:text-xs">
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Start Auction</span>
                          <ChevronRight
                            size={16}
                            className="group-hover/submit:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            )}

            {/* ─── JOIN TAB ─── */}
            {activeTab === "join" && (
              <div key="join-tab" className="space-y-4 sm:space-y-6">
                <form
                  onSubmit={handleFormSubmit}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="relative group">
                    <label className="block text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.18em] sm:tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">
                      Access Token / Room Code
                    </label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 focus:outline-none focus:border-orange-500/50 transition-all text-white font-black uppercase tracking-[0.35em] sm:tracking-[0.5em] text-center text-sm sm:text-lg placeholder:tracking-normal placeholder:text-[10px] sm:placeholder:text-xs placeholder:text-gray-400"
                      placeholder="Enter Room Code"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !roomCode.trim()}
                    className="w-full h-10 sm:h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-2 sm:gap-3 text-white font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[10px] sm:text-xs">
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Join by Code</span>
                          <ChevronRight
                            size={16}
                            className="group-hover/submit:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                <div className="relative py-1 sm:py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <span className="relative bg-[#0c0c0c] px-3 sm:px-4 text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    Or join a public lobby
                  </span>
                </div>

                {/* Public Lobbies Directory Section */}
                <div className="space-y-2.5 sm:space-y-3 pt-0 sm:pt-1">
                  {/* Responsive Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                    <div className="relative w-full sm:flex-1 flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search room code or manager..."
                        className="w-full bg-white/[0.03] border border-white/10 focus:border-orange-500/50 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white placeholder:text-gray-400 focus:outline-none transition-all font-medium"
                      />
                      <button
                        onClick={fetchPublicLobbies}
                        className="flex items-center justify-center gap-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/30 hover:border-orange-500 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
                        title="Refresh Lobbies"
                      >
                        <RefreshCw
                          size={14}
                          className={lobbiesLoading ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
                      {[
                        { id: "all", label: "All" },
                        { id: "mega", label: "Mega" },
                        { id: "sprint11", label: "11-Classic" },
                        { id: "sprint5", label: "5-Sprint" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setFilterMode(mode.id)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                            filterMode === mode.id
                              ? "bg-white/10 text-white border border-white/20"
                              : "bg-transparent text-gray-400 hover:text-gray-300 border border-transparent"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Responsive Lobbies Directory List */}
                  {lobbiesLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-400">
                      <Loader2
                        size={18}
                        className="animate-spin mb-2 text-orange-500"
                      />
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Scanning active rooms...
                      </p>
                    </div>
                  ) : filteredPublicRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-5 sm:py-8 text-center bg-white/[0.01] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        No Active Public Lobbies
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
                        No open public rooms on this server right now. Create
                        one to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2 max-h-[220px] sm:max-h-[310px] overflow-y-auto custom-scrollbar pr-0.5">
                      {filteredPublicRooms.map((room) => (
                        <div
                          key={room.roomId}
                          className="p-2 sm:p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 flex flex-row items-center justify-between gap-2 sm:gap-3 group"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            {/* Clean Room Code Pill */}
                            <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-black text-[9px] sm:text-xs tracking-wider shrink-0">
                              {room.roomId}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h2 className="text-[10px] sm:text-xs font-bold text-white tracking-tight truncate max-w-[96px] xs:max-w-[160px] sm:max-w-none">
                                  {room.hostName}'s Room
                                </h2>
                              </div>

                              <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                                <span
                                  className={`px-1 sm:px-1.5 py-0.2 rounded font-black text-[7px] sm:text-[8px] uppercase tracking-wider ${room.status === "active" ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}
                                >
                                  {room.status === "active"
                                    ? "LIVE"
                                    : "WAITING"}
                                </span>

                                <span className="shrink-0">•</span>
                                <span className="text-gray-400 truncate">
                                  {room.auctionType === "sprint5"
                                    ? "5-Sprint"
                                    : room.auctionType === "sprint11"
                                      ? "11-Classic"
                                      : "Mega"}
                                </span>
                                <span className="shrink-0">•</span>
                                <span className="text-gray-500 truncate">
                                  {getServerMeta(room.server).shortLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigate(
                                withServerParam(
                                  `/lobby/${room.roomId}`,
                                  room.server,
                                ),
                              );
                            }}
                            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[8px] sm:text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                          >
                            <span>Join</span>
                            <ChevronRight
                              size={12}
                              className="sm:w-3.5 sm:h-3.5"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── HISTORY TAB ─── */}
            {activeTab === "history" && (
              <div key="history-tab" className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Auction History
                  </span>
                  <button
                    type="button"
                    onClick={fetchHistory}
                    disabled={historyLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <RefreshCw
                      size={10}
                      className={historyLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
                {historyError && filteredHistory.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="text-[9px] font-bold text-red-400">
                      {historyError}
                    </span>
                    <button
                      type="button"
                      onClick={fetchHistory}
                      className="text-[8px] font-black uppercase tracking-widest text-red-300 hover:text-white cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 sm:py-16">
                    <Loader2
                      size={26}
                      className="text-blue-500 animate-spin mb-3 sm:mb-4 sm:w-8 sm:h-8"
                    />
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 sm:mt-4">
                      Syncing Database...
                    </p>
                  </div>
                ) : historyError && filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <RefreshCw
                        size={22}
                        className="text-red-400 sm:w-7 sm:h-7"
                      />
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-red-400 uppercase tracking-widest mb-1">
                      History Unavailable
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                      {historyError}
                    </p>
                    <button
                      type="button"
                      onClick={fetchHistory}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 border border-dashed border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <History
                        size={22}
                        className="text-gray-400 sm:w-7 sm:h-7"
                      />
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-1">
                      No Auctions Yet
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Create or join a room on this server to start bidding!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Session List */}
                    <div className="space-y-2 sm:space-y-3 max-h-[330px] sm:max-h-[400px] overflow-y-auto custom-scrollbar pr-0.5 sm:pr-1">
                      {filteredHistory.map((session) => {
                        const teamMeta = TEAMS.find(
                          (t) => t.id === session.teamId,
                        );
                        const isExpanded = expandedSession === session.id;
                        const isCompleted = session.status === "completed";
                        const isActive = session.status === "active";
                        const overseasCount = countOverseas(
                          session.squad,
                          IPL_PLAYERS,
                        );

                        return (
                          <div key={session.id} className="space-y-1">
                            {/* Outer row: div acts as the expand toggle — avoids nested <button> HTML violation */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedSession(
                                  isExpanded ? null : session.id,
                                )
                              }
                              onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") &&
                                setExpandedSession(
                                  isExpanded ? null : session.id,
                                )
                              }
                              className={`w-full text-left p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                                isExpanded
                                  ? "bg-white/10 border-white/20 shadow-lg"
                                  : "bg-white/[0.03] border-white/5 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white/5 border border-white/10 p-1 sm:p-1.5 flex items-center justify-center shrink-0">
                                  <img
                                    src={teamMeta?.logo}
                                    alt={`${teamMeta?.name || "Team"} Logo`}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-tight truncate">
                                    {teamMeta?.name || session.teamName}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
                                    <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                                      Room: {session.roomId}
                                    </span>
                                    <span className="text-[7px] sm:text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 bg-gray-500/10 text-gray-400">
                                      {session.mode}
                                    </span>
                                    <span
                                      className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                        session.status === "completed"
                                          ? "bg-green-500/10 text-green-500"
                                          : session.status === "active"
                                            ? "bg-yellow-500/10 text-yellow-500"
                                            : "bg-gray-500/10 text-gray-400"
                                      }`}
                                    >
                                      {session.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 ml-1.5 sm:ml-2">
                                <div className="text-right">
                                  <span className="text-[9px] sm:text-xs font-black italic text-yellow-500 block">
                                    {session.spent === null
                                      ? "—"
                                      : `₹${formatCrores(session.spent, 1)} Cr`}
                                  </span>
                                  <span className="block text-[7px] sm:text-[8px] font-bold text-gray-400">
                                    {session.squad.length} players
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent accordion toggle
                                    setSessionToDelete(session);
                                  }}
                                  title="Delete History"
                                  aria-label="Delete history"
                                  className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2
                                    size={12}
                                    className="sm:w-[13px] sm:h-[13px]"
                                  />
                                </button>
                                <ChevronDown
                                  size={12}
                                  className={`text-gray-400 transition-transform duration-300 sm:w-3.5 sm:h-3.5 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>

                            {/* Expanded Squad */}
                            {isExpanded && (
                              <div className="overflow-hidden">
                                <div className="bg-[#111] border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 space-y-2 sm:space-y-3 mt-1">
                                  {isCompleted ? (
                                    <>
                                      {/* Quick Stats */}
                                      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-3 text-[7px] sm:text-[9px] font-black uppercase tracking-tight px-1.5 py-1 bg-white/[0.02] rounded-lg sm:rounded-xl border border-white/5">
                                        <span className="text-gray-400">
                                          Budget Left:{" "}
                                          <span className="text-green-400">
                                            {session.budgetRemaining == null
                                              ? "—"
                                              : `₹${formatCrores(session.budgetRemaining, 1)} Cr`}
                                          </span>
                                        </span>
                                        <span className="text-gray-400">
                                          Overseas:{" "}
                                          <span className="text-purple-400">
                                            {overseasCount}/{session.overseasLimit}
                                          </span>
                                        </span>
                                        <span className="text-gray-400">
                                          Squad:{" "}
                                          <span className="text-white">
                                            {session.squad.length}/{session.squadLimit}
                                          </span>
                                        </span>
                                      </div>

                                      {/* Players by Role */}
                                      {[
                                        "Batsman",
                                        "Wicket-Keeper",
                                        "All-Rounder",
                                        "Bowler",
                                      ].map((role) => {
                                        const rolePlayers = session.squad.filter(
                                          (p) => p?.role === role,
                                        );
                                        if (rolePlayers.length === 0) return null;

                                        return (
                                          <div key={role}>
                                            <div className="flex items-center gap-2 px-1 mb-1">
                                              <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-widest">
                                                {role}s
                                              </span>
                                              <div className="flex-1 h-px bg-white/5" />
                                              <span className="text-[8px] font-black text-gray-400">
                                                {rolePlayers.length}
                                              </span>
                                            </div>
                                            <div className="space-y-1">
                                              {rolePlayers.map((p, idx) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-center justify-between bg-white/[0.03] hover:bg-white/5 transition-all p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl"
                                                >
                                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-2">
                                                    <img
                                                      src={p?.image}
                                                      alt={p?.name}
                                                      className="w-5 h-5 sm:w-7 sm:h-7 object-contain rounded-md bg-white/5 shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                      <h4 className="text-[9px] sm:text-[11px] font-black leading-tight truncate">
                                                        {p?.name}
                                                      </h4>
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[7px] font-bold text-gray-400 uppercase">
                                                          {p?.type}
                                                        </span>
                                                        {isOverseasPlayer(p) && (
                                                          <Wifi
                                                            size={8}
                                                            className="text-purple-400 rotate-90 shrink-0"
                                                          />
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <span className="text-[8px] sm:text-[10px] font-black italic text-yellow-500 shrink-0">
                                                    {p?.bid == null
                                                      ? "—"
                                                      : `₹${formatCrores(p.bid)} Cr`}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {session.squad.length === 0 && (
                                        <p className="text-center text-[9px] sm:text-[10px] text-gray-400 font-bold py-3 sm:py-4 uppercase">
                                          No players acquired in this session
                                        </p>
                                      )}

                                      <button
                                        onClick={() =>
                                          navigate(
                                            withServerParam(
                                              `/summary/${session.roomId}`,
                                              session.server,
                                            ),
                                          )
                                        }
                                        className="w-full mt-1.5 sm:mt-2 py-2 sm:py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                      >
                                        <Trophy size={12} /> View Full Summary
                                      </button>
                                    </>
                                  ) : isActive ? (
                                    <>
                                      {/* Live auction info */}
                                      <div className="flex items-start gap-2.5 px-2.5 py-2.5 bg-yellow-500/[0.06] border border-yellow-500/15 rounded-xl">
                                        <div className="min-w-0">
                                          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-yellow-400">
                                            Auction In Progress
                                          </p>
                                          <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium mt-0.5">
                                            Bidding is live right now — jump back in to keep building your squad.
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() =>
                                          navigate(
                                            withServerParam(
                                              `/lobby/${session.roomId}`,
                                              session.server,
                                            ),
                                          )
                                        }
                                        className="w-full mt-1.5 sm:mt-2 py-2 sm:py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                      >
                                        <Zap size={12} /> Resume Auction
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Waiting room info */}
                                      <div className="flex items-start gap-2.5 px-2.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl">
                                        <Clock
                                          size={14}
                                          className="text-gray-400 mt-0.5 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300">
                                            Auction Not Started
                                          </p>
                                          <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium mt-0.5">
                                            This room is still waiting in the lobby for the host to start bidding.
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() =>
                                          navigate(
                                            withServerParam(
                                              `/lobby/${session.roomId}`,
                                              session.server,
                                            ),
                                          )
                                        }
                                        className="w-full mt-1.5 sm:mt-2 py-2 sm:py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                      >
                                        <Zap size={12} /> Resume / Join Auction
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {notice && (
              <p className="mt-4 text-xs text-amber-400 font-bold text-center">
                {notice}
              </p>
            )}

            {error && (
              <p className="mt-4 text-xs text-red-500 font-bold text-center">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete This Room?"
        description="This permanently removes the room and its squad history for everyone. This action cannot be undone."
        detail={sessionToDelete ? `Room ${sessionToDelete.roomId}` : ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteHistory}
        onCancel={() => setSessionToDelete(null)}
      />

      <Footer />
    </main>
  );
};

export default LandingPage;
