import { db } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { IPL_PLAYERS } from './src/data/players';

// This script can be run from the console or a temporary component to seed Firestore
export const seedPlayers = async () => {
  try {
    const playersRef = collection(db, 'players');
    for (const player of IPL_PLAYERS) {
      await setDoc(doc(playersRef, player.id), player);
    }
    // Players seeded successfully!
  } catch (error) {
    // Error seeding players
  }
};

export const createInitialAuction = async (auctionId) => {
  try {
    await setDoc(doc(db, 'auctions', auctionId), {
      name: "Mega Auction",
      status: "active",
      hostId: "system",
      currentAuction: {
        playerId: "p1",
        currentBid: 2.0,
        highBidderId: null,
        highBidderName: "Base Price",
        timerEndsAt: Date.now() + 60000,
        status: "bidding"
      }
    });
    // Initial auction created!
  } catch (error) {
    // Error creating initial auction
  }
};
