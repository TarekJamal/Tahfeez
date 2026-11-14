'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuran } from '../lib/useQuran';
import { useLocalStorage, ar, RECITERS, INTERVALS, addDays, isDue } from '../lib/store';
import Review from '../components/Review';
import MemorizationEngine from '../components/MemorizationEngine';
import Dashboard from '../components/Dashboard';
import { HideSeek, LinkNotes } from '../components/Extras';

const NAV = [['engine', '🎧', 'محرك الحفظ'], ['hide', '🙈', 'الغميضة'], ['notes', '🔗', 'طريقة الربط'], ['review', '🧠', 'المراجعة'], ['dash', '📊', 'تقدّمي']];

export default function App() {
  const { quran, status } = useQuran();
  const [data, setData] = useLocalStorage('hifz-v1', { memorized: {}, days: [], notes: {}, reviews: {} });
  const [reciter, setReciter] = useLocalStorage('hifz-reciter', 'Alafasy_128kbps');
  const [theme, setTheme] = useLocalStorage('hifz-theme', 'dark');
  const [view, setView] = useState('engine');
  const [surahId, setSurahId] = useState(112);
  const [range, setRange] = useState([1, 4]);
  const [repeats, setRepeats] = useState(5);
  const [focus, setFocus] = useState(false);

  const surah = quran.find((s) => s.id === surahId);
  const ayahs = surah.ayahs.filter((a) => a.n >= range[0] && a.n <= range[1]);
  const nums = surah.ayahs.map((a) => a.n);
  const dueCount = Object.keys(data.memorized).filter((k) => isDue(data.reviews, k)).length;

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  const changeSurah = (id) => { setSurahId(id); setRange([1, quran.find((s) => s.id === id).ayahs.length]); };
  const setFrom = (v) => setRange([v, Math.max(v, range[1])]);
  const setTo = (v) => setRange([Math.min(range[0], v), v]);

  const onMemorized = (n) => setData((d) => ({
    ...d,
    memorized: { ...d.memorized, [`${surahId}:${n}`]: true },
    days: d.days.includes(addDays(0)) ? d.days : [...d.days, addDays(0)],
    reviews: { ...d.reviews, [`${surahId}:${n}`]: { box: 0, due: addDays(INTERVALS[0]) } },
  }));
  // نتيجة المراجعة: تذكّر ← صندوق أعلى وفاصل أطول، نسيان ← العودة للصندوق الأول
  const grade = (k, ok) => setData((d) => {
    const box = ok ? Math.min((d.reviews?.[k]?.box || 0) + 1, INTERVALS.length - 1) : 0;
    return { ...d, reviews: { ...d.reviews, [k]: { box, due: addDays(INTERVALS[box]) } },
      days: d.days.includes(addDays(0)) ? d.days : [...d.days, addDays(0)] };
  });
  const setNote = (k, v) => setData((d) => ({ ...d, notes: { ...d.notes, [k]: v } }));

  const engine = (f) => (
    <MemorizationEngine surah={surah} ayahs={ayahs} repeats={repeats} memorized={data.memorized} onMemorized={onMemorized} focus={f} reciter={reciter} />
  );

  // وضع التركيز: النص + مشغّل عائم فقط
  if (focus) return (
    <div className="fixed inset-0 z-40 overflow-auto bg-stone-50 p-6 pb-32 dark:bg-navy">
      <button className="btn-ghost mb-4" onClick={() => setFocus(false)}>✕ خروج من وضع التركيز</button>
      <div className="mx-auto max-w-4xl">{engine(true)}</div>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="space-y-5 bg-gradient-to-b from-emerald-900 to-navy p-4 text-white print:hidden md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="font-quran text-4xl text-gold">حِفظ</h1>
          <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>

        <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
          {{ sample: '📖 النسخة التجريبية (٤ سور)', loading: '⏳ جارٍ تحميل المصحف كاملاً…', offline: '⚠️ تعذّر تحميل المصحف — تعمل النسخة التجريبية (٤ سور)', full: '✅ المصحف كاملاً — ١١٤ سورة' }[status]}
        </p>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {NAV.map(([id, ic, label]) => (
            <button key={id} onClick={() => setView(id)}
              className={`rounded-xl px-3 py-2 text-right text-sm font-bold transition ${view === id ? 'bg-gold text-navy' : 'hover:bg-white/10'}`}>
              {ic} {label}{id === 'review' && dueCount > 0 && <span className="mr-2 rounded-full bg-red-500 px-2 text-xs text-white">{ar(dueCount)}</span>}
            </button>
          ))}
        </nav>

        <div className="space-y-3 text-sm">
          <label className="block">السورة
            <select className="field mt-1" value={surahId} onChange={(e) => changeSurah(+e.target.value)}>
              {quran.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-2">
            <label>من آية<select className="field mt-1" value={range[0]} onChange={(e) => setFrom(+e.target.value)}>
              {nums.map((n) => <option key={n} value={n}>{ar(n)}</option>)}</select></label>
            <label>إلى آية<select className="field mt-1" value={range[1]} onChange={(e) => setTo(+e.target.value)}>
              {nums.filter((n) => n >= range[0]).map((n) => <option key={n} value={n}>{ar(n)}</option>)}</select></label>
          </div>
          <label className="block">القارئ
            <select className="field mt-1" value={reciter} onChange={(e) => setReciter(e.target.value)}>
              {RECITERS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="block">عدد التكرارات: {ar(repeats)}
            <input type="range" min="1" max="20" value={repeats} onChange={(e) => setRepeats(+e.target.value)} className="mt-1 w-full accent-yellow-500" /></label>
        </div>

        <button className="btn-gold w-full" onClick={() => { setView('engine'); setFocus(true); }}>🧘 وضع التركيز</button>
      </aside>

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 pb-16 md:p-8">
        <h2 className="mb-5 font-quran text-3xl print:hidden">
          {view === 'dash' ? 'لوحة التقدّم' : view === 'review' ? 'مراجعة اليوم' : `سورة ${surah.name}`}
        </h2>
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {view === 'engine' && engine(false)}
            {view === 'hide' && <HideSeek ayahs={ayahs} />}
            {view === 'notes' && <LinkNotes surah={surah} ayahs={ayahs} notes={data.notes} setNote={setNote} />}
            {view === 'review' && <Review quran={quran} data={data} reciter={reciter} grade={grade} />}
            {view === 'dash' && <Dashboard data={data} quran={quran} full={status === 'full'} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
