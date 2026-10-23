'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';

export function ShareButtons({ title, dark }: { title: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href;
  const open = (u: string) => window.open(u, '_blank', 'noopener,width=640,height=560');
  const base = dark
    ? 'grid h-9 w-9 place-items-center rounded-full bg-white/5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-saffron-500'
    : 'grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-bold text-ink ring-1 ring-line transition hover:bg-saffron-500 hover:text-white hover:ring-saffron-500';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={base} aria-label="Share on WhatsApp" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url())}`)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" /></svg>
      </button>
      <button type="button" className={base} aria-label="Share on X" onClick={() => open(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`)}>𝕏</button>
      <button type="button" className={base} aria-label="Share on Facebook" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>f</button>
      <button
        type="button"
        className={base}
        aria-label="Copy link"
        onClick={async () => {
          await navigator.clipboard.writeText(url()).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
