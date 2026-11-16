'use client';
import { useEffect, useState } from 'react';

// زر تثبيت التطبيق على الشاشة الرئيسية (أندرويد مباشرة، وآيفون بتعليمات)
export default function InstallButton() {
  const [evt, setEvt] = useState(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [tip, setTip] = useState(false);
  useEffect(() => {
    setStandalone(matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e) => { e.preventDefault(); setEvt(e); };
    addEventListener('beforeinstallprompt', h);
    return () => removeEventListener('beforeinstallprompt', h);
  }, []);
  if (standalone) return null;
  const click = async () => { if (evt) { evt.prompt(); await evt.userChoice; setEvt(null); } else setTip(true); };
  return (
    <div>
      <button className="btn-gold w-full" onClick={click}>📲 ثبّت التطبيق على هاتفك</button>
      {tip && (
        <p className="mt-2 rounded-xl bg-emerald-500/10 p-3 text-xs leading-6">
          {ios ? 'في سفاري: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».'
               : 'من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'}
        </p>
      )}
    </div>
  );
}
