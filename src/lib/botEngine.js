import { IPL_PLAYERS } from '../data/players.js';
import { TEAMS } from '../data/teams.js';
import { countOverseas, isOverseasPlayer, toFiniteNumber } from './auctionDisplay.js';
import { getNextBidAmount } from './auctionRules.js';

/**
 * Player Set → Tier Multipliers
 * Controls how aggressively bots value players from each set.
 * Higher = more willing to pay a premium.
 */
const SET_TIER = {
  'Marquee Set 1': { base: 2.2, max: 4.5 },  // Elite marquee (Bumrah, SKY, etc.)
  'Set 1':         { base: 1.5, max: 3.0 },  // Capped Indian stars
  'Set 2':         { base: 1.2, max: 2.2 },  // Good capped players
  'Set 3':         { base: 1.0, max: 1.7 },  // Decent capped players
  'Set 4':         { base: 0.8, max: 1.4 },  // Fringe capped
  'AL1':           { base: 1.3, max: 2.5 },  // Overseas All-rounders
  'WK1':           { base: 1.3, max: 2.4 },  // Overseas Wicketkeepers
  'FA1':           { base: 1.2, max: 2.2 },  // Overseas Fast Bowlers
  'UBA1':          { base: 0.9, max: 1.5 },  // Uncapped Batsmen Tier 1
  'UAL1':          { base: 0.9, max: 1.6 },  // Uncapped All-Rounders T1
  'UWK1':          { base: 0.8, max: 1.4 },  // Uncapped WK T1
  'UFA1':          { base: 0.8, max: 1.3 },  // Uncapped Fast T1
  'USP1':          { base: 0.7, max: 1.2 },  // Uncapped Spinners T1
  'BA2':           { base: 0.7, max: 1.2 },  // Capped batsmen tier 2
  'AL2':           { base: 0.7, max: 1.2 },  // Overseas All-rounders T2
  'WK2':           { base: 0.7, max: 1.1 },  // Overseas WK T2
  'FA2':           { base: 0.7, max: 1.1 },  // Overseas Fast T2
  'SP2':           { base: 0.6, max: 1.0 },  // Spinners T2
  'UBA2':          { base: 0.6, max: 1.0 },  // Uncapped Batsmen T2
  'UAL2':          { base: 0.6, max: 1.0 },  // Uncapped All-Rounders T2
  'UWK2':          { base: 0.5, max: 0.9 },  // Uncapped WK T2
  'UFA2':          { base: 0.5, max: 0.9 },  // Uncapped Fast T2
};

/**
 * Team Personality Preferences
 * Each team has unique role affinities that boost their max willingness for certain player types.
 * Values are multipliers applied on top of the tier valuation.
 */
const TEAM_PREFERENCES = {
  CSK: {
    roles: { 'All-Rounder': 1.40, 'Bowler': 1.25 },
    sets: { 'Marquee Set 1': 1.20 },
    personality: 'conservative', // CSK: steady, rarely overpays, loves experience
  },
  MI: {
    roles: { 'Bowler': 1.35, 'Batsman': 1.20 },
    sets: { 'Marquee Set 1': 1.30, 'Set 1': 1.15 },
    personality: 'aggressive',   // MI: goes hard on star players
  },
  RCB: {
    roles: { 'Batsman': 1.45, 'All-Rounder': 1.20 },
    sets: { 'Marquee Set 1': 1.35, 'AL1': 1.20 },
    personality: 'aggressive',   // RCB: overpays for big batting names
  },
  KKR: {
    roles: { 'Bowler': 1.30, 'All-Rounder': 1.25 },
    sets: { 'Set 1': 1.15 },
    personality: 'balanced',
  },
  DC: {
    roles: { 'Bowler': 1.30, 'Wicketkeeper': 1.25 },
    sets: { 'UFA1': 1.20, 'UBA1': 1.15 },
    personality: 'value',        // DC: hunts value/uncapped
  },
  PBKS: {
    roles: { 'Batsman': 1.25, 'All-Rounder': 1.15 },
    sets: { 'UBA1': 1.30, 'UAL1': 1.25 },
    personality: 'value',        // PBKS: bets on uncapped talent
  },
  RR: {
    roles: { 'All-Rounder': 1.35, 'Bowler': 1.20 },
    sets: { 'UBA1': 1.30, 'UAL1': 1.25, 'UFA1': 1.20 },
    personality: 'value',        // RR: analytical, loves undervalued gems
  },
  SRH: {
    roles: { 'Bowler': 1.40, 'Batsman': 1.25 },
    sets: { 'FA1': 1.25, 'Set 1': 1.15 },
    personality: 'balanced',
  },
  GT: {
    roles: { 'All-Rounder': 1.30, 'Bowler': 1.20 },
    sets: { 'Set 2': 1.15, 'Set 3': 1.10 },
    personality: 'conservative',
  },
  LSG: {
    roles: { 'Wicketkeeper': 1.35, 'Batsman': 1.20 },
    sets: { 'WK1': 1.25, 'Set 2': 1.15 },
    personality: 'balanced',
  },
};

