export type Sign = { slug: string; name: string; hindi: string; glyph: string; dates: string; element: 'Fire' | 'Earth' | 'Air' | 'Water'; lord: string };

// ︎ forces text (not emoji) presentation of the glyphs.
export const SIGNS: Sign[] = [
  { slug: 'aries', name: 'Aries', hindi: 'Mesh', glyph: '♈︎', dates: 'Mar 21 – Apr 19', element: 'Fire', lord: 'Mars' },
  { slug: 'taurus', name: 'Taurus', hindi: 'Vrishabh', glyph: '♉︎', dates: 'Apr 20 – May 20', element: 'Earth', lord: 'Venus' },
  { slug: 'gemini', name: 'Gemini', hindi: 'Mithun', glyph: '♊︎', dates: 'May 21 – Jun 20', element: 'Air', lord: 'Mercury' },
  { slug: 'cancer', name: 'Cancer', hindi: 'Kark', glyph: '♋︎', dates: 'Jun 21 – Jul 22', element: 'Water', lord: 'Moon' },
  { slug: 'leo', name: 'Leo', hindi: 'Simha', glyph: '♌︎', dates: 'Jul 23 – Aug 22', element: 'Fire', lord: 'Sun' },
  { slug: 'virgo', name: 'Virgo', hindi: 'Kanya', glyph: '♍︎', dates: 'Aug 23 – Sep 22', element: 'Earth', lord: 'Mercury' },
  { slug: 'libra', name: 'Libra', hindi: 'Tula', glyph: '♎︎', dates: 'Sep 23 – Oct 22', element: 'Air', lord: 'Venus' },
  { slug: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', glyph: '♏︎', dates: 'Oct 23 – Nov 21', element: 'Water', lord: 'Mars' },
  { slug: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', glyph: '♐︎', dates: 'Nov 22 – Dec 21', element: 'Fire', lord: 'Jupiter' },
  { slug: 'capricorn', name: 'Capricorn', hindi: 'Makar', glyph: '♑︎', dates: 'Dec 22 – Jan 19', element: 'Earth', lord: 'Saturn' },
  { slug: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', glyph: '♒︎', dates: 'Jan 20 – Feb 18', element: 'Air', lord: 'Saturn' },
  { slug: 'pisces', name: 'Pisces', hindi: 'Meen', glyph: '♓︎', dates: 'Feb 19 – Mar 20', element: 'Water', lord: 'Jupiter' },
];

export const signBySlug = (s: string) => SIGNS.find((x) => x.slug === s.toLowerCase());

export const ELEMENT_TINT: Record<Sign['element'], string> = {
  Fire: 'from-saffron-400 to-rose',
  Earth: 'from-leaf to-gold-500',
  Air: 'from-sky-400 to-night-600',
  Water: 'from-cyan-500 to-night-700',
};
