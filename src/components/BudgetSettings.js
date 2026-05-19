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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Set Budgets</h2>
        <p style={{ fontSize: 13, color: '#64748b' }}>Monthly targets for {MONTHS[month-1]} {year}</p>
      </div>

      {!isAdmin && (
        <div style={infoBox}>
          ℹ️ Only Harry (admin) can set budgets. View your spending in My Month or Family tabs.
        </div>
      )}

      {/* Total card */}
      <div style={totalCard}>
        <div style={totalBg} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2, fontWeight: 600, letterSpacing: '0.06em' }}>TOTAL MONTHLY BUDGET</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>${totalBudget.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{MONTHS[month-1]} {year}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>across {categories.length} categories</div>
          </div>
        </div>
      </div>

      {/* Category rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map((cat) => {
          const v = parseFloat(values[cat.id]);
          const hasValue = values[cat.id] !== '' && !isNaN(v);
          return (
            <div key={cat.id} style={catRow}>
              <span style={{ fontSize: 22, minWidth: 28, textAlign: 'center' }}>{cat.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500 }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>$</span>
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
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44,
                    background: saved[cat.id] ? '#10b981' : '#0ea5e9',
                    color: '#fff', opacity: (saving[cat.id] || !hasValue) ? 0.5 : 1,
                    boxShadow: '0 2px 8px rgba(14,165,233,0.2)',
                  }}
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
          💾 Save All for {MONTHS[month-1]} {year}
        </button>
      )}

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#166534' }}>
        💡 <strong>Tip:</strong> Set budgets here each month, then check the <strong>Annual</strong> tab to see your full year-to-date picture.
      </div>
    </div>
  );
}

const infoBox = { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#0369a1' };
const totalCard = { position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '1.4rem', boxShadow: '0 12px 32px rgba(14,165,233,0.25)' };
const totalBg = { position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=70)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.45)' };
const catRow = { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const budgetInput = { width: 90, padding: '8px 10px', fontSize: 14, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', textAlign: 'right' };
const budgetInputDisabled = { opacity: 0.5, cursor: 'not-allowed', background: '#f8fafc' };
const saveAllBtn = { padding: '14px', fontSize: 14, fontWeight: 600, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 24px rgba(14,165,233,0.3)' };
