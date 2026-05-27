#!/usr/bin/env bash
set -euo pipefail

# ════════════════════════════════════════════════════════
#  PersonalAssistant — run.sh
#  Linux / macOS launcher — Docker Compose orchestration
# ════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
JWT_PLACEHOLDER="change-this-to-a-random-secret-min-32-chars"
HEALTH_URL="http://localhost:8000/health"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=5

print_banner() {
  echo "════════════════════════════════════════"
  echo "$1"
  echo "════════════════════════════════════════"
}

# ── Step 1: Check required tools ─────────────────────────
echo ""
echo "⏳ Checking required tools..."

if ! command -v docker &>/dev/null; then
  echo "❌ docker not found."
  echo ""
  echo "Install Docker Desktop: https://docs.docker.com/get-docker/"
  echo "  macOS:  brew install --cask docker"
  echo "  Ubuntu: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi
echo "  ✅ docker found: $(docker --version)"

if ! docker compose version &>/dev/null; then
  echo "❌ 'docker compose' (v2) not found."
  echo ""
  echo "Docker Compose v2 is included with Docker Desktop."
  echo "For Linux Engine installs:"
  echo "  https://docs.docker.com/compose/install/linux/"
  exit 1
fi
echo "  ✅ docker compose found: $(docker compose version --short)"

# ── Step 2: Check .env file ───────────────────────────────
echo ""
echo "⏳ Checking .env file..."

if [ ! -f "$ENV_FILE" ]; then
  if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "❌ .env.example not found at: $ENV_EXAMPLE"
    echo "   Please ensure you downloaded the full project."
    exit 1
  fi
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo ""
  print_banner "⚠️  .env created from .env.example. Please set JWT_SECRET_KEY before proceeding."
  echo ""
  echo "  Edit $ENV_FILE and replace:"
  echo "    JWT_SECRET_KEY=$JWT_PLACEHOLDER"
  echo "  with a random string of at least 32 characters, e.g.:"
  echo "    openssl rand -hex 32"
  echo ""
  exit 1
fi
echo "  ✅ .env exists"

# ── Step 3: Validate JWT_SECRET_KEY ──────────────────────
echo ""
echo "⏳ Validating JWT_SECRET_KEY..."

JWT_VALUE=""
if grep -q "^JWT_SECRET_KEY=" "$ENV_FILE"; then
  JWT_VALUE="$(grep "^JWT_SECRET_KEY=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)"
fi

if [ -z "$JWT_VALUE" ]; then
  echo "❌ JWT_SECRET_KEY is not set in .env"
  echo "   Add: JWT_SECRET_KEY=<random-32+-char-string>"
  echo "   Generate one: openssl rand -hex 32"
  exit 1
fi

if [ "$JWT_VALUE" = "$JWT_PLACEHOLDER" ]; then
  echo ""
  print_banner "⚠️  JWT_SECRET_KEY is still the example placeholder. Please set a real secret before proceeding."
  echo ""
  echo "  Edit $ENV_FILE and replace the placeholder value."
  echo "  Generate a secret: openssl rand -hex 32"
  echo ""
  exit 1
fi

KEY_LEN=${#JWT_VALUE}
if [ "$KEY_LEN" -lt 32 ]; then
  echo "❌ JWT_SECRET_KEY is too short ($KEY_LEN chars). Minimum 32 characters required."
  echo "   Generate one: openssl rand -hex 32"
  exit 1
fi
echo "  ✅ JWT_SECRET_KEY is set (${KEY_LEN} chars)"

# ── Step 4: Build and start services ─────────────────────
echo ""
echo "⏳ Building and starting PersonalAssistant..."
echo "   (First run pulls the Ollama model — this may take 2–5 minutes)"
echo ""

cd "$SCRIPT_DIR"
docker compose up --build -d

echo ""
echo "  ✅ Docker Compose services started"

# ── Step 5 / 6: Wait for backend health ──────────────────
echo ""
echo "⏳ Waiting for backend to become healthy..."

ELAPSED=0
BACKEND_UP=false

while [ "$ELAPSED" -lt "$HEALTH_TIMEOUT" ]; do
  if curl -sf "$HEALTH_URL" &>/dev/null; then
    BACKEND_UP=true
    break
  fi
  echo "  ⏳ Waiting for backend... (${ELAPSED}s elapsed)"
  sleep "$HEALTH_INTERVAL"
  ELAPSED=$((ELAPSED + HEALTH_INTERVAL))
done

if [ "$BACKEND_UP" = false ]; then
  echo ""
  echo "❌ Backend did not become healthy within ${HEALTH_TIMEOUT}s."
  echo ""
  echo "Troubleshooting:"
  echo "  docker compose logs backend"
  echo "  docker compose logs ollama"
  exit 1
fi

echo "  ✅ Backend is healthy"

# ── Step 7: Success banner ────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "✅ PersonalAssistant is running."
echo "Open: http://localhost"
echo "Demo account: demo@personalassistant.local / demo1234"
echo "Stop: docker compose down"
echo "════════════════════════════════════════"
