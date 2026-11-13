/**
 * Feedback, Ratings v2, and Dev Note configuration.
 * Edit this file to update cards, progress, and copy without touching React components.
 */

export const FEEDBACK_COLUMNS = [
  { id: 'heard', label: 'HEARD', description: 'Raw complaints & suggestions' },
  { id: 'working', label: 'WORKING ON', description: 'Actively in progress' },
  { id: 'shipped', label: 'SHIPPED', description: 'Done & live in production' },
  { id: 'not_doing', label: 'NOT DOING (AND WHY)', description: 'Declined with honest reasons' },
];

export const FEEDBACK_ITEMS = [
  // ── HEARD ──
  {
    id: 'fb-1',
    status: 'heard',
    title: 'Server lag during busy auctions',
    note: 'When 8+ managers bid simultaneously, countdowns occasionally desync.',
    tag: 'INFRA',
    detail: 'Investigating WebSocket connection drops and free-tier socket exhaustion limits during peak tournament hours.',
  },
  {
    id: 'fb-2',
    status: 'heard',
    title: 'Some player ratings feel off',
    note: 'A few marquee and domestic player ratings do not reflect recent T20 form.',
    tag: 'ROSTER',
    detail: 'Users pointed out several 2024-25 breakout stars whose base ratings in the game data need recalibration.',
  },

  // ── WORKING ON ──
  {
    id: 'fb-3',
    status: 'working',
    title: 'Player ratings v2 (rechecking every rating)',
    note: 'Full audit of all 250+ players with updated role weights and historical stats.',
    tag: 'STATS',
    detail: 'Recalibrating batting strike rates, death bowling economy, and franchise demand tiers across the whole player database.',
  },
  {
    id: 'fb-4',
    status: 'working',
    title: 'Server performance on a student budget',
    note: 'Optimizing Supabase egress and multi-server failover so free tiers don’t choke.',
    tag: 'SCALE',
    detail: 'Migrating lobby listings to cached edge snapshots and deduplicating real-time database socket subscriptions.',
  },

  // ── SHIPPED ──
  // replace with real fixes
  {
    id: 'fb-5',
    status: 'shipped',
    title: 'Solo vs. Bots: Pass & Fast-Forward simulation',
    note: 'Instant "Pass" skips unwanted lots to bots; "Fast Forward" simulates remaining rounds.',
    tag: 'SOLO PLAY',
    detail: 'Playing 1 human vs 9 bots no longer feels sluggish. Pass lets bots battle instantly in-memory, while Finish Auction simulates remaining lots and takes you straight to final squad ratings.',
  },
  {
    id: 'fb-8',
    status: 'shipped',
    title: '100% Local Solo vs. Bots (No Server Needed)',
    note: 'Run full solo auctions locally in your browser with zero server connection or RTDB quota usage.',
    tag: 'OFFLINE SOLO',
    detail: 'Solo vs 9 AI bots runs entirely on your device with offline state persistence, zero Firebase RTDB socket usage, and instant local simulation.',
  },
  {
    id: 'fb-6',
    status: 'shipped',
    title: 'Multi-server redundancy & room directory',
    note: 'Dual-server failover routing prevents room lockout when Primary RTDB reaches capacity.',
    tag: 'RELIABILITY',
    detail: 'Automated fallback probe selects the least loaded database server on room creation with zero downtime.',
  },

  // ── NOT DOING (AND WHY) ──
  {
    id: 'fb-7',
    status: 'not_doing',
    title: 'Skip player button',
    note: 'Admin could skip marquee players and rig the auction.',
    tag: 'FAIR PLAY',
    detail: 'An unchecked skip button lets hosts bypass premier players until their rivals run out of purse, compromising competitive fairness.',
  },
];

export const RATINGS_V2_CONFIG = {
  // Edit this progress percentage (0 - 100)
  progress: 40,
  title: 'Ratings v2 in progress',
  prompt: 'Think a player is rated wrong?',
  buttonText: 'Suggest a rating',
  // Placeholder before/after player comparisons (replace with real updates as needed)
  beforeAfter: [
    {
      id: 'p1',
      name: 'Rinku Singh',
      role: 'Finisher',
      oldRating: 84,
      newRating: 88,
    },
    {
      id: 'p2',
      name: 'Mayank Yadav',
      role: 'Fast Bowler',
      oldRating: 78,
      newRating: 85,
    },
  ],
};

export const DEV_NOTE_CONFIG = {
  name: 'Shaurya',
  role: 'Creator & Developer',
  avatarUrl: 'https://github.com/Shaurya01836.png',
  heading: 'NOTE FROM THE DEV',
  copy: "Hey, I'm Shaurya, a B.Tech student building CrickAuction between classes. It runs on a student budget (free tiers), so yes, sometimes it lags. I read every piece of feedback, even the angry ones, and I'm fixing things one by one. Thanks for sticking around.",
  chips: [
    'Free-tier hosting',
    'Solo dev',
    'Community feedback',
  ],
  feedbackBtnText: 'Send feedback',
};

export const SKIP_EXPLAINER_CONFIG = {
  title: "Why There's No Skip Button",
  tagline: "Admin could skip key players and rig the auction. Here's what would happen:",
  honestLine: 'Thinking about: vote-to-skip by majority of franchise owners. Want it? Tell me.',
  feedbackBtnText: 'Vote for Vote-to-Skip',
};

