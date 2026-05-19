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
    return <p style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>No expenses yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {expenses.map((exp) => {
        const canEdit = isAdmin || exp.user_id === userId;
        if (editingId === exp.id) {
          return (
            <div key={exp.id} style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inlineInput}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ ...inlineInput, flex: 1 }} />
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ ...inlineInput, flex: 1 }} />
                </div>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" style={inlineInput} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveEdit(exp.id)} style={saveBtnStyle}>Save</button>
                  <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Cancel</button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key={exp.id} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '20px' }}>{catIcon(exp.category_id)}</span>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#333' }}>{catName(exp.category_id)}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>
                  {exp.profiles?.name || 'Unknown'} · {exp.date}{exp.note ? ` · ${exp.note}` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>${parseFloat(exp.amount).toFixed(2)}</span>
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

const cardStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '2px' };
const inlineInput = { padding: '8px 10px', fontSize: '14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none', width: '100%', boxSizing: 'border-box' };
const saveBtnStyle = { flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#667eea', color: '#fff', fontWeight: '600', cursor: 'pointer' };
const cancelBtnStyle = { flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #e0e0e0', background: '#fff', color: '#666', cursor: 'pointer' };
