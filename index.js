const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 👉 servir frontend desde /public
app.use(express.static("public"));

const API_KEY = process.env.RIOT_API_KEY;

const players = [
  "AngélàWhítè#S3S0",
  "Muted#nyah",
  "iAmNyah#nyah",
  "KevinB2000#LAN"
];

// 🔎 obtener PUUID
async function getPUUID(gameName, tagLine) {
  try {
    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data.puuid;
  } catch (err) {
    return null;
  }
}

// 🏆 obtener ranks
async function getRank(puuid) {
  try {
    const url = `https://la1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`;
    const res = await axios.get(url);

    const data = res.data;

    const solo = data.find(x => x.queueType === "RANKED_SOLO_5x5");
    const flex = data.find(x => x.queueType === "RANKED_FLEX_SR");

    return { solo, flex };
  } catch (err) {
    return null;
  }
}

// 📊 orden de rangos
const tierOrder = {
  CHALLENGER: 9,
  GRANDMASTER: 8,
  MASTER: 7,
  DIAMOND: 6,
  EMERALD: 5,
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
  IRON: 0
};

function getScore(player) {
  if (!player.solo) return 0;

  const tier = player.solo.rank.split(" ")[0];
  const lp = player.solo.lp;

  return (tierOrder[tier] || 0) * 1000 + lp;
}

// 📡 API ranking
app.get("/ranking", async (req, res) => {
  const results = [];

  for (const fullName of players) {
    const [gameName, tagLine] = fullName.split("#");

    const puuid = await getPUUID(gameName, tagLine);
    const rank = puuid ? await getRank(puuid) : null;

    results.push({
      name: fullName,

      solo: rank?.solo
        ? {
            lp: rank.solo.leaguePoints,
            rank: `${rank.solo.tier} ${rank.solo.rank}`,
            wins: rank.solo.wins,
            losses: rank.solo.losses
          }
        : null,

      flex: rank?.flex
        ? {
            lp: rank.flex.leaguePoints,
            rank: `${rank.flex.tier} ${rank.flex.rank}`,
            wins: rank.flex.wins,
            losses: rank.flex.losses
          }
        : null
    });
  }

  // 🔥 ordenar mejor a peor
  results.sort((a, b) => getScore(b) - getScore(a));

  res.json(results);
});

// 🚀 server
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
