import { uiKitPreset } from "@vc-frontend/ui-kit/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [uiKitPreset],
  content: [
    "./index.html",
    "./src/**/*.{vue,ts}",
    "./client-app/ui-kit/**/*.{vue,ts}",
    "./node_modules/@vc-frontend/ui-kit/dist/**/*.{vue,ts}",
  ],
} satisfies Config;
