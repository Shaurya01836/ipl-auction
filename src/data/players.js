import { getPlayerAvatar } from '../lib/auctionDisplay.js';

export const IPL_PLAYERS = [
  {
    "id": "p_621",
    "name": "Jasprit Bumrah",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_PMO_New_Delhi.jpg/500px-Jasprit_Bumrah_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 158,
      "wickets": 187,
      "econ": 7.34,
      "avg": 23.75,
      "bb": "5/10"
    },
    "rating": 82,
    "team": "MI",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_622",
    "name": "Suryakumar Yadav",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Suryakumar_Yadav_in_PMO_New_Delhi.jpg/500px-Suryakumar_Yadav_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 179,
      "runs": 4581,
      "avg": 33.68,
      "sr": 148.59,
      "hs": "103*"
    },
    "rating": 81,
    "team": "MI",
    "retentionPrice": 16.35,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_101",
    "name": "Arshdeep Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/36/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Arshdeep_Singh_Family_%28Cropped%29.jpg",
    "stats": {
      "matches": 97,
      "wickets": 111,
      "econ": 9.19,
      "avg": 28.03,
      "bb": "5/32"
    },
    "rating": 64,
    "team": "MI",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_102",
    "name": "Axar Patel",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Axar_Patel_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 177,
      "wickets": 139,
      "econ": 7.43,
      "runs": 2089,
      "sr": 133.74
    },
    "rating": 75,
    "team": "DC",
    "retentionPrice": 16.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_103",
    "name": "Bhuvneshwar Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Bhuvneshwar_kumar_With_Rashid_Zirak_%28Bhuvneshwar_Kumar_cropped%29.jpg/951px-Bhuvneshwar_kumar_With_Rashid_Zirak_%28Bhuvneshwar_Kumar_cropped%29.jpg",
    "stats": {
      "matches": 206,
      "wickets": 226,
      "econ": 7.71,
      "avg": 26.16,
      "bb": "5/19"
    },
    "rating": 78,
    "team": "RCB",
    "retentionPrice": 10.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_104",
    "name": "Hardik Pandya",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Hardik_Pandya_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 162,
      "runs": 2955,
      "sr": 146.29,
      "wickets": 82,
      "econ": 9.36
    },
    "rating": 80,
    "team": "PBKS",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_105",
    "name": "Heinrich Klaasen",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/202.png",
    "stats": {
      "matches": 64,
      "runs": 2104,
      "avg": 42.08,
      "sr": 166.72,
      "hs": "105*"
    },
    "rating": 88,
    "team": "SRH",
    "retentionPrice": 23,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_106",
    "name": "Ishan Kishan",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ishan_Kishan.jpg",
    "stats": {
      "matches": 134,
      "runs": 3600,
      "avg": 30.51,
      "sr": 143.54,
      "hs": "106*"
    },
    "rating": 77,
    "team": "SRH",
    "retentionPrice": 11.25,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_107",
    "name": "Jofra Archer",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/de/Jofra_Archer_%283%29.jpg",
    "stats": {
      "matches": 68,
      "wickets": 84,
      "econ": 8.22,
      "avg": 25.73,
      "bb": "3/15"
    },
    "rating": 72,
    "team": "RR",
    "retentionPrice": 12.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_108",
    "name": "Jos Buttler",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/01/Jos_Buttler_in_2023.jpg",
    "stats": {
      "matches": 138,
      "runs": 4646,
      "avg": 39.71,
      "sr": 149.73,
      "hs": "124*"
    },
    "rating": 88,
    "team": "GT",
    "retentionPrice": 15.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_109",
    "name": "Josh Hazlewood",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d9/2018_Josh_Hazlewood_%28cropped%29.jpg",
    "stats": {
      "matches": 52,
      "wickets": 72,
      "econ": 8.62,
      "avg": 23.47,
      "bb": "4/12"
    },
    "rating": 72,
    "team": "RCB",
    "retentionPrice": 12.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_110",
    "name": "Kagiso Rabada",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/08/Rabada.jpg",
    "stats": {
      "matches": 101,
      "wickets": 148,
      "econ": 8.8,
      "avg": 22.69,
      "bb": "4/21"
    },
    "rating": 76,
    "team": "GT",
    "retentionPrice": 10.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_111",
    "name": "KL Rahul",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/69/KL_Rahul_at_Femina_Miss_India_2018_Grand_Finale_%28cropped%29.jpg",
    "stats": {
      "matches": 160,
      "runs": 5815,
      "avg": 46.15,
      "sr": 139.15,
      "hs": "152*"
    },
    "rating": 87,
    "team": "DC",
    "retentionPrice": 14,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_112",
    "name": "Kuldeep Yadav",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/91/Kuldeep_Yadav_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 111,
      "wickets": 112,
      "econ": 8.29,
      "avg": 28.21,
      "bb": "4/14"
    },
    "rating": 75,
    "team": "LSG",
    "retentionPrice": 13.25,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_114",
    "name": "Marco Jansen",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/41/Marco_Jansen_2022.jpg",
    "stats": {
      "matches": 49,
      "wickets": 45,
      "econ": 9.63,
      "runs": 192,
      "sr": 110.34
    },
    "rating": 48,
    "team": "PBKS",
    "retentionPrice": 7,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_116",
    "name": "Mitch Marsh",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/73/Mitchell_Marsh.jpg",
    "stats": {
      "matches": 68,
      "runs": 1855,
      "sr": 148.52,
      "wickets": 37,
      "econ": 8.52
    },
    "rating": 76,
    "team": "LSG",
    "retentionPrice": 3.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_117",
    "name": "Mitchell Starc",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "excludeFromMini": true,
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/38/Mitchell_Starc_2023.jpg",
    "stats": {
      "matches": 58,
      "wickets": 76,
      "econ": 8.82,
      "avg": 23.03,
      "bb": "5/35"
    },
    "rating": 69
  },
  {
    "id": "p_118",
    "name": "Mohammed Shami",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/01/Mohammed_Shami_Arjuna_Award_%28cropped%29.jpg",
    "stats": {
      "matches": 132,
      "wickets": 145,
      "econ": 8.67,
      "avg": 29.02,
      "bb": "4/11"
    },
    "rating": 68,
    "team": "RR",
    "retentionPrice": 8,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_119",
    "name": "Mohammed Siraj",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/da/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Mohammad_Siraj_%28cropped%29.jpg",
    "stats": {
      "matches": 125,
      "wickets": 128,
      "econ": 8.78,
      "avg": 30.55,
      "bb": "4/17"
    },
    "rating": 65,
    "team": "GT",
    "retentionPrice": 12.25,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_120",
    "name": "Mahendra Singh Dhoni",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d5/MS_Dhoni_%28Prabhav_%2723_-_RiGI_2023%29.jpg",
    "stats": {
      "matches": 277,
      "runs": 5439,
      "avg": 38.3,
      "sr": 137.45,
      "hs": "84*"
    },
    "rating": 96
  },
  {
    "id": "p_121",
    "name": "Nicholas Pooran",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/136.png",
    "stats": {
      "matches": 104,
      "runs": 2527,
      "avg": 31.59,
      "sr": 164.09,
      "hs": "87*"
    },
    "rating": 81,
    "team": "LSG",
    "retentionPrice": 21,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_122",
    "name": "Noor Ahmad",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/975.png",
    "stats": {
      "matches": 51,
      "wickets": 61,
      "econ": 8.17,
      "avg": 24.51,
      "bb": "4/18"
    },
    "rating": 70,
    "team": "CSK",
    "retentionPrice": 10,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_123",
    "name": "Pat Cummins",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/69/Pat_Cummins_fielding_Ashes_2021_%28cropped%29.jpg",
    "stats": {
      "matches": 80,
      "wickets": 87,
      "econ": 8.89,
      "avg": 30.8,
      "bb": "4/34"
    },
    "rating": 64,
    "team": "SRH",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_124",
    "name": "Phil Salt",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/4b/2_02_Phil_Salt.jpg",
    "stats": {
      "matches": 40,
      "runs": 1258,
      "avg": 34,
      "sr": 174.48,
      "hs": "89*"
    },
    "rating": 83,
    "team": "RCB",
    "retentionPrice": 11.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_125",
    "name": "Rashid Khan",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/71/Rashid_Khan.jpg",
    "stats": {
      "matches": 153,
      "wickets": 179,
      "econ": 7.28,
      "avg": 23.92,
      "bb": "4/24"
    },
    "rating": 82,
    "team": "GT",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_126",
    "name": "Ravindra Jadeja",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2c/PM_Shri_Narendra_Modi_with_Ravindra_Jadeja_%28Cropped%29.jpg",
    "stats": {
      "matches": 267,
      "wickets": 180,
      "econ": 7.71,
      "runs": 3526,
      "sr": 130.64
    },
    "rating": 73,
    "team": "RR",
    "retentionPrice": 14,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_127",
    "name": "Rinku Singh",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/152.png",
    "stats": {
      "matches": 73,
      "runs": 1394,
      "avg": 34,
      "sr": 145.97,
      "hs": "83*"
    },
    "rating": 70,
    "team": "KKR",
    "retentionPrice": 13,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_128",
    "name": "Rishabh Pant",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/77/Rishabh_Pant.jpg",
    "stats": {
      "matches": 139,
      "runs": 3865,
      "avg": 33.61,
      "sr": 146.79,
      "hs": "128*"
    },
    "rating": 81,
    "team": "DC",
    "retentionPrice": 15,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_129",
    "name": "Rohit Sharma",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Shri_Rohit_Gurunath_Sharma_%28Cropped%29.jpg",
    "stats": {
      "matches": 281,
      "runs": 7329,
      "avg": 29.91,
      "sr": 132.92,
      "hs": "109*"
    },
    "rating": 75,
    "team": "MI",
    "retentionPrice": 16.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_130",
    "name": "Ruturaj Gaikwad",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/27/Ruturaj_Gaikwad.jpeg",
    "stats": {
      "matches": 85,
      "runs": 2839,
      "avg": 38.36,
      "sr": 135.64,
      "hs": "108*"
    },
    "rating": 80,
    "team": "CSK",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_132",
    "name": "Sanju Samson",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/70/Sanju_Samson_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 190,
      "runs": 5181,
      "avg": 31.79,
      "sr": 141.13,
      "hs": "119*"
    },
    "rating": 79,
    "team": "CSK",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_134",
    "name": "Shivam Dube",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/63/Shivam_Dube_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 92,
      "runs": 2129,
      "sr": 145.42,
      "wickets": 6,
      "econ": 10.79
    },
    "rating": 55,
    "team": "CSK",
    "retentionPrice": 12,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_135",
    "name": "Shreyas Iyer",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Shreyas_Iyer_snapped_at_the_airport_%28Cropped%29.jpg",
    "stats": {
      "matches": 147,
      "runs": 4229,
      "avg": 35.84,
      "sr": 136.73,
      "hs": "101*"
    },
    "rating": 80,
    "team": "PBKS",
    "retentionPrice": 26.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_136",
    "name": "Shubman Gill",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/34/Shubman_Gill_2023_%28cropped%29.jpg",
    "stats": {
      "matches": 134,
      "runs": 4598,
      "avg": 40.33,
      "sr": 142.09,
      "hs": "129*"
    },
    "rating": 86,
    "team": "GT",
    "retentionPrice": 16.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_137",
    "name": "Sunil Narine",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sunil_Narine.jpg",
    "stats": {
      "matches": 201,
      "wickets": 207,
      "econ": 6.79,
      "runs": 1820,
      "sr": 165.3
    },
    "rating": 88,
    "team": "KKR",
    "retentionPrice": 12,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_138",
    "name": "Tim David",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/636.png",
    "stats": {
      "matches": 66,
      "runs": 1151,
      "avg": 32.89,
      "sr": 177.08,
      "hs": "70*"
    },
    "rating": 75,
    "team": "RCB",
    "retentionPrice": 3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_139",
    "name": "Travis Head",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "excludeFromMini": true,
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/05/Travis_Head_bowling_at_Perth_Stadium%2C_First_Test_Australia_versus_West_Indies%2C_2_December_2022_03_%28cropped%29.jpg",
    "stats": {
      "matches": 53,
      "runs": 1556,
      "avg": 32.42,
      "sr": 170.05,
      "hs": "102*"
    },
    "rating": 85
  },
  {
    "id": "p_140",
    "name": "Trent Boult",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/23/2018.02.03.22.23.14-AUSvNZL_T20_AUS_innings%2C_SCG_%2839533156665%29.jpg",
    "stats": {
      "matches": 124,
      "wickets": 145,
      "econ": 8.49,
      "avg": 27.14,
      "bb": "4/18"
    },
    "rating": 71
  },
  {
    "id": "p_141",
    "name": "Varun Chakaravarthy",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/140.png",
    "stats": {
      "matches": 95,
      "wickets": 111,
      "econ": 7.72,
      "avg": 24.73,
      "bb": "5/20"
    },
    "rating": 76,
    "team": "KKR",
    "retentionPrice": 12,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_142",
    "name": "Virat Kohli",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Virat_Kohli_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 282,
      "runs": 9336,
      "avg": 40.42,
      "sr": 134.8,
      "hs": "113*"
    },
    "rating": 86,
    "team": "RCB",
    "retentionPrice": 21,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_144",
    "name": "Yashasvi Jaiswal",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/71/Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 82,
      "runs": 2593,
      "avg": 33.68,
      "sr": 152.8,
      "hs": "124*"
    },
    "rating": 82,
    "team": "RR",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_145",
    "name": "Yuzvendra Chahal",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Marquee Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/df/Yuzvendra_Chahal_in_PMO_New_Delhi.jpg",
    "stats": {
      "matches": 189,
      "wickets": 233,
      "econ": 8.05,
      "avg": 23.25,
      "bb": "5/40"
    },
    "rating": 79,
    "team": "PBKS",
    "retentionPrice": 18,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_100",
    "name": "Aiden Markram",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/ca/Aiden_Markram_%28cropped%29.jpg",
    "stats": {
      "matches": 69,
      "runs": 1671,
      "avg": 30.38,
      "sr": 135.52,
      "hs": "68*"
    },
    "rating": 68,
    "team": "LSG",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_113",
    "name": "Lockie Ferguson",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Lockie_Ferguson.jpg",
    "stats": {
      "matches": 52,
      "wickets": 52,
      "econ": 9.21,
      "avg": 32.13,
      "bb": "4/28"
    },
    "rating": 56
  },
  {
    "id": "p_115",
    "name": "Marcus Stoinis",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2b/2018.01.21.15.22.25-Stoinis_%2839081521620%29.jpg",
    "stats": {
      "matches": 123,
      "runs": 2242,
      "sr": 147.5,
      "wickets": 46,
      "econ": 9.93
    },
    "rating": 62,
    "team": "PBKS",
    "retentionPrice": 11,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_131",
    "name": "Sam Curran",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1b/The_Prime_Minister_welcomes_the_World_Cup_winning_cricketers_%2852764650104%29_-_Sam_Curran_%28cropped%29.jpg",
    "stats": {
      "matches": 64,
      "wickets": 59,
      "econ": 9.74,
      "runs": 997,
      "sr": 136.39
    },
    "rating": 66,
    "team": "LSG",
    "retentionPrice": 2.4,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_133",
    "name": "Shimron Hetmyer",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Shimron_Hetmyer.jpg",
    "stats": {
      "matches": 94,
      "runs": 1560,
      "avg": 27.37,
      "sr": 149.28,
      "hs": "75*"
    },
    "rating": 65
  },
  {
    "id": "p_143",
    "name": "Will Jacks",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/4d/4_20_Will_Jacks.jpg",
    "stats": {
      "matches": 28,
      "runs": 602,
      "sr": 158.84,
      "wickets": 10,
      "econ": 9.86
    },
    "rating": 56,
    "team": "MI",
    "retentionPrice": 5.25,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_271",
    "name": "Cameron Green",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Cameron_Green_fielding_Boxing_Day_2022_%28cropped%29.jpg",
    "stats": {
      "matches": 43,
      "runs": 1029,
      "sr": 151.1,
      "wickets": 23,
      "econ": 9.44
    },
    "rating": 65,
    "team": "KKR",
    "retentionPrice": 25.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_272",
    "name": "David Miller",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/David_Miller_2025_interview_%28cropped%29.png/500px-David_Miller_2025_interview_%28cropped%29.png",
    "stats": {
      "matches": 152,
      "runs": 3288,
      "avg": 35.74,
      "sr": 139.5,
      "hs": "101*"
    },
    "rating": 75,
    "team": "DC",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_279",
    "name": "Liam Livingstone",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/183.png",
    "stats": {
      "matches": 51,
      "runs": 1066,
      "sr": 155.17,
      "wickets": 13,
      "econ": 9.02
    },
    "rating": 63,
    "team": "CSK",
    "retentionPrice": 6,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_282",
    "name": "Wanindu Hasaranga",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Waniya.jpg",
    "stats": {
      "matches": 37,
      "wickets": 46,
      "econ": 8.41,
      "runs": 81,
      "sr": 92.05
    },
    "rating": 53
  },
  {
    "id": "p_289",
    "name": "Quinton De Kock",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/67/QUINTON_DE_KOCK_%2815681398316%29.jpg",
    "stats": {
      "matches": 118,
      "runs": 3441,
      "avg": 31.28,
      "sr": 134.94,
      "hs": "140*"
    },
    "rating": 76,
    "team": "MI",
    "retentionPrice": 1,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_146",
    "name": "Abhishek Sharma",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/212.png",
    "stats": {
      "matches": 92,
      "runs": 2379,
      "sr": 171.27,
      "wickets": 11,
      "econ": 9.04
    },
    "rating": 77,
    "team": "SRH",
    "retentionPrice": 14,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_150",
    "name": "Dhruv Jurel",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1004.png",
    "stats": {
      "matches": 57,
      "runs": 1195,
      "avg": 31.45,
      "sr": 154.19,
      "hs": "81*"
    },
    "rating": 71,
    "team": "RR",
    "retentionPrice": 14,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_158",
    "name": "Rajat Patidar",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/597.png",
    "stats": {
      "matches": 57,
      "runs": 1612,
      "avg": 33.58,
      "sr": 164.49,
      "hs": "112*"
    },
    "rating": 83,
    "team": "RCB",
    "retentionPrice": 11,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_159",
    "name": "Riyan Parag",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/189.png",
    "stats": {
      "matches": 97,
      "runs": 1875,
      "sr": 144.23,
      "wickets": 9,
      "econ": 9.69
    },
    "rating": 56,
    "team": "RR",
    "retentionPrice": 14,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_162",
    "name": "Sai Sudharsan",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/976.png",
    "stats": {
      "matches": 57,
      "runs": 2515,
      "avg": 48.37,
      "sr": 149.17,
      "hs": "108*"
    },
    "rating": 85,
    "team": "GT",
    "retentionPrice": 8.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_166",
    "name": "Tilak Varma",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Tilak_Varma_in_March_2026.png/500px-Tilak_Varma_in_March_2026.png",
    "stats": {
      "matches": 68,
      "runs": 1858,
      "avg": 35.73,
      "sr": 144.7,
      "hs": "101*"
    },
    "rating": 78,
    "team": "MI",
    "retentionPrice": 8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_167",
    "name": "Tristan Stubbs",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1017.png",
    "stats": {
      "matches": 47,
      "runs": 980,
      "avg": 39.2,
      "sr": 151.23,
      "hs": "71*"
    },
    "rating": 74,
    "team": "DC",
    "retentionPrice": 10,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_296",
    "name": "Matheesha Pathirana",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/412800/412865.jpg",
    "stats": {
      "matches": 33,
      "wickets": 47,
      "econ": 8.66,
      "avg": 21.81,
      "bb": "4/28"
    },
    "rating": 69
  },
  {
    "id": "p_304",
    "name": "Ravi Bishnoi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/520.png",
    "stats": {
      "matches": 86,
      "wickets": 83,
      "econ": 8.36,
      "avg": 30.05,
      "bb": "4/41"
    },
    "rating": 65,
    "team": "RR",
    "retentionPrice": 7.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_172",
    "name": "Dewald Brevis",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/797.png",
    "stats": {
      "matches": 27,
      "runs": 606,
      "avg": 25.25,
      "sr": 146.02,
      "hs": "57"
    },
    "rating": 57,
    "team": "CSK",
    "retentionPrice": 2.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_216",
    "name": "Ashutosh Sharma",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3109.png",
    "stats": {
      "matches": 32,
      "runs": 564,
      "sr": 168.86,
      "wickets": 0,
      "econ": 0
    },
    "rating": 52,
    "team": "DC",
    "retentionPrice": 3.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_254",
    "name": "Shashank Singh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/191.png",
    "stats": {
      "matches": 54,
      "runs": 905,
      "sr": 161.61,
      "wickets": 5,
      "econ": 9.33
    },
    "rating": 56,
    "team": "PBKS",
    "retentionPrice": 5.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_264",
    "name": "Vaibhav Sooryavanshi",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/68/Vaibhav_Suryavanshi_meets_PM_Modi.jpg",
    "stats": {
      "matches": 23,
      "runs": 1028,
      "avg": 44.7,
      "sr": 228.95,
      "hs": "103"
    },
    "rating": 77,
    "team": "RR",
    "retentionPrice": 1.1,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_193",
    "name": "Jitesh Sharma",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/1000.png",
    "stats": {
      "matches": 71,
      "runs": 1107,
      "avg": 23.06,
      "sr": 152.48,
      "hs": "85*"
    },
    "rating": 61,
    "team": "RCB",
    "retentionPrice": 11,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_196",
    "name": "Nitish Kumar Reddy",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Nitish_Kumar_Reddy_BGT_2024_%28cropped%29_2.jpg",
    "stats": {
      "matches": 42,
      "runs": 787,
      "sr": 145.47,
      "wickets": 13,
      "econ": 10.65
    },
    "rating": 52,
    "team": "SRH",
    "retentionPrice": 6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_240",
    "name": "Naman Dhir",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3107.png",
    "stats": {
      "matches": 37,
      "runs": 710,
      "avg": 27.31,
      "sr": 163.97,
      "hs": "62*"
    },
    "rating": 68,
    "team": "MI",
    "retentionPrice": 5.25,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_281",
    "name": "Venkatesh Iyer",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Venkatesh_Iyer.png",
    "stats": {
      "matches": 68,
      "runs": 1677,
      "sr": 142,
      "wickets": 3,
      "econ": 10.59
    },
    "rating": 54,
    "team": "RCB",
    "retentionPrice": 7,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_285",
    "name": "Finn Allen",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/416700/416748.jpg",
    "stats": {
      "matches": 11,
      "runs": 349,
      "avg": 34.9,
      "sr": 214.11,
      "hs": "100*"
    },
    "rating": 54,
    "team": "KKR",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_147",
    "name": "Avesh Khan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/109.png",
    "stats": {
      "matches": 82,
      "wickets": 93,
      "econ": 9.28,
      "avg": 29.4,
      "bb": "4/24"
    },
    "rating": 62
  },
  {
    "id": "p_148",
    "name": "Azmatullah Omarzai",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1354.png",
    "stats": {
      "matches": 20,
      "wickets": 15,
      "econ": 9.63,
      "runs": 151,
      "sr": 149.5
    },
    "rating": 45,
    "team": "PBKS",
    "retentionPrice": 2.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_149",
    "name": "Deepak Chahar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Deepak_Chahar.jpg",
    "stats": {
      "matches": 103,
      "wickets": 96,
      "econ": 8.3,
      "avg": 29.81,
      "bb": "4/13"
    },
    "rating": 65
  },
  {
    "id": "p_151",
    "name": "Glenn Phillips",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/635.png",
    "stats": {
      "matches": 14,
      "runs": 132,
      "avg": 12,
      "sr": 121.1,
      "hs": "25*"
    },
    "rating": 26,
    "team": "GT",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_152",
    "name": "Harshal Patel",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/399800/399836.jpg",
    "stats": {
      "matches": 123,
      "wickets": 151,
      "econ": 8.92,
      "avg": 24.68,
      "bb": "5/27"
    },
    "rating": 70,
    "team": "GT",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_153",
    "name": "Khaleel Ahmed",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/f8/2_29_Khaleel_mugshot.jpg",
    "stats": {
      "matches": 76,
      "wickets": 91,
      "econ": 8.96,
      "avg": 27.19,
      "bb": "3/21"
    },
    "rating": 66,
    "team": "SRH",
    "retentionPrice": 4.8,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_154",
    "name": "Krunal Pandya",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Krunal_Pandya_and_Hardik_Pandya_%28cropped%29_%28cropped%29.jpg",
    "stats": {
      "matches": 158,
      "wickets": 107,
      "econ": 7.57,
      "runs": 1982,
      "sr": 133.83
    },
    "rating": 72,
    "team": "RCB",
    "retentionPrice": 5.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_155",
    "name": "Mayank Yadav",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://www.lucknowsupergiants.in/static-assets/waf-images/c8/4a/15/16-9/HPXdCAZZjc.JPG?v=1.11&w=1200",
    "stats": {
      "matches": 10,
      "wickets": 9,
      "econ": 10.15,
      "avg": 40.78,
      "bb": "3/14"
    },
    "rating": 28,
    "team": "LSG",
    "retentionPrice": 11,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_156",
    "name": "Mitch Santner",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/416000/416080.jpg",
    "stats": {
      "matches": 35,
      "wickets": 30,
      "econ": 7.51,
      "runs": 136,
      "sr": 110.57
    },
    "rating": 54,
    "team": "MI",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_157",
    "name": "Prasidh Krishna",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/150.png",
    "stats": {
      "matches": 78,
      "wickets": 90,
      "econ": 8.99,
      "avg": 28.87,
      "bb": "4/28"
    },
    "rating": 64,
    "team": "GT",
    "retentionPrice": 9.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_160",
    "name": "Romario Shepherd",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/371.png",
    "stats": {
      "matches": 33,
      "wickets": 17,
      "econ": 11.77,
      "runs": 268,
      "sr": 175.16
    },
    "rating": 44,
    "team": "RCB",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_161",
    "name": "Rovman Powell",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/329.png",
    "stats": {
      "matches": 39,
      "runs": 555,
      "avg": 22.2,
      "sr": 142.31,
      "hs": "67*"
    },
    "rating": 53,
    "team": "KKR",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_164",
    "name": "Sherfane Rutherford",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/122.png",
    "stats": {
      "matches": 31,
      "runs": 520,
      "avg": 24.76,
      "sr": 142.86,
      "hs": "71*"
    },
    "rating": 54,
    "team": "MI",
    "retentionPrice": 2.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_165",
    "name": "Thangarasu Natarajan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/65/T_Natarajan.jpg",
    "stats": {
      "matches": 74,
      "wickets": 73,
      "econ": 9.19,
      "avg": 32.58,
      "bb": "4/19"
    },
    "rating": 58,
    "team": "SRH",
    "retentionPrice": 5,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_168",
    "name": "Washington Sundar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/23/Washington_Sundar.jpg",
    "stats": {
      "matches": 83,
      "wickets": 40,
      "econ": 7.77,
      "runs": 888,
      "sr": 135.37
    },
    "rating": 62,
    "team": "GT",
    "retentionPrice": 3.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_292",
    "name": "Anrich Nortje",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/413700/413768.jpg",
    "stats": {
      "matches": 49,
      "wickets": 61,
      "econ": 9.09,
      "avg": 27.8,
      "bb": "3/33"
    },
    "rating": 64
  },
  {
    "id": "p_300",
    "name": "Akeal Hosein",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/417200/417206.jpg",
    "stats": {
      "matches": 8,
      "wickets": 9,
      "econ": 8.3,
      "avg": 26.44,
      "bb": "4/17"
    },
    "rating": 37,
    "team": "CSK",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_301",
    "name": "Maheesh Theekshana",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/629.png",
    "stats": {
      "matches": 38,
      "wickets": 36,
      "econ": 8.27,
      "avg": 33.53,
      "bb": "4/33"
    },
    "rating": 61
  },
  {
    "id": "p_303",
    "name": "Rahul Chahar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/339300/339303.jpg",
    "stats": {
      "matches": 80,
      "wickets": 75,
      "econ": 7.78,
      "avg": 29.28,
      "bb": "4/27"
    },
    "rating": 68,
    "team": "CSK",
    "retentionPrice": 5.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_174",
    "name": "Jacob Bethell",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 2",
    "excludeFromMini": true,
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/869.png",
    "stats": {
      "matches": 9,
      "runs": 163,
      "sr": 140.52,
      "wickets": 0,
      "econ": 0
    },
    "rating": 29
  },
  {
    "id": "p_180",
    "name": "Mukesh Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1462.png",
    "stats": {
      "matches": 42,
      "wickets": 42,
      "econ": 10.59,
      "avg": 34.64,
      "bb": "4/33"
    },
    "rating": 49,
    "team": "DC",
    "retentionPrice": 8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_183",
    "name": "Nitish Rana",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/416100/416152.jpg",
    "stats": {
      "matches": 127,
      "runs": 3078,
      "avg": 27.73,
      "sr": 137.72,
      "hs": "91*"
    },
    "rating": 71
  },
  {
    "id": "p_185",
    "name": "Rahul Tewatia",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/120.png",
    "stats": {
      "matches": 124,
      "runs": 1302,
      "sr": 138.07,
      "wickets": 32,
      "econ": 7.91
    },
    "rating": 59,
    "team": "GT",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_186",
    "name": "Ryan Rickelton",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/9b/2_40_Ryan_Rickleton.jpg",
    "stats": {
      "matches": 26,
      "runs": 836,
      "avg": 34.83,
      "sr": 168.21,
      "hs": "123*"
    },
    "rating": 75,
    "team": "MI",
    "retentionPrice": 1,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_241",
    "name": "Nehal Wadhera",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1541.png",
    "stats": {
      "matches": 45,
      "runs": 784,
      "avg": 23.76,
      "sr": 140,
      "hs": "70*"
    },
    "rating": 57
  },
  {
    "id": "p_245",
    "name": "Priyansh Arya",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3571.png",
    "stats": {
      "matches": 31,
      "runs": 909,
      "avg": 29.32,
      "sr": 192.99,
      "hs": "103"
    },
    "rating": 77,
    "team": "PBKS",
    "retentionPrice": 3.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_188",
    "name": "Ajinkya Rahane",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/96/Ajinkya_Rahane_2016_%28cropped%29.jpg",
    "stats": {
      "matches": 212,
      "runs": 5367,
      "avg": 30.15,
      "sr": 125.6,
      "hs": "105*"
    },
    "rating": 82
  },
  {
    "id": "p_189",
    "name": "Devdutt Padikkal",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Devdutt_Paddikal_%28cropped%29.jpg",
    "stats": {
      "matches": 90,
      "runs": 2270,
      "avg": 26.71,
      "sr": 133.14,
      "hs": "101*"
    },
    "rating": 67,
    "team": "RCB",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_190",
    "name": "Harshit Rana",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/411800/411863.jpg",
    "stats": {
      "matches": 33,
      "wickets": 40,
      "econ": 9.51,
      "avg": 25.72,
      "bb": "3/24"
    },
    "rating": 60,
    "team": "KKR",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_198",
    "name": "Sandeep Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/415300/415377.jpg",
    "stats": {
      "matches": 142,
      "wickets": 151,
      "econ": 8.16,
      "avg": 28.44,
      "bb": "5/18"
    },
    "rating": 72,
    "team": "RR",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_199",
    "name": "Shahbaz Ahmed",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/523.png",
    "stats": {
      "matches": 63,
      "runs": 603,
      "sr": 123.31,
      "wickets": 27,
      "econ": 9.79
    },
    "rating": 47,
    "team": "LSG",
    "retentionPrice": 2.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_203",
    "name": "Yash Dayal",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/399000/399041.jpg",
    "stats": {
      "matches": 43,
      "wickets": 41,
      "econ": 9.58,
      "avg": 33.9,
      "bb": "3/20"
    },
    "rating": 51,
    "team": "RCB",
    "retentionPrice": 5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_219",
    "name": "Ayush Mhatre",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3497.png",
    "stats": {
      "matches": 13,
      "runs": 441,
      "avg": 33.92,
      "sr": 183.75,
      "hs": "94"
    },
    "rating": 58,
    "team": "CSK",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_253",
    "name": "Sameer Rizvi",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sameer_rizvi_With_Rashid_Zirak.jpg/6000px-Sameer_rizvi_With_Rashid_Zirak.jpg",
    "stats": {
      "matches": 25,
      "runs": 424,
      "sr": 144.71,
      "wickets": 0,
      "econ": 0
    },
    "rating": 43,
    "team": "DC",
    "retentionPrice": 0.95,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_275",
    "name": "Prithvi Shaw",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Prithvi_shaw.png",
    "stats": {
      "matches": 79,
      "runs": 1892,
      "avg": 23.95,
      "sr": 147.47,
      "hs": "99"
    },
    "rating": 69,
    "team": "DC",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_276",
    "name": "Sarfaraz Khan",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 3",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/393600/393683.2.png",
    "stats": {
      "matches": 58,
      "runs": 746,
      "avg": 22.61,
      "sr": 137.38,
      "hs": "67*"
    },
    "rating": 52,
    "team": "CSK",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_280",
    "name": "Rachin Ravindra",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Rachin_Ravindra.jpg/500px-Rachin_Ravindra.jpg",
    "stats": {
      "matches": 18,
      "runs": 413,
      "sr": 143.9,
      "wickets": 0,
      "econ": 3.5
    },
    "rating": 51
  },
  {
    "id": "p_163",
    "name": "Shardul Thakur",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/105.png",
    "stats": {
      "matches": 114,
      "wickets": 119,
      "econ": 9.57,
      "runs": 349,
      "sr": 132.7
    },
    "rating": 60,
    "team": "MI",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_291",
    "name": "Akash Deep",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Akash_Deep_photo.jpg/500px-Akash_Deep_photo.jpg",
    "stats": {
      "matches": 14,
      "wickets": 10,
      "econ": 11.83,
      "avg": 54.8,
      "bb": "3/45"
    },
    "rating": 29
  },
  {
    "id": "p_181",
    "name": "Nandre Burger",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2024/2806.png",
    "stats": {
      "matches": 18,
      "wickets": 21,
      "econ": 9.67,
      "avg": 27.86,
      "bb": "2/21"
    },
    "rating": 43,
    "team": "RR",
    "retentionPrice": 3.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_218",
    "name": "Ayush Badoni",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/985.png",
    "stats": {
      "matches": 66,
      "runs": 1178,
      "avg": 25.61,
      "sr": 140.91,
      "hs": "74*"
    },
    "rating": 61,
    "team": "LSG",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_243",
    "name": "Prabhsimran Singh",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/137.png",
    "stats": {
      "matches": 66,
      "runs": 1865,
      "avg": 29.6,
      "sr": 156.85,
      "hs": "103*"
    },
    "rating": 78,
    "team": "PBKS",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_195",
    "name": "Manish Pandey",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/b/bb/Manish_Pandey_%283%29.jpg",
    "stats": {
      "matches": 180,
      "runs": 4012,
      "avg": 29.5,
      "sr": 121.83,
      "hs": "114*"
    },
    "rating": 66,
    "team": "KKR",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_197",
    "name": "Sai Kishore",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/4_15_Sai_Kishore.jpg/500px-4_15_Sai_Kishore.jpg",
    "stats": {
      "matches": 28,
      "wickets": 33,
      "econ": 8.99,
      "avg": 21.12,
      "bb": "4/33"
    },
    "rating": 56,
    "team": "GT",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_201",
    "name": "Tushar Deshpande",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Tushar_Deshpande.jpg",
    "stats": {
      "matches": 53,
      "wickets": 55,
      "econ": 10.11,
      "avg": 33.78,
      "bb": "4/27"
    },
    "rating": 51
  },
  {
    "id": "p_202",
    "name": "Umran Malik",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/93/Umran_Malik_in_GGM.jpg",
    "stats": {
      "matches": 26,
      "wickets": 29,
      "econ": 9.4,
      "avg": 26.62,
      "bb": "5/25"
    },
    "rating": 50
  },
  {
    "id": "p_206",
    "name": "Abishek Porel",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1580.png",
    "stats": {
      "matches": 36,
      "runs": 769,
      "avg": 25.63,
      "sr": 145.37,
      "hs": "65*"
    },
    "rating": 62
  },
  {
    "id": "p_226",
    "name": "Harpreet Brar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/130.png",
    "stats": {
      "matches": 51,
      "wickets": 37,
      "econ": 8,
      "runs": 249,
      "sr": 120.87
    },
    "rating": 55,
    "team": "PBKS",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_237",
    "name": "Mohsin Khan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/416200/416254.jpg",
    "stats": {
      "matches": 31,
      "wickets": 38,
      "econ": 8.41,
      "avg": 24.13,
      "bb": "5/23"
    },
    "rating": 64,
    "team": "LSG",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_250",
    "name": "Ramandeep Singh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/991.png",
    "stats": {
      "matches": 38,
      "runs": 299,
      "sr": 145.85,
      "wickets": 7,
      "econ": 10.07
    },
    "rating": 42,
    "team": "KKR",
    "retentionPrice": 4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_268",
    "name": "Yash Thakur",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1550.png",
    "stats": {
      "matches": 22,
      "wickets": 27,
      "econ": 10.6,
      "avg": 30.56,
      "bb": "5/30"
    },
    "rating": 46,
    "team": "PBKS",
    "retentionPrice": 1.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_295",
    "name": "Jacob Duffy",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/ee/1_01_Jacob_Duffy.jpg",
    "stats": {
      "matches": 6,
      "wickets": 9,
      "econ": 10.96,
      "avg": 29.22,
      "bb": "3/22"
    },
    "rating": 31,
    "team": "RCB",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_209",
    "name": "Angkrish Raghuvanshi",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/787.png",
    "stats": {
      "matches": 35,
      "runs": 885,
      "avg": 34.04,
      "sr": 145.56,
      "hs": "82*"
    },
    "rating": 71,
    "team": "KKR",
    "retentionPrice": 3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_235",
    "name": "Mayank Markande",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/87.png",
    "stats": {
      "matches": 40,
      "wickets": 37,
      "econ": 9.16,
      "avg": 30.95,
      "bb": "4/15"
    },
    "rating": 53
  },
  {
    "id": "p_259",
    "name": "Suyash Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Suyash_Sharma.png",
    "stats": {
      "matches": 39,
      "wickets": 27,
      "econ": 8.89,
      "avg": 44.07,
      "bb": "3/17"
    },
    "rating": 49,
    "team": "RCB",
    "retentionPrice": 2.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_260",
    "name": "Swapnil Singh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/1483.png",
    "stats": {
      "matches": 14,
      "wickets": 7,
      "econ": 8.93,
      "runs": 51,
      "sr": 113.33
    },
    "rating": 30
  },
  {
    "id": "p_262",
    "name": "Urvil Patel",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 3",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1486.png",
    "stats": {
      "matches": 10,
      "runs": 197,
      "avg": 19.7,
      "sr": 205.21,
      "hs": "65"
    },
    "rating": 41,
    "team": "CSK",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_297",
    "name": "Matt Henry",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Matt_Henry_2018.jpg/500px-Matt_Henry_2018.jpg",
    "stats": {
      "matches": 9,
      "wickets": 4,
      "econ": 11.52,
      "avg": 77.75,
      "bb": "2/54"
    },
    "rating": 20
  },
  {
    "id": "p_169",
    "name": "AM Ghazanfar",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/2761.png",
    "stats": {
      "matches": 11,
      "wickets": 15,
      "econ": 10.02,
      "avg": 25.93,
      "bb": "2/17"
    },
    "rating": 38
  },
  {
    "id": "p_170",
    "name": "Brydon Carse",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/ad/1_24_Brydon_Carse.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0,
      "bb": "-"
    },
    "rating": 2,
    "team": "SRH",
    "retentionPrice": 1,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_171",
    "name": "Corbin Bosch",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/1041.png",
    "stats": {
      "matches": 9,
      "wickets": 13,
      "econ": 9.2,
      "runs": 97,
      "sr": 153.97
    },
    "rating": 45,
    "team": "MI",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_173",
    "name": "Dushmantha Chameera",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/608.png",
    "stats": {
      "matches": 20,
      "wickets": 13,
      "econ": 9.7,
      "avg": 47.77,
      "bb": "2/17"
    },
    "rating": 33
  },
  {
    "id": "p_175",
    "name": "Jamie Overton",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Jamie_Overton.jpg",
    "stats": {
      "matches": 13,
      "wickets": 14,
      "econ": 9.76,
      "runs": 151,
      "sr": 162.37
    },
    "rating": 47,
    "team": "CSK",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_176",
    "name": "Jaydev Unadkat",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7f/2_09_Jaydev_Unadkat_1.jpg",
    "stats": {
      "matches": 116,
      "wickets": 114,
      "econ": 8.94,
      "avg": 30.74,
      "bb": "5/25"
    },
    "rating": 62
  },
  {
    "id": "p_177",
    "name": "Kamindu Mendis",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/402300/402346.jpg",
    "stats": {
      "matches": 6,
      "runs": 92,
      "sr": 133.3,
      "wickets": 2,
      "econ": 8.6
    },
    "rating": 28
  },
  {
    "id": "p_178",
    "name": "Matthew Breetzke",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2805.png",
    "stats": {
      "matches": 1,
      "runs": 14,
      "avg": 14,
      "sr": 116.67,
      "hs": "14"
    },
    "rating": 10
  },
  {
    "id": "p_179",
    "name": "Mitch Owen",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/402000/402034.jpg",
    "stats": {
      "matches": 1,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 7
  },
  {
    "id": "p_182",
    "name": "Nathan Ellis",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/633.png",
    "stats": {
      "matches": 17,
      "wickets": 19,
      "econ": 8.67,
      "avg": 28.74,
      "bb": "4/30"
    },
    "rating": 47,
    "team": "SRH",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_184",
    "name": "Nuwan Thushara",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/813.png",
    "stats": {
      "matches": 8,
      "wickets": 9,
      "econ": 9.43,
      "avg": 31.44,
      "bb": "3/28"
    },
    "rating": 32,
    "team": "RCB",
    "retentionPrice": 1.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_187",
    "name": "Xavier Bartlett",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3572.png",
    "stats": {
      "matches": 13,
      "wickets": 7,
      "econ": 11.13,
      "avg": 69.14,
      "bb": "2/9"
    },
    "rating": 25,
    "team": "PBKS",
    "retentionPrice": 0.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_191",
    "name": "Ishant Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/06/Ishant_Sharma_4.jpg",
    "stats": {
      "matches": 117,
      "wickets": 96,
      "econ": 8.38,
      "avg": 35.18,
      "bb": "5/12"
    },
    "rating": 62
  },
  {
    "id": "p_192",
    "name": "Jayant Yadav",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/165.png",
    "stats": {
      "matches": 20,
      "wickets": 8,
      "econ": 6.85,
      "runs": 40,
      "sr": 111.11
    },
    "rating": 38,
    "team": "GT",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_194",
    "name": "Karun Nair",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Karun_nair_With_Rashid_Zirak.jpg",
    "stats": {
      "matches": 86,
      "runs": 1712,
      "avg": 23.45,
      "sr": 131.29,
      "hs": "89*"
    },
    "rating": 59
  },
  {
    "id": "p_204",
    "name": "Abdul Samad",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/525.png",
    "stats": {
      "matches": 71,
      "runs": 857,
      "sr": 148.78,
      "wickets": 2,
      "econ": 13.16
    },
    "rating": 33,
    "team": "LSG",
    "retentionPrice": 4.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_205",
    "name": "Abhinandan Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3574.png",
    "stats": {
      "matches": 3,
      "wickets": 3,
      "econ": 12.62,
      "avg": 40.67,
      "bb": "2/30"
    },
    "rating": 18,
    "team": "RCB",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_207",
    "name": "Ajay Mandal",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1931.png",
    "stats": {
      "matches": 0,
      "runs": 0,
      "wickets": 0,
      "econ": 0,
      "sr": 0
    },
    "rating": 2
  },
  {
    "id": "p_208",
    "name": "Akash Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/535.png",
    "stats": {
      "matches": 12,
      "wickets": 13,
      "econ": 9.86,
      "avg": 31.23,
      "bb": "3/26"
    },
    "rating": 35,
    "team": "LSG",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_210",
    "name": "Aniket Verma",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3576.png",
    "stats": {
      "matches": 24,
      "runs": 315,
      "avg": 21,
      "sr": 160.71,
      "hs": "74*"
    },
    "rating": 50,
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_211",
    "name": "Anshul Kamboj",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3106.png",
    "stats": {
      "matches": 25,
      "wickets": 31,
      "econ": 9.97,
      "avg": 26.32,
      "bb": "3/13"
    },
    "rating": 49,
    "team": "CSK",
    "retentionPrice": 3.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_212",
    "name": "Anuj Rawat",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/534.png",
    "stats": {
      "matches": 24,
      "runs": 318,
      "avg": 19.88,
      "sr": 119.1,
      "hs": "66*"
    },
    "rating": 37,
    "team": "GT",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_213",
    "name": "Anukul Roy",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/160.png",
    "stats": {
      "matches": 25,
      "wickets": 15,
      "econ": 8.9,
      "runs": 78,
      "sr": 121.88
    },
    "rating": 40,
    "team": "KKR",
    "retentionPrice": 0.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_214",
    "name": "Arjun Tendulkar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/05/Sachin_Tendulkar_family_%28cropped%29.jpg",
    "stats": {
      "matches": 6,
      "wickets": 4,
      "econ": 9.28,
      "runs": 18,
      "sr": 128.57
    },
    "rating": 24,
    "team": "LSG",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_215",
    "name": "Arshin Kulkarni",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2788.png",
    "stats": {
      "matches": 4,
      "runs": 26,
      "sr": 78.79,
      "wickets": 0,
      "econ": 0
    },
    "rating": 11,
    "team": "LSG",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_217",
    "name": "Ashwani Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3569.png",
    "stats": {
      "matches": 10,
      "wickets": 17,
      "econ": 10.95,
      "avg": 19.65,
      "bb": "4/24"
    },
    "rating": 39,
    "team": "MI",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_221",
    "name": "Donovan Ferreira",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2033.png",
    "stats": {
      "matches": 18,
      "runs": 326,
      "sr": 170.68,
      "wickets": 1,
      "econ": 13.67
    },
    "rating": 29,
    "team": "RR",
    "retentionPrice": 1,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_222",
    "name": "Eshan Malinga",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/416600/416657.jpg",
    "stats": {
      "matches": 22,
      "wickets": 33,
      "econ": 9.2,
      "avg": 22.58,
      "bb": "4/32"
    },
    "rating": 63,
    "team": "SRH",
    "retentionPrice": 1.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_223",
    "name": "Gurjapneet Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/415800/415832.jpg",
    "stats": {
      "matches": 8,
      "wickets": 4,
      "econ": 9.26,
      "avg": 58.25,
      "bb": "1/7"
    },
    "rating": 23,
    "team": "CSK",
    "retentionPrice": 2.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_225",
    "name": "Harnoor Singh",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/784.png",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 3
  },
  {
    "id": "p_227",
    "name": "Harsh Dubey",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/415900/415997.jpg",
    "stats": {
      "matches": 11,
      "wickets": 13,
      "econ": 10.19,
      "avg": 25.08,
      "bb": "3/12"
    },
    "rating": 35,
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_228",
    "name": "Himmat Singh",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Himmat_Singh_statue.jpg/3096px-Himmat_Singh_statue.jpg",
    "stats": {
      "matches": 9,
      "runs": 92,
      "avg": 30.67,
      "sr": 133.33,
      "hs": "40*"
    },
    "rating": 31
  },
  {
    "id": "p_229",
    "name": "Kumar Kushagra",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3101.png",
    "stats": {
      "matches": 5,
      "runs": 21,
      "avg": 5.25,
      "sr": 100,
      "hs": "18"
    },
    "rating": 12,
    "team": "GT",
    "retentionPrice": 0.65,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_230",
    "name": "Kwena Maphaka",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/801.png",
    "stats": {
      "matches": 4,
      "wickets": 2,
      "econ": 13,
      "avg": 71.5,
      "bb": "1/23"
    },
    "rating": 15
  },
  {
    "id": "p_232",
    "name": "Manimaran Siddharth",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/532.png",
    "stats": {
      "matches": 9,
      "wickets": 9,
      "econ": 9.13,
      "avg": 31.44,
      "bb": "2/35"
    },
    "rating": 33,
    "team": "RR",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_233",
    "name": "Madhav Tiwari",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3561.png",
    "stats": {
      "matches": 5,
      "runs": 21,
      "avg": 21,
      "sr": 175,
      "hs": "18*"
    },
    "rating": 24,
    "team": "DC",
    "retentionPrice": 0.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_234",
    "name": "Manav Suthar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2443.png",
    "stats": {
      "matches": 5,
      "wickets": 2,
      "econ": 11.75,
      "avg": 47,
      "bb": "1/19"
    },
    "rating": 15,
    "team": "GT",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_236",
    "name": "Arshad Khan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/988.png",
    "stats": {
      "matches": 27,
      "wickets": 18,
      "econ": 11.06,
      "avg": 38.5,
      "bb": "3/22"
    },
    "rating": 35,
    "team": "GT",
    "retentionPrice": 1.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_238",
    "name": "Mukesh Choudhary",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/970.png",
    "stats": {
      "matches": 24,
      "wickets": 25,
      "econ": 9.58,
      "avg": 30.84,
      "bb": "4/46"
    },
    "rating": 46,
    "team": "CSK",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_239",
    "name": "Musheer Khan",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2813.png",
    "stats": {
      "matches": 1,
      "wickets": 1,
      "econ": 13.5,
      "runs": 0,
      "sr": 0
    },
    "rating": 7,
    "team": "PBKS",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_242",
    "name": "Nishant Sindhu",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/791.png",
    "stats": {
      "matches": 8,
      "runs": 63,
      "sr": 126,
      "wickets": 0,
      "econ": 0
    },
    "rating": 21,
    "team": "GT",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_244",
    "name": "Prince Yadav",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1225.png",
    "stats": {
      "matches": 20,
      "wickets": 19,
      "econ": 9.14,
      "avg": 36,
      "bb": "3/32"
    },
    "rating": 44,
    "team": "LSG",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_246",
    "name": "Pyla Avinash",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3573.png",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 3
  },
  {
    "id": "p_247",
    "name": "Raghu Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3869.png",
    "stats": {
      "matches": 6,
      "wickets": 1,
      "econ": 8.67,
      "avg": 130,
      "bb": "1/36"
    },
    "rating": 18,
    "team": "MI",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_248",
    "name": "Raj Bawa",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/781.png",
    "stats": {
      "matches": 8,
      "wickets": 2,
      "econ": 12.5,
      "runs": 35,
      "sr": 109.38
    },
    "rating": 13,
    "team": "MI",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_249",
    "name": "Ramakrishna Ghosh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280,q_70/lsci/db/PICTURES/CMS/416400/416475.6.jpg",
    "stats": {
      "matches": 1,
      "wickets": 1,
      "econ": 8,
      "runs": 0,
      "sr": 0
    },
    "rating": 15,
    "team": "CSK",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_251",
    "name": "Rasikh Dar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d0/RasikhSalam.jpg",
    "stats": {
      "matches": 25,
      "wickets": 29,
      "econ": 10.01,
      "avg": 28.07,
      "bb": "4/24"
    },
    "rating": 46,
    "team": "RCB",
    "retentionPrice": 6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_252",
    "name": "Robin Minz",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3103.png",
    "stats": {
      "matches": 4,
      "runs": 12,
      "avg": 4,
      "sr": 63.16,
      "hs": "5*"
    },
    "rating": 10
  },
  {
    "id": "p_255",
    "name": "Shreyas Gopal",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/12/Rajasthan_Royals_player_Shreyas_Gopal_in_a_post-match_presentation_during_2019_Indian_Premier_League.png",
    "stats": {
      "matches": 52,
      "wickets": 52,
      "econ": 8.17,
      "avg": 25.94,
      "bb": "4/16"
    },
    "rating": 65,
    "team": "CSK",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_256",
    "name": "Shubham Dubey",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3112.png",
    "stats": {
      "matches": 19,
      "runs": 220,
      "avg": 22,
      "sr": 153.85,
      "hs": "34*"
    },
    "rating": 43,
    "team": "RR",
    "retentionPrice": 0.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_258",
    "name": "Suryansh Shedge",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Suryansh_Shedge.jpg/500px-Suryansh_Shedge.jpg",
    "stats": {
      "matches": 12,
      "runs": 165,
      "sr": 163.37,
      "wickets": 0,
      "econ": 13.33
    },
    "rating": 23,
    "team": "PBKS",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_261",
    "name": "Tripurana Vijay",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3563.png",
    "stats": {
      "matches": 1,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 7,
    "team": "DC",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_263",
    "name": "Vaibhav Arora",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/583.png",
    "stats": {
      "matches": 43,
      "wickets": 47,
      "econ": 9.74,
      "avg": 29.91,
      "bb": "3/27"
    },
    "rating": 54,
    "team": "KKR",
    "retentionPrice": 1.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_265",
    "name": "Vipraj Nigam",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/3560.png",
    "stats": {
      "matches": 19,
      "wickets": 13,
      "econ": 9.77,
      "runs": 157,
      "sr": 176.4
    },
    "rating": 46,
    "team": "DC",
    "retentionPrice": 0.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_266",
    "name": "Vishnu Vinod",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/581.png",
    "stats": {
      "matches": 7,
      "runs": 71,
      "avg": 11.83,
      "sr": 109.23,
      "hs": "30*"
    },
    "rating": 18,
    "team": "PBKS",
    "retentionPrice": 0.95,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_267",
    "name": "Vijaykumar Vyshak",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2034.png",
    "stats": {
      "matches": 26,
      "wickets": 26,
      "econ": 10.47,
      "avg": 34.85,
      "bb": "3/20"
    },
    "rating": 43,
    "team": "PBKS",
    "retentionPrice": 1.8,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_269",
    "name": "Yudhvir Singh Charak",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/358100/358150.jpg",
    "stats": {
      "matches": 9,
      "wickets": 8,
      "econ": 11,
      "avg": 31.63,
      "bb": "3/47"
    },
    "rating": 23
  },
  {
    "id": "p_270",
    "name": "Zeeshan Ansari",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Set 4",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3575.png",
    "stats": {
      "matches": 10,
      "wickets": 6,
      "econ": 9.84,
      "avg": 55.5,
      "bb": "3/42"
    },
    "rating": 24,
    "team": "DC",
    "retentionPrice": 0.4,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_284",
    "name": "Ben Duckett",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "WK1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/fd/3_31_Another_four_%28Ben_Duckett_cropped%29.jpg",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 3
  },
  {
    "id": "p_294",
    "name": "Gerald Coetzee",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "FA1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/RSA_vs_AUS_Day_2_-_Gerald_Coetzee.jpg/500px-RSA_vs_AUS_Day_2_-_Gerald_Coetzee.jpg",
    "stats": {
      "matches": 14,
      "wickets": 15,
      "econ": 10.37,
      "avg": 31.47,
      "bb": "4/34"
    },
    "rating": 36
  },
  {
    "id": "p_298",
    "name": "Shivam Mavi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "FA1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/154.png",
    "stats": {
      "matches": 32,
      "wickets": 30,
      "econ": 8.71,
      "avg": 31.4,
      "bb": "4/21"
    },
    "rating": 55
  },
  {
    "id": "p_299",
    "name": "Spencer Johnson",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "FA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/417300/417309.jpg",
    "stats": {
      "matches": 12,
      "wickets": 7,
      "econ": 10.33,
      "avg": 56.57,
      "bb": "2/25"
    },
    "rating": 25
  },
  {
    "id": "p_308",
    "name": "Anmolpreet Singh",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Anmolpreet_Singh_2.jpg",
    "stats": {
      "matches": 9,
      "runs": 139,
      "avg": 15.44,
      "sr": 120.87,
      "hs": "36"
    },
    "rating": 25
  },
  {
    "id": "p_309",
    "name": "Atharva Taide",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/379100/379180.jpg",
    "stats": {
      "matches": 10,
      "runs": 260,
      "avg": 26,
      "sr": 146.89,
      "hs": "66"
    },
    "rating": 42
  },
  {
    "id": "p_310",
    "name": "Yash Dhull",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/380000/380035.jpg",
    "stats": {
      "matches": 4,
      "runs": 16,
      "avg": 5.33,
      "sr": 69.57,
      "hs": "13"
    },
    "rating": 10
  },
  {
    "id": "p_314",
    "name": "Mahipal Lomror",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "UAL1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/184.png",
    "stats": {
      "matches": 40,
      "runs": 527,
      "sr": 141.29,
      "wickets": 1,
      "econ": 8.47
    },
    "rating": 49
  },
  {
    "id": "p_315",
    "name": "Prashant Veer",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/410600/410614.png",
    "stats": {
      "matches": 6,
      "runs": 90,
      "sr": 134.33,
      "wickets": 0,
      "econ": 12.5
    },
    "rating": 16
  },
  {
    "id": "p_317",
    "name": "Sanvir Singh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Sanvir_Singh.jpg",
    "stats": {
      "matches": 6,
      "runs": 25,
      "sr": 119.05,
      "wickets": 0,
      "econ": 0
    },
    "rating": 16
  },
  {
    "id": "p_318",
    "name": "Shivang Kumar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4561.png",
    "stats": {
      "matches": 13,
      "wickets": 9,
      "econ": 9.62,
      "runs": 53,
      "sr": 115.22
    },
    "rating": 30,
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_320",
    "name": "Vijay Shankar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Vijay_Shankar_4.jpg",
    "stats": {
      "matches": 78,
      "runs": 1233,
      "sr": 129.79,
      "wickets": 9,
      "econ": 8.67
    },
    "rating": 53
  },
  {
    "id": "p_321",
    "name": "Kartik Sharma",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/417000/417024.jpg",
    "stats": {
      "matches": 11,
      "runs": 295,
      "avg": 32.78,
      "sr": 136.57,
      "hs": "71*"
    },
    "rating": 45,
    "team": "CSK",
    "retentionPrice": 14.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_322",
    "name": "Mukul Choudhary",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/415400/415461.jpg",
    "stats": {
      "matches": 10,
      "runs": 170,
      "avg": 28.33,
      "sr": 141.67,
      "hs": "54*"
    },
    "rating": 37,
    "team": "LSG",
    "retentionPrice": 2.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_324",
    "name": "Tejasvi Singh",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4281.png",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0
    },
    "rating": 3
  },
  {
    "id": "p_327",
    "name": "Akash Madhwal",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1045.png",
    "stats": {
      "matches": 17,
      "wickets": 23,
      "econ": 10.06,
      "avg": 25.65,
      "bb": "5/5"
    },
    "rating": 44
  },
  {
    "id": "p_328",
    "name": "Ashok Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/The_Wanderers_2.jpg/500px-The_Wanderers_2.jpg",
    "stats": {
      "matches": 6,
      "wickets": 6,
      "econ": 10.86,
      "avg": 38,
      "bb": "2/32"
    },
    "rating": 25,
    "team": "GT",
    "retentionPrice": 0.9,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_329",
    "name": "Kartik Tyagi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/536.png",
    "stats": {
      "matches": 34,
      "wickets": 33,
      "econ": 9.98,
      "avg": 36.7,
      "bb": "3/22"
    },
    "rating": 47,
    "team": "KKR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_330",
    "name": "Naman Tiwari",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/374900/374955.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_332",
    "name": "Simarjeet Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/405400/405445.jpg",
    "stats": {
      "matches": 14,
      "wickets": 11,
      "econ": 10,
      "avg": 36.36,
      "bb": "3/26"
    },
    "rating": 30
  },
  {
    "id": "p_333",
    "name": "Sushant Mishra",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/417200/417240.jpg",
    "stats": {
      "matches": 2,
      "wickets": 2,
      "econ": 10.58,
      "avg": 33.5,
      "bb": "2/21"
    },
    "rating": 16,
    "team": "RR",
    "retentionPrice": 0.9,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_334",
    "name": "Karn Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "USP1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/28/Karn_Sharma_2015.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_335",
    "name": "Kumar Kartikeya Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1015.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_336",
    "name": "Prashant Solanki",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/972.png",
    "stats": {
      "matches": 2,
      "wickets": 2,
      "econ": 6.33,
      "avg": 19,
      "bb": "2/20"
    },
    "rating": 26,
    "team": "KKR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_338",
    "name": "Vignesh Puthur",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/398200/398289.jpg",
    "stats": {
      "matches": 5,
      "wickets": 6,
      "econ": 9.08,
      "avg": 18.17,
      "bb": "3/32"
    },
    "rating": 29
  },
  {
    "id": "p_343",
    "name": "Pathum Nissanka",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "BA2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/416400/416448.jpg",
    "stats": {
      "matches": 10,
      "runs": 278,
      "avg": 27.8,
      "sr": 158.86,
      "hs": "62"
    },
    "rating": 46
  },
  {
    "id": "p_344",
    "name": "Rahul Tripathi",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "BA2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/188.png",
    "stats": {
      "matches": 100,
      "runs": 2291,
      "avg": 26.33,
      "sr": 137.85,
      "hs": "93*"
    },
    "rating": 67
  },
  {
    "id": "p_349",
    "name": "Ben Dwarshuis",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "AL2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/20261111_Dwarshuis.jpg/500px-20261111_Dwarshuis.jpg",
    "stats": {
      "matches": 1,
      "wickets": 1,
      "econ": 12.75,
      "runs": 0,
      "sr": 0
    },
    "rating": 8,
    "team": "PBKS",
    "retentionPrice": 4.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_351",
    "name": "Daryl Mitchell",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "AL2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/356000/356047.jpg",
    "stats": {
      "matches": 15,
      "runs": 351,
      "sr": 131.46,
      "wickets": 1,
      "econ": 12.12
    },
    "rating": 30
  },
  {
    "id": "p_352",
    "name": "Dasun Shanaka",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "AL2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/375.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2,
    "team": "RR",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_353",
    "name": "Jason Holder",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "AL2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/de/Jason_Holder.jpg",
    "stats": {
      "matches": 57,
      "wickets": 70,
      "econ": 8.58,
      "runs": 324,
      "sr": 123.19
    },
    "rating": 65,
    "team": "GT",
    "retentionPrice": 7,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_354",
    "name": "Matt Short",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "AL2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Matt_Henry_2018.jpg/500px-Matt_Henry_2018.jpg",
    "stats": {
      "matches": 9,
      "runs": 177,
      "sr": 123.78,
      "wickets": 0,
      "econ": 8.93
    },
    "rating": 29
  },
  {
    "id": "p_357",
    "name": "Zak Foulkes",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "AL2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/409300/409352.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2
  },
  {
    "id": "p_359",
    "name": "Jordan Cox",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "WK2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3372.png",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0
    },
    "rating": 3,
    "team": "RCB",
    "retentionPrice": 0.75,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_360",
    "name": "Josh Inglis",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "WK2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/95/Josh_Inglis_The_Test_clip.png",
    "stats": {
      "matches": 17,
      "runs": 544,
      "avg": 38.86,
      "sr": 173.25,
      "hs": "85*"
    },
    "rating": 66,
    "team": "LSG",
    "retentionPrice": 8.6,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_364",
    "name": "Tim Seifert",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "WK2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/82.png",
    "stats": {
      "matches": 6,
      "runs": 45,
      "avg": 7.5,
      "sr": 109.76,
      "hs": "21"
    },
    "rating": 16,
    "team": "KKR",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_365",
    "name": "Tom Banton",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "WK2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/412800/412802.jpg",
    "stats": {
      "matches": 2,
      "runs": 18,
      "avg": 9,
      "sr": 90,
      "hs": "10"
    },
    "rating": 9,
    "team": "GT",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_366",
    "name": "Adam Milne",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "FA2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/402100/402191.jpg",
    "stats": {
      "matches": 11,
      "wickets": 7,
      "econ": 9.73,
      "avg": 52.57,
      "bb": "2/21"
    },
    "rating": 26
  },
  {
    "id": "p_368",
    "name": "Kuldeep Sen",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "FA2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/379100/379190.jpg",
    "stats": {
      "matches": 12,
      "wickets": 14,
      "econ": 9.63,
      "avg": 27.64,
      "bb": "4/20"
    },
    "rating": 37
  },
  {
    "id": "p_369",
    "name": "Kyle Jamieson",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "FA2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Kyle_Jamieson_2015_%28cropped%29.jpg",
    "stats": {
      "matches": 15,
      "wickets": 16,
      "econ": 10.12,
      "avg": 31.62,
      "bb": "3/41"
    },
    "rating": 37,
    "team": "DC",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_370",
    "name": "Lungi Ngidi",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "FA2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Lungi_Ngidi_2022.jpg",
    "stats": {
      "matches": 28,
      "wickets": 42,
      "econ": 8.41,
      "avg": 20.69,
      "bb": "4/10"
    },
    "rating": 69,
    "team": "DC",
    "retentionPrice": 2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_371",
    "name": "Mustafizur Rahman",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "FA2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Mustafizur_Rahman_%284%29_%28cropped%29.jpg",
    "stats": {
      "matches": 60,
      "wickets": 65,
      "econ": 8.13,
      "avg": 28.45,
      "bb": "4/29"
    },
    "rating": 68
  },
  {
    "id": "p_373",
    "name": "Umesh Yadav",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "FA2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Umesh_Yadav.jpg",
    "stats": {
      "matches": 148,
      "wickets": 144,
      "econ": 8.49,
      "avg": 29.98,
      "bb": "4/23"
    },
    "rating": 67
  },
  {
    "id": "p_382",
    "name": "Danish Malewar",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4546.png",
    "stats": {
      "matches": 2,
      "runs": 2,
      "avg": 1,
      "sr": 40,
      "hs": "2"
    },
    "rating": 6
  },
  {
    "id": "p_387",
    "name": "Aman Khan",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL2",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EAK%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2
  },
  {
    "id": "p_390",
    "name": "Mangesh Yadav",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4554.png",
    "stats": {
      "matches": 10,
      "wickets": 9,
      "econ": 10.15,
      "runs": 5,
      "sr": 100
    },
    "rating": 25
  },
  {
    "id": "p_391",
    "name": "Mayank Rawat",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/1228.png",
    "stats": {
      "matches": 1,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 6
  },
  {
    "id": "p_393",
    "name": "Satvik Deswal",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4555.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2
  },
  {
    "id": "p_395",
    "name": "Vicky Ostwal",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL2",
    "image": "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Flag_of_India.svg/960px-Flag_of_India.svg.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2,
    "team": "RCB",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_398",
    "name": "Kunal Rathore",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/1540.png",
    "stats": {
      "matches": 1,
      "runs": 0,
      "avg": 0,
      "sr": 0,
      "hs": "0"
    },
    "rating": 7
  },
  {
    "id": "p_400",
    "name": "Ravi Singh",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK2",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ERS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 1,
      "runs": 4,
      "avg": 4,
      "sr": 200,
      "hs": "4"
    },
    "rating": 14
  },
  {
    "id": "p_402",
    "name": "Salil Arora",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4556.png",
    "stats": {
      "matches": 14,
      "runs": 156,
      "avg": 22.29,
      "sr": 159.18,
      "hs": "35*"
    },
    "rating": 39,
    "team": "SRH",
    "retentionPrice": 1.5,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_403",
    "name": "Saurav Chuahan",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK2",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ESC%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 3,
      "runs": 18,
      "avg": 6,
      "sr": 120,
      "hs": "9"
    },
    "rating": 12
  },
  {
    "id": "p_404",
    "name": "Yashvardhan Dalal",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK2",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EYD%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0
    },
    "rating": 3
  },
  {
    "id": "p_406",
    "name": "Mohammed Izhar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4545.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_407",
    "name": "Onkar Tarmale",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/4560.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_408",
    "name": "Yarra Prithviraj",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/48/Prithviraj_at_Aiyyaa_event.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_410",
    "name": "Sakib Hussain",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/3104.png",
    "stats": {
      "matches": 11,
      "wickets": 15,
      "econ": 9.45,
      "avg": 26.47,
      "bb": "4/24"
    },
    "rating": 41,
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_413",
    "name": "Vijay Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA2",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EVK%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_901",
    "name": "Kuldip Yadav",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Fast Bowlers",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280,q_70/lsci/db/PICTURES/CMS/359600/359665.6.jpg",
    "stats": {
      "matches": 3,
      "wickets": 2,
      "econ": 9.33,
      "avg": 42,
      "bb": "1/18"
    },
    "rating": 17
  },
  {
    "id": "p_902",
    "name": "Dian Forrester",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 0.75,
    "set": "All-Rounders Set 2",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/default.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2
  },
  {
    "id": "p_903",
    "name": "Rehan Ahmed",
    "role": "Bowler",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1.5,
    "set": "Spinners Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/43/3_57_Rehan_Ahmed.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4
  },
  {
    "id": "p_904",
    "name": "Sahil Parakh",
    "role": "Batter",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Batters",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280,q_70/lsci/db/PICTURES/CMS/416200/416288.9.jpg",
    "stats": {
      "matches": 4,
      "runs": 46,
      "avg": 11.5,
      "sr": 139.39,
      "hs": "24"
    },
    "rating": 19
  },
  {
    "id": "p_906",
    "name": "Kulwant Khejroliya",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Fast Bowlers",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/274900/274915.jpg",
    "stats": {
      "matches": 9,
      "wickets": 6,
      "econ": 11.01,
      "avg": 46.17,
      "bb": "2/33"
    },
    "rating": 24
  },
  {
    "id": "p_907",
    "name": "Saurabh Dubey",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Fast Bowlers",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/417200/417271.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4,
    "team": "KKR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_908",
    "name": "Blessing Muzarabani",
    "role": "Bowler",
    "type": "Overseas",
    "country": "ZIM",
    "basePrice": 0.75,
    "set": "Fast Bowlers Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/414100/414129.jpg",
    "stats": {
      "matches": 2,
      "wickets": 4,
      "econ": 10.71,
      "avg": 18.75,
      "bb": "4/41"
    },
    "rating": 21
  },
  {
    "id": "p_909",
    "name": "Navdeep Saini",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.75,
    "set": "Fast Bowlers Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/360200/360287.jpg",
    "stats": {
      "matches": 34,
      "wickets": 23,
      "econ": 8.97,
      "avg": 43.96,
      "bb": "3/40"
    },
    "rating": 46
  },
  {
    "id": "p_910",
    "name": "Luvnith Sisodia",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Wicket-Keepers",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/344600/344661.jpg",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0
    },
    "rating": 3
  },
  {
    "id": "p_911",
    "name": "George Linde",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1,
    "set": "All-Rounders Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/411800/411801.jpg",
    "stats": {
      "matches": 3,
      "wickets": 1,
      "econ": 8.92,
      "runs": 31,
      "sr": 147.62
    },
    "rating": 20
  },
  {
    "id": "p_912",
    "name": "Keshav Maharaj",
    "role": "Bowler",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Spinners Set 1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/New_face_6-_Keshav_Maharaj.jpg/500px-New_face_6-_Keshav_Maharaj.jpg",
    "stats": {
      "matches": 2,
      "wickets": 2,
      "econ": 6.5,
      "avg": 19.5,
      "bb": "2/23"
    },
    "rating": 26
  },
  {
    "id": "p_913",
    "name": "Cooper Connolly",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 0.75,
    "set": "All-Rounders Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/RSA_vs_AUS_Day_1-33_Cooper_Connoly%28cropped%29.jpg/500px-RSA_vs_AUS_Day_1-33_Cooper_Connoly%28cropped%29.jpg",
    "stats": {
      "matches": 14,
      "runs": 491,
      "sr": 163.12,
      "wickets": 0,
      "econ": 0
    },
    "rating": 41,
    "team": "PBKS",
    "retentionPrice": 3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_914",
    "name": "Praveen Dubey",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped All-Rounders",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/359900/359979.jpg",
    "stats": {
      "matches": 5,
      "wickets": 2,
      "econ": 8.54,
      "runs": 23,
      "sr": 69.7
    },
    "rating": 15
  },
  {
    "id": "p_915",
    "name": "Brijesh Sharma",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped All-Rounders",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/416000/416039.jpg",
    "stats": {
      "matches": 13,
      "wickets": 14,
      "econ": 9.89,
      "runs": 2,
      "sr": 50
    },
    "rating": 22,
    "team": "RR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_916",
    "name": "Vihaan Malhotra",
    "role": "Batter",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Batters",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/412500/412519.jpg",
    "stats": {
      "matches": 0,
      "runs": 0,
      "avg": 0,
      "sr": 0
    },
    "rating": 3
  },
  {
    "id": "p_917",
    "name": "Kanishk Chouhan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Fast Bowlers",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2026/default.png",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "avg": 0
    },
    "rating": 4,
    "team": "RCB",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_918",
    "name": "Richard Gleeson",
    "role": "Bowler",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Fast Bowlers Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/30/Richard_Gleeson.jpg",
    "stats": {
      "matches": 3,
      "wickets": 2,
      "econ": 9.71,
      "avg": 55,
      "bb": "1/30"
    },
    "rating": 16
  },
  {
    "id": "p_919",
    "name": "Praful Hinge",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "Uncapped Fast Bowlers",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/415600/415638.jpg",
    "stats": {
      "matches": 7,
      "wickets": 14,
      "econ": 11.73,
      "avg": 21.79,
      "bb": "4/34"
    },
    "rating": 34,
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_920",
    "name": "David Payne",
    "role": "Bowler",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 0.75,
    "set": "Fast Bowlers Set 2",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/412400/412425.jpg",
    "stats": {
      "matches": 2,
      "wickets": 2,
      "econ": 14,
      "avg": 35,
      "bb": "2/35"
    },
    "rating": 16
  },
  {
    "id": "p_921",
    "name": "Jack Edwards",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 0.75,
    "set": "All-Rounders Set 2",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Jack_Edwards_01_20251017.jpg/500px-Jack_Edwards_01_20251017.jpg",
    "stats": {
      "matches": 0,
      "wickets": 0,
      "econ": 0,
      "runs": 0,
      "sr": 0
    },
    "rating": 2,
    "team": "CSK",
    "retentionPrice": 3,
    "isRetained": true,
    "isTraded": true
  },
  {
    "id": "p_1001",
    "name": "AB de Villiers",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/AB_de_Villiers_2.jpg/500px-AB_de_Villiers_2.jpg",
    "stats": {
      "matches": 184,
      "runs": 5162,
      "avg": 39.71,
      "sr": 151.69,
      "hs": "133*"
    },
    "rating": 97
  },
  {
    "id": "p_1002",
    "name": "Chris Gayle",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Two_views_of_Chris_Gayle_%2848020785077%29.jpg/500px-Two_views_of_Chris_Gayle_%2848020785077%29.jpg",
    "stats": {
      "matches": 142,
      "runs": 4965,
      "avg": 39.72,
      "sr": 148.96,
      "hs": "175*"
    },
    "rating": 97
  },
  {
    "id": "p_1003",
    "name": "Lasith Malinga",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Lasith_Malinga_tossing_a_cricket_ball_at_practice.jpg/500px-Lasith_Malinga_tossing_a_cricket_ball_at_practice.jpg",
    "stats": {
      "matches": 122,
      "wickets": 170,
      "econ": 7.14,
      "avg": 19.8,
      "bb": "5/13"
    },
    "rating": 96
  },
  {
    "id": "p_1004",
    "name": "Imran Tahir",
    "role": "Bowler",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Imran_Tahir.jpg/500px-Imran_Tahir.jpg",
    "stats": {
      "matches": 59,
      "wickets": 82,
      "econ": 7.76,
      "avg": 20.77,
      "bb": "4/12"
    },
    "rating": 95
  },
  {
    "id": "p_1005",
    "name": "Harbhajan Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Shri_Harbhajan_Singh_2015.jpg/500px-Shri_Harbhajan_Singh_2015.jpg",
    "stats": {
      "matches": 163,
      "wickets": 150,
      "econ": 7.08,
      "avg": 26.87,
      "bb": "5/18"
    },
    "rating": 90
  },
  {
    "id": "p_1006",
    "name": "Dale Steyn",
    "role": "Bowler",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Dale_Steyn_YM.jpg",
    "stats": {
      "matches": 95,
      "wickets": 97,
      "econ": 6.92,
      "avg": 25.86,
      "bb": "3/8"
    },
    "rating": 90
  },
  {
    "id": "p_1007",
    "name": "David Warner",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/DAVID_WARNER_%2811704782453%29.jpg/500px-DAVID_WARNER_%2811704782453%29.jpg",
    "stats": {
      "matches": 184,
      "runs": 6565,
      "avg": 40.52,
      "sr": 139.77,
      "hs": "126"
    },
    "rating": 89
  },
  {
    "id": "p_1008",
    "name": "Amit Mishra",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/73/Amit_Mishra.jpg",
    "stats": {
      "matches": 162,
      "wickets": 174,
      "econ": 7.37,
      "avg": 23.82,
      "bb": "5/17"
    },
    "rating": 89
  },
  {
    "id": "p_1009",
    "name": "Virender Sehwag",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Virender_Sehwag_at_the_NDTV_Marks_for_Sports_event_13.jpg/500px-Virender_Sehwag_at_the_NDTV_Marks_for_Sports_event_13.jpg",
    "stats": {
      "matches": 104,
      "runs": 2728,
      "avg": 27.56,
      "sr": 155.44,
      "hs": "122"
    },
    "rating": 89
  },
  {
    "id": "p_1010",
    "name": "Muttiah Muralitharan",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Photograph_of_Muttiah_Muralitharan.jpg",
    "stats": {
      "matches": 66,
      "wickets": 63,
      "econ": 6.68,
      "avg": 26.92,
      "bb": "3/11"
    },
    "rating": 89
  },
  {
    "id": "p_1011",
    "name": "Ravichandran Ashwin",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Minister_of_State_for_Youth_Affairs_and_Sports_%28Independent_Charge%29%2C_Shri_Sarbananda_Sonowal_conferring_the_Arjuna_Award_on_cricketer_Ravichandran_Ashwin%2C_in_New_Delhi_on_July_31%2C_2015_cropped.jpg/500px-thumbnail.jpg",
    "stats": {
      "matches": 212,
      "runs": 800,
      "sr": 118.87,
      "wickets": 180,
      "econ": 7.12
    },
    "rating": 88
  },
  {
    "id": "p_1012",
    "name": "Shakib Al Hasan",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Shakib_Al_Hasan_%284%29_%28cropped%29.jpg/500px-Shakib_Al_Hasan_%284%29_%28cropped%29.jpg",
    "stats": {
      "matches": 71,
      "runs": 793,
      "sr": 124.49,
      "wickets": 63,
      "econ": 7.44
    },
    "rating": 87
  },
  {
    "id": "p_1013",
    "name": "Shane Watson",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/SHANE_WATSON_%2811705862116%29.jpg/500px-SHANE_WATSON_%2811705862116%29.jpg",
    "stats": {
      "matches": 145,
      "runs": 3874,
      "sr": 137.91,
      "wickets": 92,
      "econ": 7.93
    },
    "rating": 86
  },
  {
    "id": "p_1014",
    "name": "Moeen Ali",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/2018.01.06.17.47.32-Moeen_Ali_%2838876905344%29_%28cropped%29.jpg/500px-2018.01.06.17.47.32-Moeen_Ali_%2838876905344%29_%28cropped%29.jpg",
    "stats": {
      "matches": 67,
      "runs": 1162,
      "sr": 141.19,
      "wickets": 35,
      "econ": 7.13
    },
    "rating": 86
  },
  {
    "id": "p_1015",
    "name": "Anil Kumble",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/de/Anil_Kumble_%281%29.jpg",
    "stats": {
      "matches": 42,
      "wickets": 45,
      "econ": 6.58,
      "avg": 23.51,
      "bb": "5/5"
    },
    "rating": 86
  },
  {
    "id": "p_1016",
    "name": "Andre Russell",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Andre_Russell_%281%29.jpg",
    "stats": {
      "matches": 127,
      "runs": 2484,
      "sr": 174.93,
      "wickets": 115,
      "econ": 9.35
    },
    "rating": 85
  },
  {
    "id": "p_1017",
    "name": "Ashish Nehra",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Ashish_Nehra_%286160488612%29_%28cropped%29.jpg",
    "stats": {
      "matches": 88,
      "wickets": 106,
      "econ": 7.84,
      "avg": 23.54,
      "bb": "4/10"
    },
    "rating": 85
  },
  {
    "id": "p_1018",
    "name": "Chris Morris",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ECM%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 85
  },
  {
    "id": "p_1019",
    "name": "Matthew Hayden",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Matthew_Hayden_Image.jpg/500px-Matthew_Hayden_Image.jpg",
    "stats": {
      "matches": 32,
      "runs": 1107,
      "avg": 36.9,
      "sr": 137.52,
      "hs": "93"
    },
    "rating": 85
  },
  {
    "id": "p_1020",
    "name": "Suresh Raina",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Suresh_Raina_grace_the_%27Salaam_Sachin%27_conclave.jpg/500px-Suresh_Raina_grace_the_%27Salaam_Sachin%27_conclave.jpg",
    "stats": {
      "matches": 205,
      "runs": 5528,
      "avg": 32.52,
      "sr": 136.73,
      "hs": "100*"
    },
    "rating": 84
  },
  {
    "id": "p_1021",
    "name": "Kieron Pollard",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Kieron_Pollard.jpg/500px-Kieron_Pollard.jpg",
    "stats": {
      "matches": 189,
      "runs": 3412,
      "sr": 147.32,
      "wickets": 69,
      "econ": 8.79
    },
    "rating": 84
  },
  {
    "id": "p_1022",
    "name": "Pragyan Ojha",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/PragyanOjha_.jpg/500px-PragyanOjha_.jpg",
    "stats": {
      "matches": 92,
      "wickets": 89,
      "econ": 7.36,
      "avg": 26.2,
      "bb": "3/11"
    },
    "rating": 84
  },
  {
    "id": "p_1023",
    "name": "RP Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ERS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 82,
      "wickets": 90,
      "econ": 7.9,
      "avg": 25.98,
      "bb": "4/22"
    },
    "rating": 84
  },
  {
    "id": "p_1024",
    "name": "Nathan Coulter-Nile",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENC%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 84
  },
  {
    "id": "p_1025",
    "name": "Piyush Chawla",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Piyush_Chawla_2019.jpg/500px-Piyush_Chawla_2019.jpg",
    "stats": {
      "matches": 192,
      "wickets": 192,
      "econ": 7.96,
      "avg": 27.53,
      "bb": "4/17"
    },
    "rating": 82
  },
  {
    "id": "p_1026",
    "name": "Adam Gilchrist",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Adam_Gilchrist_of_Australia_%28cropped%29.jpg/500px-Adam_Gilchrist_of_Australia_%28cropped%29.jpg",
    "stats": {
      "matches": 80,
      "runs": 2069,
      "avg": 27.22,
      "sr": 138.39,
      "hs": "109*"
    },
    "rating": 82
  },
  {
    "id": "p_1027",
    "name": "Doug Bollinger",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/41/Doug_Bollinger.jpg",
    "stats": {
      "matches": 27,
      "wickets": 37,
      "econ": 7.22,
      "avg": 18.73,
      "bb": "4/13"
    },
    "rating": 82
  },
  {
    "id": "p_1028",
    "name": "Yusuf Pathan",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Yusuf_Pathan.jpg/500px-Yusuf_Pathan.jpg",
    "stats": {
      "matches": 174,
      "runs": 3204,
      "sr": 142.97,
      "wickets": 42,
      "econ": 7.4
    },
    "rating": 81
  },
  {
    "id": "p_1029",
    "name": "Faf du Plessis",
    "role": "Batsman",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Faf_du_Plessis_2019_Boxing_Day.jpg/500px-Faf_du_Plessis_2019_Boxing_Day.jpg",
    "stats": {
      "matches": 145,
      "runs": 4571,
      "avg": 35.99,
      "sr": 136.37,
      "hs": "96"
    },
    "rating": 81
  },
  {
    "id": "p_1030",
    "name": "JP Duminy",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/JP_DUMINY_%2815681049126%29.jpg/500px-JP_DUMINY_%2815681049126%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 81
  },
  {
    "id": "p_1031",
    "name": "Shaun Marsh",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Shaun_Marsh.jpg/500px-Shaun_Marsh.jpg",
    "stats": {
      "matches": 71,
      "runs": 2477,
      "avg": 39.95,
      "sr": 132.74,
      "hs": "115"
    },
    "rating": 81
  },
  {
    "id": "p_1032",
    "name": "Michael Hussey",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Michael_Hussey_2022.jpg/500px-Michael_Hussey_2022.jpg",
    "stats": {
      "matches": 59,
      "runs": 1977,
      "avg": 38.76,
      "sr": 122.64,
      "hs": "116*"
    },
    "rating": 81
  },
  {
    "id": "p_1033",
    "name": "Yuvraj Singh",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/81/Yuvraj_Singh_appointed_as_Ulysse_Nardin_watch_brand_ambassador.jpeg",
    "stats": {
      "matches": 132,
      "runs": 2750,
      "sr": 129.72,
      "wickets": 36,
      "econ": 7.44
    },
    "rating": 80
  },
  {
    "id": "p_1034",
    "name": "Andrew Symonds",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Andrew_symonds_%28cropped%29.jpg/500px-Andrew_symonds_%28cropped%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 80
  },
  {
    "id": "p_1035",
    "name": "Kevin Pietersen",
    "role": "Batsman",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 2,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Kevin_Pietersen_2014.jpg/500px-Kevin_Pietersen_2014.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 80
  },
  {
    "id": "p_1036",
    "name": "Dwayne Bravo",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Bravo_at_IIFA_2017_Green_Carpet.jpg/500px-Bravo_at_IIFA_2017_Green_Carpet.jpg",
    "stats": {
      "matches": 161,
      "runs": 1560,
      "sr": 129.57,
      "wickets": 183,
      "econ": 8.38
    },
    "rating": 79
  },
  {
    "id": "p_1037",
    "name": "Glenn Maxwell",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Glen_Maxwell_2026_%28cropped%29.jpg/500px-Glen_Maxwell_2026_%28cropped%29.jpg",
    "stats": {
      "matches": 134,
      "runs": 2771,
      "sr": 156.73,
      "wickets": 37,
      "econ": 8.32
    },
    "rating": 79
  },
  {
    "id": "p_1038",
    "name": "Zaheer Khan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/27/Zaheer_Khan_at_the_CPAA_show_2018_%28cropped%29.jpg",
    "stats": {
      "matches": 100,
      "wickets": 102,
      "econ": 7.59,
      "avg": 27.27,
      "bb": "4/17"
    },
    "rating": 79
  },
  {
    "id": "p_1039",
    "name": "Munaf Patel",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Munaf_Patel_2.jpg/500px-Munaf_Patel_2.jpg",
    "stats": {
      "matches": 63,
      "wickets": 74,
      "econ": 7.51,
      "avg": 22.95,
      "bb": "5/21"
    },
    "rating": 79
  },
  {
    "id": "p_1040",
    "name": "Shane Warne",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Shane_Warne_February_2015.jpg/500px-Shane_Warne_February_2015.jpg",
    "stats": {
      "matches": 55,
      "wickets": 57,
      "econ": 7.27,
      "avg": 25.39,
      "bb": "3/21"
    },
    "rating": 79
  },
  {
    "id": "p_1041",
    "name": "Jonny Bairstow",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/2_05_Bairstow_out.jpg/500px-2_05_Bairstow_out.jpg",
    "stats": {
      "matches": 50,
      "runs": 1589,
      "avg": 35.31,
      "sr": 144.06,
      "hs": "114"
    },
    "rating": 79
  },
  {
    "id": "p_1042",
    "name": "Brendon McCullum",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d1/Brendon_McCullum_ONZM_%28cropped%29.jpg",
    "stats": {
      "matches": 109,
      "runs": 2880,
      "avg": 27.69,
      "sr": 131.75,
      "hs": "158*"
    },
    "rating": 78
  },
  {
    "id": "p_1043",
    "name": "Mitchell Johnson",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/MITCHELL_JOHNSON_%2811705174114%29_%28cropped%29.jpg/500px-MITCHELL_JOHNSON_%2811705174114%29_%28cropped%29.jpg",
    "stats": {
      "matches": 54,
      "wickets": 61,
      "econ": 8.28,
      "avg": 27.9,
      "bb": "3/27"
    },
    "rating": 78
  },
  {
    "id": "p_1044",
    "name": "Daniel Vettori",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Daniel_Vettori_ONZM_%28cropped%29.jpg/500px-Daniel_Vettori_ONZM_%28cropped%29.jpg",
    "stats": {
      "matches": 34,
      "wickets": 28,
      "econ": 6.79,
      "avg": 31.39,
      "bb": "3/15"
    },
    "rating": 78
  },
  {
    "id": "p_1045",
    "name": "Sachin Tendulkar",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/The_cricket_legend_Sachin_Tendulkar_at_the_Oval_Maidan_in_Mumbai_During_the_Duke_and_Duchess_of_Cambridge_Visit%2826271019082%29.jpg/500px-The_cricket_legend_Sachin_Tendulkar_at_the_Oval_Maidan_in_Mumbai_During_the_Duke_and_Duchess_of_Cambridge_Visit%2826271019082%29.jpg",
    "stats": {
      "matches": 78,
      "runs": 2334,
      "avg": 34.84,
      "sr": 119.82,
      "hs": "100*"
    },
    "rating": 77
  },
  {
    "id": "p_1046",
    "name": "Morné Morkel",
    "role": "Bowler",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Morne_Morkel_as_Pakistan_bowling_coach_in_2023_%28cropped%29.jpg/500px-Morne_Morkel_as_Pakistan_bowling_coach_in_2023_%28cropped%29.jpg",
    "stats": {
      "matches": 70,
      "wickets": 77,
      "econ": 7.69,
      "avg": 27.13,
      "bb": "4/20"
    },
    "rating": 77
  },
  {
    "id": "p_1048",
    "name": "Andrew Tye",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/af/2018.02.03.20.38.56-AUSvNZL_T20_NZL_innings%2C_SCG-0001_%2838618205890%29_%28Tye_cropped%29.jpg",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 76
  },
  {
    "id": "p_1049",
    "name": "Sanath Jayasuriya",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/16/Sanath_jayasuriya_portrait.jpg",
    "stats": {
      "matches": 30,
      "runs": 768,
      "sr": 144.36,
      "wickets": 13,
      "econ": 7.97
    },
    "rating": 76
  },
  {
    "id": "p_1050",
    "name": "Dinesh Karthik",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Dinesh.Karthik.jpg/500px-Dinesh.Karthik.jpg",
    "stats": {
      "matches": 257,
      "runs": 4842,
      "avg": 26.32,
      "sr": 135.36,
      "hs": "97*"
    },
    "rating": 75
  },
  {
    "id": "p_1051",
    "name": "Sreenath Aravind",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Arvind_S_Sreenath.jpg/500px-Arvind_S_Sreenath.jpg",
    "stats": {
      "matches": 38,
      "wickets": 45,
      "econ": 8.2,
      "avg": 23.09,
      "bb": "4/14"
    },
    "rating": 75
  },
  {
    "id": "p_1052",
    "name": "Ryan Harris",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ryan_Harris_2014_%28cropped%29.jpg/500px-Ryan_Harris_2014_%28cropped%29.jpg",
    "stats": {
      "matches": 37,
      "wickets": 44,
      "econ": 7.55,
      "avg": 23.27,
      "bb": "4/34"
    },
    "rating": 75
  },
  {
    "id": "p_1053",
    "name": "Johan Botha",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Johan_Botha.jpg/500px-Johan_Botha.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 75
  },
  {
    "id": "p_1054",
    "name": "Kevon Cooper",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EKC%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 75
  },
  {
    "id": "p_1055",
    "name": "Robin Uthappa",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Robin_Uthappa_1.jpg/500px-Robin_Uthappa_1.jpg",
    "stats": {
      "matches": 205,
      "runs": 4952,
      "avg": 27.51,
      "sr": 130.35,
      "hs": "88"
    },
    "rating": 74
  },
  {
    "id": "p_1056",
    "name": "Mohit Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EMS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 112,
      "wickets": 132,
      "econ": 8.65,
      "avg": 25.8,
      "bb": "5/10"
    },
    "rating": 74
  },
  {
    "id": "p_1057",
    "name": "Jacques Kallis",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Jacques_Kallis_6.jpg/500px-Jacques_Kallis_6.jpg",
    "stats": {
      "matches": 98,
      "runs": 2427,
      "sr": 109.23,
      "wickets": 65,
      "econ": 7.89
    },
    "rating": 74
  },
  {
    "id": "p_1058",
    "name": "Moises Henriques",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Moises_Henriques_with_the_Sydney_Sixers.jpg/500px-Moises_Henriques_with_the_Sydney_Sixers.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 74
  },
  {
    "id": "p_1059",
    "name": "Chris Lynn",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Brisbane_Heat_vs_Melbourne_Stars_T20_7_%28cropped%29.jpg",
    "stats": {
      "matches": 42,
      "runs": 1329,
      "avg": 34.08,
      "sr": 140.63,
      "hs": "93*"
    },
    "rating": 74
  },
  {
    "id": "p_1060",
    "name": "Brad Hogg",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/BradleyHogg_%28cropped%29.jpg/500px-BradleyHogg_%28cropped%29.jpg",
    "stats": {
      "matches": 21,
      "wickets": 23,
      "econ": 7.47,
      "avg": 24.78,
      "bb": "4/29"
    },
    "rating": 74
  },
  {
    "id": "p_1061",
    "name": "Albie Morkel",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Albie_Morkel_2.jpg/500px-Albie_Morkel_2.jpg",
    "stats": {
      "matches": 91,
      "runs": 974,
      "sr": 141.98,
      "wickets": 85,
      "econ": 8.21
    },
    "rating": 73
  },
  {
    "id": "p_1062",
    "name": "Lakshmipathy Balaji",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Shubek_Gill_%28right%29_with_L_Balaji_%28left%29.jpg/500px-Shubek_Gill_%28right%29_with_L_Balaji_%28left%29.jpg",
    "stats": {
      "matches": 73,
      "wickets": 76,
      "econ": 8.05,
      "avg": 26.68,
      "bb": "5/24"
    },
    "rating": 73
  },
  {
    "id": "p_1063",
    "name": "Kumar Sangakkara",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Kumar_Sangakkara_bat_in_hand.JPG/500px-Kumar_Sangakkara_bat_in_hand.JPG",
    "stats": {
      "matches": 71,
      "runs": 1687,
      "avg": 25.95,
      "sr": 121.19,
      "hs": "94"
    },
    "rating": 73
  },
  {
    "id": "p_1064",
    "name": "Pravin Tambe",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EPT%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 33,
      "wickets": 28,
      "econ": 7.75,
      "avg": 30.46,
      "bb": "4/20"
    },
    "rating": 73
  },
  {
    "id": "p_1065",
    "name": "Ravi Bopara",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/99/Ravi_Bopara.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 73
  },
  {
    "id": "p_1066",
    "name": "Naveen-ul-Haq",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENA%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 73
  },
  {
    "id": "p_1067",
    "name": "Shikhar Dhawan",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/SHIKHAR_DHAWAN_%2816005494418%29.jpg/500px-SHIKHAR_DHAWAN_%2816005494418%29.jpg",
    "stats": {
      "matches": 222,
      "runs": 6769,
      "avg": 35.26,
      "sr": 127.14,
      "hs": "106*"
    },
    "rating": 72
  },
  {
    "id": "p_1068",
    "name": "Gautam Gambhir",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/00/Gautam_Gambhir_%28IPL_2014%29.jpg",
    "stats": {
      "matches": 154,
      "runs": 4217,
      "avg": 31.24,
      "sr": 123.88,
      "hs": "93"
    },
    "rating": 72
  },
  {
    "id": "p_1069",
    "name": "Mahela Jayawardene",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Mahela_Jayawardene_3.JPG/500px-Mahela_Jayawardene_3.JPG",
    "stats": {
      "matches": 80,
      "runs": 1802,
      "avg": 28.6,
      "sr": 123.26,
      "hs": "110*"
    },
    "rating": 72
  },
  {
    "id": "p_1070",
    "name": "Wayne Parnell",
    "role": "Bowler",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/WAYNE_PARNELL_%2815520474620%29.jpg/500px-WAYNE_PARNELL_%2815520474620%29.jpg",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 72
  },
  {
    "id": "p_1071",
    "name": "Lendl Simmons",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Lendl_Simmons.jpg/500px-Lendl_Simmons.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 72
  },
  {
    "id": "p_1072",
    "name": "Ambati Rayudu",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/5/51/Ambati_Rayudu.jpg",
    "stats": {
      "matches": 204,
      "runs": 4348,
      "avg": 28.23,
      "sr": 127.54,
      "hs": "100*"
    },
    "rating": 71
  },
  {
    "id": "p_1073",
    "name": "Irfan Pathan",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7f/Irfan_Pathan72.jpg",
    "stats": {
      "matches": 103,
      "runs": 1139,
      "sr": 120.4,
      "wickets": 80,
      "econ": 7.78
    },
    "rating": 71
  },
  {
    "id": "p_1074",
    "name": "Subramaniam Badrinath",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Subramaniam_Badrinath.JPG/500px-Subramaniam_Badrinath.JPG",
    "stats": {
      "matches": 95,
      "runs": 1441,
      "avg": 30.66,
      "sr": 118.89,
      "hs": "71*"
    },
    "rating": 71
  },
  {
    "id": "p_1075",
    "name": "James Faulkner",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/JAMES_FAULKNER_%2811704434875%29_%28cropped%29.jpg/500px-JAMES_FAULKNER_%2811704434875%29_%28cropped%29.jpg",
    "stats": {
      "matches": 60,
      "runs": 527,
      "sr": 135.48,
      "wickets": 59,
      "econ": 8.69
    },
    "rating": 71
  },
  {
    "id": "p_1076",
    "name": "Mohammad Nabi",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/49/Mohammad_Nabi-Australia.jpg",
    "stats": {
      "matches": 24,
      "runs": 215,
      "sr": 134.38,
      "wickets": 15,
      "econ": 7.36
    },
    "rating": 71
  },
  {
    "id": "p_1077",
    "name": "Aaron Finch",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/AARON_FINCH_%286299558883%29.jpg/500px-AARON_FINCH_%286299558883%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 70
  },
  {
    "id": "p_1078",
    "name": "Dwayne Smith",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/DWAYNE_SMITH.jpg/500px-DWAYNE_SMITH.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 70
  },
  {
    "id": "p_1079",
    "name": "Murugan Ashwin",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/M_Ashwin.jpg/500px-M_Ashwin.jpg",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 70
  },
  {
    "id": "p_1080",
    "name": "Stuart Binny",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Stuart_Binny_%282019%29.jpg/500px-Stuart_Binny_%282019%29.jpg",
    "stats": {
      "matches": 95,
      "runs": 880,
      "sr": 128.84,
      "wickets": 22,
      "econ": 7.64
    },
    "rating": 69
  },
  {
    "id": "p_1081",
    "name": "Dhawal Kulkarni",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EDK%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 92,
      "wickets": 86,
      "econ": 8.31,
      "avg": 28.77,
      "bb": "4/14"
    },
    "rating": 69
  },
  {
    "id": "p_1082",
    "name": "David Hussey",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/David_Hussey_2.jpg/500px-David_Hussey_2.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 69
  },
  {
    "id": "p_1083",
    "name": "Pawan Negi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EPN%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 69
  },
  {
    "id": "p_1084",
    "name": "Jesse Ryder",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EJR%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 69
  },
  {
    "id": "p_1085",
    "name": "Evin Lewis",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EEL%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 69
  },
  {
    "id": "p_1086",
    "name": "Chris Woakes",
    "role": "Bowler",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Chris_Woakes_2022.jpg/500px-Chris_Woakes_2022.jpg",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 69
  },
  {
    "id": "p_1087",
    "name": "Rahul Dravid",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/17/Rahul_Dravid_in_2024.jpg",
    "stats": {
      "matches": 89,
      "runs": 2174,
      "avg": 28.23,
      "sr": 115.52,
      "hs": "75*"
    },
    "rating": 68
  },
  {
    "id": "p_1088",
    "name": "Cameron White",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Cameron_White.jpg/500px-Cameron_White.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 68
  },
  {
    "id": "p_1090",
    "name": "Owais Shah",
    "role": "Batsman",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EOS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 68
  },
  {
    "id": "p_1092",
    "name": "Jason Roy",
    "role": "Batsman",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Jason_Roy_with_the_Sydney_Sixers.jpg/500px-Jason_Roy_with_the_Sydney_Sixers.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 67
  },
  {
    "id": "p_1093",
    "name": "Murali Vijay",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Murali_Vijay_1_%28cropped%29.jpg/500px-Murali_Vijay_1_%28cropped%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 66
  },
  {
    "id": "p_1094",
    "name": "Vinay Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/37/Vinay_Kumar_%28cricketer%29.jpg",
    "stats": {
      "matches": 105,
      "wickets": 105,
      "econ": 8.39,
      "avg": 28.25,
      "bb": "4/40"
    },
    "rating": 66
  },
  {
    "id": "p_1095",
    "name": "Ross Taylor",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ross_Taylor_CNZM_%28cropped%29.jpg/500px-Ross_Taylor_CNZM_%28cropped%29.jpg",
    "stats": {
      "matches": 55,
      "runs": 1017,
      "avg": 25.43,
      "sr": 123.72,
      "hs": "81*"
    },
    "rating": 66
  },
  {
    "id": "p_1096",
    "name": "Tillakaratne Dilshan",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tillakaratne_Dilshan_portrait.jpg/500px-Tillakaratne_Dilshan_portrait.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 66
  },
  {
    "id": "p_1097",
    "name": "Rishi Dhawan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ERD%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 66
  },
  {
    "id": "p_1098",
    "name": "Mark Boucher",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Markboucher.jpg/500px-Markboucher.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 66
  },
  {
    "id": "p_1099",
    "name": "Graeme Smith",
    "role": "Batsman",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Graeme_Smith_on_Record_SA20_Auction%2C_Young_Talent_Investment_%26_Women%E2%80%99s_Cricket_Plans%2C_2025_%28cropped%29.png",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 66
  },
  {
    "id": "p_1100",
    "name": "Daren Sammy",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DARREN_SAMMY.jpg/500px-DARREN_SAMMY.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 66
  },
  {
    "id": "p_1101",
    "name": "Ben Cutting",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Brisbane_Heat_vs_Melbourne_Stars_T20_15.jpg/500px-Brisbane_Heat_vs_Melbourne_Stars_T20_15.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 66
  },
  {
    "id": "p_1102",
    "name": "Shaun Tait",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Shaun_Tait.jpg/500px-Shaun_Tait.jpg",
    "stats": {
      "matches": 21,
      "wickets": 28,
      "econ": 8.12,
      "avg": 23.82,
      "bb": "3/22"
    },
    "rating": 66
  },
  {
    "id": "p_1103",
    "name": "Dan Christian",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Daniel_Christian.jpg/500px-Daniel_Christian.jpg",
    "stats": {
      "matches": 49,
      "runs": 460,
      "sr": 119.17,
      "wickets": 38,
      "econ": 7.92
    },
    "rating": 65
  },
  {
    "id": "p_1104",
    "name": "Bipul Sharma",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EBS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 65
  },
  {
    "id": "p_1105",
    "name": "Rilee Rossouw",
    "role": "Batsman",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/RILEE_ROSSOUW_%2815706681502%29.jpg/500px-RILEE_ROSSOUW_%2815706681502%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 65
  },
  {
    "id": "p_1106",
    "name": "Wriddhiman Saha",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Wriddhiman_Saha.jpg/500px-Wriddhiman_Saha.jpg",
    "stats": {
      "matches": 170,
      "runs": 2934,
      "avg": 24.66,
      "sr": 127.57,
      "hs": "115*"
    },
    "rating": 64
  },
  {
    "id": "p_1107",
    "name": "Abhishek Nayar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EAN%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 64
  },
  {
    "id": "p_1108",
    "name": "Siddarth Kaul",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ESK%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 64
  },
  {
    "id": "p_1109",
    "name": "Ryan ten Doeschate",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ryan_ten_doeschate.jpg/500px-Ryan_ten_doeschate.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 64
  },
  {
    "id": "p_1110",
    "name": "Paul Valthaty",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EPV%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 23,
      "runs": 505,
      "avg": 22.95,
      "sr": 120.81,
      "hs": "120*"
    },
    "rating": 64
  },
  {
    "id": "p_1111",
    "name": "Josh Little",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EJL%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 64
  },
  {
    "id": "p_1112",
    "name": "Parthiv Patel",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Parthiv_Patel.jpg/500px-Parthiv_Patel.jpg",
    "stats": {
      "matches": 139,
      "runs": 2848,
      "avg": 22.6,
      "sr": 120.78,
      "hs": "81"
    },
    "rating": 63
  },
  {
    "id": "p_1113",
    "name": "Eoin Morgan",
    "role": "Batsman",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Eoin_Morgan_2.jpg/500px-Eoin_Morgan_2.jpg",
    "stats": {
      "matches": 83,
      "runs": 1405,
      "avg": 22.66,
      "sr": 122.6,
      "hs": "68*"
    },
    "rating": 63
  },
  {
    "id": "p_1114",
    "name": "Herschelle Gibbs",
    "role": "Batsman",
    "type": "Overseas",
    "country": "RSA",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Herschelle_Gibbs_2025_interview_%28cropped%29.png/500px-Herschelle_Gibbs_2025_interview_%28cropped%29.png",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 63
  },
  {
    "id": "p_1115",
    "name": "Corey Anderson",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ECA%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 63
  },
  {
    "id": "p_1116",
    "name": "Colin de Grandhomme",
    "role": "All-Rounder",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/2018.02.03.20.52.20-AUSvNZL_T20_NZL_innings%2C_SCG_%2838618201470%29_%28de_Grandhomme_cropped%29.jpg/500px-2018.02.03.20.52.20-AUSvNZL_T20_NZL_innings%2C_SCG_%2838618201470%29_%28de_Grandhomme_cropped%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 63
  },
  {
    "id": "p_1117",
    "name": "Mayank Agarwal",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/2_38_Agarwal_mugshot.jpg/500px-2_38_Agarwal_mugshot.jpg",
    "stats": {
      "matches": 127,
      "runs": 2661,
      "avg": 22.94,
      "sr": 133.45,
      "hs": "106"
    },
    "rating": 62
  },
  {
    "id": "p_1118",
    "name": "Kedar Jadhav",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EKJ%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 95,
      "runs": 1208,
      "avg": 22.37,
      "sr": 123.14,
      "hs": "69"
    },
    "rating": 62
  },
  {
    "id": "p_1119",
    "name": "Manan Vohra",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/MananVohra_Magic_book_of_record.jpg/500px-MananVohra_Magic_book_of_record.jpg",
    "stats": {
      "matches": 56,
      "runs": 1083,
      "avg": 22.1,
      "sr": 130.64,
      "hs": "95"
    },
    "rating": 62
  },
  {
    "id": "p_1120",
    "name": "George Bailey",
    "role": "Batsman",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/GEORGE_BAILEY_%2811704709453%29.jpg/500px-GEORGE_BAILEY_%2811704709453%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 62
  },
  {
    "id": "p_1121",
    "name": "Brett Lee",
    "role": "Bowler",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Brett_lee_closeup2.jpg",
    "stats": {
      "matches": 38,
      "wickets": 25,
      "econ": 7.51,
      "avg": 43.8,
      "bb": "3/15"
    },
    "rating": 62
  },
  {
    "id": "p_1122",
    "name": "Praveen Kumar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Praveen_Kumar.jpg/500px-Praveen_Kumar.jpg",
    "stats": {
      "matches": 119,
      "wickets": 90,
      "econ": 7.73,
      "avg": 36.12,
      "bb": "3/18"
    },
    "rating": 61
  },
  {
    "id": "p_1123",
    "name": "Sourav Ganguly",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Sourav_Ganguly_%28late_2010s%29.jpg/500px-Sourav_Ganguly_%28late_2010s%29.jpg",
    "stats": {
      "matches": 59,
      "runs": 1349,
      "avg": 25.45,
      "sr": 106.81,
      "hs": "91"
    },
    "rating": 61
  },
  {
    "id": "p_1124",
    "name": "S Sreesanth",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Sreesanth_1.jpg/500px-Sreesanth_1.jpg",
    "stats": {
      "matches": 44,
      "wickets": 40,
      "econ": 8.14,
      "avg": 33.2,
      "bb": "3/29"
    },
    "rating": 61
  },
  {
    "id": "p_1125",
    "name": "Manvinder Bisla",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EMB%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 39,
      "runs": 798,
      "avg": 21,
      "sr": 113.68,
      "hs": "92"
    },
    "rating": 61
  },
  {
    "id": "p_1126",
    "name": "Mandeep Singh",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Mandeep_Singh_2019.jpg/500px-Mandeep_Singh_2019.jpg",
    "stats": {
      "matches": 111,
      "runs": 1706,
      "avg": 20.8,
      "sr": 123.8,
      "hs": "77*"
    },
    "rating": 60
  },
  {
    "id": "p_1127",
    "name": "Tim Southee",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tim_Southee_ONZM_%28cropped%29.jpg/500px-Tim_Southee_ONZM_%28cropped%29.jpg",
    "stats": {
      "matches": 54,
      "wickets": 47,
      "econ": 8.67,
      "avg": 37.06,
      "bb": "3/20"
    },
    "rating": 60
  },
  {
    "id": "p_1128",
    "name": "Ajit Agarkar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/74/AjitAgarkar.jpg",
    "stats": {
      "matches": 35,
      "runs": 420,
      "sr": 132.5,
      "wickets": 24,
      "econ": 8.1
    },
    "rating": 60
  },
  {
    "id": "p_1129",
    "name": "Sam Billings",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "ENG",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Sam_Billings_Kent_V_Surrey_2015_at_Kia_Oval_Cricket_Ground_%2827190750944%29.jpg/500px-Sam_Billings_Kent_V_Surrey_2015_at_Kia_Oval_Cricket_Ground_%2827190750944%29.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 60
  },
  {
    "id": "p_1130",
    "name": "Matthew Wade",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "AUS",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Matthew_Wade.jpg/500px-Matthew_Wade.jpg",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 60
  },
  {
    "id": "p_1131",
    "name": "Naman Ojha",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/NAMAN_OJHA_%2816192960225%29.jpg/500px-NAMAN_OJHA_%2816192960225%29.jpg",
    "stats": {
      "matches": 113,
      "runs": 1554,
      "avg": 20.72,
      "sr": 118.35,
      "hs": "94*"
    },
    "rating": 58
  },
  {
    "id": "p_1132",
    "name": "Murali Kartik",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Murali_kartik_bowling.jpg/500px-Murali_kartik_bowling.jpg",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 58
  },
  {
    "id": "p_1133",
    "name": "Cheteshwar Pujara",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Cheteshwar_Pujara.jpg/500px-Cheteshwar_Pujara.jpg",
    "stats": {
      "matches": 30,
      "runs": 390,
      "avg": 20.53,
      "sr": 99.74,
      "hs": "51"
    },
    "rating": 58
  },
  {
    "id": "p_1134",
    "name": "Pradeep Sangwan",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EPS%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 30,
      "wickets": 32,
      "econ": 7.85,
      "avg": 26.5,
      "bb": "3/22"
    },
    "rating": 57
  },
  {
    "id": "p_1136",
    "name": "Shreevats Goswami",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ESG%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 35,
      "runs": 750,
      "avg": 26.4,
      "sr": 128.5,
      "hs": "72"
    },
    "rating": 56
  },
  {
    "id": "p_1137",
    "name": "Manpreet Gony",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Mpsgoni.jpg/500px-Mpsgoni.jpg",
    "stats": {
      "matches": 44,
      "wickets": 37,
      "econ": 8.7,
      "avg": 34.7,
      "bb": "3/34"
    },
    "rating": 54
  },
  {
    "id": "p_1138",
    "name": "Varun Aaron",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Varun_Aaron.jpg/500px-Varun_Aaron.jpg",
    "stats": {
      "matches": 52,
      "wickets": 44,
      "econ": 8.94,
      "avg": 34.02,
      "bb": "3/16"
    },
    "rating": 53
  },
  {
    "id": "p_1139",
    "name": "Mohammad Kaif",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22%230c0d10%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2242%22%20fill%3D%22%23151821%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.12)%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2258%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2C'Segoe%20UI'%2CRoboto%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2234%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EMK%3C%2Ftext%3E%3C%2Fsvg%3E",
    "stats": {
      "matches": 29,
      "runs": 259,
      "avg": 14.39,
      "sr": 103.6,
      "hs": "34"
    },
    "rating": 53
  },
  {
    "id": "p_1140",
    "name": "VVS Laxman",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/VVS_Laxman99.jpg/500px-VVS_Laxman99.jpg",
    "stats": {
      "matches": 20,
      "runs": 282,
      "avg": 15.67,
      "sr": 105.62,
      "hs": "52"
    },
    "rating": 53
  },
  {
    "id": "p_1141",
    "name": "Saurabh Tiwary",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/India_Vs_New_zealand_One_day_International%2C_10_December_2010_%286160465490%29.jpg/500px-India_Vs_New_zealand_One_day_International%2C_10_December_2010_%286160465490%29.jpg",
    "stats": {
      "matches": 93,
      "runs": 1495,
      "avg": 28.75,
      "sr": 120.1,
      "hs": "61*"
    },
    "rating": 81
  },
  {
    "id": "p_1142",
    "name": "Wasim Jaffer",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Waseem_Jaffer.jpg/500px-Waseem_Jaffer.jpg",
    "stats": {
      "matches": 8,
      "runs": 130,
      "avg": 16.25,
      "sr": 107.4,
      "hs": "50*"
    },
    "rating": 78
  },
  {
    "id": "p_1143",
    "name": "Swapnil Asnodkar",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Swapnil_asnodkar_With_Rashid_Zirak_%28cropped%29.jpg",
    "stats": {
      "matches": 20,
      "runs": 423,
      "avg": 21.15,
      "sr": 124.8,
      "hs": "60"
    },
    "rating": 77
  },
  {
    "id": "p_1144",
    "name": "Venugopal Rao",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 65,
      "runs": 985,
      "avg": 22.38,
      "sr": 117.8,
      "hs": "71*"
    },
    "rating": 77
  },
  {
    "id": "p_1145",
    "name": "Mithun Manhas",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/77/Mithun_manhas.jpg",
    "stats": {
      "matches": 55,
      "runs": 514,
      "avg": 22.34,
      "sr": 109.8,
      "hs": "42*"
    },
    "rating": 76
  },
  {
    "id": "p_1146",
    "name": "Gurkeerat Singh Mann",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 41,
      "runs": 511,
      "avg": 21.29,
      "sr": 121.1,
      "hs": "65"
    },
    "rating": 76
  },
  {
    "id": "p_1147",
    "name": "Rajat Bhatia",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "stats": {
      "matches": 95,
      "runs": 342,
      "wickets": 71,
      "econ": 7.41,
      "best": "4/25"
    },
    "rating": 82
  },
  {
    "id": "p_1148",
    "name": "Joginder Sharma",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 16,
      "runs": 36,
      "wickets": 12,
      "econ": 9.82,
      "best": "2/27"
    },
    "rating": 78
  },
  {
    "id": "p_1149",
    "name": "Laxmi Ratan Shukla",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 47,
      "runs": 405,
      "wickets": 15,
      "econ": 8.24,
      "best": "3/6"
    },
    "rating": 77
  },
  {
    "id": "p_1150",
    "name": "Iqbal Abdulla",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 49,
      "runs": 88,
      "wickets": 40,
      "econ": 7.23,
      "best": "3/24"
    },
    "rating": 79
  },
  {
    "id": "p_1151",
    "name": "Parvez Rasool",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/PR_20231223_195458.jpg/500px-PR_20231223_195458.jpg",
    "stats": {
      "matches": 11,
      "runs": 17,
      "wickets": 4,
      "econ": 7.25,
      "best": "1/5"
    },
    "rating": 75
  },
  {
    "id": "p_1152",
    "name": "Ashok Dinda",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "stats": {
      "matches": 78,
      "wickets": 69,
      "econ": 8.2,
      "avg": 30.04,
      "best": "4/18"
    },
    "rating": 81
  },
  {
    "id": "p_1153",
    "name": "Siddharth Trivedi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 1,
    "set": "Legends",
    "stats": {
      "matches": 76,
      "wickets": 65,
      "econ": 7.58,
      "avg": 29.29,
      "best": "4/25"
    },
    "rating": 82
  },
  {
    "id": "p_1154",
    "name": "Barinder Sran",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 24,
      "wickets": 18,
      "econ": 9.4,
      "avg": 38.39,
      "best": "3/28"
    },
    "rating": 77
  },
  {
    "id": "p_1155",
    "name": "Ishwar Pandey",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 25,
      "wickets": 18,
      "econ": 7.69,
      "avg": 36.17,
      "best": "2/23"
    },
    "rating": 77
  },
  {
    "id": "p_1156",
    "name": "Pankaj Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 17,
      "wickets": 11,
      "econ": 9.28,
      "avg": 43,
      "best": "2/31"
    },
    "rating": 76
  },
  {
    "id": "p_1157",
    "name": "Abhimanyu Mithun",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 16,
      "wickets": 7,
      "econ": 9.83,
      "avg": 65.57,
      "best": "2/26"
    },
    "rating": 75
  },
  {
    "id": "p_1158",
    "name": "Shadab Jakati",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Shadab_Jakati_in_2016_%2801%29.jpg/500px-Shadab_Jakati_in_2016_%2801%29.jpg",
    "stats": {
      "matches": 59,
      "wickets": 47,
      "econ": 8.01,
      "avg": 31.45,
      "best": "4/22"
    },
    "rating": 80
  },
  {
    "id": "p_1159",
    "name": "Karanveer Singh",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 9,
      "wickets": 11,
      "econ": 8.89,
      "avg": 26.64,
      "best": "4/54"
    },
    "rating": 76
  },
  {
    "id": "p_1160",
    "name": "Dishant Yagnik",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.5,
    "set": "Legends",
    "stats": {
      "matches": 25,
      "runs": 170,
      "avg": 17,
      "sr": 124.09,
      "hs": "34"
    },
    "rating": 75
  },
  {
    "id": "p_1161",
    "name": "Macneil Noronha",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "rating": 62,
    "stats": {
      "matches": 10,
      "runs": 180,
      "wickets": 8,
      "econ": 8.1,
      "avg": 22.5
    }
  },
  {
    "id": "p_1162",
    "name": "Connor Esterhuizen",
    "role": "Wicket-Keeper",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "UWK1",
    "rating": 65,
    "stats": {
      "matches": 15,
      "runs": 320,
      "avg": 26.6,
      "sr": 135.2,
      "hs": "68*"
    }
  },
  {
    "id": "p_1163",
    "name": "Luke Wood",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "FA1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/2_16_Luke_Wood_sequence_%28cropped%29.jpg/330px-2_16_Luke_Wood_sequence_%28cropped%29.jpg",
    "rating": 70,
    "stats": {
      "matches": 28,
      "wickets": 32,
      "econ": 8.6,
      "avg": 27.1,
      "bb": "3/20"
    }
  },
  {
    "id": "p_1164",
    "name": "Daksh Kamra",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "rating": 60,
    "stats": {
      "matches": 8,
      "runs": 150,
      "avg": 25,
      "sr": 128,
      "hs": "48"
    }
  },
  {
    "id": "p_1165",
    "name": "Atharva Ankolekar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "rating": 64,
    "stats": {
      "matches": 22,
      "runs": 240,
      "wickets": 25,
      "econ": 7.2,
      "avg": 23.4
    }
  },
  {
    "id": "p_1166",
    "name": "Krish Bhagat",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "rating": 60,
    "stats": {
      "matches": 6,
      "wickets": 7,
      "econ": 8.8,
      "avg": 29,
      "bb": "2/24"
    }
  },
  {
    "id": "p_1167",
    "name": "Ruchit Ahir",
    "role": "Wicket-Keeper",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UWK1",
    "rating": 61,
    "stats": {
      "matches": 12,
      "runs": 210,
      "avg": 23.3,
      "sr": 130.5,
      "hs": "54"
    }
  },
  {
    "id": "p_1168",
    "name": "Vishal Nishad",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "rating": 60,
    "stats": {
      "matches": 5,
      "wickets": 6,
      "econ": 8.5,
      "avg": 28,
      "bb": "2/18"
    }
  },
  {
    "id": "p_1169",
    "name": "Emanjot Chahal",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "rating": 60,
    "stats": {
      "matches": 7,
      "wickets": 8,
      "econ": 7.6,
      "avg": 25.5,
      "bb": "3/28"
    }
  },
  {
    "id": "p_1170",
    "name": "Amit Kumar",
    "role": "All-Rounder",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UAL1",
    "rating": 60,
    "stats": {
      "matches": 9,
      "runs": 120,
      "wickets": 6,
      "econ": 8.2,
      "avg": 26
    }
  },
  {
    "id": "p_1171",
    "name": "Dilshan Madushanka",
    "role": "Bowler",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.75,
    "set": "FA1",
    "rating": 72,
    "stats": {
      "matches": 20,
      "wickets": 28,
      "econ": 8.4,
      "avg": 24.2,
      "bb": "4/35"
    }
  },
  {
    "id": "p_1172",
    "name": "R.S.Ambrish",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "rating": 60,
    "stats": {
      "matches": 6,
      "wickets": 7,
      "econ": 8.9,
      "avg": 30.1,
      "bb": "2/22"
    }
  },
  {
    "id": "p_1173",
    "name": "Auqib Nabi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Auqib_Nabi_bowling_in_a_Ranji_Trophy_2024-25_match_against_Meghalaya_in_Shillong.jpg/330px-Auqib_Nabi_bowling_in_a_Ranji_Trophy_2024-25_match_against_Meghalaya_in_Shillong.jpg",
    "rating": 66,
    "stats": {
      "matches": 14,
      "wickets": 18,
      "econ": 7.8,
      "avg": 22,
      "bb": "4/21"
    },
    "team": "DC",
    "retentionPrice": 8.4,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1174",
    "name": "Gurnoor Singh Brar",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/418200/418219.jpg",
    "rating": 64,
    "stats": {
      "matches": 10,
      "wickets": 12,
      "econ": 8.3,
      "avg": 25.5,
      "bb": "3/29"
    },
    "team": "GT",
    "retentionPrice": 1.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1175",
    "name": "Sarthak Ranjan",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "rating": 61,
    "stats": {
      "matches": 11,
      "runs": 240,
      "avg": 24,
      "sr": 126.5,
      "hs": "51"
    },
    "team": "KKR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1176",
    "name": "Akshat Raghuwanshi",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "rating": 64,
    "stats": {
      "matches": 16,
      "runs": 380,
      "avg": 27.1,
      "sr": 133,
      "hs": "64"
    },
    "team": "LSG",
    "retentionPrice": 2.2,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1177",
    "name": "Digvesh Rathi",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/400300/400306.jpg",
    "rating": 63,
    "stats": {
      "matches": 12,
      "wickets": 15,
      "econ": 7.4,
      "avg": 24,
      "bb": "3/25"
    },
    "team": "LSG",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1178",
    "name": "Harnoor Pannu",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "rating": 62,
    "stats": {
      "matches": 10,
      "runs": 220,
      "avg": 24.4,
      "sr": 125,
      "hs": "56"
    },
    "team": "PBKS",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1179",
    "name": "Aman Rao Perala",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "rating": 60,
    "stats": {
      "matches": 8,
      "runs": 160,
      "avg": 22.8,
      "sr": 124,
      "hs": "45"
    },
    "team": "RR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1180",
    "name": "Lhuan-dre Pretorius",
    "role": "Batsman",
    "type": "Overseas",
    "country": "OS",
    "basePrice": 0.3,
    "set": "UBA1",
    "image": "https://documents.iplt20.com/ipl/IPLHeadshot2025/2827.png",
    "rating": 65,
    "stats": {
      "matches": 15,
      "runs": 340,
      "avg": 28.3,
      "sr": 138.5,
      "hs": "71"
    },
    "team": "RR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1181",
    "name": "Yash Raj Punja",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UFA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/420600/420665.png",
    "rating": 60,
    "stats": {
      "matches": 6,
      "wickets": 6,
      "econ": 8.7,
      "avg": 31,
      "bb": "2/26"
    },
    "team": "RR",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1182",
    "name": "Krains Fuletra",
    "role": "Bowler",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "USP1",
    "rating": 60,
    "stats": {
      "matches": 5,
      "wickets": 5,
      "econ": 8,
      "avg": 28,
      "bb": "2/20"
    },
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  },
  {
    "id": "p_1183",
    "name": "Smaran Ravichandran",
    "role": "Batsman",
    "type": "Indian",
    "country": "IND",
    "basePrice": 0.3,
    "set": "UBA1",
    "image": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/386300/386303.jpg",
    "rating": 62,
    "stats": {
      "matches": 11,
      "runs": 260,
      "avg": 26,
      "sr": 129,
      "hs": "58"
    },
    "team": "SRH",
    "retentionPrice": 0.3,
    "isRetained": true,
    "isTraded": false
  }
];

// Fallback: assign initial SVG avatar to any player without an image
for (const p of IPL_PLAYERS) {
  if (!p.image) {
    p.image = getPlayerAvatar(p.name);
  }
}

