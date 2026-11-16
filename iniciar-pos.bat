@echo off
title TheMiniMarket - Punto de Venta
cd /d "%~dp0"

:: Limpiar variable de entorno de VS Code que bloquea la interfaz de Electron
set ELECTRON_RUN_AS_NODE=

echo ===================================================
echo     Iniciando Punto de Venta (TheMiniMarket POS)
echo ===================================================
echo.

if not exist "dist\index.html" (
    echo Compilando interfaz grafica por primera vez...
    call npm run build:vite
)

echo Abriendo aplicacion de escritorio...
node electron\launcher.cjs
exit /b 0
