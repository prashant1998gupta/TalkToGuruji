'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    const j = await r.json();
    setState(r.ok ? 'done' : 'error');
    setMsg(j.message || j.error);
    if (r.ok) setEmail('');
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex rounded-full bg-white/5 p-1.5 ring-1 ring-white/15 focus-within:ring-gold-400">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button className="btn-gold" disabled={state === 'busy'}>
          Subscribe <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {msg && <p className={`mt-2 px-4 text-xs ${state === 'error' ? 'text-rose' : 'text-leaf'}`}>{msg}</p>}
    </form>
  );
}
