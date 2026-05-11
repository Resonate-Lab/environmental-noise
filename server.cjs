const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const fp = path.join(root, urlPath === '/' ? 'index.html' : urlPath.slice(1));
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fp).slice(1);
    const ct = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end(d);
  });
}).listen(process.env.PORT || 3737, () => console.log('Server on ' + (process.env.PORT || 3737)));
