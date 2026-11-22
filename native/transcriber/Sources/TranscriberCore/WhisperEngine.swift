import Foundation
import WhisperKit

/// One loaded Whisper per model folder, shared by both channels (it's 1.6 GB); calls are serialised.
actor WhisperModels {
  static let shared = WhisperModels()
  private var kits: [String: WhisperKit] = [:]

  func kit(_ dir: URL) async throws -> WhisperKit {
    if let k = kits[dir.path] { return k }
    let model = dir.appendingPathComponent("model")
    let tokenizer = dir.appendingPathComponent("tokenizer")
    guard FileManager.default.fileExists(atPath: model.appendingPathComponent("config.json").path),
          FileManager.default.fileExists(atPath: tokenizer.appendingPathComponent("tokenizer.json").path)
    else { throw ProtocolError("modelInvalid", "Whisper's files aren't in \(dir.path)") }
    // Never downloads: the model and tokenizer folders come from Mission Desk.
    let config = WhisperKitConfig(modelFolder: model.path, tokenizerFolder: tokenizer, verbose: false, logLevel: .error, prewarm: false, load: true, download: false)
    do {
      let k = try await WhisperKit(config)
      kits[dir.path] = k
      return k
    } catch {
      throw ProtocolError("modelInvalid", "Whisper couldn't load: \(error.localizedDescription)")
    }
  }

  func transcribe(_ kit: WhisperKit, _ samples: [Float], language: String) async throws -> [TranscriptionSegment] {
    let options = DecodingOptions(task: .transcribe, language: language, temperature: 0, usePrefillPrompt: true, detectLanguage: false, skipSpecialTokens: true, withoutTimestamps: false, noSpeechThreshold: 0.6)
    return try await kit.transcribe(audioArray: samples, decodeOptions: options).flatMap(\.segments)
  }
}

final class WhisperChunks: ChunkTranscriber, @unchecked Sendable {
  private let kit: WhisperKit
  private let language: String
  init(kit: WhisperKit, language: String) {
    self.kit = kit
    self.language = language
  }
  func transcribeChunk(_ samples: [Float]) async throws -> [EngineSegment] {
    try await WhisperModels.shared.transcribe(kit, samples, language: language).map {
      EngineSegment(start: Double($0.start), end: Double($0.end), text: $0.text.replacingOccurrences(of: #"<\|[^|]*\|>"#, with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines))
    }
  }
}

/// Whisper large-v3 turbo (WhisperKit, Core ML). The language is fixed per meeting ("pt-PT" → "pt").
public final class WhisperEngine: TranscriptionEngine, @unchecked Sendable {
  public var onSegment: ((EngineSegment) -> Void)? {
    didSet { inner?.onSegment = onSegment }
  }
  private var inner: ChunkedEngine?
  public init() {}

  public func start(locale: String, modelDir: URL?) async throws {
    guard let modelDir else { throw ProtocolError("modelInvalid", "Whisper needs its model folder") }
    let kit = try await WhisperModels.shared.kit(modelDir)
    let engine = ChunkedEngine(WhisperChunks(kit: kit, language: String(locale.prefix(while: { $0 != "-" }))))
    engine.onSegment = onSegment
    inner = engine
  }
  public func feed(_ samples: [Int16]) async { await inner?.feed(samples) }
  public func finish() async { await inner?.finish() }
}
