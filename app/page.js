'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuran } from '../lib/useQuran';
import { useLocalStorage, ar, RECITERS, INTERVALS, addDays, isDue } from '../lib/store';
import Review from '../components/Review';
import Listen from '../components/Listen';
import MemorizationEngine from '../components/MemorizationEngine';
import Dashboard from '../components/Dashboard';
import InstallButton from '../components/InstallButton';
import { HideSeek, LinkNotes } from '../components/Extras';

// id, أيقونة، الاسم الكامل (سطح المكتب)، الاسم القصير (شريط الهاتف)
const VIEWS = [
  ['engine', '🎧', 'محرك الحفظ', 'الحفظ'], ['listen', '🎵', 'استماع وراديو', 'استماع'],
  ['review', '🧠', 'المراجعة', 'مراجعة'], ['dash', '📊', 'تقدّمي', 'تقدّمي'],
  ['hide', '🙈', 'الغميضة', 'الغميضة'], ['notes', '🔗', 'طريقة الربط', 'الربط'],
];
const TABS = VIEWS.slice(0, 4), MORE = VIEWS.slice(4);

export default function App() {
  const { quran, status } = useQuran();
  const [data, setData] = useLocalStorage('hifz-v1', { memorized: {}, days: [], notes: {}, reviews: {} });
  const [reciter, setReciter] = useLocalStorage('hifz-reciter', 'Alafasy_128kbps');
  const [theme, setTheme] = useLocalStorage('hifz-theme', 'dark');
  const [view, setView] = useState('engine');
  const [surahId, setSurahId] = useState(1);
  const [range, setRange] = useState([1, 7]);
  const [repeats, setRepeats] = useState(5);
  const [focus, setFocus] = useState(false);
  const [sheet, setSheet] = useState(null); // null | settings | more

  const surah = quran.find((s) => s.id === surahId);
  const ayahs = surah.ayahs.filter((a) => a.n >= range[0] && a.n <= range[1]);
  const nums = surah.ayahs.map((a) => a.n);
  const dueCount = Object.keys(data.memorized).filter((k) => isDue(data.reviews, k)).length;

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  // اختصارات الشاشة الرئيسية: /?view=listen ...
  useEffect(() => {
    const v = new URLSearchParams(location.search).get('view');
    if (VIEWS.some((x) => x[0] === v)) setView(v);
  }, []);

  const changeSurah = (id) => { setSurahId(id); setRange([1, quran.find((s) => s.id === id).ayahs.length]); };
  const setFrom = (v) => setRange([v, Math.max(v, range[1])]);
  const setTo = (v) => setRange([Math.min(range[0], v), v]);
  const open = (id) => { setView(id); setSheet(null); window.scrollTo({ top: 0 }); };

  const onMemorized = (n) => setData((d) => ({
    ...d,
    memorized: { ...d.memorized, [`${surahId}:${n}`]: true },
    days: d.days.includes(addDays(0)) ? d.days : [...d.days, addDays(0)],
    reviews: { ...d.reviews, [`${surahId}:${n}`]: { box: 0, due: addDays(INTERVALS[0]) } },
  }));
  const grade = (k, ok) => setData((d) => {
    const box = ok ? Math.min((d.reviews?.[k]?.box || 0) + 1, INTERVALS.length - 1) : 0;
    return { ...d, reviews: { ...d.reviews, [k]: { box, due: addDays(INTERVALS[box]) } },
      days: d.days.includes(addDays(0)) ? d.days : [...d.days, addDays(0)] };
  });
  const setNote = (k, v) => setData((d) => ({ ...d, notes: { ...d.notes, [k]: v } }));

  const engine = (f) => (
    <MemorizationEngine surah={surah} ayahs={ayahs} repeats={repeats} memorized={data.memorized} onMemorized={onMemorized} focus={f} reciter={reciter} />
  );

  if (focus) return (
    <div className="fixed inset-0 z-40 overflow-auto bg-stone-50 p-6 pb-32 pt-[calc(1.5rem+env(safe-area-inset-top))] dark:bg-navy">
      <button className="btn-ghost mb-4" onClick={() => setFocus(false)}>✕ خروج من وضع التركيز</button>
      <div className="mx-auto max-w-4xl">{engine(true)}</div>
    </div>
  );

  const themeBtn = <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>;

  // إعدادات الحفظ (تُستخدم في الشريط الجانبي وفي النافذة السفلية)
  const settings = (
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
  );
  const statusText = { sample: '📖 النسخة التجريبية (٤ سور)', loading: '⏳ جارٍ تحميل المصحف كاملاً…', offline: '⚠️ تعذّر تحميل المصحف — النسخة التجريبية (٤ سور)', full: '✅ المصحف كاملاً — ١١٤ سورة' }[status];
  const title = { dash: 'لوحة التقدّم', review: 'مراجعة اليوم', listen: 'الاستماع والراديو' }[view] || `سورة ${surah.name}`;

  return (
    <div className="min-h-screen md:flex">
      {/* سطح المكتب: شريط جانبي */}
      <aside className="hidden space-y-5 bg-gradient-to-b from-emerald-900 to-navy p-4 text-white print:hidden md:block md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="font-quran text-4xl text-gold">حِفظ</h1>{themeBtn}
        </div>
        <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">{statusText}</p>
        <nav className="grid gap-2">
          {VIEWS.map(([id, ic, label]) => (
            <button key={id} onClick={() => setView(id)}
              className={`rounded-xl px-3 py-2 text-right text-sm font-bold transition ${view === id ? 'bg-gold text-navy' : 'hover:bg-white/10'}`}>
              {ic} {label}{id === 'review' && dueCount > 0 && <span className="mr-2 rounded-full bg-red-500 px-2 text-xs text-white">{ar(dueCount)}</span>}
            </button>
          ))}
        </nav>
        {settings}
        <button className="btn-gold w-full" onClick={() => { setView('engine'); setFocus(true); }}>🧘 وضع التركيز</button>
        <InstallButton />
      </aside>

      {/* الهاتف: شريط علوي */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-l from-emerald-900 to-navy px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-white print:hidden md:hidden">
        <h1 className="font-quran text-3xl text-gold">حِفظ</h1>
        <button onClick={() => setSheet('settings')} className="min-w-0 flex-1 truncate rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
          سورة {surah.name} · {ar(range[0])}–{ar(range[1])} ▾
        </button>
        {themeBtn}
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-4 md:p-8 md:pb-16">
        <h2 className="mb-4 font-quran text-2xl md:mb-5 md:text-3xl print:hidden">{title}</h2>
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {view === 'engine' && engine(false)}
            {view === 'listen' && <Listen quran={quran} surahId={surahId} range={range} reciter={reciter} />}
            {view === 'hide' && <HideSeek ayahs={ayahs} />}
            {view === 'notes' && <LinkNotes surah={surah} ayahs={ayahs} notes={data.notes} setNote={setNote} />}
            {view === 'review' && <Review quran={quran} data={data} reciter={reciter} grade={grade} />}
            {view === 'dash' && <Dashboard data={data} quran={quran} full={status === 'full'} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* الهاتف: شريط تبويبات سفلي */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-emerald-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden dark:border-white/10 dark:bg-navy/95 md:hidden">
        {TABS.map(([id, ic, , short]) => (
          <button key={id} onClick={() => open(id)}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${view === id ? 'text-emerald-700 dark:text-gold' : 'opacity-60'}`}>
            <span className="text-2xl leading-none">{ic}</span>{short}
            {id === 'review' && dueCount > 0 && <span className="absolute right-[28%] top-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{ar(dueCount)}</span>}
            {view === id && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gold" />}
          </button>
        ))}
        <button onClick={() => setSheet('more')}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${MORE.some((m) => m[0] === view) ? 'text-emerald-700 dark:text-gold' : 'opacity-60'}`}>
          <span className="text-2xl leading-none">⋯</span>المزيد
        </button>
      </nav>

      {/* النافذة السفلية: الإعدادات / المزيد */}
      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSheet(null)} />
            <motion.div className="absolute inset-x-0 bottom-0 max-h-[85vh] space-y-4 overflow-auto rounded-t-3xl bg-stone-50 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-[#101b33]"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
              <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-400/50" />
              {sheet === 'settings' ? (
                <>
                  <h3 className="text-lg font-bold">إعدادات الحفظ</h3>{settings}
                  <p className="text-xs opacity-70">{statusText}</p>
                  <button className="btn-main w-full" onClick={() => setSheet(null)}>تم</button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold">المزيد</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {MORE.map(([id, ic, label]) => (
                      <button key={id} onClick={() => open(id)} className="card flex flex-col items-center gap-1 p-4 text-sm font-bold">
                        <span className="text-3xl">{ic}</span>{label}</button>
                    ))}
                    <button onClick={() => { setSheet(null); setView('engine'); setFocus(true); }} className="card flex flex-col items-center gap-1 p-4 text-sm font-bold">
                      <span className="text-3xl">🧘</span>وضع التركيز</button>
                  </div>
                  <InstallButton />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
