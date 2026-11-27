/**
 * Small, dependency-free helpers shared by auction screens.
 *
 * These functions deliberately distinguish "missing" from a real numeric zero.
 * Financial values are never coerced to a default when the value is genuinely 0.
 */

/**
 * Convert a value to a finite number, or return `fallback` when it is missing
 * or invalid. A genuine numeric 0 (or "0") is preserved.
 */
export const toFiniteNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  // Normalise -0 so callers and tests can rely on a single zero value.
  return numeric === 0 ? 0 : numeric;
};

/**
 * Round a numeric value to two decimal places (e.g. for purse and bid calculations).
 */
export const r2 = (value) => {
  const num = toFiniteNumber(value, 0);
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Canonical overseas rule for Crick Auction:
 * - For The Hundred (`hundred` mode / `set === 'Hundred'`), only "ENG" is domestic.
 * - For all IPL modes, only "IND" is domestic.
 * Missing, empty, or any other country value is overseas.
 */
export const isOverseasPlayer = (player, auctionType = null) => {
  const domesticCountry =
    auctionType === 'hundred' || player?.set === 'Hundred' ? 'ENG' : 'IND';
  return player?.country !== domesticCountry;
};

const lookupPlayer = (id, playerIndex) => {
  if (!playerIndex) return null;
  if (typeof playerIndex.get === 'function') return playerIndex.get(id) ?? null;
  if (Array.isArray(playerIndex)) {
    return playerIndex.find((player) => player?.id === id) ?? null;
  }
  return playerIndex[id] ?? null;
};

/**
 * Resolve a saved squad entry (string id or { id, bid }) against the canonical
 * player list. If the canonical record cannot be found, the entry itself is
 * returned so its own country (if any) can be used.
 */
export const resolveSquadPlayer = (entry, playerIndex) => {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'string') return lookupPlayer(entry, playerIndex);
  if (typeof entry !== 'object') return null;

  if (entry.id) {
    return lookupPlayer(entry.id, playerIndex) ?? entry;
  }

  return entry;
};

/**
 * Count overseas players in a saved squad. Unresolvable entries have no
 * country, so the canonical rule counts them as overseas.
 */
export const countOverseas = (squad, playerIndex, auctionType = null) => {
  if (!Array.isArray(squad)) return 0;

  return squad.reduce((count, entry) => {
    if (entry === null || entry === undefined) return count;
    return count + (isOverseasPlayer(resolveSquadPlayer(entry, playerIndex), auctionType) ? 1 : 0);
  }, 0);
};

/**
 * Format a crore value for display. Returns an em dash for missing or invalid
 * values; a genuine zero is shown as 0.00 (or 0.0 with digits = 1).
 */
export const formatCrores = (value, digits = 2) => {
  const numeric = toFiniteNumber(value, null);
  return numeric === null ? '—' : numeric.toFixed(digits);
};

/**
 * Format a purse/bid value with the appropriate currency unit for the mode
 * (£M for The Hundred, ₹ Cr for IPL modes).
 */
export const formatPurse = (value, auctionType = null, digits = 2) => {
  const formatted = formatCrores(value, digits);
  if (formatted === '—') return '—';
  return auctionType === 'hundred' ? `£${formatted}M` : `₹${formatted} Cr`;
};

/**
 * Compute how much a team has spent. Prefer an explicitly stored `spent` value
 * (including 0), otherwise derive it from budget minus remaining budget.
 * Returns null when there is not enough information.
 */
export const computeTeamSpent = ({ budget, budgetRemaining, spent } = {}) => {
  const storedSpent = toFiniteNumber(spent, null);
  if (storedSpent !== null) return Math.max(0, storedSpent);

  const remaining = toFiniteNumber(budgetRemaining, null);
  if (remaining === null) return null;

  const totalBudget = toFiniteNumber(budget, 120);
  return Math.max(0, totalBudget - remaining);
};

/**
 * Frozen remaining time for a paused lot. A server-side host-disconnect pause
 * stores pausedAt instead of remainingMs, so derive it from timerEndsAt.
 */
export const pausedRemainingMs = (live) => {
  if (!live) return 0;
  if (live.remainingMs != null) return Math.max(0, toFiniteNumber(live.remainingMs, 0));
  if (live.pausedAt != null) {
    return Math.max(0, toFiniteNumber(live.timerEndsAt, 0) - toFiniteNumber(live.pausedAt, 0));
  }
  return 0;
};

/**
 * Clamp a countdown to the configured timer range.
 */
export const clampTimer = (secondsLeft, totalSeconds) => {
  const total = toFiniteNumber(totalSeconds, 0);
  if (total <= 0) return 0;

  const seconds = toFiniteNumber(secondsLeft, 0);
  return Math.min(total, Math.max(0, seconds));
};

/**
 * Convert a countdown into a 0-100 progress percentage.
 */
export const timerProgress = (secondsLeft, totalSeconds) => {
  const total = toFiniteNumber(totalSeconds, 0);
  if (total <= 0) return 0;

  return (clampTimer(secondsLeft, total) / total) * 100;
};

/**
 * Decide whether a scroll container should follow new content. Used by chat so
 * a user reading older messages is not pulled back to the bottom.
 */
