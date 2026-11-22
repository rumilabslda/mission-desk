import Foundation

/// Which side of the meeting: the user's microphone, or the meeting tab's audio.
public enum Channel: String, Sendable, CaseIterable {
  case me, call
}

/// A line Mission Desk sends (one JSON object per line on stdin).
public enum Incoming: Equatable, Sendable {
  case capabilities
  case start(engine: String, locale: String, modelDir: String?)
  /// 16 kHz mono Int16 samples.
  case audio(Channel, [Int16])
  case finish
  case installLocale(String)
  case releaseLocale(String)
}

public struct EngineInfo: Sendable, Equatable {
  public let id: String
  public let available: Bool
  public let reason: String?
  public init(id: String, available: Bool, reason: String?) {
    self.id = id
    self.available = available
    self.reason = reason
  }
}

/// A line the helper writes (one JSON object per line on stdout).
public enum Outgoing: Sendable {
  case capabilities(engines: [EngineInfo], appleSupported: [String], appleInstalled: [String])
  case ready
  /// Times in ms from the channel's first audio.
  case segment(Channel, start: Int, end: Int, text: String)
  case finished
  case localeProgress(String, Double)
  case localeInstalled(String)
  case error(code: String, message: String)
}

public struct ProtocolError: Error, Equatable {
  public let code: String
  public let message: String
  public init(_ code: String, _ message: String) {
    self.code = code
    self.message = message
  }
}

private func bad(_ m: String) -> ProtocolError { ProtocolError("badInput", m) }

public func decodeIncoming(_ line: String) throws -> Incoming {
  guard let obj = try? JSONSerialization.jsonObject(with: Data(line.utf8)) as? [String: Any], let type = obj["type"] as? String else {
    throw bad("not a JSON object with a type")
  }
  func str(_ k: String) throws -> String {
    guard let v = obj[k] as? String, !v.isEmpty, v.count <= 4096 else { throw bad("\(type): \(k) missing") }
    return v
  }
  switch type {
  case "capabilities": return .capabilities
  case "finish": return .finish
  case "installLocale": return .installLocale(try str("locale"))
  case "releaseLocale": return .releaseLocale(try str("locale"))
  case "start":
    let dir = obj["modelDir"] as? String
    return .start(engine: try str("engine"), locale: try str("locale"), modelDir: dir)
  case "audio":
    guard let ch = Channel(rawValue: (obj["ch"] as? String) ?? "") else { throw bad("audio: unknown channel") }
    guard let b64 = obj["pcm"] as? String, let data = Data(base64Encoded: b64), data.count % 2 == 0 else { throw bad("audio: pcm must be base64 Int16LE") }
    let samples: [Int16] = data.withUnsafeBytes { raw in
      (0..<(data.count / 2)).map { i in Int16(littleEndian: raw.loadUnaligned(fromByteOffset: i * 2, as: Int16.self)) }
    }
    return .audio(ch, samples)
  default:
    throw bad("unknown type \(type)")
  }
}

public func encode(_ out: Outgoing) -> String {
  let obj: [String: Any]
  switch out {
  case let .capabilities(engines, supported, installed):
    obj = [
      "type": "capabilities",
      "engines": engines.map { ["id": $0.id, "available": $0.available, "reason": $0.reason ?? NSNull()] as [String: Any] },
      "apple": ["supported": supported, "installed": installed],
    ]
  case .ready: obj = ["type": "ready"]
  case let .segment(ch, start, end, text): obj = ["type": "segment", "ch": ch.rawValue, "start": start, "end": end, "text": text]
  case .finished: obj = ["type": "finished"]
  case let .localeProgress(locale, fraction): obj = ["type": "localeProgress", "locale": locale, "fraction": fraction]
  case let .localeInstalled(locale): obj = ["type": "localeInstalled", "locale": locale]
  case let .error(code, message): obj = ["type": "error", "code": code, "message": message]
  }
  let data = (try? JSONSerialization.data(withJSONObject: obj, options: [.withoutEscapingSlashes])) ?? Data("{\"type\":\"error\",\"code\":\"internal\",\"message\":\"encode\"}".utf8)
  return String(decoding: data, as: UTF8.self)
}
