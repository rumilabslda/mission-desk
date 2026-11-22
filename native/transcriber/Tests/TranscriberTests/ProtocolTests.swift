import XCTest
@testable import TranscriberCore

final class ProtocolTests: XCTestCase {
  func testDecodesEveryCommand() throws {
    XCTAssertEqual(try decodeIncoming(#"{"type":"capabilities"}"#), .capabilities)
    XCTAssertEqual(try decodeIncoming(#"{"type":"start","engine":"apple","locale":"pt-PT","modelDir":null}"#), .start(engine: "apple", locale: "pt-PT", modelDir: nil))
    XCTAssertEqual(try decodeIncoming(#"{"type":"start","engine":"whisper","locale":"en-US","modelDir":"/m"}"#), .start(engine: "whisper", locale: "en-US", modelDir: "/m"))
    // 3 samples: 1, -1, 32767 as Int16LE
    XCTAssertEqual(try decodeIncoming(#"{"type":"audio","ch":"me","pcm":"AQD///9/"}"#), .audio(.me, [1, -1, 32767]))
    XCTAssertEqual(try decodeIncoming(#"{"type":"finish"}"#), .finish)
    XCTAssertEqual(try decodeIncoming(#"{"type":"installLocale","locale":"pt-PT"}"#), .installLocale("pt-PT"))
    XCTAssertEqual(try decodeIncoming(#"{"type":"releaseLocale","locale":"pt-PT"}"#), .releaseLocale("pt-PT"))
  }

  func testRejectsBadInput() {
    for line in [#"{"type":"dance"}"#, #"{"type":"audio","ch":"me","pcm":"%%%"}"#, #"{"type":"audio","ch":"them","pcm":"AQA="}"#, #"{"type":"audio","ch":"me","pcm":"AQ=="}"#, "not json", #"{"type":"start","engine":"apple"}"#] {
      XCTAssertThrowsError(try decodeIncoming(line), line) { error in
        XCTAssertEqual((error as? ProtocolError)?.code, "badInput", line)
      }
    }
  }

  func testEncodesSegmentsExactly() throws {
    let line = encode(.segment(.call, start: 1200, end: 3400, text: "Olá a todos"))
    XCTAssertFalse(line.contains("\n"))
    let obj = try JSONSerialization.jsonObject(with: Data(line.utf8)) as! [String: Any]
    XCTAssertEqual(obj["type"] as? String, "segment")
    XCTAssertEqual(obj["ch"] as? String, "call")
    XCTAssertEqual(obj["start"] as? Int, 1200)
    XCTAssertEqual(obj["end"] as? Int, 3400)
    XCTAssertEqual(obj["text"] as? String, "Olá a todos")
    XCTAssertEqual(obj.count, 5)
  }

  func testEncodesErrorsAndProgress() throws {
    let e = try JSONSerialization.jsonObject(with: Data(encode(.error(code: "localeMissing", message: "pt-PT")).utf8)) as! [String: Any]
    XCTAssertEqual(e["code"] as? String, "localeMissing")
    let p = try JSONSerialization.jsonObject(with: Data(encode(.localeProgress("pt-PT", 0.5)).utf8)) as! [String: Any]
    XCTAssertEqual(p["fraction"] as? Double, 0.5)
  }
}