export const shouldStickToBottom = (
  scrollHeight,
  scrollTop,
  clientHeight,
  threshold = 48,
) => {
  const height = toFiniteNumber(scrollHeight, 0);
  const top = toFiniteNumber(scrollTop, 0);
  const viewport = toFiniteNumber(clientHeight, 0);

  return height - top - viewport <= threshold;
};

/**
 * Generate a client-side SVG data URI avatar with player initials.
 * Zero external network calls (eliminates external dicebear dependencies).
 */
export const getPlayerAvatar = (name = 'Player') => {
  const cleanName = typeof name === 'string' && name.trim() ? name.trim() : 'Player';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = (
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0]?.slice(0, 2) || 'P'
  ).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0c0d10"/><circle cx="50" cy="50" r="42" fill="#151821" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><text x="50" y="58" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Compute team balance adjusted rating (0-99) for a squad based on player data.
 * Penalizes one-dimensional / batting-heavy squads lacking bowling options or keepers,
 * rewarding balanced, well-rounded sides so a balanced team wins.
 */
export const computeSquadDepartmentBalance = (playersWithInfo = [], isDisqualified = false) => {
  if (isDisqualified || playersWithInfo.length === 0) {
    return {
      rawAvgRating: 0,
      balancedRating: 0,
      balanceScore: 0,
      balanceAdjustment: 0,
      balanceVerdict: isDisqualified ? 'Disqualified' : 'Empty',
    };
  }

  const ratedPlayers = playersWithInfo.filter((p) => typeof p.rating === 'number' && p.rating > 0);
  const rawAvgRating = ratedPlayers.length > 0
    ? Number((ratedPlayers.reduce((sum, p) => sum + p.rating, 0) / ratedPlayers.length).toFixed(1))
    : 70;

  const bats = playersWithInfo.filter((p) => p.role === 'Batsman');
  const bowls = playersWithInfo.filter((p) => p.role === 'Bowler');
  const ars = playersWithInfo.filter((p) => p.role === 'All-Rounder');
  const wks = playersWithInfo.filter((p) => p.role === 'Wicket-Keeper');

  const calcAvg = (list) => {
    const rated = list.filter((p) => typeof p.rating === 'number' && p.rating > 0);
    return rated.length > 0
      ? Number((rated.reduce((sum, p) => sum + p.rating, 0) / rated.length).toFixed(1))
      : null;
  };

  const batAvg = calcAvg(bats);
  const bowlAvg = calcAvg(bowls);
  const arAvg = calcAvg(ars);
  const wkAvg = calcAvg(wks);

  const bowlingOptions = bowls.length + ars.length;
  const battingOptions = bats.length + wks.length + ars.length;
  const keeperCount = wks.length;

  let balanceAdjustment = 0;

  // 1. Wicketkeeper requirement (a viable cricket XI must have a keeper)
  if (keeperCount === 0) {
    balanceAdjustment -= 4.0;
  } else {
    balanceAdjustment += 0.5;
  }

  // 2. Bowling attack depth (need at least 4-5 bowling options)
  if (bowlingOptions === 0) {
    balanceAdjustment -= 12.0;
  } else if (bowlingOptions === 1) {
    balanceAdjustment -= 8.0;
  } else if (bowlingOptions === 2) {
    balanceAdjustment -= 5.0;
  } else if (bowlingOptions === 3) {
    balanceAdjustment -= 2.0;
  } else if (bowlingOptions >= 5) {
    balanceAdjustment += 2.0;
  } else if (bowlingOptions >= 4) {
    balanceAdjustment += 1.0;
  }

  // 3. Batting depth
  if (battingOptions < 4) {
    balanceAdjustment -= 6.0;
  } else if (battingOptions >= 6) {
    balanceAdjustment += 1.0;
  }

  // 4. All-Rounder flexibility
  if (ars.length >= 2) {
    balanceAdjustment += 1.5;
  } else if (ars.length === 1) {
    balanceAdjustment += 0.5;
  }

  // 5. Batting vs Bowling department parity
  const batUnitAvg = calcAvg([...bats, ...wks]) ?? rawAvgRating;
  const bowlUnitAvg = bowlAvg ?? (arAvg ? arAvg * 0.9 : 60);
  const parityGap = Math.abs(batUnitAvg - bowlUnitAvg);
  if (parityGap > 8) {
    balanceAdjustment -= Number(((parityGap - 8) * 0.35).toFixed(1));
  }

  const calculatedScore = Number((rawAvgRating + balanceAdjustment).toFixed(1));
  const balancedRating = Math.min(99, Math.max(45, calculatedScore));

  return {
    rawAvgRating,
    balancedRating,
    balanceScore: balancedRating,
    balanceAdjustment: Number(balanceAdjustment.toFixed(1)),
    balanceVerdict: balanceAdjustment >= 0 ? 'Well-Balanced' : 'Imbalanced',
    batAvg,
    bowlAvg,
    arAvg,
    wkAvg,
    batCount: bats.length,
    bowlCount: bowls.length,
    arCount: ars.length,
    wkCount: wks.length,
  };
};

export const computeBalancedSquadRating = computeSquadDepartmentBalance;

