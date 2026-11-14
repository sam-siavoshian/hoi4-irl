// Dictation. Two engines:
//  - 'browser': the Web Speech API (live text as you speak). Works in Safari/Chrome tabs; iOS home-screen apps may refuse it.
//  - 'eleven':  records with MediaRecorder and transcribes with ElevenLabs Scribe. Works everywhere, needs the user's key.
// When neither is available the UI falls back to the keyboard's own dictation button.

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const hasBrowserSTT = () => !!SR;
export const hasRecorder = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export function pickEngine(settings) {
  const pref = settings.voice || 'auto';
  if (pref === 'keyboard') return 'keyboard';
  if (pref === 'eleven') return settings.elevenKey && hasRecorder() ? 'eleven' : 'keyboard';
  if (pref === 'browser') return hasBrowserSTT() ? 'browser' : 'keyboard';
  const standalone = typeof window !== 'undefined' && (window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches);
  if (settings.elevenKey && hasRecorder() && (standalone || !hasBrowserSTT())) return 'eleven';
  if (hasBrowserSTT()) return 'browser';
  if (settings.elevenKey && hasRecorder()) return 'eleven';
  return 'keyboard';
}

export async function transcribeEleven(blob, key, fetchImpl = fetch) {
  const ext = /mp4|m4a|aac/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : /wav/.test(blob.type) ? 'wav' : 'webm';
  let last = 'Transcription failed';
  for (const model of ['scribe_v2', 'scribe_v1']) {
    const fd = new FormData(); fd.append('model_id', model); fd.append('file', blob, `report.${ext}`);
    const res = await fetchImpl('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: fd });
    if (res.ok) { const d = await res.json(); return (d.text || '').trim(); }
    if (res.status === 401) throw new Error('ElevenLabs key rejected — check it in Settings.');
    try { const e = await res.json(); last = e?.detail?.message || e?.detail || last; } catch { /* ignore */ }
  }
  throw new Error(typeof last === 'string' ? last : 'Transcription failed');
}

// returns a controller {stop()}; callbacks: onText(text, isFinal), onState('listening'|'transcribing'|'idle'), onError(msg, {fallback})
export function startDictation({ engine, settings, onText, onState, onError }) {
  if (engine === 'browser') {
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = settings.lang || navigator.language || 'en-US';
    let finals = '', stopped = false, gotAny = false;
    rec.onresult = e => {
      let interim = ''; gotAny = true;
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finals += r[0].transcript + ' '; else interim += r[0].transcript; }
      onText((finals + interim).replace(/\s+/g, ' ').trim(), false);
    };
    rec.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      stopped = true;
      const denied = e.error === 'not-allowed' || e.error === 'service-not-allowed';
      onError(denied ? 'Speech recognition is not allowed here. Use the microphone key on your keyboard, or add an ElevenLabs key in Settings.' : `Speech recognition error: ${e.error}`, { fallback: true });
    };
    rec.onend = () => { if (!stopped && gotAny === false) { /* ended early with nothing */ } onText(finals.trim(), true); onState('idle'); };
    try { rec.start(); onState('listening'); } catch (err) { onError('Could not start speech recognition.', { fallback: true }); onState('idle'); }
    return { stop() { stopped = true; try { rec.stop(); } catch { /* ignore */ } } };
  }
  if (engine === 'eleven') {
    let mr, stream, chunks = [], cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m));
        mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: mr.mimeType || mime || 'audio/webm' });
          if (blob.size < 800) { onState('idle'); return; }
          onState('transcribing');
          try { onText(await transcribeEleven(blob, settings.elevenKey), true); } catch (err) { onError(err.message, {}); }
          onState('idle');
        };
        mr.start(1000); onState('listening');
      } catch (err) { onError('Microphone access was denied. Allow it in Settings › Safari › Microphone, or use the keyboard microphone.', { fallback: true }); onState('idle'); }
    })();
    return { stop() { cancelled = true; if (mr && mr.state !== 'inactive') mr.stop(); } };
  }
  onState('idle');
  return { stop() {} };
}
