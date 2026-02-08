
import { Product, Category } from '../types';
import { KIT_PRICING } from '../constants';

// Helper to assign default tiers (we use KIT_PRICING constant in UI, but this keeps TS happy)
const defaultKitTiers = KIT_PRICING[3]; 

export const ALL_PRODUCTS: Product[] = [
  // Prints (פיתוח תמונות)
  {
    id: 'print-10x15',
    name: 'תמונה 10x15',
    category: Category.Prints,
    imageUrl: '/print-10-15.jpg',
    costPrice: 0.625,
    tiers: [
      { minQuantity: 1, pricePerUnit: 2.5 },
      { minQuantity: 10, pricePerUnit: 2 },
      { minQuantity: 50, pricePerUnit: 1.5 },
      { minQuantity: 100, pricePerUnit: 1 },
    ],
  },
  {
    id: 'print-13x18',
    name: 'תמונה 13x18',
    category: Category.Prints,
    imageUrl: '/print-13-18.jpg',
    costPrice: 1.25,
    tiers: [
      { minQuantity: 1, pricePerUnit: 6 },
      { minQuantity: 10, pricePerUnit: 4 },
      { minQuantity: 50, pricePerUnit: 3 },
      { minQuantity: 100, pricePerUnit: 2.5 },
    ],
  },
  {
    id: 'print-15x20',
    name: 'תמונה 15x20',
    category: Category.Prints,
    imageUrl: '/print-15-20.jpg',
    costPrice: 1.25,
    tiers: [
      { minQuantity: 1, pricePerUnit: 8 },
      { minQuantity: 10, pricePerUnit: 6 },
      { minQuantity: 50, pricePerUnit: 5 },
      { minQuantity: 100, pricePerUnit: 4 },
    ],
  },
  {
    id: 'print-passport',
    name: 'תמונות פספורט',
    category: Category.Prints,
    imageUrl: '/passport.jpg',
    costPrice: 1.2,
    tiers: [
      { minQuantity: 4, pricePerUnit: 2, label: '4 תמונות' }, // Total 8
      { minQuantity: 8, pricePerUnit: 1.875, label: '8 תמונות' }, // Total 15
    ],
  },
  
  // Magnets (מגנטים)
  {
    id: 'magnet-7x10',
    name: 'מגנט 7x10',
    category: Category.Magnets,
    imageUrl: '/magnet-7-10.jpg',
    costPrice: 1.0,
    tiers: [
      { minQuantity: 1, pricePerUnit: 3 },
      { minQuantity: 10, pricePerUnit: 2.5 },
      { minQuantity: 50, pricePerUnit: 2 },
      { minQuantity: 100, pricePerUnit: 1.5 },
    ],
  },
  {
    id: 'magnet-10x15',
    name: 'מגנט 10x15',
    category: Category.Magnets,
    imageUrl: '/magnet-10-15.jpg',
    costPrice: 1.0,
    tiers: [
      { minQuantity: 1, pricePerUnit: 8 },
      { minQuantity: 10, pricePerUnit: 6 },
      { minQuantity: 50, pricePerUnit: 5 },
      { minQuantity: 100, pricePerUnit: 4 },
    ],
  },
  {
    id: 'magnet-13x18',
    name: 'מגנט 13x18',
    category: Category.Magnets,
    imageUrl: '/magnet-13-18.jpg',
    costPrice: 2.0,
    tiers: [
      { minQuantity: 1, pricePerUnit: 12 },
      { minQuantity: 10, pricePerUnit: 10 },
      { minQuantity: 50, pricePerUnit: 8 },
      { minQuantity: 100, pricePerUnit: 7 },
    ],
  },
  {
    id: 'magnet-15x20',
    name: 'מגנט 15x20',
    category: Category.Magnets,
    imageUrl: '/magnet-15-20.jpg',
    costPrice: 2.0,
    tiers: [
      { minQuantity: 1, pricePerUnit: 10 },
      { minQuantity: 10, pricePerUnit: 8 },
      { minQuantity: 50, pricePerUnit: 7 },
      { minQuantity: 100, pricePerUnit: 6.5 },
    ],
  },
  
  // Blocks (בלוקים)
  {
    id: 'block-10x10',
    name: 'בלוק עץ 10x10',
    category: Category.Blocks,
    imageUrl: '/block-10-10.jpg',
    costPrice: 3.3,
    tiers: [
      { minQuantity: 1, pricePerUnit: 25 },
      { minQuantity: 4, pricePerUnit: 20 },
      { minQuantity: 10, pricePerUnit: 18 },
    ],
  },
  {
    id: 'block-10x15',
    name: 'בלוק עץ 10x15',
    category: Category.Blocks,
    imageUrl: '/block-10-15.jpg',
    costPrice: 3.625,
    tiers: [
      { minQuantity: 1, pricePerUnit: 30 },
      { minQuantity: 4, pricePerUnit: 25 },
      { minQuantity: 10, pricePerUnit: 20 },
    ],
  },
  {
    id: 'block-15x20',
    name: 'בלוק עץ 15x20',
    category: Category.Blocks,
    imageUrl: '/block-15-20.jpg',
    costPrice: 7.25,
    tiers: [
      { minQuantity: 1, pricePerUnit: 55 },
      { minQuantity: 4, pricePerUnit: 50 },
      { minQuantity: 10, pricePerUnit: 45 },
    ],
  },

  // Kits (ערכות) - Cost is handled in ProductModal logic
  {
    id: 'kit-humor',
    name: 'ערכה הומוריסטית למשפחה',
    category: Category.Kits,
    imageUrl: '/kit-humor-cover.jpg',
    tiers: defaultKitTiers,
    kitImages: [
        '/kit-humor-1.jpg',
        '/kit-humor-2.jpg',
        '/kit-humor-3.jpg',
        '/kit-humor-4.jpg',
        '/kit-humor-5.jpg',
        '/kit-humor-6.jpg',
    ]
  },
  {
    id: 'kit-quotes',
    name: 'ערכת משפטים טובים למשפחה',
    category: Category.Kits,
    imageUrl: '/kit-quotes-cover.jpg',
    tiers: defaultKitTiers,
    kitImages: [
        '/kit-quotes-1.jpg',
        '/kit-quotes-2.jpg',
        '/kit-quotes-3.jpg',
        '/kit-quotes-4.jpg',
        '/kit-quotes-5.jpg',
        '/kit-quotes-6.jpg',
    ]
  },
  {
    id: 'kit-songs',
    name: 'ערכת שירי ארץ ישראל',
    category: Category.Kits,
    imageUrl: '/kit-israel-cover.jpg',
    tiers: defaultKitTiers,
    kitImages: [
        '/kit-israel-1.jpg',
        '/kit-israel-2.jpg',
        '/kit-israel-3.jpg',
        '/kit-israel-4.jpg',
        '/kit-israel-5.jpg',
        '/kit-israel-6.jpg',
    ]
  },
];
