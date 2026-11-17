import { Product } from '../types';

export interface CategoryDefinition {
  id: string;
  title: string;
  subtitle?: string;
  keywords: string[];
  isService: boolean;
  isDoorstep: boolean;
  isCarWash?: boolean;
  isShadiCarDecor?: boolean;
  isBirthdayApartment?: boolean;
  iconKey:
    | 'car_wash'
    | 'electrician_plumber'
    | 'barber_salon'
    | 'ac_fridge'
    | 'facial_girls'
    | 'hair_girls'
    | 'tailor_boys'
    | 'tailor_girls'
    | 'mehndi'
    | 'shadi_car_decor'
    | 'home_cleaning'
    | 'birthday_apartment';
}

export const SHADI_CAR_DECOR_CATEGORY_ID = 'Shadi Car Decor - Phool - at door step';
export const BOOK_FOR_BIRTHDAY_CATEGORY_ID = 'Book for Birthday';
export const CAR_WASH_CATEGORY_ID = 'Gari / Bike Wash at Home';
export const BARBER_SALON_CATEGORY_ID = 'Barber / Salon at Home';

const LEGACY_HOME_SERVICE_ALIASES: Record<string, string[]> = {
  'gari / bike wash at home': ['car wash - at door step', 'car wash', 'gari wash', 'bike wash', 'gari / bike wash at home'],
  'barber / salon at home': ['hairs / beard / boys', 'barber', 'salon', 'naai', 'barber / salon at home'],
  'mehndi ghar lagwanay - at door step': ['mehndi', 'mehendi', 'henna', 'mehndi ghar lagwanay - at door step'],
  'electrician / plumber': ['electrician', 'plumber', 'bijli', 'bijli wala', 'electrician / plumber'],
  'ac / fridge repair': ['ac repair', 'fridge repair', 'ac / fridge repair'],
  'home cleaning / maid': ['home cleaning', 'maid', 'cleaning', 'safai', 'home cleaning / maid'],
};

const BLOCKED_LEGACY_CATEGORIES = new Set([
  'grocery',
  'groceries',
  'sabzi - at door step',
  'sabzi',
  'sabziyan',
  'fruit',
  'fruits',
  'vegetable',
  'vegetables',
  'night cravings',
  'nashta',
  'craving',
  'cravings',
  'food',
  'khana',
  'khana peena',
  'food restaurant',
  'makeup',
  'gifts',
  'medicine - at door step',
  'medicine',
]);

