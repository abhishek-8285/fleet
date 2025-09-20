#!/bin/bash

set -e

echo "Starting debug..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Function defined"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "Node.js installed: $NODE_VERSION"
else
    echo "Node.js not installed"
fi

echo "Node check complete"

# Check NPM
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "NPM installed: $NPM_VERSION"
else
    echo "NPM not installed"
fi

echo "NPM check complete"

# Check Go
if command_exists go; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo "Go installed: $GO_VERSION"
else
    echo "Go not installed"
fi

echo "Go check complete"

echo "All checks done successfully"
