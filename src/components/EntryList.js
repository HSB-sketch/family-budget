'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EntryList({ expenses, categories, userId, isAdmin, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');

  const catName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const catIcon = (id) => categories.find((c) => c.id === id)?.icon || '💰';

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount);
    setEditNote(exp.note || '');
    setEditCategory(exp.category_id);
    setEditDate(exp.date);
  };

  const saveEdit = async (id) => {
    await supabase.from('expenses').update({
      amount: parseFloat(editAmount),
      note: editNote.trim() || null,
      category_id: parseInt(editCategory),
      date: editDate,
    }).eq('id', id);
    setEditingId(null);
    onChanged();
  };

  const deleteExpense = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    onChanged();
  };

  if (!expenses.length) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#94a3b8', fontSize: 14 }}>
        🏖️ No entries yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {expenses.map((exp) => {
        const canEdit = isAdmin || exp.user_id === userId;

        if (editingId === exp.id) {
          return (
            <div key={exp.id} style={editCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inlineInput}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ ...inlineInput, flex: 1 }} placeholder="Amount" />
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ ...inlineInput, flex: 1 }} />
                </div>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note (optional)" style={inlineInput} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(exp.id)} style={saveBtnStyle}>✓ Save</button>
                  <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Cancel</button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={exp.id} style={card}>
            <span style={{ fontSize: 20, minWidth: 26, textAlign: 'center' }}>{catIcon(exp.category_id)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {catName(exp.category_id)}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                {exp.profiles?.name || 'Unknown'} · {exp.date}{exp.note ? ` · ${exp.note}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0369a1' }}>${parseFloat(exp.amount).toFixed(2)}</span>
              {canEdit && (
                <>
                  <button onClick={() => startEdit(exp)} style={iconBtn} title="Edit">✏️</button>
                  <button onClick={() => deleteExpense(exp.id)} style={iconBtn} title="Delete">🗑️</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const card = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' };
const editCard = { padding: '12px 14px', background: '#f0f9ff', borderRadius: 12, border: '1.5px solid #bae6fd' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '3px', opacity: 0.55 };
const inlineInput = { padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' };
const saveBtnStyle = { flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const cancelBtnStyle = { flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 };
