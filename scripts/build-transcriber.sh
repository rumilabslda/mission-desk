#!/bin/sh
# Builds md-transcriber (native/transcriber) for Apple silicon and Intel, into build/bin/.
# macOS only; electron-builder copies it into Mission Desk.app/Contents/Resources and signs it.
# Each architecture is built on its own and joined with lipo (a two-arch SwiftPM build trips on
# WhisperKit's duplicate module names).
set -eu
cd "$(dirname "$0")/.."
if [ "$(uname)" != "Darwin" ]; then
  echo "md-transcriber is built on macOS only; skipping."
  exit 0
fi
pkg=native/transcriber
bins=""
for arch in arm64 x86_64; do
  swift build -c release --package-path "$pkg" --triple "$arch-apple-macosx14.0" --product md-transcriber
  bins="$bins $(swift build -c release --package-path "$pkg" --triple "$arch-apple-macosx14.0" --product md-transcriber --show-bin-path)/md-transcriber"
done
mkdir -p build/bin
# shellcheck disable=SC2086
lipo -create $bins -output build/bin/md-transcriber
echo "build/bin/md-transcriber"
