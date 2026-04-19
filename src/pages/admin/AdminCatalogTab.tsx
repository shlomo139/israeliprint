import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, Edit2, Loader2, Save, X, Upload, Trash2, FolderEdit } from 'lucide-react';

export const AdminCatalogTab: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [activeSection, setActiveSection] = useState<'products' | 'categories'>('products');
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/public/inventory');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.categories);
                setProducts(data.data.products);
            }
        } catch (e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את המוצר לצמיתות?')) return;
        
        try {
            await fetch('/api/admin/update-catalog', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'delete_product', payload: { id } })
            });
            fetchInventory();
        } catch (e) {
            alert('שגיאה במחיקת המוצר');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('מחיקת קטגוריה תמחק הכל הקשור אליה. בטוח?')) return;
        try {
            await fetch('/api/admin/update-catalog', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'delete_category', payload: { id } })
            });
            fetchInventory();
        } catch (e) {
            alert('שגיאה במחיקת קטגוריה');
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct.costPrice || editingProduct.costPrice <= 0) {
            alert('חובה להזין מחיר עלות חומרים למוצר!');
            return;
        }
        if (!editingProduct.tiers || editingProduct.tiers.length === 0) {
            alert('חובה להזין לפחות מדרגת מחירון אחת למוצר!');
            return;
        }

        setSaving(true);
        try {
            await fetch('/api/admin/update-catalog', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'upsert_product',
                    payload: {
                        id: editingProduct.id,
                        category_id: editingProduct.category,
                        name: editingProduct.name,
                        image_url: editingProduct.imageUrl,
                        cost_price: editingProduct.costPrice,
                        status: editingProduct.status || 'active',
                        tiers: editingProduct.tiers,
                        kit_images: editingProduct.kitImages || null,
                        promo: editingProduct.promo?.buy > 0 ? editingProduct.promo : null
                    }
                })
            });
            setEditingProduct(null);
            fetchInventory();
        } catch (e) {
            alert('תקלת שמירה מול בסיס הנתונים');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch('/api/admin/update-catalog', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'upsert_category',
                    payload: {
                        id: editingCategory.id,
                        name: editingCategory.name,
                        path: editingCategory.path,
                        image_url: editingCategory.image_url
                    }
                })
            });
            setEditingCategory(null);
            fetchInventory();
        } catch (e) {
            alert('תקלת שמירה מול בסיס הנתונים');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCategory = false) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const resp = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST', body: file, credentials: 'include'
            });
            const data = await resp.json();
            if (!resp.ok || data.error) {
                alert(`Upload error: ${data.error || 'Unknown server error'}`);
            } else if (data.url) {
                if (isCategory) setEditingCategory((prev: any) => ({ ...prev, image_url: data.url }));
                else setEditingProduct((prev: any) => ({ ...prev, imageUrl: data.url }));
            }
        } catch (err: any) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleTierChange = (index: number, field: string, value: number) => {
        const newTiers = [...(editingProduct.tiers || [])];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setEditingProduct((prev: any) => ({ ...prev, tiers: newTiers }));
    };

    if (loading) return <div className="text-center p-12 text-blue-500"><Loader2 className="w-10 h-10 animate-spin mx-auto"/></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/60 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-md shadow-2xl gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">ניהול קטלוג דינמי</h2>
                    <p className="text-slate-400 mt-1 font-bold text-sm">הוספה ומחיקת מוצרים וקטגוריות</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setActiveSection('products')} 
                        variant={activeSection === 'products' ? 'primary' : 'outline'}
                        className={`rounded-2xl ${activeSection === 'products' ? 'bg-blue-600 text-white' : 'border-slate-700 text-slate-400'}`}
                    >
                        מוצרים
                    </Button>
                    <Button 
                        onClick={() => setActiveSection('categories')} 
                        variant={activeSection === 'categories' ? 'primary' : 'outline'}
                        className={`rounded-2xl ${activeSection === 'categories' ? 'bg-blue-600 text-white' : 'border-slate-700 text-slate-400'}`}
                    >
                        קטגוריות <FolderEdit className="w-4 h-4 ml-2"/>
                    </Button>
                </div>
            </div>

            {activeSection === 'products' ? (
                // Products Section Grouped by Category
                <div className="space-y-12">
                     <div className="flex justify-end">
                        <Button onClick={() => setEditingProduct({
                            id: `prod_${Date.now()}`, name: 'מוצר חדש', category: categories[0]?.id || 'prints', costPrice: '', imageUrl: '', status: 'active', tiers: [{ minQuantity: 1, pricePerUnit: 0 }]
                        })} className="bg-emerald-500 border-none text-slate-900 rounded-2xl shadow-xl font-black px-6">
                            <Plus className="w-5 h-5 ml-2"/> מוצר חדש
                        </Button>
                     </div>

                    {categories.map(cat => {
                        const catProducts = products.filter(p => p.category === cat.id);
                        if (catProducts.length === 0) return null;
                        
                        return (
                            <div key={cat.id} className="space-y-6">
                                <h3 className="text-xl font-black text-yisraeli-yellow border-b border-slate-800 pb-2">{cat.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {catProducts.map(p => (
                                        <Card key={p.id} className="bg-slate-900/40 border-slate-800 flex flex-col group hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => setEditingProduct(p)}>
                                            <div className="aspect-video w-full bg-slate-800 relative rounded-t-2xl overflow-hidden">
                                                {p.imageUrl ? <img src={p.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/> : <div className="absolute inset-0 flex items-center justify-center text-slate-600">אין תמונה</div>}
                                                <button 
                                                    onClick={(e) => handleDeleteProduct(p.id, e)}
                                                    className="absolute top-3 left-3 bg-rose-500/90 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-5 flex-grow flex flex-col justify-between">
                                                <h3 className="font-black text-yisraeli-yellow bg-slate-900/80 px-2 py-1 rounded inline-block text-lg shadow-sm">{p.name}</h3>
                                                <div className="flex justify-between items-center mt-4 border-t border-slate-800 pt-3">
                                                    <div className="text-[11px] text-rose-400 font-black">עלות: ₪{p.costPrice || '0'}</div>
                                                    <div className="text-[11px] font-black text-blue-400 flex items-center gap-1"><Edit2 className="w-3 h-3"/> עריכה</div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Categories Layout
                <div className="space-y-8">
                     <div className="flex justify-end">
                        <Button onClick={() => setEditingCategory({
                            id: `cat_${Date.now()}`, name: 'קטגוריה חדשה', path: '/category-new', image_url: ''
                        })} className="bg-emerald-500 border-none text-slate-900 rounded-2xl shadow-xl font-black px-6">
                            <Plus className="w-5 h-5 ml-2"/> קטגוריה חדשה
                        </Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {categories.map(cat => (
                             <Card key={cat.id} className="bg-slate-900/40 border-slate-800 group hover:border-amber-500/50 transition-all cursor-pointer" onClick={() => setEditingCategory(cat)}>
                                 <div className="h-40 w-full bg-slate-800 relative rounded-t-2xl overflow-hidden">
                                    {cat.image_url || products.find(p => p.category === cat.id)?.imageUrl ? <img src={cat.image_url || products.find(p => p.category === cat.id)?.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all"/> : <div className="absolute inset-0 flex items-center justify-center text-slate-600">חסר רקע</div>}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                                    <h3 className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white drop-shadow-lg">{cat.name}</h3>
                                 </div>
                                 <div className="p-4 flex justify-between items-center bg-slate-900/80">
                                     <span className="text-xs text-slate-500 font-mono">{cat.path}</span>
                                     <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="text-rose-500 hover:text-white hover:bg-rose-500 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                             </Card>
                         ))}
                     </div>
                </div>
            )}

            {/* MODALS */}
            {editingProduct && (
                 <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                     <button onClick={() => setEditingProduct(null)} className="absolute top-6 left-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all"><X className="w-6 h-6"/></button>
                     <h2 className="text-3xl font-black text-white mb-8 border-r-4 border-blue-500 pr-4">{editingProduct.id.startsWith('prod_') ? 'יצירת מוצר חדש' : 'עריכת מוצר'}</h2>
                     <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                             <Input label="שם המוצר" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                     <label className="text-sm font-bold text-slate-400">שיוך לקטגוריה</label>
                                     <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 outline-none text-white font-black cursor-pointer">
                                         {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                     </select>
                                 </div>
                                 <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                                     <label className="text-xs font-black text-amber-500 mb-2 block">מבצע כמותי (Buy X Get Y)</label>
                                     <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[10px] text-slate-500">קנה כמות:</label><input type="number" value={editingProduct.promo?.buy || ''} onChange={e => setEditingProduct({...editingProduct, promo: {...(editingProduct.promo || {}), buy: Number(e.target.value)||0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-center font-mono"/></div>
                                        <div className="flex-1"><label className="text-[10px] text-slate-500">קבל מתנה:</label><input type="number" value={editingProduct.promo?.get || ''} onChange={e => setEditingProduct({...editingProduct, promo: {...(editingProduct.promo || {}), get: Number(e.target.value)||0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-center font-mono"/></div>
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl relative">
                                 <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                                 <label className="text-[12px] font-black uppercase text-rose-400 mb-4 block">עלות חומרים לייצור (שדה חובה)</label>
                                 <Input type="number" step="0.1" value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})} required className="w-full text-2xl font-mono text-rose-100" />
                             </div>
                             <div className="space-y-4 pt-4">
                                 <div className="flex justify-between items-center"><label className="text-base font-black text-white">מחירונים מדורגים והנחות</label><Button type="button" size="sm" variant="outline" onClick={() => setEditingProduct({...editingProduct, tiers: [...(editingProduct.tiers||[]), {minQuantity:1,pricePerUnit:10,discountPercentage:0}]})} className="border-blue-500 text-blue-400 rounded-xl">הוסף מדרגה +</Button></div>
                                 <div className="space-y-3 bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                                     {editingProduct.tiers?.map((tier: any, i: number) => (
                                         <div key={i} className="flex gap-3 bg-slate-900 p-4 rounded-xl relative group/tier">
                                             <button type="button" onClick={() => { const t=[...editingProduct.tiers]; t.splice(i,1); setEditingProduct({...editingProduct, tiers: t}); }} className="absolute -left-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/tier:opacity-100"><X className="w-3 h-3"/></button>
                                             <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold block">כמות מזערית</label><input type="number" value={tier.minQuantity} onChange={(e) => handleTierChange(i, 'minQuantity', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-700 text-white font-mono outline-none text-center"/></div>
                                             <div className="flex-1"><label className="text-[10px] text-slate-500 font-bold block">מחיר יחידה (₪)</label><input type="number" step="0.1" value={tier.pricePerUnit} onChange={(e) => handleTierChange(i, 'pricePerUnit', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-700 text-blue-400 font-mono outline-none font-black text-center"/></div>
                                             <div className="flex-1"><label className="text-[10px] text-amber-500 font-bold block">הנחה (%)</label><input type="number" value={tier.discountPercentage||0} onChange={(e) => handleTierChange(i, 'discountPercentage', Number(e.target.value))} className="w-full bg-transparent border-b border-amber-900 text-amber-400 font-mono outline-none font-black text-center"/></div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                         <div className="space-y-6">
                             <label className="text-sm font-bold text-slate-400">תמונה ראשית (Vercel Blob)</label>
                             <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-[2rem] h-64 relative bg-slate-950/50 flex items-center justify-center overflow-hidden">
                                 <input type="file" onChange={(e) => handleImageUpload(e, false)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                 {uploading ? <div className="text-blue-500"><Loader2 className="animate-spin w-8 h-8"/></div> : editingProduct.imageUrl ? <img src={editingProduct.imageUrl} className="w-full h-full object-cover" /> : <div className="text-slate-500"><Upload className="w-12 h-12 mx-auto"/></div>}
                             </div>
                             <div className="pt-8"><Button fullWidth type="submit" disabled={saving} className="bg-emerald-500 text-slate-900 font-black py-4 rounded-2xl text-lg">{saving ? 'שומר...' : 'שמור מוצר במערכת'}</Button></div>
                         </div>
                     </form>
                 </div>
                 </div>
            )}

            {editingCategory && (
                 <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative">
                     <button onClick={() => setEditingCategory(null)} className="absolute top-6 left-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all"><X className="w-6 h-6"/></button>
                     <h2 className="text-2xl font-black text-white mb-6 border-r-4 border-amber-500 pr-3">{editingCategory.id.startsWith('cat_') ? 'יצירת קטגוריה חדשה' : 'עריכת קטגוריה'}</h2>
                     <form onSubmit={handleSaveCategory} className="space-y-6">
                         <Input label="שם הקטגוריה (לדוגמה: מגנטים)" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} required />
                         <Input label="נתיב כתובת קישור (לדוגמה: /magnets)" value={editingCategory.path} onChange={e => setEditingCategory({...editingCategory, path: e.target.value})} required />
                         <div className="space-y-2">
                             <label className="text-sm font-bold text-slate-400">תמונת קטגוריה (תוצג בדף הבית)</label>
                             <div className="border-2 border-dashed border-slate-700 bg-slate-950 h-48 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                 <input type="file" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                 {uploading ? <Loader2 className="animate-spin text-blue-500"/> : editingCategory.image_url ? <img src={editingCategory.image_url} className="w-full h-full object-cover"/> : <Upload className="text-slate-500"/>}
                             </div>
                         </div>
                         <Button fullWidth type="submit" disabled={saving} className="bg-amber-500 text-slate-900 font-black py-4 rounded-xl text-lg">{saving ? 'שומר...' : 'עדכן קטגוריה'}</Button>
                     </form>
                 </div>
                 </div>
            )}
        </div>
    );
};
