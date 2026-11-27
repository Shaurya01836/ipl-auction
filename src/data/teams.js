export const BOT_COACHES = {
  GT: 'Nehra Ji',
  CSK: 'Zak Bhai',
  MI: 'Polly Bhai',
  RCB: 'Flower Power',
  KKR: 'Nayar Saab',
  DC: 'Punter Saab',
  PBKS: "Preity Ma'am",
  RR: 'Sanga Sir',
  SRH: 'Kavya Queen',
  LSG: 'Langer Bhai',
};

export const HUNDRED_BOT_COACHES = {
  BPH: 'Gaffer Dan',
  LSP: 'Coach Oliver',
  MOR: 'Boss Freddie',
  NSC: 'Skipper Harry',
  OIN: 'Coach Alistair',
  SBR: 'Gaffer Charlie',
  TRT: 'Boss George',
  WFR: 'Coach Gareth',
};

export const REALISTIC_BOT_NAMES = [
  'Aarav', 'Rohan', 'Kabir', 'Vivaan', 'Arjun', 'Siddharth', 'Dev', 'Karan',
  'Nikhil', 'Aditya', 'Pranav', 'Yash', 'Ishaan', 'Tanmay', 'Varun', 'Shubham',
  'Harsh', 'Kunal', 'Dhruv', 'Manav', 'Vikram', 'Samir', 'Zaid', 'Farhan',
  'Ananya', 'Riya', 'Oliver', 'Liam', 'Callum', 'Aryan',
];

export const HUNDRED_BOT_NAMES = [
  'Oliver', 'Harry', 'George', 'Jack', 'Charlie', 'Alfie', 'Oscar', 'Arthur',
  'Noah', 'Leo', 'Callum', 'Liam', 'Theo', 'Freddie', 'Finley', 'Archie',
  'Henry', 'Jacob', 'Thomas', 'Edward', 'James', 'William', 'Toby', 'Sebastian',
  'Gareth', 'Owen', 'Emily', 'Amelia', 'Sophie', 'Grace',
];

export const pickRandomBotName = (usedNames = [], randomFn = Math.random, auctionType = null) => {
  const taken = new Set(
    Array.from(usedNames, (n) => String(n || '').trim().toLowerCase()).filter(Boolean),
  );
  const pool = auctionType === 'hundred' ? HUNDRED_BOT_NAMES : REALISTIC_BOT_NAMES;
  const available = pool.filter((n) => !taken.has(n.toLowerCase()));
  if (available.length > 0) {
    return available[Math.floor(randomFn() * available.length)];
  }
  return `Manager ${Math.floor(100 + randomFn() * 900)}`;
};

export const getTeamBotName = (teamOrId) => {
  const id = typeof teamOrId === 'string' ? teamOrId : teamOrId?.id;
  if (id && BOT_COACHES[id]) return BOT_COACHES[id];
  if (id && HUNDRED_BOT_COACHES[id]) return HUNDRED_BOT_COACHES[id];
  const name = typeof teamOrId === 'object' ? teamOrId?.name : '';
  return name ? `${name} Bot` : 'AI Bot';
};

export const TEAMS = [
  { 
    id: 'MI', 
    name: 'MI', 
    shortName: 'MI',
    botName: BOT_COACHES.MI,
    color: 'bg-blue-600', 
    textColor: 'text-white',
    logo: '/logos/MI.svg'
  },
  { 
    id: 'CSK', 
    name: 'CSK', 
    shortName: 'CSK',
    botName: BOT_COACHES.CSK,
    color: 'bg-yellow-400', 
    textColor: 'text-black',
    logo: '/logos/CSK.svg'
  },
  { 
    id: 'RCB', 
    name: 'RCB', 
    shortName: 'RCB',
    botName: BOT_COACHES.RCB,
    color: 'bg-red-600', 
    textColor: 'text-white',
    logo: '/logos/RCB.svg'
  },
  { 
    id: 'KKR', 
    name: 'KKR', 
    shortName: 'KKR',
    botName: BOT_COACHES.KKR,
    color: 'bg-purple-800', 
    textColor: 'text-white',
    logo: '/logos/KKR.svg'
  },
  { 
    id: 'DC', 
    name: 'DC', 
    shortName: 'DC',
    botName: BOT_COACHES.DC,
    color: 'bg-blue-500', 
    textColor: 'text-white',
    logo: '/logos/DC.svg'
  },
  { 
    id: 'PBKS', 
    name: 'PBKS', 
    shortName: 'PBKS',
    botName: BOT_COACHES.PBKS,
    color: 'bg-red-500', 
    textColor: 'text-white',
    logo: '/logos/PBKS.svg'
  },
  { 
    id: 'RR', 
    name: 'RR', 
    shortName: 'RR',
    botName: BOT_COACHES.RR,
    color: 'bg-pink-600', 
    textColor: 'text-white',
    logo: '/logos/RR.svg'
  },
  { 
    id: 'SRH', 
    name: 'SRH', 
    shortName: 'SRH',
    botName: BOT_COACHES.SRH,
    color: 'bg-orange-500', 
    textColor: 'text-white',
    logo: '/logos/SRH.svg'
  },
  { 
    id: 'GT', 
    name: 'GT', 
    shortName: 'GT',
    botName: BOT_COACHES.GT,
    color: 'bg-slate-700', 
    textColor: 'text-white',
    logo: '/logos/GT.svg'
  },
  { 
    id: 'LSG', 
    name: 'LSG', 
    shortName: 'LSG',
    botName: BOT_COACHES.LSG,
    color: 'bg-pink-800', 
    textColor: 'text-white',
    logo: '/logos/LSG.svg'
  },
];

