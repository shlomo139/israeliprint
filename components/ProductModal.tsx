import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, CropOption } from '../types';
import { CROP_OPTIONS, KIT_PRICING, WHATSAPP_NUMBER } from '../constants';
import { X, Minus, Plus, Check, ZoomIn, UploadCloud, ChevronRight, ChevronLeft, PartyPopper, Send, Link as LinkIcon } from 'lucide-react';
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

  // Completed order info (returned from API)
  const [completedOrder, setCompletedOrder] = useState<{ id: string; order_number: string; created_at: string } | null>(null);

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

  // ────────────────────────────────────────────────────────────────────────────
  // Integrated Upload Flow State
  // ────────────────────────────────────────────────────────────────────────────
  const [activeUploadTab, setActiveUploadTab] = useState<'upload' | 'link'>('upload');
  const [isUploadLocked, setIsUploadLocked] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [fileProgresses, setFileProgresses] = useState<{ name: string; pct: number; done: boolean }[]>([]);

  // Link state
  const [driveLink, setDriveLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp logic inside Success View
  const getWhatsappUrl = () => {
    const orderNum = completedOrder?.order_number || '';
    const msg = encodeURIComponent(`היי! הזמנתי באתר ישראלי – מדפיסים רגעי אושר.\nמספר הזמנה: *${orderNum}*\nשולח/ת לכאן את התמונות! 📸`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  // Reset state when modal opens
  useEffect(() => {
    if (product && isOpen) {
      setStep(1);
      setIsCompleted(false);
      setCompletedOrder(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
      setSelectedCropOption(CropOption.Fit);
      setKitSize(3);
      setSelectedImageIndices([]);
      setQuantity(product.id === 'print-passport' ? 4 : 1);
      
      // Reset upload state
      setUploadStatus('idle');
      setUploadSuccessMsg('');
      setIsUploadLocked(false);
      setFileProgresses([]);
      setDriveLink('');
      setActiveUploadTab('upload');
    }
  }, [product, isOpen]);

  // Handle Kit Selection Logic
  useEffect(() => {
    if (product?.category === Category.Kits) {
      setSelectedImageIndices(kitSize === 6 ? [0, 1, 2, 3, 4, 5] : []);
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

  // Steps
  const steps = useMemo(() => {
    if (!product) return [];
    if (isKit) return ['פרטי לקוח', 'בחירת ערכה', 'כמות', 'הערות להזמנה'];
    if (product.category === Category.Prints) return ['פרטי לקוח', 'כמות', 'חיתוך', 'הערות להזמנה'];
    return ['פרטי לקוח', 'כמות', 'הערות להזמנה'];
  }, [product, isKit]);

  const currentStepName = steps[step - 1];

  const canGoNext = () => {
    if (currentStepName === 'פרטי לקוח') return customerName.trim().length > 1 && customerPhone.length >= 9;
    if (currentStepName === 'בחירת ערכה') return (kitSize === 6) || (kitSize === 3 && selectedImageIndices.length === 3);
    if (currentStepName === 'כמות') return quantity > 0;
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
    const sorted = [...tiersToUse].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sorted.find(t => quantity >= t.minQuantity);
    return tier ? tier.pricePerUnit : sorted[sorted.length - 1].pricePerUnit;
  }, [tiersToUse, quantity]);

  const { totalPrice, totalSavings } = useMemo(() => {
    if (!product || !tiersToUse.length) return { totalPrice: 0, totalSavings: 0 };
    const baseTotal = quantity * currentPricePerUnit;
    let extra = 0;
    if (product.category === Category.Prints && selectedCropOption === CropOption.Manual) {
      extra = Math.ceil(quantity / 10) * 2.5;
    }
    const finalPrice = baseTotal + extra;
    const baseTier = [...tiersToUse].sort((a, b) => a.minQuantity - b.minQuantity)[0];
    const calcSavings = (baseTier.pricePerUnit - currentPricePerUnit) * quantity;
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
    const orderData = {
      customerName,
      customerPhone,
      productType: product?.name,
      quantity,
      totalPrice,
      marginsSettings: product?.category === Category.Prints ? selectedCropOption : null,
      customerNotes,
    };

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedOrder(data.order);
        setIsCompleted(true);
      } else {
        alert('שגיאה ביצירת הזמנה. אנא נסה שוב או צור קשר.');
      }
    } catch (e) {
      console.error(e);
      alert('שגיאת רשת. אנא נסה שוב.');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Integrated Upload Logic
  // ────────────────────────────────────────────────────────────────────────────
  const saveUploadInfo = async (method: 'gallery' | 'link' | 'whatsapp', link?: string) => {
    if (!completedOrder) return false;
    try {
      await fetch('/api/orders/update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: completedOrder.order_number, uploadMethod: method, uploadLink: link || null })
      });
      return true;
    } catch (e) {
      console.error('Failed to save upload info:', e);
      return false;
    }
  };

  const runUpload = async (files: File[]) => {
    if (!files.length || !completedOrder) return;
    setIsUploadLocked(true);
    setUploadStatus('loading');
    const initial = files.map(f => ({ name: f.name, pct: 0, done: false }));
    setFileProgresses(initial);

    try {
      const fileMeta = files.map(f => ({ name: f.name, mimeType: f.type }));
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerName, 
          customerPhone, 
          orderNumber: completedOrder.order_number, 
          files: fileMeta 
        })
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) throw new Error(initData.error || 'Server error');

      await Promise.all(
        files.map(async (file, idx) => {
          const { uploadUrl } = initData.uploadUrls[idx];
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file
          });
          if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);
          setFileProgresses(prev => prev.map((p, i) => i === idx ? { ...p, pct: 100, done: true } : p));
        })
      );

      await saveUploadInfo('gallery', initData.folderUrl);
      setUploadSuccessMsg('התמונות נשמרו אצלנו בהצלחה!');
      setUploadStatus('success');
    } catch (err: any) {
      alert(`שגיאה בהעלאת התמונות: ${err.message}`);
      setFileProgresses([]);
      setIsUploadLocked(false);
      setUploadStatus('idle');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    runUpload(Array.from(files));
  };

  const handleSaveLink = async () => {
    if (!driveLink.trim()) return;
    setIsUploadLocked(true);
    setUploadStatus('loading');
    const ok = await saveUploadInfo('link', driveLink);
    if (ok) {
      setUploadSuccessMsg('הקישור לתמונות שלך נשמר בהצלחה!');
      setUploadStatus('success');
    } else {
      alert('שגיאה בשמירת הקישור.');
      setIsUploadLocked(false);
      setUploadStatus('idle');
    }
  };

  const handleWhatsappClick = () => {
    window.open(getWhatsappUrl(), '_blank');
    setIsUploadLocked(true);
    setUploadSuccessMsg('מעולה! הזמנתך בטיפול');
    setUploadStatus('success');
    saveUploadInfo('whatsapp', 'נשלח בווצאפ');
  };

  if (!isOpen || !product) return null;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white text-gray-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 min-h-[500px] max-h-[92vh]">

        {/* Confetti */}
        {isCompleted && (
          <Confetti width={500} height={700} recycle={false} numberOfPieces={300} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} />
        )}

        {/* Header */}
        <div className="bg-yisraeli-blue text-white p-4 flex items-center justify-between z-20 flex-shrink-0">
          <h2 className="text-xl font-bold">{isCompleted ? '🎉 הזמנתך התקבלה!' : product.name}</h2>
          <button onClick={onClose} disabled={uploadStatus === 'loading'} className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isCompleted ? (
          <>
            {/* Progress Indicator */}
            <div className="bg-gray-50 border-b px-6 py-4 flex-shrink-0">
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 text-sm transition-colors duration-300 ${isActive ? 'bg-yisraeli-yellow border-yisraeli-yellow text-yisraeli-blue' : isPassed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                        {isPassed ? <Check className="w-5 h-5" /> : sNum}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-2 text-yisraeli-blue font-bold text-sm">{currentStepName}</div>
            </div>

            {/* Body Content */}
            <div className="p-6 flex-grow overflow-y-auto">
              {/* Step 1: Customer Details */}
              {currentStepName === 'פרטי לקוח' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">שם מלא</label>
                    <input type="text" placeholder="הזן שם מלא" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">מספר טלפון (וואטסאפ)</label>
                    <input type="tel" placeholder="05X-XXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none text-left" style={{ direction: 'ltr' }} />
                    <p className="text-xs text-gray-500 mt-1 text-right">אנחנו ניצור איתך קשר בוואטסאפ הזה כשההזמנה תהיה מוכנה.</p>
                  </div>
                </div>
              )}

              {/* Kit Selection */}
              {currentStepName === 'בחירת ערכה' && isKit && product.kitImages && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => setKitSize(3)} className={`flex-1 py-2 rounded-lg font-bold border-2 ${kitSize === 3 ? 'bg-yisraeli-blue text-white border-yisraeli-blue' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>3 מגנטים</button>
                    <button onClick={() => setKitSize(6)} className={`flex-1 py-2 rounded-lg font-bold border-2 ${kitSize === 6 ? 'bg-yisraeli-blue text-white border-yisraeli-blue' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>6 מגנטים</button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{kitSize === 3 ? 'סמן 3 עיצובים שאהבת מהרשימה:' : 'הערכה כוללת את כל 6 העיצובים:'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {product.kitImages.map((imgUrl, idx) => {
                      const isSelected = selectedImageIndices.includes(idx);
                      return (
                        <div key={idx} className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-yisraeli-blue opacity-100 ring-2 ring-blue-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`} onClick={() => toggleImageSelection(idx)}>
                          <img src={imgUrl} alt={`Design ${idx + 1}`} className="w-full h-24 object-cover" />
                          {isSelected && (<div className="absolute top-1 right-1 bg-yisraeli-blue text-white rounded-full p-0.5"><Check className="w-4 h-4" /></div>)}
                          <button onClick={(e) => { e.stopPropagation(); setZoomedImage(imgUrl); }} className="absolute bottom-1 left-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="w-3 h-3" /></button>
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
                      <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-95"><Minus className="w-6 h-6" /></button>
                      <div className="text-center">
                        <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value) || 1)} className="w-20 text-center text-4xl font-black text-yisraeli-blue bg-transparent focus:outline-none" />
                        <span className="block text-gray-500 font-semibold">{isKit ? 'ערכות' : 'יחידות'}</span>
                      </div>
                      <button onClick={() => setQuantity(prev => prev + 1)} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-95"><Plus className="w-6 h-6" /></button>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-4">
                      <span className="bg-white px-4 py-2 rounded-full font-bold text-lg text-yisraeli-blue shadow-sm">מחיר ליחידה: {currentPricePerUnit.toFixed(2)} ₪</span>
                      {totalSavings > 0 && (<span className="mt-3 text-green-600 font-extrabold text-sm flex items-center gap-1 bg-green-50 px-3 py-1 rounded">🎉 חסכת {totalSavings.toFixed(2)} ₪ על הכמות!</span>)}
                    </div>
                  </div>
                </div>
              )}

              {/* Crop Options (Prints Only) */}
              {currentStepName === 'חיתוך' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  {CROP_OPTIONS.map((option) => (
                    <label key={option.id} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedCropOption === option.id ? 'bg-blue-50 border-yisraeli-blue shadow-sm' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                      <input type="radio" name="cropOption" value={option.id} checked={selectedCropOption === option.id} onChange={() => setSelectedCropOption(option.id)} className="mt-1 h-5 w-5 text-yisraeli-blue accent-yisraeli-blue flex-shrink-0" />
                      <div className="mr-3">
                        <span className="block font-bold text-gray-900 text-lg mb-1">{option.title}</span>
                        <span className="text-sm text-gray-500 leading-tight">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Order Notes */}
              {currentStepName === 'הערות להזמנה' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div>
                    <label className="block text-gray-700 font-bold mb-3 text-xl">הערות ובקשות מיוחדות</label>
                    <p className="text-sm text-gray-500 mb-4">זהו שלב רשות. אנחנו קוראים הכל – אז אם יש משהו מיוחד שכדאי שנדע, זה המקום לכתוב לנו.</p>
                    <textarea rows={6} placeholder="הקלידו כאן (אופציונלי)..." value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none resize-none shadow-inner"></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t p-4 flex items-center justify-between z-20 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 font-semibold">סה"כ לתשלום:</span>
                <span className="text-2xl font-black text-yisraeli-blue">{totalPrice.toFixed(2)} ₪</span>
              </div>
              <div className="flex gap-2">
                {step > 1 && (
                  <button onClick={() => setStep(prev => prev - 1)} className="px-4 py-3 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 ml-1" />חזור
                  </button>
                )}
                <button onClick={handleNext} disabled={!canGoNext()} className={`px-6 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${!canGoNext() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-yisraeli-blue text-yisraeli-yellow hover:bg-blue-900 active:scale-95 shadow-md'}`}>
                  {step === steps.length ? (<>הזמן עכשיו <PartyPopper className="w-5 h-5 mr-2 text-yisraeli-yellow" /></>) : (<>הבא <ChevronLeft className="w-5 h-5 mr-1" /></>)}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── SUCCESS VIEW ── */
          <div className="p-6 flex-grow overflow-y-auto flex flex-col z-20">
            {uploadStatus === 'success' ? (
              /* FINAL SUCCESS SCREEN WITHIN MODAL */
              <div className="py-8 flex flex-col items-center text-center animate-in zoom-in fade-in h-full justify-center">
                <div className="bg-green-100 p-5 rounded-full mb-5">
                  <Check className="w-14 h-14 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">{uploadSuccessMsg}</h2>
                <p className="text-gray-500 mb-6 font-medium">אנחנו כבר מתחילים לעבוד על ההזמנה שלך 💙</p>
                
                <div className="w-full bg-yisraeli-blue/5 rounded-2xl p-6 border border-yisraeli-blue/10 mb-6">
                  <div className="text-2xl font-black text-yisraeli-blue mb-5">
                    לתשלום: {totalPrice.toFixed(2)} ₪
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Bit Button */}
                    <a
                      href="https://www.bitpay.co.il/app/me/ED17F7F0-3BC9-157A-4420-0BA2874321D0EC11"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border-2 border-transparent hover:border-yisraeli-blue rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <img 
                        src="/bit.png" 
                        alt="bit" 
                        className="h-10 object-contain"
                      />
                      <span className="text-[10px] font-black text-yisraeli-blue mt-2 opacity-60">תשלום מהיר ב-bit</span>
                    </a>

                    {/* PayBox Button */}
                    <a
                      href="https://links.payboxapp.com/VdeZVLYdOYb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border-2 border-transparent hover:border-yisraeli-blue rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <img 
                        src="/paybox.png" 
                        alt="PayBox" 
                        className="h-10 object-contain"
                      />
                      <span className="text-[10px] font-black text-yisraeli-blue mt-2 opacity-60">תשלום מהיר ב-PayBox</span>
                    </a>
                  </div>
                </div>

                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 font-bold transition-colors text-sm underline underline-offset-4"
                >
                  סימנתי, סגור חלון
                </button>
              </div>
            ) : (
              <>
                {/* Celebration header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="bg-yisraeli-blue p-5 rounded-full inline-block mb-4 shadow-xl">
                    <Check className="w-14 h-14 text-yisraeli-yellow" />
                  </div>
                  <h2 className="text-2xl font-black text-yisraeli-blue leading-tight">נרשם! הזמנה #{completedOrder?.order_number}</h2>
                </div>

                {/* Order summary card */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-right">
                  <h3 className="font-black text-yisraeli-blue text-base mb-2">סיכום ההזמנה</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between"><span className="font-semibold">לקוח:</span><span>{customerName}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">מוצר:</span><span>{product?.name}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">כמות:</span><span>{quantity}</span></div>
                    <div className="flex justify-between font-bold text-yisraeli-blue pt-1 border-t border-blue-200 mt-1">
                      <span>לתשלום:</span>
                      <span>{totalPrice.toFixed(2)} ₪</span>
                    </div>
                  </div>
                </div>

                {/* Integrated Upload Options */}
                {!isKit && (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 mb-6">
                    <h3 className="text-lg font-black text-yisraeli-blue mb-4 text-center">איך תרצו לשלוח את התמונות?</h3>
                    
                    {/* Tabs */}
                    {!isUploadLocked && (
                      <div className="flex border-b border-gray-100 mb-4">
                        <button
                          onClick={() => setActiveUploadTab('upload')}
                          className={`flex-1 py-2 font-bold text-xs transition-colors ${activeUploadTab === 'upload' ? 'border-b-2 border-yisraeli-blue text-yisraeli-blue' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          ☁️ העלאה
                        </button>
                        <button
                          onClick={() => setActiveUploadTab('link')}
                          className={`flex-1 py-2 font-bold text-xs transition-colors flex items-center justify-center gap-1 ${activeUploadTab === 'link' ? 'border-b-2 border-yisraeli-blue text-yisraeli-blue' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          🔗 קישור
                        </button>
                      </div>
                    )}

                    {/* Logic for the chosen tab */}
                    <div className="min-h-[140px]">
                      {activeUploadTab === 'upload' && (
                        <div className="flex flex-col gap-3">
                          {uploadStatus === 'idle' && (
                            <label
                              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                              className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-yisraeli-blue bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                              <UploadCloud className="w-8 h-8 text-yisraeli-blue mb-2" />
                              <p className="text-sm font-bold text-yisraeli-blue text-center">גרור תמונות או לחץ כאן</p>
                            </label>
                          )}

                          {uploadStatus === 'loading' && (
                            <div className="space-y-3 py-2 animate-in fade-in">
                              <p className="font-bold text-yisraeli-blue text-center text-sm">מעלה תמונות... ({fileProgresses.filter(p => p.done).length}/{fileProgresses.length})</p>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-yisraeli-yellow h-2 transition-all duration-300" style={{ width: `${(fileProgresses.filter(p => p.done).length / fileProgresses.length) * 100}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeUploadTab === 'link' && (
                        <div className="flex flex-col gap-3 animate-in fade-in">
                          {uploadStatus === 'idle' && (
                            <>
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 flex gap-1.5 items-start text-[11px] text-amber-800">
                                <span>⚠️</span>
                                <span><strong>חובה לוודא</strong> שהקישור פתוח לשיתוף לכולם.</span>
                              </div>
                              <input
                                type="url"
                                dir="ltr"
                                placeholder="הדבק קישור (Drive, Dropbox...)"
                                value={driveLink}
                                onChange={e => setDriveLink(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-1 focus:ring-yisraeli-blue outline-none"
                              />
                              <button
                                onClick={handleSaveLink}
                                disabled={!driveLink.trim()}
                                className="w-full bg-yisraeli-blue text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 transform active:scale-95 shadow-sm"
                              >
                                <Check className="w-4 h-4" /> שמירת קישור
                              </button>
                            </>
                          )}
                          {uploadStatus === 'loading' && (
                            <div className="flex items-center justify-center py-10">
                              <p className="font-bold text-yisraeli-blue animate-pulse">שומר קישור...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp option */}
                    {!isUploadLocked && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <button
                          onClick={handleWhatsappClick}
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          שליחה מהירה בווצאפ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={onClose} 
                  disabled={uploadStatus === 'loading'}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-3 rounded-xl transition-colors disabled:opacity-30"
                >
                  סגור
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Image Zoom Lightbox */}
    {zoomedImage && (
      <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
        <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setZoomedImage(null)}><X className="w-8 h-8" /></button>
        <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded" />
      </div>
    )}
    </>
  );
};

export default ProductModal;
