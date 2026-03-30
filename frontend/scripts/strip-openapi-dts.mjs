import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const p = join(__dirname, "..", "src", "lib", "api", "v1.d.ts");
let s = readFileSync(p, "utf8");
s = s.replace(/\/\*\*[\s\S]*?\*\/\s*/g, "");
s = s.replace(/\n{3,}/g, "\n\n");
writeFileSync(p, s.trimEnd() + "\n");
