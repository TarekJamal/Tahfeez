'use client';
import { useEffect, useState } from 'react';
import sample from '../data/quran.json';

const KEY = 'hifz-quran-v1';
const plain = (w) => w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

// تحويل استجابة alquran.cloud إلى الشكل الذي تستخدمه المكوّنات: [{id,name,ayahs:[{n,text,juz}]}]
function normalize(surahs) {
  return surahs.map((s) => ({
    id: s.number,
    name: s.name.replace(/^سُورَةُ\s*/, '').trim(),
    ayahs: s.ayahs.map((a) => {
      let words = a.text.replace(/۞/g, '').trim().split(' ');
      // الـ API يضيف البسملة إلى أول آية في كل سورة (عدا الفاتحة) — نحذفها لأنها ليست آية
      if (s.number !== 1 && a.numberInSurah === 1 && plain(words[0]) === 'بسم' && words.length > 4) words = words.slice(4);
      return { n: a.numberInSurah, text: words.join(' '), juz: a.juz };
    }),
  }));
}

// status: sample (تجريبي) | loading | full (114 سورة) | offline
export function useQuran() {
  const [state, setState] = useState({ quran: sample, status: 'sample' });

  useEffect(() => {
    let dead = false;
    try {
      const c = localStorage.getItem(KEY);
      if (c) { setState({ quran: JSON.parse(c), status: 'full' }); return; }
    } catch {}
    setState((s) => ({ ...s, status: 'loading' }));
    fetch('https://api.alquran.cloud/v1/quran/quran-uthmani')
      .then((r) => r.json())
      .then((j) => {
        const q = normalize(j.data.surahs);
        if (q.length !== 114) throw new Error('bad data');
        try { localStorage.setItem(KEY, JSON.stringify(q)); } catch {}
        if (!dead) setState({ quran: q, status: 'full' });
      })
      .catch(() => { if (!dead) setState((s) => ({ ...s, status: 'offline' })); });
    return () => { dead = true; };
  }, []);

  return state;
}
