import XCTest
@testable import TranscriberCore

/// Real models: set MD_TEST_MODELS to a folder with whisper/ and parakeet/ model folders (as Mission Desk downloads them).
final class EngineTests: XCTestCase {
  private func modelDir(_ id: String) throws -> URL {
    guard let root = ProcessInfo.processInfo.environment["MD_TEST_MODELS"] else { throw XCTSkip("MD_TEST_MODELS isn't set") }
    return URL(fileURLWithPath: root).appendingPathComponent(id)
  }

  func testWhisperTranscribesPortuguese() async throws {
    let segs = try await transcribe(WhisperEngine(), try fixtureSamplesWithModelDir("pt-PT"), locale: "pt-PT", modelDir: try modelDir("whisper"))
    XCTAssertTrue(segs.map(\.text).joined(separator: " ").lowercased().contains("reunião"), segs.map(\.text).joined())
  }

  func testParakeetTranscribesPortuguese() async throws {
    let segs = try await transcribe(ParakeetEngine(), try fixtureSamplesWithModelDir("pt-PT"), locale: "pt-PT", modelDir: try modelDir("parakeet"))
    XCTAssertTrue(segs.map(\.text).joined(separator: " ").lowercased().contains("reuni"), segs.map(\.text).joined())
  }

  func testABadModelFolderSaysSo() async throws {
    for engine in [WhisperEngine() as TranscriptionEngine, ParakeetEngine()] {
      do {
        try await engine.start(locale: "pt-PT", modelDir: URL(fileURLWithPath: "/nonexistent"))
        XCTFail("should throw")
      } catch let e as ProtocolError {
        XCTAssertEqual(e.code, "modelInvalid")
      }
    }
  }
}

func fixtureSamplesWithModelDir(_ name: String) throws -> [Int16] { try fixtureSamples(name) }

func transcribe(_ engine: TranscriptionEngine, _ samples: [Int16], locale: String, modelDir: URL) async throws -> [EngineSegment] {
  var out: [EngineSegment] = []
  let lock = NSLock()
  engine.onSegment = { s in lock.lock(); out.append(s); lock.unlock() }
  try await engine.start(locale: locale, modelDir: modelDir)
  for i in stride(from: 0, to: samples.count, by: 1600) { await engine.feed(Array(samples[i..<min(i + 1600, samples.count)])) }
  await engine.finish()
  return out
}
