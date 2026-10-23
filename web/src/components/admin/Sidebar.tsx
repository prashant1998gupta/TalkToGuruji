'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3, CalendarCheck, ExternalLink, FileText, Flame, Gem, Inbox, LayoutDashboard, Mail, Menu, MessagesSquare, Package, Settings, Sparkles,
  Star, Sunrise, UserCog, Users, Wallet, X,
} from 'lucide-react';

import { cx } from '@/lib/format';

const GROUPS = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'People',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/astrologers', label: 'Astrologers', icon: UserCog, badge: 'pendingAstro' },
      { href: '/admin/consultations', label: 'Consultations', icon: MessagesSquare },
    ],
  },
  { title: 'Money', items: [{ href: '/admin/finance', label: 'Finance', icon: Wallet }] },
  {
    title: 'Content',
    items: [
      { href: '/admin/content', label: 'Content CMS', icon: FileText },
      { href: '/admin/horoscope', label: 'Daily horoscope', icon: Sunrise },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/admin/pujas', label: 'Pujas', icon: Flame },
      { href: '/admin/bookings', label: 'Puja bookings', icon: CalendarCheck, badge: 'pendingBookings' },
      { href: '/admin/mart', label: 'Astro Mart', icon: Gem },
      { href: '/admin/orders', label: 'Orders', icon: Package, badge: 'newOrders' },
    ],
  },
  {
    title: 'Site',
    items: [
      { href: '/admin/site', label: 'Pages & sections', icon: Sparkles },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'messages' },
      { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Solid-colour mark (no gradient ids, so it can appear twice on the page). */
function Mark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#1c1640" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="#f2c25b" strokeWidth="1.2" strokeDasharray="1.5 2.6" />
      <circle cx="24" cy="24" r="8" fill="#ff8f36" />
      <path d="M27.8 19.2a6.2 6.2 0 1 0 0 9.6 5 5 0 1 1 0-9.6z" fill="#1c1640" />
      <circle cx="35.6" cy="13.4" r="1.6" fill="#f6d58a" />
    </svg>
  );
}

export function Sidebar({ badges, adminName }: { badges: Record<string, number>; adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: I, badge }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              const n = badge ? badges[badge] : 0;
              return (
                <li key={href}>
                  <Link href={href} className={cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', active ? 'bg-white/10 text-gold-300' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
                    <I className={cx('h-4 w-4', active ? 'text-gold-400' : 'text-white/45')} />
                    <span className="flex-1">{label}</span>
                    {!!n && <span className="rounded-full bg-saffron-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{n}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <Mark className="h-8 w-8" />
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold text-white">Talk to <span className="text-saffron-400">Guruji</span></p>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300/70">Admin</p>
      </div>
    </div>
  );

  const foot = (
    <div className="border-t border-white/10 p-3 text-xs text-white/50">
      <p className="truncate px-2">Signed in as <b className="text-white/80">{adminName}</b></p>
      <Link href="/" className="mt-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> View website</Link>
      <Link href="/admin/finance" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 hover:text-white"><BarChart3 className="h-3.5 w-3.5" /> Reports</Link>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-night-900 lg:flex">
        {brand}
        {nav}
        {foot}
      </aside>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-night-900 px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2"><Mark className="h-7 w-7" /><span className="font-display font-semibold text-white">Admin</span></div>
        <button type="button" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Open admin menu"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-night-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-night-900">
            <div className="flex items-center justify-between pr-3">{brand}<button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            {nav}
            {foot}
          </aside>
        </div>
      )}
    </>
  );
}
