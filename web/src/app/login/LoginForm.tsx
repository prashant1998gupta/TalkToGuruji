'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '';
  const { refresh, toast } = useApp();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    const r = await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setError(j.error);
    setDevCode(j.devCode || null);
    setStep('otp');
    setTimer(30);
    setDigits(['', '', '', '', '', '']);
    setTimeout(() => inputs.current[0]?.focus(), 50);
  };

  const verify = async (code = digits.join('')) => {
    if (code.length !== 6) return;
    setError('');
    setBusy(true);
    const r = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code, name: name || undefined }) });
    const j = await r.json();
    if (!r.ok) {
      setBusy(false);
      return setError(j.error);
    }
    await refresh();
    toast(j.isNew ? 'Welcome to Talk to Guruji!' : 'Welcome back!', 'success');
    router.replace(next || j.home || '/');
    router.refresh();
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      // pasted full code
      const arr = clean.slice(0, 6).split('');
      const nd = [...arr, ...Array(6 - arr.length).fill('')];
      setDigits(nd);
      inputs.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) verify(arr.join(''));
      return;
    }
    const nd = [...digits];
    nd[i] = clean;
    setDigits(nd);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
    if (nd.every(Boolean)) verify(nd.join(''));
  };

  if (step === 'phone') {
    return (
      <form onSubmit={send} className="animate-fade-up">
        <h2 className="h-display text-3xl text-night-900">Login or sign up</h2>
        <p className="mt-1.5 text-sm text-muted">We’ll send a one-time password to your mobile.</p>
        <label className="label mt-8" htmlFor="phone">Mobile number</label>
        <div className="flex overflow-hidden rounded-xl border border-line bg-white transition focus-within:border-saffron-400 focus-within:ring-4 focus-within:ring-saffron-100">
          <span className="flex items-center border-r border-line bg-cream-100 px-3.5 text-sm font-semibold text-ink/70">🇮🇳 +91</span>
          <input
            id="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="98765 43210"
            className="min-w-0 flex-1 px-3.5 py-3 text-base tracking-wider outline-none"
          />
        </div>
        <label className="label mt-4" htmlFor="name">Your name <span className="normal-case tracking-normal text-muted/70">(optional)</span></label>
        <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="So astrologers know what to call you" />
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <button className="btn-primary btn-lg mt-6 w-full" disabled={busy || phone.length !== 10}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Get OTP <ArrowRight className="h-4 w-4" /></>}
        </button>
        <div className="mt-8 rounded-2xl border border-dashed border-saffron-200 bg-saffron-50/60 p-4 text-xs leading-relaxed text-ink/70">
          <p className="mb-1 font-bold text-saffron-700">Local demo accounts</p>
          <p>User: <b>9876543210</b> (₹500 wallet) · Admin: <b>9999999999</b></p>
          <p>Astrologers: <b>9000000001</b> – <b>9000000012</b></p>
        </div>
      </form>
    );
  }

  return (
    <div className="animate-fade-up">
      <button type="button" onClick={() => setStep('phone')} className="mb-6 flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Change number
      </button>
      <h2 className="h-display text-3xl text-night-900">Verify OTP</h2>
      <p className="mt-1.5 text-sm text-muted">Enter the 6-digit code sent to +91 {phone}</p>
      {devCode && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-night-900 p-3.5 text-white">
          <KeyRound className="h-5 w-5 text-gold-400" />
          <div className="text-xs leading-tight">
            <p className="text-white/60">Local mode — no SMS is sent. Your OTP:</p>
            <button type="button" onClick={() => setDigit(0, devCode)} className="mt-0.5 font-mono text-lg font-bold tracking-[0.3em] text-gold-300 hover:underline" title="Click to fill">
              {devCode}
            </button>
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); setDigit(0, e.clipboardData.getData('text')); }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && inputs.current[i - 1]?.focus()}
            className="h-14 w-full rounded-xl border border-line bg-white text-center text-xl font-bold outline-none transition focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100"
          />
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      <button type="button" onClick={() => verify()} className="btn-primary btn-lg mt-6 w-full" disabled={busy || digits.some((x) => !x)}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & continue'}
      </button>
      <p className="mt-5 text-center text-sm text-muted">
        {timer > 0 ? <>Resend OTP in <b className="text-ink">{timer}s</b></> : <button type="button" onClick={() => send()} className="font-semibold text-saffron-600 hover:underline">Resend OTP</button>}
      </p>
    </div>
  );
}
