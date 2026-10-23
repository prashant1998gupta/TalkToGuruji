import {
  BookOpen, Calendar, CalendarDays, CalendarRange, Compass, Flame, GalleryHorizontal, Globe2, Hash, Headphones, HeartHandshake, Images,
  Landmark, Layers, Megaphone, MessageCircle, Moon, Music, Newspaper, Orbit, PartyPopper, Phone, PlayCircle, Radio, Sparkles, Star, Sun,
  Sunrise, Video, type LucideIcon,
} from 'lucide-react';

// Name → icon map so nav config can stay plain data.
const ICONS: Record<string, LucideIcon> = {
  BookOpen, Calendar, CalendarDays, CalendarRange, Compass, Flame, GalleryHorizontal, Globe2, Hash, Headphones, HeartHandshake, Images,
  Landmark, Layers, Megaphone, MessageCircle, Moon, Music, Newspaper, Orbit, PartyPopper, Phone, PlayCircle, Radio, Sparkles, Star, Sun,
  Sunrise, Video,
};

export function Icon({ name, className = 'h-4 w-4' }: { name?: string; className?: string }) {
  const C = (name && ICONS[name]) || Sparkles;
  return <C className={className} aria-hidden="true" />;
}
