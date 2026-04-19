import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Save, Image as ImageIcon, Type, Power, Loader2, Upload } from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    banner_mode: 'text',
    banner_title: '',
    banner_subtitle: '',
    banner_bg_color: 'bg-yisraeli-blue',
    banner_image_url: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/public/inventory');
        const json = await res.json();
        if (json.data?.settings) {
          setSettings(json.data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      alert('העיצוב עודכן בהצלחה! הוא באוויר מיידית.');
    } catch (err) {
      alert('שגיאה בשמירת הנתונים');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const resp = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.url) {
        handleChange('banner_image_url', data.url);
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const turnOffSales = () => {
    if (window.confirm('פעולה זו תמחק הנחות מכל המוצרים! להמשיך?')) {
      alert('סימולציה: כל אחוזי ההנחה ממוצרי הקטלוג הוסרו.');
    }
  };

  if (loading) return <div className="text-center p-12 text-blue-500"><Loader2 className="w-10 h-10 animate-spin mx-auto"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-md shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">עיצוב ויזואלי והודעות קופצות</h2>
          <p className="text-slate-400 mt-1 font-bold text-sm">שליטה מלאה על הבאנר בחנות והודעות הפופ-אפ בכניסה</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white rounded-2xl shadow-xl hover:scale-105 transition-all text-sm gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
          שמור שינויים בשרת
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden group">
          <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/20 p-6 border-b border-slate-800">
            <h3 className="font-black text-lg text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-400"/> מודל הודעות</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex gap-4">
              <Button 
                variant={settings.banner_mode === 'text' ? 'primary' : 'outline'} 
                onClick={() => handleChange('banner_mode', 'text')}
                className={`flex-1 rounded-2xl py-4 transition-all ${settings.banner_mode === 'text' ? 'bg-blue-600 border-none text-white shadow-lg shadow-blue-500/20' : 'border-slate-700 text-slate-400 hover:text-white'}`}
              >
                <Type className="w-5 h-5 ml-2" /> באנר טקסט סטנדרטי
              </Button>
              <Button 
                variant={settings.banner_mode === 'image_only' ? 'primary' : 'outline'} 
                onClick={() => handleChange('banner_mode', 'image_only')}
                className={`flex-1 rounded-2xl py-4 transition-all ${settings.banner_mode === 'image_only' ? 'bg-amber-500 border-none text-slate-900 shadow-lg shadow-amber-500/20' : 'border-slate-700 text-slate-400 hover:text-white'}`}
              >
                <ImageIcon className="w-5 h-5 ml-2" /> פוסט מבצע (פופ-אפ)
              </Button>
            </div>

            {settings.banner_mode === 'text' ? (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <Input label="כותרת ראשית (תמשוך תשומת לב)" value={settings.banner_title} onChange={e => handleChange('banner_title', e.target.value)} />
                <Input label="תת כותרת (הסבר המבצע)" value={settings.banner_subtitle} onChange={e => handleChange('banner_subtitle', e.target.value)} />
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">צבע רקע הבאנר בחנות</label>
                  <select 
                    value={settings.banner_bg_color} 
                    onChange={e => handleChange('banner_bg_color', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 outline-none font-bold text-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value="bg-yisraeli-blue">כחול מותג</option>
                    <option value="bg-yisraeli-yellow text-slate-900">צהוב מותג</option>
                    <option value="bg-rose-500">אדום מבצעים</option>
                    <option value="bg-emerald-500">ירוק</option>
                    <option value="bg-indigo-600">סגול מודרני</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-3xl p-10 text-center relative transition-all group/upload bg-slate-950/50">
                  <input type="file" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                  {uploading ? (
                    <div className="flex flex-col items-center text-amber-500"><Loader2 className="w-10 h-10 animate-spin mb-4"/><span className="font-black text-sm">מעלה ל-Vercel Blob...</span></div>
                  ) : settings.banner_image_url ? (
                    <div className="relative relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-xl"><img src={settings.banner_image_url} className="absolute inset-0 w-full h-full object-cover" alt="Banner preview"/></div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 group-hover/upload:text-amber-500 transition-colors"><Upload className="w-10 h-10 mb-4" /><span className="font-black">גרור לכאן תמונת פוסט / לחץ לבחירה</span><span className="text-xs mt-2 opacity-70">מומלץ פוסט מרובע (Instagram size) לקופץ הראשון</span></div>
                  )}
                </div>
                <div className="bg-amber-500/10 text-amber-500 p-4 rounded-2xl border border-amber-500/20 text-sm font-bold flex items-center justify-center gap-2">
                  <span>✨ הלקוח יראה טופס קופץ פעם אחת בביקור!</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-8">
            <Card className="bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden group">
                <div className="bg-gradient-to-r from-rose-900/40 to-red-900/20 p-6 border-b border-rose-900/50">
                    <h3 className="font-black text-lg text-white flex items-center gap-2"><Power className="w-5 h-5 text-rose-400"/> בקרת מבצעים ובאנרים</h3>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">בלחיצה אחת, בטל לחלוטין את כל תקופת המבצעים באתר. זה יעבור על כל המוצרים שהוגדרו להם "אחוזי הנחה" ברגעים אלו ויאפס אותם, למניעת צורך בהוצאת ההנחה אחד אחד.</p>
                    <Button variant="outline" fullWidth onClick={turnOffSales} className="border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl py-6 tracking-wide shadow-lg hover:shadow-rose-500/20">
                        השבת כל המבצעים כעת במכה אחת
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};
