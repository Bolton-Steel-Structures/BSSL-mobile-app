#!/bin/sh
# Rebuild the 3D model viewer bundle: vendor/model-viewer.js and vendor/web-ifc.wasm (bump sw.js VERSION afterwards).
set -e
cd "$(dirname "$0")"
npm install --no-audit --no-fund
npx esbuild viewer.src.js --bundle --minify --format=iife --platform=browser --outfile=../vendor/model-viewer.js
cp node_modules/web-ifc/web-ifc.wasm ../vendor/web-ifc.wasm
