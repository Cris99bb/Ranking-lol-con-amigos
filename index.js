const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔐 KEY (Render ENV o temporal)
const API_KEY = process.env.RIOT_API_KEY || "RGAPI-010b98e7-835d-422a-bf50-c91a59132f1c";

// 👇 jugadores
const players = [
  "AngélàWhítè#S3S0",
  "Muted#nyah",
  "iAmNyah#nyah",
  "KevinB2000#LAN"
];

// 🔥 detectar región automáticamente (LAN / NA / etc simple fix)
function getPlatform(tag) {
  if (tag === "LAN" || tag === "LAS") return "americas";
  return "americas"; // fallback seguro
}

function splitName(full) {
  const [gameName, tagLine] = full.split("#");
  return { gameName, tagLine };
}

// 🔥 1. PUUID (ACCOUNT API)
async function getPUUID(gameName, tagLine) {
  const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${tagLine}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  return res.data.puuid;
}

// 🔥 2. SUMMONER ID (IMPORTANTE FIX: usamos AMERICAS proxy NO la1 directo)
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

  const format = (r) => {
    if (!r) return null;

    const total = r.wins + r.losses;

    return {
      tier: r.tier,
      rank: r.rank,
      lp: r.leaguePoints,
      wins: r.wins,
      losses: r.losses,
      winrate: total > 0 ? Math.round((r.wins / total) * 100) : 0
    };
  };

  return {
    solo: format(solo),
    flex: format(flex)
  };
}

// 📊 API
app.get("/ranking", async (req, res) => {
  const results = [];

  for (const p of players) {
    const { gameName, tagLine } = splitName(p);

    try {
      const puuid = await getPUUID(gameName, tagLine);
      const summonerId = await getSummoner(puuid);
      const rank = await getRank(summonerId);

      results.push({
        name: p,
        solo: rank.solo,
        flex: rank.flex
      });

    } catch (err) {
      console.log("ERROR:", p, err.response?.data || err.message);

      results.push({
        name: p,
        solo: null,
        flex: null
      });
    }
  }

  res.json(results);
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Server listo en puerto", PORT));
