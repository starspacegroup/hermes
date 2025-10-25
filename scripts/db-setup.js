#!/usr/bin/env node

/**
 * Database setup script for Cloudflare D1
 * Runs migrations and optionally seeds the database
 */

import { spawn } from "child_process";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const isPreview = args.includes("--preview");
const withSeed = args.includes("--seed");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command} ${args.join(" ")}`);

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

async function setup() {
  try {
    console.log("🔧 Setting up database...\n");

    // Run migrations
    const migrateArgs = ["run", "db:migrate"];
    if (isLocal) migrateArgs.push("--", "--local");
    if (isPreview) migrateArgs.push("--", "--preview --remote");

    await runCommand("npm", migrateArgs);

    // Optionally seed with sample data (use --seed flag)
    if (withSeed && (isLocal || isPreview)) {
      const seedArgs = ["run", "db:seed"];
      if (isLocal) seedArgs.push("--", "--local");
      if (isPreview) seedArgs.push("--", "--preview --remote");

      await runCommand("npm", seedArgs);
    }

    console.log("\n✅ Database setup completed successfully!");
    if (!withSeed && (isLocal || isPreview)) {
      console.log("💡 Tip: Run with --seed flag to populate with sample data");
    }
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setup();
