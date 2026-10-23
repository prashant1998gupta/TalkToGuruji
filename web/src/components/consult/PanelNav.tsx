'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IndianRupee, LayoutDashboard, LogOut, MessagesSquare, Star, UserCog } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { cx } from '@/lib/format';

const LINKS = [
  { href: '/astrologer-panel', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/astrologer-panel/sessions', label: 'Consultations', icon: MessagesSquare },
  { href: '/astrologer-panel/earnings', label: 'Earnings', icon: IndianRupee },
  { href: '/astrologer-panel/reviews', label: 'Reviews', icon: Star },
  { href: '/astrologer-panel/profile', label: 'Profile & pricing', icon: UserCog },
];

export function PanelNav() {
  const path = usePathname();
  const router = useRouter();
  const { refresh } = useApp();
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    router.push('/');
  };
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-1 lg:flex-col lg:px-0" aria-label="Astrologer dashboard">
      {LINKS.map(({ href, label, icon: I }) => {
        const active = href === '/astrologer-panel' ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={cx('flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition', active ? 'bg-white text-night-900' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
            <I className="h-4 w-4" /> {label}
          </Link>
        );
      })}
      <button type="button" onClick={logout} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white lg:mt-auto">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </nav>
  );
}
