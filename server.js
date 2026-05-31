const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
let roomLink = 'Room still starting... refresh in 30 seconds';

app.get('/health', (req, res) => res.send('alive'));
app.get('/', (req, res) => {
  res.send(
    '<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff">' +
    '<h1>🇩🇿 Test Futsal Algeria</h1>' +
    '<p style="font-size:22px">Room Link: <a href="' + roomLink + '" style="color:#4af" target="_blank">' + roomLink + '</a></p>' +
    '<p style="color:#aaa">Share this link with your friends!</p>' +
    (roomLink.includes('haxball') ? '' : '<script>setTimeout(()=>location.reload(),8000);</script>') +
    '</body></html>'
  );
});
app.listen(process.env.PORT || 3000, () => console.log('Health server running'));

const ROOM_SCRIPT = function(token) {
  var MAX_SCORE = 3;
  var TIME_LIMIT = 7;
  var TEAM_SIZE = 3;
  var SUPER_ADMINS = ["Bruno Fernandes"];

  var STADIUM = JSON.stringify({
    "name": "Futsal Algeria 3v3",
    "width": 420, "height": 200, "spawnDistance": 150,
    "bg": { "type": "grass", "width": 420, "height": 200, "kickOffRadius": 75, "cornerRadius": 0 },
    "vertexes": [
      {"x": -420, "y": -200, "trait": "ballArea"},
      {"x": -420, "y": 200,  "trait": "ballArea"},
      {"x": 420,  "y": 200,  "trait": "ballArea"},
      {"x": 420,  "y": -200, "trait": "ballArea"},
      {"x": -420, "y": -55,  "trait": "goalNet"},
      {"x": -485, "y": -55,  "trait": "goalNet"},
      {"x": -485, "y": 55,   "trait": "goalNet"},
      {"x": -420, "y": 55,   "trait": "goalNet"},
      {"x": 420,  "y": -55,  "trait": "goalNet"},
      {"x": 485,  "y": -55,  "trait": "goalNet"},
      {"x": 485,  "y": 55,   "trait": "goalNet"},
      {"x": 420,  "y": 55,   "trait": "goalNet"}
    ],
    "segments": [
      {"v0": 0, "v1": 1, "trait": "ballArea"},
      {"v0": 1, "v1": 2, "trait": "ballArea"},
      {"v0": 2, "v1": 3, "trait": "ballArea"},
      {"v0": 3, "v1": 0, "trait": "ballArea"},
      {"v0": 4, "v1": 5, "trait": "goalNet"},
      {"v0": 5, "v1": 6, "trait": "goalNet"},
      {"v0": 6, "v1": 7, "trait": "goalNet"},
      {"v0": 8, "v1": 9, "trait": "goalNet"},
      {"v0": 9, "v1": 10, "trait": "goalNet"},
      {"v0": 10, "v1": 11, "trait": "goalNet"}
    ],
    "goals": [
      {"p0": [-420, -55], "p1": [-420, 55], "team": "red"},
      {"p0": [420, -55],  "p1": [420, 55],  "team": "blue"}
    ],
    "discs": [{"pos": [0, 0], "trait": "ballDefault"}],
    "planes": [
      {"normal": [0, 1],  "dist": -200, "bCoeff": 0.2},
      {"normal": [0, -1], "dist": -200, "bCoeff": 0.2}
    ],
    "traits": {
      "ballArea":    {"vis": false, "bCoeff": 1, "cMask": ["ball"]},
      "goalNet":     {"vis": true,  "bCoeff": 0.1, "cMask": ["ball"], "color": "FFFFFF"},
      "ballDefault": {"radius": 10, "bCoeff": 0.4, "invMass": 1.5, "damping": 0.99}
    },
    "playerPhysics": {
      "bCoeff": 0, "acceleration": 0.11, "turning": 0.0035,
      "kicking": 0.083, "kickingBCoeff": 0.5, "kickStrength": 5, "tackleRadius": 16
    },
    "ballPhysics": "disc0",
    "redSpawnPoints":  [[-300, 0], [-220, -70], [-220, 70]],
    "blueSpawnPoints": [[300, 0],  [220, -70],  [220, 70]]
  });

  var room = HBInit({
    roomName: "🇩🇿 Test Futsal Algeria | 3v3 ELO",
    maxPlayers: 16,
    public: true,
    noPlayer: true,
    token: token,
    geo: { code: "DZ", lat: 36.7, lon: 3.0 }
  });

  room.setCustomStadium(STADIUM);
  room.setScoreLimit(MAX_SCORE);
  room.setTimeLimit(TIME_LIMIT);

  // ELO
  var playerDB = {};
  function getPlayer(name) {
    if (!playerDB[name]) playerDB[name] = { elo: 1000, wins: 0, losses: 0, goals: 0, assists: 0 };
    return playerDB[name];
  }
  function updateElo(winners, losers, diff) {
    var K = 32;
    var bonus = Math.min(1 + diff * 0.08, 1.4);
    var avgW = winners.reduce(function(s,n){ return s + getPlayer(n).elo; }, 0) / winners.length;
    var avgL = losers.reduce(function(s,n){ return s + getPlayer(n).elo; }, 0) / losers.length;
    winners.forEach(function(n) {
      var p = getPlayer(n);
      var gain = Math.round(K * (1 - 1/(1+Math.pow(10,(avgL-avgW)/400))) * bonus);
      p.elo += gain; p.wins++; p._change = "+" + gain;
    });
    losers.forEach(function(n) {
      var p = getPlayer(n);
      var loss = Math.round(K * (1 - 1/(1+Math.pow(10,(avgW-avgL)/400))));
      p.elo = Math.max(100, p.elo - loss); p.losses++; p._change = "-" + loss;
    });
  }
  function getRank(elo) {
    if (elo >= 2000) return "🏆 Legend";
    if (elo >= 1700) return "💎 Diamond";
    if (elo >= 1500) return "🥇 Gold";
    if (elo >= 1300) return "🥈 Silver";
    if (elo >= 1100) return "🥉 Bronze";
    return "⚪ Iron";
  }

  // COMMENTARY
  var C = {
    goal:       ["🔥 GOOOAL! What a strike!", "💥 GET IN THERE!", "⚽ GOAL! Unstoppable!", "😱 SENSATIONAL!", "🚀 TOP CORNER!", "⚡ THUNDERBOLT!", "🌟 WORLDIE!"],
    ownGoal:    ["😬 OWN GOAL! Nightmare!", "💀 Into his own net...", "🤦 He'll want to forget that!"],
    redLead:    ["🔴 Red pulling away!", "🔴 Red are in control!"],
    blueLead:   ["🔵 Blue dominating!", "🔵 Blue look dangerous!"],
    tied:       ["⚖️ All level! Far from over!", "🔥 Back to square one!", "😤 The equalizer!"],
    matchPoint: ["🚨 MATCH POINT! One goal wins it!", "💣 ONE GOAL AWAY from victory!"],
    redWin:     ["🔴 RED WINS! Incredible!", "🔴 Red takes it! Champions!"],
    blueWin:    ["🔵 BLUE WINS! Outstanding!", "🔵 Blue clinches it!"],
    draw:       ["🤝 It's a DRAW! What a battle!", "⚖️ All square!"],
    kickoff:    ["🎙️ Welcome! Let's go! 🇩🇿", "⚡ 3v3 action starts NOW!"]
  };
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function say(type) { room.sendChat(rnd(C[type])); }

  // STATE
  var scores = { red: 0, blue: 0 };
  var gameRunning = false;
  var lastTouched = null, secondLastTouched = null;
  var gameStartPlayers = [];
  var statsGame = {};
  var idleTimers = {};
  var autoStartTimer = null;

  function statAdd(name, field) {
    if (!statsGame[name]) statsGame[name] = { goals: 0, assists: 0 };
    statsGame[name][field]++;
    getPlayer(name)[field]++;
  }
  function getTeam(id) { return room.getPlayerList().filter(function(p){ return p.team === id; }); }
  function showTeamElo() {
    var red = getTeam(1), blue = getTeam(2);
    if (!red.length || !blue.length) return;
    var rAvg = Math.round(red.reduce(function(s,p){ return s+getPlayer(p.name).elo; },0)/red.length);
    var bAvg = Math.round(blue.reduce(function(s,p){ return s+getPlayer(p.name).elo; },0)/blue.length);
    room.sendChat("🔴 Red avg: " + rAvg + " ELO | 🔵 Blue avg: " + bAvg + " ELO");
  }
  function tryAutoStart() {
    if (getTeam(1).length >= TEAM_SIZE && getTeam(2).length >= TEAM_SIZE && !gameRunning) {
      room.sendChat("✅ Teams ready! Starting in 5 seconds...");
      showTeamElo();
      clearTimeout(autoStartTimer);
      autoStartTimer = setTimeout(function(){ room.startGame(); }, 5000);
    }
  }

  // EVENTS
  room.onPlayerJoin = function(player) {
    var p = getPlayer(player.name);
    room.sendChat("👋 Welcome " + player.name + " | " + getRank(p.elo) + " [" + p.elo + " ELO]");
    room.sendChat("📋 !elo  !stats  !top5  !score  !help");
    if (SUPER_ADMINS.includes(player.name)) room.setPlayerAdmin(player.id, true);
  };

  room.onPlayerLeave = function(player) {
    clearTimeout(idleTimers[player.id]);
    if (gameRunning) {
      room.sendChat("⚠️ " + player.name + " left!");
      if (getTeam(1).length < 1 || getTeam(2).length < 1) {
        room.sendChat("⚠️ Not enough players — stopping.");
        room.stopGame();
      }
    }
  };

  room.onGameStart = function() {
    scores = { red: 0, blue: 0 };
    lastTouched = null; secondLastTouched = null;
    statsGame = {}; gameRunning = true;
    gameStartPlayers = room.getPlayerList().filter(function(p){ return p.team !== 0; });
    setTimeout(function(){ say("kickoff"); showTeamElo(); }, 1000);
  };

  room.onGameStop = function() { gameRunning = false; };

  room.onPlayerBallKick = function(player) {
    secondLastTouched = lastTouched;
    lastTouched = player;
  };

  room.onTeamGoal = function(team) {
    say("goal");
    if (lastTouched) {
      if (lastTouched.team === team) {
        statAdd(lastTouched.name, "goals");
        room.sendChat("⚽ Goal by " + lastTouched.name + "!");
      } else {
        say("ownGoal");
      }
      if (secondLastTouched && secondLastTouched.name !== lastTouched.name && secondLastTouched.team === team) {
        statAdd(secondLastTouched.name, "assists");
        room.sendChat("🎁 Assist: " + secondLastTouched.name);
      }
    }
    if (team === 1) scores.red++; else scores.blue++;
    room.sendChat("🔴 " + scores.red + " — " + scores.blue + " 🔵");
    setTimeout(function() {
      if (scores.red === scores.blue) say("tied");
      else if (team === 1) say("redLead");
      else say("blueLead");
      if (scores.red === MAX_SCORE - 1 || scores.blue === MAX_SCORE - 1) say("matchPoint");
      if (scores.red >= MAX_SCORE || scores.blue >= MAX_SCORE) setTimeout(endGame, 1500);
    }, 1200);
  };

  function endGame() {
    gameRunning = false;
    var redNames  = gameStartPlayers.filter(function(p){ return p.team===1; }).map(function(p){ return p.name; });
    var blueNames = gameStartPlayers.filter(function(p){ return p.team===2; }).map(function(p){ return p.name; });
    var winner = scores.red > scores.blue ? "red" : scores.blue > scores.red ? "blue" : "draw";
    if (winner === "red")  { say("redWin");  updateElo(redNames, blueNames, scores.red - scores.blue); }
    else if (winner === "blue") { say("blueWin"); updateElo(blueNames, redNames, scores.blue - scores.red); }
    else say("draw");
    setTimeout(function() {
      room.sendChat("━━━━━━━━━━━━━━━━━━━━━");
      room.sendChat("📊 MATCH REPORT 🔴 " + scores.red + " — " + scores.blue + " 🔵");
      room.sendChat("━━━━━━━━━━━━━━━━━━━━━");
      redNames.concat(blueNames).forEach(function(name) {
        var s = statsGame[name] || { goals: 0, assists: 0 };
        var p = getPlayer(name);
        room.sendChat("  " + name + " | ⚽" + s.goals + " 🎁" + s.assists + " | ELO: " + p.elo + " (" + (p._change||"0") + ") " + getRank(p.elo));
      });
      room.sendChat("━━━━━━━━━━━━━━━━━━━━━");
      room.stopGame();
      setTimeout(tryAutoStart, 6000);
    }, 2000);
  }

  room.onPlayerTeamChange = function() { if (!gameRunning) tryAutoStart(); };

  room.onPlayerActivity = function(player) {
    clearTimeout(idleTimers[player.id]);
    idleTimers[player.id] = setTimeout(function() {
      if (player.team !== 0) room.kickPlayer(player.id, "AFK — kicked after 2 min", false);
    }, 120000);
  };

  room.onPlayerChat = function(player, msg) {
    var m = msg.toLowerCase().trim();
    if (m === "!elo" || m === "!rank") {
      var p = getPlayer(player.name);
      room.sendChat("🎯 " + player.name + " | " + p.elo + " ELO | " + getRank(p.elo) + " | W:" + p.wins + " L:" + p.losses);
      return false;
    }
    if (m === "!stats") {
      var p = getPlayer(player.name);
      room.sendChat("📊 " + player.name + " | ELO:" + p.elo + " W:" + p.wins + " L:" + p.losses + " ⚽" + p.goals + " 🎁" + p.assists);
      return false;
    }
    if (m === "!score") { room.sendChat("🔴 " + scores.red + " — " + scores.blue + " 🔵"); return false; }
    if (m === "!top5" || m === "!top") {
      var sorted = Object.entries(playerDB).sort(function(a,b){ return b[1].elo-a[1].elo; }).slice(0,5);
      room.sendChat("🏆 TOP 5:");
      sorted.forEach(function(e,i){ room.sendChat("  "+(i+1)+". "+e[0]+" — "+e[1].elo+" ELO "+getRank(e[1].elo)); });
      return false;
    }
    if (m === "!help") {
      room.sendChat("📋 !elo | !stats | !score | !top5 | !help");
      return false;
    }
    if (player.admin) {
      if (m === "!start")   { room.startGame(); return false; }
      if (m === "!stop")    { room.stopGame();  return false; }
      if (m === "!balance") {
        var all = room.getPlayerList().filter(function(p){ return p.team!==0; });
        all.sort(function(a,b){ return getPlayer(b.name).elo-getPlayer(a.name).elo; });
        all.forEach(function(p,i){ room.setPlayerTeam(p.id, i%2===0?1:2); });
        room.sendChat("⚖️ Teams balanced by ELO!"); return false;
      }
      if (m.startsWith("!kick ")) {
        var t = room.getPlayerList().find(function(p){ return p.name.toLowerCase()===m.slice(6); });
        if (t) room.kickPlayer(t.id, "Kicked by admin", false); return false;
      }
      if (m.startsWith("!ban ")) {
        var t = room.getPlayerList().find(function(p){ return p.name.toLowerCase()===m.slice(5); });
        if (t) room.kickPlayer(t.id, "Banned by admin", true); return false;
      }
      if (m.startsWith("!admin ")) {
        var t = room.getPlayerList().find(function(p){ return p.name.toLowerCase()===m.slice(7); });
        if (t) { room.setPlayerAdmin(t.id, true); room.sendChat("✅ " + t.name + " is now admin"); } return false;
      }
    }
  };

  console.log("Room started!");
};

(async () => {
  const TOKEN = process.env.HAXBALL_TOKEN;
  if (!TOKEN) { console.error("HAXBALL_TOKEN not set!"); process.exit(1); }

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--use-fake-ui-for-media-stream'
    ],
    headless: "new"
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[ROOM]', msg.text()));
  page.on('pageerror', err => console.error('[ERROR]', err.message));

  console.log("🌐 Loading HaxBall headless...");
  await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('typeof HBInit !== "undefined"', { timeout: 30000 });

  console.log("⚽ Starting room...");
  await page.evaluate(ROOM_SCRIPT, TOKEN);

  try {
    await page.waitForFunction(
      'document.body.innerText.includes("haxball.com/play")',
      { timeout: 30000 }
    );
    const link = await page.evaluate(function() {
      var match = document.body.innerText.match(/https:\/\/www\.haxball\.com\/play\?c=\S+/);
      return match ? match[0] : null;
    });
    if (link) {
      roomLink = link;
      console.log("🔗 ROOM LINK: " + link);
    }
  } catch(e) {
    console.log("⚠️ Room is live — search '🇩🇿 Test Futsal Algeria' in HaxBall room list");
  }

  page.on('close', function() {
    setTimeout(function(){ process.exit(1); }, 3000);
  });
})();
