@echo off
title EEF — Intern Navigator
color 0B
cls

echo.
echo  =====================================================
echo    EEF ^| AI Internship Roadmap Engine  v1.0
echo    Ezitech Engineering Framework
echo  =====================================================
echo.

:: ---------- check Node ----------
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found.
    echo  Download from: https://nodejs.org
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ---------- check .env ----------
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [WARN] .env created from example — fill in your keys then re-run.
        pause & exit /b 1
    )
    echo  [ERROR] .env missing.
    pause & exit /b 1
)
echo  [OK] .env found

:: ---------- install deps ----------
if not exist "node_modules" (
    echo.
    echo  [INFO] First-time setup — installing dependencies...
    call npm install --silent
    if %errorlevel% neq 0 (
        color 0C & echo  [ERROR] npm install failed. & pause & exit /b 1
    )
    echo  [OK] Dependencies installed
)

:MENU
cls
echo.
echo  =====================================================
echo    EEF ^| Intern Navigator Platform
echo  =====================================================
echo.
echo    [1]  Start Dev Server        ^(port 8080^)
echo    [2]  Create Demo Users       ^(via Supabase API^)
echo    [3]  Build for Production
echo    [4]  Open Live Site
echo    [5]  Show Demo Credentials
echo    [6]  Exit
echo.
echo  =====================================================
echo.
set /p C="  Your choice: "

if "%C%"=="1" goto DEV
if "%C%"=="2" goto DEMO
if "%C%"=="3" goto BUILD
if "%C%"=="4" goto LIVE
if "%C%"=="5" goto CREDS
if "%C%"=="6" goto BYE
goto MENU

:: =====================================================
:DEV
cls
echo.
echo  Starting dev server on http://localhost:8080
echo  Press Ctrl+C to stop.
echo.
echo  ---- DEMO CREDENTIALS ----
echo  Intern  : intern@eef.demo  /  Demo@1234
echo  Mentor  : mentor@eef.demo  /  Demo@1234
echo  Admin   : admin@eef.demo   /  Demo@1234
echo  --------------------------
echo.
timeout /t 2 >nul
start "" "http://localhost:8080"
call npm run dev
goto MENU

:: =====================================================
:DEMO
cls
echo.
echo  =====================================================
echo    Creating Demo Users via Supabase Admin API
echo  =====================================================
echo.

:: Read SERVICE_ROLE_KEY and SUPABASE_URL from .env
set SUPA_URL=
set SUPA_KEY=
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="SUPABASE_URL"            set SUPA_URL=%%B
    if "%%A"=="SUPABASE_SERVICE_ROLE_KEY" set SUPA_KEY=%%B
)

:: Strip surrounding quotes if any
set SUPA_URL=%SUPA_URL:"=%
set SUPA_KEY=%SUPA_KEY:"=%

if "%SUPA_URL%"=="" (
    echo  [ERROR] SUPABASE_URL not found in .env
    pause & goto MENU
)
if "%SUPA_KEY%"=="" (
    echo  [ERROR] SUPABASE_SERVICE_ROLE_KEY not found in .env
    pause & goto MENU
)

echo  Supabase URL: %SUPA_URL%
echo.

:: Check curl
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] curl not found. Using Node.js fallback...
    call node scripts/create-demo-users.mjs
    goto DEMO_DONE
)

echo  Creating intern@eef.demo ...
curl -s -X POST "%SUPA_URL%/auth/v1/admin/users" ^
  -H "apikey: %SUPA_KEY%" ^
  -H "Authorization: Bearer %SUPA_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"intern@eef.demo\",\"password\":\"Demo@1234\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"Alex Johnson\"}}" > nul 2>&1
echo  [OK] intern@eef.demo created (or already exists)

echo  Creating mentor@eef.demo ...
curl -s -X POST "%SUPA_URL%/auth/v1/admin/users" ^
  -H "apikey: %SUPA_KEY%" ^
  -H "Authorization: Bearer %SUPA_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mentor@eef.demo\",\"password\":\"Demo@1234\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"Sarah Chen\"}}" > nul 2>&1
echo  [OK] mentor@eef.demo created (or already exists)

echo  Creating admin@eef.demo ...
curl -s -X POST "%SUPA_URL%/auth/v1/admin/users" ^
  -H "apikey: %SUPA_KEY%" ^
  -H "Authorization: Bearer %SUPA_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@eef.demo\",\"password\":\"Demo@1234\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"EEF Administrator\"}}" > nul 2>&1
echo  [OK] admin@eef.demo created (or already exists)

echo.
echo  Now assigning roles and profiles via Node.js...
call node scripts/create-demo-users.mjs

:DEMO_DONE
echo.
echo  =====================================================
echo   DEMO USERS READY
echo  =====================================================
echo   Intern  :  intern@eef.demo   /  Demo@1234
echo   Mentor  :  mentor@eef.demo   /  Demo@1234
echo   Admin   :  admin@eef.demo    /  Demo@1234
echo  =====================================================
echo.
pause
goto MENU

:: =====================================================
:BUILD
cls
echo.
echo  Building for production...
echo.
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Build failed. See errors above.
    color 0B
) else (
    echo.
    echo  [OK] Build complete — output in .output/
    echo.
    echo  Deploy: git add -A ^&^& git commit -m "update" ^&^& git push
)
echo.
pause & goto MENU

:: =====================================================
:LIVE
cls
echo.
echo  Opening live site...
start "" "https://intern-navigator.pages.dev"
timeout /t 2 >nul
goto MENU

:: =====================================================
:CREDS
cls
echo.
echo  =====================================================
echo    DEMO LOGIN CREDENTIALS
echo  =====================================================
echo.
echo    INTERN ACCOUNT
echo    Email    :  intern@eef.demo
echo    Password :  Demo@1234
echo    Access   :  Dashboard, Roadmap, Profile, Skills
echo.
echo    MENTOR ACCOUNT
echo    Email    :  mentor@eef.demo
echo    Password :  Demo@1234
echo    Access   :  Dashboard, Reviews, Intern Management
echo.
echo    ADMIN ACCOUNT
echo    Email    :  admin@eef.demo
echo    Password :  Demo@1234
echo    Access   :  Full platform access, User management
echo.
echo  =====================================================
echo    Live Site   : https://intern-navigator.pages.dev
echo    Local Dev   : http://localhost:8080
echo  =====================================================
echo.
pause & goto MENU

:: =====================================================
:BYE
cls
echo.
echo  EEF — Intern Navigator
echo  Live: https://intern-navigator.pages.dev
echo.
timeout /t 2 >nul
exit /b 0
