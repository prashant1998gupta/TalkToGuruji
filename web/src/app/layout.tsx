import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { AppProvider } from '@/components/providers/AppProvider';
import { IncomingRequest } from '@/components/consult/IncomingRequest';
import { ConsultLauncherProvider } from '@/components/consult/ConsultLauncher';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['SOFT', 'opsz'] });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: 'Talk to Guruji - Personalized Astrology, Horoscope & Consultation Online', template: '%s | Talk to Guruji' },
  description:
    'TalkToGuruji.com is a one-stop platform for astrology services, including live consultations, personalized Kundli reports, remedies, and many more on Talk To Guruji',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#120e24', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <AppProvider>
          <ConsultLauncherProvider>{children}</ConsultLauncherProvider>
          <IncomingRequest />
        </AppProvider>
      </body>
    </html>
  );
}
