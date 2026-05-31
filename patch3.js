const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix the express routes - the roomLink variable is being used as a path
content = content.replace(
  `const app = express();
let roomLink = 'Room still starting...';

app.get('/health', (req, res) => res.send('alive'));
app.get('/', (req, res) => res.send(\`
  <html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff">
  <h1>⚽ HaxBall 3v3 Pro Room</h1>
  <p style="font-size:20px">Room Link: <a href="${roomLink}" style="color:#4af" target="_blank">${roomLink}</a></p>
  <p style="color:#aaa">Share this link with your friends!</p>
  </body></html>
\`));
app.listen(process.env.PORT || 3000, () => console.log('Health server running'));`,
  `const app = express();
let roomLink = 'Room still starting...';

app.get('/health', (req, res) => res.send('alive'));
app.get('/', (req, res) => {
  res.send(\`
  <html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff">
  <h1>⚽ HaxBall 3v3 Pro Room</h1>
  <p style="font-size:20px">Room Link: <a href="\` + roomLink + \`" style="color:#4af" target="_blank">\` + roomLink + \`</a></p>
  <p style="color:#aaa">Share this link with your friends!</p>
  <script>if(document.body.innerText.includes('still starting')) setTimeout(()=>location.reload(),5000);</script>
  </body></html>
  \`);
});
app.listen(process.env.PORT || 3000, () => console.log('Health server running'));`
);

fs.writeFileSync('server.js', content);
console.log('Patched!');
