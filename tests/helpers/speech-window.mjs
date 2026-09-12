/** Stub only the OS speech boundary; lifecycle events are driven explicitly. */
export function createSpeechWindow() {
  const utterances = [];
  const stored = new Map();
  const synth = {
    voices: [{ lang: "ja-JP", localService: true, name: "Japanese" }],
    getVoices() { return this.voices; },
    speak(utterance) { utterances.push(utterance); },
    cancelCount: 0,
    cancel() { this.cancelCount += 1; },
    addEventListener() {},
  };
  return {
    utterances,
    speechSynthesis: synth,
    SpeechSynthesisUtterance: class {
      constructor(text) { this.text = text; }
    },
    localStorage: {
      getItem(key) { return stored.get(key) ?? null; },
      setItem(key, value) { stored.set(key, value); },
    },
  };
}

