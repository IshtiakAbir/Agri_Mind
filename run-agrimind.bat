@echo off
title AgriMind Unified Platform Launcher
cls
echo ====================================================================
echo           A G R I M I N D   U N I F I E D   P L A T F O R M
echo       Smart Poultry Health, Trade & Financial Intelligence
echo ====================================================================
echo.

:: 1. Launch Backend API Server (Port 3001)
echo [1/2] Starting Backend API Server (Port 3001)...
start "AgriMind Backend API" cmd /k "cd /d "%~dp0app\backend" && node server.js"

:: 2. Launch Frontend Dev Server (Port 5173)
echo [2/2] Starting Frontend Vite Dev Server (Port 5173)...
start "AgriMind Frontend UI" cmd /k "cd /d "%~dp0app\frontend" && npm run dev"

echo.
echo ====================================================================
echo  AgriMind System successfully launched!
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend API:      http://localhost:3001
echo  - ML Pipelines:     %~dp0ml\pipelines
echo ====================================================================
echo.
pause
