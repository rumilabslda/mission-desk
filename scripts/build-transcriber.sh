#!/bin/sh
# Builds md-transcriber (native/transcriber) for Apple silicon and Intel, into build/bin/.
# macOS only; electron-builder copies it into Mission Desk.app/Contents/Resources and signs it.
set -eu
cd "$(dirname "$0")/.."
if [ "$(uname)" != "Darwin" ]; then
  echo "md-transcriber is built on macOS only; skipping."
  exit 0
fi
swift build -c release --arch arm64 --arch x86_64 --package-path native/transcriber
mkdir -p build/bin
cp "$(swift build -c release --arch arm64 --arch x86_64 --package-path native/transcriber --show-bin-path)/md-transcriber" build/bin/md-transcriber
echo "build/bin/md-transcriber"
