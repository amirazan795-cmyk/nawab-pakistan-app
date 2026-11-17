export interface MatchedProductImage {
  image: string;
  matchedLabel: string;
  suggestedCategory: 'Groceries' | 'Dairy & Bakery' | 'Household' | 'Snacks & Drinks' | 'Electronics' | 'Sports & Fashion';
}

export const PRODUCT_IMAGE_RULES: {
  keywords: string[];
  image: string;
  label: string;
  suggestedCategory: 'Groceries' | 'Dairy & Bakery' | 'Household' | 'Snacks & Drinks' | 'Electronics' | 'Sports & Fashion';
}[] = [
  // 1. Sox / Socks / Jurab / Hosiery (TOP PRIORITY - Matches 'sox', 'socks', 'jurab', etc.)
  {
    keywords: [
      'sox',
      'socks',
      'sock',
      'jurab',
      'jurabay',
      'jurabein',
      'juraban',
      'cotton socks',
      'ankle socks',
      'sports socks',
      'dress socks',
      'winter socks',
      'white socks',
      'black socks',
      'warm socks',
      'pair of socks',
    ],
    image: '/assets/images/cotton_socks_pair_1793875065760.jpg',
    label: 'Cotton Socks / Jurab (Sox)',
    suggestedCategory: 'Sports & Fashion',
  },

  // 2. Bread / Bakery / Double Roti
  {
    keywords: [
      'bread',
      'double roti',
      'roti',
      'loaf',
      'bun',
      'toast',
      'bakery',
      'rusk',
      'sandwich',
      'bread loaf',
      'sliced bread',
      'dawn bread',
      'shezan bread',
    ],
    image: '/assets/images/fresh_bread_loaf_1793874453704.jpg',
    label: 'Fresh Bread Loaf / Double Roti',
    suggestedCategory: 'Dairy & Bakery',
  },

  // 3. Milk / Doodh / Dairy
  {
    keywords: [
      'doodh',
      'dudh',
      'milk',
      'dahi',
      'yogurt',
      'lassi',
      'cream',
      'olpers',
      'milkpak',
      'dairy',
      'makhan',
      'butter',
      'khoya',
      'tetra pack',
    ],
    image: '/assets/images/pakistan_milk_pack_1793797368219.jpg',
    label: 'Fresh Pure Milk Pack (Doodh)',
    suggestedCategory: 'Dairy & Bakery',
  },

  // 4. Eggs / Anda / Anday
  {
    keywords: ['anda', 'anday', 'ande', 'egg', 'eggs', 'desi anda', 'poultry', 'farm eggs', 'brown eggs'],
    image: '/assets/images/farm_fresh_eggs_1793797369034.jpg',
    label: 'Fresh Farm Eggs (Anda)',
    suggestedCategory: 'Groceries',
  },

  // 5. Sabzi / Vegetables / Tomato / Kheera / Aloo / Onion
  {
    keywords: [
      'sabzi',
      'sabziyan',
      'vegetable',
      'vegetables',
      'tamatar',
      'tomato',
      'tomatoes',
      'kheera',
      'cucumber',
      'aloo',
      'potato',
      'potatoes',
      'pyaaz',
      'piyaz',
      'onion',
      'onions',
      'mirch',
      'chilli',
      'palak',
      'spinach',
      'gobi',
      'cauliflower',
      'cabbage',
      'matar',
      'peas',
      'bhindi',
      'okra',
      'adrak',
      'ginger',
      'lehsan',
      'garlic',
      'fresh sabzi',
      'taza sabzi',
    ],
    image: '/assets/images/fresh_rawalpindi_sabzi_1793874453805.jpg',
    label: 'Fresh Rawalpindi Sabzi / Vegetables',
    suggestedCategory: 'Groceries',
  },

  // 6. Apples / Fruits / Saib / Seb / Mango / Kela
  {
    keywords: [
      'saib',
      'seb',
      'apple',
      'apples',
      'fruit',
      'fruits',
      'phal',
      'kela',
      'banana',
      'bananas',
      'aam',
      'mango',
      'mangoes',
      'amrood',
      'guava',
      'angoor',
      'grapes',
      'orange',
      'kino',
      'malta',
      'strawberries',
      'tarbooz',
      'watermelon',
    ],
    image: '/assets/images/rawalpindi_fresh_apples_1793797367450.jpg',
    label: 'Fresh Swat Apples / Fruits (Saib)',
    suggestedCategory: 'Groceries',
  },

  // 7. Cricket Bat / Ball / Sports
  {
    keywords: [
      'cricket',
      'bat',
      'cricket bat',
      'ca bat',
      'willow',
      'ball',
      'tape ball',
      'hard ball',
      'wicket',
      'sports',
      'football',
      'gym',
      'pads',
      'gloves',
      'shuttle',
      'racket',
    ],
    image: '/assets/images/cricket_bat_rawalpindi_1793797369886.jpg',
    label: 'CA Cricket Bat / Sports Gear',
    suggestedCategory: 'Sports & Fashion',
  },

  // 8. Shoes / Chappal / Peshawari / Joggers / Slippers
  {
    keywords: [
      'shoes',
      'shoe',
      'joggers',
      'sneakers',
      'chappal',
      'peshawari',
      'sandal',
      'sandals',
      'slippers',
      'khussa',
      'boots',
      'chappals',
    ],
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    label: 'Comfort Shoes / Chappal / Footwear',
    suggestedCategory: 'Sports & Fashion',
  },

  // 9. Watch / Ghari / Smartwatch
  {
    keywords: ['watch', 'ghari', 'ghadi', 'smartwatch', 'wrist watch', 'casio', 'clock'],
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    label: 'Wrist Watch / Smartwatch (Ghari)',
    suggestedCategory: 'Electronics',
  },

  // 10. Bag / School Bag / Backpack / Wallet / Purse
  {
    keywords: ['bag', 'backpack', 'school bag', 'purse', 'wallet', 'handbag', 'basta'],
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    label: 'Leather Bag / Backpack / Wallet',
    suggestedCategory: 'Sports & Fashion',
  },

  // 11. Perfume / Attar / Bodyspray
  {
    keywords: ['perfume', 'attar', 'ittar', 'fragrance', 'bodyspray', 'cologne', 'khushbu', 'scent'],
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
    label: 'Perfume / Attar / Fragrance',
    suggestedCategory: 'Household',
  },

  // 12. Pure Honey / Shehad
  {
    keywords: ['honey', 'shehad', 'shahad', 'swat honey', 'sidr honey', 'beri honey'],
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    label: 'Pure Organic Honey (Shehad)',
    suggestedCategory: 'Groceries',
  },

  // 13. Chips / Snacks / Nimko / Biscuits
  {
    keywords: [
      'chips',
      'lays',
      'kurkure',
      'papri',
      'nimko',
      'snack',
      'snacks',
      'biscuit',
      'biscuits',
      'cookie',
      'cookies',
      'chocolates',
      'chocolate',
      'cheetos',
      'slims',
      'sooper',
      'prince',
    ],
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    label: 'Classic Crispy Chips / Snacks',
    suggestedCategory: 'Snacks & Drinks',
  },

  // 14. Soap / Sabun / Shampoo / Household
  {
    keywords: [
      'soap',
      'sabun',
      'shampoo',
      'lux',
      'lifebuoy',
      'dettol',
      'surf',
      'detergent',
      'towel',
      'cleaner',
      'harpic',
      'sanitizer',
      'toothpaste',
      'brush',
      'tissue',
      'vim',
      'ariel',
      'bonus',
    ],
    image: 'https://images.unsplash.com/photo-1607006314180-34a37608882d?auto=format&fit=crop&w=600&q=80',
    label: 'Beauty Soap / Household Essentials',
    suggestedCategory: 'Household',
  },

  // 15. Charger / Mobile / Electronics
  {
    keywords: [
      'charger',
      'cable',
      'fast charger',
      'type-c',
      'usb',
      'mobile',
      'phone',
      'airpods',
      'earphones',
      'headphones',
      'power bank',
      'cover',
      'glass',
      'handsfree',
      'adapter',
    ],
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    label: 'Fast Charger / Mobile Accessories',
    suggestedCategory: 'Electronics',
  },

  // 16. Kurta / Clothes / Fashion / T-shirt
  {
    keywords: [
      'kurta',
      'kameez',
      'shalwar',
      'kapray',
      'cloth',
      'clothes',
      'shirt',
      't-shirt',
      'tshirt',
      'shawl',
      'lawn',
      'cotton',
      'dress',
      'suit',
      'jeans',
      'pent',
      'pant',
      'trouser',
      'hoodie',
      'jacket',
    ],
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    label: 'Cotton Kurta / Clothes / Fashion',
    suggestedCategory: 'Sports & Fashion',
  },

  // 17. Rice / Chawal / Daal / Aata
  {
    keywords: [
      'chawal',
      'rice',
      'basmati',
      'daal',
      'dal',
      'pulse',
      'aata',
      'atta',
      'flour',
      'sugar',
      'cheeni',
      'spices',
      'masala',
      'namak',
      'salt',
      'baisan',
      'suji',
    ],
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    label: 'Super Basmati Rice / Pulses (Chawal)',
    suggestedCategory: 'Groceries',
  },

  // 18. Chai / Tea / Coffee
  {
    keywords: [
      'chai',
      'tea',
      'tea bag',
      'tapal',
      'lipton',
      'danedar',
      'coffee',
      'kehwa',
      'green tea',
      'everyday',
      'vital tea',
    ],
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    label: 'Premium Danedar Chai / Tea',
    suggestedCategory: 'Snacks & Drinks',
  },

  // 19. Cooking Oil / Ghee
  {
    keywords: [
      'oil',
      'ghee',
      'cooking oil',
      'dalda',
      'habib',
      'sufi',
      'canola',
      'banaspati',
      'sarson',
      'mustard oil',
      'kisan',
    ],
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    label: 'Pure Cooking Oil / Ghee',
    suggestedCategory: 'Groceries',
  },

  // 20. Chicken / Meat / Gosht
  {
    keywords: [
      'chicken',
      'murghi',
      'gosht',
      'meat',
      'beef',
      'mutton',
      'qeema',
      'fish',
      'machli',
      'broiler',
      'desi chicken',
    ],
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    label: 'Fresh Chicken / Meat (Gosht)',
    suggestedCategory: 'Groceries',
  },
];

