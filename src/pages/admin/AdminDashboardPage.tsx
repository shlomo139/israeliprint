import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  RefreshCcw, 
  Search, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Info,
  Save,
  ChevronLeft,
  ChevronRight,
  PieChart,
  BarChart3,
  Filter,
  CreditCard,
  Link as LinkIcon,
  Loader2,
  Settings,
  Box
} from 'lucide-react';
import { getCostPrice, calculateProfit } from '../../../lib/pricing';
import { AdminCatalogTab } from './AdminCatalogTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { useInventory } from '../../InventoryContext';

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  product_type: string;
  size: string | null;
  quantity: number;
  total_price: number;
  customer_notes: string | null;
  upload_method: string | null;
  upload_link: string | null;
  drive_folder_url: string | null;
  payment_status: string | null;
  order_status: string | null;
  discount: number | null;
  material_cost_override: number | null;
  special_price: number | null;
  discount_percent: number | null;
}

const ORDER_STATUSES = [
  { value: 'new', label: '🆕 חדשה', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { value: 'processing', label: '⚙️ בעיבוד', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { value: 'ready', label: '🎉 מוכנה', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { value: 'delivered', label: '📦 נמסרה', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { value: 'cancelled', label: '❌ בוטלה', color: 'text-rose-400', bg: 'bg-rose-400/10' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: '⏳ ממתין לתשלום', color: 'text-amber-400' },
  { value: 'paid', label: '✅ שולם', color: 'text-emerald-400' },
  { value: 'partial', label: '🔄 שולם חלקית', color: 'text-blue-400' },
  { value: 'refunded', label: '↩️ הוחזר', color: 'text-rose-400' },
];

const fmt = (n: number) => `₪${Number(n).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
const fmtTime = (d: string) => {
  const date = new Date(d);
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { products } = useInventory();
  const [activeTab, setActiveTab] = useState<'orders' | 'dashboard' | 'catalog' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<Record<number, Partial<Order>>>({});
  
  const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetchOrders = useCallback(async () => {
    try {
      const authRes = await fetch('/api/admin/me', { credentials: 'include' });
      if (!authRes.ok) { navigate('/admin/login', { replace: true }); return; }

      const res = await fetch('/api/admin/orders', { credentials: 'include' });
      if (!res.ok) { setError('שגיאת שרת בטעינת הזמנות'); return; }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setError('שגיאת תקשורת');
    } finally {
        setTimeout(() => setLoading(false), 600);
    }
  }, [navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  };

  const getFieldValue = <K extends keyof Order>(order: Order, field: K): Order[K] => {
    return (editState[order.id]?.[field] as Order[K]) ?? order[field];
  };

  const setField = (orderId: number, field: keyof Order, value: any) => {
    setEditState(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }));
    if (field === 'order_status' || field === 'payment_status') {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
    }
  };

  const saveOrder = async (orderId: number) => {
    const fields = editState[orderId];
    if (!fields) return;
    setSavingId(orderId);
    try {
      const res = await fetch('/api/admin/update-order', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...fields }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data.order } : o));
        setEditState(prev => { const n = { ...prev }; delete n[orderId]; return n; });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const getProfitData = (order: Order) => {
    const qty = Number(order.quantity) || 1;
    const basePrice = Number(order.total_price) || 0;
    const specialPrice = getFieldValue(order, 'special_price');
    const discountPercent = Number(getFieldValue(order, 'discount_percent')) || 0;
    const override = getFieldValue(order, 'material_cost_override');
    
    let finalRevenue = basePrice;
    if (specialPrice != null) {
        finalRevenue = Number(specialPrice);
    } else if (discountPercent > 0) {
        finalRevenue = basePrice * (1 - discountPercent / 100);
    }

    // Merge DB logic: Use dynamic cost_price from DB if available!
    const dbProduct = products.find(p => p.name === order.product_type);
    let fallbackCost = getCostPrice(order.product_type, order.size);
    if (dbProduct && (dbProduct.costPrice || 0) > 0) {
      fallbackCost = Number(dbProduct.costPrice);
    }

    const costUnit = override != null ? Number(override) : fallbackCost;
    const totalCost = costUnit * qty;
    const profit = finalRevenue - totalCost;
    return { profit, finalRevenue, costUnit, totalCost };
  };

  const analyticsData = useMemo(() => {
    const monthSet = new Set<string>();
    orders.forEach(o => {
        if (o.created_at) {
            monthSet.add(o.created_at.slice(0, 7));
        }
    });
    monthSet.add(new Date().toISOString().slice(0, 7));
    const allMonths = Array.from(monthSet).sort().reverse();

    const monthOrders = orders.filter(o => o.created_at && o.created_at.startsWith(selectedAnalyticsMonth));
    let monthlyProfit = 0;
    const categories: Record<string, number> = { 'מגנטים': 0, 'בלוקים': 0, 'תמונות': 0, 'אחר': 0 };

    monthOrders.forEach(o => {
        if (o.payment_status === 'paid') {
            monthlyProfit += getProfitData(o).profit;
        }
        const pt = (o.product_type || '').toLowerCase();
        if (pt.includes('מגנט')) categories['מגנטים']++;
        else if (pt.includes('בלוק')) categories['בלוקים']++;
        else if (pt.includes('תמונה') || pt.includes('פיתוח')) categories['תמונות']++;
        else categories['אחר']++;
    });

    const open = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status || '')).length;
    const pendingPaid = orders.filter(o => o.payment_status === 'pending').length;

    // Calculate Graph with dynamic heights
    const graphData: { month: string, count: number }[] = [];
    let peakOrders = 5;
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.toISOString().slice(0, 7);
        const count = orders.filter(o => o.created_at && o.created_at.startsWith(m)).length;
        graphData.push({ month: m, count });
        if (count > peakOrders) peakOrders = count;
    }

    return { 
        open, 
        pendingPaid, 
        monthlyCount: monthOrders.length,
        monthlyProfit,
        categories: Object.entries(categories),
        allMonths,
        graphData: graphData.reverse(),
        peakOrders
    };
  }, [orders, selectedAnalyticsMonth, editState]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === 'all' || o.order_status === filterStatus;
      const matchPayment = filterPayment === 'all' || o.payment_status === filterPayment;
      const matchMonth = filterMonth === 'all' || (o.created_at && o.created_at.startsWith(filterMonth));
      const term = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || o.customer_name.toLowerCase().includes(term) || o.order_number.includes(term);
      return matchStatus && matchPayment && matchMonth && matchSearch;
    });
  }, [orders, searchTerm, filterStatus, filterPayment, filterMonth]);

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-white">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
            </div>
            <h2 className="mt-8 text-2xl font-black tracking-widest text-slate-400 animate-pulse">מעבד נתונים...</h2>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 font-sans p-6 md:p-10 relative" dir="rtl">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
              <LayoutDashboard className="text-blue-500 w-8 h-8" />
              ממשק ניהול
            </h1>
            <p className="text-slate-500 mt-2 font-medium italic">ישראלי - מדפיסים רגעים של אושר</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setLoading(true); fetchOrders(); }} className="p-3 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-2xl transition-all shadow-lg flex items-center justify-center mr-2"><RefreshCcw className="w-5 h-5" /></button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl font-bold transition-all"><LogOut className="w-5 h-5" />יציאה</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-900/80 border border-slate-800/50 rounded-2xl w-fit mb-8 shadow-2xl backdrop-blur-md overflow-x-auto max-w-full">
            <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 md:px-10 py-3 rounded-xl font-black transition-all duration-300 whitespace-nowrap ${activeTab === 'orders' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
            >ניהול הזמנות</button>
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 md:px-10 py-3 rounded-xl font-black transition-all duration-300 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
            >ניתוח רווחים</button>
            <button 
                onClick={() => setActiveTab('catalog')}
                className={`px-6 md:px-10 py-3 rounded-xl font-black transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-emerald-500 text-slate-900 shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:text-emerald-400'}`}
            ><Box className="w-4 h-4"/> קטלוג ומחירונים</button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 md:px-10 py-3 rounded-xl font-black transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-slate-500 hover:text-rose-400'}`}
            ><Settings className="w-4 h-4"/> עיצוב ויזואלי</button>
        </div>

        {activeTab === 'catalog' && <AdminCatalogTab />}
        {activeTab === 'settings' && <AdminSettingsTab />}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Analytics Header with Selector */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
                <div>
                    <h3 className="text-xl font-black text-white mb-1">ניתוח עסקי</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">צפייה בנתונים לפי חודש נבחר</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedAnalyticsMonth}
                        onChange={(e) => setSelectedAnalyticsMonth(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-blue-400 px-6 py-3 rounded-2xl font-black outline-none focus:border-blue-500/50 text-center min-w-[170px]"
                    >
                        {analyticsData.allMonths.map(m => (
                            <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<Layers className="text-blue-400" />} label="הזמנות החודש" value={analyticsData.monthlyCount} />
              <StatCard icon={<TrendingUp className="text-emerald-400" />} label="רווח חודשי (שולמו)" value={fmt(analyticsData.monthlyProfit)} highlight />
              <StatCard icon={<BarChart3 className="text-amber-400" />} label="סה''כ מוצרים" value={orders.filter(o => o.created_at && o.created_at.startsWith(selectedAnalyticsMonth)).reduce((acc, o) => acc + o.quantity, 0)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category Breakdown */}
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-white">
                        <PieChart className="text-blue-500" /> פילוח לפי קטגוריות
                    </h3>
                    <div className="space-y-6">
                        {analyticsData.categories.map(([cat, count], i) => {
                            const pct = analyticsData.monthlyCount === 0 ? 0 : (count / analyticsData.monthlyCount) * 100;
                            const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'];
                            return (
                                <div key={cat} className="space-y-4">
                                    <div className="flex justify-between text-base font-black">
                                        <span className="text-slate-200">{cat}</span>
                                        <span className="text-slate-500">{count} הזמנות</span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                                        <div 
                                            className={`${colors[i % colors.length]} h-full transition-all duration-1000 ease-out`} 
                                            style={{ width: `${pct}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Volume Graph - FIXED HEIGHT */}
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-white">
                        <Calendar className="text-blue-500" /> נפח הזמנות שנתי (דינמי)
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-3 px-4 pb-2 border-b border-slate-800/30">
                        {analyticsData.graphData.map((item) => {
                            const heightPercentage = Math.max((item.count / analyticsData.peakOrders) * 100, 5); 
                            return (
                                <div key={item.month} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
                                    <div 
                                        className="w-full bg-gradient-to-t from-blue-600/60 to-blue-400 rounded-t-xl transition-all duration-1000 ease-out cursor-help group-hover:brightness-125 shadow-2xl shadow-blue-500/10 origin-bottom" 
                                        style={{ height: `${heightPercentage}%` }}
                                    >
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[12px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 border border-slate-700 shadow-2xl whitespace-nowrap pointer-events-none">
                                            {item.count} הזמנות
                                        </div>
                                    </div>
                                    <span className="absolute -bottom-8 text-[11px] text-slate-500 font-black whitespace-nowrap">
                                        {new Date(item.month + '-01').toLocaleDateString('he-IL', { month: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-blue-500/20 p-8 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-md">
                    <div className="space-y-1">
                        <div className="text-sm font-black text-blue-400 uppercase tracking-widest">הזמנות פתוחות</div>
                        <div className="text-5xl font-black text-white tabular-nums">{analyticsData.open}</div>
                    </div>
                    <div className="p-6 bg-blue-500/20 rounded-3xl text-blue-400"><Layers className="w-10 h-10" /></div>
                </div>
                <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/20 p-8 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-md">
                    <div className="space-y-1">
                        <div className="text-sm font-black text-amber-400 uppercase tracking-widest">תשלומים ממתינים</div>
                        <div className="text-5xl font-black text-white tabular-nums">{analyticsData.pendingPaid}</div>
                    </div>
                    <div className="p-6 bg-amber-500/20 rounded-3xl text-amber-400"><Clock className="w-10 h-10" /></div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 relative">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                    type="text" 
                    placeholder="חיפוש חופשי..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl outline-none focus:border-blue-500/50 transition-all font-black text-sm"
                    />
                </div>
                <div className="grid grid-cols-3 gap-3 lg:col-span-3">
                    <FilterDropdown 
                        icon={<Filter className="w-4 h-4" />} 
                        label="סטטוס" 
                        value={filterStatus} 
                        onChange={setFilterStatus} 
                        options={[{value: 'all', label: 'כל הכותרות'}, ...ORDER_STATUSES]} 
                    />
                    <FilterDropdown 
                        icon={<CreditCard className="w-4 h-4" />} 
                        label="תשלום" 
                        value={filterPayment} 
                        onChange={setFilterPayment} 
                        options={[{value: 'all', label: 'כל התשלומים'}, ...PAYMENT_STATUSES]} 
                    />
                    <FilterDropdown 
                        icon={<Calendar className="w-4 h-4" />} 
                        label="חודש" 
                        value={filterMonth} 
                        onChange={setFilterMonth} 
                        options={[{value: 'all', label: 'כל החודשים'}, ...analyticsData.allMonths.map(m => ({ value: m, label: new Date(m+'-01').toLocaleDateString('he-IL', { month: 'short', year: 'numeric' }) } ))]} 
                    />
                </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                      <thead className="bg-slate-800/40 text-slate-500 text-[13px] font-black uppercase tracking-[0.2em] border-b border-slate-700/50 text-center">
                          <tr>
                              <th className="p-6">תאריך</th>
                              <th className="p-6 text-right">לקוח</th>
                              <th className="p-6">מוצר</th>
                              <th className="p-6">כמות</th>
                              <th className="p-6">סטטוס</th>
                              <th className="p-6">תשלום</th>
                              <th className="p-6">קבצים</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                          {filteredOrders.length === 0 ? (
                              <tr><td colSpan={7} className="p-32 text-center text-slate-600 font-black text-xl italic">לא נמצאו הזמנות...</td></tr>
                          ) : (
                              filteredOrders.map(order => (
                                  <OrderRow 
                                      key={order.id} 
                                      order={order} 
                                      isExpanded={expandedId === order.id} 
                                      onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                      getFieldValue={getFieldValue}
                                      setField={setField}
                                      onSave={() => saveOrder(order.id)}
                                      isSaving={savingId === order.id}
                                      profitData={getProfitData(order)}
                                  />
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterDropdown = ({ icon, label, value, onChange, options }: any) => (
    <div className="relative group flex-grow">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-400 transition-colors pointer-events-none">
            {icon}
        </div>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pr-10 pl-4 py-4 text-xs font-black text-slate-400 outline-none focus:border-blue-500/50 appearance-none text-center cursor-pointer transition-all"
        >
            {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-slate-400 pointer-events-none" />
    </div>
);

const StatCard = ({ icon, label, value, highlight }: { icon: any, label: string, value: any, highlight?: boolean }) => (
    <div className={`bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] flex items-center gap-6 hover:translate-y-[-4px] transition-all duration-300 shadow-xl ${highlight ? 'ring-1 ring-emerald-500/20' : ''}`}>
        <div className={`p-5 rounded-2xl ${highlight ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>{icon}</div>
        <div className="space-y-1">
            <div className={`text-2xl font-black ${highlight ? 'text-emerald-400' : 'text-white'} tabular-nums`}>{value}</div>
            <div className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
    </div>
);

const OrderRow = ({ order, isExpanded, onToggle, getFieldValue, setField, onSave, isSaving, profitData }: any) => {
    const status = ORDER_STATUSES.find(s => s.value === order.order_status) || ORDER_STATUSES[0];
    const payStatus = PAYMENT_STATUSES.find(p => p.value === order.payment_status) || PAYMENT_STATUSES[0];
    
    const rawPhone = (order.customer_phone || '').replace(/\D/g, '');
    const waPhone = rawPhone.startsWith('0') ? '972' + rawPhone.slice(1) : rawPhone;
    const whatsappUrl = `https://wa.me/${waPhone}`;

    const renderFilesLink = () => {
        const link = (order.upload_link || order.drive_folder_url || '').toLowerCase();
        const method = (order.upload_method || '').toLowerCase();

        if (link.includes('whatsapp') || link.includes('ווצאפ') || method.includes('whatsapp') || method.includes('ווצאפ')) {
            return <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[13px] font-black border border-emerald-500/20 whitespace-nowrap">ווצאפ</div>;
        }

        if (order.upload_link?.startsWith('http') || order.drive_folder_url?.startsWith('http')) {
            const finalLink = order.upload_link || order.drive_folder_url;
            return (
                <a href={finalLink!} target="_blank" className="bg-blue-600/10 text-blue-400 p-3.5 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg" title="פתח קבצים">
                    <LinkIcon className="w-5 h-5" />
                </a>
            );
        }

        return <span className="text-[13px] text-slate-600 font-black">אין קובץ</span>;
    };

    return (
        <>
            <tr 
                onClick={onToggle}
                className={`cursor-pointer transition-all duration-300 group ${isExpanded ? 'bg-blue-600/15' : 'hover:bg-white/5'}`}
            >
                <td className="p-6">
                    <div className="flex flex-col items-center">
                        <span className="text-base font-black text-slate-400">{fmtDate(order.created_at)}</span>
                        <span className="text-[11px] text-slate-600 font-bold mt-1">{fmtTime(order.created_at)}</span>
                    </div>
                </td>
                <td className="p-6 font-bold text-slate-200 text-right">
                    <div className="font-black text-blue-500 text-xs mb-1">#{order.order_number}</div>
                    <div className="text-lg font-black">{order.customer_name}</div>
                    <div className="flex gap-4 mt-4" onClick={e => e.stopPropagation()}>
                        <a href={`tel:${order.customer_phone}`} className="text-slate-500 hover:text-white p-2.5 bg-slate-800 rounded-xl transition-colors"><Phone className="w-4 h-4" /></a>
                        <a href={whatsappUrl} target="_blank" className="text-emerald-500 hover:text-white hover:bg-emerald-500 p-2.5 bg-emerald-500/10 rounded-xl transition-colors"><MessageSquare className="w-4 h-4" /></a>
                    </div>
                </td>
                <td className="p-6 text-center">
                    <div className="text-base font-black text-slate-200">{order.product_type}</div>
                    {order.size && <div className="text-xs text-blue-400 font-black mt-2 uppercase tracking-tighter">{order.size}</div>}
                </td>
                <td className="p-6 text-center font-black text-white italic text-xl opacity-90">×{order.quantity}</td>
                <td className="p-6 relative text-center" onClick={e => e.stopPropagation()}>
                    <div className={`px-6 py-3 rounded-full text-[13px] font-black border border-current flex items-center justify-center gap-2 mx-auto w-fit shadow-lg ${status?.bg} ${status?.color}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {status?.label.split(' ')[1]}
                    </div>
                    <select 
                        value={order.order_status} 
                        onChange={(e) => { setField(order.id, 'order_status', e.target.value); onSave(); }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    >
                        {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </td>
                <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                    <div className={`text-[13px] font-black ${payStatus.color} flex items-center justify-center gap-2`}>
                        {payStatus.label}
                    </div>
                </td>
                <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                        {renderFilesLink()}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-900/60 border-t border-slate-700/20">
                    <td colSpan={7} className="p-0">
                        <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12 animate-in slide-in-from-top-4 duration-500 text-right">
                            <div className="space-y-8 lg:border-l border-slate-800/50 pl-10">
                                <div>
                                    <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> הערות לקוח</h4>
                                    <div className="bg-slate-800/30 p-6 rounded-[1.5rem] text-sm leading-relaxed text-slate-200 italic border border-white/5 shadow-inner min-h-[100px]">
                                        {order.customer_notes || 'אין הערות נוספות.'}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><CreditCard className="w-4 h-4" /> עדכון תשלום</h4>
                                    <div className="relative group">
                                        <select 
                                            value={getFieldValue(order, 'payment_status') ?? 'pending'}
                                            onChange={(e) => { setField(order.id, 'payment_status', e.target.value); onSave(); }}
                                            className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-black outline-none appearance-none cursor-pointer transition-all ${PAYMENT_STATUSES.find(p => p.value === getFieldValue(order, 'payment_status'))?.color}`}
                                        >
                                            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none group-hover:text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 lg:border-l border-slate-800/50 pl-10">
                                <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><DollarSign className="w-4 h-4" /> ניהול מחירים</h4>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-slate-800/20 px-6 py-4 rounded-2xl border border-white/5">
                                        <span className="text-xs text-slate-400 font-bold">מחיר מקורי:</span>
                                        <span className="text-sm font-black text-slate-200 tabular-nums">{fmt(order.total_price)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] text-slate-500 font-black mr-2 uppercase tracking-wide">מחיר מיוחד ללקוח</label>
                                        <input 
                                            type="number" 
                                            value={getFieldValue(order, 'special_price') ?? ''} 
                                            onChange={(e) => setField(order.id, 'special_price', e.target.value === '' ? null : Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-lg text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp className="w-4 h-4" /> ניתוח רווחיות פרויקט</h4>
                                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-8 shadow-2xl">
                                    <div className="space-y-3">
                                        <label className="text-[12px] text-slate-500 font-black mr-2 uppercase tracking-wide flex items-center gap-2">
                                            עלות חומרים ליחידה 
                                            {order.material_cost_override == null && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[10px] border border-blue-500/20 font-black tracking-widest uppercase">Auto</span>}
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={getFieldValue(order, 'material_cost_override') ?? profitData.costUnit} 
                                                onChange={(e) => setField(order.id, 'material_cost_override', e.target.value === '' ? null : Number(e.target.value))}
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-base font-mono outline-none text-slate-300"
                                            />
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-black">₪</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mr-2 font-bold italic">סה"כ עלות חומרים: {fmt(profitData.totalCost)}</div>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-slate-800 pt-8">
                                        <div>
                                            <div className="text-[12px] text-slate-500 font-black mb-2 uppercase tracking-wider">רווח נקי סופי:</div>
                                            <div className={`text-4xl font-black tabular-nums transition-colors duration-500 [text-shadow:0_0_20px_white/10] ${profitData.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {fmt(profitData.profit)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[12px] text-slate-500 font-black mb-2 uppercase tracking-wider">מחיר ללקוח:</div>
                                            <div className="text-2xl font-black text-white tabular-nums">{fmt(profitData.finalRevenue)}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onSave}
                                        disabled={isSaving}
                                        className="w-full group/save flex items-center justify-center gap-3 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95"
                                    >
                                        <Save className="w-6 h-6 group-hover/save:scale-110 transition-transform" />
                                        {isSaving ? 'מעדכן נתונים...' : 'שמור שינויים'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default AdminDashboardPage;
