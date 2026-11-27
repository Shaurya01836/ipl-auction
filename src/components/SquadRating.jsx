import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_PLAYERS } from '../lib/auctionRules';
import { findTeamById } from '../data/teams';
import { getAuctionAiRating, generateAuctionAiRating } from '../lib/directoryApi';
import { computeSquadDepartmentBalance } from '../lib/auctionDisplay';

function generateTacticalScoutAnalysis(eligibleTeams, mode) {
  const scoredTeams = eligibleTeams.map((t) => {
    const players = t.playersWithInfo || [];
    const count = players.length;
    const avgRating = count > 0
      ? players.reduce((sum, p) => sum + (p.rating || 75), 0) / count
      : 75;

    const bowlers = players.filter((p) => p.role === 'Bowler').length;
    const allRounders = players.filter((p) => p.role === 'All-Rounder').length;
    const batsmen = players.filter((p) => p.role === 'Batsman').length;
    const keepers = players.filter((p) => p.role === 'Wicket-Keeper').length;

    let balanceBonus = 0;
    if (keepers >= 1) balanceBonus += 2;
    if (bowlers + allRounders >= 4) balanceBonus += 3;
    if (batsmen >= 3) balanceBonus += 2;

    const rawScore = Math.round(avgRating * 0.95 + balanceBonus);
    const score = Math.min(98, Math.max(55, rawScore));

    let grade = 'B';
    if (score >= 90) grade = 'A+';
    else if (score >= 82) grade = 'A';
    else if (score >= 75) grade = 'B+';
    else if (score >= 68) grade = 'B';
    else grade = 'C';

    let title = 'Balanced Contender';
    let verdict = `Solid squad depth with dependable balance for ${mode}.`;

    if (bowlers >= 4 && bowlers > batsmen) {
      title = 'Bowling Powerhouse';
      verdict = 'Formidable bowling lineup with genuine wicket-takers and death-over specialists.';
    } else if (batsmen >= 4 && batsmen > bowlers) {
      title = 'Batting Heavyweights';
      verdict = 'Explosive batting depth capable of chasing or setting tournament-winning totals.';
    } else if (allRounders >= 3) {
      title = 'Dynamic All-Round XI';
      verdict = 'Outstanding tactical flexibility with multi-dimensional match-winners.';
    } else if (score >= 85) {
      title = 'Tournament Favorites';
      verdict = 'Complete roster balance with match-winners across powerplay, middle, and death phases.';
    }

    return {
      teamId: t.teamId,
      score,
      grade,
      title,
      verdict,
    };
  });

  scoredTeams.sort((a, b) => b.score - a.score);
  const best = scoredTeams[0];
  const winner = best
    ? {
        teamId: best.teamId,
        score: best.score,
        badge: 'Best Overall Squad',
        title: 'Tournament Champions',
        verdict: `${best.teamId} assembled the highest-rated squad for ${mode}, combining star power with complete tactical balance.`,
      }
    : null;

  return {
    winner,
    teams: scoredTeams,
    generatedAt: Date.now(),
  };
}

