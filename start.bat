@echo off
echo.
echo Iniciando Zapps...
echo.

REM Verificar que PowerShell esta disponible
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell no encontrado
    pause
    exit /b 1
)

REM Ejecutar el script de PowerShell
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start.ps1"

REM Si hay error, mantener la ventana abierta
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El script fallo con codigo %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
pause
