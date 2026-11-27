import type { Plugin } from "vite";

export interface IUiKitVitePluginOptions {
  /**
   * Folder with the app's own copies of ui-kit files, relative to the Vite root.
   * A file there wins over the package's file at the same path.
   * @default "client-app/ui-kit"
   */
  local?: string;
}

export function uiKitVitePlugin(options?: IUiKitVitePluginOptions): Plugin;
