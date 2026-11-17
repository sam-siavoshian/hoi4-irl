// Dictation.
//  - 'server':  record with MediaRecorder, transcribe on the private server (the speech model chosen in Settings). Best accuracy.
//  - 'browser': the browser's own speech recognition, used when the server has no speech model ("On this device").
//  - 'keyboard': the keyboard's dictation key.
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const hasRecorder = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export function pickEngine(cfg) {
  if (cfg?.transcribe && hasRecorder()) return 'server';
  if (SR) return 'browser';
  return 'keyboard';
}
// A speech server that takes WAV only (whisper.cpp's, KoboldCpp's, Ollama's) gets the recording as 16 kHz mono WAV,
// decoded and resampled here in the browser.
export async function toWav(blob) {
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!AC) return blob;
  const decoded = await new (window.AudioContext || window.webkitAudioContext)().decodeAudioData(await blob.arrayBuffer());
  const rate = 16000, n = Math.max(1, Math.ceil(decoded.duration * rate)), ctx = new AC(1, n, rate);
  const src = ctx.createBufferSource(); src.buffer = decoded; src.connect(ctx.destination); src.start();
  const pcm = (await ctx.startRendering()).getChannelData(0), out = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, t) => { for (let i = 0; i < t.length; i++) out.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
  return new Blob([out.buffer], { type: 'audio/wav' });
}
export async function transcribe(blob, fetchImpl = fetch, { wav = false } = {}) {
  if (wav && blob.type !== 'audio/wav') { try { blob = await toWav(blob); } catch { /* send it as it is: the server says what it thinks */ } }
  const res = await fetchImpl('api/transcribe', { method: 'POST', headers: { 'content-type': blob.type || 'audio/webm' }, body: blob });
  let data = null; try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(res.status === 401 ? 'Signed out — reload and log in again.' : data?.error || 'Transcription failed');
  return data.text || '';
}

// returns {stop()}; callbacks: onText(text), onState('listening'|'transcribing'|'idle'), onError(msg, {fallback})
export function startDictation({ engine, wav = false, onText, onState, onError }) {
  if (engine === 'browser') {
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-US';
    let finals = '';
    rec.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finals += r[0].transcript + ' '; else interim += r[0].transcript; } onText((finals + interim).replace(/\s+/g, ' ').trim()); };
    rec.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') return; onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Speech recognition is not allowed here. Use the microphone key on your keyboard.' : `Speech recognition error: ${e.error}`, { fallback: true }); };
    rec.onend = () => { onText(finals.trim()); onState('idle'); };
    try { rec.start(); onState('listening'); } catch { onError('Could not start speech recognition.', { fallback: true }); onState('idle'); }
    return { stop() { try { rec.stop(); } catch { /* ignore */ } } };
  }
  if (engine === 'server') {
    let mr, stream, chunks = [], cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m));
        mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
        mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: (mr.mimeType || mime || 'audio/webm').split(';')[0] });
          if (blob.size < 800) { onState('idle'); return; }
          onState('transcribing');
          try { onText(await transcribe(blob, fetch, { wav })); } catch (err) { onError(err.message, {}); }
          onState('idle');
        };
        mr.start(1000); onState('listening');
      } catch { onError('Microphone access was denied. Allow it for this site, or use the keyboard microphone.', { fallback: true }); onState('idle'); }
    })();
    return { stop() { cancelled = true; if (mr && mr.state !== 'inactive') mr.stop(); } };
  }
  onState('idle');
  return { stop() {} };
}
