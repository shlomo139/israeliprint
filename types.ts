
export enum Category {
  Prints = 'prints',
  Blocks = 'blocks',
  Magnets = 'magnets',
  Kits = 'kits',
}

export type CategoryKey = keyof typeof Category;

export interface PriceTier {
  minQuantity: number;
  pricePerUnit: number;
  label?: string; // Optional custom label
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  tiers: PriceTier[]; // Changed from variants to tiers
  kitImages?: string[]; // Optional array of image URLs for kits (specifically 6 images)
  costPrice?: number; // Cost price per unit for profit calculation
}

export enum CropOption {
  Fit = 'fit',
  Fill = 'fill',
  Manual = 'manual',
}
