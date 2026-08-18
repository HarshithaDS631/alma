#!/bin/bash
# Android App Signing Keystore Generator Script for Google Play Store Publishing

KEYSTORE_NAME="alumni-release-key.jks"
ALIAS_NAME="alumni-key-alias"

echo "🔐 Generating Android Release Keystore for Google Play Store..."

keytool -genkey -v -keystore "$KEYSTORE_NAME" \
  -alias "$ALIAS_NAME" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Alumni App, OU=Alumni, O=RV Educational Institutions, L=Bengaluru, ST=Karnataka, C=IN"

echo "✅ Keystore generated successfully: $KEYSTORE_NAME"
echo "Place $KEYSTORE_NAME in android/app/ and configure build.gradle for release builds."
