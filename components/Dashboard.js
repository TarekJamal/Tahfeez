'use client';
import { motion } from 'framer-motion';
import { ar, calcStreak } from '../lib/store';

export default function Dashboard({ data, quran, full }) {
  const total = Object.keys(data.memorized).length;
  const all = quran.reduce((s, x) => s + x.ayahs.length, 0);
  const pct = Math.round((total / all) * 100) || 0;
  const streak = calcStreak(data.days);
  const per = quran.map((s) => ({ ...s, done: s.ayahs.filter((a) => data.memorized[`${s.id}:${a.n}`]).length }));
  const fullSurahs = per.filter((s) => s.done === s.ayahs.length).length;
  // تقدّم الأجزاء الثلاثين (يُحسب فقط مع المصحف الكامل)
  const jt = Array(31).fill(0), jd = Array(31).fill(0);
  if (full) quran.forEach((s) => s.ayahs.forEach((a) => { jt[a.juz]++; if (data.memorized[`${s.id}:${a.n}`]) jd[a.juz]++; }));
  const juz = full ? Array.from({ length: 30 }, (_, k) => ({ j: k + 1, t: jt[k + 1], d: jd[k + 1] })) : [];
  const juzDone = juz.filter((x) => x.t && x.d === x.t).length;
  const shownSurahs = full ? per.filter((s) => s.done > 0) : per;
  const printed = per.filter((s) => s.done > 0 || s.ayahs.some((a) => data.notes[`${s.id}:${a.n}`]));
  const notesCount = Object.values(data.notes).filter(Boolean).length;

  const badges = [
    { t: 'أول آية', i: '🌱', ok: total >= 1 },
    { t: 'عشر آيات', i: '⭐', ok: total >= 10 },
    { t: 'سورة كاملة', i: '📖', ok: fullSurahs >= 1 },
    { t: 'ثلاثة أيام متتالية', i: '🔥', ok: streak >= 3 },
    { t: 'صانع الروابط', i: '🔗', ok: notesCount >= 1 },
    { t: 'ختم جزء كامل', i: '👑', ok: juzDone >= 1 },
    { t: 'خمسة أجزاء', i: '🏆', ok: juzDone >= 5 },
    { t: 'ختم القرآن', i: '🌙', ok: full && total >= all },
  ];

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="grid grid-cols-3 gap-3">
          {[['آيات محفوظة', ar(total)], ['أيام متتالية 🔥', ar(streak)], ['سور مكتملة', ar(fullSurahs)]].map(([l, v]) => (
            <div key={l} className="card p-4 text-center"><div className="text-3xl font-bold text-gold">{v}</div><div className="text-xs opacity-70">{l}</div></div>
          ))}
        </div>

        <div className="card p-5">
          <div className="mb-2 flex justify-between text-sm"><span>التقدّم العام</span><span>{ar(pct)}٪</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-emerald-900/20">
            <motion.div className="h-full bg-gradient-to-l from-emerald-500 to-gold" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
          </div>
          <div className="mt-4 space-y-2">
            {shownSurahs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-16">{s.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-900/20">
                  <div className="h-full bg-emerald-500" style={{ width: `${(s.done / s.ayahs.length) * 100}%` }} />
                </div>
                <span className="w-12 text-left opacity-70">{ar(s.done)}/{ar(s.ayahs.length)}</span>
              </div>
            ))}
          </div>
        </div>

        {full && (
          <div className="card p-5">
            <h3 className="mb-3 font-bold">الأجزاء الثلاثون</h3>
            <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
              {juz.map((x) => {
                const p = Math.round((x.d / x.t) * 100) || 0;
                return (
                  <div key={x.j} title={`${p}%`} className="rounded-xl border border-gold/30 p-2 text-center text-xs"
                    style={{ background: `linear-gradient(to top, rgba(212,175,55,.4) ${p}%, transparent ${p}%)` }}>
                    <div className="font-bold">{ar(x.j)}</div><div className="opacity-70">{ar(p)}٪</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-5">
          <h3 className="mb-3 font-bold">الأوسمة</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {badges.map((b) => (
              <div key={b.t} className={`rounded-2xl border p-4 text-center ${b.ok ? 'border-gold bg-gold/10' : 'opacity-40 grayscale'}`}>
                <div className="text-3xl">{b.i}</div><div className="mt-1 text-sm">{b.t}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-gold" onClick={() => window.print()}>📄 تصدير تقريري PDF</button>
      </div>

      {/* نسخة الطباعة / PDF */}
      <section className="hidden text-black print:block">
        <h1 className="mb-1 text-3xl font-bold">تقرير الحفظ</h1>
        <p className="mb-6">{ar(total)} آية محفوظة ({ar(pct)}٪) — سلسلة {ar(streak)} أيام</p>
        {printed.map((s) => (
          <div key={s.id} className="mb-5 break-inside-avoid">
            <h2 className="border-b border-black text-xl font-bold">سورة {s.name} ({ar(s.done)}/{ar(s.ayahs.length)})</h2>
            {s.ayahs.map((a) => {
              const k = `${s.id}:${a.n}`;
              return (data.memorized[k] || data.notes[k]) && (
                <p key={k} className="my-2">
                  <span className="font-quran text-xl">{a.text} ﴿{ar(a.n)}﴾ {data.memorized[k] ? '✓' : ''}</span>
                  {data.notes[k] && <span className="block text-sm">🔗 {data.notes[k]}</span>}
                </p>
              );
            })}
          </div>
        ))}
      </section>
    </>
  );
}
