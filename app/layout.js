import './globals.css';
import { Amiri, Tajawal } from 'next/font/google';

const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-tajawal' });

export const metadata = { title: 'حِفظ — رفيقك في حفظ القرآن', description: 'تطبيق ذكي لحفظ القرآن الكريم' };

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${tajawal.variable} dark`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
