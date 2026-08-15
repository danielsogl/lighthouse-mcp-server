import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AddressInfo } from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));

// A 1x1 transparent PNG, so the fixture's <img> resolves instead of 404ing.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Serves the e2e fixture over loopback so Lighthouse audits a page we control,
 * with no network dependency and no flakiness from a third-party site.
 */
export async function startFixtureServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const html = readFileSync(join(__dirname, "fixture.html"));

  const server: Server = createServer((req, res) => {
    if (req.url === "/pixel.png") {
      res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
      res.end(PIXEL);
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(html);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}
