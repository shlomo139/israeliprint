import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, CropOption } from '../types';
import { CROP_OPTIONS, KIT_PRICING } from '../constants';
import { X, Minus, Plus, Check, ZoomIn, Info, UploadCloud, ChevronRight, ChevronLeft, PartyPopper } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
  const { width, height } = useWindowSize();

  // Wizard state
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCropOption, setSelectedCropOption] = useState<CropOption>(CropOption.Fit);
  
  // Kit specific state
  const [kitSize, setKitSize] = useState<3 | 6>(3);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (product && isOpen) {
      setStep(1);
      setIsCompleted(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
      setSelectedCropOption(CropOption.Fit);
      setKitSize(3);
      setSelectedImageIndices([]);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSuccess(false);
      setDriveFolderUrl(null);
      
      if (product.id === 'print-passport') {
        setQuantity(4);
      } else {
        setQuantity(1);
      }
    }
  }, [product, isOpen]);

  // Handle Kit Selection Logic
  useEffect(() => {
    if (product?.category === Category.Kits) {
        if (kitSize === 6) {
            setSelectedImageIndices([0, 1, 2, 3, 4, 5]);
        } else {
            setSelectedImageIndices([]);
        }
    }
  }, [kitSize, product]);

  const toggleImageSelection = (index: number) => {
      if (kitSize === 6) return;
      setSelectedImageIndices(prev => {
          if (prev.includes(index)) return prev.filter(i => i !== index);
          if (prev.length >= 3) return prev;
          return [...prev, index];
      });
  };

  const isKit = product?.category === Category.Kits;

  // Determine steps
  const steps = useMemo(() => {
    if (!product) return [];
    if (isKit) return ['פרטי לקוח', 'בחירת ערכה', 'כמות', 'הערות להזמנה'];
    if (product.category === Category.Prints) return ['פרטי לקוח', 'כמות', 'חיתוך', 'העלאת תמונות', 'הערות להזמנה'];
    return ['פרטי לקוח', 'כמות', 'העלאת תמונות', 'הערות להזמנה'];
  }, [product, isKit]);

  const currentStepName = steps[step - 1];

  // Validation for NEXT button
  const canGoNext = () => {
    if (currentStepName === 'פרטי לקוח') return customerName.trim().length > 1 && customerPhone.length >= 9;
    if (currentStepName === 'בחירת ערכה') return (kitSize === 6) || (kitSize === 3 && selectedImageIndices.length === 3);
    if (currentStepName === 'כמות') return quantity > 0;
    if (currentStepName === 'העלאת תמונות') return uploadSuccess;
    // 'הערות להזמנה' is always valid (optional)
    return true;
  };

  // Pricing Logic
  const tiersToUse = useMemo(() => {
    if (!product) return [];
    if (isKit) return KIT_PRICING[kitSize];
    return product.tiers;
  }, [product, isKit, kitSize]);

  const currentPricePerUnit = useMemo(() => {
    if (!tiersToUse.length) return 0;
    const sortedTiers = [...tiersToUse].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sortedTiers.find(t => quantity >= t.minQuantity);
    return tier ? tier.pricePerUnit : sortedTiers[sortedTiers.length - 1].pricePerUnit;
  }, [tiersToUse, quantity]);

  const { totalPrice, totalSavings } = useMemo(() => {
    if (!product || !tiersToUse.length) return { totalPrice: 0, totalSavings: 0 };
    
    // Calculate total price
    const baseTotal = quantity * currentPricePerUnit;
    let extra = 0;
    if (product.category === Category.Prints && selectedCropOption === CropOption.Manual) {
      extra = Math.ceil(quantity / 10) * 2.5;
    }
    const finalPrice = baseTotal + extra;

    // Calculate savings
    const baseTier = [...tiersToUse].sort((a, b) => a.minQuantity - b.minQuantity)[0];
    const maxPricePerUnit = baseTier.pricePerUnit;
    const calcSavings = (maxPricePerUnit - currentPricePerUnit) * quantity;

    return { totalPrice: finalPrice, totalSavings: calcSavings > 0 ? calcSavings : 0 };
  }, [quantity, currentPricePerUnit, selectedCropOption, product, tiersToUse]);

  const handleNext = () => {
    if (step < steps.length) {
      setStep(prev => prev + 1);
    } else {
      submitOrder();
    }
  };

  const submitOrder = async () => {
    // 1. Send data to real Vercel backend API
    const orderData = {
      customerName,
      customerPhone,
      productType: product?.name,
      quantity,
      totalPrice,
      marginsSettings: product?.category === Category.Prints ? selectedCropOption : null,
      customerNotes,
      driveFolderUrl: isKit ? 'N/A' : driveFolderUrl
    };

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setIsCompleted(true);
      } else {
        alert("שגיאה ביצירת הזמנה. אנא נסה שוב או צור קשר.");
      }
    } catch (e) {
      console.error(e);
      alert("שגיאת רשת. אנא נסה שוב.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      // 1. Generate URLs
      const fileMeta = filesArray.map(f => ({ name: f.name, mimeType: f.type }));
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, files: fileMeta })
      });
      
      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) throw new Error(initData.error || 'Server error init');
      
      setDriveFolderUrl(initData.folderUrl);

      // 2. Direct PUT to Google
      let completed = 0;
      await Promise.all(initData.uploadUrls.map(async (uploadTarget: any) => {
        const file = filesArray.find(f => f.name === uploadTarget.fileName);
        if (file) {
          try {
            const upRes = await fetch(uploadTarget.uploadUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type || 'application/octet-stream' }
            });
            if (!upRes.ok) {
              const errText = await upRes.text();
              throw new Error(`HTTP Error ${upRes.status}: ${errText}`);
            }
          } catch (fetchErr: any) {
            console.error("PUT Request directly failed:", fetchErr);
            throw new Error(fetchErr.message === "Failed to fetch" ? "CORS or Network Error - Failed to fetch" : fetchErr.message);
          }
        }
        completed++;
        setUploadProgress(Math.round((completed / filesArray.length) * 100));
      }));

      setTimeout(() => {
        setUploadSuccess(true);
        setIsUploading(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Upload Error', error);
      alert(`שגיאה בהעלאת התמונות: ${error.message}`);
      setIsUploading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 min-h-[500px]">
        
        {/* Confetti if completed */}
        {isCompleted && (
           <Confetti 
              width={500} // lock to max-modal width roughly so it doesn't spray off screen
              height={700}
              recycle={false}
              numberOfPieces={300}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
           />
        )}

        {/* Header */}
        <div className="bg-yisraeli-blue text-white p-4 flex items-center justify-between z-20">
          <h2 className="text-xl font-bold">{isCompleted ? 'הזמנתך התקבלה!' : product.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isCompleted ? (
        <>
          {/* Progress Indicator */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
              <div 
                className="absolute right-0 top-1/2 h-1 bg-yisraeli-blue -z-10 -translate-y-1/2 transition-all duration-300"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((sName, idx) => {
                const sNum = idx + 1;
                const isActive = step === sNum;
                const isPassed = step > sNum;
                return (
                  <div key={sNum} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 text-sm transition-colors duration-300 ${
                        isActive ? 'bg-yisraeli-yellow border-yisraeli-yellow text-yisraeli-blue' :
                        isPassed ? 'bg-green-500 border-green-500 text-white' :
                        'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isPassed ? <Check className="w-5 h-5" /> : sNum}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2 text-yisraeli-blue font-bold text-sm">
                {currentStepName}
            </div>
          </div>

          {/* Body Content - Scrollable */}
          <div className="p-6 flex-grow overflow-y-auto">
            {/* Step 1: Customer Details */}
            {currentStepName === 'פרטי לקוח' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">שם מלא</label>
                  <input 
                    type="text" 
                    placeholder="הזן שם מלא"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">מספר טלפון (וואטסאפ)</label>
                  <input 
                    type="tel" 
                    placeholder="05X-XXXXXXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none text-left"
                    style={{ direction: 'ltr' }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">אנחנו ניצור איתך קשר בוואטסאפ הזה כשההזמנה תהיה מוכנה.</p>
                </div>
              </div>
            )}

            {/* Selection (Kits Only) */}
            {currentStepName === 'בחירת ערכה' && isKit && product.kitImages && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                 <div className="flex gap-4 mb-4">
                    <button 
                        onClick={() => setKitSize(3)}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 ${kitSize === 3 ? 'bg-yisraeli-blue text-white border-yisraeli-blue' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}
                    >
                        3 מגנטים
                    </button>
                    <button 
                        onClick={() => setKitSize(6)}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 ${kitSize === 6 ? 'bg-yisraeli-blue text-white border-yisraeli-blue' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}
                    >
                        6 מגנטים
                    </button>
                 </div>
                 
                 <p className="text-sm text-gray-600 mb-2">
                    {kitSize === 3 ? 'סמן 3 עיצובים שאהבת מהרשימה:' : 'הערכה כוללת את כל 6 העיצובים:'}
                 </p>

                 <div className="grid grid-cols-3 gap-2">
                    {product.kitImages.map((imgUrl, idx) => {
                        const isSelected = selectedImageIndices.includes(idx);
                        return (
                            <div 
                                key={idx} 
                                className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-yisraeli-blue opacity-100 ring-2 ring-blue-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                                onClick={() => toggleImageSelection(idx)}
                            >
                                <img src={imgUrl} alt={`Design ${idx + 1}`} className="w-full h-24 object-cover" />
                                {isSelected && (
                                    <div className="absolute top-1 right-1 bg-yisraeli-blue text-white rounded-full p-0.5"><Check className="w-4 h-4" /></div>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(imgUrl); }}
                                    className="absolute bottom-1 left-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ZoomIn className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
              </div>
            )}

            {/* Quantity */}
            {currentStepName === 'כמות' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center space-y-6">
                  
                  <div className="flex items-center gap-6">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-95">
                        <Minus className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value) || 1)} className="w-20 text-center text-4xl font-black text-yisraeli-blue bg-transparent focus:outline-none" />
                        <span className="block text-gray-500 font-semibold">{isKit ? 'ערכות' : 'יחידות'}</span>
                    </div>
                    <button onClick={() => setQuantity(prev => prev + 1)} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-95">
                        <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center mt-4">
                     <span className="bg-white px-4 py-2 rounded-full font-bold text-lg text-yisraeli-blue shadow-sm">
                        מחיר ליחידה: {currentPricePerUnit.toFixed(2)} ₪
                     </span>
                     
                     {/* Savings visualizer */}
                     {totalSavings > 0 && (
                        <span className="mt-3 text-green-600 font-extrabold text-sm flex items-center gap-1 bg-green-50 px-3 py-1 rounded">
                            🎉 חסכת {totalSavings.toFixed(2)} ₪ על הכמות!
                        </span>
                     )}
                  </div>
                </div>
              </div>
            )}

            {/* Crop Options (Prints Only) */}
            {currentStepName === 'חיתוך' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                {CROP_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedCropOption === option.id ? 'bg-blue-50 border-yisraeli-blue shadow-sm' : 'bg-white border-gray-200 hover:border-blue-200'}`}
                  >
                    <input
                      type="radio"
                      name="cropOption"
                      value={option.id}
                      checked={selectedCropOption === option.id}
                      onChange={() => setSelectedCropOption(option.id)}
                      className="mt-1 h-5 w-5 text-yisraeli-blue accent-yisraeli-blue flex-shrink-0"
                    />
                    <div className="mr-3">
                      <span className="block font-bold text-gray-900 text-lg mb-1">{option.title}</span>
                      <span className="text-sm text-gray-500 leading-tight">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* File Upload Mock */}
            {currentStepName === 'העלאת תמונות' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-full flex flex-col items-center justify-center">
                 {!uploadSuccess && !isUploading && (
                    <label 
                        className="w-full border-2 border-dashed border-yisraeli-blue bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors"
                    >
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <div className="bg-yisraeli-yellow/20 p-4 rounded-full mb-4">
                            <UploadCloud className="w-12 h-12 text-yisraeli-blue" />
                        </div>
                        <h4 className="text-xl font-bold text-yisraeli-blue mb-2">לחץ כאן בחירת תמונות</h4>
                        <p className="text-sm text-gray-500 text-center">תוכלו לבחור מספר תמונות יחד דרך הסייר שלכם.</p>
                    </label>
                 )}

                 {isUploading && (
                    <div className="w-full flex justify-center items-center flex-col py-10">
                        <p className="text-lg font-bold text-yisraeli-blue mb-4">מעלה תמונות... {uploadProgress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                           <div className="bg-yisraeli-yellow h-4 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                 )}

                 {uploadSuccess && (
                     <div className="w-full flex justify-center items-center flex-col py-10">
                         <div className="bg-green-100 p-6 rounded-full mb-4 animate-bounce">
                            <Check className="w-16 h-16 text-green-600" />
                         </div>
                         <h4 className="text-2xl font-bold text-green-600">התמונות הועלו בהצלחה!</h4>
                     </div>
                 )}
              </div>
            )}

            {/* Order Notes (All Products) */}
            {currentStepName === 'הערות להזמנה' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div>
                  <label className="block text-gray-700 font-bold mb-3 text-xl">הערות ובקשות מיוחדות</label>
                  <p className="text-sm text-gray-500 mb-4">זהו שלב רשות. אנחנו קוראים הכל – אז אם יש משהו מיוחד שכדאי שנדע, זה המקום לכתוב לנו.</p>
                  <textarea
                    rows={6}
                    placeholder="הקלידו כאן (אופציונלי)..."
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none resize-none shadow-inner"
                  ></textarea>
                </div>
              </div>
            )}
            
          </div>

          {/* Footer - Bottom sticky */}
          <div className="bg-white border-t p-4 flex items-center justify-between z-20">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-semibold">סה"כ לתשלום:</span>
              <span className="text-2xl font-black text-yisraeli-blue">{totalPrice.toFixed(2)} ₪</span>
            </div>
            
            <div className="flex gap-2">
                {step > 1 && (
                    <button onClick={() => setStep(prev => prev - 1)} className="px-4 py-3 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center">
                       <ChevronRight className="w-5 h-5 ml-1" />
                       חזור
                    </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                     !canGoNext() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-yisraeli-blue text-yisraeli-yellow hover:bg-blue-900 active:scale-95 shadow-md'
                  }`}
                >
                  {step === steps.length ? (
                      <>הזמן עכשיו <PartyPopper className="w-5 h-5 mr-2 text-yisraeli-yellow" /></>
                  ) : (
                      <>הבא <ChevronLeft className="w-5 h-5 mr-1" /></>
                  )}
                </button>
            </div>
          </div>
        </>
        ) : (
           /* Success View */
           <div className="p-8 flex-grow flex flex-col items-center justify-center text-center z-20">
              <div className="bg-yisraeli-blue p-6 rounded-full inline-block mb-6 shadow-xl">
                 <Check className="w-20 h-20 text-yisraeli-yellow" />
              </div>
              <h2 className="text-4xl font-black text-yisraeli-blue mb-4 leading-tight">הזמנתך התקבלה <br />בהצלחה! 🎉</h2>
              <p className="text-lg text-gray-600 font-medium mb-8">
                  מספר ההזמנה שלך נרשם במערכת.<br />
                  אנחנו בודקים את ההזמנה וניצור איתך קשר מסודר בוואטסאפ בקרוב להמשך טיפול ותשלום.
              </p>
              <button 
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-yisraeli-blue px-8 py-3 rounded-xl font-bold border border-gray-200 transition-colors"
                >
                  חזור וסגור
              </button>
           </div>
        )}

      </div>
    </div>

    {/* Image Zoom Lightbox for Kits */}
    {zoomedImage && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setZoomedImage(null)}>
                <X className="w-8 h-8" />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded" />
        </div>
    )}
    </>
  );
};

export default ProductModal;
