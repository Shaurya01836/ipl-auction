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
