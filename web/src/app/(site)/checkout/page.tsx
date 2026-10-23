import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/primitives';
import { CheckoutView } from '@/components/commerce/CheckoutView';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHero title="Checkout" crumbs={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} compact />
      <section className="container-x py-10"><CheckoutView /></section>
    </>
  );
}
