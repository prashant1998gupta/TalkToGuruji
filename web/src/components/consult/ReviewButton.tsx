'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { ReviewModal } from './ConsultRoom';
import { useApp } from '@/components/providers/AppProvider';

export function ReviewButton({ sessionId, astroName, label = 'Rate this consultation' }: { sessionId: string; astroName: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useApp();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary btn-sm"><Star className="h-4 w-4" /> {label}</button>
      {open && <ReviewModal sessionId={sessionId} astroName={astroName} onClose={() => setOpen(false)} onDone={() => { setOpen(false); toast('Thank you for your review!', 'success'); router.refresh(); }} />}
    </>
  );
}
