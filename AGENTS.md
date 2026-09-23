# Workspace Workflow Rules

## Standing Instruction: Commit and Deploy Every Time
Whenever any change or feature is completed:
1. **Lint & Verify**: Ensure all modified files pass syntax and linting checks (`npx eslint`).
2. **Git Commit & Push**:
   - Stage modified files (`git add ...`).
   - Commit with a descriptive conventional commit message (`git commit -m "..."`).
   - Push immediately to `origin main` (`git push origin main`), which triggers automatic deployment on Vercel.
3. **Android Release APK Build**:
   - Run Gradle release build (`.\gradlew.bat assembleRelease --no-daemon` in `android/` with proper `JAVA_HOME` and `ANDROID_HOME`).
   - Copy `android/app/build/outputs/apk/release/app-release.apk` to root `./AlumniNetwork.apk`.
4. **Report to User**: Always confirm the commit hash, Vercel deployment trigger, and updated APK binary.
