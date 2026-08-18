import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { smartClientPlugin } from "@osdk/vite-plugin-superrepo";
import { statusReporterPlugin } from "@osdk/vite-plugin-status-reporter";

function seedReloadPlugin(): Plugin {
  const seedData = path.resolve(
    __dirname,
    "../ontology/osdk-output/seed-data.json",
  );

  return {
    name: "seed-reload",
    configureServer(server) {
      function onChange(file: string): void {
        if (path.resolve(file) !== seedData) return;
        server.config.logger.info("[seed-reload] re-seeded, reloading");
        server.hot.send({ type: "full-reload" });
      }

      server.watcher.add(seedData);
      server.watcher.on("add", onChange);
      server.watcher.on("change", onChange);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    smartClientPlugin(),
    statusReporterPlugin({ service: "APP" }),
    seedReloadPlugin(),
  ],
  base:
    process.env.NODE_ENV === "development"
      ? process.env.DEV_SERVER_BASE_PATH
      : undefined,
  resolve: {
    alias: {
      "@ontology/sdk": path.resolve(
        __dirname,
        "../ontology/osdk-output/ontology/dist",
      ),
    },
  },
  optimizeDeps: {
    include: ["@osdk/vite-plugin-superrepo/osdkClient"],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    host: process.env.DEV_SERVER_HOST,
    allowedHosts:
      process.env.DEV_SERVER_DOMAIN != null
        ? [process.env.DEV_SERVER_DOMAIN]
        : undefined,
    port: Number(process.env.DEV_SERVER_PORT ?? 8080),
  },
});
