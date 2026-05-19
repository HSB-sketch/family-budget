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
      <div style={s.pageTitle}>
        <h2 style={s.h2}>Add Expense</h2>
        <p style={s.hint}>Record a new family expense</p>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        {/* Amount — hero field */}
        <div style={s.amountCard}>
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

        {/* Category grid */}
        <div>
          <label style={s.label}>CATEGORY</label>
          <div style={s.catGrid}>
            {categories.map((c) => (
              <button
                key={c.id} type="button"
                onClick={() => setCategoryId(String(c.id))}
                style={{
                  ...s.catBtn,
                  ...(categoryId === String(c.id) ? s.catBtnActive : {}),
                }}
              >
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{c.icon}</span>
                <span style={{ fontSize: 11 }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date + Note row */}
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
          <span style={s.btnShine} />
          {saving ? 'Saving…' : status === 'saved' ? '✓ Saved!' : `Add ${selectedCat ? selectedCat.icon + ' ' + selectedCat.name : 'Expense'}`}
        </button>

        {status === 'error' && (
          <div style={s.errorBox}>Failed to save. Try again.</div>
        )}
      </form>
    </div>
  );
}

const s = {
  pageTitle: { marginBottom: '1.5rem' },
  h2: { fontSize: 22, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 },
  hint: { fontSize: 13, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  amountCard: {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 16, padding: '1.5rem',
  },
  amountLabel: { fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', display: 'block', marginBottom: 8 },
  amountRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dollar: { fontSize: 32, fontWeight: 300, color: '#818cf8' },
  amountInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontSize: 48, fontWeight: 700, color: '#f0f0f8', width: '100%',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', marginBottom: 8 },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 },
  catBtn: {
    padding: '10px 4px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)', color: '#9ca3af', cursor: 'pointer',
    textAlign: 'center', transition: 'all 0.15s', fontSize: 11,
  },
  catBtnActive: {
    border: '1px solid rgba(99,102,241,0.6)',
    background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
    boxShadow: '0 0 14px rgba(99,102,241,0.2)',
  },
  input: {
    width: '100%', padding: '11px 14px', fontSize: 14,
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)', color: '#f0f0f8',
    outline: 'none',
  },
  btn: {
    position: 'relative', overflow: 'hidden',
    padding: '14px', fontSize: 15, fontWeight: 600,
    borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', boxShadow: '0 0 30px rgba(99,102,241,0.3)',
  },
  btnDisabled: { background: 'rgba(255,255,255,0.08)', color: '#4b5563', boxShadow: 'none', cursor: 'not-allowed' },
  btnShine: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)', pointerEvents: 'none' },
  errorBox: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'center' },
};
