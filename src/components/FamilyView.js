'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#ec4899','#f97316'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MEMBER_BEACH = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&q=60',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=60',
];

export default function FamilyView({ expenses, categories, budgets, profiles, month, year, onMonthChange, onYearChange }) {
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const grandTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalBudget = budgets.filter((b) => b.month === month && b.year === year).reduce((s, b) => s + parseFloat(b.amount), 0);

  const memberData = profiles.map((p, i) => {
    const total = filtered.filter((e) => e.user_id === p.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    return { name: p.name, total, color: COLORS[i % COLORS.length], img: MEMBER_BEACH[i % MEMBER_BEACH.length] };
  });

  const catData = categories.map((cat, i) => {
    const spent = filtered.filter((e) => e.category_id === cat.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id && b.month === month && b.year === year)?.amount || 0;
    return { name: cat.name, icon: cat.icon, spent, budget: parseFloat(budget), color: COLORS[i % COLORS.length] };
  }).filter((c) => c.spent > 0 || c.budget > 0);

  const stackedData = categories.map((cat) => {
    const row = { name: cat.icon + ' ' + cat.name };
    profiles.forEach((p) => {
      row[p.name] = filtered.filter((e) => e.category_id === cat.id && e.user_id === p.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    });
    return row;
  }).filter((row) => profiles.some((p) => (row[p.name] || 0) > 0));

  const memberColors = profiles.reduce((acc, p, i) => { acc[p.name] = COLORS[i % COLORS.length]; return acc; }, {});
  const pct = totalBudget > 0 ? Math.min((grandTotal / totalBudget) * 100, 100) : 0;
  const over = totalBudget > 0 && grandTotal > totalBudget;

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

      {/* Hero family total banner */}
      <div style={heroCard}>
        <div style={heroBg} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em' }}>FAMILY TOTAL · {MONTHS[month-1].toUpperCase()} {year}</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>${grandTotal.toFixed(2)}</div>
          {totalBudget > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: over ? '#fca5a5' : '#fff', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                Budget: ${totalBudget.toFixed(2)} &nbsp;·&nbsp;
                {over
                  ? <span style={{ color: '#fca5a5' }}>${(grandTotal - totalBudget).toFixed(2)} over ⚠️</span>
                  : <span style={{ color: '#bbf7d0' }}>${(totalBudget - grandTotal).toFixed(2)} remaining ✓</span>
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
        {memberData.map((m, i) => (
          <div key={m.name} style={{ ...memberCard, borderTop: `3px solid ${m.color}` }}>
            <div style={{ ...memberImgStrip, backgroundImage: `url(${m.img})` }} />
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>${m.total.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {grandTotal > 0 ? `${((m.total/grandTotal)*100).toFixed(0)}% of total` : 'No expenses'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      {memberData.filter((m) => m.total > 0).length > 1 && (
        <div style={panel}>
          <div style={panelTitle}>SHARE OF SPENDING</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={memberData.filter((m) => m.total > 0)} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {memberData.filter((m) => m.total > 0).map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stacked bar */}
      {stackedData.length > 0 && profiles.length > 1 && (
        <div style={panel}>
          <div style={panelTitle}>CATEGORY BREAKDOWN BY MEMBER</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedData} margin={{ top: 4, right: 4, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={ttStyle} formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {profiles.map((p) => (
                <Bar key={p.id} dataKey={p.name} stackId="a" fill={memberColors[p.name]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category totals */}
      {catData.length > 0 && (
        <div style={panel}>
          <div style={panelTitle}>CATEGORY TOTALS (FAMILY-WIDE)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catData.sort((a,b) => b.spent - a.spent).map((c, i) => {
              const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
              const over = c.budget > 0 && c.spent > c.budget;
              return (
                <div key={i} style={varRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.budget > 0 ? 6 : 0 }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>{c.icon} {c.name}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                      <span style={{ color: c.color, fontWeight: 700 }}>${c.spent.toFixed(2)}</span>
                      {c.budget > 0 && <span style={{ color: over ? '#ef4444' : '#64748b' }}>/ ${c.budget.toFixed(2)}</span>}
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

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏖️</div>
          No family expenses for {MONTHS[month-1]} {year}
        </div>
      )}
    </div>
  );
}

const sel = { padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const panel = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const panelTitle = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 };
const varRow = { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' };
const heroCard = { position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '1.8rem', boxShadow: '0 16px 48px rgba(14,165,233,0.25)' };
const heroBg = { position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=70)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.55)' };
const ttStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const memberCard = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const memberImgStrip = { height: 70, backgroundSize: 'cover', backgroundPosition: 'center' };
