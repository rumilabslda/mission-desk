import Foundation
import Speech

/// One helper process's state: handles each stdin line in order and writes JSON lines back.
public actor HelperSession {
  private let write: @Sendable (String) -> Void
  private var engines: [Channel: TranscriptionEngine] = [:]

  public init(write: @escaping @Sendable (String) -> Void) {
    self.write = write
  }

  private func send(_ o: Outgoing) { write(encode(o)) }

  public func handle(_ line: String) async {
    let msg: Incoming
    do {
      msg = try decodeIncoming(line)
    } catch let e as ProtocolError {
      return send(.error(code: e.code, message: e.message))
    } catch {
      return send(.error(code: "badInput", message: "unreadable line"))
    }
    switch msg {
    case .capabilities:
      var supported: [String] = []
      var installed: [String] = []
      if #available(macOS 26, *) {
        supported = await SpeechTranscriber.supportedLocales.map { $0.identifier(.bcp47) }.sorted()
        installed = await SpeechTranscriber.installedLocales.map { $0.identifier(.bcp47) }.sorted()
      }
      send(.capabilities(engines: engineInfos(), appleSupported: supported, appleInstalled: installed))

    case let .start(engine, locale, modelDir):
      await finishAll(report: false)
      do {
        var made: [Channel: TranscriptionEngine] = [:]
        for ch in Channel.allCases {
          guard let e = makeEngine(engine) else { throw ProtocolError("engineUnavailable", "\(engine) isn't available") }
          e.onSegment = { [write] s in
            write(encode(.segment(ch, start: Int((s.start * 1000).rounded()), end: Int((s.end * 1000).rounded()), text: s.text)))
          }
          try await e.start(locale: locale, modelDir: modelDir.map { URL(fileURLWithPath: $0) })
          made[ch] = e
        }
        engines = made
        send(.ready)
      } catch let e as ProtocolError {
        send(.error(code: e.code, message: e.message))
      } catch {
        send(.error(code: "internal", message: error.localizedDescription))
      }

    case let .audio(ch, samples):
      await engines[ch]?.feed(samples)

    case .finish:
      await finishAll(report: true)

    case let .installLocale(tag):
      await installLocale(tag)

    case let .releaseLocale(tag):
      if #available(macOS 26, *), let loc = await SpeechTranscriber.supportedLocale(equivalentTo: Locale(identifier: tag)) {
        _ = await AssetInventory.release(reservedLocale: loc)
      }
    }
  }

  private func finishAll(report: Bool) async {
    let running = engines
    engines = [:]
    for e in running.values { await e.finish() }
    if report { send(.finished) }
  }

  private func installLocale(_ tag: String) async {
    guard #available(macOS 26, *) else { return send(.error(code: "engineUnavailable", message: "needs macOS 26")) }
    guard let loc = await SpeechTranscriber.supportedLocale(equivalentTo: Locale(identifier: tag)) else {
      return send(.error(code: "localeMissing", message: "\(tag) isn't supported"))
    }
    do {
      _ = try await AssetInventory.reserve(locale: loc)
      let module = SpeechTranscriber(locale: loc, preset: .transcription)
      if let request = try await AssetInventory.assetInstallationRequest(supporting: [module]) {
        let progress = request.progress
        let watcher = Task { [write] in
          while !Task.isCancelled {
            write(encode(.localeProgress(tag, progress.fractionCompleted)))
            try? await Task.sleep(nanoseconds: 500_000_000)
          }
        }
        defer { watcher.cancel() }
        try await request.downloadAndInstall()
      }
      send(.localeInstalled(tag))
    } catch {
      send(.error(code: "localeMissing", message: "\(tag) couldn't be installed: \(error.localizedDescription)"))
    }
  }
}
