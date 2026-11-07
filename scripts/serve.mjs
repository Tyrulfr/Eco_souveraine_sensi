// Petit serveur statique local (aucune dépendance). Usage : npm run serve [-- dossier] [-- --port 8080]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const args = process.argv.slice(2);
const iPort = args.indexOf("--port");
const port = iPort >= 0 ? Number(args[iPort + 1]) : 8080;
const dossier = resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--port") ?? ".");

/** @type {Record<string, string>} */
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  const chemin = normalize(decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/"));
  let fichier = join(dossier, chemin);
  if (!fichier.startsWith(dossier)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(fichier)).isDirectory()) fichier = join(fichier, "index.html");
    const corps = await readFile(fichier);
    res.writeHead(200, { "Content-Type": TYPES[extname(fichier)] ?? "application/octet-stream" }).end(corps);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Introuvable");
  }
}).listen(port, () => console.log(`Serveur : http://localhost:${port}/ (dossier ${dossier})`));
