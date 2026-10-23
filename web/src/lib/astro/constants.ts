// Classical Jyotish reference data used by the kundli, panchang and matching engines.

export const RASHIS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const RASHIS_HI = ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Simha', 'Kanya', 'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen'];
export const RASHI_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

export type Graha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export const GRAHAS: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const GRAHA_HI: Record<Graha, string> = { Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangal', Mercury: 'Budh', Jupiter: 'Guru', Venus: 'Shukra', Saturn: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu' };
export const GRAHA_ABBR: Record<Graha | 'Asc', string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'As' };

/** Lord of each rashi (index 0 = Aries). */
export const SIGN_LORD: Graha[] = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export const EXALTATION: Partial<Record<Graha, number>> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
export const DEBILITATION: Partial<Record<Graha, number>> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
  'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/** Vimshottari order and years. Nakshatra lord = DASHA_ORDER[nakIndex % 9]. */
export const DASHA_ORDER: Graha[] = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
export const DASHA_YEARS: Record<Graha, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

export const NAME_SYLLABLES = [
  ['Chu', 'Che', 'Cho', 'La'], ['Li', 'Lu', 'Le', 'Lo'], ['A', 'I', 'U', 'E'], ['O', 'Va', 'Vi', 'Vu'], ['Ve', 'Vo', 'Ka', 'Ki'],
  ['Ku', 'Gha', 'Ng', 'Chha'], ['Ke', 'Ko', 'Ha', 'Hi'], ['Hu', 'He', 'Ho', 'Da'], ['Di', 'Du', 'De', 'Do'], ['Ma', 'Mi', 'Mu', 'Me'],
  ['Mo', 'Ta', 'Ti', 'Tu'], ['Te', 'To', 'Pa', 'Pi'], ['Pu', 'Sha', 'Na', 'Tha'], ['Pe', 'Po', 'Ra', 'Ri'], ['Ru', 'Re', 'Ro', 'Ta'],
  ['Ti', 'Tu', 'Te', 'To'], ['Na', 'Ni', 'Nu', 'Ne'], ['No', 'Ya', 'Yi', 'Yu'], ['Ye', 'Yo', 'Ba', 'Bi'], ['Bu', 'Dha', 'Bha', 'Dha'],
  ['Be', 'Bo', 'Ja', 'Ji'], ['Ju', 'Je', 'Jo', 'Gha'], ['Ga', 'Gi', 'Gu', 'Ge'], ['Go', 'Sa', 'Si', 'Su'], ['Se', 'So', 'Da', 'Di'],
  ['Du', 'Tha', 'Jha', 'Da'], ['De', 'Do', 'Cha', 'Chi'],
];

export const YONI = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Sheep', 'Cat', 'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo',
  'Tiger', 'Deer', 'Deer', 'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Elephant',
];
export const YONI_ENEMIES: [string, string][] = [['Horse', 'Buffalo'], ['Elephant', 'Lion'], ['Sheep', 'Monkey'], ['Serpent', 'Mongoose'], ['Dog', 'Deer'], ['Cat', 'Rat'], ['Cow', 'Tiger']];

export type Gana = 'Deva' | 'Manushya' | 'Rakshasa';
export const GANA: Gana[] = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Manushya', 'Deva', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva',
  'Rakshasa', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya',
  'Manushya', 'Deva',
];

export const NADI = ['Adi', 'Madhya', 'Antya'] as const;
export const nadiOf = (nak: number) => NADI[[0, 1, 2, 2, 1, 0][nak % 6]];

export const VARNA = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'] as const;
/** Varna by moon sign: water = Brahmin, fire = Kshatriya, earth = Vaishya, air = Shudra. */
export const varnaOf = (sign: number) => (['Kshatriya', 'Vaishya', 'Shudra', 'Brahmin'] as const)[sign % 4];

export const VASHYA_GROUPS = ['Chatushpad', 'Manav', 'Jalchar', 'Vanchar', 'Keet'] as const;
export const VASHYA_BY_SIGN: (typeof VASHYA_GROUPS)[number][] = ['Chatushpad', 'Chatushpad', 'Manav', 'Jalchar', 'Vanchar', 'Manav', 'Manav', 'Keet', 'Manav', 'Jalchar', 'Manav', 'Jalchar'];

export const TATVA = ['Fire', 'Earth', 'Air', 'Water'];

/** Natural planetary friendships (Naisargika maitri). */
export const FRIENDS: Record<string, { f: Graha[]; e: Graha[] }> = {
  Sun: { f: ['Moon', 'Mars', 'Jupiter'], e: ['Venus', 'Saturn'] },
  Moon: { f: ['Sun', 'Mercury'], e: [] },
  Mars: { f: ['Sun', 'Moon', 'Jupiter'], e: ['Mercury'] },
  Mercury: { f: ['Sun', 'Venus'], e: ['Moon'] },
  Jupiter: { f: ['Sun', 'Moon', 'Mars'], e: ['Mercury', 'Venus'] },
  Venus: { f: ['Mercury', 'Saturn'], e: ['Sun', 'Moon'] },
  Saturn: { f: ['Mercury', 'Venus'], e: ['Sun', 'Moon', 'Mars'] },
};

export const GEMSTONE: Record<Graha, { stone: string; hindi: string; metal: string; finger: string; day: string }> = {
  Sun: { stone: 'Ruby', hindi: 'Manik', metal: 'Gold', finger: 'Ring finger', day: 'Sunday' },
  Moon: { stone: 'Pearl', hindi: 'Moti', metal: 'Silver', finger: 'Little finger', day: 'Monday' },
  Mars: { stone: 'Red Coral', hindi: 'Moonga', metal: 'Gold or copper', finger: 'Ring finger', day: 'Tuesday' },
  Mercury: { stone: 'Emerald', hindi: 'Panna', metal: 'Gold', finger: 'Little finger', day: 'Wednesday' },
  Jupiter: { stone: 'Yellow Sapphire', hindi: 'Pukhraj', metal: 'Gold', finger: 'Index finger', day: 'Thursday' },
  Venus: { stone: 'Diamond / Opal', hindi: 'Heera', metal: 'Platinum or silver', finger: 'Middle finger', day: 'Friday' },
  Saturn: { stone: 'Blue Sapphire', hindi: 'Neelam', metal: 'Silver or panchdhatu', finger: 'Middle finger', day: 'Saturday' },
  Rahu: { stone: 'Hessonite', hindi: 'Gomed', metal: 'Silver', finger: 'Middle finger', day: 'Saturday' },
  Ketu: { stone: "Cat's Eye", hindi: 'Lehsunia', metal: 'Silver', finger: 'Little finger', day: 'Tuesday' },
};

export const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi',
  'Dwadashi', 'Trayodashi', 'Chaturdashi',
];
export const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti',
];
export const INAUSPICIOUS_YOGAS = new Set(['Vishkambha', 'Atiganda', 'Shula', 'Ganda', 'Vyaghata', 'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti']);
export const KARANAS_MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
export const VARAS = ['Ravivar (Sunday)', 'Somvar (Monday)', 'Mangalvar (Tuesday)', 'Budhvar (Wednesday)', 'Guruvar (Thursday)', 'Shukravar (Friday)', 'Shanivar (Saturday)'];
export const MASAS = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartik', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];
export const RITUS = ['Vasant', 'Grishma', 'Varsha', 'Sharad', 'Hemant', 'Shishir'];
