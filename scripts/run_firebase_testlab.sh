#!/bin/bash
# Firebase Test Lab Automation Script

PROJECT_ID="alumni-app-956c6"
APK_PATH="./android/app/build/outputs/apk/release/app-release.apk"

echo "🚀 Starting Firebase Test Lab Automated Device Matrix Test for $PROJECT_ID..."

if [ ! -f "$APK_PATH" ]; then
    echo "⚠️ APK file not found at $APK_PATH. Building production APK via Expo..."
    npx eas build -p android --profile preview --local
fi

echo "📲 Submitting APK to Firebase Test Lab (Pixel 7 & Galaxy S23)..."

gcloud firebase test android run \
  --type robo \
  --app "$APK_PATH" \
  --device model=Pixel7,version=33,locale=en,orientation=portrait \
  --device model=GalaxyS23,version=34,locale=en,orientation=portrait \
  --timeout 5m \
  --project "$PROJECT_ID"

echo "✅ Firebase Test Lab Execution Complete! Check Firebase Console for Video & Performance Reports."
