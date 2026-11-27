// Installs the packed package into a clean Vite + Vue app (smoke/) outside the repo, so nothing resolves from
// the repo's own node_modules, then type-checks and builds it. The app shadows one kit composable that kit
// components import; the bundle must carry the app's copy.
//
// Run `node scripts/pack.mjs` first: the tarball is packed from dist/ as it is.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

if (!existsSync(path.join(ROOT, "dist"))) {
  throw new Error("dist/ is missing: run `node scripts/pack.mjs` first");
}

const app = await mkdtemp(path.join(os.tmpdir(), "ui-kit-smoke-"));
await cp(path.join(ROOT, "smoke"), app, { recursive: true });

const [{ filename }] = JSON.parse(run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", app], ROOT));
console.log(`Smoke app: ${app}`);

run("npm", ["install", "--no-audit", "--no-fund", `./${filename}`], app);
console.log(run("npx", ["vue-tsc", "--noEmit"], app) || "vue-tsc: no errors");
console.log(run("npx", ["vite", "build"], app));

const assets = path.join(app, "dist/assets");
const files = await readdir(assets);
const read = async (ext) =>
  (await Promise.all(files.filter((file) => file.endsWith(ext)).map((file) => readFile(path.join(assets, file), "utf8")))).join("\n");
const [js, css] = await Promise.all([read(".js"), read(".css")]);

const checks = {
  "the app's useComponentId replaced the package's": js.includes("smoke-shadow-"),
  "VcButton styles are in the CSS": css.includes(".vc-button"),
  "Tailwind utilities from kit templates are in the CSS": css.includes(".flex"),
};

for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
}

if (Object.values(checks).includes(false)) {
  process.exit(1);
}
