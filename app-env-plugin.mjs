import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/**
 * Plugin to provide app environment variables via a dev-only endpoint.
 * Reads from .env.local and provides VITE_* prefixed vars for the app.
 */
export function appEnvPlugin() {
  return {
    name: "app:env-plugin",
    configResolved() {
      // No-op, just declare the plugin
    },
    configureServer(server) {
      server.middlewares.use("/__app-env", (req, res) => {
        const envPath = path.join(rootDir, ".env.local");
        const env = {};

        try {
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf-8");
            const lines = content.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith("#")) continue;

              const [key, ...valueParts] = trimmed.split("=");
              if (!key) continue;

              const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");
              if (key.startsWith("VITE_")) {
                env[key] = value;
              }
            }
          }
        } catch (err) {
          console.error("Error reading .env.local:", err);
        }

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(env));
      });
    },
  };
}
