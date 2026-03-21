$ErrorActionPreference = "Stop"

Write-Host "Checking for Node.js..." -ForegroundColor Cyan

# Try to find Node in standard install paths
$NodePath = "C:\Program Files\nodejs"
if (Test-Path $NodePath) {
    Write-Host "Node.js folder found at $NodePath" -ForegroundColor Green
    $env:Path = "$NodePath;$env:Path"
} else {
    Write-Host "Node.js folder NOT found at default location." -ForegroundColor Red
}

try {
    $version = node -v
    Write-Host "Node version: $version" -ForegroundColor Green
    
    Write-Host "Installing dependencies (if missing)..." -ForegroundColor Cyan
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    Write-Host "Starting Server..." -ForegroundColor Cyan
    npm run dev
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed."
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
