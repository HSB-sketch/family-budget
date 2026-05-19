'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Rotating beach quotes
const QUOTES = [
  'Life is better at the beach 🌊',
  'Sun, sand & smart spending ☀️',
  'Save today, travel tomorrow ✈️',
  'Budget now, beach later 🏖️',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const quote = QUOTES[new Date().getMinutes() % QUOTES.length];

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
    <div style={s.page}>
      {/* Left panel — beach hero */}
      <div style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>🌴 Family Budget</div>
          <h2 style={s.heroTitle}>Plan today.<br />Play tomorrow.</h2>
          <p style={s.heroSub}>{quote}</p>
        </div>
        {/* Photo credit strip */}
        <div style={s.photoCredit}>Photo: Unsplash</div>
      </div>

      {/* Right panel — login form */}
      <div style={s.formPanel}>
        <div style={s.formInner}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>🌊</div>
          </div>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.sub}>Sign in to your family budget</p>

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required autoFocus style={s.input}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required style={s.input}
              />
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Family Budget · Powered by Supabase & Vercel
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh' },
  hero: {
    flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    // mobile: hide hero
    '@media (max-width: 640px)': { display: 'none' },
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(2,48,71,0.2) 0%, rgba(2,48,71,0.7) 100%)',
  },
  heroContent: { position: 'relative', zIndex: 1, padding: '2.5rem' },
  heroBadge: {
    display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
    padding: '6px 14px', fontSize: 13, color: '#fff', marginBottom: '1rem',
  },
  heroTitle: { fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem' },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  photoCredit: { position: 'relative', zIndex: 1, padding: '0.75rem 2.5rem', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  formPanel: {
    width: '100%', maxWidth: 460, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#ffffff', padding: '2rem',
  },
  formInner: { width: '100%', maxWidth: 360 },
  logoWrap: { marginBottom: '1.5rem' },
  logoIcon: {
    width: 52, height: 52, background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
  },
  title: { fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '12px 16px', fontSize: 15, borderRadius: 10,
    border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a',
    outline: 'none',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 14,
  },
  btn: {
    padding: '13px 16px', fontSize: 15, fontWeight: 600,
    borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
    color: '#fff', cursor: 'pointer', marginTop: 4,
    boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
  },
};
