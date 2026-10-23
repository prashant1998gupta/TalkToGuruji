import Link from 'next/link';
import { Home, MessageCircle, Search } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <main className="night relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container-x relative py-6"><Logo dark /></div>
      <div className="container-x relative flex flex-1 flex-col items-center justify-center pb-20 text-center">
        <svg viewBox="0 0 200 200" className="h-52 w-52 animate-float" aria-hidden="true">
          <circle cx="100" cy="100" r="92" fill="none" stroke="#f2c25b" strokeOpacity=".4" strokeDasharray="2 5" />
          <circle cx="100" cy="100" r="64" fill="none" stroke="#f2c25b" strokeOpacity=".25" />
          <path d="M122 62a44 44 0 1 0 0 76 36 36 0 1 1 0-76z" fill="#f2c25b" />
          <circle cx="160" cy="48" r="4" fill="#ffa95f" />
          <circle cx="44" cy="150" r="3" fill="#f6d58a" />
        </svg>
        <p className="eyebrow mt-6 !text-gold-300">Error 404</p>
        <h1 className="h-display mt-3 text-4xl text-white sm:text-5xl">This page is lost among the stars</h1>
        <p className="mt-3 max-w-md text-white/60">Looks like the page you were looking for is no longer here. Let’s get you back on your path.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold"><Home className="h-4 w-4" /> Go to Home</Link>
          <Link href="/blogs" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"><Search className="h-4 w-4" /> Browse blogs</Link>
          <Link href="/astrology-services/chat-with-astrologer" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Ask an astrologer</Link>
        </div>
      </div>
    </main>
  );
}
