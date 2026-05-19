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
      setStatus('Failed to save. Try again.');
    } else {
      setStatus('Saved!');
      setCategoryId('');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      onAdded();
      setTimeout(() => setStatus(''), 2000);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required style={inputStyle}>
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Amount ($)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          style={{ ...inputStyle, fontSize: '22px', fontWeight: '600' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Note (optional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" style={inputStyle} />
      </div>

      <button
        type="submit"
        disabled={saving || !categoryId || !amount}
        style={{
          padding: '14px 16px', fontSize: '16px', fontWeight: '600', borderRadius: '12px', border: 'none',
          background: saving || !categoryId || !amount ? '#e0e0e0' : '#10b981',
          color: saving || !categoryId || !amount ? '#999' : '#fff',
          cursor: saving || !categoryId || !amount ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving...' : '✓ Add Expense'}
      </button>

      {status && <p style={{ textAlign: 'center', color: status === 'Saved!' ? '#10b981' : '#e53e3e', fontSize: '14px' }}>{status}</p>}
    </form>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '10px', border: '1.5px solid #e0e0e0', outline: 'none', boxSizing: 'border-box', background: '#fff' };