/**
 * Automatically matches a product image based on the title entered by the seller.
 */
export function getAutoProductImage(
  title: string,
  _currentCategory?: string
): MatchedProductImage {
  const cleanTitle = title.toLowerCase().trim();

  if (!cleanTitle) {
    // If no title yet, return a clean neutral placeholder or socks preview
    return {
      image: '/assets/images/cotton_socks_pair_1793875065760.jpg',
      matchedLabel: 'Auto-detect ready (Type product title)',
      suggestedCategory: 'Sports & Fashion',
    };
  }

  // Tokenize the title into words to check exact word boundaries first
  const words = cleanTitle.split(/[\s,.-]+/);

  // 1. Check exact word match or phrase match
  for (const rule of PRODUCT_IMAGE_RULES) {
    for (const kw of rule.keywords) {
      // If keyword has spaces, check substring
      if (kw.includes(' ')) {
        if (cleanTitle.includes(kw)) {
          return {
            image: rule.image,
            matchedLabel: rule.label,
            suggestedCategory: rule.suggestedCategory,
          };
        }
      } else {
        // Single word: check if any of the title words exactly equals or starts with the keyword
        if (words.some((w) => w === kw || (kw.length >= 3 && w.startsWith(kw)))) {
          return {
            image: rule.image,
            matchedLabel: rule.label,
            suggestedCategory: rule.suggestedCategory,
          };
        }
      }
    }
  }

  // 2. Substring fallback across rules
  for (const rule of PRODUCT_IMAGE_RULES) {
    for (const kw of rule.keywords) {
      if (cleanTitle.includes(kw)) {
        return {
          image: rule.image,
          matchedLabel: rule.label,
          suggestedCategory: rule.suggestedCategory,
        };
      }
    }
  }

  // 3. If word contains clothing/fashion terms
  if (
    cleanTitle.includes('wear') ||
    cleanTitle.includes('fashion') ||
    cleanTitle.includes('garment') ||
    cleanTitle.includes('cotton')
  ) {
    return {
      image: '/assets/images/cotton_socks_pair_1793875065760.jpg',
      matchedLabel: 'Fashion & Apparel (Socks/Apparel)',
      suggestedCategory: 'Sports & Fashion',
    };
  }

  // 4. Clean, high quality generic marketplace item fallback (Never mistakenly default to bread!)
  return {
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    matchedLabel: `Verified Marketplace Product (${title})`,
    suggestedCategory: 'Groceries',
  };
}

