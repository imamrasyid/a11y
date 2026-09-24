/**
 * Zero-dependency static file server for the e2e fixtures.
 * Serves the repository root over http://127.0.0.1:<port> — no network access
 * beyond loopback, and paths outside the repo root are refused.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.argv[2] || 4173);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
};

const server = http.createServer(function (req, res) {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(ROOT, rel);

    if (!file.startsWith(ROOT)) {
        res.writeHead(403).end('forbidden');
        return;
    }

    fs.readFile(file, function (err, buf) {
        if (err) {
            res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
            return;
        }
        res.writeHead(200, {
            'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
            'cache-control': 'no-store',
        }).end(buf);
    });
});

server.listen(PORT, '127.0.0.1', function () {
    console.log(`[a11y-test-server] http://127.0.0.1:${PORT}/test/fixtures/playground.html`);
    // `npm run demo` passes the page a human should get; the e2e run passes none.
    if (process.argv[3]) {
        console.log(`[a11y-test-server] http://127.0.0.1:${PORT}${process.argv[3]}`);
    }
});
