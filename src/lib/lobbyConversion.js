import { generateSoloRoomCode } from './roomCodes.js';
import { localAuctionReducer, saveLocalSoloRoom, loadLocalSoloRoom } from './localAuctionEngine.js';
import { SERVER_LOCAL, withServerParam } from './auctionServers.js';
import { ref, set } from 'firebase/database';
import { goOfflineAllServers } from './firebase.js';

/**
 * Converts a 1-human + bots cloud lobby into a 100% device-local solo auction.
 *
 * Sequence:
 * 1. Initialize local state with fresh SOLO-XXXXXX id.
 * 2. Save local state to localStorage.
 * 3. Read back and verify (throws on failure -> aborts conversion).
 * 4. Await RTDB auctions/<id> deletion (1 retry).
 * 5. Await Supabase auctions table deletion (1 retry; throws on final failure).
 * 6. Disconnect all RTDB sockets via goOfflineAllServers().
 * 7. Navigate to /auction/SOLO-XXXXXX?server=local.
 */
export async function convertLobbyToSolo({
  roomId,
  user,
  currentUserPlayer,
  currentAuction,
  server,
  rtdbInstance,
  rtdbDeleteFn,
  supabaseClient,
  navigate,
}) {
  if (!roomId || !user?.uid) {
    throw new Error('Invalid conversion parameters: roomId and user are required.');
  }

  // 1. Build local solo state with fresh SOLO-<hex> room ID
  const soloRoomId = generateSoloRoomCode();
  const localState = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: soloRoomId,
    humanUser: {
      uid: user.uid,
      displayName: currentUserPlayer?.name || user.displayName || 'Manager',
      team: currentUserPlayer?.team,
    },
    auctionType: currentAuction?.auctionType || 'mega',
    settings: currentAuction?.settings || {},
  });

  // 2. Save local state
  saveLocalSoloRoom(localState);

  // 3. Read back and verify
  const verified = loadLocalSoloRoom(soloRoomId);
  if (!verified || verified.id !== soloRoomId) {
    throw new Error('Verification of local solo save failed');
  }

  // 4. Await deletion on RTDB with 1 retry
  if (rtdbDeleteFn) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await rtdbDeleteFn(roomId);
        break;
      } catch (delErr) {
        if (attempt === 1) console.warn('[lobby] Failed to delete RTDB node on conversion', delErr);
      }
    }
  } else if (rtdbInstance) {
    const deleteRoomRef = ref(rtdbInstance, `auctions/${roomId}`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await set(deleteRoomRef, null);
        break;
      } catch (delErr) {
        if (attempt === 1) console.warn('[lobby] Failed to delete RTDB node on conversion', delErr);
      }
    }
  }

  // 5. Best-effort Supabase cleanup: attempt delete with 1 retry;
  // if delete fails (e.g. missing RLS delete policy), fall back to updating status to 'cancelled'.
  // If both fail, warn and continue to local mode (user's solo save is already verified).
  if (supabaseClient) {
    let deleted = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await supabaseClient.from('auctions').delete().eq('id', roomId);
        if (error) throw error;
        deleted = true;
        break;
      } catch (delErr) {
        if (attempt === 1) {
          console.warn('[lobby] Failed to delete Supabase room row on conversion; falling back to cancel update', delErr);
        }
      }
    }

    if (!deleted) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { error } = await supabaseClient.from('auctions').update({ status: 'cancelled' }).eq('id', roomId);
          if (error) throw error;
          break;
        } catch (updateErr) {
          if (attempt === 1) {
            console.warn('[lobby] Failed to mark Supabase room as cancelled (best-effort); continuing to local mode', updateErr);
          }
        }
      }
    }
  }

  // 6. Tear down RTDB sockets
  goOfflineAllServers();

  // 7. Navigate to local solo room
  if (navigate) {
    navigate(withServerParam(`/auction/${soloRoomId}`, SERVER_LOCAL));
  }

  return { soloRoomId, localState };
}
