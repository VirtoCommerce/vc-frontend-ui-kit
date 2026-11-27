import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import { uiKitVitePlugin } from "./vite/index.js";

export default defineConfig({
  // The package's own plugin with src/ as the local folder: tests run on the sources and check the plugin too.
  plugins: [uiKitVitePlugin({ local: "src" }), vue()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
