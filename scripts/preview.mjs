import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const PREVIEW_PORT = 8081;
const PREVIEW_PID_FILE = path.join(rootDir, ".preview.pid");

/**
 * Vite preview server lifecycle manager.
 * Allows starting/stopping the preview server independently.
 */

function getPid() {
  try {
    return parseInt(fs.readFileSync(PREVIEW_PID_FILE, "utf-8").trim(), 10);
  } catch {
    return null;
  }
}

function setPid(pid) {
  fs.writeFileSync(PREVIEW_PID_FILE, String(pid));
}

function clearPid() {
  try {
    fs.unlinkSync(PREVIEW_PID_FILE);
  } catch {
    // ignore
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const command = process.argv[2];

if (command === "restart") {
  const oldPid = getPid();
  if (oldPid && isProcessRunning(oldPid)) {
    try {
      process.kill(oldPid);
      console.log(`Killed old preview server (PID: ${oldPid})`);
    } catch (err) {
      console.error(`Failed to kill process ${oldPid}:`, err.message);
    }
  }
  clearPid();

  const proc = spawn("npm", ["run", "preview"], {
    stdio: "inherit",
    cwd: rootDir,
    detached: true,
  });
  setPid(proc.pid);
  console.log(`Started preview server (PID: ${proc.pid})`);
  proc.unref();
} else if (command === "stop") {
  const pid = getPid();
  if (pid && isProcessRunning(pid)) {
    try {
      process.kill(pid);
      console.log(`Stopped preview server (PID: ${pid})`);
    } catch (err) {
      console.error(`Failed to stop process ${pid}:`, err.message);
    }
  }
  clearPid();
} else {
  console.log("Usage: node scripts/preview.mjs [restart|stop]");
  process.exit(1);
}
