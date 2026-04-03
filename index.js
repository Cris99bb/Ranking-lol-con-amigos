const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = "RGAPI-8b3a45f9-17bb-4269-8ae4-9f3a04ac1f15";

// 👇 TUS JUGADORES
const players = [
  "AngélàWhítè#S3S0",
  "Muted#nyah",
  "iAmNyah#nyah",
  "KevinB2000#LAN"
];

// 🔥 separar gameName + tagLine
function splitName(full) {
  const [gameName, tagLine] = full.split("#");
  return { gameName, tagLine };
}

// 🔥 obtener PUUID
async function getPUUID(gameName, tagLine) {
  const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  return res.data.puuid;
}

// 🔥 obtener ranked
async function getRank(puuid) {
  const url = `https://la1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;

  const res = await axios.get(url, {
    headers: { "X-Riot-Token": API_KEY }
  });

  const data = res.data;

  const solo = data.find(d => d.queueType === "RANKED_SOLO_5x5");
  const flex = data.find(d => d.queueType === "RANKED_FLEX_SR");

  return { solo, flex };
}

// 🔥 API
app.get("/ranking", async (req, res) => {
  try {
    const results = [];

    for (const p of players) {
      const { gameName, tagLine } = splitName(p);

      try {
        const puuid = await getPUUID(gameName, tagLine);
        const rank = await getRank(puuid);

        results.push({
          name: p,

          solo: rank.solo
            ? {
                tier: rank.solo.tier,
                rank: rank.solo.rank,
                lp: rank.solo.leaguePoints,
                wins: rank.solo.wins,
                losses: rank.solo.losses
              }
            : null,

          flex: rank.flex
            ? {
                tier: rank.flex.tier,
                rank: rank.flex.rank,
                lp: rank.flex.leaguePoints,
                wins: rank.flex.wins,
                losses: rank.flex.losses
              }
            : null
        });

      } catch (err) {
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
    res.status(500).json({ error: "error server" });
  }
});

app.listen(3000, () => console.log("🔥 Server listo en puerto 3000"));
