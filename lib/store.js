'use client';
import { useEffect, useState } from 'react';

// حفظ تلقائي في localStorage
export function useLocalStorage(key, initial) {
  const [v, setV] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV];
}

export const today = () => new Date().toISOString().slice(0, 10);
export const ar = (n) => Number(n).toLocaleString('ar-EG');

export function calcStreak(days) {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// صوت الشيخ مشاري العفاسي من EveryAyah
export const RECITERS = [
  ['Alafasy_128kbps', 'مشاري العفاسي'],
  ['Muhammad_Jibreel_128kbps', 'محمد جبريل'],
  ['Husary_128kbps', 'محمود خليل الحصري'],
  ['Abdul_Basit_Murattal_192kbps', 'عبد الباسط عبد الصمد (مرتل)'],
  ['Minshawy_Murattal_128kbps', 'محمد صديق المنشاوي (مرتل)'],
  ['mahmoud_ali_al_banna_32kbps', 'محمود علي البنا'],
  ['Abdurrahmaan_As-Sudais_192kbps', 'عبد الرحمن السديس'],
  ['Maher_AlMuaiqly_64kbps', 'ماهر المعيقلي'],
];

export const audioUrl = (s, a, reciter = 'Alafasy_128kbps') =>
  `https://everyayah.com/data/${reciter}/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;

// المراجعة المتباعدة (ليتنر): الفاصل بالأيام لكل صندوق
export const INTERVALS = [1, 3, 7, 14, 30];
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const isDue = (reviews, k) => !reviews?.[k] || reviews[k].due <= today();
