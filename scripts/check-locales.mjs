// Fails when a locale in src/locales misses a key that en.json has.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve(import.meta.dirname, "../src/locales");
const SOURCE = "en.json";

function keys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

async function read(file) {
  return JSON.parse(await readFile(path.join(DIR, file), "utf8"));
}

const sourceKeys = keys(await read(SOURCE));
let missingCount = 0;

for (const file of (await readdir(DIR)).filter((name) => name.endsWith(".json") && name !== SOURCE)) {
  const present = new Set(keys(await read(file)));
  const missing = sourceKeys.filter((key) => !present.has(key));

  missingCount += missing.length;
  missing.forEach((key) => console.error(`${file}: missing ${key}`));
}

if (missingCount) {
  process.exit(1);
}

console.log(`All locales have the ${sourceKeys.length} keys of ${SOURCE}`);
