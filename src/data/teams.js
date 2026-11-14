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

export const getTeamBotName = (teamOrId) => {
  const id = typeof teamOrId === 'string' ? teamOrId : teamOrId?.id;
  if (id && BOT_COACHES[id]) return BOT_COACHES[id];
  const name = typeof teamOrId === 'object' ? teamOrId?.name : '';
  return name ? `${name} Bot` : 'AI Bot';
};

export const TEAMS = [
  { 
    id: 'MI', 
    name: 'Mumbai Indians', 
    shortName: 'Mumbai',
    botName: BOT_COACHES.MI,
    color: 'bg-blue-600', 
    textColor: 'text-white',
    logo: '/logos/MI.svg'
  },
  { 
    id: 'CSK', 
    name: 'Chennai Super Kings', 
    shortName: 'Chennai',
    botName: BOT_COACHES.CSK,
    color: 'bg-yellow-400', 
    textColor: 'text-black',
    logo: '/logos/CSK.svg'
  },
  { 
    id: 'RCB', 
    name: 'Royal Challengers Bengaluru', 
    shortName: 'Bengaluru',
    botName: BOT_COACHES.RCB,
    color: 'bg-red-600', 
    textColor: 'text-white',
    logo: '/logos/RCB.svg'
  },
  { 
    id: 'KKR', 
    name: 'Kolkata Knight Riders', 
    shortName: 'Kolkata',
    botName: BOT_COACHES.KKR,
    color: 'bg-purple-800', 
    textColor: 'text-white',
    logo: '/logos/KKR.svg'
  },
  { 
    id: 'DC', 
    name: 'Delhi Capitals', 
    shortName: 'Delhi',
    botName: BOT_COACHES.DC,
    color: 'bg-blue-500', 
    textColor: 'text-white',
    logo: '/logos/DC.svg'
  },
  { 
    id: 'PBKS', 
    name: 'Punjab Kings', 
    shortName: 'Punjab',
    botName: BOT_COACHES.PBKS,
    color: 'bg-red-500', 
    textColor: 'text-white',
    logo: '/logos/PBKS.svg'
  },
  { 
    id: 'RR', 
    name: 'Rajasthan Royals', 
    shortName: 'Rajasthan',
    botName: BOT_COACHES.RR,
    color: 'bg-pink-600', 
    textColor: 'text-white',
    logo: '/logos/RR.svg'
  },
  { 
    id: 'SRH', 
    name: 'Sunrisers Hyderabad', 
    shortName: 'Hyderabad',
    botName: BOT_COACHES.SRH,
    color: 'bg-orange-500', 
    textColor: 'text-white',
    logo: '/logos/SRH.svg'
  },
  { 
    id: 'GT', 
    name: 'Gujarat Titans', 
    shortName: 'Gujarat',
    botName: BOT_COACHES.GT,
    color: 'bg-slate-700', 
    textColor: 'text-white',
    logo: '/logos/GT.svg'
  },
  { 
    id: 'LSG', 
    name: 'Lucknow Super Giants', 
    shortName: 'Lucknow',
    botName: BOT_COACHES.LSG,
    color: 'bg-pink-800', 
    textColor: 'text-white',
    logo: '/logos/LSG.svg'
  },
];
