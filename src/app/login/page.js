'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Wrong email or password.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div style={styles.page}>
      {/* Glow blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <span style={{ fontSize: 32 }}>💰</span>
        </div>
        <h1 style={styles.title}>Family Budget</h1>
        <p style={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={styles.input}
            />
          </div>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            <span style={styles.btnGlow} />
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#07080f',
    position: 'relative', overflow: 'hidden', padding: '1rem',
  },
  blob1: {
    position: 'absolute', top: '-20%', left: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-20%', right: '-10%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24, padding: '2.5rem 2rem',
    maxWidth: 380, width: '100%', textAlign: 'center',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
  },
  iconWrap: {
    width: 64, height: 64, margin: '0 auto 1rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(99,102,241,0.4)',
  },
  title: { fontSize: 26, fontWeight: 700, color: '#f0f0f8', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '12px 16px', fontSize: 15, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#f0f0f8',
    outline: 'none', transition: 'border-color 0.2s',
  },
  error: {
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 14,
  },
  btn: {
    position: 'relative', overflow: 'hidden',
    padding: '13px 16px', fontSize: 15, fontWeight: 600,
    borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', marginTop: 4,
    boxShadow: '0 0 30px rgba(99,102,241,0.35)',
  },
  btnGlow: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)',
    pointerEvents: 'none',
  },
};
