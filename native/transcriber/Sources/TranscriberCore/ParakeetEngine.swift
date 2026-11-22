import FluidAudio
import Foundation

/// One loaded Parakeet per model folder, shared by both channels (AsrManager is an actor).
actor ParakeetModels {
  static let shared = ParakeetModels()
  private var managers: [String: AsrManager] = [:]

  func manager(_ dir: URL) async throws -> AsrManager {
    if let m = managers[dir.path] { return m }
    do {
      // Loads only from this folder: nothing is downloaded.
      let models = try AsrModels.loadLocal(from: dir, version: .v3)
      let m = AsrManager(config: .default, models: models)
      managers[dir.path] = m
      return m
    } catch {
      throw ProtocolError("modelInvalid", "Parakeet couldn't load: \(error.localizedDescription)")
    }
  }
}

final class ParakeetChunks: ChunkTranscriber, @unchecked Sendable {
  private let manager: AsrManager
  init(manager: AsrManager) { self.manager = manager }
  func transcribeChunk(_ samples: [Float]) async throws -> [EngineSegment] {
    var state = TdtDecoderState.make()
    let r = try await manager.transcribe(samples, decoderState: &state)
    let text = r.text.trimmingCharacters(in: .whitespacesAndNewlines)
    return text.isEmpty ? [] : [EngineSegment(start: 0, end: Double(samples.count) / 16000, text: text)]
  }
}

/// Parakeet TDT 0.6B v3 (FluidAudio, Core ML): multilingual, finds the language itself.
public final class ParakeetEngine: TranscriptionEngine, @unchecked Sendable {
  public var onSegment: ((EngineSegment) -> Void)? {
    didSet { inner?.onSegment = onSegment }
  }
  private var inner: ChunkedEngine?
  public init() {}

  public func start(locale: String, modelDir: URL?) async throws {
    guard let modelDir else { throw ProtocolError("modelInvalid", "Parakeet needs its model folder") }
    let engine = ChunkedEngine(ParakeetChunks(manager: try await ParakeetModels.shared.manager(modelDir)))
    engine.onSegment = onSegment
    inner = engine
  }
  public func feed(_ samples: [Int16]) async { await inner?.feed(samples) }
  public func finish() async { await inner?.finish() }
}
