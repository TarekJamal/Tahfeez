'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioUrl, ar, isDue, INTERVALS } from '../lib/store';

// مراجعة متباعدة: تظهر الآية مخفية مع تلميح، تسمّعها من حفظك، ثم تكشفها وتقيّم نفسك
export default function Review({ quran, data, reciter, grade }) {
  const [show, setShow] = useState(false);
  const audio = useRef(null);
  const due = Object.keys(data.memorized).filter((k) => isDue(data.reviews, k));
  const key = due[0];

  if (!key) return (
    <div className="card space-y-2 p-10 text-center">
      <div className="text-5xl">🌿</div>
      <p className="text-lg font-bold">أحسنت! لا توجد مراجعات مستحقة اليوم.</p>
      <p className="text-sm opacity-70">احفظ آيات جديدة من «محرك الحفظ» وستظهر هنا في موعد مراجعتها.</p>
    </div>
  );

  const [sid, n] = key.split(':').map(Number);
  const s = quran.find((x) => x.id === sid);
  const a = s.ayahs.find((x) => x.n === n);
  const box = data.reviews?.[key]?.box || 0;

  const play = () => {
    audio.current?.pause();
    audio.current = new Audio(audioUrl(sid, n, reciter));
    audio.current.play().catch(() => {});
  };
  const answer = (ok) => { audio.current?.pause(); setShow(false); grade(key, ok); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm opacity-80">
        <span>سورة {s.name} — الآية {ar(n)}</span>
        <span>المتبقي اليوم: {ar(due.length)}</span>
      </div>

      <div className="card space-y-5 p-6 text-center md:p-12">
        <AnimatePresence mode="wait">
          <motion.p key={key + show} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`font-quran text-3xl leading-[2.3] transition md:text-5xl ${show ? '' : 'select-none blur-md'}`}>
            {a.text} <span className="text-gold">﴿{ar(n)}﴾</span>
          </motion.p>
        </AnimatePresence>
        {!show && <p className="text-sm opacity-80">تلميح: تبدأ بـ «<span className="font-quran text-lg text-gold">{a.text.split(' ')[0]}</span>»</p>}
        <p className="text-xs opacity-60">مستوى الحفظ: {ar(box + 1)} من {ar(INTERVALS.length)} — المراجعة التالية بعد {ar(INTERVALS[Math.min(box + 1, INTERVALS.length - 1)])} يوم عند التذكّر</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!show ? (
          <button className="btn-gold" onClick={() => setShow(true)}>👁 اكشف الآية</button>
        ) : (
          <>
            <button className="btn-main" onClick={() => answer(true)}>✅ تذكرتها</button>
            <button className="btn-ghost" onClick={() => answer(false)}>❌ نسيتها — أعدها غداً</button>
          </>
        )}
        <button className="btn-ghost" onClick={play}>🔊 استمع</button>
      </div>
    </div>
  );
}
