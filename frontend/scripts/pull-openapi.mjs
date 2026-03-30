import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "openapi", "openapi.snapshot.json");
const url =
  process.env.OPENAPI_URL ?? "http://localhost:3000/docs-json";

const res = await fetch(url);
if (!res.ok) {
  console.error(`Falha ao obter OpenAPI (${res.status}): ${url}`);
  process.exit(1);
}
const json = await res.json();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
console.log(`Escrito: ${outPath}`);
