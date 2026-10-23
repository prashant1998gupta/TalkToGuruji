'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, MessageCircle, Receipt, ShoppingBag, User, Wallet } from 'lucide-react';
import { cx } from '@/lib/format';

const LINKS = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/consultations', label: 'Consultations', icon: MessageCircle },
  { href: '/account/orders', label: 'Orders & bookings', icon: ShoppingBag },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/account/transactions', label: 'Transactions', icon: Receipt },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0" aria-label="Account">
      {LINKS.map(({ href, label, icon: I }) => {
        const active = href === '/account' ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={cx('flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition lg:rounded-xl', active ? 'bg-night-900 text-white' : 'bg-white text-ink/75 ring-1 ring-line hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-white')}>
            <I className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
