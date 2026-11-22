import AVFoundation
import Speech
import XCTest
@testable import TranscriberCore

/// Reads a fixture as 16 kHz mono Int16 samples.
func fixtureSamples(_ name: String) throws -> [Int16] {
  let url = try XCTUnwrap(Bundle.module.url(forResource: name, withExtension: "wav", subdirectory: "Fixtures"))
  let file = try AVAudioFile(forReading: url, commonFormat: .pcmFormatInt16, interleaved: false)
  XCTAssertEqual(file.processingFormat.sampleRate, 16000)
  let buffer = try XCTUnwrap(AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(file.length)))
  try file.read(into: buffer)
  return Array(UnsafeBufferPointer(start: buffer.int16ChannelData![0], count: Int(buffer.frameLength)))
}

/// Feeds samples in 100 ms chunks, then finishes; returns the segments' text.
func transcribe(_ engine: TranscriptionEngine, _ samples: [Int16], locale: String) async throws -> [EngineSegment] {
  var out: [EngineSegment] = []
  let lock = NSLock()
  engine.onSegment = { s in lock.lock(); out.append(s); lock.unlock() }
  try await engine.start(locale: locale, modelDir: nil)
  for i in stride(from: 0, to: samples.count, by: 1600) {
    await engine.feed(Array(samples[i..<min(i + 1600, samples.count)]))
  }
  await engine.finish()
  return out
}

final class AppleEngineTests: XCTestCase {
  private func installed(_ locale: String) async throws -> Bool {
    guard #available(macOS 26, *) else { throw XCTSkip("needs macOS 26") }
    return await SpeechTranscriber.installedLocales.contains { $0.identifier(.bcp47) == locale }
  }

  func testTranscribesEnglish() async throws {
    guard try await installed("en-US") else { throw XCTSkip("en-US isn't installed for SpeechTranscriber") }
    guard #available(macOS 26, *) else { return }
    let segs = try await transcribe(AppleEngine(), try fixtureSamples("en"), locale: "en-US")
    let text = segs.map(\.text).joined(separator: " ").lowercased()
    XCTAssertTrue(text.contains("budget"), text)
    XCTAssertTrue(segs.allSatisfy { $0.end >= $0.start && $0.start >= 0 })
    XCTAssertLessThan(segs.last?.end ?? 99, 6.0)
  }

  func testTranscribesEuropeanPortuguese() async throws {
    guard try await installed("pt-PT") else { throw XCTSkip("pt-PT isn't installed for SpeechTranscriber") }
    guard #available(macOS 26, *) else { return }
    let segs = try await transcribe(AppleEngine(), try fixtureSamples("pt-PT"), locale: "pt-PT")
    XCTAssertTrue(segs.map(\.text).joined(separator: " ").lowercased().contains("reunião"))
  }

  func testAMissingLocaleSaysSo() async throws {
    guard #available(macOS 26, *) else { throw XCTSkip("needs macOS 26") }
    do {
      try await AppleEngine().start(locale: "xx-XX", modelDir: nil)
      XCTFail("should throw")
    } catch let e as ProtocolError {
      XCTAssertEqual(e.code, "localeMissing")
    }
  }
}
