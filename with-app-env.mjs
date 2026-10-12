import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const envPath = path.join(rootDir, ".env.local");

function loadViteEnv() {
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key.startsWith("VITE_")) {
      process.env[key] = value;
    }
  }
}

function runProcess() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Usage: node scripts/with-app-env.mjs <command> [args...]");
    process.exit(1);
  }

  const [command, ...rest] = args;
  const isWin = process.platform === "win32";
  const binary = isWin ? "npx.cmd" : "npx";

  const child = spawn(binary, [command, ...rest], {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error("Failed to run app command:", err);
    process.exit(1);
  });
}

loadViteEnv();
runProcess();
