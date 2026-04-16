import React, { useState } from 'react';
import { UploadCloud, Check, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface UploadFlowProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  onComplete: () => void;
}

const UploadFlow: React.FC<UploadFlowProps> = ({ orderNumber, customerName, customerPhone, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'whatsapp'>('upload');

  // Upload Local States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Link States
  const [driveLink, setDriveLink] = useState('');
  const [isLinkSaving, setIsLinkSaving] = useState(false);
  const [linkSaved, setLinkSaved] = useState(false);

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
        body: JSON.stringify({ customerName, customerPhone, orderNumber, files: fileMeta })
      });
      
      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) throw new Error(initData.error || 'Server error init');

      // 2. Direct PUT to Google with Concurrency of 3
      let completed = 0;
      const concurrencyLimit = 3;
      const filesWithMeta = filesArray.map((file, index) => ({ file, index }));
      
      const uploadTask = async (file: File, index: number) => {
        const { uploadUrl } = initData.uploadUrls[index];
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
             'Content-Type': file.type || 'application/octet-stream',
             'Content-Length': file.size.toString()
          },
          body: file
        });
        if (putRes.ok) {
          completed++;
          setUploadProgress(Math.round((completed / filesArray.length) * 100));
        }
      };

      // Simple pool management
      const queue = [...filesWithMeta];
      const activePromises: Promise<void>[] = [];
      
      while (queue.length > 0 || activePromises.length > 0) {
        while (activePromises.length < concurrencyLimit && queue.length > 0) {
          const item = queue.shift()!;
          const p = uploadTask(item.file, item.index).then(() => {
            activePromises.splice(activePromises.indexOf(p), 1);
          });
          activePromises.push(p);
        }
        if (activePromises.length > 0) {
          await Promise.race(activePromises);
        }
      }

      // 3. Update database with the folder link and trigger notification
      await fetch('/api/orders/update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderNumber, 
          uploadMethod: 'gallery', 
          uploadLink: initData.folderUrl 
        })
      });

      setUploadSuccess(true);
      setTimeout(() => onComplete(), 3000);
    } catch (err) {
      console.error(err);
      alert("שגיאה בהעלאת התמונות. אנא נסה שוב או שלח לחילופין לינק/ווצאפ.");
      setIsUploading(false);
    }
  };

  const handleSaveLink = async () => {
    if (!driveLink.trim()) return;
    setIsLinkSaving(true);
    try {
      const res = await fetch('/api/orders/update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderNumber, 
          uploadMethod: 'link', 
          uploadLink: driveLink 
        })
      });
      if (res.ok) {
        setLinkSaved(true);
        setTimeout(() => onComplete(), 3000);
      } else {
        alert("שגיאה בשמירת הקישור.");
      }
    } catch (e) {
      alert("שגיאת רשת.");
    }
    setIsLinkSaving(false);
  };

  const handleWhatsAppAction = async () => {
    try {
      await fetch('/api/orders/update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderNumber, 
          uploadMethod: 'whatsapp', 
          uploadLink: 'בוצע בוואטסאפ' 
        })
      });
    } catch (e) {
      console.error("Server update failed for WhatsApp click", e);
    }
  };

  const whatsappMessage = encodeURIComponent(`היי, הזמנתי באתר. מספר ההזמנה שלי: ${orderNumber}. אני שולח/ת לכאן את התמונות!`);
  const whatsappUrl = `https://wa.me/972585250485?text=${whatsappMessage}`;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6 pb-6">
      <div className="flex border-b text-center cursor-pointer">
        <div 
          onClick={() => setActiveTab('upload')} 
          className={`flex-1 p-4 font-bold transition-all ${activeTab === 'upload' ? 'bg-yisraeli-blue text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          העלאה ישירה
        </div>
        <div 
          onClick={() => setActiveTab('link')} 
          className={`flex-1 p-4 font-bold border-r border-gray-200 transition-all ${activeTab === 'link' ? 'bg-yisraeli-blue text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          קישור (דרייב/ג'מבו)
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: UPLOAD MOCK */}
        {activeTab === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[220px]">
             {!uploadSuccess && !isUploading && (
                <label className="w-full border-2 border-dashed border-yisraeli-blue bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <div className="bg-yisraeli-yellow/20 p-4 rounded-full mb-4">
                        <UploadCloud className="w-10 h-10 text-yisraeli-blue" />
                    </div>
                    <h4 className="text-xl font-bold text-yisraeli-blue mb-2">לחץ וגרור תמונות לכאן</h4>
                    <p className="text-sm text-gray-500 text-center">ההעלאה מתבצעת באופן מאובטח ישירות לשרתינו.</p>
                </label>
             )}

             {isUploading && (
                <div className="w-full flex justify-center items-center flex-col py-8 animate-in fade-in">
                    <p className="text-xl font-bold text-yisraeli-blue mb-4">מעלה תמונות... {uploadProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                       <div className="bg-yisraeli-yellow h-4 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
             )}

             {uploadSuccess && (
                 <div className="w-full flex justify-center items-center flex-col py-8 animate-in zoom-in fade-in">
                     <div className="bg-green-100 p-5 rounded-full mb-4 animate-bounce">
                        <Check className="w-12 h-12 text-green-600" />
                     </div>
                     <h4 className="text-2xl font-bold text-green-600">התמונות הועלו בהצלחה!</h4>
                 </div>
             )}
          </div>
        )}

        {/* TAB 2: PASTE LINK */}
        {activeTab === 'link' && (
          <div className="flex flex-col items-center justify-center min-h-[220px] animate-in fade-in slide-in-from-right-4">
             {!linkSaved ? (
                 <div className="w-full space-y-4">
                    <label className="block text-gray-700 font-bold mb-2">הדבק קישור לתיקיית התמונות שלך (Google Drive, JumboMail, וכו'):</label>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/..." 
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-left font-mono focus:ring-2 focus:ring-yisraeli-blue focus:border-transparent outline-none"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      dir="ltr"
                    />
                    <button 
                      onClick={handleSaveLink}
                      disabled={isLinkSaving || !driveLink.trim()}
                      className="w-full bg-yisraeli-blue hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors"
                    >
                      {isLinkSaving ? 'שומר קישור...' : <><LinkIcon className="w-5 h-5 mr-2" /> שמור קישור להזמנה</>}
                    </button>
                 </div>
             ) : (
                <div className="w-full flex justify-center items-center flex-col py-8 animate-in zoom-in fade-in">
                    <div className="bg-green-100 p-5 rounded-full mb-4 animate-bounce">
                       <Check className="w-12 h-12 text-green-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-green-600">הקישור נשמר בהצלחה!</h4>
                </div>
             )}
          </div>
        )}
      </div>

      <div className="px-6 pb-2">
        <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-bold text-sm">או האופציה המהירה</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppAction}
          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
        >
          <FaWhatsapp className="w-6 h-6 ml-2" />
          שליחת התמונות בווצאפ
        </a>
      </div>
    </div>
  );
};

export default UploadFlow;
