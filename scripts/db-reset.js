#!/usr/bin/env node

/**
 * Database reset script for Cloudflare D1
 * Deletes the local D1 database and optionally re-initializes it
 */

import { existsSync, rmSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const skipReinit = args.includes("--skip-reinit");

// Local D1 databases are stored in .wrangler/state/v3/d1/
const localDbPath = join(process.cwd(), ".wrangler", "state", "v3", "d1");

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

async function reset() {
  try {
    if (!isLocal) {
      console.error(
        "\n⚠️  This script only supports resetting the local database.",
      );
      console.error(
        "Please use --local flag to confirm you want to reset the local database.",
      );
      console.error(
        "\nFor production/preview databases, use the Cloudflare dashboard or wrangler CLI directly.",
      );
      process.exit(1);
    }

    console.log("🗑️  Resetting local D1 database...\n");

    // Check if local database exists
    if (existsSync(localDbPath)) {
      console.log(`Deleting local database at: ${localDbPath}`);
      rmSync(localDbPath, { recursive: true, force: true });
      console.log("✅ Local database deleted successfully!");
    } else {
      console.log("ℹ️  No local database found. Nothing to delete.");
    }

    // Re-initialize database unless skipped
    if (!skipReinit) {
      console.log("\n🔧 Re-initializing database...");
      await runCommand("npm", ["run", "db:setup:local"]);
      console.log("\n✅ Database reset and re-initialized successfully!");
    } else {
      console.log(
        "\n✅ Database reset completed! Run 'npm run db:setup:local' to re-initialize.",
      );
    }
  } catch (error) {
    console.error("\n❌ Reset failed:", error.message);
    process.exit(1);
  }
}

reset();
