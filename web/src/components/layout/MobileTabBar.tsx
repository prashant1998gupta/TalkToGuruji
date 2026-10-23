'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Home, MessageCircle, Phone, User } from 'lucide-react';
import { cx } from '@/lib/format';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/astrology-services/chat-with-astrologer', label: 'Chat', icon: MessageCircle },
  { href: '/astrology-services/talk-to-astrologer', label: 'Call', icon: Phone },
  { href: '/astrology-services/online-pooja-booking', label: 'Puja', icon: Flame },
  { href: '/account', label: 'Profile', icon: User },
];

/** App-style bottom navigation on phones. Hidden inside consultation rooms and dashboards. */
export function MobileTabBar() {
  const pathname = usePathname();
  if (/^\/(consult|admin|astrologer-panel|pay)\b/.test(pathname)) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick navigation">
      <div className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: I }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold', active ? 'text-saffron-600' : 'text-muted')}>
              <span className={cx('grid h-8 w-12 place-items-center rounded-full transition', active && 'bg-saffron-50')}>
                <I className="h-5 w-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
