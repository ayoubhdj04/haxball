const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.get('/health', (req, res) => res.send('alive'));
app.listen(3000);

const HAXBALL_SCRIPT = `
var room = HBInit({
  roomName: "⚡ 3v3 Pro | ELO Ranked",
  maxPlayers: 16,
  public: true,
  noPlayer: true,
  token: "YOUR_TOKEN_HERE"
});

room.onPlayerJoin = function(p) {
  room.sendChat("👋 Welcome " + p.name + "!");
};

room.onTeamGoal = function(team) {
  room.sendChat(team === 1 ? "🔴 RED SCORES!" : "🔵 BLUE SCORES!");
};

console.log("Room started!");
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=WebRtcHideLocalIpsWithMdns'
    ]
  });

  const page = await browser.newPage();

  page.on('console', msg => console.log('ROOM:', msg.text()));

  await page.goto('https://www.haxball.com/headless', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  await page.waitForFunction('typeof HBInit !== "undefined"');
  await page.evaluate(HAXBALL_SCRIPT);

  console.log('✅ HaxBall room is running!');
})();
