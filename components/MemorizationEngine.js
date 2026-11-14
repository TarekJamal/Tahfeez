'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer';
import { audioUrl, ar } from '../lib/store';

// المراحل: idle → listen (تكرار X مرات) → record (النص مخفي) → review (مقارنة)
export default function MemorizationEngine({ surah, ayahs, repeats, memorized, onMemorized, focus, reciter }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [rep, setRep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [token, setToken] = useState(0);
  const [userUrl, setUserUrl] = useState(null);
  const [err, setErr] = useState('');
  const recRef = useRef(null);
  const chunks = useRef([]);

  const ayah = ayahs[i] || ayahs[0];
  const key = `${surah.id}:${ayah.n}`;

  const reset = () => {
    if (recRef.current?.state === 'recording') recRef.current.stop();
    setI(0); setPhase('idle'); setPlaying(false); setUserUrl(null); setErr('');
  };
  useEffect(reset, [surah.id, ayahs[0]?.n, ayahs.length]);

  const start = () => {
    setUserUrl(null); setErr(''); setRep(1); setPhase('listen');
    setToken((t) => t + 1); setPlaying(true);
  };
  useEffect(() => { if (i > 0) start(); }, [i]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const url = URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType }));
        setUserUrl(url); setPhase('review');
        new Audio(url).play().catch(() => {}); // يعيد تشغيل تسجيلك تلقائياً
      };
      mr.start(); recRef.current = mr; setPhase('record');
    } catch {
      setErr('تعذّر الوصول إلى الميكروفون. اسمح للمتصفح باستخدامه ثم أعد المحاولة.');
      setPhase('review');
    }
  };

  const onEnded = () => {
    if (phase !== 'listen') return setPlaying(false);
    if (rep < repeats) { setRep((r) => r + 1); setToken((t) => t + 1); }
    else { setPlaying(false); startRec(); }
  };

  const next = () => (i < ayahs.length - 1 ? setI(i + 1) : (setPhase('idle'), setI(0)));
  const done = () => { onMemorized(ayah.n); next(); };

  return (
    <div className="space-y-4">
      {!focus && (
        <div className="flex items-center justify-between text-sm opacity-80">
          <span>الآية {ar(ayah.n)} — ({ar(i + 1)} من {ar(ayahs.length)}) {memorized[key] && '✅ محفوظة'}</span>
          <span>{phase === 'listen' ? `التكرار ${ar(rep)} / ${ar(repeats)}` : ''}</span>
        </div>
      )}

      <div className="card flex min-h-[260px] items-center justify-center p-6 text-center md:p-12">
        <AnimatePresence mode="wait">
          {phase === 'record' ? (
            <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-6xl">🎙️</motion.div>
              <p className="text-lg">النص مخفي — سمِّع الآية من حفظك الآن</p>
              <button className="btn-gold" onClick={() => recRef.current?.stop()}>⏹ أنهيت التسميع</button>
            </motion.div>
          ) : (
            <motion.p key={ayah.n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`font-quran leading-[2.3] ${focus ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>
              {ayah.text} <span className="text-gold">﴿{ar(ayah.n)}﴾</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {err && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{err}</p>}

      {!focus && (
        <div className="flex flex-wrap gap-2">
          {phase === 'idle' && <button className="btn-gold" onClick={start}>🎧 ابدأ دورة الحفظ ({ar(repeats)} تكرارات)</button>}
          {phase === 'listen' && <span className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm">استمع وردّد مع الشيخ…</span>}
          {phase === 'review' && (
            <>
              {userUrl && <audio controls src={userUrl} className="h-10" />}
              <button className="btn-ghost" onClick={() => { setPlaying(true); setToken((t) => t + 1); }}>🔊 اسمع التلاوة الأصلية للمقارنة</button>
              <button className="btn-ghost" onClick={start}>🔄 أعد الدورة</button>
              <button className="btn-main" onClick={done}>✅ حفظتها — التالية</button>
            </>
          )}
        </div>
      )}

      <AudioPlayer floating={focus} src={audioUrl(surah.id, ayah.n, reciter)} playing={playing} setPlaying={setPlaying}
        rate={rate} setRate={setRate} token={token} onEnded={onEnded} />
    </div>
  );
}
