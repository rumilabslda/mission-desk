// swift-tools-version:6.0
import PackageDescription

// md-transcriber: Mission Desk's on-device transcription helper. It never opens a network connection:
// Mission Desk sends it 16 kHz audio and model folders, and reads back text (JSON lines on stdio).
let package = Package(
  name: "md-transcriber",
  platforms: [.macOS(.v14)],
  targets: [
    .target(name: "TranscriberCore", path: "Sources/TranscriberCore"),
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
