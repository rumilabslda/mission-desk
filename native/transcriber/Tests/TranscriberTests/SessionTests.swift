import XCTest
@testable import TranscriberCore

final class SessionTests: XCTestCase {
  final class Lines: @unchecked Sendable {
    private let lock = NSLock()
    private var items: [[String: Any]] = []
    func add(_ s: String) {
      let o = try! JSONSerialization.jsonObject(with: Data(s.utf8)) as! [String: Any]
      lock.lock(); items.append(o); lock.unlock()
    }
    var all: [[String: Any]] { lock.lock(); defer { lock.unlock() }; return items }
    func types() -> [String] { all.map { $0["type"] as! String } }
  }

  func testAnswersCapabilities() async {
    let out = Lines()
    let s = HelperSession(write: out.add)
    await s.handle(#"{"type":"capabilities"}"#)
    let caps = out.all.first!
    XCTAssertEqual(caps["type"] as? String, "capabilities")
    XCTAssertEqual(((caps["engines"] as! [[String: Any]]).first!)["id"] as? String, "apple")
  }

  func testBadLinesAndUnknownEnginesReportErrors() async {
    let out = Lines()
    let s = HelperSession(write: out.add)
    await s.handle("garbage")
    await s.handle(#"{"type":"start","engine":"nope","locale":"en-US","modelDir":null}"#)
    XCTAssertEqual(out.all.map { $0["code"] as? String }, ["badInput", "engineUnavailable"])
  }

  func testTranscribesBothChannelsThroughTheProtocol() async throws {
    guard #available(macOS 26, *) else { throw XCTSkip("needs macOS 26") }
    guard await AppleEngine.installedLocale(for: "en-US") != nil else { throw XCTSkip("en-US not installed") }
    let samples = try fixtureSamples("en")
    let out = Lines()
    let s = HelperSession(write: out.add)
    await s.handle(#"{"type":"start","engine":"apple","locale":"en-US","modelDir":null}"#)
    for i in stride(from: 0, to: samples.count, by: 1600) {
      let chunk = Array(samples[i..<min(i + 1600, samples.count)])
      let b64 = chunk.withUnsafeBufferPointer { Data(buffer: $0) }.base64EncodedString()
      await s.handle(#"{"type":"audio","ch":"call","pcm":"\#(b64)"}"#)
    }
    await s.handle(#"{"type":"finish"}"#)
    XCTAssertEqual(out.types().first, "ready")
    XCTAssertEqual(out.types().last, "finished")
    let segs = out.all.filter { $0["type"] as? String == "segment" }
    XCTAssertFalse(segs.isEmpty)
    XCTAssertTrue(segs.allSatisfy { $0["ch"] as? String == "call" })
    XCTAssertTrue(segs.map { $0["text"] as! String }.joined(separator: " ").lowercased().contains("budget"))
  }
}
