'use client';

import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

export function MarkAllRead() {
  const router = useRouter();
  const { refresh } = useApp();
  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      onClick={async () => {
        await fetch('/api/notifications/read', { method: 'POST' });
        await refresh();
        router.refresh();
      }}
    >
      <CheckCheck className="h-4 w-4" /> Mark all as read
    </button>
  );
}
