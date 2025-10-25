#!/usr/bin/env node

/**
 * Database reset script for Cloudflare D1
 * Deletes the local D1 database and optionally re-initializes it
 */

import { existsSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const isRemote = args.includes("--remote");
const isPreview = args.includes("--preview");
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
    if (!isLocal && !isRemote) {
      console.error("\n⚠️  Please specify --local or --remote flag.");
      console.error(
        "Usage: node scripts/db-reset.js [--local|--remote] [--preview] [--skip-reinit]",
      );
      process.exit(1);
    }

    if (isRemote && !isPreview) {
      console.error("\n⚠️  Remote database reset requires --preview flag.");
      console.error(
        "For production databases, use the Cloudflare dashboard or wrangler CLI directly.",
      );
      process.exit(1);
    }

    if (isLocal) {
      await resetLocal();
    } else if (isRemote && isPreview) {
      await resetPreview();
    }
  } catch (error) {
    console.error("\n❌ Reset failed:", error.message);
    process.exit(1);
  }
}

async function resetLocal() {
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
}

async function resetPreview() {
  console.log("🗑️  Resetting preview D1 database...\n");

  console.log("📋 Clearing all table data...");

  // Create a temporary SQL file to clear all data (can't DROP tables via wrangler)
  const tempSqlPath = join(process.cwd(), ".wrangler", "temp-reset.sql");
  const clearCommands =
    `-- Clear all data from tables (order matters due to foreign keys)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM carts;
DELETE FROM products;
DELETE FROM users;
DELETE FROM sites;
`;

  // Write SQL to temp file
  writeFileSync(tempSqlPath, clearCommands, "utf-8");

  try {
    await runCommand("wrangler", [
      "d1",
      "execute",
      "hermes-db",
      "--remote",
      "--preview",
      "--file",
      tempSqlPath,
    ]);

    console.log("✅ Preview database data cleared successfully!");
  } catch (error) {
    console.log("⚠️  Some tables may not exist yet, continuing...");
  } finally {
    // Clean up temp file
    if (existsSync(tempSqlPath)) {
      rmSync(tempSqlPath);
    }
  }

  // Re-initialize database unless skipped
  if (!skipReinit) {
    console.log("\n🔧 Re-initializing database...");
    await runCommand("npm", ["run", "db:setup:preview"]);
    console.log("\n✅ Database reset and re-initialized successfully!");
  } else {
    console.log(
      "\n✅ Database reset completed! Run 'npm run db:setup:preview' to re-initialize.",
    );
  }
}

reset();
