import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/primitives';
import { CartView } from '@/components/commerce/CartView';

export const metadata: Metadata = { title: 'Your Cart', robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Your cart" crumbs={[{ label: 'Astro Mart', href: '/astro-mart' }, { label: 'Cart' }]} compact />
      <section className="container-x py-10"><CartView /></section>
    </>
  );
}
