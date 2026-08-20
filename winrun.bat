@echo off
title LPC Spritesheet Generator

echo ====================================
echo   LPC Spritesheet Character Generator
echo ====================================
echo.

cd /d "%~dp0"

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install:
    echo   https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo Node.js %NODE_VER%

REM Check node_modules
if not exist "node_modules" (
    echo.
    echo First run - installing dependencies...
    echo ^(requires internet, only once^)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Install failed. Check network.
        pause
        exit /b 1
    )
    echo.
    echo Done!
)

REM Check dist folder
if not exist "dist\index.html" (
    echo.
    echo Building production files...
    call node node_modules\vite\bin\vite.js build
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
    echo.
    echo Build complete!
)

echo.
echo Starting server...
echo Browser will open automatically
echo Press Ctrl+C to stop
echo.

REM Open browser after delay
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

npx serve dist -l 3000
pause