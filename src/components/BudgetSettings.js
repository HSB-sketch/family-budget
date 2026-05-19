'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BudgetSettings({ categories, budgets, month, year, onChanged }) {
  const [saving, setSaving] = useState({});
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const getBudget = (catId) => {
    return budgets.find((b) => b.category_id === catId && b.month === month && b.year === year)?.amount || '';
  };

  const [values, setValues] = useState(() =>
    Object.fromEntries(categories.map((c) => [c.id, getBudget(c.id)]))
  );

  const saveBudget = async (catId) => {
    const amount = parseFloat(values[catId]);
    if (isNaN(amount) || amount < 0) return;
    setSaving((s) => ({ ...s, [catId]: true }));
    await supabase.from('budgets').upsert({ category_id: catId, month, year, amount }, { onConflict: 'category_id,month,year' });
    setSaving((s) => ({ ...s, [catId]: false }));
    onChanged();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#eef0ff', border: '1.5px solid #667eea', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#444' }}>
        Setting monthly budgets for <strong>{months[month - 1]} {year}</strong>. Switch months in the Summary tab to set other months.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
            <span style={{ fontSize: '20px', width: '24px' }}>{cat.icon}</span>
            <span style={{ flex: 1, fontSize: '14px', color: '#333' }}>{cat.name}</span>
            <input
              type="number"
              min="0"
              step="10"
              value={values[cat.id]}
              onChange={(e) => setValues((v) => ({ ...v, [cat.id]: e.target.value }))}
              placeholder="0"
              style={{ width: '90px', padding: '8px 10px', fontSize: '14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none', textAlign: 'right' }}
            />
            <button
              onClick={() => saveBudget(cat.id)}
              disabled={saving[cat.id]}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#667eea', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: saving[cat.id] ? 0.6 : 1 }}
            >
              {saving[cat.id] ? '...' : 'Set'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
