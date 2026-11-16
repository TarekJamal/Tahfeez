import './globals.css';
import { Amiri, Tajawal } from 'next/font/google';
import PWARegister from '../components/PWARegister';

const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-tajawal' });

export const metadata = {
  title: 'حِفظ — رفيقك في حفظ القرآن',
  description: 'تطبيق ذكي لحفظ القرآن الكريم ومراجعته والاستماع إليه',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32' }, { url: '/icons/icon-192.png', sizes: '192x192' }], apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'حِفظ', statusBarStyle: 'black-translucent' },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0B1426' };

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${tajawal.variable} dark`} suppressHydrationWarning>
      <body>{children}<PWARegister /></body>
    </html>
  );
}
