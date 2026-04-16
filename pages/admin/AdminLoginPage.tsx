import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        if (res.ok) {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      } catch {
        // not logged in
      } finally {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const data = await res.json();
        setError(data.error || 'קוד PIN שגוי');
        setPin('');
      }
    } catch {
      setError('שגיאת תקשורת, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (val: string) => {
    if (/^\d{0,8}$/.test(val)) setPin(val);
  };

  if (checking) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.fullPage}>
      {/* Animated background */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🔐</div>
          <h1 style={styles.title}>ממשק ניהול</h1>
          <p style={styles.subtitle}>ישראלי - הדפסות ורגעים</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>קוד PIN</label>
          <div style={styles.pinWrapper}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.pinDot,
                  ...(i < pin.length ? styles.pinDotFilled : {}),
                  ...(error ? styles.pinDotError : {}),
                }}
              />
            ))}
          </div>

          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="הזן קוד PIN"
            value={pin}
            onChange={(e) => handlePinInput(e.target.value)}
            style={styles.input}
            autoFocus
            autoComplete="current-password"
          />

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            style={{
              ...styles.submitBtn,
              ...(loading || pin.length < 4 ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.loadingText}>מאמת...</span>
            ) : (
              <>
                <span>כניסה לניהול</span>
                <span style={{ fontSize: 18 }}>←</span>
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="/#" style={styles.backLink}>← חזרה לחנות</a>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  fullPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #061229 100%)',
    overflow: 'hidden',
    position: 'relative',
    direction: 'rtl',
  },
  bgGlow1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
    top: -100,
    left: -100,
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
    bottom: -80,
    right: -80,
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(99,130,255,0.18)',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    position: 'relative',
    zIndex: 10,
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 12,
    display: 'block',
    filter: 'drop-shadow(0 0 20px rgba(99,130,255,0.6))',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#e2e8f0',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    letterSpacing: 0.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pinWrapper: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    margin: '4px 0',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #334155',
    background: 'transparent',
    transition: 'all 0.2s ease',
  },
  pinDotFilled: {
    background: '#3b82f6',
    borderColor: '#3b82f6',
    boxShadow: '0 0 10px rgba(59,130,246,0.6)',
  },
  pinDotError: {
    borderColor: '#ef4444',
  },
  input: {
    background: 'rgba(30,41,59,0.8)',
    border: '1.5px solid #334155',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 18,
    letterSpacing: 6,
    padding: '14px 20px',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'monospace',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    color: '#fca5a5',
    fontSize: 14,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    gap: 10,
    marginTop: 8,
    padding: '15px 28px',
    transition: 'all 0.25s ease',
    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
  },
  submitBtnDisabled: {
    background: 'rgba(51,65,85,0.6)',
    boxShadow: 'none',
    cursor: 'not-allowed',
    color: '#64748b',
  },
  loadingText: {
    animation: 'pulse 1s infinite',
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
  },
  backLink: {
    color: '#475569',
    fontSize: 13,
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(59,130,246,0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default AdminLoginPage;
