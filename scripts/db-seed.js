#!/usr/bin/env node

/**
 * Database seed script for Cloudflare D1
 * Seeds the database with initial data (for dev/preview environments only)
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const isPreview = args.includes("--preview");

const databaseName = "hermes-db";
const seedFile = join(__dirname, "seed-data.sql");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(" ")}`);

    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function seed() {
  try {
    // Don't seed production database
    if (!isLocal && !isPreview) {
      console.log(
        "⚠️  Seed is only allowed for local and preview environments",
      );
      console.log(
        "💡 Use --local or --preview flag to seed non-production environments",
      );
      process.exit(0);
    }

    console.log("🌱 Starting database seed...");

    const wranglerArgs = ["d1", "execute", databaseName];

    if (isLocal) {
      wranglerArgs.push("--local");
      console.log("📍 Environment: Local");
    } else if (isPreview) {
      wranglerArgs.push("--preview --remote");
      console.log("📍 Environment: Preview");
    }

    wranglerArgs.push(`--file=${seedFile}`);

    await runCommand("wrangler", wranglerArgs);

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
