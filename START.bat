@echo off
title EEF — Intern Navigator Platform
color 0B
cls

echo.
echo  ===================================================
echo    EEF — AI Internship Roadmap Engine
echo    Ezitech Engineering Framework v1.0
echo  ===================================================
echo.

:: ---- Check Node.js ----
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed!
    echo.
    echo  Please install Node.js from:
    echo  https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected
echo.

:: ---- Check if .env exists ----
if not exist ".env" (
    color 0E
    echo  [WARN] .env file not found!
    echo  Copying .env.example to .env ...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] .env created from example
        echo.
        echo  Please edit .env and add your Supabase credentials.
        echo  Then run this file again.
        echo.
        pause
        exit /b 1
    ) else (
        echo  [ERROR] .env.example not found either!
        pause
        exit /b 1
    )
)
echo  [OK] .env file found

:: ---- Install dependencies if needed ----
if not exist "node_modules" (
    echo.
    echo  [INFO] Installing dependencies (first time setup)...
    echo  This may take 2-3 minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERROR] npm install failed!
        echo  Check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed successfully!
)

:: ---- Show menu ----
:MENU
cls
echo.
echo  ===================================================
echo    EEF — Intern Navigator Platform
echo  ===================================================
echo.
echo    1.  Start Development Server  (localhost:8080)
echo    2.  Create Demo Users         (for testing)
echo    3.  Build for Production
echo    4.  Open Live Site            (Cloudflare)
echo    5.  Exit
echo.
echo  ===================================================
echo.
set /p CHOICE="  Enter option (1-5): "

if "%CHOICE%"=="1" goto START_DEV
if "%CHOICE%"=="2" goto CREATE_DEMO
if "%CHOICE%"=="3" goto BUILD_PROD
if "%CHOICE%"=="4" goto OPEN_LIVE
if "%CHOICE%"=="5" goto EXIT

echo.
echo  [ERROR] Invalid option. Please enter 1-5.
echo.
timeout /t 2 >nul
goto MENU

:: ---- Start Dev Server ----
:START_DEV
cls
echo.
echo  ===================================================
echo    Starting Development Server...
echo  ===================================================
echo.
echo  [INFO] Server will be available at:
echo         http://localhost:8080
echo.
echo  Demo Login Credentials:
echo  -----------------------
echo  INTERN:
echo    Email:    intern@eef.demo
echo    Password: Demo@1234
echo.
echo  MENTOR:
echo    Email:    mentor@eef.demo
echo    Password: Demo@1234
echo.
echo  ADMIN:
echo    Email:    admin@eef.demo
echo    Password: Demo@1234
echo.
echo  Press Ctrl+C to stop the server
echo  ===================================================
echo.
timeout /t 3 >nul
start "" "http://localhost:8080"
call npm run dev
goto MENU

:: ---- Create Demo Users ----
:CREATE_DEMO
cls
echo.
echo  ===================================================
echo    Creating Demo Users in Supabase...
echo  ===================================================
echo.
call node scripts/create-demo-users.mjs
echo.
echo  ===================================================
echo  Press any key to return to menu...
pause >nul
goto MENU

:: ---- Build Production ----
:BUILD_PROD
cls
echo.
echo  ===================================================
echo    Building for Production...
echo  ===================================================
echo.
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Build failed! Check errors above.
    echo.
    color 0B
) else (
    echo.
    echo  [OK] Build successful! Output in .output folder
    echo.
    echo  To deploy: push to GitHub (Cloudflare auto-deploys)
    echo    git add -A
    echo    git commit -m "update"
    echo    git push origin main
    echo.
)
echo  Press any key to return to menu...
pause >nul
goto MENU

:: ---- Open Live Site ----
:OPEN_LIVE
cls
echo.
echo  ===================================================
echo    Opening Live Site...
echo  ===================================================
echo.
echo  Live URL: https://intern-navigator.pages.dev
echo.
echo  Demo Login Credentials:
echo  -----------------------
echo  INTERN:  intern@eef.demo   / Demo@1234
echo  MENTOR:  mentor@eef.demo   / Demo@1234
echo  ADMIN:   admin@eef.demo    / Demo@1234
echo.
start "" "https://intern-navigator.pages.dev"
timeout /t 3 >nul
goto MENU

:: ---- Exit ----
:EXIT
cls
echo.
echo  Thanks for using EEF — Intern Navigator!
echo  Live: https://intern-navigator.pages.dev
echo.
timeout /t 2 >nul
exit /b 0
