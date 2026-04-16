/**
 * lib/pricing.ts
 * מפת עלויות חומרים מרכזית לכל מוצר וגודל.
 * משמש גם את לוח הניהול לחישוב רווחים אוטומטי.
 */
import { ALL_PRODUCTS } from '../data/products';

/**
 * מחזירה את עלות החומרים של מוצר לפי product_type ו-size.
 * מנסה קודם למצוא התאמה מדויקת לקובץ המוצרים המרכזי.
 */
export function getCostPrice(productType: string, size?: string | null): number {
  if (!productType) return 0;

  const typeClean = productType.toLowerCase().trim();
  const sizeClean = (size || '').toLowerCase().trim().replace('×', 'x').replace(/\s/g, '');

  // 1. נסה למצוא התאמה לפי שם מוצר מלא (למשל "מגנט 10x15")
  const directMatch = ALL_PRODUCTS.find(p => p.name.toLowerCase().trim() === typeClean);
  if (directMatch?.costPrice) return directMatch.costPrice;

  // 2. אם לא נמצא, נסה לשלב סוג + גודל לחיפוש
  // לדוגמה אם הסוג הוא "מגנט" והגודל הוא "10x15"
  const withSizeMatch = ALL_PRODUCTS.find(p => {
    const nameLow = p.name.toLowerCase();
    return nameLow.includes(typeClean) && nameLow.includes(sizeClean);
  });
  if (withSizeMatch?.costPrice) return withSizeMatch.costPrice;

  // 3. לוגיקה ספציפית לערכות (Kits) - בדרך כלל 6 ש"ח
  if (typeClean.includes('ערכה') || typeClean.includes('kit')) {
    return 6.00;
  }

  // 4. לוגיקה ספציפית לפספורט
  if (typeClean.includes('פספורט') || typeClean.includes('passport')) {
    return 1.20;
  }

  return 0; // לא נמצא
}

/**
 * מחשבת את הרווח הגולמי מהזמנה.
 */
export function calculateProfit(
  totalRevenue: number,
  quantity: number,
  materialCostPerUnit: number
): number {
  const totalCost = materialCostPerUnit * quantity;
  return totalRevenue - totalCost;
}

/**
 * מחשבת את אחוז הרווח.
 */
export function calculateProfitMargin(profit: number, totalRevenue: number): number {
  if (totalRevenue <= 0) return 0;
  return (profit / totalRevenue) * 100;
}
