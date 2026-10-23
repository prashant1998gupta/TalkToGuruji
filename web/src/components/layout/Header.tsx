'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingBag, User, Wallet, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/components/providers/AppProvider';
import { NAV } from '@/lib/nav';
import { cx, rupees } from '@/lib/format';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(null); setDrawer(false); }, [pathname]);

  return (
    <header className={cx('sticky top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-line/80 bg-cream-50/85 shadow-[0_6px_24px_-18px_rgb(29_26_43/0.4)] backdrop-blur-xl' : 'bg-cream-50/60 backdrop-blur')}>
      <div className="container-x flex h-16 items-center gap-4 lg:h-[72px]">
        <Logo />

        <nav className="ml-6 hidden items-center gap-0.5 lg:flex" aria-label="Main" onMouseLeave={() => setOpen(null)}>
          {NAV.map((g) =>
            g.href ? (
              <Link key={g.label} href={g.href} className={cx('rounded-full px-3.5 py-2 text-sm font-semibold transition hover:text-saffron-600', pathname.startsWith(g.href) ? 'text-saffron-600' : 'text-ink/80')}>
                {g.label}
              </Link>
            ) : (
              <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)}>
                <button
                  type="button"
                  className={cx('flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition hover:text-saffron-600', open === g.label ? 'text-saffron-600' : 'text-ink/80')}
                  aria-expanded={open === g.label}
                  onClick={() => setOpen(open === g.label ? null : g.label)}
                >
                  {g.label}
                  <ChevronDown className={cx('h-3.5 w-3.5 transition', open === g.label && 'rotate-180')} />
                </button>
                {open === g.label && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                    <div className={cx('grid animate-fade-up gap-6 rounded-3xl border border-line bg-white p-5 shadow-lift [animation-duration:.25s]', g.columns!.length > 1 ? 'w-[620px] grid-cols-2' : 'w-[300px]')}>
                      {g.columns!.map((col) => (
                        <div key={col.title}>
                          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{col.title}</p>
                          <ul>
                            {col.links.map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} className="group flex items-start gap-3 rounded-2xl p-2 transition hover:bg-cream-100">
                                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-saffron-50 text-saffron-600 transition group-hover:bg-saffron-500 group-hover:text-white">
                                    <Icon name={l.icon} />
                                  </span>
                                  <span>
                                    <span className="block text-sm font-semibold text-ink">{l.label}</span>
                                    {l.desc && <span className="block text-xs text-muted">{l.desc}</span>}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <UserArea />
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {drawer && <MobileDrawer onClose={() => setDrawer(false)} />}
    </header>
  );
}

function UserArea() {
  const { user, loading, refresh } = useApp();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (loading) return <div className="h-10 w-24 animate-pulse rounded-full bg-cream-200" />;
  if (!user) {
    return (
      <Link href="/login" className="btn-dark">
        <User className="h-4 w-4" /> Login
      </Link>
    );
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    router.push('/');
    router.refresh();
  };

  const initials = (user.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex items-center gap-2" ref={ref}>
      {user.role === 'USER' && (
        <Link href="/wallet" className="hidden items-center gap-1.5 rounded-full border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm font-bold text-saffron-700 transition hover:bg-saffron-100 sm:flex" title="Wallet balance">
          <Wallet className="h-4 w-4" /> {rupees(user.walletBalance)}
        </Link>
      )}
      <Link href="/notifications" className="relative hidden h-10 w-10 place-items-center rounded-full border border-line bg-white sm:grid" aria-label="Notifications">
        <Bell className="h-4.5 w-4.5" />
        {user.unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">{user.unread}</span>}
      </Link>
      <div className="relative">
        <button type="button" onClick={() => setMenu((m) => !m)} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-night-700 to-night-900 text-sm font-bold text-gold-300 ring-2 ring-white" aria-label="Account menu" aria-expanded={menu}>
          {initials}
        </button>
        {menu && (
          <div className="absolute right-0 top-12 w-64 animate-fade-up rounded-2xl border border-line bg-white p-2 shadow-lift [animation-duration:.2s]">
            <div className="border-b border-line px-3 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-bold">{user.name || 'Welcome'}</p>
              <p className="text-xs text-muted">+91 {user.phone}</p>
            </div>
            <div className="py-1">
              {user.role === 'ADMIN' && <MenuLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />}>Admin panel</MenuLink>}
              {user.role === 'ASTROLOGER' && <MenuLink href="/astrologer-panel" icon={<LayoutDashboard className="h-4 w-4" />}>Astrologer dashboard</MenuLink>}
              <MenuLink href="/account" icon={<User className="h-4 w-4" />}>My account</MenuLink>
              <MenuLink href="/wallet" icon={<Wallet className="h-4 w-4" />}>Wallet · {rupees(user.walletBalance)}</MenuLink>
              <MenuLink href="/account/orders" icon={<ShoppingBag className="h-4 w-4" />}>Orders & bookings</MenuLink>
            </div>
            <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose hover:bg-rose/5">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink/85 hover:bg-cream-100">
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<string | null>('Consult');
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-night-950/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-cream-50 shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo />
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-line" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
          {NAV.map((g) =>
            g.href ? (
              <Link key={g.label} href={g.href} className="block rounded-xl px-3 py-3 font-semibold">
                {g.label}
              </Link>
            ) : (
              <div key={g.label} className="border-b border-line/70">
                <button type="button" className="flex w-full items-center justify-between px-3 py-3 font-semibold" onClick={() => setSection(section === g.label ? null : g.label)} aria-expanded={section === g.label}>
                  {g.label}
                  <ChevronDown className={cx('h-4 w-4 transition', section === g.label && 'rotate-180')} />
                </button>
                {section === g.label && (
                  <div className="grid grid-cols-2 gap-1.5 px-1 pb-3">
                    {g.columns!.flatMap((c) => c.links).map((l) => (
                      <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2.5 text-[13px] font-medium ring-1 ring-line">
                        <Icon name={l.icon} className="h-4 w-4 shrink-0 text-saffron-600" />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
        </nav>
      </aside>
    </div>
  );
}
