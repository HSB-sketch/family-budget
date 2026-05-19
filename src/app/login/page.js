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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem' }}>
      <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
        <h1 style={{ fontSize: '26px', fontWeight: '600', margin: '0 0 6px', color: '#1a1a1a' }}>Family Budget</h1>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 1.5rem' }}>Sign in to continue</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoFocus
            style={{ padding: '12px 16px', fontSize: '16px', borderRadius: '10px', border: '1.5px solid #e0e0e0', outline: 'none' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ padding: '12px 16px', fontSize: '16px', borderRadius: '10px', border: '1.5px solid #e0e0e0', outline: 'none', textAlign: 'center' }}
          />
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: '0' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 16px', fontSize: '16px', fontWeight: '600', borderRadius: '10px', border: 'none', background: '#667eea', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
