import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';

/**
 * Team Personality Preferences (Bonus Max Bid Multipliers)
 */
const TEAM_PREFERENCES = {
  CSK: { allRounderBonus: 1.5, spinnerBonus: 1.5, expBonus: 1.2 },
  MI: { fastBowlerBonus: 2.0, openerBonus: 1.8, starBonus: 1.5 },
  RCB: { topBatsmanBonus: 2.0, overseasBonus: 1.8, marqueeBonus: 1.5 },
  KKR: { spinnerBonus: 1.8, allRounderBonus: 1.6 },
  DC: { IndianFastBowlerBonus: 1.8, keeperBonus: 1.5 },
  PBKS: { uncappedBonus: 1.5, aggressiveBonus: 1.3 },
  RR: { uncappedBonus: 1.8, valueBonus: 1.5 },
  SRH: { overseasFastBowlerBonus: 1.8, openerBonus: 1.5 },
  GT: { IndianCoreBonus: 1.6, allRounderBonus: 1.4 },
  LSG: { keeperBonus: 1.6, middleOrderBonus: 1.4 }
};

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
 * @returns {Object|null} Bid decision object if bot should bid, or null
 */
export function evaluateBotBid({ player, currentBid, highBidderId, botTeam, squadLimit = 25, overseasLimit = 8 }) {
  if (!player || !botTeam) return null;

  const botUserId = botTeam.userId;
  const teamId = botTeam.teamId;

  // 1. Don't outbid yourself!
  if (highBidderId === botUserId) return null;

  // 2. Squad size limit check
  const currentSquad = botTeam.squad || [];
  if (currentSquad.length >= squadLimit) return null;

  // 3. Overseas limit check
  const isOverseas = player.country && player.country !== 'IND';
  if (isOverseas) {
    const currentOverseasCount = currentSquad.reduce((acc, s) => {
      const pInfo = IPL_PLAYERS.find(p => p.id === (typeof s === 'string' ? s : s.id));
      return pInfo && pInfo.country !== 'IND' ? acc + 1 : acc;
    }, 0);
    if (currentOverseasCount >= overseasLimit) return null;
  }

  // 4. Role Balance Check
  const currentRoleCount = currentSquad.reduce((acc, s) => {
    const pInfo = IPL_PLAYERS.find(p => p.id === (typeof s === 'string' ? s : s.id));
    return pInfo && pInfo.role === player.role ? acc + 1 : acc;
  }, 0);

  // Soft role caps per team
  const maxPerRole = squadLimit <= 5 ? 2 : squadLimit <= 11 ? 4 : 8;
  if (currentRoleCount >= maxPerRole) return null;

  // 5. Calculate Next Incremental Bid Amount
  const cBid = currentBid || 0;
  const increment = cBid < 5 ? 0.20 : 0.25;
  const nextBid = cBid === 0 ? (player.basePrice || 0.50) : cBid + increment;

  // 6. Budget Check
  const budgetRemaining = botTeam.budgetRemaining ?? 120.0;
  if (budgetRemaining < nextBid) return null;

  // Reserve budget safety calculation: Ensure average remaining budget per needed player is at least 0.40 Cr
  const slotsRemaining = squadLimit - currentSquad.length;
  const remainingAfterBid = budgetRemaining - nextBid;
  if (slotsRemaining > 1 && (remainingAfterBid / (slotsRemaining - 1)) < 0.40) {
    return null; // Don't drain purse too early!
  }

  // 7. Valuation Calculation
  const basePrice = player.basePrice || 0.50;
  const rating = player.rating || 8.0;
  let maxValuation = Math.max(basePrice, rating * 1.5);

  // Apply Team Personality Multipliers
  const prefs = TEAM_PREFERENCES[teamId] || {};
  if (player.role === 'ALL' && prefs.allRounderBonus) maxValuation *= 1.2;
  if (player.role === 'BOWL' && prefs.fastBowlerBonus) maxValuation *= 1.2;
  if (player.role === 'BAT' && prefs.topBatsmanBonus) maxValuation *= 1.2;
  if (isOverseas && prefs.overseasBonus) maxValuation *= 1.15;
  if (player.set === 'Marquee 1' || player.set === 'Marquee 2') maxValuation *= 1.3;

  // Cap max valuation to remaining budget
  maxValuation = Math.min(maxValuation, budgetRemaining);

  // 8. Bidding Decision
  if (nextBid <= maxValuation) {
    // Add small random willingness factor (90% chance to bid if within valuation)
    if (Math.random() < 0.90) {
      return {
        shouldBid: true,
        botUserId,
        teamId,
        nextBid
      };
    }
  }

  return null;
}
