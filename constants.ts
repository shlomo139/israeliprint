
import { Category, CropOption } from './types';

export const CATEGORY_DETAILS = {
  prints: {
    path: '/prints',
    name: 'פיתוח תמונות',
    category: Category.Prints,
  },
  blocks: {
    path: '/blocks',
    name: 'בלוקים מעץ',
    category: Category.Blocks,
  },
  magnets: {
    path: '/magnets',
    name: 'מגנטים',
    category: Category.Magnets,
  },
  kits: {
    path: '/kits',
    name: 'ערכות מגנטים',
    category: Category.Kits,
  },
};

export const CROP_OPTIONS = [
  { 
    id: CropOption.Fit,
    title: '1️⃣ עם שוליים לבנים (Fit)',
    description: 'כל התמונה תכנס לתוך הדף. יופיעו פסים לבנים בצדדים, אך שום פרט לא ייחתך.',
  },
  { 
    id: CropOption.Fill,
    title: '2️⃣ ללא שוליים (Fill)',
    description: 'התמונה תמלא את כל הדף. המכונה תחתוך אוטומטית את הקצוות כדי להתאים לנייר (קצוות התמונה יחתכו).',
  },
  { 
    id: CropOption.Manual,
    title: '3️⃣ מיון והתאמה ידנית (בתוספת תשלום)',
    description: 'אנחנו עוברים תמונה-תמונה ומתאימים ידנית את החיתוך. (תוספת של 2.5 ₪ לכל 10 תמונות).',
  },
];

export const KIT_PRICING = {
  3: [
    { minQuantity: 1, pricePerUnit: 15 },
    { minQuantity: 20, pricePerUnit: 13.5 },
    { minQuantity: 50, pricePerUnit: 12 },
  ],
  6: [
    { minQuantity: 1, pricePerUnit: 25 },
    { minQuantity: 20, pricePerUnit: 22.5 },
    { minQuantity: 50, pricePerUnit: 20 },
  ]
};

export const WHATSAPP_NUMBER = '972526864724';
