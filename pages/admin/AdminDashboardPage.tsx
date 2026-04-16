import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCostPrice, calculateProfit, calculateProfitMargin } from '../../lib/pricing';

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
}

const PAYMENT_STATUSES = [
  { value: 'pending',  label: '⏳ ממתין לתשלום', color: '#f59e0b' },
  { value: 'paid',     label: '✅ שולם',          color: '#10b981' },
  { value: 'partial',  label: '🔄 שולם חלקית',    color: '#3b82f6' },
  { value: 'refunded', label: '↩️ הוחזר',          color: '#ef4444' },
];

const ORDER_STATUSES = [
  { value: 'new',        label: '🆕 חדשה',       color: '#6366f1' },
  { value: 'processing', label: '⚙️ בעיבוד',     color: '#f59e0b' },
  { value: 'ready',      label: '🎉 מוכנה',       color: '#10b981' },
  { value: 'delivered',  label: '📦 נמסרה',       color: '#64748b' },
  { value: 'cancelled',  label: '❌ בוטלה',       color: '#ef4444' },
];

const getStatusColor = (arr: typeof PAYMENT_STATUSES, val: string | null) =>
  arr.find((s) => s.value === val)?.color ?? '#64748b';

const fmt = (n: number) => `₪${n.toFixed(2)}`;
const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<Record<number, Partial<Order>>>({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Auth check + data fetch
  const fetchOrders = useCallback(async () => {
    try {
      const authRes = await fetch('/api/admin/me', { credentials: 'include' });
      if (!authRes.ok) {
        navigate('/admin/login', { replace: true });
        return;
      }

      const res = await fetch('/api/admin/orders', { credentials: 'include' });
      if (!res.ok) {
        setError('שגיאה בטעינת ההזמנות');
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setError('שגיאת תקשורת');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  };

  // Field change (local state only — saved on blur/change for dropdowns)
  const setField = (orderId: number, field: keyof Order, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value },
    }));
  };

  const getFieldValue = <K extends keyof Order>(order: Order, field: K): Order[K] => {
    const edit = editState[order.id];
    if (edit && field in edit) return edit[field] as Order[K];
    return order[field];
  };

  const saveOrder = async (orderId: number, fields: Partial<Order>) => {
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
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
        );
        setEditState((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      }
    } catch {
      // silent fail – keep edit state
    } finally {
      setSavingId(null);
    }
  };

  // Immediately save dropdown changes
  const handleDropdownChange = (
    orderId: number,
    field: 'payment_status' | 'order_status',
    value: string
  ) => {
    setField(orderId, field, value);
    saveOrder(orderId, { [field]: value });
  };

  // Save numeric inputs on blur
  const handleNumericBlur = (
    orderId: number,
    field: 'discount' | 'material_cost_override'
  ) => {
    const val = editState[orderId]?.[field];
    if (val !== undefined) {
      saveOrder(orderId, { [field]: val });
    }
  };

  // Computed profit for a row
  const getProfit = (order: Order) => {
    const total = Number(order.total_price) || 0;
    const qty = Number(order.quantity) || 1;
    const discount = Number(getFieldValue(order, 'discount')) || 0;
    const override = getFieldValue(order, 'material_cost_override');
    const costUnit = override != null ? Number(override) : getCostPrice(order.product_type, order.size);
    return calculateProfit(total, qty, costUnit, discount);
  };

  // Filtered orders
  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.order_status === filterStatus || o.payment_status === filterStatus;
    const matchSearch =
      !searchTerm ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_phone.includes(searchTerm) ||
      o.order_number.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // Summary stats
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price), 0);
  const totalProfit = orders.reduce((s, o) => s + getProfit(o), 0);
  const pendingPayment = orders.filter((o) => !o.payment_status || o.payment_status === 'pending').length;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b', marginTop: 16 }}>טוען הזמנות...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>📊 לוח ניהול הזמנות</h1>
          <p style={styles.pageSubtitle}>ישראלי — הדפסות ורגעים</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => { setLoading(true); fetchOrders(); }} style={styles.refreshBtn}>
            🔄 רענן
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            יציאה ↗
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>₪{totalRevenue.toFixed(0)}</div>
          <div style={styles.statLabel}>סה"כ הכנסות</div>
        </div>
        <div style={{ ...styles.statCard, borderColor: 'rgba(16,185,129,0.3)' }}>
          <div style={{ ...styles.statValue, color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
            ₪{totalProfit.toFixed(0)}
          </div>
          <div style={styles.statLabel}>רווח גולמי</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{orders.length}</div>
          <div style={styles.statLabel}>סה"כ הזמנות</div>
        </div>
        <div style={{ ...styles.statCard, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ ...styles.statValue, color: '#f59e0b' }}>{pendingPayment}</div>
          <div style={styles.statLabel}>ממתינות לתשלום</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <input
          type="text"
          placeholder="🔍 חיפוש לפי שם / טלפון / מס' הזמנה"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">כל הסטטוסים</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
          {PAYMENT_STATUSES.map((s) => (
            <option key={`pay-${s.value}`} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>הזמנה</th>
              <th style={styles.th}>לקוח</th>
              <th style={styles.th}>מוצר</th>
              <th style={styles.th}>העלאה</th>
              <th style={styles.th}>תשלום</th>
              <th style={styles.th}>סטטוס</th>
              <th style={styles.th}>מחיר</th>
              <th style={styles.th}>עלות יח'</th>
              <th style={styles.th}>הנחה</th>
              <th style={{ ...styles.th, color: '#10b981' }}>רווח 💰</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={styles.emptyRow}>
                  לא נמצאו הזמנות
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const profit = getProfit(order);
                const margin = calculateProfitMargin(profit, Number(order.total_price));
                const isSaving = savingId === order.id;
                const costUnit =
                  getFieldValue(order, 'material_cost_override') != null
                    ? Number(getFieldValue(order, 'material_cost_override'))
                    : getCostPrice(order.product_type, order.size);

                return (
                  <tr
                    key={order.id}
                    style={{
                      ...styles.tr,
                      ...(isSaving ? styles.trSaving : {}),
                    }}
                  >
                    {/* Order # + Date */}
                    <td style={styles.td}>
                      <div style={styles.orderNum}>#{order.order_number}</div>
                      <div style={styles.dateText}>{fmtDate(order.created_at)}</div>
                    </td>

                    {/* Customer */}
                    <td style={styles.td}>
                      <div style={styles.customerName}>{order.customer_name}</div>
                      <a href={`tel:${order.customer_phone}`} style={styles.phone}>
                        📞 {order.customer_phone}
                      </a>
                    </td>

                    {/* Product */}
                    <td style={styles.td}>
                      <div style={styles.productType}>{order.product_type}</div>
                      {order.size && <div style={styles.sizeTag}>{order.size}</div>}
                      <div style={styles.qty}>×{order.quantity}</div>
                    </td>

                    {/* Upload */}
                    <td style={styles.td}>
                      {order.upload_method && (
                        <div style={styles.uploadMethod}>{order.upload_method}</div>
                      )}
                      {(order.upload_link || order.drive_folder_url) && (
                        <a
                          href={order.upload_link || order.drive_folder_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.folderLink}
                        >
                          📂 פתח תיקייה
                        </a>
                      )}
                    </td>

                    {/* Payment status */}
                    <td style={styles.td}>
                      <select
                        value={getFieldValue(order, 'payment_status') ?? 'pending'}
                        onChange={(e) =>
                          handleDropdownChange(order.id, 'payment_status', e.target.value)
                        }
                        style={{
                          ...styles.statusSelect,
                          borderColor: getStatusColor(PAYMENT_STATUSES, getFieldValue(order, 'payment_status') as string),
                          color: getStatusColor(PAYMENT_STATUSES, getFieldValue(order, 'payment_status') as string),
                        }}
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Order status */}
                    <td style={styles.td}>
                      <select
                        value={getFieldValue(order, 'order_status') ?? 'new'}
                        onChange={(e) =>
                          handleDropdownChange(order.id, 'order_status', e.target.value)
                        }
                        style={{
                          ...styles.statusSelect,
                          borderColor: getStatusColor(ORDER_STATUSES, getFieldValue(order, 'order_status') as string),
                          color: getStatusColor(ORDER_STATUSES, getFieldValue(order, 'order_status') as string),
                        }}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Total Price */}
                    <td style={styles.td}>
                      <div style={styles.priceValue}>{fmt(Number(order.total_price))}</div>
                    </td>

                    {/* Material cost per unit */}
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          getFieldValue(order, 'material_cost_override') != null
                            ? getFieldValue(order, 'material_cost_override') as number
                            : costUnit
                        }
                        onChange={(e) =>
                          setField(order.id, 'material_cost_override', e.target.value === '' ? null : Number(e.target.value))
                        }
                        onBlur={() => handleNumericBlur(order.id, 'material_cost_override')}
                        style={styles.numericInput}
                        title={`עלות אוטומטית: ₪${getCostPrice(order.product_type, order.size).toFixed(3)}`}
                      />
                      {getFieldValue(order, 'material_cost_override') != null && (
                        <button
                          onClick={() => {
                            setField(order.id, 'material_cost_override', null);
                            saveOrder(order.id, { material_cost_override: null });
                          }}
                          style={styles.resetBtn}
                          title="אפס לברירת מחדל"
                        >
                          ↺
                        </button>
                      )}
                    </td>

                    {/* Discount */}
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={getFieldValue(order, 'discount') ?? 0}
                        onChange={(e) =>
                          setField(order.id, 'discount', Number(e.target.value))
                        }
                        onBlur={() => handleNumericBlur(order.id, 'discount')}
                        style={styles.numericInput}
                        placeholder="₪"
                      />
                    </td>

                    {/* Profit */}
                    <td style={styles.td}>
                      <div
                        style={{
                          ...styles.profitValue,
                          color: profit >= 0 ? '#10b981' : '#ef4444',
                          background: profit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          borderColor: profit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                        }}
                      >
                        {fmt(profit)}
                        <span style={styles.marginPercent}>{margin.toFixed(0)}%</span>
                      </div>
                      {isSaving && <div style={styles.savingDot}>💾</div>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.tableFooter}>
        מציג {filtered.length} מתוך {orders.length} הזמנות
      </div>
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b3e 100%)',
    direction: 'rtl',
    padding: '28px 24px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0f1e',
    direction: 'rtl',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(59,130,246,0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
    margin: '0 0 4px 0',
    background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  pageSubtitle: {
    color: '#475569',
    fontSize: 13,
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  refreshBtn: {
    background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 8,
    color: '#93c5fd',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 18px',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 8,
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 18px',
    transition: 'all 0.2s',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(51,65,85,0.6)',
    borderRadius: 16,
    padding: '20px 24px',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  filtersRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  searchInput: {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid #334155',
    borderRadius: 10,
    color: '#e2e8f0',
    flex: 1,
    fontSize: 14,
    minWidth: 220,
    outline: 'none',
    padding: '10px 16px',
  },
  filterSelect: {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid #334155',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 14,
    outline: 'none',
    padding: '10px 16px',
  },
  errorBanner: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    color: '#fca5a5',
    marginBottom: 16,
    padding: '12px 16px',
  },
  tableWrapper: {
    borderRadius: 16,
    border: '1px solid rgba(51,65,85,0.5)',
    overflowX: 'auto',
    background: 'rgba(10,15,30,0.6)',
    backdropFilter: 'blur(10px)',
  },
  table: {
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: 1100,
    width: '100%',
  },
  th: {
    background: 'rgba(15,23,42,0.9)',
    borderBottom: '1px solid rgba(51,65,85,0.6)',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    padding: '14px 16px',
    textAlign: 'right',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(30,41,59,0.8)',
    transition: 'background 0.15s',
  },
  trSaving: {
    opacity: 0.7,
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  emptyRow: {
    color: '#475569',
    fontSize: 16,
    padding: '60px',
    textAlign: 'center',
  },
  orderNum: {
    color: '#93c5fd',
    fontWeight: 700,
    fontSize: 14,
  },
  dateText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  customerName: {
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 13,
  },
  phone: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    display: 'block',
    textDecoration: 'none',
  },
  productType: {
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 13,
  },
  sizeTag: {
    background: 'rgba(99,130,255,0.15)',
    border: '1px solid rgba(99,130,255,0.3)',
    borderRadius: 6,
    color: '#a5b4fc',
    display: 'inline-block',
    fontSize: 11,
    marginTop: 3,
    padding: '1px 7px',
  },
  qty: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  uploadMethod: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  folderLink: {
    background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 6,
    color: '#93c5fd',
    display: 'inline-block',
    fontSize: 11,
    padding: '3px 8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  statusSelect: {
    background: 'rgba(10,15,30,0.8)',
    borderRadius: 8,
    border: '1.5px solid',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    outline: 'none',
    padding: '6px 10px',
    width: '100%',
    minWidth: 140,
  },
  priceValue: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: 14,
  },
  numericInput: {
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid #334155',
    borderRadius: 7,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    padding: '5px 8px',
    width: 72,
    textAlign: 'center',
  },
  resetBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 14,
    marginRight: 4,
    padding: '2px 4px',
  },
  profitValue: {
    alignItems: 'center',
    border: '1px solid',
    borderRadius: 8,
    display: 'inline-flex',
    fontSize: 13,
    fontWeight: 700,
    gap: 6,
    padding: '4px 10px',
  },
  marginPercent: {
    fontSize: 10,
    opacity: 0.7,
  },
  savingDot: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  tableFooter: {
    color: '#475569',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
};

export default AdminDashboardPage;
