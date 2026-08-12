#!/bin/bash

# Exit on error
set -e

echo "--- Cloning Flutter ---"
if [ ! -d "flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable
fi

echo "--- Adding Flutter to PATH ---"
export PATH="$PATH:`pwd`/flutter/bin"

echo "--- Checking Flutter Version ---"
flutter --version

echo "--- Running Flutter Pub Get ---"
flutter pub get

echo "--- Building Flutter Web (Release) ---"
flutter build web --release

echo "--- Build Complete! ---"
