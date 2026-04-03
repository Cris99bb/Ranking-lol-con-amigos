const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = "RGAPI-010b98e7-835d-422a-bf50-c91a59132f1c";

const players = [
  "AngélàWhítè#S3S0",
  "Muted#nyah",
  "iAmNyah#nyah",
  "KevinB2000#LAN"
];

function splitName(full) {
  const [gameName, tagLine] = full.split("#");
  return { gameName, tagLine };
}

async function getPUUID(gameName, tagLine) {
  const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagLine}`;
  const res = await axios.get(url, { headers: { "X-Riot-Token": API_KEY } });
  return res.data.puuid;
}

async function getSummoner(puuid) {
  const url = `https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const res = await axios.get(url, { headers: { "X-Riot-Token": API_KEY } });
  return res.data.id;
}

async function getRank(id) {
  const url = `https://la1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`;
  const res = await axios.get(url, { headers: { "X-Riot-Token": API_KEY } });

  const solo = res.data.find(r => r.queueType === "RANKED_SOLO_5x5");
  const flex = res.data.find(r => r.queueType === "RANKED_FLEX_SR");

  return { solo, flex };
}

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
      console.log("error:", p);
      results.push({ name: p, solo: null, flex: null });
    }
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 OK en puerto", PORT));
