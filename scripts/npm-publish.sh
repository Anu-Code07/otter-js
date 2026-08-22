#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Error: NPM_TOKEN is not set."
  echo "Add an Automation token in Cursor → Cloud Agent → Environment secrets as NPM_TOKEN."
  exit 1
fi

npmrc="${HOME}/.npmrc"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${npmrc}"
chmod 600 "${npmrc}"

echo "Publishing $(node -p "require('./package.json').version") as $(npm whoami)..."
npm publish --access public
