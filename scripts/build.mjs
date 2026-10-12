import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "dist");
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
for (const name of [
  "index.html",
  "404.html",
  "styles.css",
  "main.js",
  "assets",
  "robots.txt",
  "sitemap.xml",
  ".nojekyll",
]) {
  await cp(path.join(root, name), path.join(dest, name), { recursive: true });
}
console.log("Static production site is ready in dist/.");
