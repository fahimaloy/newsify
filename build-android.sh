#!/bin/bash

echo "🚀 Building Channel July 36 for Android..."
echo ""

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  Warning: ANDROID_HOME or ANDROID_SDK_ROOT not set"
    echo "   Android SDK path: ~/Android/Sdk"
fi

# Build the app
echo "📦 Building APK..."
npm run tauri android build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📱 APK location:"
    find src-tauri/gen/android -name "*.apk" 2>/dev/null | grep -v "unaligned" | head -5
    echo ""
    echo "🎉 You can now install the APK on your Android device!"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
