'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#22d3ee','#ec4899','#84cc16'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FamilyView({ expenses, categories, budgets, profiles, month, year, onMonthChange, onYearChange }) {
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const grandTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalBudget = budgets
    .filter((b) => b.month === month && b.year === year)
    .reduce((s, b) => s + parseFloat(b.amount), 0);

  // Per-member totals
  const memberData = profiles.map((p, i) => {
    const total = filtered.filter((e) => e.user_id === p.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    return { name: p.name, total, color: COLORS[i % COLORS.length] };
  }).filter((m) => m.total > 0);

  // Per-category totals (family-wide)
  const catData = categories.map((cat, i) => {
    const spent = filtered.filter((e) => e.category_id === cat.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id && b.month === month && b.year === year)?.amount || 0;
    return { name: cat.name, icon: cat.icon, spent, budget: parseFloat(budget), color: COLORS[i % COLORS.length] };
  }).filter((c) => c.spent > 0 || c.budget > 0);

  // Stacked bar by member per category
  const stackedData = categories.map((cat) => {
    const row = { name: cat.icon + ' ' + cat.name };
    profiles.forEach((p) => {
      row[p.name] = filtered.filter((e) => e.category_id === cat.id && e.user_id === p.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    });
    return row;
  }).filter((row) => profiles.some((p) => (row[p.name] || 0) > 0));

  const memberColors = profiles.reduce((acc, p, i) => { acc[p.name] = COLORS[i % COLORS.length]; return acc; }, {});

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
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>Family View</span>
      </div>

      {/* Hero total */}
      <div style={heroCard}>
        <div style={heroBg} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>FAMILY TOTAL — {MONTHS[month-1]} {year}</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>${grandTotal.toFixed(2)}</div>
          {totalBudget > 0 && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Budget: ${totalBudget.toFixed(2)} &nbsp;·&nbsp;
              {grandTotal <= totalBudget
                ? <span style={{ color: '#6ee7b7' }}>${(totalBudget - grandTotal).toFixed(2)} remaining ✓</span>
                : <span style={{ color: '#fca5a5' }}>${(grandTotal - totalBudget).toFixed(2)} over budget</span>
              }
            </div>
          )}
        </div>
      </div>

      {/* Per-member cards */}
      {memberData.length > 0 && (
        <div>
          <div style={sectionLabel}>SPENDING BY MEMBER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {memberData.map((m) => (
              <div key={m.name} style={{ ...memberCard, borderColor: m.color + '44' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>
                  {m.name.slice(0,1).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: '#d1d5db', marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>${m.total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {grandTotal > 0 ? `${((m.total / grandTotal) * 100).toFixed(0)}% of total` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pie: member breakdown */}
      {memberData.length > 1 && (
        <div style={panel}>
          <div style={sectionLabel}>SHARE OF SPENDING</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={memberData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {memberData.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stacked bar by category + member */}
      {stackedData.length > 0 && profiles.length > 1 && (
        <div style={panel}>
          <div style={sectionLabel}>CATEGORY BREAKDOWN BY MEMBER</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedData} margin={{ top: 4, right: 4, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={ttStyle} formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              {profiles.map((p) => (
                <Bar key={p.id} dataKey={p.name} stackId="a" fill={memberColors[p.name]} radius={[0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category totals */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={sectionLabel}>CATEGORY TOTALS (FAMILY-WIDE)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catData.sort((a,b) => b.spent - a.spent).map((c, i) => {
              const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
              const over = c.budget > 0 && c.spent > c.budget;
              return (
                <div key={i} style={varRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.budget > 0 ? 6 : 0 }}>
                    <span style={{ fontSize: 13, color: '#d1d5db' }}>{c.icon} {c.name}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                      <span style={{ color: c.color, fontWeight: 600 }}>${c.spent.toFixed(2)}</span>
                      {c.budget > 0 && (
                        <span style={{ color: over ? '#ef4444' : '#10b981' }}>
                          {over ? `↑ $${(c.spent - c.budget).toFixed(2)} over` : `/ $${c.budget.toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.budget > 0 && (
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: over ? '#ef4444' : c.color, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#4b5563' }}>
          No expenses recorded for {MONTHS[month-1]} {year}
        </div>
      )}
    </div>
  );
}

const sel = { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#f0f0f8', outline: 'none' };
const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.2rem' };
const varRow = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', marginBottom: 12 };
const memberCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 14, padding: '1rem', textAlign: 'center' };
const heroCard = { position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '1.8rem', border: '1px solid rgba(99,102,241,0.3)' };
const heroBg = { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))', zIndex: 0 };
const ttStyle = { background: '#0e1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 };
