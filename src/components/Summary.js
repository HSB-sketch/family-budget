'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EntryList from './EntryList';

const COLORS = ['#0ea5e9','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316','#ec4899','#84cc16','#6b7280'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, accent, emoji }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.1rem', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Summary({ expenses, categories, budgets, userId, isAdmin, month, year, onMonthChange, onYearChange, onChanged }) {
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const myExpenses = filtered.filter((e) => e.user_id === userId);
  const grandTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
  const myTotal = myExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  const catData = categories.map((cat, i) => {
    const spent = filtered.filter((e) => e.category_id === cat.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id && b.month === month && b.year === year)?.amount || 0;
    return { name: cat.name, icon: cat.icon, spent, budget: parseFloat(budget), variance: parseFloat(budget) - spent, color: COLORS[i % COLORS.length] };
  }).filter((c) => c.spent > 0 || c.budget > 0);

  const totalBudget = catData.reduce((s, c) => s + c.budget, 0);
  const overCount = catData.filter((c) => c.budget > 0 && c.variance < 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Month picker */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={month} onChange={(e) => onMonthChange(parseInt(e.target.value))} style={sel}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYearChange(parseInt(e.target.value))} style={sel}>
          {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="My Spending" value={`$${myTotal.toFixed(0)}`} sub={MONTHS[month-1]+' '+year} accent="#0ea5e9" emoji="🙋" />
        <StatCard label="Family Total" value={`$${grandTotal.toFixed(0)}`} sub="all members" accent="#8b5cf6" emoji="👨‍👩‍👧" />
        {totalBudget > 0 && (
          <StatCard
            label="Budget Left"
            value={`$${Math.abs(totalBudget - grandTotal).toFixed(0)}`}
            sub={overCount > 0 ? `${overCount} over` : 'on track ✓'}
            accent={overCount > 0 ? '#ef4444' : '#10b981'}
            emoji={overCount > 0 ? '⚠️' : '✅'}
          />
        )}
      </div>

      {/* Bar chart */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={panelTitle}>Spending vs Budget — {MONTHS[month-1]} {year}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ top: 4, right: 4, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v) => `$${parseFloat(v).toFixed(2)}`}
              />
              <Bar dataKey="spent" name="Spent" radius={[5,5,0,0]}>
                {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
              <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Variance rows */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={panelTitle}>Budget Variance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catData.map((c, i) => {
              const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
              const over = c.budget > 0 && c.variance < 0;
              return (
                <div key={i} style={varRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.budget > 0 ? 6 : 0 }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>{c.icon} {c.name}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: c.color, fontWeight: 700 }}>${c.spent.toFixed(2)}</span>
                      {c.budget > 0 && (
                        <span style={{ color: over ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {over ? `↑ $${Math.abs(c.variance).toFixed(2)} over` : `$${c.variance.toFixed(2)} left`}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.budget > 0 && (
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: over ? '#ef4444' : c.color, borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {catData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏖️</div>
          No expenses for {MONTHS[month-1]} {year} yet
        </div>
      )}

      {/* Entry list */}
      <div style={panel}>
        <div style={panelTitle}>All Entries — {MONTHS[month-1]} {year}</div>
        <EntryList expenses={filtered} categories={categories} userId={userId} isAdmin={isAdmin} onChanged={onChanged} />
      </div>
    </div>
  );
}

const sel = { padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const panel = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const panelTitle = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 };
const varRow = { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' };
