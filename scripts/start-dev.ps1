# Start backend and frontend dev servers in separate PowerShell windows
# Usage: .\scripts\start-dev.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot '..\backend' | Resolve-Path
$frontendDir = Join-Path $repoRoot '..\frontend\vite-project' | Resolve-Path

Write-Host "Starting backend in a new window: $backendDir"
Start-Process powershell -ArgumentList "-NoExit -Command cd '$backendDir'; npm run dev" -WindowStyle Normal

Start-Sleep -Milliseconds 500
Write-Host "Starting frontend in a new window: $frontendDir"
Start-Process powershell -ArgumentList "-NoExit -Command cd '$frontendDir'; npm run dev" -WindowStyle Normal

Write-Host 'Both commands launched. Check the new windows for output.'
