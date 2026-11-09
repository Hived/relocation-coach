#!/usr/bin/env bash
# Relocation Coach — start on macOS / Linux:  ./start.sh
set -e
cd "$(dirname "$0")/coach"
command -v node >/dev/null || { echo "Node.js is not installed: https://nodejs.org"; exit 1; }
command -v claude >/dev/null || echo "[warning] Claude Code not found — AI features need it (install, then run 'claude' once to log in)."
command -v dotnet >/dev/null || echo "[warning] .NET SDK not found — 'Run tests' needs .NET 8 SDK or newer."
[ -d node_modules ] || npm install
( sleep 4; (command -v open >/dev/null && open http://localhost:3000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) || true ) &
npm run dev
