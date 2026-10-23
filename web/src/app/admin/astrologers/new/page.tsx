import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { AstroForm } from '@/components/admin/AstroForm';

export const metadata = { title: 'Add astrologer' };

export default function NewAstrologer() {
  return (
    <div className="max-w-4xl">
      <Link href="/admin/astrologers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Astrologers</Link>
      <PageHeader title="Add astrologer" sub="Creates an approved profile. They log in with this mobile number to reach their dashboard." />
      <AstroForm
        initial={{ phone: '', displayName: '', slug: '', avatar: '', bio: '', skills: 'Vedic', languages: 'Hindi, English', experience: 5, qualification: '', gender: '', city: '', chatPrice: 15, callPrice: 20, videoPrice: 25, commission: 30, freeMinutes: 0, isChat: true, isCall: true, isVideo: true, featured: false }}
      />
    </div>
  );
}
