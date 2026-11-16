'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { audioUrl, ar, RECITERS, useLocalStorage } from '../lib/store';

export const RADIO_DEFAULT = 'https://stream.radiojar.com/8s5u5tpdtwzuv'; // إذاعة القرآن الكريم من القاهرة (قابل للتعديل من الواجهة)

export default function Listen({ quran, surahId, range, reciter }) {
  const [tab, setTab] = useState('quran');
  const [active, setActive] = useState(null); // مصدر الصوت الحالي، حتى لا يعمل مصدران معاً
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className={tab === 'quran' ? 'btn-gold' : 'btn-ghost'} onClick={() => setTab('quran')}>🎵 تلاوة متصلة</button>
        <button className={tab === 'radio' ? 'btn-gold' : 'btn-ghost'} onClick={() => setTab('radio')}>📻 إذاعة القرآن الكريم</button>
      </div>
      <div hidden={tab !== 'quran'}><Continuous {...{ quran, surahId, range, reciter, active, setActive }} /></div>
      <div hidden={tab !== 'radio'}><Radio {...{ active, setActive }} /></div>
    </div>
  );
}

function Continuous({ quran, surahId, range, reciter, active, setActive }) {
  const [follow, setFollow] = useState(true);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  // قائمة التشغيل: من بداية المدى المختار، ثم باقي السورة والسور التالية إن فُعّلت «تابع السور التالية»
  const list = useMemo(() => {
    const out = [];
    quran.forEach((s) => {
      if (s.id < surahId || (s.id > surahId && !follow)) return;
      s.ayahs.forEach((a) => {
        if (s.id === surahId && (a.n < range[0] || (!follow && a.n > range[1]))) return;
        out.push({ sid: s.id, n: a.n, name: s.name, text: a.text });
      });
    });
    return out;
  }, [quran, surahId, range[0], range[1], follow]);

  useEffect(() => { setIdx(0); setPlaying(false); }, [surahId, range[0], range[1], follow]);

  const cur = list[Math.min(idx, list.length - 1)];
  const src = audioUrl(cur.sid, cur.n, reciter);
  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), list.length - 1));

  useEffect(() => {
    const a = ref.current; a.defaultPlaybackRate = rate; a.playbackRate = rate;
    if (playing) a.play().catch(() => setPlaying(false));
  }, [src, rate]);
  useEffect(() => {
    const a = ref.current;
    if (playing) { setActive('quran'); a.play().catch(() => setPlaying(false)); } else a.pause();
  }, [playing]);
  useEffect(() => { if (active !== 'quran') setPlaying(false); }, [active]);

  // تحميل مسبق للآية التالية ليكون الانتقال سلساً
  useEffect(() => {
    const nx = list[idx + 1]; if (!nx) return;
    const p = new Audio(); p.preload = 'auto'; p.src = audioUrl(nx.sid, nx.n, reciter);
  }, [idx, list, reciter]);

  useEffect(() => { document.getElementById(`ay-${idx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [idx]);

  // أزرار التحكم على شاشة القفل / الإشعارات
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `سورة ${cur.name} — الآية ${ar(cur.n)}`,
      artist: RECITERS.find((r) => r[0] === reciter)?.[1] || '', album: 'حِفظ',
    });
    ms.setActionHandler('play', () => setPlaying(true));
    ms.setActionHandler('pause', () => setPlaying(false));
    ms.setActionHandler('nexttrack', () => go(1));
    ms.setActionHandler('previoustrack', () => go(-1));
  }, [idx, list, reciter]);

  const ended = () => {
    if (idx < list.length - 1) go(1);
    else if (loop) { if (list.length === 1) { ref.current.currentTime = 0; ref.current.play(); } else setIdx(0); }
    else setPlaying(false);
  };

  return (
    <div className="space-y-4">
      <audio ref={ref} src={src} preload="auto" onEnded={ended} />
      <div className="card p-6 text-center md:p-10">
        <p className="mb-2 text-sm opacity-70">سورة {cur.name} — الآية {ar(cur.n)} ({ar(idx + 1)} من {ar(list.length)})</p>
        <p className="font-quran text-3xl leading-[2.2] md:text-5xl">{cur.text} <span className="text-gold">﴿{ar(cur.n)}﴾</span></p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex gap-2">
          <button className="btn-ghost" disabled={idx === 0} onClick={() => go(-1)}>⏮ السابقة</button>
          <button className="btn-main min-w-28" onClick={() => setPlaying(!playing)}>{playing ? '⏸ إيقاف مؤقت' : '▶ تشغيل'}</button>
          <button className="btn-ghost" disabled={idx >= list.length - 1} onClick={() => go(1)}>الآية التالية ⏭</button>
        </div>
        <label className="flex items-center gap-2 text-sm">السرعة
          <select className="rounded-lg border bg-transparent px-2 py-1" value={rate} onChange={(e) => setRate(+e.target.value)}>
            {[0.5, 0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r} className="text-slate-900">{r}x</option>)}</select></label>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> تابع السور التالية</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> إعادة القائمة</label>
        </div>
      </div>

      <div className="card max-h-72 space-y-1 overflow-auto p-3">
        {list.map((it, k) => it.sid === cur.sid && (
          <button key={k} id={`ay-${k}`} onClick={() => { setIdx(k); setPlaying(true); }}
            className={`block w-full rounded-xl px-3 py-2 text-right font-quran text-xl transition ${k === idx ? 'bg-gold/20 text-gold' : 'hover:bg-emerald-500/10'}`}>
            <span className="ml-2 text-sm opacity-60">{ar(it.n)}</span>{it.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Radio({ active, setActive }) {
  const [url, setUrl] = useLocalStorage('hifz-radio', RADIO_DEFAULT);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');
  const ref = useRef(null);

  const stop = () => { const a = ref.current; a.pause(); a.removeAttribute('src'); a.load(); setOn(false); };
  const toggle = () => {
    if (on) return stop();
    setErr(''); const a = ref.current; a.src = url;
    a.play().then(() => { setOn(true); setActive('radio'); }).catch(() => setErr('تعذّر تشغيل البث. تأكد من الرابط أو جرّب رابطاً آخر.'));
  };
  useEffect(() => { if (active !== 'radio' && on) stop(); }, [active]);

  return (
    <div className="card space-y-4 p-6 text-center md:p-10">
      <audio ref={ref} preload="none" onError={() => { if (ref.current?.getAttribute('src')) { setErr('انقطع البث أو الرابط غير صالح.'); setOn(false); } }} />
      <div className="text-6xl">📻</div>
      <h3 className="text-2xl font-bold">إذاعة القرآن الكريم من القاهرة</h3>
      <p className="text-sm opacity-70">بث مباشر على مدار الساعة</p>
      <button className="btn-gold px-8 py-3 text-lg" onClick={toggle}>{on ? '⏹ إيقاف البث' : '▶ تشغيل الإذاعة'}</button>
      {err && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{err}</p>}
      <details className="text-right text-sm">
        <summary className="cursor-pointer opacity-70">رابط البث (إن لم يعمل غيّره)</summary>
        <div className="mt-2 flex gap-2">
          <input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 rounded-xl border border-emerald-900/20 bg-transparent p-2" />
          <button className="btn-ghost" onClick={() => setUrl(RADIO_DEFAULT)}>الافتراضي</button>
        </div>
      </details>
    </div>
  );
}
