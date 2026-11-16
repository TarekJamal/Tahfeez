'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer';
import { audioUrl, ar } from '../lib/store';
import { compare } from '../lib/compare';

// المراحل: idle → listen (تكرار X مرات) → record (النص مخفي) → review (مقارنة + فحص آلي للكلمات)
export default function MemorizationEngine({ surah, ayahs, repeats, memorized, onMemorized, focus, reciter }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [rep, setRep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [token, setToken] = useState(0);
  const [userUrl, setUserUrl] = useState(null);
  const [err, setErr] = useState('');
  const [heard, setHeard] = useState(null);      // نص التلاوة كما فهمه المتصفح
  const [checking, setChecking] = useState(false);
  const [srOk, setSrOk] = useState(true);
  const recRef = useRef(null);
  const recog = useRef(null);
  const heardRef = useRef('');
  const chunks = useRef([]);
  const auto = useRef(false);
  const cancelled = useRef(false);
  const sess = useRef(0);

  useEffect(() => { setSrOk(!!(window.SpeechRecognition || window.webkitSpeechRecognition)); }, []);

  const ayah = ayahs[i] || ayahs[0];
  const key = `${surah.id}:${ayah.n}`;
  const result = useMemo(() => (heard == null ? null : compare(ayah.text, heard)), [heard, ayah.text]);
  const heardNothing = heard != null && heard.trim() === '';

  const cancelRec = () => {
    sess.current += 1;
    if (recRef.current?.state === 'recording') { cancelled.current = true; recRef.current.stop(); }
    try { recog.current?.abort(); } catch {}
    recog.current = null; setHeard(null); setChecking(false);
  };
  const reset = () => { cancelRec(); setI(0); setPhase('idle'); setPlaying(false); setUserUrl(null); setErr(''); };
  useEffect(reset, [surah.id, ayahs[0]?.n, ayahs.length]);

  const start = () => {
    sess.current += 1; setHeard(null); setChecking(false);
    setUserUrl(null); setErr(''); setRep(1); setPhase('listen');
    setToken((t) => t + 1); setPlaying(true);
  };
  useEffect(() => { if (auto.current) { auto.current = false; start(); } }, [i]);

  // انتقال يدوي بين الآيات دون اعتبارها محفوظة
  const jump = (d) => {
    const ni = Math.min(Math.max(i + d, 0), ayahs.length - 1);
    if (ni === i) return;
    cancelRec(); setPlaying(false); setPhase('idle'); setUserUrl(null); setErr(''); setI(ni);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelled.current) { cancelled.current = false; return; }
        const url = URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType }));
        setUserUrl(url); setPhase('review');
        new Audio(url).play().catch(() => {}); // يعيد تشغيل تسجيلك تلقائياً
        // ننتظر لحظة ليصل التفريغ النهائي ثم نقارنه بنص الآية
        const my = sess.current;
        if (recog.current) {
          setChecking(true);
          try { recog.current.stop(); } catch {}
          setTimeout(() => { if (my !== sess.current) return; setHeard(heardRef.current); setChecking(false); }, 1500);
        }
      };
      mr.start(); recRef.current = mr; setPhase('record');

      // تفريغ التلاوة إلى نص بالتوازي (Web Speech API)
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      heardRef.current = ''; recog.current = null;
      if (SR) {
        try {
          const rec = new SR();
          rec.lang = 'ar-SA'; rec.continuous = true; rec.interimResults = true;
          rec.onresult = (e) => { heardRef.current = Array.from(e.results).map((r) => r[0].transcript).join(' '); };
          rec.start(); recog.current = rec;
        } catch { recog.current = null; }
      }
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
  const done = () => { onMemorized(ayah.n); auto.current = i < ayahs.length - 1; next(); };
  const pct = result ? Math.round(result.score * 100) : 0;
  const showWords = phase === 'review' && result && !heardNothing;

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
              {showWords
                ? result.words.map((x, k) => (
                    <span key={k} className={`mx-1 inline-block ${x.ok ? 'text-emerald-500' : 'text-red-500 underline decoration-wavy'}`}>{x.w}</span>))
                : ayah.text}{' '}
              <span className="text-gold">﴿{ar(ayah.n)}﴾</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {!focus && phase === 'review' && !err && (
        srOk ? (
          <div className="card space-y-2 p-4 text-sm">
            {checking && <p>⏳ جارٍ فحص تلاوتك…</p>}
            {!checking && heardNothing && <p>لم أسمع تلاوة واضحة. أعد المحاولة وتحدّث بصوت أعلى وقريباً من الميكروفون.</p>}
            {!checking && result && !heardNothing && (
              <>
                <p className="font-bold">
                  دقة الكلمات: <span className={pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-gold' : 'text-red-500'}>{ar(pct)}٪</span>
                  {result.missing > 0 && <span className="font-normal opacity-80"> — {ar(result.missing)} كلمة ناقصة أو مختلفة (بالأحمر)</span>}
                </p>
                <p className="opacity-70">فهمتُ منك: {heard}</p>
              </>
            )}
            <p className="text-xs opacity-60">فحص آلي تقريبي للكلمات فقط، ولا يحكم على التجويد ولا المخارج، وقد يخطئ. اعرض تلاوتك على مُقرئ متقن.</p>
          </div>
        ) : (
          <p className="text-xs opacity-60">الفحص الآلي للتلاوة يحتاج متصفح كروم أو إيدج أو سفاري.</p>
        )
      )}

      <div className="flex justify-between gap-2">
        <button className="btn-ghost" disabled={i === 0} onClick={() => jump(-1)}>⏮ الآية السابقة</button>
        <button className="btn-main" disabled={i >= ayahs.length - 1} onClick={() => jump(1)}>الآية التالية ⏭</button>
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
