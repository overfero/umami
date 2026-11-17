/** HTTP adapter for real authenticated native GET handlers; no DB scope or query substitution. */
import { createServer } from 'node:http';
import { once } from 'node:events';

export async function startSchemaServer() {
  const routes = new Map([
    ['metrics', (await import('@/app/api/websites/[websiteId]/metrics/route')).GET],
    ['event-data/properties', (await import('@/app/api/websites/[websiteId]/event-data/properties/route')).GET],
    ['session-data/properties', (await import('@/app/api/websites/[websiteId]/session-data/properties/route')).GET],
    ['stats', (await import('@/app/api/websites/[websiteId]/stats/route')).GET],
    ['people/count', (await import('@/app/api/websites/[websiteId]/people/count/route')).GET],
  ]);
  const server = createServer(async (incoming, outgoing) => {
    try {
      const url = new URL(incoming.url!, 'http://127.0.0.1');
      const match = url.pathname.match(/^\/api\/websites\/([^/]+)\/(.+)$/);
      const handler = match && routes.get(match[2]);
      if (incoming.method !== 'GET' || !handler) { outgoing.writeHead(404).end(); return; }
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(key, value);
      const response = await handler(new Request(url, { headers }), { params: Promise.resolve({ websiteId: match![1] }) });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch { outgoing.writeHead(500).end('Synthetic route adapter failed'); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing synthetic HTTP port');
  return { port: String(address.port), close: () => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  }) };
}
