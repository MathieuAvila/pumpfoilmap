/* Simple E2E runner without Jest to avoid worker/ESM issues */
const http = require('http');
const path = require('path');
const axios = require('axios');

// Force in-memory repository before loading handlers
process.env.USE_INMEMORY = 'true';

const PORT = 4020;
const BASE = `http://127.0.0.1:${PORT}`;

function startLocalServer(getSpots, postSpot) {

  const server = http.createServer(async (req, res) => {
    const method = req.method || 'GET';
    const urlObj = new URL(req.url || '/', BASE);
    res.setHeader('content-type', 'application/json');

    const toEvent = (body) => ({
      version: '2.0',
      routeKey: `${method} ${urlObj.pathname}`,
      rawPath: urlObj.pathname,
      rawQueryString: urlObj.searchParams.toString(),
      headers: {},
      requestContext: {},
      isBase64Encoded: false,
      queryStringParameters: Object.fromEntries(urlObj.searchParams.entries()),
      body: body ? JSON.stringify(body) : undefined
    });

    try {
      if (method === 'GET' && urlObj.pathname === '/spots') {
        const out = await getSpots(toEvent());
        res.statusCode = out.statusCode || 200;
        if (out.headers) {
          for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, String(v));
        }
        res.end(out.body);
        return;
      }

      if (method === 'POST' && urlObj.pathname === '/spots') {
        const chunks = [];
        for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
        const raw = Buffer.concat(chunks).toString('utf8');
        const json = raw ? JSON.parse(raw) : undefined;
        const out = await postSpot(toEvent(json));
        res.statusCode = out.statusCode || 200;
        if (out.headers) {
          for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, String(v));
        }
        res.end(out.body);
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not found' }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server error', error: String((err && err.message) || err) }));
    }
  });

  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { validateStatus: () => true });
      if (res.status < 500) return; // 200..499 is ok
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server start timeout: ${lastErr?.message || 'no response'}`);
}

(async () => {
  let server;
  try {
    // Build TS to CJS so we can require dist handlers
    const { execSync } = require('child_process');
    execSync('npx tsc -p tsconfig.build.json', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

  const distDir = path.resolve(__dirname, '..', 'dist-cjs');
  const { handler: getSpots } = require(path.join(distDir, 'handlers/getSpots.js'));
  const { handler: postSpot } = require(path.join(distDir, 'handlers/postSpot.js'));

    server = await startLocalServer(getSpots, postSpot);
    await waitForHttp(`${BASE}/spots`);

    // POST
    const payload = { name: 'E2E Spot', lat: 48.9, lng: 2.4, description: 'created by e2e' };
    const postRes = await axios.post(`${BASE}/spots`, payload, { validateStatus: () => true });
    if (postRes.status !== 201) throw new Error(`POST /spots expected 201, got ${postRes.status}`);
    const created = postRes.data;
    if (!created || !created.spotId) throw new Error('POST /spots returned invalid body');

    // GET
    const getRes = await axios.get(`${BASE}/spots`, { validateStatus: () => true });
    if (getRes.status !== 200) throw new Error(`GET /spots expected 200, got ${getRes.status}`);
    const { items } = getRes.data || {};
    if (!Array.isArray(items) || !items.find((s) => s.spotId === created.spotId)) {
      throw new Error('GET /spots does not contain created spot');
    }

    console.log('E2E PASS');
  } catch (err) {
    console.error('E2E FAIL:', (err && err.stack) || err);
    process.exitCode = 1;
  } finally {
    if (server && server.close) await new Promise((r) => server.close(() => r()));
  }
})();
