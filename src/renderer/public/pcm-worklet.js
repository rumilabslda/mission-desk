// Mission Desk's capture page: forwards each audio quantum (mono-mixed) to the page, which batches
// 100 ms frames for the transcription helper. Runs at the AudioContext's rate (16 kHz).
class PcmForward extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input.length) {
      const n = input[0].length;
      const mono = new Float32Array(n);
      for (const ch of input) for (let i = 0; i < n; i++) mono[i] += ch[i] / input.length;
      this.port.postMessage(mono, [mono.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-forward', PcmForward);
