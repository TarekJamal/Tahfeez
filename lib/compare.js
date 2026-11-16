// مقارنة تلاوة المستخدم (نص تحوّل من الصوت) بنص الآية — على مستوى الكلمات فقط
const strip = (w) => w
  .replace(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')   // التشكيل والتطويل
  .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// تساهل بسيط لأن التفريغ الآلي لا يطابق الرسم العثماني حرفياً
const same = (a, b) => a === b || 1 - lev(a, b) / Math.max(a.length, b.length) >= 0.7;

export function compare(text, heard) {
  const ew = text.replace(/[۞۩]/g, '').split(/\s+/).filter(Boolean);
  const en = ew.map(strip);
  const hn = heard.split(/\s+/).filter(Boolean).map(strip).filter(Boolean);
  const n = en.length, m = hn.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    dp[i][j] = same(en[i - 1], hn[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const ok = Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (same(en[i - 1], hn[j - 1]) && dp[i][j] === dp[i - 1][j - 1] + 1) { ok[i - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  en.forEach((w, k) => { if (!w) ok[k] = true; });
  const hit = ok.filter(Boolean).length;
  return { words: ew.map((w, k) => ({ w, ok: ok[k] })), score: n ? hit / n : 0, missing: n - hit };
}
