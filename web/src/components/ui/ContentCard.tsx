import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock } from 'lucide-react';
import { fmtDate } from '@/lib/format';

type Props = {
  href: string;
  title: string;
  image?: string | null;
  excerpt?: string | null;
  tag?: string | null;
  date?: Date | string | null;
  meta?: string;
  priority?: boolean;
  aspect?: 'video' | 'square' | 'portrait';
};

/** Editorial card used for blogs, news, rituals, remedies, etc. */
export function ContentCard({ href, title, image, excerpt, tag, date, meta, priority, aspect = 'video' }: Props) {
  const ratio = aspect === 'square' ? 'aspect-square' : aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/10]';
  return (
    <Link href={href} className="card-hover group flex flex-col overflow-hidden">
      <div className={`relative ${ratio} overflow-hidden bg-cream-200`}>
        {image ? (
          <Image src={image} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={priority} className="object-cover transition duration-700 group-hover:scale-[1.04]" />
        ) : (
          <div className="night grid h-full place-items-center">
            <span className="font-display text-4xl text-gold-300/80">ॐ</span>
          </div>
        )}
        {tag && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-night-900 backdrop-blur">{tag}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-night-900 transition group-hover:text-saffron-700 line-clamp-2">{title}</h3>
        {excerpt && <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">{excerpt}</p>}
        {(date || meta) && (
          <div className="mt-auto flex items-center gap-3 pt-4 text-xs font-medium text-muted">
            {date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(date)}</span>}
            {meta && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meta}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
