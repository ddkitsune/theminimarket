@echo off
title Compilar Instalador de Windows (.exe)
cd /d "%~dp0"
echo ========================================================
echo   Compilando TheMiniMarket POS - Instalador de Windows
echo ========================================================
echo.
npm run build:exe
echo.
echo ========================================================
echo   Proceso finalizado. El instalador .exe se encuentra
echo   en la carpeta: "instalador"
echo ========================================================
pause
