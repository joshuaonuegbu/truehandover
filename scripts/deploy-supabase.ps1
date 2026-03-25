param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

Write-Host "Heartflair: Supabase deploy (Edge Functions + Secrets)" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$envFile = Join-Path $repoRoot "supabase\\.env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "Missing supabase/.env.local. Copy from supabase/.env.example and fill values first." -ForegroundColor Yellow
  exit 1
}

Write-Host "Project ref: $ProjectRef"
Write-Host "Env file:    $envFile"
Write-Host ""

Write-Host "1) Login (if needed):" -ForegroundColor Gray
Write-Host "   npx supabase login"
Write-Host ""

Write-Host "2) Linking repo..." -ForegroundColor Gray
npx supabase link --project-ref $ProjectRef

Write-Host ""
Write-Host "3) Setting secrets from supabase/.env.local..." -ForegroundColor Gray
npx supabase secrets set --env-file supabase/.env.local

Write-Host ""
Write-Host "4) Deploying Edge Functions..." -ForegroundColor Gray

$functions = @(
  "stripe-checkout",
  "stripe-onboarding",
  "stripe-webhook",
  "client-preview",
  "creator-projects",
  "r2-presign",
  "r2-download"
)

foreach ($fn in $functions) {
  Write-Host ("- deploy {0}" -f $fn) -ForegroundColor DarkGray
  npx supabase functions deploy $fn
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green

