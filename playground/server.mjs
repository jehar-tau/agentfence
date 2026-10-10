#!/usr/bin/env node
// Serves the AgentFence demo playground: five small static "sites" that each need their own
// hostname so AgentFence can tell them apart, without requiring any /etc/hosts edits. Chrome
// (and most browsers) resolve any *.localhost hostname to the loopback address on their own,
// so bank.localhost, work-chat.localhost, etc. all just work. See docs/decisions.md.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLAYGROUND_ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 5300;
const HOST = '127.0.0.1';

const SITES = ['bank', 'work-chat', 'client-a', 'client-b', 'public-form'];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function siteFromHost(hostHeader) {
  const hostname = (hostHeader ?? '').split(':')[0];
  const sub = hostname.split('.')[0];
  return SITES.includes(sub) ? sub : undefined;
}

/**
 * Resolves a request to a file under the playground directory, or undefined if the request
 * path is unsafe (contains `..`). An unrecognized host falls back to the landing page, so
 * visiting the bare server address is still useful.
 */
function resolveFilePath(hostHeader, pathname) {
  if (pathname.includes('..')) return undefined;
  const normalized = pathname === '/' ? '/index.html' : pathname;
  if (normalized.startsWith('/shared/')) return join(PLAYGROUND_ROOT, normalized);
  const site = siteFromHost(hostHeader);
  return join(PLAYGROUND_ROOT, site ?? '', normalized);
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://playground.invalid');
  const filePath = resolveFilePath(req.headers.host, decodeURIComponent(pathname));
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Bad request');
    return;
  }
  try {
    const data = await readFile(filePath);
    const contentType = CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType }).end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log('\nAgentFence demo playground running — synthetic data only:\n');
  console.log(`  http://localhost:${PORT}/            playground home`);
  for (const site of SITES) {
    console.log(`  http://${site}.localhost:${PORT}/`);
  }
  console.log('\nProtect each site from the AgentFence popup, then try a copy → paste.\n');
  console.log('Press Ctrl+C to stop.\n');
});