export const NAWABI_CATEGORIES: CategoryDefinition[] = [
  {
    id: CAR_WASH_CATEGORY_ID,
    title: 'Gari / Bike Wash at Home',
    subtitle: 'Packages, price & wash time',
    keywords: [
      'gari', 'gaari', 'car', 'bike', 'motorcycle', 'wash', 'car wash', 'gari wash',
      'bike wash', 'dhulai', 'dhona', 'cleaning', 'polish', 'wax', 'foam wash', 'detailing',
    ],
    isService: true,
    isDoorstep: true,
    isCarWash: true,
    iconKey: 'car_wash',
  },
  {
    id: 'Electrician / Plumber',
    title: 'Electrician / Plumber',
    subtitle: 'Wiring, UPS, pipe & tap repair',
    keywords: [
      'electrician', 'plumber', 'bijli', 'bijli wala', 'bijli mistri', 'mistri',
      'wiring', 'ups', 'inverter', 'switch', 'socket', 'fan', 'pankha', 'light',
      'breaker', 'pipe', 'nal', 'nalka', 'tap', 'motor', 'tanki', 'geyser',
      'sanitary', 'leak', 'leakage', 'bathroom', 'drain',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'electrician_plumber',
  },
  {
    id: BARBER_SALON_CATEGORY_ID,
    title: 'Barber / Salon at Home',
    subtitle: 'Haircut, beard & home grooming',
    keywords: [
      'barber', 'salon', 'naai', 'nai', 'hair', 'hairs', 'haircut', 'hair cut',
      'beard', 'khat', 'darhi', 'dadhi', 'shave', 'trim', 'cutting', 'bal', 'baal',
      'grooming', 'boys', 'gents', 'men', 'facial', 'massage',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'barber_salon',
  },
  {
    id: 'AC / Fridge Repair',
    title: 'AC / Fridge Repair',
    subtitle: 'AC service, gas & fridge repair',
    keywords: [
      'ac', 'air conditioner', 'inverter ac', 'split ac', 'fridge', 'refrigerator',
      'freezer', 'deep freezer', 'repair', 'gas', 'gas refill', 'cooling', 'service',
      'technician', 'mechanic', 'compressor', 'dispenser',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'ac_fridge',
  },
  {
    id: 'Facial / Girls',
    title: 'Facial / Girls',
    subtitle: 'Home beauty service',
    keywords: [
      'facial', 'beauty', 'parlour', 'parlor', 'girls', 'ladies', 'women', 'skin',
      'cleanup', 'wax', 'waxing', 'manicure', 'pedicure', 'threading', 'salon',
      'home beauty', 'bleach', 'hydra',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'facial_girls',
  },
  {
    id: 'Hairs Cutting / Girls',
    title: 'Hairs Cutting / Girls',
    subtitle: 'Ladies hair stylist at home',
    keywords: [
      'hair', 'hairs', 'cutting', 'haircut', 'girls', 'ladies', 'women', 'stylist',
      'salon', 'parlour', 'parlor', 'baal', 'bal', 'blow dry', 'keratin', 'dye', 'color',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'hair_girls',
  },
  {
    id: 'Tailor / Darzi - Boys - at door step',
    title: 'Tailor / Darzi - Boys - at door step',
    subtitle: 'Gents stitching & measurement',
    keywords: [
      'tailor', 'darzi', 'boys', 'gents', 'men', 'kapray', 'kapde', 'silai',
      'stitching', 'shalwar', 'kameez', 'kurta', 'suit', 'waistcoat', 'naap', 'measurement',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'tailor_boys',
  },
  {
    id: 'Tailor / Darzi - Girls - at door step',
    title: 'Tailor / Darzi - Girls - at door step',
    subtitle: 'Ladies suit stitching at home',
    keywords: [
      'tailor', 'darzi', 'girls', 'ladies', 'women', 'kapray', 'kapde', 'silai',
      'stitching', 'suit', 'lawn', 'frock', 'lehenga', 'blouse', 'naap', 'embroidery',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'tailor_girls',
  },
  {
    id: 'Mehndi Ghar Lagwanay - at door step',
    title: 'Mehndi Ghar Lagwanay - at door step',
    subtitle: 'Bridal & party mehndi artist',
    keywords: [
      'mehndi', 'mehendi', 'mahndi', 'henna', 'hina', 'bridal mehndi', 'dulhan mehndi',
      'party mehndi', 'arabic mehndi', 'ghar', 'lagwanay', 'hath', 'haath', 'shadi', 'eid',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'mehndi',
  },
  {
    id: SHADI_CAR_DECOR_CATEGORY_ID,
    title: SHADI_CAR_DECOR_CATEGORY_ID,
    subtitle: 'Ghar Aake Gari Sajayen',
    keywords: [
      'shadi', 'shaadi', 'car', 'gari', 'decor', 'decoration', 'sajawat', 'sajayen',
      'phool', 'flowers', 'rose', 'gulab', 'dulhan', 'barat', 'baraat', 'bridal car', 'mehndi car',
    ],
    isService: true,
    isDoorstep: true,
    isShadiCarDecor: true,
    iconKey: 'shadi_car_decor',
  },
  {
    id: 'Home Cleaning / Maid',
    title: 'Home Cleaning / Maid',
    subtitle: 'Sofa, carpet & deep cleaning',
    keywords: [
      'cleaning', 'clean', 'maid', 'kaam wali', 'kam wali', 'safai', 'ghar safai',
      'sofa', 'carpet', 'mattress', 'qaleen', 'tank', 'tanki safai', 'washroom', 'kitchen', 'helper',
    ],
    isService: true,
    isDoorstep: true,
    iconKey: 'home_cleaning',
  },
  {
    id: BOOK_FOR_BIRTHDAY_CATEGORY_ID,
    title: 'Book for Birthday',
    subtitle: 'Birthday / Anniversary Apartments',
    keywords: [
      'birthday', 'salgirah', 'anniversary', 'party', 'apartment', 'suite', 'room',
      'decor', 'decoration', 'balloons', 'celebration', 'surprise', 'book',
    ],
    isService: true,
    isDoorstep: false,
    isBirthdayApartment: true,
    iconKey: 'birthday_apartment',
  },
];

// Roman Urdu & colloquial query expansions for Home Services
const ROMAN_URDU_SYNONYMS: Record<string, string[]> = {
  naai: ['barber', 'haircut', 'beard', 'shave'],
  nai: ['barber', 'haircut', 'beard', 'shave'],
  bijli: ['electrician', 'wiring', 'ups', 'switch', 'fan'],
  bijliwala: ['electrician', 'wiring', 'ups'],
  mistri: ['electrician', 'plumber', 'repair', 'mechanic'],
  nal: ['plumber', 'tap', 'pipe'],
  nalka: ['plumber', 'tap', 'pipe'],
  tanki: ['plumber', 'cleaning', 'motor'],
  gari: ['car', 'bike', 'wash', 'gari / bike wash'],
  gaari: ['car', 'bike', 'wash'],
  dhulai: ['wash', 'cleaning'],
  mehendi: ['mehndi', 'henna'],
  mahndi: ['mehndi', 'henna'],
  henna: ['mehndi', 'mehendi'],
  hina: ['mehndi', 'henna'],
  darzi: ['tailor', 'stitching', 'silai'],
  silai: ['tailor', 'darzi', 'stitching'],
  safai: ['cleaning', 'maid'],
  kaam: ['maid', 'cleaning', 'helper'],
  wali: ['maid', 'cleaning'],
  bal: ['hair', 'hairs', 'barber', 'salon'],
  baal: ['hair', 'hairs', 'barber', 'salon'],
  khat: ['beard', 'barber', 'shave'],
  darhi: ['beard', 'barber', 'shave'],
  dadhi: ['beard', 'barber', 'shave'],
  frige: ['fridge', 'refrigerator'],
  cooling: ['ac', 'fridge'],
  phool: ['shadi car decor', 'flowers', 'decor'],
  shaadi: ['shadi', 'dulhan', 'barat', 'mehndi'],
  salgirah: ['birthday', 'party'],
};

function normalizeSearchText(raw?: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[/\-_.,|()&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haystackMatchesToken(haystack: string, haystackWords: string[], token: string): boolean {
  const cleanTok = normalizeSearchText(token);
  if (!cleanTok) return false;
  if (cleanTok.includes(' ')) {
    return haystack.includes(cleanTok);
  }
  if (cleanTok.length <= 2) {
    // Short queries like "ac" must match exact word boundaries, not inside "facial" or "packages"
    return haystackWords.some((hw) => hw === cleanTok);
  }
  // 3+ char words match prefix on any word or substring in full haystack (so "meh" -> "mehndi")
  return haystackWords.some((hw) => hw.startsWith(cleanTok)) || haystack.includes(cleanTok);
}

function wordMatchesHaystackWithSynonyms(
  word: string,
  haystack: string,
  haystackWords: string[]
): boolean {
  if (haystackMatchesToken(haystack, haystackWords, word)) return true;

  const directSyns = ROMAN_URDU_SYNONYMS[word] || [];
  if (directSyns.some((syn) => haystackMatchesToken(haystack, haystackWords, syn))) {
    return true;
  }

  if (word.length >= 3) {
    for (const [key, vals] of Object.entries(ROMAN_URDU_SYNONYMS)) {
      if (
        key.startsWith(word) &&
        (haystackMatchesToken(haystack, haystackWords, key) ||
          vals.some((v) => haystackMatchesToken(haystack, haystackWords, v)))
      ) {
        return true;
      }
    }
  }
  return false;
}

function queryMatchesHaystack(rawQuery: string, haystack: string): boolean {
  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return true;
  const haystackWords = haystack.split(' ').filter(Boolean);

  if (cleanQuery.length <= 2) {
    return haystackWords.some((hw) => hw === cleanQuery);
  }
  if (haystack.includes(cleanQuery)) return true;

  const rawWords = cleanQuery.split(' ').filter(Boolean);
  const meaningfulWords = rawWords.filter(
    (w) => !['wala', 'wali', 'at', 'home', 'ka', 'ke', 'ki', 'for'].includes(w)
  );
  const wordsToCheck = meaningfulWords.length > 0 ? meaningfulWords : rawWords;

  // Check joined Roman Urdu phrase shortcut first (e.g. "bijli wala" -> "bijliwala")
  const joined = rawWords.join('');
  if (
    ROMAN_URDU_SYNONYMS[joined]?.some((syn) =>
      haystackMatchesToken(haystack, haystackWords, syn)
    )
  ) {
    return true;
  }

  return wordsToCheck.every((w) => wordMatchesHaystackWithSynonyms(w, haystack, haystackWords));
}

function findCategoryForProduct(productCategory?: string): CategoryDefinition | undefined {
  const clean = normalizeSearchText(productCategory);
  if (!clean) return undefined;
  return NAWABI_CATEGORIES.find(
    (c) =>
      matchesProductCategory(productCategory || '', c.id) ||
      normalizeSearchText(c.title).includes(clean) ||
      c.keywords.some((kw) => clean === normalizeSearchText(kw))
  );
}

export function matchesProductCategory(productCategory: string, selectedCategoryId: string): boolean {
  if (!selectedCategoryId || selectedCategoryId === 'All') return true;
  const prodCat = (productCategory || '').toLowerCase().trim();
  const target = selectedCategoryId.toLowerCase().trim();
  if (prodCat === target) return true;
  const aliases = LEGACY_HOME_SERVICE_ALIASES[target];
  if (aliases && aliases.includes(prodCat)) return true;
  const normProd = normalizeSearchText(productCategory);
  const normTarget = normalizeSearchText(selectedCategoryId);
  if (normProd && normTarget && (normProd === normTarget || normProd.includes(normTarget))) {
    return true;
  }
  return false;
}

export function isCarWashCategory(category?: string): boolean {
  const clean = (category || '').toLowerCase().trim();
  return (
    clean === 'gari / bike wash at home' ||
    clean === 'car wash - at door step' ||
    clean.includes('car wash') ||
    clean.includes('gari / bike wash')
  );
}

export function isAllowedHomeServiceCategory(category?: string): boolean {
  const clean = (category || '').toLowerCase().trim();
  if (!clean) return false;
  if (BLOCKED_LEGACY_CATEGORIES.has(clean)) return false;
  const norm = normalizeSearchText(clean);
  if (
    /\b(grocery|groceries|sabzi|sabziyan|fruit|fruits|vegetable|vegetables|craving|cravings|nashta|khana|restaurant|makeup|gifts|medicine|bakery|rashan)\b/.test(
      norm
    )
  ) {
    return false;
  }
  if (NAWABI_CATEGORIES.some((cat) => matchesProductCategory(clean, cat.id))) {
    return true;
  }
  // Allow variant home service category strings if posted in Firestore under short names
  return /(mehndi|mehendi|henna|wash|electrician|plumber|barber|salon|hair|beard|ac|fridge|facial|tailor|darzi|shadi|decor|cleaning|maid|birthday|service)/.test(
    norm
  );
}

export function searchMatchingCategories(rawQuery: string): CategoryDefinition[] {
  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return [];

  return NAWABI_CATEGORIES.filter((cat) => {
    const haystack = normalizeSearchText(
      `${cat.id} ${cat.title} ${cat.subtitle || ''} ${cat.keywords.join(' ')}`
    );
    return queryMatchesHaystack(rawQuery, haystack);
  });
}

export function matchesServiceSearch(product: Product, rawQuery: string): boolean {
  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return true;

  const matchedCat = findCategoryForProduct(product.category);
  const packageText = (product.packages || [])
    .map((pk) => `${pk.name || ''} ${pk.time || ''}`)
    .join(' ');

  const haystack = normalizeSearchText(
    [
      product.title,
      product.category,
      product.sellerName,
      product.location,
      product.description,
      packageText,
      matchedCat?.title,
      matchedCat?.subtitle,
      ...(matchedCat?.keywords || []),
    ]
      .filter(Boolean)
      .join(' ')
  );

  return queryMatchesHaystack(rawQuery, haystack);
}
