// swift-tools-version:6.2
import PackageDescription

// md-transcriber: Mission Desk's on-device transcription helper. It never opens a network connection:
// Mission Desk sends it 16 kHz audio and model folders, and reads back text (JSON lines on stdio).
let package = Package(
  name: "md-transcriber",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(url: "https://github.com/argmaxinc/WhisperKit.git", exact: "1.1.1"),
    .package(url: "https://github.com/FluidInference/FluidAudio.git", exact: "0.18.4", traits: []), // ASR only: no TTS, no prebuilt text-processing binary
  ],
  targets: [
    .target(
      name: "TranscriberCore",
      dependencies: [.product(name: "WhisperKit", package: "WhisperKit"), .product(name: "FluidAudio", package: "FluidAudio")],
      path: "Sources/TranscriberCore"
    ),
    .executableTarget(name: "md-transcriber", dependencies: ["TranscriberCore"], path: "Sources/md-transcriber"),
    .testTarget(
      name: "TranscriberTests",
      dependencies: ["TranscriberCore"],
      path: "Tests/TranscriberTests",
      resources: [.copy("Fixtures")]
    ),
  ],
  swiftLanguageModes: [.v5]
)
