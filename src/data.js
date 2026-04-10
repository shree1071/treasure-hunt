export const TEAMS = {
  1: { pin: "1423" },
  2: { pin: "2847" },
  3: { pin: "3291" },
  4: { pin: "4756" },
  5: { pin: "5138" },
  6: { pin: "6472" },
  7: { pin: "7315" },
  8: { pin: "8694" },
  9: { pin: "9027" },
  10: { pin: "1056" },
  11: { pin: "2183" },
  12: { pin: "3749" },
  13: { pin: "4862" },
  14: { pin: "5391" },
  15: { pin: "6274" },
};

export const LOCATIONS = [
  "room506", "amphitheatre", "library", "foodcourt", 
  "welding", "bigscreen", "kuteera", "bsn3rd", "datacentre", "start"
];

// Mapping of numeric PINs from QRs to standard location IDs
export const LOCATION_CODES = {
  "8143": "room506",
  "3927": "amphitheatre",
  "6519": "library",
  "2084": "foodcourt",
  "9751": "welding",
  "4638": "bigscreen",
  "1295": "kuteera",
  "7462": "bsn3rd",
  "5820": "datacentre"
};

// Each team's ordered route (9 stops)
export const ROUTES = {
  1:  ["room506", "amphitheatre", "library", "foodcourt", "datacentre", "bsn3rd", "welding", "bigscreen", "kuteera"],
  2:  ["welding", "room506", "kuteera", "bsn3rd", "datacentre", "amphitheatre", "library", "bigscreen", "foodcourt"],
  3:  ["amphitheatre", "welding", "kuteera", "bsn3rd", "datacentre", "library", "foodcourt", "bigscreen", "room506"],
  4:  ["bigscreen", "room506", "amphitheatre", "library", "datacentre", "welding", "foodcourt", "kuteera", "bsn3rd"],
  5:  ["kuteera", "welding", "library", "foodcourt", "datacentre", "bsn3rd", "room506", "amphitheatre", "bigscreen"],
  6:  ["kuteera", "room506", "welding", "amphitheatre", "datacentre", "bigscreen", "foodcourt", "library", "bsn3rd"],
  7:  ["bsn3rd", "bigscreen", "welding", "foodcourt", "datacentre", "amphitheatre", "kuteera", "library", "room506"],
  8:  ["bigscreen", "room506", "bsn3rd", "kuteera", "datacentre", "library", "amphitheatre", "welding", "foodcourt"],
  9:  ["room506", "amphitheatre", "library", "welding", "datacentre", "foodcourt", "bigscreen", "bsn3rd", "kuteera"],
  10: ["bigscreen", "welding", "library", "bsn3rd", "datacentre", "kuteera", "amphitheatre", "room506", "foodcourt"],
  11: ["amphitheatre", "bsn3rd", "kuteera", "welding", "datacentre", "library", "bigscreen", "foodcourt", "room506"],
  12: ["bigscreen", "welding", "foodcourt", "kuteera", "datacentre", "amphitheatre", "library", "room506", "bsn3rd"],
  13: ["welding", "amphitheatre", "library", "kuteera", "datacentre", "foodcourt", "room506", "bsn3rd", "bigscreen"],
  14: ["bigscreen", "kuteera", "amphitheatre", "library", "datacentre", "room506", "foodcourt", "welding", "bsn3rd"],
  15: ["amphitheatre", "bigscreen", "welding", "bsn3rd", "datacentre", "kuteera", "foodcourt", "library", "room506"],
};

// Clue text for each location
export const CLUES = {
  room506:      "I am a room with a number on my door — five hundred and six. In the lab block I wait, with chairs in rows and a board at the front. Come find me if you can count. Your code word is on the board inside.",
  amphitheatre: "Open skies above, tiered seats below. I am the stage where ideas perform and voices carry far. Find me where the academic block breathes. Your code word is at the entrance.",
  library:      "Thousands of voices, yet perfectly silent. Rows of knowledge line my walls. Scholars come to me when Google isn't enough. Your code word is at the entrance.",
  foodcourt:    "Follow your nose to the lab block. Where hungry minds refuel between builds and bugs. I smell better than your deadline. Your code word is at the entrance.",
  welding:      "You were looking for music, but creativity takes many forms. The room next door shapes metal, not melody. Look for sparks, not strings. Your code word is at the entrance.",
  bigscreen:    "I greet every student who walks through the gate. A giant display you cannot miss — I've seen every face that ever joined this college. Your code word is at the entrance.",
  kuteera:      "Sunlight through leaves, the smell of food in open air. Not a cafeteria, not a classroom — somewhere the campus exhales. Find the green corner where students go to breathe between battles. Your code word is on the notice board.",
  bsn3rd:       "Climb up — three floors up in BSN. I am placed right outside a cabin. Come find what's waiting. Your code word is on the notice board.",
  datacentre:   "The brain of the campus hums here. Racks of servers, blinking lights, cool air. Where all the data lives. Your code word is at the entrance.",
};

export const FINAL_CLUE = "Your journey ends where it began. Head back to the room where your team was torn apart — your teammate is waiting, and so is your final mission.";

export const REUNION_MESSAGE = "Head back to BSN Auditorium. Your teammate has been solving a puzzle — their answer reveals your next location.";
