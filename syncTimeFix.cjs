const fs = require('fs');

// 1. Update AuctionContext.jsx
const contextFile = 'src/contexts/AuctionContext.jsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const hookInsert = `  const [loading, setLoading] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);

  React.useEffect(() => {
    const syncTime = async () => {
      try {
        const start = Date.now();
        const response = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
        const dateHeader = response.headers.get('Date');
        const end = Date.now();
        if (dateHeader) {
          const serverTime = new Date(dateHeader).getTime() + (end - start) / 2;
          const localTime = Date.now();
          setTimeOffset(serverTime - localTime);
        }
      } catch (e) {
        console.warn('Time sync failed, using local time');
      }
    };
    syncTime();
    const interval = setInterval(syncTime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSyncedTime = useCallback(() => {
    return Date.now() + timeOffset;
  }, [timeOffset]);`;

contextContent = contextContent.replace(`  const [loading, setLoading] = useState(false);`, hookInsert);

// Replace Date.now() with getSyncedTime() logic safely
contextContent = contextContent.replace(`timerEndsAt: Date.now() + 15000`, `timerEndsAt: getSyncedTime() + 15000`);
contextContent = contextContent.replace(`timerEndsAt: Date.now() + (settings?.bidTimer || 10) * 1000`, `timerEndsAt: getSyncedTime() + (settings?.bidTimer || 10) * 1000`);
contextContent = contextContent.replace(`timerEndsAt: Date.now() + (data.settings?.bidTimer || 10) * 1000`, `timerEndsAt: getSyncedTime() + (data.settings?.bidTimer || 10) * 1000`);
// Replace in placeBid
contextContent = contextContent.replace(`timerEndsAt: Date.now() + (data.settings?.bidTimer || 10) * 1000,`, `timerEndsAt: getSyncedTime() + (data.settings?.bidTimer || 10) * 1000,`);
// Replace in resumeAuction
contextContent = contextContent.replace(`'currentAuction.timerEndsAt': Date.now() + (data.settings?.bidTimer || 10) * 1000,`, `'currentAuction.timerEndsAt': getSyncedTime() + (data.settings?.bidTimer || 10) * 1000,`);
// Export it
contextContent = contextContent.replace(
`    sendMessage,
    messages
  };`,
`    sendMessage,
    messages,
    getSyncedTime
  };`
);

fs.writeFileSync(contextFile, contextContent);


// 2. Update AuctionRoom.jsx
const roomFile = 'src/pages/AuctionRoom.jsx';
let roomContent = fs.readFileSync(roomFile, 'utf8');

// Add to destructure
roomContent = roomContent.replace(
`      sendMessage,
      messages,
      updateRoomSettings,
      kickPlayer
   } = useAuction();`,
`      sendMessage,
      messages,
      updateRoomSettings,
      kickPlayer,
      getSyncedTime
   } = useAuction();`
);

// Replace timer countdown diff calculation
roomContent = roomContent.replace(
`const diff = Math.max(0, Math.floor((displayAuctionState.timerEndsAt - Date.now()) / 1000));`,
`const diff = Math.max(0, Math.floor((displayAuctionState.timerEndsAt - getSyncedTime()) / 1000));`
);

// Replace in optimistic handleBid
roomContent = roomContent.replace(
`timerEndsAt: Date.now() + (currentAuction?.settings?.bidTimer || 10) * 1000`,
`timerEndsAt: getSyncedTime() + (currentAuction?.settings?.bidTimer || 10) * 1000`
);

fs.writeFileSync(roomFile, roomContent);

console.log("Time Sync Updated");
