#!/usr/bin/env bash
# OpenArcade Launcher — setup, build, and start the hub (macOS / Linux).
# Run from repo root: ./start.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB="$ROOT/hub"
APP="$ROOT/hub/app"

# Colors (subtle)
CYAN='\033[0;36m'
GRAY='\033[0;90m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "  ${CYAN}$1${NC}"
  [ -n "$2" ] && echo -e "  ${GRAY}$2${NC}"
  echo ""
}

print_step() {
  echo -e "  ${GRAY}[$1/$2]${NC} ${WHITE}$3${NC}"
}

print_ok() {
  echo -e "        ${GRAY}$1${NC}"
}

print_fail() {
  echo ""
  echo -e "  ${RED}---${NC}"
  echo -e "  ${RED}$1${NC}"
  [ -n "$2" ] && echo -e "  ${GRAY}$2${NC}"
  echo -e "  ${RED}---${NC}"
  echo ""
  exit 1
}

get_lan_ip() {
  local lan=""
  if command -v ipconfig &>/dev/null; then
    lan="$(ipconfig getifaddr en0 2>/dev/null)" || lan="$(ipconfig getifaddr en1 2>/dev/null)"
  fi
  if [ -z "$lan" ] && command -v hostname &>/dev/null; then
    lan="$(hostname -I 2>/dev/null | awk '{print $1; exit}')"
  fi
  if [ -z "$lan" ] && command -v ip &>/dev/null; then
    lan="$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
  fi
  echo "$lan"
}

get_active_game() {
  local state_path="$ROOT/hub/data/state.json"
  if [ ! -f "$state_path" ]; then
    echo "unknown"
    return
  fi
  if command -v node &>/dev/null; then
    node -e "
      try {
        const fs = require('fs');
        const p = process.argv[1];
        const s = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(s.activeGameId || 'unknown');
      } catch (e) {
        console.log('unknown');
      }
    " "$state_path" 2>/dev/null || echo "unknown"
  else
    grep -o '"activeGameId"[[:space:]]*:[[:space:]]*"[^"]*"' "$state_path" 2>/dev/null | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/' || echo "unknown"
  fi
}

# ---- Main ----
print_header "OpenArcade Launcher" "Local-first game hub"

echo -e "  ${GRAY}A few quick questions (press Enter for defaults):${NC}"
echo ""

# [1/5] Node check
print_step 1 5 "Checking Node..."
if ! command -v node &>/dev/null; then
  print_fail "Node.js was not found." "Install it from https://nodejs.org (LTS), then run this again."
fi
NODE_VER="$(node -v)"
print_ok "Node $NODE_VER"
echo ""

# Port
echo -e "  ${WHITE}Where should the hub run? (default 3000)${NC}"
read -r port_prompt
PORT="${port_prompt:-3000}"
PORT="${PORT// /}"
[ -z "$PORT" ] && PORT="3000"
echo ""

# Play URL
echo -e "  ${WHITE}Share link for friends (optional; press Enter to skip):${NC}"
echo -e "  ${GRAY}e.g. https://abc123.ngrok-free.app/play or http://YOUR_IP:$PORT/play${NC}"
read -r PLAY_URL
PLAY_URL="${PLAY_URL// /}"
echo ""

# Install deps
echo -e "  ${WHITE}Install dependencies? (Enter = yes, n = skip)${NC}"
read -r install_prompt
DO_INSTALL=1
case "${install_prompt:-y}" in
  [nN]) DO_INSTALL=0 ;;
esac
echo ""

# [2/5] Hub deps
if [ "$DO_INSTALL" -eq 1 ]; then
  print_step 2 5 "Installing hub dependencies..."
  (cd "$HUB" && if [ -f package-lock.json ]; then npm ci; else npm install; fi) || print_fail "Hub dependencies failed." "Check that you have npm and network."
  print_ok "Hub dependencies ready"

  print_step 3 5 "Installing UI dependencies..."
  (cd "$APP" && if [ -f package-lock.json ]; then npm ci; else npm install; fi) || print_fail "UI dependencies failed." "Check that you have npm and network."
  print_ok "UI dependencies ready"

  print_step 4 5 "Building UI..."
  (cd "$HUB" && npm run build:ui) || print_fail "UI build failed." "Run: cd hub && npm run build:ui"
  print_ok "UI built"
else
  print_step 2 5 "Skipping hub dependencies"
  print_step 3 5 "Skipping UI dependencies"
  print_step 4 5 "Skipping UI build"
fi

# [5/5] Start
print_step 5 5 "Starting Hub..."
echo ""

LAN_IP="$(get_lan_ip)"
ACTIVE_GAME="$(get_active_game)"

echo -e "  ${CYAN}All set! Open these in your browser:${NC}"
echo ""
echo -e "  ${GRAY}Landing (local):   ${NC}http://localhost:$PORT/"
[ -n "$LAN_IP" ] && echo -e "  ${GRAY}Landing (LAN):     ${NC}http://${LAN_IP}:$PORT/"
echo -e "  ${GRAY}Admin (local):     ${NC}http://localhost:$PORT/admin  (host-only)"
echo -e "  ${GRAY}Play (local):      ${NC}http://localhost:$PORT/play"
[ -n "$PLAY_URL" ] && echo -e "  ${GRAY}Play (share):      ${NC}$PLAY_URL"
echo -e "  ${GRAY}Active game:       ${NC}$ACTIVE_GAME"
echo ""
echo -e "  ${GRAY}To stop the hub, press Ctrl+C.${NC}"
echo ""

export PORT
[ -n "$PLAY_URL" ] && export PLAY_URL
cd "$HUB"
exec node src/index.js
