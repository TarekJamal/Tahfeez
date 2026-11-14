'use client';
import { useEffect, useRef, useState } from 'react';

const RATES = [0.5, 0.75, 1, 1.25, 1.5];

// مشغّل صوت يتحكم به المكوّن الأب (playing / token لإعادة التشغيل)
export default function AudioPlayer({ src, playing, setPlaying, rate, setRate, token = 0, onEnded, floating }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(0);

  const applyRate = (a) => { a.defaultPlaybackRate = rate; a.playbackRate = rate; };

  useEffect(() => { if (ref.current) applyRate(ref.current); }, [rate, src]);

  // إعادة التشغيل من البداية عند تغيّر الآية أو عند طلب التكرار
  useEffect(() => {
    const a = ref.current; if (!a) return;
    a.currentTime = 0; applyRate(a);
    if (playing) a.play().catch(() => setPlaying(false));
  }, [src, token]);

  useEffect(() => {
    const a = ref.current; if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false)); else a.pause();
  }, [playing]);

  const replay = () => { const a = ref.current; a.currentTime = 0; setPlaying(true); a.play().catch(() => {}); };

  return (
    <div className={floating
      ? 'fixed bottom-4 inset-x-4 z-50 mx-auto max-w-xl rounded-2xl border border-gold/40 bg-navy/90 p-3 text-white shadow-2xl backdrop-blur'
      : 'card p-4'}>
      <audio ref={ref} src={src} preload="auto" onEnded={onEnded}
        onTimeUpdate={(e) => setPos((e.target.currentTime / (e.target.duration || 1)) * 100)} />
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-emerald-900/20">
        <div className="h-full bg-gold transition-[width]" style={{ width: `${pos}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button className="btn-main min-w-24" onClick={() => setPlaying(!playing)}>
            {playing ? '⏸ إيقاف مؤقت' : '▶ تشغيل'}
          </button>
          <button className="btn-ghost" onClick={replay} title="إعادة الآية">🔁 إعادة الآية</button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          السرعة
          <select className="rounded-lg bg-white/90 px-2 py-1 text-slate-900" value={rate}
            onChange={(e) => setRate(Number(e.target.value))}>
            {RATES.map((r) => <option key={r} value={r}>{r}x</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
