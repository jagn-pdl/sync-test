#Requires -Version 5.1
<#
.SYNOPSIS
  PersonalAssistant — run.ps1
  Windows PowerShell launcher — Docker Compose orchestration
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvFile        = Join-Path $ScriptDir ".env"
$EnvExample     = Join-Path $ScriptDir ".env.example"
$JwtPlaceholder = "change-this-to-a-random-secret-min-32-chars"
$HealthUrl      = "http://localhost:8000/health"
$HealthTimeout  = 60
$HealthInterval = 5

function Print-Banner($msg) {
  Write-Host "════════════════════════════════════════"
  Write-Host $msg
  Write-Host "════════════════════════════════════════"
}

# ── Step 1: Check required tools ─────────────────────────
Write-Host ""
Write-Host "⏳ Checking required tools..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "❌ docker not found."
  Write-Host ""
  Write-Host "Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
  Write-Host "After installing, restart this terminal and try again."
  exit 1
}
$dockerVer = docker --version
Write-Host "  ✅ docker found: $dockerVer"

$composeCheck = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ 'docker compose' (v2) not found."
  Write-Host ""
  Write-Host "Docker Compose v2 is included with Docker Desktop."
  Write-Host "Ensure Docker Desktop is up to date: https://docs.docker.com/desktop/release-notes/"
  exit 1
}
$composeVer = docker compose version --short 2>&1
Write-Host "  ✅ docker compose found: $composeVer"

# ── Step 2: Check .env file ───────────────────────────────
Write-Host ""
Write-Host "⏳ Checking .env file..."

if (-not (Test-Path $EnvFile)) {
  if (-not (Test-Path $EnvExample)) {
    Write-Host "❌ .env.example not found at: $EnvExample"
    Write-Host "   Please ensure you downloaded the full project."
    exit 1
  }
  Copy-Item $EnvExample $EnvFile
  Write-Host ""
  Print-Banner "⚠️  .env created from .env.example. Please set JWT_SECRET_KEY before proceeding."
  Write-Host ""
  Write-Host "  Edit $EnvFile and replace:"
  Write-Host "    JWT_SECRET_KEY=$JwtPlaceholder"
  Write-Host "  with a random string of at least 32 characters."
  Write-Host ""
  Write-Host "  PowerShell tip — generate a secret key:"
  Write-Host '    -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})'
  Write-Host ""
  exit 1
}
Write-Host "  ✅ .env exists"

# ── Step 3: Validate JWT_SECRET_KEY ──────────────────────
Write-Host ""
Write-Host "⏳ Validating JWT_SECRET_KEY..."

$jwtLine = Get-Content $EnvFile | Where-Object { $_ -match "^JWT_SECRET_KEY=" } | Select-Object -First 1
$jwtValue = ""
if ($jwtLine) {
  $jwtValue = $jwtLine -replace "^JWT_SECRET_KEY=", ""
}

if ([string]::IsNullOrWhiteSpace($jwtValue)) {
  Write-Host "❌ JWT_SECRET_KEY is not set in .env"
  Write-Host "   Add: JWT_SECRET_KEY=<random-32+-char-string>"
  exit 1
}

if ($jwtValue -eq $JwtPlaceholder) {
  Write-Host ""
  Print-Banner "⚠️  JWT_SECRET_KEY is still the example placeholder. Please set a real secret before proceeding."
  Write-Host ""
  Write-Host "  Edit $EnvFile and replace the placeholder value."
  Write-Host ""
  exit 1
}

$keyLen = $jwtValue.Length
if ($keyLen -lt 32) {
  Write-Host "❌ JWT_SECRET_KEY is too short ($keyLen chars). Minimum 32 characters required."
  exit 1
}
Write-Host "  ✅ JWT_SECRET_KEY is set ($keyLen chars)"

# ── Step 4: Build and start services ─────────────────────
Write-Host ""
Write-Host "⏳ Building and starting PersonalAssistant..."
Write-Host "   (First run pulls the Ollama model — this may take 2–5 minutes)"
Write-Host ""

Set-Location $ScriptDir
docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ docker compose up failed. See output above."
  exit 1
}

Write-Host ""
Write-Host "  ✅ Docker Compose services started"

# ── Step 5 / 6: Wait for backend health ──────────────────
Write-Host ""
Write-Host "⏳ Waiting for backend to become healthy..."

$elapsed    = 0
$backendUp  = $false

while ($elapsed -lt $HealthTimeout) {
  try {
    $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) {
      $backendUp = $true
      break
    }
  } catch {
    # not ready yet
  }
  Write-Host "  ⏳ Waiting for backend... (${elapsed}s elapsed)"
  Start-Sleep -Seconds $HealthInterval
  $elapsed += $HealthInterval
}

if (-not $backendUp) {
  Write-Host ""
  Write-Host "❌ Backend did not become healthy within ${HealthTimeout}s."
  Write-Host ""
  Write-Host "Troubleshooting:"
  Write-Host "  docker compose logs backend"
  Write-Host "  docker compose logs ollama"
  exit 1
}

Write-Host "  ✅ Backend is healthy"

# ── Step 7: Success banner ────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════"
Write-Host "✅ PersonalAssistant is running."
Write-Host "Open: http://localhost"
Write-Host "Demo account: demo@personalassistant.local / demo1234"
Write-Host "Stop: docker compose down"
Write-Host "════════════════════════════════════════"
