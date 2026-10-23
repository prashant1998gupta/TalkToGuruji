import type { Message } from '@prisma/client';
import { cx } from '@/lib/format';

/** Read-only chat transcript used in account & astrologer panel history. */
export function Transcript({ messages, meId, names }: { messages: Message[]; meId: string; names: Record<string, string> }) {
  if (!messages.length) return <p className="text-sm text-muted">No messages in this consultation.</p>;
  return (
    <div className="space-y-2.5">
      {messages.map((m) =>
        m.kind === 'SYSTEM' ? (
          <p key={m.id} className="mx-auto w-fit max-w-[90%] rounded-full bg-cream-200 px-3 py-1 text-center text-[11.5px] text-ink/65">{m.body}</p>
        ) : (
          <div key={m.id} className={cx('flex', m.senderId === meId ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', m.senderId === meId ? 'rounded-br-md bg-night-900 text-white' : 'rounded-bl-md bg-cream-100 text-ink ring-1 ring-line')}>
              <p className={cx('mb-0.5 text-[10.5px] font-bold', m.senderId === meId ? 'text-gold-300' : 'text-saffron-700')}>{names[m.senderId] || ''}</p>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={cx('mt-0.5 text-right text-[10px]', m.senderId === meId ? 'text-white/50' : 'text-muted')}>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
