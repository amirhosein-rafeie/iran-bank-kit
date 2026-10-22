import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../demo-dist/", import.meta.url);
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/sitemap.xml", ["sitemap.xml", "application/xml; charset=utf-8"]],
  ["/fonts/Vazir-Variable.woff2", ["fonts/Vazir-Variable.woff2", "font/woff2"]],
  ...["core", "banks", "logos"].map(name => [`/lib/${name}.js`, [`lib/${name}.js`, "text/javascript; charset=utf-8"]]),
]);

export function createDemoServer() {
  return createServer(async (request, response) => {
    const file = files.get(request.url?.split("?")[0]);
    if (!file || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(404).end("Not found");
      return;
    }
    try {
      const body = await readFile(new URL(file[0], root));
      response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(500).end("Build the demo first: npm run demo:build");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createDemoServer();
  server.on("error", error => { console.error(error.message); process.exitCode = 1; });
  server.listen(4173, "127.0.0.1", () => console.log("Demo: http://127.0.0.1:4173"));
}
