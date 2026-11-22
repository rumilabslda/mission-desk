import XCTest
@testable import TranscriberCore

final class ChunkerTests: XCTestCase {
  /// A fake model: one segment per chunk, spanning it, saying how long it was.
  final class Fake: ChunkTranscriber, @unchecked Sendable {
    var chunks: [Int] = []
    func transcribeChunk(_ samples: [Float]) async throws -> [EngineSegment] {
      chunks.append(samples.count)
      return [EngineSegment(start: 0, end: Double(samples.count) / 16000, text: "chunk \(samples.count / 16000)s")]
    }
  }

  private func tone(_ seconds: Double) -> [Int16] { (0..<Int(seconds * 16000)).map { Int16(8000 * sin(Double($0) * 0.2)) } }
  private func silence(_ seconds: Double) -> [Int16] { [Int16](repeating: 0, count: Int(seconds * 16000)) }

  private func run(_ audio: [[Int16]]) async -> (Fake, [EngineSegment]) {
    let fake = Fake()
    let engine = ChunkedEngine(fake)
    var out: [EngineSegment] = []
    let lock = NSLock()
    engine.onSegment = { s in lock.lock(); out.append(s); lock.unlock() }
    for part in audio {
      for i in stride(from: 0, to: part.count, by: 1600) { await engine.feed(Array(part[i..<min(i + 1600, part.count)])) }
    }
    await engine.finish()
    return (fake, out)
  }

  func testSplitsAtAPauseAfterSpeechAndKeepsTheTimeline() async {
    let (fake, segs) = await run([tone(6), silence(1), tone(4)])
    XCTAssertEqual(fake.chunks.count, 2)
    XCTAssertEqual(segs.count, 2)
    XCTAssertEqual(segs[0].start, 0, accuracy: 0.01)
    XCTAssertGreaterThanOrEqual(segs[1].start, 6.5)
    XCTAssertEqual(segs[1].end, 11, accuracy: 0.11)
  }

  func testNeverWaitsLongerThanTheMaximumChunk() async {
    let (fake, _) = await run([tone(62)])
    XCTAssertEqual(fake.chunks.count, 3)
    XCTAssertTrue(fake.chunks.allSatisfy { $0 <= 25 * 16000 })
  }

  func testSilenceIsNeverSentToTheModel() async {
    let (fake, segs) = await run([silence(40)])
    XCTAssertEqual(fake.chunks, [])
    XCTAssertEqual(segs, [])
  }
}
