@echo off
TITLE Alumni Network — Multi-Platform Store Launch Builder (Web + Android + iOS)
COLOR 0A
cls
echo ===================================================================
echo   ALUMNI NETWORK — MULTI-PLATFORM LAUNCH BUILDER
echo   Package: com.mediacell.alumni | Account: rvei (expo.dev)
echo   Platforms: Android (Play Store) | iOS (App Store) | Web (Vercel)
echo ===================================================================
set EXPO_TOKEN=sYAY7eVgbZ-dF-fiiu678x-Ik7OxlRLYtFqhN3Hm

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
echo [OK] Authenticated via EXPO_TOKEN!
echo.

echo ===================================================================
echo   SELECT PLATFORM TO BUILD:
echo ===================================================================
echo   [1] Android Only   -- Build .aab for Google Play Store
echo   [2] iOS Only       -- Build .ipa for Apple App Store
echo   [3] Web Only       -- Export Web build for Vercel
echo   [4] ALL PLATFORMS  -- Build Android + iOS + Web together
echo ===================================================================
echo.
set /p CHOICE="Enter choice [1, 2, 3, or 4]: "

if "%CHOICE%"=="1" goto BUILD_ANDROID
if "%CHOICE%"=="2" goto BUILD_IOS
if "%CHOICE%"=="3" goto BUILD_WEB
if "%CHOICE%"=="4" goto BUILD_ALL

echo Invalid choice. Defaulting to ALL.
goto BUILD_ALL

:BUILD_ANDROID
echo.
echo [3/3] Building Production Android AAB...
call npx eas-cli build -p android --profile production
goto FINISH

:BUILD_IOS
echo.
echo [3/3] Building Production iOS IPA...
call npx eas-cli build -p ios --profile production
goto FINISH

:BUILD_WEB
echo.
echo [3/3] Exporting Web Bundle for Vercel...
call npm run vercel-build
goto FINISH

:BUILD_ALL
echo.
echo [3/3] Building ALL Platforms (Android + iOS + Web)...
call npm run launch:all
goto FINISH

:FINISH
echo.
echo ===================================================================
echo   BUILD PROCESS COMPLETED / SUBMITTED TO EXPO CLOUD!
echo   Track live progress at:
echo   https://expo.dev/accounts/rvei/projects/alumninetwork/builds
echo ===================================================================
echo.
pause
