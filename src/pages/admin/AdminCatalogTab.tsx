import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, Edit2, Loader2, Save, X, Upload, Percent } from 'lucide-react';

export const AdminCatalogTab: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
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

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ** BUSINESS RULE VALIDATION (MANDATORY FIELDS) ** //
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'upsert_product',
                    payload: {
                        id: editingProduct.id,
                        category_id: editingProduct.category,
                        name: editingProduct.name,
                        image_url: editingProduct.imageUrl,
                        cost_price: editingProduct.costPrice,
                        status: editingProduct.status,
                        tiers: editingProduct.tiers,
                        kit_images: editingProduct.kitImages
                    }
                })
            });
            alert('המוצר נשמר בהצלחה במסד!');
            setEditingProduct(null);
            fetchInventory(); // Reload state
        } catch (e) {
            alert('תקלת שמירה מול בסיס הנתונים');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const resp = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST', body: file, credentials: 'include'
            });
            const data = await resp.json();
            if (data.url) {
                setEditingProduct((prev: any) => ({ ...prev, imageUrl: data.url }));
            }
        } finally {
            setUploading(false);
        }
    };

    const handleTierChange = (index: number, field: string, value: number) => {
        const newTiers = [...(editingProduct.tiers || [])];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setEditingProduct((prev: any) => ({ ...prev, tiers: newTiers }));
    };

    const addTier = () => {
        setEditingProduct((prev: any) => ({
            ...prev,
            tiers: [...(prev.tiers || []), { minQuantity: 1, pricePerUnit: 10, discountPercentage: 0 }]
        }));
    };

    const removeTier = (index: number) => {
        const newTiers = [...editingProduct.tiers];
        newTiers.splice(index, 1);
        setEditingProduct((prev: any) => ({ ...prev, tiers: newTiers }));
    };

    const openNewProductModal = () => {
        setEditingProduct({
            id: `prod_${Date.now()}`,
            name: 'מוצר חדש',
            category: categories[0]?.id || 'prints',
            costPrice: '',
            imageUrl: '',
            status: 'active',
            tiers: [{ minQuantity: 1, pricePerUnit: 0 }]
        });
    };

    if (loading) return <div className="text-center p-12 text-blue-500"><Loader2 className="w-10 h-10 animate-spin mx-auto"/></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-md shadow-2xl">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">ניהול קטלוג דינמי</h2>
                    <p className="text-slate-400 mt-1 font-bold text-sm">ניהול מוצרים, עלויות חומרים ומחירונים בצורה ישירה ל-Neon DB</p>
                </div>
                <Button onClick={openNewProductModal} className="bg-emerald-500 border-none text-slate-900 rounded-2xl shadow-xl hover:scale-105 transition-all text-sm font-black gap-2 px-6">
                    <Plus className="w-5 h-5"/>
                    מוצר חדש
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                    <Card key={p.id} className="bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden group hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer" onClick={() => setEditingProduct(p)}>
                        <div className="aspect-video w-full bg-slate-800 relative">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/> : <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-bold">אין תמונה</div>}
                            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">{p.category}</div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-black text-white mb-2">{p.name}</h3>
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-xs text-rose-400 tracking-wider uppercase font-black bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">עלות: ₪{p.costPrice || 'חסר'}</div>
                                <div className="text-sm font-black text-blue-400 flex items-center gap-1"><Edit2 className="w-3 h-3"/> עריכה</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* PRODUCT EDIT MODAL OVERLAY */}
            {editingProduct && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button onClick={() => setEditingProduct(null)} className="absolute top-6 left-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all"><X className="w-6 h-6"/></button>
                        
                        <h2 className="text-3xl font-black text-white mb-8 pr-4 border-r-4 border-blue-500">{editingProduct.id.startsWith('prod_') ? 'יצירת מוצר חדש' : 'עריכת מוצר'}</h2>
                        
                        <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Content Side */}
                            <div className="space-y-6">
                                <Input label="שם המוצר בחנות" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">שיוך לקטגוריה</label>
                                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 outline-none text-white font-black cursor-pointer focus:border-blue-500">
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                                    <label className="text-[12px] font-black tracking-widest uppercase text-rose-400 mb-4 block">עלות חומרים לייצור המוצר השלם (שדה חובה)</label>
                                    <Input type="number" step="0.1" placeholder="לדוגמה: 0.5" value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})} required className="w-full text-2xl font-mono text-rose-100" />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-base font-black text-white">מחירון מדורג (+הנחות)</label>
                                        <Button type="button" size="sm" variant="outline" onClick={addTier} className="border-blue-500 text-blue-400 rounded-xl">הוסף מדרגה +</Button>
                                    </div>
                                    <div className="space-y-3 bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                                        {editingProduct.tiers?.map((tier: any, i: number) => (
                                            <div key={i} className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative group/tier">
                                                <button type="button" onClick={() => removeTier(i)} className="absolute -left-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/tier:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                                                <div className="flex-1 min-w-[100px]">
                                                    <span className="text-[10px] text-slate-500 font-bold absolute -top-2 bg-slate-950 px-2 rounded right-4">כמות מינימום</span>
                                                    <input type="number" value={tier.minQuantity} onChange={(e) => handleTierChange(i, 'minQuantity', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-700 text-white px-2 py-1 outline-none text-center font-mono focus:border-blue-500"/>
                                                </div>
                                                <div className="flex-1 min-w-[100px]">
                                                    <span className="text-[10px] text-slate-500 font-bold absolute -top-2 bg-slate-950 px-2 rounded right-[45%]">מחיר ליחידה ₪</span>
                                                    <input type="number" step="0.1" value={tier.pricePerUnit} onChange={(e) => handleTierChange(i, 'pricePerUnit', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-700 text-blue-400 px-2 py-1 outline-none text-center font-mono focus:border-blue-500 font-black"/>
                                                </div>
                                                <div className="flex-[0.5] min-w-[80px]">
                                                    <span className="text-[10px] text-amber-500 font-bold absolute -top-2 bg-amber-500/10 px-2 rounded border border-amber-500/20 left-4">% הנחה פעילה</span>
                                                    <input type="number" value={tier.discountPercentage || 0} onChange={(e) => handleTierChange(i, 'discountPercentage', Number(e.target.value))} className="w-full bg-transparent border-b border-amber-900 text-amber-400 px-2 py-1 outline-none text-center font-mono focus:border-amber-500 font-black"/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Image Side */}
                            <div className="space-y-6">
                                <label className="text-sm font-bold text-slate-400">תמונת זיהוי ראשית (Vercel Blob URL)</label>
                                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-[2rem] p-4 text-center cursor-pointer relative bg-slate-950/50 group h-64 overflow-hidden flex items-center justify-center">
                                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {uploading ? (
                                        <div className="text-blue-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/> מזרים לענן...</div>
                                    ) : editingProduct.imageUrl ? (
                                        <img src={editingProduct.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700"/>
                                    ) : (
                                        <div className="text-slate-500 group-hover:text-blue-400 transition-colors"><Upload className="w-12 h-12 mx-auto mb-2 opacity-50"/>גרור תמונה או לחץ להעלאה</div>
                                    )}
                                </div>
                                <div className="pt-8">
                                    <Button type="submit" disabled={saving} fullWidth className="bg-gradient-to-r from-emerald-500 to-green-600 border-none text-slate-900 rounded-2xl py-5 shadow-xl hover:shadow-emerald-500/20 font-black text-lg gap-3">
                                        {saving ? <Loader2 className="animate-spin"/> : <Save/>}
                                        בצע ושמור למערכת
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
