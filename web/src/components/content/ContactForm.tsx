'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    setErr('');
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); setState('idle'); return; }
    setMsg(j.message);
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-leaf" />
        <p className="mt-4 font-display text-2xl font-semibold">Message sent</p>
        <p className="mt-1 text-sm text-muted">{msg}</p>
        <button type="button" className="btn-ghost mt-6" onClick={() => { setF({ name: '', email: '', phone: '', message: '' }); setState('idle'); }}>Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" required minLength={2} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="c-phone">Phone <span className="normal-case tracking-normal text-muted/70">(optional)</span></label>
          <input id="c-phone" inputMode="tel" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-email">Email</label>
        <input id="c-email" type="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="c-msg">How can we help?</label>
        <textarea id="c-msg" required minLength={10} rows={5} className="input resize-y" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </div>
      {err && <p className="text-sm text-rose">{err}</p>}
      <button className="btn-primary btn-lg w-full sm:w-auto" disabled={state === 'busy'}>
        {state === 'busy' ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send message <Send className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
