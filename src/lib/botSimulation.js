import { IPL_PLAYERS } from '../data/players.js';
import { TEAMS } from '../data/teams.js';
import { toFiniteNumber } from './auctionDisplay.js';
import { evaluateBotBid } from './botEngine.js';

/**
 * Checks whether a room qualifies as a single-player solo room against bots.
 * A solo-bot room has:
 *  - Exactly 1 human player
 *  - At least 1 AI bot
 */
export function isSoloBotRoom(players) {
  if (!Array.isArray(players) || players.length === 0) return false;
  const humanCount = players.filter(
    (p) => !p.isBot && !String(p.id).startsWith('bot_'),
  ).length;
  const botCount = players.filter(
    (p) => p.isBot || String(p.id).startsWith('bot_'),
  ).length;
  return humanCount === 1 && botCount >= 1;
}

/**
 * Simulates a single player lot strictly among AI bots in-memory.
 * Returns the winning bot and final bid, or unsold if no bot bids.
 */
export function simulateBotLot({
  player,
  botTeams,
  currentBid = 0,
  highBidderId = '',
  highBidderName = '',
  highBidderTeamId = '',
  squadLimit = 25,
  overseasLimit = 8,
  initialBudget = 120.0,
  randomFn = Math.random,
}) {
  if (!player || !Array.isArray(botTeams) || botTeams.length === 0) {
    return {
      isSold: false,
      winnerId: '',
      winnerName: 'No Bids',
      winnerTeamId: '',
      finalBid: 0,
    };
  }

  let runningBid = toFiniteNumber(currentBid, 0);
  let leadingBidderId = highBidderId || '';
  let leadingBidderName = highBidderName || '';
  let leadingTeamId = highBidderTeamId || '';

  // Up to 50 bidding iterations to prevent infinite loop
  let bidsPlaced = 0;
  let someoneBid = true;

  while (someoneBid && bidsPlaced < 50) {
    someoneBid = false;

    // Shuffle bots for fairness in tie-breaking
    const shuffled = [...botTeams].sort(() => randomFn() - 0.5);

    for (const botTeam of shuffled) {
      if (botTeam.userId === leadingBidderId) continue;

      const decision = evaluateBotBid({
        player,
        currentBid: runningBid,
        highBidderId: leadingBidderId,
        botTeam,
        squadLimit,
        overseasLimit,
        initialBudget,
        randomFn,
      });

      if (decision && decision.shouldBid) {
        runningBid = decision.nextBid;
        leadingBidderId = decision.botUserId;
        leadingTeamId = decision.teamId;
        const teamObj = TEAMS.find((t) => t.id === decision.teamId);
        leadingBidderName = teamObj ? `${teamObj.name} Bot` : 'Bot';
        someoneBid = true;
        bidsPlaced++;
        break; // Next bid step
      }
    }
  }

  const isSold = Boolean(leadingBidderId && runningBid > 0);

  return {
    isSold,
    winnerId: leadingBidderId,
    winnerName: leadingBidderName,
    winnerTeamId: leadingTeamId,
    finalBid: runningBid,
  };
}

/**
 * Fast-forwards the remaining auction for bots.
 * If human is the leading bidder on the live lot, awards it to them first.
 * Then runs through remaining players in order until all lots are resolved.
 */
export function simulateRemainingAuction({
  playerOrder = [],
  currentPlayerIndex = 0,
  currentLive = null,
  humanUserId = '',
  humanTeamId = '',
  teams = [],
  settings = {},
  squadLimit = 25,
  overseasLimit = 8,
  randomFn = Math.random,
}) {
  const initialBudget = toFiniteNumber(settings.budget, 120.0);

  // Deep clone teams to simulate in-memory without mutating inputs
  const simulatedTeams = teams.map((t) => ({
    ...t,
    squad: Array.isArray(t.squad) ? [...t.squad] : [],
    budgetRemaining: toFiniteNumber(t.budgetRemaining, initialBudget),
    spent: toFiniteNumber(t.spent, 0),
  }));

  const getTeam = (uid) => simulatedTeams.find((t) => t.userId === uid);

  // 1. Resolve current live lot if active
  if (currentLive && currentLive.status === 'bidding' && currentLive.playerId) {
    const livePlayer = IPL_PLAYERS.find((p) => p.id === currentLive.playerId);
    if (livePlayer) {
      // If human is leading bidder, award to human!
      if (currentLive.highBidderId === humanUserId) {
        const hTeam = getTeam(humanUserId);
        if (hTeam) {
          hTeam.squad.push({
            id: livePlayer.id,
            name: livePlayer.name,
            role: livePlayer.role,
            bid: currentLive.currentBid,
            team: humanTeamId,
          });
          hTeam.spent = toFiniteNumber(hTeam.spent, 0) + currentLive.currentBid;
          hTeam.budgetRemaining = Math.max(0, toFiniteNumber(hTeam.budgetRemaining, initialBudget) - currentLive.currentBid);
        }
      } else {
        // Let bots finish bidding on this lot
        const botTeams = simulatedTeams.filter((t) => t.userId !== humanUserId);
        const lotRes = simulateBotLot({
          player: livePlayer,
          botTeams,
          currentBid: currentLive.currentBid || 0,
          highBidderId: currentLive.highBidderId || '',
          highBidderName: currentLive.highBidderName || '',
          highBidderTeamId: currentLive.highBidderTeamId || '',
          squadLimit,
          overseasLimit,
          initialBudget,
          randomFn,
        });

        if (lotRes.isSold) {
          const wTeam = getTeam(lotRes.winnerId);
          if (wTeam) {
            wTeam.squad.push({
              id: livePlayer.id,
              name: livePlayer.name,
              role: livePlayer.role,
              bid: lotRes.finalBid,
              team: lotRes.winnerTeamId,
            });
            wTeam.spent = toFiniteNumber(wTeam.spent, 0) + lotRes.finalBid;
            wTeam.budgetRemaining = Math.max(0, toFiniteNumber(wTeam.budgetRemaining, initialBudget) - lotRes.finalBid);
          }
        }
      }
    }
  }

  // 2. Iterate remaining player order
  const remainingIndices = playerOrder.slice(currentPlayerIndex + 1);

  for (const pIdx of remainingIndices) {
    const player = IPL_PLAYERS[pIdx];
    if (!player) continue;

    const botTeams = simulatedTeams.filter((t) => t.userId !== humanUserId);
    const lotRes = simulateBotLot({
      player,
      botTeams,
      currentBid: 0,
      highBidderId: '',
      highBidderName: '',
      highBidderTeamId: '',
      squadLimit,
      overseasLimit,
      initialBudget,
      randomFn,
    });

    if (lotRes.isSold) {
      const wTeam = getTeam(lotRes.winnerId);
      if (wTeam) {
        wTeam.squad.push({
          id: player.id,
          name: player.name,
          role: player.role,
          bid: lotRes.finalBid,
          team: lotRes.winnerTeamId,
        });
        wTeam.spent = toFiniteNumber(wTeam.spent, 0) + lotRes.finalBid;
        wTeam.budgetRemaining = Math.max(0, toFiniteNumber(wTeam.budgetRemaining, initialBudget) - lotRes.finalBid);
      }
    }
  }

  return {
    simulatedTeams,
    fastForwarded: true,
  };
}

