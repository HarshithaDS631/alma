@echo off
TITLE Alumni Network — Store Launch Builder
COLOR 0A
cls
echo ===================================================
echo   ALUMNI NETWORK — 1-CLICK STORE LAUNCH BUILDER
echo   Package: com.mediacell.alumni | Account: rvei
echo ===================================================
echo.

echo [1/3] Validating project configuration & linter...
call npm run launch:check
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Configuration validation failed! Fix issues before building.
    pause
    exit /b %errorlevel%
)
echo [OK] Project configuration & code linter verified cleanly!
echo.

echo [2/3] Checking Expo / EAS login status...
call npx eas-cli whoami
if %errorlevel% neq 0 (
    echo.
    echo [ACTION REQUIRED] Please log in to your Expo account:
    call npx eas-cli login
)
echo.

echo ===================================================
echo   READY TO BUILD PRODUCTION ANDROID AAB BUNDLE
echo ===================================================
echo.
echo Press CTRL+C to cancel, or
pause

echo.
echo [3/3] Launching EAS Android Production Cloud Build...
call npx eas-cli build -p android --profile production

echo.
echo ===================================================
echo   BUILD SUBMITTED TO EXPO CLOUD!
echo   Track live progress at:
echo   https://expo.dev/accounts/rvei/projects/alumninetwork/builds
echo ===================================================
echo.
pause
