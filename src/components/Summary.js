'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EntryList from './EntryList';

const COLORS = ['#6366f1','#8b5cf6','#22d3ee','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#6b7280'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...sc.card, borderColor: accent + '33' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const sc = {
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid', borderRadius: 14,
    padding: '1rem 1.2rem', flex: 1,
  },
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Month picker */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={month} onChange={(e) => onMonthChange(parseInt(e.target.value))} style={sel}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYearChange(parseInt(e.target.value))} style={sel}>
          {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>My Summary</span>
      </div>

      {/* Stat row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="My Spending" value={`$${myTotal.toFixed(0)}`} sub={MONTHS[month-1] + ' ' + year} accent="#6366f1" />
        <StatCard label="Family Total" value={`$${grandTotal.toFixed(0)}`} sub="all members" accent="#8b5cf6" />
        {totalBudget > 0 && (
          <StatCard label="Budget Left" value={`$${(totalBudget - grandTotal).toFixed(0)}`} sub={overCount > 0 ? `${overCount} over` : 'on track'} accent={overCount > 0 ? '#ef4444' : '#10b981'} />
        )}
      </div>

      {/* Bar chart */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={panelTitle}>Spending vs Budget</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ top: 4, right: 4, left: -16, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#0e1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(val) => `$${parseFloat(val).toFixed(2)}`}
              />
              <Bar dataKey="spent" name="Spent" radius={[4,4,0,0]}>
                {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
              <Bar dataKey="budget" name="Budget" fill="rgba(255,255,255,0.08)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Variance table */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={panelTitle}>Budget Variance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catData.map((c, i) => {
              const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
              const over = c.budget > 0 && c.variance < 0;
              return (
                <div key={i} style={varRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#d1d5db' }}>{c.icon} {c.name}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: c.color, fontWeight: 600 }}>${c.spent.toFixed(2)}</span>
                      {c.budget > 0 && (
                        <span style={{ color: over ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {over ? `↑ $${Math.abs(c.variance).toFixed(2)} over` : `$${c.variance.toFixed(2)} left`}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.budget > 0 && (
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: over ? '#ef4444' : c.color, borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

const sel = { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#f0f0f8', outline: 'none' };
const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.2rem' };
const panelTitle = { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 };
const varRow = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' };
