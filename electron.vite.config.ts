import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const r = (value: string) => resolve(process.cwd(), value);

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs"
        }
      }
    },
    resolve: {
      alias: {
        "@main": r("src/main"),
        "@shared": r("src/shared")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@preload": r("src/preload"),
        "@shared": r("src/shared")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": r("src/renderer"),
        "@shared": r("src/shared")
      }
    },
    plugins: [react()]
  }
});
