// Keep route readings separate from visible names and photo/source records.
const ROUTE_READINGS = [
  ["山手線", "やまのてせん"],
  ["常磐線", "じょうばんせん"],
  ["京葉線", "けいようせん"],
  ["総武線", "そうぶせん"],
  ["京浜東北線", "けいひんとうほくせん"],
  ["横須賀線", "よこすかせん"],
];

/** Supply explicit route readings while preserving color cues, series and livery. */
function pronunciationText(text) {
  return ROUTE_READINGS.reduce(
    (reading, [name, kana]) => reading.replaceAll(name, kana),
    text,
  );
}

/** Read short queues using a device-local Japanese voice, invalidating stale events. */
export function createSpeechPlayer(view, onState = () => {}) {
  const synth = view?.speechSynthesis;
  const Utterance = view?.SpeechSynthesisUtterance;
  const supported = Boolean(synth?.speak && synth?.cancel && synth?.getVoices && Utterance);
  let generation = 0;
  let queue = [];
  let timeout = null;
  // Some browsers start loading their voice list only after the first query.
  if (supported) {
    try { synth.getVoices(); } catch { /* Retry from the next user gesture. */ }
  }

  /** Release the watchdog without touching another playback's callbacks. */
  function clearWatchdog() {
    if (timeout !== null) view.clearTimeout(timeout);
    timeout = null;
  }

  /** Cancel queued audio before changing screens or replacing the requested names. */
  function stop() {
    generation += 1;
    clearWatchdog();
    if (queue.length) synth.cancel();
    queue = [];
    onState({ status: "idle", activeId: null });
  }

  /** Clear the entire queue on failure so a later choice cannot speak unexpectedly. */
  function fail(status) {
    stop();
    onState({ status, activeId: null });
  }

  /** Recover when a browser reports neither start nor error (e.g. blocked audio). */
  function watch(token, milliseconds) {
    clearWatchdog();
    if (!view?.setTimeout) return;
    timeout = view.setTimeout(() => {
      if (token === generation) fail("error");
    }, milliseconds);
  }

  /** Enqueue in the user gesture; use start events, not estimates, for highlighting. */
  function play(items) {
    stop();
    if (!supported) return fail("unsupported");
    if (!items.length) return;
    const token = generation;
    try {
      const voice = synth.getVoices().find(
        (entry) => /^ja(?:[-_]|$)/i.test(entry.lang) && entry.localService === true,
      );
      if (!voice) return fail("unavailable");
      queue = items.map((item, index) => {
        const utterance = new Utterance(pronunciationText(item.text));
        utterance.lang = "ja-JP";
        utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.onstart = () => {
          if (token !== generation) return;
          watch(token, 30000);
          onState({ status: "speaking", activeId: item.id });
        };
        utterance.onend = () => {
          if (token !== generation) return;
          if (index === items.length - 1) {
            clearWatchdog();
            queue = [];
            onState({ status: "idle", activeId: null });
          } else {
            watch(token, 8000);
            onState({ status: "loading", activeId: null });
          }
        };
        utterance.onerror = () => {
          if (token === generation) fail("error");
        };
        return utterance;
      });
      onState({ status: "loading", activeId: null });
      watch(token, 8000);
      for (const utterance of queue) {
        if (token !== generation) break;
        synth.speak(utterance);
      }
    } catch {
      fail("error");
    }
  }

  return { supported, play, stop };
}
