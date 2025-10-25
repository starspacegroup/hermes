#!/usr/bin/env node

/**
 * Cloudflare Pages preview build script
 * Detects preview environment and sets up database before building
 */

import { spawn } from 'child_process';

// Cloudflare Pages sets CF_PAGES_BRANCH for the branch name
// and CF_PAGES for all Pages builds
const isCloudflarePages = process.env.CF_PAGES === '1';
const branch = process.env.CF_PAGES_BRANCH || '';
const isProduction = branch === 'main' || branch === 'master';
const isPreview = isCloudflarePages && !isProduction;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function build() {
  try {
    console.log('🚀 Starting Cloudflare Pages build...');
    console.log(`📍 Environment: ${isPreview ? 'PREVIEW' : isProduction ? 'PRODUCTION' : 'LOCAL'}`);
    console.log(`🌿 Branch: ${branch || 'unknown'}\n`);

    // For preview environments, reset and setup database with seed data
    if (isPreview) {
      console.log('🔄 Preview environment detected - Setting up fresh database...\n');

      // Reset preview database (wipe all data)
      console.log('1️⃣  Wiping preview database...');
      await runCommand('npm', ['run', 'db:reset:preview']);

      // Setup database with migrations and seed data
      console.log('\n2️⃣  Running migrations and seeding...');
      await runCommand('npm', ['run', 'db:setup:preview:seed']);

      console.log('\n✅ Preview database ready!\n');
    } else if (isProduction) {
      console.log('🏭 Production environment - Running migrations only...\n');
      await runCommand('npm', ['run', 'db:migrate']);
      console.log('\n✅ Production database migrations complete!\n');
    } else {
      console.log('💻 Local build - Skipping database setup...\n');
    }

    // Build the application
    console.log('📦 Building application...\n');
    await runCommand('npm', ['run', 'build']);

    console.log('\n🎉 Build completed successfully!');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
