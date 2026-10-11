<div align="center">


  # Crick Auction
  ### *The ultimate real-time SaaS auction and live fantasy experience.*

  [![React](https://img.shields.io/badge/React-19.2-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.11-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

  Host live multiplayer auctions with friends, manage budgets, and bid in real-time.<br />
  Evaluate your drafted squad using the advanced Franchise Strength rating system.<br />
  Experience sub-second latency bidding backed by a sophisticated hybrid database architecture.

  [Play Now](https://crickauction.in) • [Documentation](#documentation) • [Releases](https://github.com/Shaurya01836/ipl-auction/releases) • [Contributing](#develop-and-contribute)
  <br />
  <br />
</div>

<p align="center">
  <img src="./readme-assets/auction_room.png" alt="Live Bidding Dashboard" width="100%">
</p>

## A platform for competitive multiplayer simulation
One host can manage an auction room. Running a live auction across multiple friends creates a different job: managing synchronized bid timers, tracking budgets, enforcing squad limits, and maintaining ultra-low latency.

Crick Auction is a real-time web workspace built for that job. Add friends to a lobby, assign franchise teams, and start a live bidding war. For every player that comes under the hammer, the platform synchronizes a universal clock offset across all clients. The current bid, highest bidder, remaining purses, and chat stay perfectly synced from start to finish.

Behind the React UI, the local Firebase RTDB engine watches live activity and coordinates state. The result is a shared, broadcast-quality view of the auction instead of a chaotic group chat experience.

---

## How it works

### 1. Enter the Arena
When you open Crick Auction, you're greeted with our dynamic loading screen. Under the hood, the app connects to the **Supabase PostgreSQL** directory to fetch active public rooms and leaderboard history without bottlenecking the live game engine.
<div align="center">
  <img src="./readme-assets/loading%20page.png" alt="Dynamic Loader Screen" width="80%">
</div>
<br />

### 2. Create or Join an Auction
You can either host a private room for your friends or jump into a public lobby. Creating a room sets up a completely isolated **Firebase Realtime Database (RTDB)** node just for your auction. This isolation means hundreds of auctions can happen simultaneously without slowing each other down.
<div align="center">
  <img src="./readme-assets/landing%20page.png" alt="Landing Page and Public Lobbies" width="80%">
</div>
<br />

### 3. Claim Franchises & Fill Bots
Once inside the lobby, you and your friends claim your favorite teams. If you don't have enough people to fill all the teams, you can turn on **AI Franchise Bots**. These bots use timer-adaptive bidding strategies—some bid aggressively early on, while others wait to snipe players in the final 5 seconds!
<div align="center">
  <img src="./readme-assets/auction_lobby.png" alt="Pre-Auction Lobby and Bot Configuration" width="80%">
</div>
<br />

### 4. The Live Bidding War
This is the core experience. When the auction starts, every connected user sees the exact same timer and bid amount instantly. The platform calculates a universal clock offset across all browsers to ensure fair bidding, preventing lag from ruining the fun. The host drives the pace while franchise owners manage their maximum purses and overseas player limits.
*(See the massive image at the top of this page!)*
<br />

### 5. Final Squads & Franchise Ratings
When all players are sold, the room automatically flushes its data from the active Firebase node into long-term Supabase storage to keep the database lightweight. You can review every team's final squad, switch between list and detailed player cards, and see how your team ranks globally using the built-in **Franchise Strength** evaluation system—which calculates your squad's average rating based on player career stats, form, and experience!
<div align="center">
  <img src="./readme-assets/auction_summary.png" alt="Auction Results and Squad Summaries" width="80%">
</div>

---

## Install
Deploy or run the latest version of Crick Auction locally. No complex CLI is required.

1. **Clone and Install**
   ```bash
   git clone https://github.com/Shaurya01836/ipl-auction.git
   cd ipl-auction
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file and point it at the databases you want Crick Auction to manage.
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   
   VITE_SUPABASE_URL=https://your_project_ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   VITE_CRICKET_API_KEY=your_cricapi_key
   ```

3. **Start the local daemon**
   ```bash
   npm run dev
   ```

---

## Product highlights

**Premium Broadcast UI/UX**
Sophisticated mobile UI featuring touch-scrollable participant overlays, micro-animations smoothed with Framer Motion, confetti explosions, and animated "SOLD" cards.

**Hybrid Database Architecture**
Ultra-fast live bidding ticks and real-time chat powered by Firebase RTDB with zero document-read costs, backed by Supabase PostgreSQL for high-capacity public directory indexing.

**Automated Squad Evaluation**
Built-in evaluation algorithms automatically generate player ratings based on historical T20 career data, striking baselines, and experience vectors to objectively score the strength of every constructed franchise.

---

## Supported Tech Stack
The platform combines top-tier modern web technologies into one supervised workflow:

| Core Frontend | Styling & UI | Backend & Auth | Integration |
|---|---|---|---|
| React 19.2 | Tailwind CSS v4 | Firebase RTDB | CricAPI |
| Vite 6.0 | Framer Motion | Supabase | Node.js Scripts |
| React Router | Lucide React | Firebase Auth | html-to-image |

<br />

## Report a bug
Open a bug report from your own GitHub account. A few sentences in your own words about what you did and what went wrong are enough. Add what you expected, reproduction steps, your browser, or a screenshot if you have them. Use GitHub Issues for bugs and feature requests.

## Develop and contribute
Contributions are welcome across code, docs, examples, and tests. Start by cloning the repository and running `npm install`. Read the standard contribution guidelines before opening a pull request.

## Documentation
- **scripts/autoUpdateFantasy.js**: Auto-calculates points from live CricAPI matches.
- **scripts/backfillIPL2026.js**: Imports IPL series scorecards.
- **scripts/deployDatabaseRules.js**: Syncs security rules to Firebase RTDB.
- **database.rules.json**: Contains the rules boundary for Firebase.

## Community
Join the discussion, follow updates, or start a conversation in GitHub Issues.

## License
Crick Auction is available under the Apache License 2.0.
