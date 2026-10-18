# Creates the local virtual environment and installs the backend dependencies.
# Usage (from Gendercount_backend): .\setup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
& ".\venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt

Write-Host "Setup complete. Start the server with .\start_server.ps1" -ForegroundColor Green
