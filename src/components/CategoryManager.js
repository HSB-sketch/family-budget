'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const ICON_OPTIONS = ['🛒','🍽️','⛽','👕','💆','🎮','🏠','🚗','💊','📦','✈️','🎬','📚','🏋️','🐾','🎁','💡','📱','🍕','☕','🎵','⚽','🏖️','💰','🧾'];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} style={iconBtn} title="Pick icon">{value}</button>
      {open && (
        <div style={iconPicker}>
          {ICON_OPTIONS.map((em) => (
            <button key={em} onClick={() => { onChange(em); setOpen(false); }} style={iconPickerBtn}>{em}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon || '📦');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await supabase.from('categories').update({ name: trimmed, icon }).eq('id', cat.id);
    setSaving(false);
    setEditing(false);
    onChanged();
  };

  const cancel = () => {
    setName(cat.name);
    setIcon(cat.icon || '📦');
    setEditing(false);
  };

  const del = async () => {
    if (!window.confirm(`Delete "${cat.name}"? Expenses using this category will lose their tag.`)) return;
    setDeleting(true);
    await supabase.from('categories').delete().eq('id', cat.id);
    onChanged();
  };

  if (editing) {
    return (
      <div style={{ ...catRow, flexWrap: 'wrap', gap: 8, background: '#f0f9ff', border: '1.5px solid #7dd3fc' }}>
        <IconPicker value={icon} onChange={setIcon} />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          style={{ ...textInput, flex: 1, minWidth: 120 }}
          autoFocus
          maxLength={40}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={save} disabled={saving || !name.trim()} style={saveBtn}>
            {saving ? '…' : '✓ Save'}
          </button>
          <button onClick={cancel} style={cancelBtn}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={catRow}>
      <span style={{ fontSize: 22, minWidth: 30, textAlign: 'center' }}>{cat.icon}</span>
      <span style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500 }}>{cat.name}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setEditing(true)} style={editBtn} title="Edit">✏️</button>
        <button onClick={del} disabled={deleting} style={deleteBtn} title="Delete">
          {deleting ? '…' : '🗑️'}
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager({ categories, onChanged }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with that name already exists.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('categories').insert({ name: trimmed, icon });
    if (err) {
      setError('Could not add category. Check the admin RLS policy is enabled in Supabase.');
    } else {
      setName('');
      setIcon('📦');
      onChanged();
    }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Manage Categories</h2>
        <p style={{ fontSize: 13, color: '#64748b' }}>Add, rename, change icons, or remove categories.</p>
      </div>

      {/* Add new */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>➕ Add New Category</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <IconPicker value={icon} onChange={setIcon} />
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Category name…"
            style={textInput}
            maxLength={40}
          />
          <button onClick={addCategory} disabled={saving || !name.trim()} style={addBtn}>
            {saving ? '…' : '+ Add'}
          </button>
        </div>
        {error && <div style={errorBox}>{error}</div>}
      </div>

      {/* Existing categories */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: -8 }}>
        {categories.length} categories — tap ✏️ to edit
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map((cat) => (
          <CategoryRow key={cat.id} cat={cat} onChanged={onChanged} />
        ))}
      </div>

      <div style={tipBox}>
        💡 <strong>Tip:</strong> Renaming a category updates it everywhere — all existing expenses update automatically.
      </div>
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' };
const iconBtn = { width: 44, height: 44, fontSize: 22, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const iconPicker = { position: 'absolute', top: 48, left: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' };
const iconPickerBtn = { width: 36, height: 36, fontSize: 20, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' };
const textInput = { flex: 1, minWidth: 160, padding: '10px 12px', fontSize: 14, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none' };
const addBtn = { padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const saveBtn = { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const cancelBtn = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const catRow = { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const editBtn = { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', opacity: 0.6, padding: '2px 4px' };
const deleteBtn = { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', opacity: 0.6, padding: '2px 4px' };
const errorBox = { marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' };
const tipBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#166534' };
