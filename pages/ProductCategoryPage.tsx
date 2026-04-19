
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Product, PriceTier } from '../types';
import { useInventory } from '../src/InventoryContext';
import ProductModal from '../components/ProductModal';
import { ShoppingBag, Eye } from 'lucide-react';

const ProductCard: React.FC<{ product: Product; onOrder: (p: Product) => void }> = ({ product, onOrder }) => {
  const isKit = product.category === 'kits';

  // Helper to format tier label
  const getTierLabel = (tier: PriceTier, index: number, tiers: PriceTier[]) => {
    // Priority 1: Use custom label (e.g., "ערכה של 3")
    if (tier.label) {
      return tier.label;
    }

    // Priority 2: Auto-generate range label (e.g., "1-49 units")
    const nextTier = tiers[index + 1];
    if (nextTier) {
        return `${tier.minQuantity} - ${nextTier.minQuantity - 1}`; // Removed 'יחידות' to save space in kit view
    }
    return `${tier.minQuantity}+`;
  };

  // Helper to format price display
  const getTierPriceDisplay = (tier: PriceTier) => {
    if (product.id === 'print-passport') {
       const totalPrice = tier.pricePerUnit * tier.minQuantity;
       return `${totalPrice} ₪`;
    }
    return `${tier.pricePerUnit} ₪`;
  };

  const renderKitPricing = () => (
    <div className="flex gap-2 text-xs">
       <div className="flex-1 bg-gray-50 p-2 rounded w-full text-gray-900">
          <p className="font-bold text-center mb-1 text-yisraeli-blue border-b border-gray-200 pb-1">מחירון ערכות</p>
          {product.tiers.map((tier, idx) => (
             <div key={idx} className="flex justify-between border-b pb-1 last:border-0 border-gray-200 mt-1">
                <span className="text-gray-700">{getTierLabel(tier, idx, product.tiers)}</span>
                <span className="font-bold text-yisraeli-blue">{tier.pricePerUnit} ₪</span>
             </div>
          ))}
       </div>
    </div>
  );

  const renderStandardPricing = () => (
    <div className="flex-grow space-y-2 mb-6 bg-gray-50 p-4 rounded-lg relative">
      <p className="text-sm text-gray-500 font-semibold mb-2 text-center border-b pb-2">מחירון:</p>
      {product.tiers.map((tier: any, index) => (
        <div key={tier.minQuantity} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-1 relative">
          <span className="text-gray-700 font-medium">{getTierLabel(tier, index, product.tiers)} {(!tier.label && !isKit) ? 'יחידות' : ''}</span>
          <div className="flex items-center gap-2">
            {tier.discountPercentage > 0 && <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-black">-{tier.discountPercentage}% הנחה</span>}
            <span className="text-yisraeli-blue font-bold">{getTierPriceDisplay(tier)} {(!isKit && product.id !== 'print-passport') ? "ליח'" : ''}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-gray-100 group">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
        />
        {product.promo?.buy > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white font-black px-3 py-1.5 rounded shadow-lg transform -rotate-3 border border-red-400">
            {product.promo.buy}+{product.promo.get} מתנה!
          </div>
        )}
        {/* Overlay for "View" on hover */}
        {isKit && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
             <Eye className="text-white w-12 h-12 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-2xl font-bold text-yisraeli-blue mb-4 text-center">{product.name}</h3>
        
        {/* Price Table */}
        <div className="flex-grow mb-6">
            {isKit ? renderKitPricing() : renderStandardPricing()}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onOrder(product)}
          className="w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-95 bg-yisraeli-yellow text-yisraeli-blue hover:bg-yellow-400"
        >
          <ShoppingBag className="w-5 h-5" />
          אני רוצה להזמין
        </button>
      </div>
    </div>
  );
};

const ProductCategoryPage: React.FC = () => {
  const { categoryPath } = useParams();
  const { categories, products } = useInventory();
  
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Find category based on absolute path match
  const activeCategory = categories.find(c => c.path === `/${categoryPath}`);

  useEffect(() => {
    if (activeCategory) {
      setCategoryProducts(products.filter(p => p.category === activeCategory.id));
    }
  }, [activeCategory, products]);

  if (!activeCategory) return <Navigate to="/" replace />;

  const handleOpenOrder = (product: Product) => {
    setSelectedProductForModal(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProductForModal(null), 300); // Clear after animation
  };
  
  return (
    <div className="pb-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-md">
          {activeCategory.name}
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
          בחרו את המוצר המושלם עבורכם מהמגוון שלנו והזמינו בקלות.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categoryProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOrder={handleOpenOrder}
          />
        ))}
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProductForModal}
      />
    </div>
  );
};

export default ProductCategoryPage;
