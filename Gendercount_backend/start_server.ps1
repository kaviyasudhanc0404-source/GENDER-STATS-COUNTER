# Starts the Gender Statistics Counter API on http://localhost:8000 (docs at /docs).
# Usage (from Gendercount_backend): .\start_server.ps1

Set-Location $PSScriptRoot

if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "Virtual environment not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

& ".\venv\Scripts\python.exe" -m app.main
