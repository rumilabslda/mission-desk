import AVFoundation
import Foundation
import Speech

/// Apple's on-device engine (SpeechAnalyzer + SpeechTranscriber), macOS 26. Its language models
/// are managed by macOS; nothing is downloaded by this helper.
@available(macOS 26, *)
public final class AppleEngine: TranscriptionEngine, @unchecked Sendable {
  public var onSegment: ((EngineSegment) -> Void)?
  private var analyzer: SpeechAnalyzer?
  private var input: AsyncStream<AnalyzerInput>.Continuation?
  private var results: Task<Void, Never>?
  private var target: AVAudioFormat?
  private var converter: AVAudioConverter?
  private let source = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: false)!

  public init() {}

  public static var isAvailable: Bool { SpeechTranscriber.isAvailable }

  /// The locale macOS has for `tag`, when it's installed.
  static func installedLocale(for tag: String) async -> Locale? {
    guard let supported = await SpeechTranscriber.supportedLocale(equivalentTo: Locale(identifier: tag)) else { return nil }
    let id = supported.identifier(.bcp47)
    return await SpeechTranscriber.installedLocales.first { $0.identifier(.bcp47) == id }
  }

  public func start(locale: String, modelDir: URL?) async throws {
    guard let loc = await AppleEngine.installedLocale(for: locale) else {
      throw ProtocolError("localeMissing", "\(locale) isn't installed for Apple's transcription")
    }
    let transcriber = SpeechTranscriber(locale: loc, transcriptionOptions: [], reportingOptions: [], attributeOptions: [.audioTimeRange])
    let analyzer = SpeechAnalyzer(modules: [transcriber])
    let target = await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [transcriber]) ?? source
    self.target = target
    converter = target == source ? nil : AVAudioConverter(from: source, to: target)
    let (stream, continuation) = AsyncStream<AnalyzerInput>.makeStream()
    input = continuation
    self.analyzer = analyzer
    results = Task { [weak self] in
      do {
        for try await r in transcriber.results where r.isFinal {
          let text = String(r.text.characters).trimmingCharacters(in: .whitespacesAndNewlines)
          if text.isEmpty { continue }
          self?.onSegment?(EngineSegment(start: r.range.start.seconds, end: r.range.end.seconds, text: text))
        }
      } catch {
        // The analyzer ended; finish() reports nothing more.
      }
    }
    do {
      try await analyzer.prepareToAnalyze(in: target)
      try await analyzer.start(inputSequence: stream)
    } catch {
      throw ProtocolError("engineUnavailable", "Apple's transcription couldn't start: \(error.localizedDescription)")
    }
  }

  public func feed(_ samples: [Int16]) async {
    guard let input, !samples.isEmpty, let buf = AVAudioPCMBuffer(pcmFormat: source, frameCapacity: AVAudioFrameCount(samples.count)) else { return }
    buf.frameLength = AVAudioFrameCount(samples.count)
    samples.withUnsafeBufferPointer { buf.int16ChannelData![0].update(from: $0.baseAddress!, count: samples.count) }
    guard let converter, let target else {
      input.yield(AnalyzerInput(buffer: buf))
      return
    }
    let capacity = AVAudioFrameCount(Double(samples.count) * target.sampleRate / source.sampleRate) + 32
    guard let out = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }
    var given = false
    var err: NSError?
    converter.convert(to: out, error: &err) { _, status in
      if given {
        status.pointee = .noDataNow
        return nil
      }
      given = true
      status.pointee = .haveData
      return buf
    }
    if err == nil, out.frameLength > 0 { input.yield(AnalyzerInput(buffer: out)) }
  }

  public func finish() async {
    input?.finish()
    input = nil
    try? await analyzer?.finalizeAndFinishThroughEndOfInput()
    await results?.value
    analyzer = nil
  }
}
