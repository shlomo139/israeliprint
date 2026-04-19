import React from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../src/InventoryContext';

const HomePage: React.FC = () => {
  const { categories, products } = useInventory();

  // Find a cover image for each category based on first available product if category has no image
  const getCategoryImage = (cat: any) => {
    if (cat.image_url) return cat.image_url;
    const product = products.find(p => p.category === cat.id);
    return product ? product.imageUrl : '';
  };

  return (
    <div className="pb-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-md">
          ישראלי - מדפיסים רגעים של אושר
        </h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
          דואגים לכם לשירות מהיר ואיכותי
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {categories.map((cat) => {
          const coverImage = getCategoryImage(cat);
          return (
            <Link 
              key={cat.id} 
              to={cat.path}
              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img 
                  src={coverImage} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
              </div>

              {/* Content */}
              <div className="p-6 flex-grow flex flex-col items-center justify-center relative">
                <h3 className="text-3xl font-extrabold text-yisraeli-blue mb-2 text-center group-hover:text-yisraeli-yellow transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
