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
const sentence = m => /[.!?]$/.test(m) ? m : `${m}.`;
export const MAX_SECONDS = 600; // 10 minutes; ~5 MB at 64 kbps, well under the 25 MB upload limit
// hints = { prompt, keywords[] }: context and names that help the model spell things right
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
// hints.wav: the speech server takes WAV only (GET /api/config says so)
export async function transcribe(blob, hints = {}, fetchImpl = fetch) {
  if (hints.wav && blob.type !== 'audio/wav') { try { blob = await toWav(blob); } catch { /* send it as it is: the server says what it thinks */ } }
  const q = new URLSearchParams(); if (hints.prompt) q.set('prompt', hints.prompt); for (const k of hints.keywords || []) q.append('k', k);
  const res = await fetchImpl(`api/transcribe${q.size ? '?' + q : ''}`, { method: 'POST', headers: { 'content-type': blob.type || 'audio/webm' }, body: blob });
  let data = null; try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(res.status === 401 ? 'Signed out — reload and log in again.' : data?.error || 'Transcription failed');
  return data.text || '';
}

// Names the user has mentioned before (capitalised words not at the start of a sentence), so the model spells them the same way.
export function namesFrom(texts, max = 40) {
  const n = new Map();
  for (const t of texts) for (const m of String(t || '').matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]+)?)\b/g)) if (!/^(I|I'm|I've|The|This|That|Then|And|But|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/.test(m[1])) n.set(m[1], (n.get(m[1]) || 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}

// Keep the screen on while recording: if the phone auto-locks, iOS mutes the microphone and the rest of the report is lost.
function wakeLock() {
  let lock = null, on = true;
  const take = async () => { try { if (on && document.visibilityState === 'visible' && navigator.wakeLock) lock = await navigator.wakeLock.request('screen'); } catch { /* not supported or refused: recording still works */ } };
  const again = () => { if (document.visibilityState === 'visible') take(); };
  take(); document.addEventListener('visibilitychange', again);
  return () => { on = false; document.removeEventListener('visibilitychange', again); lock?.release().catch(() => {}); lock = null; };
}

// returns {stop()}; callbacks: onText(text), onState('listening'|'transcribing'|'idle', {seconds}), onError(msg, {fallback, audio})
// audio (on a failed transcription) is the recording, kept so it can be sent again with retryTranscription().
export function startDictation({ engine, onText, onState, onError, hints = {} }) {
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
    let mr, stream, chunks = [], cancelled = false, stopping = false, releaseLock = () => {}, tick = null, started = 0, stopNote = '';
    const end = note => { // stop recording; a short tail so the last words are not clipped
      if (stopping || !mr || mr.state === 'inactive') return; stopping = true; stopNote = note || '';
      setTimeout(() => { if (mr.state !== 'inactive') mr.stop(); }, note ? 0 : 400);
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') end('Recording stopped when you left the app. What you said before that is kept. Tap the microphone to add more.'); };
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m));
        mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
        mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        const track = stream.getAudioTracks()[0];
        if (track) { track.onmute = () => end('The microphone was cut off (screen locked or another app took it). What you said before that is kept. Tap the microphone to add more.'); track.onended = () => end('The microphone was disconnected. What you said before that is kept.'); }
        mr.onstop = async () => {
          clearInterval(tick); releaseLock(); document.removeEventListener('visibilitychange', onHidden);
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: (mr.mimeType || mime || 'audio/webm').split(';')[0] });
          if (blob.size < 800) { if (stopNote) onError(stopNote, {}); onState('idle'); return; }
          onState('transcribing');
          try { onText(await transcribe(blob, hints)); if (stopNote) onError(stopNote, {}); }
          catch (err) { onError(`${sentence(err.message)} Your recording is kept: tap Retry.`, { audio: blob }); }
          onState('idle');
        };
        mr.start(1000); started = Date.now(); releaseLock = wakeLock(); document.addEventListener('visibilitychange', onHidden);
        onState('listening', { seconds: 0 });
        tick = setInterval(() => { const sec = Math.floor((Date.now() - started) / 1000); if (sec >= MAX_SECONDS) end(`Stopped at the ${MAX_SECONDS / 60}-minute limit. Tap the microphone to keep going.`); else onState('listening', { seconds: sec }); }, 1000);
      } catch { onError('Microphone access was denied. Allow it for this site, or use the keyboard microphone.', { fallback: true }); onState('idle'); }
    })();
    return { stop() { cancelled = true; end(); } };
  }
  onState('idle');
  return { stop() {} };
}
// send a recording again after a failed transcription (network blip, server restart)
export async function retryTranscription(blob, hints, { onText, onState, onError }) {
  onState('transcribing');
  try { onText(await transcribe(blob, hints)); } catch (err) { onError(`${sentence(err.message)} Your recording is still kept: tap Retry.`, { audio: blob }); }
  onState('idle');
}
