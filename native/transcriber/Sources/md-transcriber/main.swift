import Foundation
import TranscriberCore

// Reads one JSON command per stdin line and answers with JSON lines on stdout (see Protocol.swift).
// Lines are handled in order; audio for a channel is fed in the order it arrives.
let out = FileHandle.standardOutput
let lock = NSLock()
let session = HelperSession { line in
  lock.lock()
  out.write(Data((line + "\n").utf8))
  lock.unlock()
}

let done = DispatchSemaphore(value: 0)
Task {
  do {
    for try await line in FileHandle.standardInput.bytes.lines {
      await session.handle(line)
    }
  } catch {}
  await session.handle(#"{"type":"finish"}"#)
  done.signal()
}
done.wait()
