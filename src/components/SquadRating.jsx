import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import { getAuctionAiRating, generateAuctionAiRating } from '../lib/directoryApi';

const SquadRating = ({ roomTeams = [], currentAuction, auctionId: propAuctionId, isHost = false }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
    if (type === 'mega') return 18;
    if (type === 'sprint11') return 11;
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
        auctionType === 'sprint11'
          ? '11-Classic (11 players per team, no bench. Requires balanced playing XI: solid top order, reliable keeper, and at least 5 bowling options.)'
          : auctionType === 'sprint5'
          ? '5-Sprint (5 players per team. High-octane sprint: Requires explosive hitters, 1 keeper, and lethal strike/death bowlers. High individual impact matters most.)'
          : 'Mega Auction (18-25 players per team. Full IPL squad: Requires starting XI excellence plus dependable bench depth and variety.)';

      const allTeamsData = roomTeams.map((team) => {
        const teamId = team.teamId || team.team_id;
        const squad = team.squad || [];
        const squadArr = Array.isArray(squad) ? squad : squad ? Object.values(squad) : [];
        const teamInfo = TEAMS.find((t) => t.id === teamId);

        const playersWithInfo = squadArr
          .map((s) => {
            const pid = typeof s === 'string' ? s : s?.id;
            const info = IPL_PLAYERS.find((p) => p.id === pid);
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

      // 3. Request evaluation ONLY for eligible teams (cached in D1 on backend)
      const genRes = await generateAuctionAiRating(auctionId, {
        mode,
        teams: eligibleTeams,
        force,
      });

      if (genRes?.analysis) {
        const aiTeams = genRes.analysis.teams || [];
        const mergedTeams = [
          ...aiTeams,
          ...disqualifiedTeams.filter(
            (dt) => !aiTeams.some((at) => String(at.teamId || '').toUpperCase() === String(dt.teamId || '').toUpperCase())
          ),
        ];

        const finalAnalysis = {
          ...genRes.analysis,
          teams: mergedTeams,
        };

        try {
          localStorage.setItem(`crickauction_ai_${auctionId}`, JSON.stringify(finalAnalysis));
        } catch {}
        setAiAnalysis(finalAnalysis);
      }
      if (genRes?.cooldown) {
        setCooldown(genRes.cooldown);
      } else if (force) {
        setCooldown(60);
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

      normalizedPlayers.forEach(pId => {
        const playerInfo = IPL_PLAYERS.find(p => p.id === pId);
        if (playerInfo && playerInfo.rating) {
          totalRating += playerInfo.rating;
        }
      });

      const teamInfo = TEAMS.find(t => t.id === teamId);
      const isDisqualified = normalizedPlayers.length < minPlayers;
      const aiTeam = aiAnalysis?.teams?.find(
        (t) => String(t.teamId || '').toUpperCase() === String(teamId || '').toUpperCase()
      );

      return {
        userId,
        userName: userName || (teamInfo ? teamInfo.name : teamId),
        teamId,
        teamName: teamInfo?.name || teamId,
        teamLogo: teamInfo?.logo || null,
        avgRating: normalizedPlayers.length > 0 ? Number((totalRating / normalizedPlayers.length).toFixed(1)) : 0,
        playerCount: normalizedPlayers.length,
        isDisqualified,
        aiScore: isDisqualified ? (aiAnalysis ? 0 : undefined) : aiTeam?.score,
        aiGrade: isDisqualified ? (aiAnalysis ? 'F' : undefined) : aiTeam?.grade,
        aiTitle: isDisqualified ? 'Disqualified' : aiTeam?.title,
        aiVerdict: isDisqualified
          ? `Disqualified: Did not meet the minimum requirement of ${minPlayers} players (${normalizedPlayers.length}/${minPlayers} signed).`
          : aiTeam?.verdict,
      };
    }).sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      if (a.aiScore !== undefined && b.aiScore !== undefined) {
        return b.aiScore - a.aiScore;
      }
      return b.avgRating - a.avgRating;
    });
  }, [roomTeams, minPlayers, aiAnalysis]);

  const winnerTeam = useMemo(() => {
    if (!aiAnalysis?.winner?.teamId) return null;
    return TEAMS.find(t => t.id === aiAnalysis.winner.teamId) || { name: aiAnalysis.winner.teamId };
  }, [aiAnalysis]);

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
      <div className="flex items-center justify-between gap-3 px-1 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-pixel uppercase tracking-tight text-white">
            Franchise Strength
          </h2>
          <p className="text-xs sm:text-sm font-sans text-slate-400 mt-0.5">
            Full squad evaluation based on AI scout analysis
          </p>
        </div>
        {isHost && aiAnalysis && (
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

      {/* Host Generation Callout */}
      {!aiLoading && !aiAnalysis && isHost && (
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
      {!aiLoading && !aiAnalysis && !isHost && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0c0d10] border border-white/10 text-center relative overflow-hidden"
        >
          <div className="max-w-md mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-pixel uppercase tracking-widest text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
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
      {aiAnalysis?.winner && (
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
      {aiLoading && (
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
                    {team.aiGrade && (
                      <span className="font-pixel text-[7px] sm:text-[8px] uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded shrink-0">
                        Grade {team.aiGrade}
                      </span>
                    )}
                  </div>

                  {team.aiVerdict && (
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

              {/* Score / AI Rating Column */}
              <div className="flex flex-col items-end justify-center relative z-10 shrink-0 pl-2 sm:pl-5">
                <span className={`block font-pixel text-[7px] sm:text-[8px] uppercase tracking-widest mb-0.5 ${team.isDisqualified ? 'text-red-400' : 'text-slate-400'}`}>
                  AI Rating
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-xl sm:text-3xl font-black leading-none ${team.isDisqualified ? 'text-red-600/50' : 'text-white'}`}>
                    {team.aiScore !== undefined ? team.aiScore : '—'}
                  </span>
                  {team.aiScore !== undefined && (
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
