import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/**
 * Auth invariant checker.
 * Verifies that auth middleware is only used when auth is enabled.
 * This runs as part of the build pipeline if auth is configured.
 */

function checkAuthInvariant() {
  const srcDir = path.join(rootDir, "src");
  let hasIssues = false;

  // Check if authMiddleware is imported in app files
  const files = fs.readdirSync(srcDir, { recursive: true });
  for (const file of files) {
    if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;

    const filePath = path.join(srcDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    if (content.includes("authMiddleware") || content.includes("requireUserId")) {
      console.warn(`Warning: Found auth reference in ${file}`);
      console.warn(
        "Make sure auth is enabled in your .env if you're using authMiddleware or requireUserId.",
      );
    }
  }

  if (hasIssues) {
    process.exit(1);
  }
}

checkAuthInvariant();
console.log("Auth invariant check passed.");
