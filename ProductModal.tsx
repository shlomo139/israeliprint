
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, CropOption } from '../types';
import { CROP_OPTIONS, WHATSAPP_NUMBER, KIT_PRICING } from '../constants';
import { X, Zap, Minus, Plus, Check, ZoomIn, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCropOption, setSelectedCropOption] = useState<CropOption>(CropOption.Fit);
  
  // Kit specific state
  const [kitSize, setKitSize] = useState<3 | 6>(3);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Reset state when product opens
  useEffect(() => {
    if (product) {
      if (product.id === 'print-passport') {
        setQuantity(4);
      } else {
        setQuantity(1);
      }
      setSelectedCropOption(CropOption.Fit);
      setKitSize(3); // Default to kit of 3
      setSelectedImageIndices([]); // Reset selections
    }
  }, [product]);

  // Handle Kit Selection Logic
  useEffect(() => {
    if (product?.category === Category.Kits) {
        if (kitSize === 6) {
            // Auto-select all 6 images
            setSelectedImageIndices([0, 1, 2, 3, 4, 5]);
        } else {
            // Reset selection for user to choose 3
            setSelectedImageIndices([]);
        }
    }
  }, [kitSize, product]);

  const toggleImageSelection = (index: number) => {
      if (kitSize === 6) return; // Cannot toggle when kit size is 6

      setSelectedImageIndices(prev => {
          if (prev.includes(index)) {
              return prev.filter(i => i !== index);
          } else {
              if (prev.length >= 3) return prev; // Limit to 3
              return [...prev, index];
          }
      });
  };

  // Find the correct price tier based on current quantity
  const currentPricePerUnit = useMemo(() => {
    if (!product) return 0;
    
    // Determine which tiers to use
    let tiersToUse = product.tiers;
    if (product.category === Category.Kits) {
        tiersToUse = KIT_PRICING[kitSize];
    }

    // Sort tiers descending to find the highest matching threshold
    const sortedTiers = [...tiersToUse].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sortedTiers.find(t => quantity >= t.minQuantity);
    // Fallback
    return tier ? tier.pricePerUnit : sortedTiers[sortedTiers.length - 1].pricePerUnit;
  }, [product, quantity, kitSize]);

  const { totalPrice, extraCost } = useMemo(() => {
    if (!product) return { totalPrice: 0, extraCost: 0 };
    
    const baseTotal = quantity * currentPricePerUnit;
    let extra = 0;
    
    // Calculate manual crop fee if applicable
    if (product.category === Category.Prints && selectedCropOption === CropOption.Manual) {
      extra = Math.ceil(quantity / 10) * 2.5;
    }
    
    return { 
      totalPrice: baseTotal + extra, 
      extraCost: extra 
    };
  }, [quantity, currentPricePerUnit, selectedCropOption, product, kitSize]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setQuantity(val);
    } else if (e.target.value === '') {
        setQuantity(0);
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const generateWhatsAppMessage = () => {
    if (!product) return '';

    let message = `היי, אני רוצה לבצע הזמנה חדשה!
פריט: ${product.name}`;

    if (product.category === Category.Kits) {
        message += `\nסוג ערכה: ${kitSize} מגנטים`;
        message += `\nכמות ערכות: ${quantity}`;
        if (selectedImageIndices.length > 0) {
            // Human readable indices (1-based)
            const designs = selectedImageIndices.map(i => i + 1).sort().join(', ');
            message += `\nעיצובים נבחרים: ${designs}`;
        }
    } else {
        message += `\nכמות: ${quantity} יחידות`;
    }
    
    message += `\nמחיר ליחידה: ${currentPricePerUnit} ₪`;
    
    if (product.category === Category.Prints) {
      const cropOptionDetails = CROP_OPTIONS.find(opt => opt.id === selectedCropOption);
      if (cropOptionDetails) {
        message += `\nסגנון חיתוך: ${cropOptionDetails.title}`;
      }
    }
    
    message += `\nמחיר סופי: ${totalPrice.toFixed(2)} ₪`;
    
    return encodeURIComponent(message);
  };
  
  const handleOrderClick = (e: React.MouseEvent) => {
    // Prevent default anchor behavior immediately to handle logic
    e.preventDefault();

    if (!isSelectionValid || !product) return;

    // 1. WhatsApp URL Generation
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    // 2. Validation
    if (product.category === Category.Kits && kitSize === 3 && selectedImageIndices.length !== 3) {
        alert('אנא בחרו בדיוק 3 עיצובים מהרשימה.');
        return;
    }

    // 3. Profit Calculation Logic
    let itemCost = product.costPrice || 0;

    // SPECIAL LOGIC FOR KITS (Override itemCost based on kitSize)
    if (product.category === Category.Kits) {
        if (kitSize === 3) {
            itemCost = 1.25; // Exact cost for Kit of 3
        } else if (kitSize === 6) {
            itemCost = 2.50; // Exact cost for Kit of 6
        }
    }

    const totalCost = itemCost * quantity; // Total Cost = (Unit Cost * Qty)
    const exactProfit = totalPrice - totalCost;

    // 4. Supabase Insert (Fire and Forget)
    const orderDetails = {
      crop_option: product.category === Category.Prints ? selectedCropOption : null,
      kit_size: product.category === Category.Kits ? kitSize : null,
      selected_designs: product.category === Category.Kits ? selectedImageIndices : null,
      unit_price: currentPricePerUnit,
      extra_cost_charged: extraCost
    };

    // We don't await this so the user is redirected immediately
    supabase.from('orders').insert([{
      product_name: product.name,
      quantity: quantity,
      total_price: totalPrice,
      estimated_profit: exactProfit,
      details: orderDetails,
      source: 'whatsapp_click',
      created_at: new Date().toISOString()
    }]).then(({ error }) => {
        if (error) console.error('Error tracking order:', error);
    });

    // 5. Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  // Validation for Kit 3
  const isSelectionValid = !product || product.category !== Category.Kits || kitSize === 6 || (kitSize === 3 && selectedImageIndices.length === 3);

  if (!isOpen || !product) return null;
  
  const isKit = product.category === Category.Kits;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-yisraeli-blue">{product.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Kit Gallery Selection - MOVED TO TOP */}
          {isKit && product.kitImages && (
            <div className="space-y-3">
                {/* Scrollable Container */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                    {product.kitImages.map((imgUrl, idx) => {
                        const isSelected = selectedImageIndices.includes(idx);
                        return (
                            <div 
                                key={idx} 
                                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                    isSelected 
                                    ? 'border-yisraeli-blue ring-2 ring-blue-100' 
                                    : 'border-gray-200 opacity-70 hover:opacity-100'
                                }`}
                                onClick={() => toggleImageSelection(idx)}
                            >
                                <img src={imgUrl} alt={`Design ${idx + 1}`} className="w-full h-32 object-cover" />
                                
                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-yisraeli-blue text-white rounded-full p-1 shadow-md">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}

                                {/* Zoom Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomedImage(imgUrl);
                                    }}
                                    className="absolute bottom-2 left-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                
                                {/* Design Number */}
                                <span className="absolute bottom-2 right-2 bg-white/80 px-2 py-0.5 rounded text-xs font-bold text-gray-700">
                                    #{idx + 1}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {/* Kit Size Selector - MOVED BELOW IMAGES */}
          {isKit && (
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-yisraeli-blue mb-3 text-center">בחרו גודל ערכה:</h3>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setKitSize(3)}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${
                            kitSize === 3 
                            ? 'bg-yisraeli-blue text-white border-yisraeli-blue shadow-md' 
                            : 'bg-white text-gray-600 border-transparent hover:bg-gray-50'
                        }`}
                    >
                        3 מגנטים
                    </button>
                    <button 
                        onClick={() => setKitSize(6)}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${
                            kitSize === 6
                            ? 'bg-yisraeli-blue text-white border-yisraeli-blue shadow-md' 
                            : 'bg-white text-gray-600 border-transparent hover:bg-gray-50'
                        }`}
                    >
                        6 מגנטים
                    </button>
                </div>
                <div className="flex items-center justify-center mt-3 gap-2 text-sm text-gray-600">
                     <Info className="w-4 h-4" />
                     <p>
                        {kitSize === 3 
                            ? 'אנא בחרו 3 עיצובים מהרשימה למעלה.' 
                            : 'הערכה כוללת את כל 6 העיצובים.'}
                     </p>
                </div>
             </div>
          )}

          {/* Quantity Input */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isKit ? 'כמות ערכות:' : 'כמות להזמנה:'}
            </h3>
            
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => adjustQuantity(-1)}
                className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="relative w-32">
                <input 
                    type="number" 
                    min="1"
                    value={quantity || ''}
                    onChange={handleQuantityChange}
                    className="w-full text-center text-3xl font-bold text-yisraeli-blue bg-transparent border-b-2 border-yisraeli-yellow focus:outline-none py-2"
                />
                <span className="block text-center text-sm text-gray-500 mt-1">
                    {isKit ? 'ערכות' : 'יחידות'}
                </span>
              </div>

              <button 
                onClick={() => adjustQuantity(1)}
                className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 text-center">
                <span className="inline-block bg-blue-100 text-yisraeli-blue px-3 py-1 rounded-full text-sm font-medium">
                    מחיר {isKit ? 'לערכה' : 'ליחידה'}: {currentPricePerUnit} ₪
                </span>
            </div>
          </div>

          {/* Crop Options (Only for Prints) */}
          {product.category === Category.Prints && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">אפשרויות חיתוך:</h3>
              <div className="space-y-3">
                {CROP_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCropOption === option.id
                        ? 'bg-blue-50 border-yisraeli-blue'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cropOption"
                      value={option.id}
                      checked={selectedCropOption === option.id}
                      onChange={() => setSelectedCropOption(option.id)}
                      className="mt-1 h-4 w-4 text-yisraeli-blue focus:ring-yisraeli-blue"
                    />
                    <div className="mr-3">
                      <span className="block font-medium text-gray-900">{option.title}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 border-t mt-auto">
          <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center text-yisraeli-blue">
                <span className="text-lg">סה"כ לתשלום:</span>
                <span className="text-3xl font-extrabold">
                    {(quantity > 0 ? totalPrice : 0).toFixed(2)} ₪
                </span>
             </div>
             {extraCost > 0 && (
               <p className="text-xs text-gray-500 text-center -mt-2">כולל תוספת חיתוך ידני: {extraCost} ₪</p>
             )}
             
             <button
              onClick={handleOrderClick}
              disabled={!quantity || quantity < 1 || !isSelectionValid}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-lg shadow-lg transition-transform active:scale-95 ${
                  (!quantity || quantity < 1 || !isSelectionValid) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
             >
               <Zap className="w-6 h-6 fill-current" />
               {isKit && kitSize === 3 && selectedImageIndices.length !== 3 
                ? 'בחרו את העיצובים שאהבתם' 
                : 'המשך להזמנה בוואטסאפ'}
             </button>
          </div>
        </div>

      </div>
    </div>

    {/* Image Zoom Lightbox */}
    {zoomedImage && (
        <div 
            className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
        >
            <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={() => setZoomedImage(null)}
            >
                <X className="w-8 h-8" />
            </button>
            <img 
                src={zoomedImage} 
                alt="Enlarged view" 
                className="max-w-full max-h-full object-contain rounded shadow-2xl" 
            />
        </div>
    )}
    </>
  );
};

export default ProductModal;
