'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AddExpenseForm({ categories, userId, onAdded }) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    setStatus('');
    const { error } = await supabase.from('expenses').insert({
      user_id: userId,
      category_id: parseInt(categoryId),
      amount: parseFloat(amount),
      note: note.trim() || null,
      date,
    });
    if (error) {
      setStatus('error');
    } else {
      setStatus('saved');
      setCategoryId('');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      onAdded();
      setTimeout(() => setStatus(''), 2500);
    }
    setSaving(false);
  };

  const canSubmit = !saving && categoryId && amount && parseFloat(amount) > 0;
  const selectedCat = categories.find((c) => c.id === parseInt(categoryId));

  return (
    <div>
      <SectionHeader title="Add Expense" sub="Record a new expense for this month" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Amount hero */}
        <div style={s.amountCard}>
          <div style={s.amountCardImg} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <label style={s.amountLabel}>AMOUNT</label>
            <div style={s.amountRow}>
              <span style={s.dollar}>$</span>
              <input
                type="number" step="0.01" min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                style={s.amountInput}
              />
            </div>
          </div>
        </div>

        {/* Category grid */}
        <div>
          <label style={s.label}>CATEGORY</label>
          <div style={s.catGrid}>
            {categories.map((c) => (
              <button
                key={c.id} type="button"
                onClick={() => setCategoryId(String(c.id))}
                style={{ ...s.catBtn, ...(categoryId === String(c.id) ? s.catBtnActive : {}) }}
              >
                <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{c.icon}</span>
                <span style={{ fontSize: 10, lineHeight: 1.2 }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date + Note */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={s.label}>DATE</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={s.input} />
          </div>
          <div>
            <label style={s.label}>NOTE (OPTIONAL)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" style={s.input} />
          </div>
        </div>

        <button type="submit" disabled={!canSubmit} style={{ ...s.btn, ...(canSubmit ? {} : s.btnDisabled) }}>
          {saving ? 'Saving…' : status === 'saved' ? '✓ Saved!' : `Add ${selectedCat ? selectedCat.icon + ' ' + selectedCat.name : 'Expense'}`}
        </button>

        {status === 'error' && (
          <div style={s.errorBox}>Failed to save. Please try again.</div>
        )}
      </form>
    </div>
  );
}

export function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748b' }}>{sub}</p>}
    </div>
  );
}

const s = {
  amountCard: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 50%, #14b8a6 100%)',
    borderRadius: 18, padding: '1.6rem',
    boxShadow: '0 12px 40px rgba(14,165,233,0.3)',
  },
  amountCardImg: {
    position: 'absolute', inset: 0,
    backgroundImage: 'url(https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=60)',
    backgroundSize: 'cover', backgroundPosition: 'center bottom',
    opacity: 0.18,
  },
  amountLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', display: 'block', marginBottom: 8 },
  amountRow: { display: 'flex', alignItems: 'center', gap: 6 },
  dollar: { fontSize: 32, fontWeight: 300, color: 'rgba(255,255,255,0.8)' },
  amountInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 48, fontWeight: 800, color: '#fff', width: '100%' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 },
  catBtn: {
    padding: '10px 4px', borderRadius: 12, border: '1.5px solid #e2e8f0',
    background: '#fff', color: '#64748b', cursor: 'pointer',
    textAlign: 'center', fontSize: 11, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'all 0.15s',
  },
  catBtnActive: {
    border: '1.5px solid #0ea5e9',
    background: '#f0f9ff', color: '#0369a1',
    boxShadow: '0 0 0 3px rgba(14,165,233,0.15)',
  },
  input: {
    width: '100%', padding: '11px 14px', fontSize: 14,
    borderRadius: 10, border: '1.5px solid #e2e8f0',
    background: '#fff', color: '#0f172a', outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    padding: '14px', fontSize: 15, fontWeight: 600, borderRadius: 12, border: 'none',
    cursor: 'pointer', background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
    color: '#fff', boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
  },
  btnDisabled: { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none', cursor: 'not-allowed' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'center' },
};
