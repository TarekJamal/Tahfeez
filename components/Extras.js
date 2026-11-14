'use client';
import { useEffect, useState } from 'react';
import { ar } from '../lib/store';

const pick = (n, level) => {
  const s = new Set(); const k = Math.min(n, Math.max(1, Math.round((n * level) / 100)));
  while (s.size < k) s.add(Math.floor(Math.random() * n));
  return s;
};

// وضع الغميضة: كلمات مخفية عشوائياً، اضغط على الفراغ لكشفه بعد أن تتذكره
export function HideSeek({ ayahs }) {
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(40);
  const [hidden, setHidden] = useState(new Set());
  const [shown, setShown] = useState(new Set());
  const ayah = ayahs[Math.min(idx, ayahs.length - 1)];
  const words = ayah.text.split(' ');

  const shuffle = () => { setHidden(pick(words.length, level)); setShown(new Set()); };
  useEffect(shuffle, [ayah.text, level]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4 p-4 text-sm">
        <label>الآية: <select className="rounded-lg border bg-transparent px-2 py-1" value={idx} onChange={(e) => setIdx(+e.target.value)}>
          {ayahs.map((a, k) => <option key={a.n} value={k} className="text-slate-900">{ar(a.n)}</option>)}</select></label>
        <label className="flex items-center gap-2">نسبة الإخفاء {ar(level)}٪
          <input type="range" min="20" max="90" step="10" value={level} onChange={(e) => setLevel(+e.target.value)} /></label>
        <button className="btn-gold" onClick={shuffle}>🎲 إخفاء جديد</button>
      </div>
      <div className="card p-6 text-center md:p-12">
        <p className="font-quran text-3xl leading-[2.6] md:text-5xl">
          {words.map((w, k) => hidden.has(k) && !shown.has(k) ? (
            <button key={k} onClick={() => setShown(new Set(shown).add(k))}
              className="mx-1 inline-block h-9 rounded-lg border-2 border-dashed border-gold align-middle"
              style={{ width: `${Math.max(2.5, w.length * 0.6)}rem` }} aria-label="كلمة مخفية" />
          ) : <span key={k} className={`mx-1 inline-block ${hidden.has(k) ? 'text-gold' : ''}`}>{w}</span>)}
        </p>
        <p className="mt-4 text-sm opacity-70">اقرأ الآية وأكمل الفراغات من حفظك، ثم اضغط على الفراغ للتحقق.</p>
      </div>
    </div>
  );
}

// طريقة الربط: قصة أو ملاحظة تربط نهاية آية ببداية التي بعدها
export function LinkNotes({ surah, ayahs, notes, setNote }) {
  const pairs = ayahs.filter((a) => surah.ayahs.some((b) => b.n === a.n + 1));
  if (!pairs.length) return <p className="card p-6">اختر مدى فيه أكثر من آية لعمل روابط بينها.</p>;
  return (
    <div className="space-y-4">
      {pairs.map((a) => {
        const nx = surah.ayahs.find((b) => b.n === a.n + 1);
        const key = `${surah.id}:${a.n}`;
        return (
          <div key={key} className="card space-y-3 p-5">
            <p className="font-quran text-2xl">
              <span className="text-gold">{a.text.split(' ').at(-1)}</span> ← <span className="text-emerald-500">{nx.text.split(' ')[0]}</span>
            </p>
            <p className="text-sm opacity-70">من نهاية الآية {ar(a.n)} إلى بداية الآية {ar(nx.n)}</p>
            <textarea rows={2} value={notes[key] || ''} onChange={(e) => setNote(key, e.target.value)}
              placeholder="اكتب قصة قصيرة أو صورة ذهنية تربط الكلمتين…"
              className="w-full rounded-xl border border-emerald-900/20 bg-transparent p-3 outline-none focus:ring-2 focus:ring-gold" />
          </div>
        );
      })}
    </div>
  );
}
