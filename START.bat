@echo off
title EEF — Intern Navigator
color 0B
cls

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   EEF — AI Internship Roadmap Engine  v1.0      ║
echo  ║   Ezitech Engineering Framework                 ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Check Node.js ──────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found!
    echo  Download from: https://nodejs.org
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected

:: ── Check .env ─────────────────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
    )
)
if not exist ".env" (
    echo  [ERROR] .env file not found.
    pause & exit /b 1
)
echo  [OK] Configuration loaded (offline demo mode)

:: ── Install dependencies ───────────────────────────────────
if not exist "node_modules" (
    echo.
    echo  [INFO] First-run setup — installing dependencies...
    echo  [INFO] This takes 2-3 minutes. Please wait...
    echo.
    call npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERROR] npm install failed!
        echo  Check internet connection and try again.
        echo.
        pause & exit /b 1
    )
    echo  [OK] Dependencies installed!
    echo.
)

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   EEF — Intern Navigator Platform               ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║                                                  ║
echo  ║   [1]  Start Project  (localhost:8080)           ║
echo  ║   [2]  Show Demo Credentials                     ║
echo  ║   [3]  Open Live Site (Cloudflare)               ║
echo  ║   [4]  Exit                                      ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
set /p C="  Your choice [1-4]: "

if "%C%"=="1" goto START
if "%C%"=="2" goto CREDS
if "%C%"=="3" goto LIVE
if "%C%"=="4" goto BYE

echo  [ERROR] Invalid choice. Enter 1, 2, 3 or 4.
timeout /t 2 >nul
goto MENU

:: ════════════════════════════════════════════════════════════
:START
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   Starting EEF Dev Server...                    ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  URL:  http://localhost:8080
echo  Mode: OFFLINE DEMO (no internet / Supabase needed)
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │   DEMO LOGIN CREDENTIALS                        │
echo  ├─────────────────────────────────────────────────┤
echo  │                                                 │
echo  │   INTERN  (full intern dashboard + roadmap)     │
echo  │   Email    : intern@eef.demo                    │
echo  │   Password : Demo@1234                          │
echo  │                                                 │
echo  │   MENTOR  (review interns, manage roadmaps)     │
echo  │   Email    : mentor@eef.demo                    │
echo  │   Password : Demo@1234                          │
echo  │                                                 │
echo  │   ADMIN   (full platform access)                │
echo  │   Email    : admin@eef.demo                     │
echo  │   Password : Demo@1234                          │
echo  │                                                 │
echo  └─────────────────────────────────────────────────┘
echo.
echo  Press Ctrl+C to stop the server.
echo  Opening browser in 3 seconds...
echo.
timeout /t 3 >nul
start "" "http://localhost:8080"
call npm run dev
goto MENU

:: ════════════════════════════════════════════════════════════
:CREDS
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   DEMO LOGIN CREDENTIALS                        ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║                                                  ║
echo  ║   🎓  INTERN ACCOUNT                             ║
echo  ║   Email    : intern@eef.demo                     ║
echo  ║   Password : Demo@1234                           ║
echo  ║   Access   : Dashboard, Roadmap, Profile,        ║
echo  ║              Case Studies, Notifications         ║
echo  ║                                                  ║
echo  ║   👨‍💻  MENTOR ACCOUNT                             ║
echo  ║   Email    : mentor@eef.demo                     ║
echo  ║   Password : Demo@1234                           ║
echo  ║   Access   : All intern features + Mentor        ║
echo  ║              Console to review interns           ║
echo  ║                                                  ║
echo  ║   ⚙️   ADMIN ACCOUNT                              ║
echo  ║   Email    : admin@eef.demo                      ║
echo  ║   Password : Demo@1234                           ║
echo  ║   Access   : Full platform + User management     ║
echo  ║              + Invite codes + Audit logs         ║
echo  ║                                                  ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║   Local  : http://localhost:8080                 ║
echo  ║   Live   : https://intern-navigator.pages.dev    ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause & goto MENU

:: ════════════════════════════════════════════════════════════
:LIVE
start "" "https://intern-navigator.pages.dev"
goto MENU

:: ════════════════════════════════════════════════════════════
:BYE
cls
echo.
echo  EEF Intern Navigator — Goodbye!
echo  Live: https://intern-navigator.pages.dev
echo.
timeout /t 2 >nul
exit /b 0
