import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_NAME = "@vc-frontend/ui-kit";
const PACKAGE_ROOT = fileURLToPath(new URL("../dist", import.meta.url));

const SCRIPT_SUFFIXES = ["", ".ts", ".vue", ".js", ".mjs", ".json", "/index.ts", "/index.js"];
const STYLE_SUFFIXES = [".scss", ".css", "/index.scss", "/_index.scss"];

// Pre-bundled for the dev server: Vite's dependency scanner doesn't crawl an excluded package, and CJS ones
// (vue-html-secure) fail without it. `<package> > <dep>` resolves a dependency the app may not list itself.
const PEER_DEPENDENCIES = ["vue", "vue-i18n", "vue-router", "@vueuse/core"];
const DEPENDENCIES = [
  "@floating-ui/vue",
  "@headlessui/vue",
  "@internationalized/date",
  "@vee-validate/yup",
  "@vueuse/components",
  "dompurify",
  "lodash-es",
  "marked",
  "maska",
  "maska/vue",
  "nouislider",
  "reka-ui",
  "swiper",
  "swiper/modules",
  "swiper/vue",
  "vee-validate",
  "vue-html-secure",
  "yup",
];

function isFile(file) {
  return statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;
}

function inside(root, file) {
  const rel = path.relative(root, file);

  return rel.startsWith("..") || path.isAbsolute(rel) ? undefined : rel;
}

/** The first of `<local>/<kitPath><suffix>`, then `<package>/<kitPath><suffix>`, that exists. */
function shadowFile(roots, kitPath, suffixes) {
  for (const root of roots) {
    for (const suffix of suffixes) {
      const file = path.join(root, kitPath + suffix);

      if (isFile(file)) {
        return file;
      }
    }
  }

  return undefined;
}

function resolveKitPath(roots, kitPath) {
  const partial = path.join(path.dirname(kitPath), `_${path.basename(kitPath)}`);

  return shadowFile(roots, kitPath, [...SCRIPT_SUFFIXES, ...STYLE_SUFFIXES]) ?? shadowFile(roots, partial, STYLE_SUFFIXES);
}

/** The path inside the kit an import points to, or undefined when it points elsewhere. */
function toKitPath(roots, source, importer) {
  if (source === PACKAGE_NAME || source.startsWith(`${PACKAGE_NAME}/`)) {
    return source.slice(PACKAGE_NAME.length + 1);
  }

  if (path.isAbsolute(source)) {
    return roots.map((root) => inside(root, source)).find((rel) => rel !== undefined);
  }

  if (source.startsWith(".") && importer) {
    const dir = path.dirname(importer.split("?")[0]);
    const kitDir = roots.map((root) => inside(root, dir)).find((rel) => rel !== undefined);

    return kitDir === undefined ? undefined : inside(roots[0], path.resolve(roots[0], kitDir, source));
  }

  return undefined;
}

function withQuery(file, query) {
  return file && query ? `${file}?${query}` : file;
}

/**
 * Serves `@vc-frontend/ui-kit` from its sources and lets the app shadow any of its files: a file at the same
 * path under `local` wins over the package's one, for imports from the app and from inside the package.
 *
 * @param {import("./index.d.ts").IUiKitVitePluginOptions} [options]
 * @returns {import("vite").Plugin}
 */
export function uiKitVitePlugin(options = {}) {
  let roots = [PACKAGE_ROOT];

  return {
    name: "vc-ui-kit",
    enforce: "pre",

    config(userConfig) {
      const projectRoot = path.resolve(userConfig.root ?? process.cwd());
      roots = [path.resolve(projectRoot, options.local ?? "client-app/ui-kit"), PACKAGE_ROOT];

      const iconDirs = roots.map((root) => path.join(root, "icons") + path.sep);
      const appInlineLimit = userConfig.build?.assetsInlineLimit;

      return {
        build: {
          // Icons are fetched by URL and used as CSS masks, so they stay files; other assets follow the app.
          assetsInlineLimit(file, content) {
            if (iconDirs.some((dir) => file.startsWith(dir))) {
              return false;
            }

            if (typeof appInlineLimit === "function") {
              return appInlineLimit(file, content);
            }

            return appInlineLimit === undefined ? undefined : content.length < appInlineLimit;
          },
        },
        resolve: {
          // An alias, not only `resolveId`: Vite resolves CSS `url()` and Sass `@use` through aliases alone.
          // Aliases from plugins go before the app's, so this one wins over a plain `@` alias.
          alias: [
            {
              find: /^@\/ui-kit(?=\/|$)/,
              replacement: "",
              customResolver(source) {
                const [bare, query] = source.split("?");

                return withQuery(resolveKitPath(roots, bare.replace(/^\//, "")), query);
              },
            },
          ],
        },
        optimizeDeps: {
          exclude: [PACKAGE_NAME, "@/ui-kit"],
          include: [...PEER_DEPENDENCIES, ...DEPENDENCIES.map((dep) => `${PACKAGE_NAME} > ${dep}`)],
        },
      };
    },

    resolveId(source, importer) {
      const [bare, query] = source.split("?");
      const kitPath = toKitPath(roots, bare, importer);

      return kitPath === undefined ? null : (withQuery(resolveKitPath(roots, kitPath), query) ?? null);
    },
  };
}
