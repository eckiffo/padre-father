import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4321;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs':  'application/javascript', '.json': 'application/json',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4':  'video/mp4',  '.webm': 'video/webm', '.ico': 'image/x-icon',
  '.txt':  'text/plain', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/' || url === '') url = '/index.html';

  const file = path.join(ROOT, url);
  const ext  = path.extname(file).toLowerCase();

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found: ' + url); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  ✝  $PADRE dev server running\n`);
  console.log(`  http://localhost:${PORT}/overlay.html`);
  console.log(`  http://localhost:${PORT}/candle-widget.html`);
  console.log(`\n  Press Ctrl+C to stop\n`);
});
