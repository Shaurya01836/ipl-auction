import { r2, toFiniteNumber } from './auctionDisplay.js';
import { getNextBidAmount, mapRoomPlayers, normalizeSquad } from './auctionRules.js';

/**
 * Pure update functions for the Realtime Database transactions used by the
 * cloud auction. Returning `undefined` aborts the transaction, exactly like the
 * inline functions they replaced. Tests import these directly.
 */

export function transactBid(currentData, {
  userId,
  userName,
  teamId,
  playerId,
  now,
  timerMs,
  budget,
  basePrice,
}) {
  if (!currentData) return currentData;
  if (currentData.status !== 'bidding') return;
  // The user clicked on a specific lot; never apply that click to the next one.
  if (playerId && currentData.playerId !== playerId) return;
  if (currentData.highBidderId === userId) return;
  if (currentData.timerEndsAt && now >= currentData.timerEndsAt) return;

  const currentBid = toFiniteNumber(currentData.currentBid, 0);
  const nextBid = currentBid === 0
    ? toFiniteNumber(basePrice, 0)
    : getNextBidAmount({ basePrice }, currentBid);

  if (nextBid > toFiniteNumber(budget, 0)) return;

  return {
    ...currentData,
    currentBid: nextBid,
    highBidderId: userId,
    highBidderName: userName,
    highBidderTeamId: teamId,
    timerEndsAt: now + timerMs,
    passes: null,
  };
}

export function transactSale(currentData, now) {
  if (!currentData) return currentData;
  if (currentData.status !== 'bidding') return;
  if (currentData.timerEndsAt && now < currentData.timerEndsAt) return;

  return {
    ...currentData,
    status: currentData.highBidderId ? 'sold' : 'unsold',
  };
}

export function transactTeamSale(currentTeam, {
  roomId,
  playerId,
  bid,
  winnerId,
  winnerTeamId,
  winnerName,
  initialBudget = 120,
}) {
  const baseTeam = currentTeam || {
    auctionId: roomId,
    userId: winnerId,
    teamId: winnerTeamId || '',
    teamName: winnerName || 'Unknown',
    squad: [],
    spent: 0,
    budgetRemaining: toFiniteNumber(initialBudget, 120),
  };

  const currentSquad = normalizeSquad(baseTeam.squad);

  // A delayed recovery for an older lot must not rewrite a newer squad/purse.
  if (
    !playerId ||
    currentSquad.some((entry) =>
      (typeof entry === 'string' ? entry : entry?.id) === playerId,
    )
  ) {
    return currentTeam;
  }

  const squad = [...currentSquad, { id: playerId, bid: toFiniteNumber(bid, 0) }];
  const spent = squad.reduce(
    (sum, entry) => r2(sum + toFiniteNumber(typeof entry === 'object' ? entry.bid : 0, 0)),
    0,
  );

  return {
    ...baseTeam,
    teamId: winnerTeamId || baseTeam.teamId || '',
    teamName: winnerName || baseTeam.teamName || 'Unknown',
    budgetRemaining: Math.max(0, r2(toFiniteNumber(initialBudget, 120) - spent)),
    spent,
    squad,
  };
}

export function transactRoomPlayersSale(currentRoom, {
  winnerId,
  totalSpent,
  squadCount,
}) {
  if (!currentRoom?.players) return currentRoom;

  return {
    ...currentRoom,
    players: mapRoomPlayers(currentRoom.players, (player) => player).map((player) => (
      player.id === winnerId
        ? {
            ...player,
            spent: Math.max(toFiniteNumber(player.spent, 0), toFiniteNumber(totalSpent, 0)),
            squadCount: Math.max(toFiniteNumber(player.squadCount, 0), toFiniteNumber(squadCount, 0)),
          }
        : player
    )),
  };
}

export function transactAdvance(currentLive, {
  currentPlayerId,
  nextPlayerId,
  timerEndsAt,
}) {
  if (!currentLive) return currentLive;
  if (currentLive.playerId !== currentPlayerId) return;
  if (currentLive.status !== 'sold' && currentLive.status !== 'unsold') return;

  return {
    playerId: nextPlayerId,
    currentBid: 0,
    highBidderId: '',
    highBidderName: 'No Bids',
    timerEndsAt,
    status: 'bidding',
    passes: null,
  };
}