const toSvgDataUri = (inner, bg) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/>${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const HUNDRED_TEAMS = [
  {
    id: 'BPH',
    name: 'Birmingham Phoenix',
    shortName: 'BPH',
    color: 'bg-orange-500',
    textColor: 'text-black',
    logo: toSvgDataUri(
      '<circle cx="32" cy="32" r="25" fill="#09090b"/><polygon points="32,14 37,22 27,22" fill="#f97316"/><polygon points="18,36 27,23 32,32 23,36" fill="#f97316"/><polygon points="46,36 37,23 32,32 41,36" fill="#f97316"/><polygon points="32,35 38,44 32,41 26,44" fill="#f97316"/><circle cx="14" cy="32" r="2" fill="#f97316"/><circle cx="50" cy="32" r="2" fill="#f97316"/>',
      '#f97316'
    ),
  },
  {
    id: 'LSP',
    name: 'London Spirit',
    shortName: 'LSP',
    color: 'bg-blue-700',
    textColor: 'text-white',
    logo: toSvgDataUri(
      '<text x="32" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="7" letter-spacing="1.5" fill="#ffffff">LONDON</text><text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="16" letter-spacing="0.5" fill="#ffffff">SPIRIT</text><rect x="12" y="46" width="40" height="2.5" rx="1" fill="#ffffff" opacity="0.85"/>',
      '#002bff'
    ),
  },
  {
    id: 'MOR',
    name: 'Manchester Originals',
    shortName: 'MOR',
    color: 'bg-zinc-950',
    textColor: 'text-white',
    logo: toSvgDataUri(
      '<polygon points="32,8 52,19 52,45 32,56 12,45 12,19" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linejoin="round"/><path d="M20 43 L20 22 L28 33 L38 20 L44 20 L44 43 L38 43 L38 30 L28 42 L25 38 L25 43 Z" fill="#ffffff"/>',
      '#09090b'
    ),
  },
  {
    id: 'NSC',
    name: 'Northern Superchargers',
    shortName: 'NSC',
    color: 'bg-purple-900',
    textColor: 'text-white',
    logo: toSvgDataUri(
      '<text x="32" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="14" letter-spacing="0.5" fill="#ffffff">SUPER</text><text x="32" y="34" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="6.5" letter-spacing="1.2" fill="#f43f5e">NORTHERN</text><text x="32" y="49" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="10.5" fill="#ffffff">CHARGERS</text>',
      '#3b0764'
    ),
  },
  {
    id: 'OIN',
    name: 'Oval Invincibles',
    shortName: 'OIN',
    color: 'bg-emerald-400',
    textColor: 'text-black',
    logo: toSvgDataUri(
      '<ellipse cx="32" cy="32" rx="20" ry="25" fill="none" stroke="#09090b" stroke-width="2.5"/><path d="M29 14 C29 11 35 11 35 14 L35 28 C39 28 42 30 42 35 L42 42 C42 47 38 50 32 50 C26 50 23 46 23 40 L23 32 C23 29 26 28 29 29 Z" fill="#09090b"/><rect x="30.5" y="15" width="3" height="14" rx="1.5" fill="#00f59b"/>',
      '#00f59b'
    ),
  },
  {
    id: 'SBR',
    name: 'Southern Brave',
    shortName: 'SBR',
    color: 'bg-lime-400',
    textColor: 'text-black',
    logo: toSvgDataUri(
      '<path d="M13 21 Q24 15 32 21 Q40 27 51 21 L51 28 Q40 34 32 28 Q24 22 13 28 Z" fill="#09090b"/><path d="M13 33 Q24 27 32 33 Q40 39 51 33 L51 40 Q40 46 32 40 Q24 34 13 40 Z" fill="#09090b"/><text x="32" y="53" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="8" letter-spacing="1" fill="#09090b">BRAVE</text>',
      '#b8d91c'
    ),
  },
  {
    id: 'TRT',
    name: 'Trent Rockets',
    shortName: 'TRT',
    color: 'bg-yellow-400',
    textColor: 'text-black',
    logo: toSvgDataUri(
      '<path d="M17 13 L41 13 L45 20 L29 31 L45 45 L33 45 L22 33 L22 45 L17 45 Z" fill="#09090b"/><polygon points="20,34 49,13 51,18 22,38" fill="#ea580c"/><text x="32" y="56" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="7.5" letter-spacing="1" fill="#09090b">ROCKETS</text>',
      '#facc15'
    ),
  },
  {
    id: 'WFR',
    name: 'Welsh Fire',
    shortName: 'WFR',
    color: 'bg-pink-500',
    textColor: 'text-black',
    logo: toSvgDataUri(
      '<circle cx="32" cy="32" r="24" fill="none" stroke="#09090b" stroke-width="2" stroke-dasharray="3 2"/><path d="M20 20 L20 35 C20 42 25 45 31 45 L34 45 L34 39 L30 39 C27 39 26 37 26 34 L26 20 Z" fill="#09090b"/><path d="M35 20 C42 20 46 25 46 32 C46 39 42 44 35 44 L35 38 C39 38 40 35 40 32 L34 32 L34 27 L40 27 C39 25 37 24 35 24 Z" fill="#09090b"/>',
      '#ff2a85'
    ),
  },
];

export const ALL_TEAMS = [...TEAMS, ...HUNDRED_TEAMS];

export const getTeamsForMode = (auctionType) =>
  auctionType === 'hundred' ? HUNDRED_TEAMS : TEAMS;

export const findTeamById = (teamId) =>
  ALL_TEAMS.find((t) => t.id === teamId) || null;
