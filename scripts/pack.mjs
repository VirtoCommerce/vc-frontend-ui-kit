// Copies the kit sources into dist/, the folder the package ships.
//
// Usage: node scripts/pack.mjs [source folder, default src]
//
// - Tests, stories and test helpers stay out: they import vitest, @vue/test-utils and Storybook.
// - Relative imports between kit files become `@/ui-kit/<path>`. A consumer's shadowing resolver maps that
//   prefix to its own copy of a file first and to the package second, and TypeScript `paths` do the same.
//   A relative import would always resolve next to the importing file, so a shadowed file would be skipped.
// - Files that Node loads through the Tailwind config keep their relative imports: Node has no such alias.
// - Shims from shims/ go into dist/shims: global declarations the kit's sources need in any consumer.

import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.resolve(ROOT, process.argv[2] ?? "src");
const OUT = path.join(ROOT, "dist");

const SKIPPED_DIRS = new Set(["test-mocks", "mocks", "__snapshots__", "__tests__"]);
const SKIPPED_FILE = /\.(test|test-d|spec|stories)\.[cm]?[jt]sx?$/;
const REWRITTEN_FILE = /\.(ts|vue|scss|css)$/;
const NODE_LOADED = new Set(["tailwind-preset.ts", "constants/tailwind.ts"]);

// `from "./x"`, `import("./x")`, `import "./x"`, Sass `@use` / `@forward` / `@import "./x"`, CSS `url("./x")`.
// Template literals and `import.meta.glob(...)` don't match: Vite needs those relative.
const RELATIVE_SPECIFIER =
  /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|@(?:use|forward|import)\s+|\burl\(\s*)(["'])(\.\.?\/[^"']*)\2/g;

function rewrite(code, relFile) {
  const dir = path.posix.dirname(relFile);

  return code.replace(RELATIVE_SPECIFIER, (match, prefix, quote, specifier) => {
    const target = path.posix.normalize(path.posix.join(dir, specifier));

    if (target === ".." || target.startsWith("../")) {
      throw new Error(`${relFile}: "${specifier}" points outside the kit`);
    }

    return `${prefix}${quote}${target === "." ? "@/ui-kit" : `@/ui-kit/${target}`}${quote}`;
  });
}

async function copyTree(fromDir, relDir) {
  for (const entry of await readdir(fromDir, { withFileTypes: true })) {
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
    const from = path.join(fromDir, entry.name);
    const to = path.join(OUT, rel);

    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        await copyTree(from, rel);
      }
    } else if (!SKIPPED_FILE.test(entry.name)) {
      await mkdir(path.dirname(to), { recursive: true });

      if (REWRITTEN_FILE.test(entry.name) && !NODE_LOADED.has(rel)) {
        await writeFile(to, rewrite(await readFile(from, "utf8"), rel));
      } else {
        await cp(from, to);
      }
    }
  }
}

await rm(OUT, { recursive: true, force: true });
await copyTree(SRC, "");
await cp(path.join(ROOT, "shims"), path.join(OUT, "shims"), { recursive: true });

console.log(`Packed ${path.relative(ROOT, SRC)} into dist/`);
