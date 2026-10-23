import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { AstroProfileForm } from '@/components/consult/AstroProfileForm';

export const metadata: Metadata = { title: 'Profile & pricing' };

export default async function PanelProfile() {
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel/profile');
  const a = u.astrologer!;
  return (
    <div className="max-w-3xl">
      <h1 className="h-display text-3xl text-night-900">Profile & pricing</h1>
      <p className="mt-1 text-sm text-muted">This is what seekers see on your public profile. Prices are per minute; the platform keeps {a.commission}%.</p>
      <AstroProfileForm
        initial={{
          displayName: a.displayName, bio: a.bio, skills: a.skills, languages: a.languages, experience: a.experience, qualification: a.qualification || '', city: a.city || '',
          chatPrice: a.chatPrice / 100, callPrice: a.callPrice / 100, videoPrice: a.videoPrice / 100, isChat: a.isChat, isCall: a.isCall, isVideo: a.isVideo,
        }}
      />
    </div>
  );
}