const SquadRating = ({ roomTeams = [], currentAuction, auctionId: propAuctionId, isHost = false }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [ratingMode, setRatingMode] = useState('normal'); // 'normal' (player data) | 'ai' (AI scout)

  const auctionId = propAuctionId || currentAuction?.id;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const minPlayers = useMemo(() => {
    const type = currentAuction?.auctionType || 'mega';
    if (type === 'mega' || type === 'mini') return 18;
    if (type === 'hundred') return 11;
    if (type === 'sprint11' || type === 'legends') return 11;
    if (type === 'sprint5') return 5;
    return currentAuction?.settings?.minPlayers || 18;
  }, [currentAuction]);

  const loadAiAnalysis = useCallback(async (force = false) => {
    if (!auctionId || roomTeams.length === 0) return;

    if (!force) {
      // 0. Check client-side localStorage cache (must have modern score)
      try {
        const localCached = localStorage.getItem(`crickauction_ai_${auctionId}`);
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (parsed?.winner && parsed.winner.score !== undefined) {
            setAiAnalysis(parsed);
            return;
          }
        }
      } catch {}
    }

    setAiLoading(true);
    try {
      if (!force) {
        // 1. Check if analysis is already cached in D1
        const cachedRes = await getAuctionAiRating(auctionId);
        if (cachedRes?.analysis?.winner && cachedRes.analysis.winner.score !== undefined) {
          try {
            localStorage.setItem(`crickauction_ai_${auctionId}`, JSON.stringify(cachedRes.analysis));
          } catch {}
          setAiAnalysis(cachedRes.analysis);
        }
        // Do not auto-generate on load: generation is host-triggered only
        setAiLoading(false);
        return;
      }

      // 2. Host-initiated evaluation: build token-friendly payload with all squad players + format context
      const auctionType = currentAuction?.auctionType || 'mega';
      const mode =
        auctionType === 'hundred'
          ? 'The Hundred UK (11-16 players per team, £2.05M cap, max 4 overseas. Requires explosive top order, 1 keeper, and balanced 100-ball bowling depth.)'
          : auctionType === 'legends'
          ? 'Legends XI (11 players per team. All-time T20/IPL legends dream XI: Requires iconic top order, legendary keeper, and ATG bowling attack.)'
          : auctionType === 'sprint11'
          ? '11-Classic (11 players per team, no bench. Requires balanced playing XI: solid top order, reliable keeper, and at least 5 bowling options.)'
          : auctionType === 'sprint5'
          ? '5-Sprint (5 players per team. High-octane sprint: Requires explosive hitters, 1 keeper, and lethal strike/death bowlers. High individual impact matters most.)'
          : auctionType === 'mini'
          ? 'IPL Mini Auction (18-25 players per team. Full IPL squad: Teams start with retained cores and bid on released players to complete their 25-man squad.)'
          : 'Mega Auction (18-25 players per team. Full IPL squad: Requires starting XI excellence plus dependable bench depth and variety.)';

      const allTeamsData = roomTeams.map((team) => {
        const teamId = team.teamId || team.team_id;
        const squad = team.squad || [];
        const squadArr = Array.isArray(squad) ? squad : squad ? Object.values(squad) : [];
        const teamInfo = findTeamById(teamId);

        const playersWithInfo = squadArr
          .map((s) => {
            const pid = typeof s === 'string' ? s : s?.id;
            const info = ALL_PLAYERS.find((p) => p.id === pid);
            return {
              name: info?.name || pid,
              role: info?.role || 'Player',
              rating: info?.rating || 0,
            };
          })
          .filter((p) => p.name);

        const roster = playersWithInfo
          .map((p) => `${p.name} (${p.role}${p.rating ? ' ' + p.rating : ''})`)
          .join(', ');

        return {
          teamId,
          teamName: teamInfo?.name || teamId,
          spent: team.spent || 0,
          playerCount: playersWithInfo.length,
          isDisqualified: playersWithInfo.length < minPlayers,
          roster: roster || 'None',
          playersWithInfo,
        };
      });

      // Directly disqualify teams with incomplete squads and never send their rosters to AI
      const eligibleTeams = allTeamsData.filter((t) => !t.isDisqualified);
      const disqualifiedTeams = allTeamsData
        .filter((t) => t.isDisqualified)
        .map((t) => ({
          teamId: t.teamId,
          score: 0,
          grade: 'F',
          title: 'Disqualified',
          verdict: `Disqualified: Did not meet the minimum ${minPlayers} players required for this format (${t.playerCount}/${minPlayers} signed).`,
        }));

      if (eligibleTeams.length === 0) {
        const allDisqualifiedAnalysis = {
          winner: null,
          generatedAt: Date.now(),
          teams: disqualifiedTeams,
        };
        try {
          localStorage.setItem(`crickauction_ai_${auctionId}`, JSON.stringify(allDisqualifiedAnalysis));
        } catch {}
        setAiAnalysis(allDisqualifiedAnalysis);
        setAiLoading(false);
        return;
      }

      // 3. Request evaluation (Cloud D1/Groq or resilient local tactical engine)
      let resolvedAnalysis = null;
      let remoteCooldown = 0;

      try {
        const genRes = await generateAuctionAiRating(auctionId, {
          mode,
          teams: eligibleTeams,
          force,
        });

        if (genRes?.analysis && genRes.analysis.winner) {
          resolvedAnalysis = genRes.analysis;
          remoteCooldown = genRes.cooldown || 60;
        }
      } catch (cloudErr) {
        console.warn('[SquadRating] Cloud AI unreachable, using tactical scout engine', cloudErr);
      }

      // If Cloud AI is unavailable or unconfigured, gracefully fallback to tactical scout engine
      if (!resolvedAnalysis || !resolvedAnalysis.winner) {
        resolvedAnalysis = generateTacticalScoutAnalysis(eligibleTeams, mode);
        remoteCooldown = 10;
      }

      const aiTeams = resolvedAnalysis.teams || [];
      const mergedTeams = [
        ...aiTeams,
        ...disqualifiedTeams.filter(
          (dt) => !aiTeams.some((at) => String(at.teamId || '').toUpperCase() === String(dt.teamId || '').toUpperCase())
        ),
      ];

      const finalAnalysis = {
        ...resolvedAnalysis,
        teams: mergedTeams,
      };

      try {
        localStorage.setItem(`crickauction_ai_${auctionId}`, JSON.stringify(finalAnalysis));
      } catch {}
      setAiAnalysis(finalAnalysis);
      if (remoteCooldown > 0) {
        setCooldown(remoteCooldown);
      }
    } catch (err) {
      console.warn('[SquadRating] AI analysis unavailable', err);
    } finally {
      setAiLoading(false);
    }
  }, [auctionId, roomTeams, currentAuction?.auctionType]);

  useEffect(() => {
    loadAiAnalysis(false);
  }, [loadAiAnalysis]);

  const calculatedLeaderboard = useMemo(() => {
    return roomTeams.map(team => {
      const teamId = team.teamId || team.team_id;
      const userId = team.userId || team.user_id;
      const userName = team.userName || team.teamName || team.team_name;
      const squad = team.squad || [];
      const squadArr = Array.isArray(squad) ? squad : (squad ? Object.values(squad) : []);

      let totalRating = 0;
      const normalizedPlayers = squadArr.map(p => typeof p === 'string' ? p : (p?.id || p));
      const playersWithInfo = [];

      normalizedPlayers.forEach(pId => {
        const playerInfo = ALL_PLAYERS.find(p => p.id === pId);
        if (playerInfo && playerInfo.rating) {
          totalRating += playerInfo.rating;
        }
        if (playerInfo) {
          playersWithInfo.push(playerInfo);
        }
      });

      const teamInfo = findTeamById(teamId);
      const isDisqualified = normalizedPlayers.length < minPlayers;
      const departmentBalance = computeSquadDepartmentBalance(playersWithInfo, isDisqualified);
      const aiTeam = aiAnalysis?.teams?.find(
        (t) => String(t.teamId || '').toUpperCase() === String(teamId || '').toUpperCase()
      );

      return {
        userId,
        userName: userName || (teamInfo ? teamInfo.name : teamId),
        teamId,
        teamName: teamInfo?.name || teamId,
        teamLogo: teamInfo?.logo || null,
        totalRating,
        avgRating: normalizedPlayers.length > 0 ? Number((totalRating / normalizedPlayers.length).toFixed(1)) : 0,
        playerCount: normalizedPlayers.length,
        isDisqualified,
        ...departmentBalance,
        aiScore: isDisqualified ? (aiAnalysis ? 0 : undefined) : aiTeam?.score,
        aiGrade: isDisqualified ? (aiAnalysis ? 'F' : undefined) : aiTeam?.grade,
        aiTitle: isDisqualified ? 'Disqualified' : aiTeam?.title,
        aiVerdict: isDisqualified
          ? `Disqualified: Did not meet the minimum requirement of ${minPlayers} players (${normalizedPlayers.length}/${minPlayers} signed).`
          : aiTeam?.verdict,
      };
    }).sort((a, b) => {
      if (ratingMode === 'normal') {
        if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
        if (b.balancedRating !== a.balancedRating) return b.balancedRating - a.balancedRating;
        if (b.rawAvgRating !== a.rawAvgRating) return b.rawAvgRating - a.rawAvgRating;
        if (b.totalRating !== a.totalRating) return b.totalRating - a.totalRating;
        return a.teamName.localeCompare(b.teamName);
      }
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      if (a.aiScore !== undefined && b.aiScore !== undefined) {
        return b.aiScore - a.aiScore;
      }
      return b.balancedRating - a.balancedRating;
    });
  }, [roomTeams, minPlayers, aiAnalysis, ratingMode]);

  const winnerTeam = useMemo(() => {
    if (!aiAnalysis?.winner?.teamId) return null;
    return findTeamById(aiAnalysis.winner.teamId) || { name: aiAnalysis.winner.teamId };
  }, [aiAnalysis]);

  const topNormalTeam = useMemo(() => {
    return calculatedLeaderboard.find(t => !t.isDisqualified && t.balancedRating > 0) || calculatedLeaderboard[0] || null;
  }, [calculatedLeaderboard]);

  if (roomTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Users className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-300">No Squads Yet</h3>
        <p className="text-gray-500 mt-2">Squad ratings will appear once franchises start buying players.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-pixel uppercase tracking-tight text-white">
            Franchise Strength
          </h2>
          <p className="text-xs sm:text-sm font-sans text-slate-400 mt-0.5">
            {ratingMode === 'normal'
              ? 'Squad strength calculated from player dataset ratings'
              : 'Full squad evaluation based on AI scout analysis'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Rating Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setRatingMode('normal')}
              className={`px-3 py-1.5 rounded-lg font-pixel text-[9px] sm:text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                ratingMode === 'normal'
                  ? 'bg-white text-black font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Player Data</span>
            </button>
            <button
              type="button"
              onClick={() => setRatingMode('ai')}
              className={`px-3 py-1.5 rounded-lg font-pixel text-[9px] sm:text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                ratingMode === 'ai'
                  ? 'bg-white text-black font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={11} className={ratingMode === 'ai' ? 'text-black' : 'text-slate-400'} />
              <span>AI Scout</span>
            </button>
          </div>

          {ratingMode === 'ai' && isHost && aiAnalysis && (
            <button
              onClick={() => loadAiAnalysis(true)}
              disabled={aiLoading || cooldown > 0}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-pixel text-[9px] sm:text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 disabled:opacity-40 active:scale-[0.98] touch-manipulation cursor-pointer"
              title="Regenerate AI analysis with latest full-squad model"
            >
              <RefreshCw size={12} className={aiLoading ? 'animate-spin text-white' : 'text-slate-400'} />
              <span className="hidden sm:inline">
                {aiLoading ? 'Analyzing...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Re-analyze AI'}
              </span>
              <span className="sm:hidden">
                {aiLoading ? '...' : cooldown > 0 ? `${cooldown}s` : 'Refresh'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Player Data Leader Card */}
      {ratingMode === 'normal' && topNormalTeam && topNormalTeam.balancedRating > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#0c0d10] border border-white/15 p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] group"
        >
          {topNormalTeam.teamLogo && (
            <div className="absolute -right-8 -bottom-8 w-44 sm:w-64 h-44 sm:h-64 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none grayscale">
              <img src={topNormalTeam.teamLogo} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider">
                  Highest Rated Squad
                </span>
                <span className="font-pixel text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider">
                  Player Data & Balance Leader
                </span>
              </div>
              <span className="font-pixel font-bold text-[9px] sm:text-[10px] text-black bg-white px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-lg shadow-white/10">
                Rating {topNormalTeam.balancedRating} / 100
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">
              {topNormalTeam.teamName}
            </h3>

            <p className="font-sans text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              Assembled the top squad rating ({topNormalTeam.balancedRating}/100 across {topNormalTeam.playerCount} players), rewarded for strong department balance across batting and bowling.
            </p>
          </div>
        </motion.div>
      )}

      {/* Host Generation Callout */}
      {ratingMode === 'ai' && !aiLoading && !aiAnalysis && isHost && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0c0d10] border border-white/15 text-center relative overflow-hidden"
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-pixel uppercase tracking-widest text-slate-400">
              Host Controls
            </div>
            <h3 className="text-base sm:text-xl font-pixel uppercase tracking-tight text-white">
              Generate AI Squad Ratings
            </h3>
            <p className="text-xs font-sans text-slate-400 leading-relaxed">
              Run the AI Scout to evaluate all squad combinations, score franchise strength (0–100), and crown the winner.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => loadAiAnalysis(true)}
                disabled={aiLoading || cooldown > 0}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-pixel text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-40 inline-flex items-center gap-2"
              >
                {cooldown > 0 ? `Wait ${cooldown}s` : 'Generate AI Ratings'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Non-host Pending Notice */}
      {ratingMode === 'ai' && !aiLoading && !aiAnalysis && !isHost && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0c0d10] border border-white/10 text-center relative overflow-hidden"
        >
          <div className="max-w-md mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-pixel uppercase tracking-widest text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Awaiting Host Generation
            </div>
            <h3 className="text-base sm:text-lg font-pixel uppercase tracking-tight text-white">
              AI Squad Ratings Pending
            </h3>
            <p className="text-xs font-sans text-slate-400 leading-relaxed">
              Generating access belongs to the room host. Please ask the host to generate the AI squad ratings.
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Scout Winner Card (Theme Level 1 Surface) */}
      {ratingMode === 'ai' && aiAnalysis?.winner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#0c0d10] border border-white/15 p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] group"
        >
          {/* Background Watermark Logo */}
          {winnerTeam?.logo && (
            <div className="absolute -right-8 -bottom-8 w-44 sm:w-64 h-44 sm:h-64 opacity-[0.04] group-hover:opacity-[0.06] transition-opacity pointer-events-none grayscale">
              <img src={winnerTeam.logo} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="relative z-10">
            {/* Top Eyebrow Bar */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider">
                  AI Scout Winner
                </span>
                <span className="font-pixel text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider">
                  {aiAnalysis.winner.badge || 'Best Overall Squad'}
                </span>
              </div>
              {aiAnalysis.winner.score !== undefined && (
                <span className="font-pixel font-bold text-[9px] sm:text-[10px] text-black bg-white px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-lg shadow-white/10">
                  Rating {aiAnalysis.winner.score}/100
                </span>
              )}
            </div>

            {/* Winner Heading */}
            <h3 className="text-lg sm:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">
              {winnerTeam?.name || aiAnalysis.winner.teamId}
              {aiAnalysis.winner.title && (
                <span className="text-slate-300 ml-2 font-normal">
                  — {aiAnalysis.winner.title}
                </span>
              )}
            </h3>

            {/* Verdict */}
            <p className="font-sans text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              {aiAnalysis.winner.verdict}
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Loading indicator */}
      {ratingMode === 'ai' && aiLoading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0c0d10] border border-white/10 text-slate-400 font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider">
          <Loader2 size={13} className="animate-spin text-white shrink-0" />
          <span>AI Scout is analyzing all squad players and team balance...</span>
        </div>
      )}

      {/* Franchise Leaderboard Grid (Theme Level 2 Interactive Tiles) */}
      <div className="space-y-3 sm:space-y-4">
        {calculatedLeaderboard.map((team, idx) => {
          return (
            <motion.div 
              key={team.teamId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`w-full flex flex-row items-center justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-[1.75rem] bg-[#0c0d10] border transition-colors duration-200 relative overflow-hidden group gap-3 sm:gap-5 ${
                team.isDisqualified 
                  ? 'border-red-900/30 opacity-70 grayscale-[0.5]' 
                  : idx === 0 
                    ? 'border-white/20 bg-white/[0.04] shadow-2xl' 
                    : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
              }`}
            >
              {/* Background Watermark Logo */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 sm:w-56 sm:h-56 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none grayscale">
                {team.teamLogo && <img src={team.teamLogo} alt="" className="w-full h-full object-contain" />}
              </div>
              
              <div className="flex items-center gap-3 sm:gap-5 relative z-10 min-w-0 flex-1">
                {/* Team Icon Box */}
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-lg shrink-0 relative ${team.isDisqualified ? 'bg-red-950/20 border-red-900/30' : ''}`}>
                  {team.teamLogo ? (
                    <img src={team.teamLogo} alt={team.teamName} className={`w-full h-full object-contain ${team.isDisqualified ? 'opacity-50' : ''}`} />
                  ) : (
                    <Users className="w-full h-full text-slate-500 p-1" />
                  )}
                </div>
                
                {/* Team Details */}
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-slate-400 font-bold text-xs shrink-0">#{idx + 1}</span>
                    <h3 className={`font-pixel uppercase text-sm sm:text-xl tracking-tight transition-colors truncate ${team.isDisqualified ? 'text-gray-500' : 'text-white group-hover:text-slate-200'}`}>
                      {team.teamName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className={`font-pixel text-[7px] sm:text-[9px] uppercase tracking-wider leading-none truncate ${team.isDisqualified ? 'text-red-400' : 'text-slate-400'}`}>
                      {team.playerCount} / {minPlayers} Players
                    </p>
                    {team.isDisqualified && (
                      <span className="font-pixel text-[7px] sm:text-[8px] uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded shrink-0">
                        Disqualified
                      </span>
                    )}

                    {ratingMode === 'ai' && team.aiGrade && (
                      <span className="font-pixel text-[7px] sm:text-[8px] uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded shrink-0">
                        Grade {team.aiGrade}
                      </span>
                    )}
                  </div>

                  {ratingMode === 'ai' && team.aiVerdict && (
                    <p className="font-sans text-[11px] sm:text-xs text-slate-300 font-normal mt-1 leading-relaxed">
                      {team.aiTitle && (
                        <span className="font-pixel uppercase text-white text-[9px] sm:text-[10px] tracking-wide mr-1.5">
                          {team.aiTitle}:
                        </span>
                      )}
                      {team.aiVerdict}
                    </p>
                  )}
                </div>
              </div>

              {/* Score / Rating Column */}
              <div className="flex flex-col items-end justify-center relative z-10 shrink-0 pl-2 sm:pl-5">
                <span className={`block font-pixel text-[7px] sm:text-[8px] uppercase tracking-widest mb-0.5 ${team.isDisqualified ? 'text-red-400' : 'text-slate-400'}`}>
                  {ratingMode === 'normal' ? 'Squad Rating' : 'AI Rating'}
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-xl sm:text-3xl font-black leading-none ${team.isDisqualified ? 'text-red-600/50' : 'text-white'}`}>
                    {ratingMode === 'normal'
                      ? (team.balancedRating > 0 ? team.balancedRating : '—')
                      : (team.aiScore !== undefined ? team.aiScore : '—')}
                  </span>
                  {(ratingMode === 'normal' ? team.balancedRating > 0 : team.aiScore !== undefined) && (
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono font-bold">/100</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SquadRating;