/**
 * Computes a bot's max valuation for a player.
 * Returns a value in Cr that varies per team, per player, and per auction run.
 */
export function computeBotValuation({
  player,
  botTeam,
  squadLimit = 25,
  budgetRemaining,
  initialBudget = 120,
  randomFn = Math.random,
}) {
  const basePrice = toFiniteNumber(player.basePrice, 0.30);
  const set = player.set || 'Set 4';
  const teamId = botTeam.teamId;

  // 1. Set tier drives the baseline
  let tier = SET_TIER[set];
  if (!tier) {
    if (set === 'Legends') {
      const r = Number(player.rating) || 75;
      if (r >= 90) tier = { base: 5.5, max: 9.5 };
      else if (r >= 82) tier = { base: 3.5, max: 6.5 };
      else if (r >= 75) tier = { base: 2.2, max: 4.8 };
      else if (r >= 65) tier = { base: 1.4, max: 2.8 };
      else tier = { base: 1.0, max: 1.8 };
    } else {
      tier = { base: 0.7, max: 1.1 };
    }
  }

  // 2. Player rating scaling for modern players (baseline 78 = average starter)
  const rating = Number(player.rating) || 75;
  const ratingMult = set === 'Legends' ? 1.0 : Math.max(0.65, Math.pow(rating / 78, 1.85));

  // 3. Franchise loyalty & icon affinity (boost if player belongs/belonged to this team)
  const isLoyalFranchise = Boolean(
    player.team && teamId && player.team.trim().toUpperCase() === teamId.trim().toUpperCase()
  );
  const loyaltyMult = isLoyalFranchise ? 1.25 : 1.0;

  // 4. Dynamic role deficit & team need urgency
  const squad = botTeam.squad || [];
  const squadCount = squad.length;
  let roleNeedMult = 1.0;

  if (squadCount >= 2) {
    let roleCount = 0;
    for (const s of squad) {
      const pid = typeof s === 'string' ? s : s?.id;
      const sRole = typeof s === 'object' && s?.role ? s.role : null;
      const pInfo = sRole ? null : IPL_PLAYERS.find((p) => p.id === pid);
      const role = sRole || pInfo?.role;
      if (role === player.role) {
        roleCount++;
      }
    }

    if (player.role === 'Wicket-Keeper' && roleCount === 0) {
      roleNeedMult = squadCount >= 4 ? 1.40 : 1.20;
    } else if (player.role === 'Bowler' && roleCount <= 1 && squadCount >= 5) {
      roleNeedMult = 1.30;
    } else if (player.role === 'Batsman' && roleCount <= 1 && squadCount >= 5) {
      roleNeedMult = 1.20;
    } else {
      const roleCapacity = Math.max(3, Math.ceil(squadLimit * 0.35));
      if (roleCount >= roleCapacity) {
        roleNeedMult = 0.75; // cooling off saturated role to preserve budget
      }
    }
  }

  // 5. Team preferences & manager archetypes
  const prefs = TEAM_PREFERENCES[teamId] || {};
  let personalityMult = 1.0;
  if (prefs.roles && prefs.roles[player.role]) {
    personalityMult *= prefs.roles[player.role];
  }
  if (prefs.sets && prefs.sets[set]) {
    personalityMult *= prefs.sets[set];
  }

  let archetype = botTeam.archetype;
  if (!archetype && botTeam.auctionId) {
    const ARCHETYPES = ['star_hunter', 'moneyball', 'bowling_first', 'balanced'];
    let hash = 0;
    const str = String(botTeam.auctionId) + String(teamId || '');
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    archetype = ARCHETYPES[hash % ARCHETYPES.length];
  }
  if (!archetype) archetype = prefs.personality || 'balanced';
  let archetypeMult = 1.0;
  if (archetype === 'star_hunter' || archetype === 'aggressive') {
    if (rating >= 88) archetypeMult = 1.20;
    else if (rating < 76) archetypeMult = 0.85;
  } else if (archetype === 'moneyball' || archetype === 'value') {
    if (rating >= 78 && rating <= 86) archetypeMult = 1.15;
    else if (rating >= 90) archetypeMult = 0.90;
  } else if (archetype === 'bowling_first') {
    if (player.role === 'Bowler') archetypeMult = 1.25;
    else if (player.role === 'All-Rounder') archetypeMult = 1.10;
  }

  // 6. Per-bot random willingness & auction stage pacing
  const willingnessFactor = tier.base + randomFn() * (tier.max - tier.base);
  const budgetUsed = 1 - (budgetRemaining / (initialBudget || 120));
  const urgencyBoost = 1.0 + budgetUsed * 0.25;

  // 7. Squad completion pressure
  const slotsLeft = squadLimit - squadCount;
  const squadUrgency = slotsLeft <= 3 ? 1.15 : 1.0;

  // 8. Final max valuation calculation
  const effectiveBase = set === 'Legends' ? Math.max(basePrice, 1.0) : basePrice;
  let maxVal = effectiveBase * willingnessFactor * ratingMult * loyaltyMult * roleNeedMult * personalityMult * archetypeMult * urgencyBoost * squadUrgency;

  // Spend cap safeguards
  const maxCapPercent = (archetype === 'star_hunter' || prefs.personality === 'aggressive') ? 0.45
    : (archetype === 'moneyball' || prefs.personality === 'conservative') ? 0.26
    : 0.35;
  maxVal = Math.min(maxVal, budgetRemaining * maxCapPercent);

  // Reserve budget safety: minimum 0.30 Cr per remaining slot
  if (slotsLeft > 1) {
    const maxAffordable = Math.max(basePrice, budgetRemaining - (slotsLeft - 1) * 0.30);
    maxVal = Math.min(maxVal, maxAffordable);
  }

  maxVal = Math.max(basePrice, maxVal);
  return parseFloat(maxVal.toFixed(2));
}

