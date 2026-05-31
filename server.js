const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.get('/health', (req, res) => res.send('alive'));
app.listen(process.env.PORT || 3000, () => console.log('Health server running'));

// ============================================================
// FULL HAXBALL SCRIPT — injected into headless browser
// ============================================================
const HAXBALL_SCRIPT = (token) => `

// ============================================================
//  CONFIG
// ============================================================
var MAX_SCORE = 3;
var TIME_LIMIT = 7;
var TEAM_SIZE = 3;

// ============================================================
//  STADIUM MAP — Pro 3v3 field
// ============================================================
var STADIUM = JSON.stringify({
  "name":"Pro 3v3","width":420,"height":200,"spawnDistance":150,
  "bg":{"type":"grass","width":420,"height":200,"kickOffRadius":75,"cornerRadius":0},
  "vertexes":[
    {"x":-420,"y":-200,"trait":"ballArea"},{"x":-420,"y":200,"trait":"ballArea"},
    {"x":420,"y":200,"trait":"ballArea"},{"x":420,"y":-200,"trait":"ballArea"},
    {"x":-420,"y":-55,"trait":"goalNet"},{"x":-485,"y":-55,"trait":"goalNet"},
    {"x":-485,"y":55,"trait":"goalNet"},{"x":-420,"y":55,"trait":"goalNet"},
    {"x":420,"y":-55,"trait":"goalNet"},{"x":485,"y":-55,"trait":"goalNet"},
    {"x":485,"y":55,"trait":"goalNet"},{"x":420,"y":55,"trait":"goalNet"}
  ],
  "segments":[
    {"v0":0,"v1":1,"trait":"ballArea"},{"v0":1,"v1":2,"trait":"ballArea"},
    {"v0":2,"v1":3,"trait":"ballArea"},{"v0":3,"v1":0,"trait":"ballArea"},
    {"v0":4,"v1":5,"trait":"goalNet"},{"v0":5,"v1":6,"trait":"goalNet"},
    {"v0":6,"v1":7,"trait":"goalNet"},{"v0":8,"v1":9,"trait":"goalNet"},
    {"v0":9,"v1":10,"trait":"goalNet"},{"v0":10,"v1":11,"trait":"goalNet"}
  ],
  "goals":[
    {"p0":[-420,-55],"p1":[-420,55],"team":"red"},
    {"p0":[420,-55],"p1":[420,55],"team":"blue"}
  ],
  "discs":[{"pos":[0,0],"trait":"ballDefault"}],
  "planes":[
    {"normal":[0,1],"dist":-200,"bCoeff":0.2},
    {"normal":[0,-1],"dist":-200,"bCoeff":0.2}
  ],
  "traits":{
    "ballArea":{"vis":false,"bCoeff":1,"cMask":["ball"]},
    "goalNet":{"vis":true,"bCoeff":0.1,"cMask":["ball"],"color":"FFFFFF"},
    "ballDefault":{"radius":10,"bCoeff":0.4,"invMass":1.5,"damping":0.99}
  },
  "playerPhysics":{"bCoeff":0,"acceleration":0.11,"turning":0.0035,"kicking":0.083,"kickingBCoeff":0.5,"kickStrength":5,"tackleRadius":16},
  "ballPhysics":"disc0",
  "redSpawnPoints":[[-300,0],[-220,-70],[-220,70]],
  "blueSpawnPoints":[[300,0],[220,-70],[220,70]]
});

// ============================================================
//  ROOM INIT
// ============================================================
var room = HBInit({
  roomName: "⚡ 3v3 Pro | ELO Ranked | EU",
  maxPlayers: 16,
  public: true,
  noPlayer: true,
  token: "${token}",
  geo: { code: "EU", lat: 48.8, lon: 2.3 }
});

room.setCustomStadium(STADIUM);
room.setScoreLimit(MAX_SCORE);
room.setTimeLimit(TIME_LIMIT);

// ============================================================
//  ELO SYSTEM
// ============================================================
var playerDB = {};

function getPlayer(name) {
  if (!playerDB[name]) playerDB[name] = { elo: 1000, wins: 0, losses: 0, goals: 0, assists: 0, draws: 0 };
  return playerDB[name];
}

function calcElo(winnerElo, loserElo, K) {
  var expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(K * (1 - expected));
}

function updateElo(winners, losers, scoreDiff) {
  var K = 32;
  var bonus = Math.min(1 + scoreDiff * 0.08, 1.4);
  var avgWinElo = winners.reduce(function(s,n){ return s + getPlayer(n).elo; }, 0) / winners.length;
  var avgLosElo = losers.reduce(function(s,n){ return s + getPlayer(n).elo; }, 0) / losers.length;

  winners.forEach(function(name) {
    var p = getPlayer(name);
    var gain = Math.round(calcElo(avgWinElo, avgLosElo, K) * bonus);
    p.elo += gain;
    p.wins++;
    p._eloChange = "+" + gain;
  });
  losers.forEach(function(name) {
    var p = getPlayer(name);
    var loss = calcElo(avgWinElo, avgLosElo, K);
    p.elo = Math.max(100, p.elo - loss);
    p.losses++;
    p._eloChange = "-" + loss;
  });
}

function getRank(elo) {
  if (elo >= 2000) return "🏆 LEGEND";
  if (elo >= 1700) return "💎 Diamond";
  if (elo >= 1500) return "🥇 Gold";
  if (elo >= 1300) return "🥈 Silver";
  if (elo >= 1100) return "🥉 Bronze";
  return "⚪ Iron";
}

// ============================================================
//  COMMENTARY
// ============================================================
var lines = {
  goal: [
    "🔥 GOOOOOAL! What an absolute ROCKET!",
    "💥 GET IN THERE! Unstoppable finish!",
    "⚽ GOAL! The keeper had no chance!",
    "😱 SENSATIONAL! That's a worldie!",
    "🚀 TOP CORNER! Pure class!",
    "🎯 Clinical. Absolutely clinical.",
    "⚡ THUNDERBOLT! The net is BULGING!",
    "🌟 MASTERPIECE! The crowd goes wild!"
  ],
  ownGoal: [
    "😬 OWN GOAL! Absolute nightmare!",
    "💀 He's put it in his own net... heartbreaking!",
    "😭 OWN GOAL! The crowd falls silent...",
    "🤦 That's one he'll want to forget!"
  ],
  redLead: [
    "🔴 Red are pulling away! Blue need to respond!",
    "🔴 Red are in control here!"
  ],
  blueLead: [
    "🔵 Blue are dominating! Red are on the ropes!",
    "🔵 Blue look dangerous tonight!"
  ],
  tied: [
    "⚖️ All level again! This one is far from over!",
    "🔥 Back to square one! What a match!",
    "😤 The equalizer! Tension is sky high!"
  ],
  matchPoint: [
    "🚨 MATCH POINT! One more goal wins it!",
    "💣 ONE GOAL AWAY from victory! Nerves of steel needed!",
    "😰 This could be the last goal of the game..."
  ],
  redWin: [
    "🔴 RED TEAM WINS! Dominant from start to finish!",
    "🔴 Red takes it! Incredible performance!",
    "🔴 CHAMPIONS! Red team are unstoppable tonight!"
  ],
  blueWin: [
    "🔵 BLUE TEAM WINS! What a display of football!",
    "🔵 Blue clinches it! Outstanding teamwork!",
    "🔵 BLUE ARE VICTORIOUS! Spectacular match!"
  ],
  draw: [
    "🤝 It ends ALL SQUARE! Both teams gave everything!",
    "⚖️ A draw! Neither side could find the winner!",
    "😤 STALEMATE! Honours even after a thrilling match!"
  ],
  kickoff: [
    "🎙️ Welcome to the arena! Let the battle begin!",
    "🎺 KICKOFF! May the best team win tonight!",
    "⚡ The match is LIVE! 3v3 action starts NOW!"
  ],
  save: [
    "🧤 INCREDIBLE SAVE! He's denied them!",
    "🛡️ What a stop! The keeper is on FIRE!",
    "😤 Kept out! Superb goalkeeping!"
  ]
};

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function say(type) { room.sendChat(rnd(lines[type])); }
function announce(msg) { room.sendAnnouncement(msg, null, 0xFFFFFF, "bold", 1); }

// ============================================================
//  GAME STATE
// ============================================================
var scores = { red: 0, blue: 0 };
var gameRunning = false;
var lastTouched = null;
var secondLastTouched = null;
var gameStartPlayers = [];
var goalScorer = null;
var statsThisGame = {}; // name -> {goals, assists}
var idleTimers = {};
var autoStartTimer = null;

function statAdd(name, field) {
  if (!statsThisGame[name]) statsThisGame[name] = { goals: 0, assists: 0 };
  statsThisGame[name][field]++;
}

function getTeam(id) { return room.getPlayerList().filter(function(p){ return p.team === id; }); }

// ============================================================
//  EVENTS
// ============================================================
room.onPlayerJoin = function(player) {
  var p = getPlayer(player.name);
  room.sendChat("👋 Welcome " + player.name + " | " + getRank(p.elo) + " [" + p.elo + " ELO]");
  room.sendChat("📋 !elo  !stats  !top5  !score  !help");
  if (room.getPlayerList().length === 1) room.setPlayerAdmin(player.id, true);
};

room.onPlayerLeave = function(player) {
  clearTimeout(idleTimers[player.id]);
  if (gameRunning) {
    room.sendChat("⚠️ " + player.name + " left the game!");
    checkTeamSize();
  }
};

room.onGameStart = function() {
  scores = { red: 0, blue: 0 };
  lastTouched = null;
  secondLastTouched = null;
  statsThisGame = {};
  gameRunning = true;
  gameStartPlayers = room.getPlayerList().filter(function(p){ return p.team !== 0; });
  setTimeout(function(){ say("kickoff"); showTeamElo(); }, 1000);
};

room.onGameStop = function() {
  gameRunning = false;
};

room.onPlayerBallKick = function(player) {
  secondLastTouched = lastTouched;
  lastTouched = player;
};

room.onTeamGoal = function(team) {
  // Commentary
  say("goal");

  // Track scorer & assist
  if (lastTouched) {
    var scorerName = lastTouched.name;
    if (lastTouched.team === team) {
      statAdd(scorerName, "goals");
      getPlayer(scorerName).goals++;
      goalScorer = scorerName;
      room.sendChat("⚽ GOAL by " + scorerName + "!");
    } else {
      // own goal
      say("ownGoal");
      goalScorer = null;
    }
    if (secondLastTouched && secondLastTouched.name !== scorerName && secondLastTouched.team === team) {
      statAdd(secondLastTouched.name, "assists");
      getPlayer(secondLastTouched.name).assists++;
      room.sendChat("🎁 Assist: " + secondLastTouched.name);
    }
  }

  // Update score
  if (team === 1) scores.red++;
  else scores.blue++;

  room.sendChat("🔴 " + scores.red + " — " + scores.blue + " 🔵");

  // Situational commentary
  setTimeout(function() {
    if (scores.red === scores.blue) say("tied");
    else if (scores.red > scores.blue && team === 1) say("redLead");
    else if (scores.blue > scores.red && team === 2) say("blueLead");

    // Match point
    if (scores.red === MAX_SCORE - 1 || scores.blue === MAX_SCORE - 1) say("matchPoint");

    // End game
    if (scores.red >= MAX_SCORE || scores.blue >= MAX_SCORE) {
      setTimeout(endGame, 1500);
    }
  }, 1200);
};

function endGame() {
  gameRunning = false;
  var redNames = gameStartPlayers.filter(function(p){ return p.team === 1; }).map(function(p){ return p.name; });
  var blueNames = gameStartPlayers.filter(function(p){ return p.team === 2; }).map(function(p){ return p.name; });

  var winner = scores.red > scores.blue ? "red" : scores.blue > scores.red ? "blue" : "draw";

  if (winner === "red") { say("redWin"); updateElo(redNames, blueNames, scores.red - scores.blue); }
  else if (winner === "blue") { say("blueWin"); updateElo(blueNames, redNames, scores.blue - scores.red); }
  else { say("draw"); }

  // Show match stats
  setTimeout(function() {
    room.sendChat("━━━━━━━━━━━━━━━━━━━━━");
    room.sendChat("📊 MATCH REPORT — 🔴 " + scores.red + " vs " + scores.blue + " 🔵");
    room.sendChat("━━━━━━━━━━━━━━━━━━━━━");
    var allPlayers = redNames.concat(blueNames);
    allPlayers.forEach(function(name) {
      var s = statsThisGame[name] || { goals: 0, assists: 0 };
      var p = getPlayer(name);
      var change = p._eloChange || "0";
      room.sendChat("  " + name + " | G:" + s.goals + " A:" + s.assists + " | ELO: " + p.elo + " (" + change + ") " + getRank(p.elo));
    });
    room.sendChat("━━━━━━━━━━━━━━━━━━━━━");

    room.stopGame();
    setTimeout(function() { tryAutoStart(); }, 6000);
  }, 2000);
}

// ============================================================
//  AUTO START
// ============================================================
function tryAutoStart() {
  var red = getTeam(1);
  var blue = getTeam(2);
  if (red.length >= TEAM_SIZE && blue.length >= TEAM_SIZE && !gameRunning) {
    room.sendChat("✅ Teams ready! Starting in 5 seconds...");
    showTeamElo();
    clearTimeout(autoStartTimer);
    autoStartTimer = setTimeout(function() { room.startGame(); }, 5000);
  }
}

function showTeamElo() {
  var red = getTeam(1);
  var blue = getTeam(2);
  if (!red.length || !blue.length) return;
  var redAvg = Math.round(red.reduce(function(s,p){ return s + getPlayer(p.name).elo; }, 0) / red.length);
  var blueAvg = Math.round(blue.reduce(function(s,p){ return s + getPlayer(p.name).elo; }, 0) / blue.length);
  room.sendChat("🔴 Red avg ELO: " + redAvg + " | 🔵 Blue avg ELO: " + blueAvg);
}

function checkTeamSize() {
  var red = getTeam(1).length;
  var blue = getTeam(2).length;
  if (gameRunning && (red < 1 || blue < 1)) {
    room.sendChat("⚠️ Not enough players — stopping game.");
    room.stopGame();
  }
}

room.onPlayerTeamChange = function() {
  if (!gameRunning) tryAutoStart();
};

// ============================================================
//  IDLE KICK
// ============================================================
room.onPlayerActivity = function(player) {
  clearTimeout(idleTimers[player.id]);
  idleTimers[player.id] = setTimeout(function() {
    if (player.team !== 0) {
      room.kickPlayer(player.id, "Kicked: AFK 2 minutes", false);
    }
  }, 120000);
};

// ============================================================
//  CHAT COMMANDS
// ============================================================
room.onPlayerChat = function(player, msg) {
  var m = msg.toLowerCase().trim();

  if (m === "!elo" || m === "!rank") {
    var p = getPlayer(player.name);
    room.sendChat("🎯 " + player.name + " — " + p.elo + " ELO | " + getRank(p.elo) + " | W:" + p.wins + " L:" + p.losses);
    return false;
  }
  if (m === "!stats") {
    var p = getPlayer(player.name);
    room.sendChat("📊 " + player.name + " | ELO:" + p.elo + " W:" + p.wins + " L:" + p.losses + " Goals:" + p.goals + " Assists:" + p.assists);
    return false;
  }
  if (m === "!score") {
    room.sendChat("🔴 Red " + scores.red + " — " + scores.blue + " Blue 🔵");
    return false;
  }
  if (m === "!top5" || m === "!top") {
    var sorted = Object.entries(playerDB).sort(function(a,b){ return b[1].elo - a[1].elo; }).slice(0,5);
    room.sendChat("🏆 TOP 5 PLAYERS:");
    sorted.forEach(function(entry, i) {
      room.sendChat("  " + (i+1) + ". " + entry[0] + " — " + entry[1].elo + " ELO " + getRank(entry[1].elo));
    });
    return false;
  }
  if (m === "!help") {
    room.sendChat("📋 Commands: !elo | !stats | !score | !top5 | !help");
    return false;
  }

  // Admin commands
  if (player.admin) {
    if (m === "!start") { room.startGame(); return false; }
    if (m === "!stop") { room.stopGame(); return false; }
    if (m === "!balance") {
      var all = room.getPlayerList().filter(function(p){ return p.team !== 0; });
      all.sort(function(a,b){ return getPlayer(b.name).elo - getPlayer(a.name).elo; });
      all.forEach(function(p,i){ room.setPlayerTeam(p.id, i%2===0 ? 1 : 2); });
      room.sendChat("⚖️ Teams balanced by ELO!");
      return false;
    }
    if (m.startsWith("!kick ")) {
      var target = m.slice(6);
      var found = room.getPlayerList().find(function(p){ return p.name.toLowerCase() === target; });
      if (found) room.kickPlayer(found.id, "Kicked by admin", false);
      return false;
    }
    if (m.startsWith("!ban ")) {
      var target = m.slice(5);
      var found = room.getPlayerList().find(function(p){ return p.name.toLowerCase() === target; });
      if (found) room.kickPlayer(found.id, "Banned by admin", true);
      return false;
    }
  }
};

console.log("✅ Room script loaded successfully!");
`;

// ============================================================
// PUPPETEER LAUNCHER
// ============================================================
(async () => {
  const TOKEN = process.env.HAXBALL_TOKEN;
  if (!TOKEN) { console.error("❌ HAXBALL_TOKEN env variable not set!"); process.exit(1); }

  console.log("🚀 Launching browser...");

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--use-fake-ui-for-media-stream'
    ],
    headless: true
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[ROOM]', msg.text()));
  page.on('pageerror', err => console.error('[ERROR]', err));

  console.log("🌐 Loading HaxBall headless...");
  await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('typeof HBInit !== "undefined"', { timeout: 30000 });

  console.log("⚽ Injecting room script...");
  await page.evaluate(HAXBALL_SCRIPT(TOKEN));

  console.log("✅ HaxBall 3v3 Pro room is LIVE!");

  // Auto-restart if page crashes
  page.on('close', async () => {
    console.log("⚠️ Page closed — restarting in 10 seconds...");
    setTimeout(() => process.exit(1), 10000); // Render will restart the service
  });
})();
