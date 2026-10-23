import { Plus } from 'lucide-react';

/** Accessible accordion using native <details>, no JS needed. */
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
      {items.map((f, i) => (
        <details key={i} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4.5 sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="mt-0.5 font-display text-sm font-semibold text-saffron-500">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 font-semibold text-night-900">{f.question}</span>
            <Plus className="mt-0.5 h-5 w-5 shrink-0 text-muted transition group-open:rotate-45 group-open:text-saffron-600" />
          </summary>
          <div className="px-5 pb-5 pl-14 text-sm leading-relaxed text-ink/75 sm:px-6 sm:pl-[60px]">
            {f.answer.split(/\n+/).map((p, k) => <p key={k} className="mb-2 last:mb-0">{p}</p>)}
          </div>
        </details>
      ))}
    </div>
  );
}