/**
 * Evaluates whether a Bot Team should place a bid on the current auction player.
 *
 * @param {Object} params
 * @param {Object} params.player - Current IPL player object
 * @param {number} params.currentBid - Current live bid amount in Cr
 * @param {string} params.highBidderId - User ID of current highest bidder
 * @param {Object} params.botTeam - Team state for this bot (budgetRemaining, squad)
 * @param {number} params.squadLimit - Room squad size limit (e.g. 25, 11, 5)
 * @param {number} params.overseasLimit - Overseas quota (e.g. 8, 4, 2)
 * @param {number} params.initialBudget - Starting budget for the auction mode
 * @returns {Object|null} Bid decision object if bot should bid, or null
 */
export function evaluateBotBid({
  player,
  currentBid,
  highBidderId,
  botTeam,
  squadLimit = 25,
  overseasLimit = 8,
  initialBudget = 120.0,
  randomFn = Math.random,
}) {
  if (!player || !botTeam) return null;

  const botUserId = botTeam.userId;
  const teamId = botTeam.teamId;

  // 1. Don't outbid yourself
  if (highBidderId === botUserId) return null;

  // 2. Squad size limit check
  const currentSquad = botTeam.squad || [];
  if (currentSquad.length >= squadLimit) return null;

  // 3. Overseas limit check
  const isOverseas = isOverseasPlayer(player);
  if (isOverseas) {
    const currentOverseasCount = countOverseas(currentSquad, IPL_PLAYERS);
    if (currentOverseasCount >= overseasLimit) return null;
  }

  // 4. Role Balance Check — soft caps to avoid over-stacking one role
  const slotsRemaining = squadLimit - currentSquad.length;
  const currentRoleCount = currentSquad.reduce((acc, s) => {
    const sRole = typeof s === 'object' && s?.role ? s.role : null;
    const pInfo = sRole ? null : IPL_PLAYERS.find(p => p.id === (typeof s === 'string' ? s : s.id));
    const role = sRole || pInfo?.role;
    return role === player.role ? acc + 1 : acc;
  }, 0);
  const maxPerRole = squadLimit <= 5 ? 3 : squadLimit <= 11 ? 5 : 9;
  if (currentRoleCount >= maxPerRole && slotsRemaining > 1) return null;

  // 5. Calculate the next incremental bid amount
  const nextBid = getNextBidAmount(player, currentBid);

  // 6. Budget check
  const budgetRemaining = botTeam.budgetRemaining ?? initialBudget;
  if (budgetRemaining < nextBid) return null;

  // Reserve budget safety: ensure enough average budget for remaining slots
  const remainingAfterBid = budgetRemaining - nextBid;
  if (slotsRemaining > 1 && (remainingAfterBid / (slotsRemaining - 1)) < 0.30) {
    return null; // protect purse for remaining squad slots
  }

  // 7. Compute this bot's max valuation for this player (varies per team + per run)
  const maxValuation = computeBotValuation({
    player,
    botTeam,
    squadLimit,
    budgetRemaining,
    initialBudget,
    randomFn,
  });

  // 8. Bidding decision — only bid if next bid is within valuation
  if (nextBid > maxValuation) return null;

  // 9. Graduated willingness — as price climbs toward max, bot gets progressively
  //    less likely to bid (simulates hesitation / second thoughts mid-auction)
  const priceRatio = nextBid / maxValuation; // 0 = cheap, 1 = at max
  let baseBidChance = priceRatio < 0.50 ? 0.95   // well below max → almost always bid
    : priceRatio < 0.70 ? 0.82                      // mid-range → usually bid
    : priceRatio < 0.85 ? 0.65                      // getting pricey → sometimes drop
    : 0.40;                                          // near ceiling → coin-flip drop-off

  // Franchise loyalty tenacity: team fights harder near ceiling for their own icon
  const isLoyalFranchise = Boolean(
    player.team && teamId && player.team.trim().toUpperCase() === teamId.trim().toUpperCase()
  );
  if (isLoyalFranchise && priceRatio >= 0.70) {
    baseBidChance = Math.min(0.90, baseBidChance + 0.20);
  }

  if (randomFn() > baseBidChance) return null;

  return {
    shouldBid: true,
    botUserId,
    teamId,
    nextBid,
    maxValuation,
  };
}
