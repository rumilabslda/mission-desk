import Foundation

/// A finished piece of text. Times in seconds from the engine's first sample.
public struct EngineSegment: Sendable, Equatable {
  public let start: Double
  public let end: Double
  public let text: String
  public init(start: Double, end: Double, text: String) {
    self.start = start
    self.end = end
    self.text = text
  }
}

/// One engine instance transcribes one channel (so each channel keeps its own timeline).
public protocol TranscriptionEngine: AnyObject {
  /// Called with each final result, from any thread.
  var onSegment: ((EngineSegment) -> Void)? { get set }
  /// Throws ProtocolError("localeMissing" | "modelInvalid" | "engineUnavailable", …).
  func start(locale: String, modelDir: URL?) async throws
  /// 16 kHz mono samples.
  func feed(_ samples: [Int16]) async
  /// Flushes what's left; every segment has been delivered when it returns.
  func finish() async
}

/// The engines this helper has, and whether each can run on this Mac.
public func engineInfos() -> [EngineInfo] {
  var apple = EngineInfo(id: "apple", available: false, reason: "needs macOS 26")
  if #available(macOS 26, *) {
    apple = EngineInfo(id: "apple", available: AppleEngine.isAvailable, reason: AppleEngine.isAvailable ? nil : "not available on this Mac")
  }
  return [apple]
}

/// A new engine for `id`, or nil when this helper doesn't have it (or it can't run here).
public func makeEngine(_ id: String) -> TranscriptionEngine? {
  switch id {
  case "apple":
    if #available(macOS 26, *) { return AppleEngine() }
    return nil
  default:
    return nil
  }
}
