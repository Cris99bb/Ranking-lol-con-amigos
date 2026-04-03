const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔐 KEY SEGURA (Render ENV)
const API_KEY = process.env.RIOT_API_KEY;

// 👇 jugadores
const players = [
  "AngélàWhítè#S3S0",
  "Muted#nyah",
  "iAmNyah#nyah",
  "KevinB2000#LAN"
];

// split name
function splitName(full) {
  const [gameName, tagLine] = full.split("#");
  return { gameName, tagLine };
}

// 🔥 1. PUUID
async function getPUUID(gameName, tagLine) {
  const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagLine}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  return res.data.puuid;
}

// 🔥 2. SUMMONER ID
async function getSummoner(puuid) {
  const url = `https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  return res.data.id;
}

// 🔥 3. RANKED DATA
async function getRank(summonerId) {
  const url = `https://la1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  const data = res.data;

  const solo = data.find(d => d.queueType === "RANKED_SOLO_5x5");
  const flex = data.find(d => d.queueType === "RANKED_FLEX_SR");

  return { solo, flex };
}

// 📊 API
app.get("/ranking", async (req, res) => {
  try {
    const results = [];

    for (const p of players) {
      const { gameName, tagLine } = splitName(p);

      try {
        const puuid = await getPUUID(gameName, tagLine);
        const summonerId = await getSummoner(puuid);
        const rank = await getRank(summonerId);

        results.push({
          name: p,

          solo: rank.solo
            ? {
                tier: rank.solo.tier,
                rank: rank.solo.rank,
                lp: rank.solo.leaguePoints,
                wins: rank.solo.wins,
                losses: rank.solo.losses,
                winrate: Math.round(
                  (rank.solo.wins / (rank.solo.wins + rank.solo.losses)) * 100
                )
              }
            : null,

          flex: rank.flex
            ? {
                tier: rank.flex.tier,
                rank: rank.flex.rank,
                lp: rank.flex.leaguePoints,
                wins: rank.flex.wins,
                losses: rank.flex.losses,
                winrate: Math.round(
                  (rank.flex.wins / (rank.flex.wins + rank.flex.losses)) * 100
                )
              }
            : null
        });

      } catch (err) {
        console.log("ERROR jugador:", p, err.response?.data || err.message);

        results.push({
          name: p,
          solo: null,
          flex: null
        });
      }
    }

    res.json(results);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("🔥 Server listo en puerto", PORT));
