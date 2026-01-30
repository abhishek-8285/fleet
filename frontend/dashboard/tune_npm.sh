#!/bin/bash

# Exit on error
set -e

echo "🚀 Tuning NPM for Pova Runner stability..."

# Increase fetch retry settings
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retries 10

# Increase timeout for individual requests
npm config set fetch-timeout 300000

# Limit max sockets to reduce network strain
npm config set maxsockets 3

# Clean cache to be sure
echo "🧹 Cleaning NPM cache..."
npm cache clean --force

echo "✅ NPM tuned successfully. You can now run 'npm install'."
