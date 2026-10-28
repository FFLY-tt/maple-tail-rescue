// Minimal static file server for the exported site in out/, used by the Playwright tests.
// It mirrors what a static host does: /animals serves animals.html, /animals/mochi serves animals/mochi.html.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT ?? 4321);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath).replace(/\/+$/, "") || "/index";
  const candidates = [clean, `${clean}.html`, `${clean}/index.html`];
  for (const candidate of candidates) {
    const file = path.join(root, candidate);
    // Stay inside out/ even for a path like /../secret.
    if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

const notFoundPage = path.join(root, "404.html");

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  const file = resolveFile(pathname);
  const sent = file ?? (existsSync(notFoundPage) ? notFoundPage : null);
  if (!sent) {
    response.writeHead(404, { "content-type": "text/plain" });
    return response.end("Not found");
  }
  response.writeHead(file ? 200 : 404, { "content-type": TYPES[path.extname(sent)] ?? "application/octet-stream" });
  createReadStream(sent).pipe(response);
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}`));
