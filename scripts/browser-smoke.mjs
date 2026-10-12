#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/**
 * Browser smoke test runner.
 * Verifies that the app renders correctly in desktop and mobile viewports.
 * Outputs JSON report of render status and console errors.
 */

const IS_CI = process.env.CI === "true";
const DEV_PORT = 8080;
const BUILD_PORT = 8081;

const runTests = async () => {
  try {
    const { chromium } = await import("playwright");

    const browser = await chromium.launch();
    const contexts = [];
    const results = [];

    // Test 1: Dev server (desktop viewport)
    console.log("Testing dev server at http://127.0.0.1:8080 (desktop)...");
    try {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      contexts.push(context);
      const page = await context.newPage();

      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto(`http://127.0.0.1:${DEV_PORT}/`, { waitUntil: "networkidle" }).catch(() => {
        throw new Error("Could not connect to dev server");
      });

      const hasContent = (await page.locator("body").textContent()).length > 0;
      const screenshot = await page.screenshot();
      fs.writeFileSync(path.join(rootDir, "screenshots", "dev-desktop.png"), screenshot);

      results.push({
        name: "Dev Server (Desktop 1920x1080)",
        passed: hasContent && errors.length === 0,
        errors,
        screenshot: "dev-desktop.png",
      });
    } catch (err) {
      results.push({
        name: "Dev Server (Desktop 1920x1080)",
        passed: false,
        error: err.message,
      });
    }

    // Test 2: Dev server (mobile viewport)
    console.log("Testing dev server at http://127.0.0.1:8080 (mobile)...");
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      contexts.push(context);
      const page = await context.newPage();

      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto(`http://127.0.0.1:${DEV_PORT}/`, { waitUntil: "networkidle" }).catch(() => {
        throw new Error("Could not connect to dev server");
      });

      const hasContent = (await page.locator("body").textContent()).length > 0;
      const screenshot = await page.screenshot();
      fs.writeFileSync(path.join(rootDir, "screenshots", "dev-mobile.png"), screenshot);

      results.push({
        name: "Dev Server (Mobile 390x844)",
        passed: hasContent && errors.length === 0,
        errors,
        screenshot: "dev-mobile.png",
      });
    } catch (err) {
      results.push({
        name: "Dev Server (Mobile 390x844)",
        passed: false,
        error: err.message,
      });
    }

    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
    await browser.close();

    // Report
    const allPassed = results.every((r) => r.passed);
    console.log(JSON.stringify(results, null, 2));

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error running smoke tests:", error);
    process.exit(1);
  }
};

if (fs.existsSync(path.join(rootDir, "screenshots"))) {
  fs.rmSync(path.join(rootDir, "screenshots"), { recursive: true });
}
fs.mkdirSync(path.join(rootDir, "screenshots"), { recursive: true });

await runTests();
