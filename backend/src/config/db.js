const seedParkings = [
  {
    id: "rp-101",
    name: "Parkhaus Hauptbahnhof",
    latitude: 48.1353,
    longitude: 11.5584,
    free_slots: 184,
    total_slots: 420,
    status: "open",
    source: "seed"
  },
  {
    id: "rp-102",
    name: "P+R Nord",
    latitude: 48.1621,
    longitude: 11.5862,
    free_slots: 56,
    total_slots: 140,
    status: "open",
    source: "seed"
  },
  {
    id: "rp-103",
    name: "Tiefgarage Altstadt",
    latitude: 48.1378,
    longitude: 11.5755,
    free_slots: 12,
    total_slots: 90,
    status: "limited",
    source: "seed"
  },
  {
    id: "rp-104",
    name: "Parkhaus Messe West",
    latitude: 48.1332,
    longitude: 11.6928,
    free_slots: 0,
    total_slots: 330,
    status: "full",
    source: "seed"
  }
];

function getSeedParkings() {
  return structuredClone(seedParkings);
}

module.exports = {
  getSeedParkings
};
