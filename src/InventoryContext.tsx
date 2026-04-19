import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from './types';

export interface Category {
  id: string;
  name: string;
  path: string;
  image_url: string;
}

export interface Settings {
    banner_mode: string;
    banner_title: string;
    banner_subtitle: string;
    banner_bg_color: string;
    banner_image_url: string;
}

interface InventoryContextProps {
  categories: Category[];
  products: Product[];
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const InventoryContext = createContext<InventoryContextProps | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/inventory');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
        setProducts(data.data.products);
        setSettings(data.data.settings);
        setError(null);
      } else {
        setError('Failed to fetch store data');
      }
    } catch (err) {
       setError('Network error');
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <InventoryContext.Provider value={{ categories, products, settings, loading, error, refresh: fetchInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
