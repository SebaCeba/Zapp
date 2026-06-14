# Script para iniciar la aplicación Node/React (Backend + Frontend)
# Ejecuta este script desde la raíz del proyecto: .\start.ps1

Write-Host "Iniciando aplicación Zapps (Node/React)..." -ForegroundColor Green

# Verificar que node_modules existen
if (-not (Test-Path "node-version\node_modules")) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
    Set-Location node-version
    npm install
    Set-Location ..
}

if (-not (Test-Path "node-version\client\node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Set-Location node-version\client
    npm install
    Set-Location ..\..
}

Write-Host ""
Write-Host "Iniciando Backend (API Node.js) en http://localhost:3000" -ForegroundColor Cyan
Write-Host "Iniciando Frontend (React/Vite)..." -ForegroundColor Cyan
Write-Host ""

# Iniciar backend en una nueva ventana de PowerShell
$backendPath = Join-Path $PWD "node-version"
$backendTitle = "Zapps - Backend (API)"
$backendCmd = "Set-Location -Path '$backendPath'; npm run dev"
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-ExecutionPolicy", "Bypass", `
    "-Command", `
    "& { `
        `$Host.UI.RawUI.WindowTitle = '$backendTitle'; `
        Write-Host 'Iniciando Backend en: $backendPath' -ForegroundColor Green; `
        Set-Location -Path '$backendPath'; `
        npm run dev `
    }"

# Esperar un momento para que el backend inicie
Write-Host "Esperando que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar frontend en otra ventana de PowerShell
$frontendPath = Join-Path $PWD "node-version\client"
$frontendTitle = "Zapps - Frontend (React)"
$frontendCmd = "Set-Location -Path '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-ExecutionPolicy", "Bypass", `
    "-Command", `
    "& { `
        `$Host.UI.RawUI.WindowTitle = '$frontendTitle'; `
        Write-Host 'Iniciando Frontend en: $frontendPath' -ForegroundColor Green; `
        Set-Location -Path '$frontendPath'; `
        npm run dev `
    }"

Write-Host ""
Write-Host "Aplicación iniciada exitosamente!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor White
Write-Host "Frontend: Se abrirá automáticamente en tu navegador" -ForegroundColor White
Write-Host ""
Write-Host "Para detener los servicios, cierra las ventanas de PowerShell que se abrieron." -ForegroundColor Yellow
