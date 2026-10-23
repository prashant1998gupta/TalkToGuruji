import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="night relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:34px_34px]" />
        <svg className="pointer-events-none absolute -right-40 top-1/2 h-[640px] w-[640px] -translate-y-1/2 animate-spin-slow opacity-30" viewBox="0 0 200 200" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="100" y1="10" x2="100" y2="30" stroke="#f2c25b" strokeWidth=".6" transform={`rotate(${i * 30} 100 100)`} />
          ))}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#f2c25b" strokeWidth=".5" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#f2c25b" strokeWidth=".4" strokeDasharray="2 3" />
          <circle cx="100" cy="100" r="44" fill="none" stroke="#ff8f36" strokeWidth=".5" />
        </svg>
        <Logo dark />
        <div className="relative max-w-md">
          <p className="eyebrow !text-gold-300"><Sparkles className="h-3.5 w-3.5" /> Your first step</p>
          <h1 className="h-display mt-3 text-5xl leading-[1.05] text-white">The stars have been waiting for your question.</h1>
          <p className="mt-4 text-white/65">Log in with your mobile number to chat, call or video-consult verified astrologers, book pujas and save your kundli.</p>
          <div className="mt-8 flex gap-6 text-sm text-white/75">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-leaf" /> 100% private</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-gold-400 text-gold-400" /> 4.8 average rating</span>
          </div>
        </div>
        <p className="relative text-xs text-white/40">By continuing you agree to our Terms & Privacy Policy.</p>
      </aside>
      <section className="flex flex-col bg-cream-50 px-5 py-8 sm:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="m-auto w-full max-w-sm py-10">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
