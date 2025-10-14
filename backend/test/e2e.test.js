const http = require('http');
const axios = require('axios');
const path = require('path');
const { pathToFileURL } = require('url');

jest.setTimeout(120_000);

const PORT = 4013; // use unique port to avoid conflicts
const BASE = `http://127.0.0.1:${PORT}`;

function startLocalServer(getSpots, postSpot) {
  // Create a tiny HTTP server that adapts our handlers without ts/jest workers
  process.env.USE_INMEMORY = 'true';

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
  });

  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { validateStatus: () => true });
      if (res.status < 500) return; // 200..499 is acceptable
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server start timeout: ${lastErr?.message || 'no response'}`);
}

describe('E2E (node http wrapper)', () => {
  let server;
  let getSpots;
  let postSpot;

  beforeAll(async () => {
    // Build TS to JS so we can require dist handlers
    const { execSync } = require('child_process');
  execSync('npx tsc -p tsconfig.build.json --module commonjs', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  const distDir = path.resolve(__dirname, '..', 'dist-cjs');
  ({ handler: getSpots } = require(path.join(distDir, 'handlers/getSpots.js')));
  ({ handler: postSpot } = require(path.join(distDir, 'handlers/postSpot.js')));

  server = await startLocalServer(getSpots, postSpot);
    await waitForHttp(`${BASE}/spots`);
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /spots then GET /spots returns the created item', async () => {
    const payload = {
      type: 'ponton',
      name: 'E2E Spot',
      lat: 48.9,
      lng: 2.4,
      description: 'created by e2e',
      submittedBy: 'e2e-user',
      heightM: 1.1,
      lengthM: 8,
      access: 'tolere',
      address: 'Some quay'
    };

    const postRes = await axios.post(`${BASE}/spots`, payload, { validateStatus: () => true });
    expect(postRes.status).toBe(201);
    const created = postRes.data;
    expect(created.spotId).toBeDefined();
    expect(created.name).toBe('E2E Spot');

    const getRes = await axios.get(`${BASE}/spots`, { validateStatus: () => true });
    expect(getRes.status).toBe(200);
    const { items } = getRes.data;
    const found = items.find((s) => s.spotId === created.spotId);
    expect(found).toBeTruthy();
    expect(found.name).toBe('E2E Spot');
    expect(found.description).toBe('created by e2e');
  });
});