/**
 * Popular Pakistani Rawalpindi presets for 1-click filling
 */
export const POPULAR_PINDI_PRESETS = [
  {
    icon: '🧦',
    name: 'Sox / Socks',
    title: 'Cotton Socks Pair (Sox)',
    price: '90',
    category: 'Sports & Fashion' as const,
    image: '/assets/images/cotton_socks_pair_1793875065760.jpg',
  },
  {
    icon: '🍞',
    name: 'Bread',
    title: 'Fresh Bread Loaf',
    price: '70',
    category: 'Dairy & Bakery' as const,
    image: '/assets/images/fresh_bread_loaf_1793874453704.jpg',
  },
  {
    icon: '🥛',
    name: 'Doodh',
    title: 'Fresh Milk (Doodh) 1L',
    price: '95',
    category: 'Dairy & Bakery' as const,
    image: '/assets/images/pakistan_milk_pack_1793797368219.jpg',
  },
  {
    icon: '🥚',
    name: 'Anda',
    title: 'Desi Eggs (Anda) 12pcs',
    price: '180',
    category: 'Groceries' as const,
    image: '/assets/images/farm_fresh_eggs_1793797369034.jpg',
  },
  {
    icon: '🥬',
    name: 'Sabzi',
    title: 'Taaza Sabzi Basket (Potato, Tomato, Onion)',
    price: '250',
    category: 'Groceries' as const,
    image: '/assets/images/fresh_rawalpindi_sabzi_1793874453805.jpg',
  },
  {
    icon: '🍎',
    name: 'Saib',
    title: 'Fresh Swat Apples (Saib) 1kg',
    price: '140',
    category: 'Groceries' as const,
    image: '/assets/images/rawalpindi_fresh_apples_1793797367450.jpg',
  },
  {
    icon: '🏏',
    name: 'Cricket Bat',
    title: 'CA Plus Cricket Bat Rawalpindi',
    price: '1850',
    category: 'Sports & Fashion' as const,
    image: '/assets/images/cricket_bat_rawalpindi_1793797369886.jpg',
  },
  {
    icon: '🥔',
    name: 'Chips',
    title: 'Lays Classic Salted Chips',
    price: '50',
    category: 'Snacks & Drinks' as const,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: '🧼',
    name: 'Sabun',
    title: 'Lux Beauty Soap Pack',
    price: '110',
    category: 'Household' as const,
    image: 'https://images.unsplash.com/photo-1607006314180-34a37608882d?auto=format&fit=crop&w=600&q=80',
  },
];
