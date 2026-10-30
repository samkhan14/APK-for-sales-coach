// Native mic + speaker for the voice spike, via react-native-audio-api (needs an EAS/dev build; not Expo Go).
// TODO(unverified on device): sample-rate negotiation, echo cancellation on Android speakerphone,
// and gapless playback have not been tested on a real phone yet.
import { AudioContext, AudioManager, AudioRecorder, type AudioBufferSourceNode } from "react-native-audio-api";
import { downsample, pcm16Base64ToFloat } from "./pcm";

export async function ensureMicPermission(): Promise<boolean> {
  const status = await AudioManager.requestRecordingPermissions();
  if (status !== "Granted") return false;
  // iOS: voiceChat mode turns on the system echo canceller. Android: TODO verify AEC on speakerphone.
  AudioManager.setAudioSessionOptions({
    iosCategory: "playAndRecord",
    iosMode: "voiceChat",
    iosOptions: ["defaultToSpeaker", "allowBluetoothHFP"],
  });
  return true;
}

/** Streams mono 16 kHz Float32 chunks (~100 ms each) from the microphone. */
export class MicStream {
  private recorder = new AudioRecorder();

  start(onChunk: (pcm16k: Float32Array, chunkMs: number) => void) {
    const reg = this.recorder.onAudioReady({ sampleRate: 16000, bufferLength: 1600, channelCount: 1 }, e => {
      const data = e.buffer.getChannelData(0);
      const rate = e.buffer.sampleRate;
      onChunk(downsample(data, rate, 16000), (data.length / rate) * 1000);
    });
    if (reg.status === "error") throw new Error(reg.message);
    const res = this.recorder.start();
    if (res.status === "error") throw new Error(res.message);
  }

  stop() {
    try { this.recorder.clearOnAudioReady(); } catch { /* ignore */ }
    try { if (this.recorder.isRecording()) this.recorder.stop(); } catch { /* ignore */ }
  }
}

/** Gapless queue for PCM16 chunks; stopAll() is the barge-in "shut up now". */
export class PcmPlayer {
  private ctx = new AudioContext({ sampleRate: 24000 });
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  get isPlaying() { return this.ctx.currentTime < this.nextTime - 0.01; }

  enqueue(pcm16Base64: string, sampleRate = 24000) {
    const f = pcm16Base64ToFloat(pcm16Base64);
    if (!f.length) return;
    const buf = this.ctx.createBuffer(1, f.length, sampleRate);
    buf.copyToChannel(f, 0);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    const at = Math.max(this.ctx.currentTime + 0.03, this.nextTime);
    src.start(at);
    this.nextTime = at + f.length / sampleRate;
    this.sources.add(src);
    src.onEnded = () => { this.sources.delete(src); };
  }

  /** Resolves once everything queued so far has played (or was stopped). */
  async drain(): Promise<void> {
    while (this.isPlaying) await new Promise(r => setTimeout(r, 50));
  }

  stopAll() {
    for (const s of this.sources) { try { s.stop(); } catch { /* already stopped */ } }
    this.sources.clear();
    this.nextTime = 0;
  }

  async close() {
    this.stopAll();
    try { await this.ctx.close(); } catch { /* ignore */ }
  }
}
