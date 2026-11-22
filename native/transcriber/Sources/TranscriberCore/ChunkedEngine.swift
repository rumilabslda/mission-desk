import Foundation

/// A model that transcribes a whole chunk of 16 kHz audio at once (Whisper, Parakeet).
/// Segment times are relative to the chunk's start, in seconds.
public protocol ChunkTranscriber: AnyObject, Sendable {
  func transcribeChunk(_ samples: [Float]) async throws -> [EngineSegment]
}

/**
 * Turns a chunk model into a streaming engine: audio is cut at a pause once at least 5 s of it has
 * built up (or at 25 s), silent chunks are skipped (Whisper invents text in silence), and segment
 * times are moved onto the channel's timeline. Chunks are transcribed in order, off the feed path.
 */
public final class ChunkedEngine: TranscriptionEngine, @unchecked Sendable {
  public var onSegment: ((EngineSegment) -> Void)?
  private let model: ChunkTranscriber
  private var buffer: [Float] = []
  private var bufferStart: Double = 0
  private var queue: Task<Void, Never>?
  private let rate = 16000.0
  static let minChunk = 5.0
  static let maxChunk = 25.0
  static let pause = 0.6
  static let silenceRMS: Float = 0.01

  public init(_ model: ChunkTranscriber) {
    self.model = model
  }

  public func start(locale: String, modelDir: URL?) async throws {}

  private static func rms(_ s: ArraySlice<Float>) -> Float {
    guard !s.isEmpty else { return 0 }
    return (s.reduce(0) { $0 + $1 * $1 } / Float(s.count)).squareRoot()
  }

  public func feed(_ samples: [Int16]) async {
    buffer.append(contentsOf: samples.map { Float($0) / 32768 })
    let seconds = Double(buffer.count) / rate
    if seconds >= ChunkedEngine.maxChunk {
      flush(Int(ChunkedEngine.maxChunk * rate))
    } else if seconds >= ChunkedEngine.minChunk {
      let tail = buffer.suffix(Int(ChunkedEngine.pause * rate))
      if ChunkedEngine.rms(tail) < ChunkedEngine.silenceRMS { flush(buffer.count) }
    }
  }

  private func flush(_ count: Int) {
    let chunk = Array(buffer.prefix(count))
    buffer.removeFirst(min(count, buffer.count))
    let start = bufferStart
    bufferStart += Double(chunk.count) / rate
    guard ChunkedEngine.rms(chunk[...]) >= ChunkedEngine.silenceRMS else { return }
    let previous = queue
    let model = self.model
    queue = Task { [weak self] in
      await previous?.value
      guard let segs = try? await model.transcribeChunk(chunk) else { return }
      for s in segs where !s.text.isEmpty {
        self?.onSegment?(EngineSegment(start: start + s.start, end: start + min(s.end, Double(chunk.count) / 16000), text: s.text))
      }
    }
  }

  public func finish() async {
    if !buffer.isEmpty { flush(buffer.count) }
    await queue?.value
  }
}
