#!/usr/bin/env bash
set -euo pipefail

# Compile each shipped LocationManager.swift against SDK boundary doubles.
# Requires macOS + Xcode command line tools; no API key or CocoaPods needed.
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
fixtures="$repo_root/scripts/ios-location-tests"
build_dir="$(mktemp -d "${TMPDIR:-/tmp}/expo-gaode-location-tests.XXXXXX")"
trap 'rm -rf "$build_dir"' EXIT

for module in AMapLocationKit AMapFoundationKit ExpoModulesCore; do
  xcrun swiftc -swift-version 5 -module-cache-path "$build_dir/cache" \
    -emit-library -emit-module -module-name "$module" \
    -emit-module-path "$build_dir/$module.swiftmodule" \
    "$fixtures/$module.swift" -o "$build_dir/lib$module.dylib"
done

result=0
for source in packages/core/ios/modules/LocationManager.swift packages/navigation/ios/map/modules/LocationManager.swift; do
  echo "Testing $source"
  xcrun swiftc -swift-version 5 -module-cache-path "$build_dir/cache" \
    -I "$build_dir" -L "$build_dir" \
    -lAMapLocationKit -lAMapFoundationKit -lExpoModulesCore \
    -Xlinker -rpath -Xlinker "$build_dir" \
    "$fixtures/Support.swift" "$repo_root/$source" "$fixtures/main.swift" \
    -o "$build_dir/location-tests"
  "$build_dir/location-tests" || result=1
done
exit "$result"
