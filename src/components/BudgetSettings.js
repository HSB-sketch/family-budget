'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BudgetSettings({ categories, budgets, month, year, onChanged, isAdmin }) {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    const init = {};
    categories.forEach((c) => {
      const existing = budgets.find((b) => b.category_id === c.id && b.month === month && b.year === year);
      init[c.id] = existing ? String(existing.amount) : '';
    });
    setValues(init);
  }, [categories, budgets, month, year]);

  const saveBudget = async (catId) => {
    const amount = parseFloat(values[catId]);
    if (isNaN(amount) || amount < 0) return;
    setSaving((s) => ({ ...s, [catId]: true }));
    await supabase.from('budgets').upsert(
      { category_id: catId, month, year, amount },
      { onConflict: 'category_id,month,year' }
    );
    setSaving((s) => ({ ...s, [catId]: false }));
    setSaved((s) => ({ ...s, [catId]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [catId]: false })), 2000);
    onChanged();
  };

  const saveAll = async () => {
    for (const cat of categories) {
      const amount = parseFloat(values[cat.id]);
      if (!isNaN(amount) && amount >= 0 && values[cat.id] !== '') {
        await supabase.from('budgets').upsert(
          { category_id: cat.id, month, year, amount },
          { onConflict: 'category_id,month,year' }
        );
      }
    }
    onChanged();
  };

  const totalBudget = categories.reduce((s, c) => {
    const v = parseFloat(values[c.id]);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 }}>Set Budgets</h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Monthly budget targets for {MONTHS[month-1]} {year}</p>
      </div>

      {!isAdmin && (
        <div style={infoBox}>
          ℹ️ Only Harry (admin) can set budgets. You can view them in the Summary tab.
        </div>
      )}

      {/* Total preview */}
      <div style={totalCard}>
        <div style={totalBg} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>TOTAL MONTHLY BUDGET</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>${totalBudget.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{MONTHS[month-1]} {year}</div>
        </div>
      </div>

      {/* Category inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map((cat) => {
          const existing = budgets.find((b) => b.category_id === cat.id && b.month === month && b.year === year);
          const hasValue = values[cat.id] !== '';
          return (
            <div key={cat.id} style={catRow}>
              <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{cat.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#d1d5db' }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>$</span>
                <input
                  type="number" min="0" step="10"
                  value={values[cat.id] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [cat.id]: e.target.value }))}
                  placeholder="0"
                  disabled={!isAdmin}
                  style={{ ...budgetInput, ...(isAdmin ? {} : budgetInputDisabled) }}
                />
              </div>
              {isAdmin && (
                <button
                  onClick={() => saveBudget(cat.id)}
                  disabled={saving[cat.id] || !hasValue}
                  style={{ ...saveBtn, ...(saved[cat.id] ? saveBtnSaved : saving[cat.id] ? saveBtnLoading : {}) }}
                >
                  {saving[cat.id] ? '…' : saved[cat.id] ? '✓' : 'Set'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <button onClick={saveAll} style={saveAllBtn}>
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)', borderRadius: 12 }} />
          💾 Save All Budgets for {MONTHS[month-1]} {year}
        </button>
      )}
    </div>
  );
}

const infoBox = { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#a5b4fc' };
const totalCard = { position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '1.4rem', border: '1px solid rgba(16,185,129,0.3)' };
const totalBg = { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))', zIndex: 0 };
const catRow = { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' };
const budgetInput = { width: 90, padding: '8px 10px', fontSize: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f0f0f8', outline: 'none', textAlign: 'right' };
const budgetInputDisabled = { opacity: 0.5, cursor: 'not-allowed' };
const saveBtn = { padding: '7px 14px', borderRadius: 8, border: 'none', background: 'rgba(99,102,241,0.7)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 42 };
const saveBtnSaved = { background: 'rgba(16,185,129,0.7)' };
const saveBtnLoading = { opacity: 0.5 };
const saveAllBtn = { position: 'relative', overflow: 'hidden', padding: '14px', fontSize: 14, fontWeight: 600, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #059669, #0891b2)', color: '#fff', cursor: 'pointer', boxShadow: '0 0 24px rgba(16,185,129,0.25)' };
