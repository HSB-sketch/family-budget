'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_COLORS = ['#0ea5e9','#8b5cf6','#14b8a6','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#94a3b8'];

export default function AnnualView({ expenses, categories, budgets, profiles, year, onYearChange }) {
  // Build per-month totals Jan→Dec for the selected year
  const monthlyTotals = MONTHS.map((label, mi) => {
    const mo = mi + 1;
    const exps = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() + 1 === mo;
    });
    const spent = exps.reduce((s, e) => s + parseFloat(e.amount), 0);
    const budget = budgets
      .filter((b) => b.month === mo && b.year === year)
      .reduce((s, b) => s + parseFloat(b.amount), 0);
    return { label, month: mo, spent, budget, over: budget > 0 && spent > budget };
  });

  // Running (cumulative) totals
  let running = 0;
  let runningBudget = 0;
  const cumulativeData = monthlyTotals.map((m) => {
    running += m.spent;
    runningBudget += m.budget;
    return { label: m.label, cumSpent: parseFloat(running.toFixed(2)), cumBudget: parseFloat(runningBudget.toFixed(2)) };
  });

  const now = new Date();
  const currentMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const ytdExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() + 1 <= currentMonth;
  });
  const ytdTotal = ytdExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const ytdBudget = budgets
    .filter((b) => b.year === year && b.month <= currentMonth)
    .reduce((s, b) => s + parseFloat(b.amount), 0);
  const annualBudget = budgets
    .filter((b) => b.year === year)
    .reduce((s, b) => s + parseFloat(b.amount), 0);

  // Per-category YTD
  const catYTD = categories.map((cat, i) => {
    const spent = ytdExpenses.filter((e) => e.category_id === cat.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    const monthlyBudget = budgets.find((b) => b.category_id === cat.id && b.month === currentMonth && b.year === year)?.amount || 0;
    const ytdBudgetForCat = parseFloat(monthlyBudget) * currentMonth; // rough annualised
    return { name: cat.name, icon: cat.icon, spent, ytdBudget: ytdBudgetForCat, color: CAT_COLORS[i % CAT_COLORS.length] };
  }).filter((c) => c.spent > 0);

  // Per-member YTD
  const memberYTD = profiles.map((p, i) => {
    const spent = ytdExpenses.filter((e) => e.user_id === p.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    return { name: p.name, spent, color: CAT_COLORS[i % CAT_COLORS.length] };
  }).filter((m) => m.spent > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Annual Overview</h2>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Jan – {MONTHS[currentMonth - 1]} {year} · all family members</p>
        </div>
        <select value={year} onChange={(e) => onYearChange(parseInt(e.target.value))} style={sel}>
          {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* YTD stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="YTD Spent" value={`$${ytdTotal.toFixed(0)}`} accent="#6366f1" />
        <StatCard label="YTD Budget" value={ytdBudget > 0 ? `$${ytdBudget.toFixed(0)}` : '—'} accent="#8b5cf6" />
        <StatCard
          label={ytdBudget > 0 ? (ytdTotal <= ytdBudget ? 'Under Budget' : 'Over Budget') : 'Annual Budget'}
          value={ytdBudget > 0 ? `$${Math.abs(ytdBudget - ytdTotal).toFixed(0)}` : (annualBudget > 0 ? `$${annualBudget.toFixed(0)}` : '—')}
          accent={ytdBudget > 0 ? (ytdTotal <= ytdBudget ? '#10b981' : '#ef4444') : '#14b8a6'}
        />
      </div>

      {/* Monthly bar chart */}
      <div style={panel}>
        <div style={sectionLabel}>MONTHLY SPENDING — {year}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyTotals} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={ttStyle}
              formatter={(v) => `$${parseFloat(v).toFixed(2)}`}
            />
            <Bar dataKey="spent" name="Spent" radius={[4,4,0,0]}>
              {monthlyTotals.map((m, i) => (
                <Cell key={i} fill={m.over ? '#ef4444' : m.month === currentMonth ? '#14b8a6' : '#0ea5e9'} />
              ))}
            </Bar>
            <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#0ea5e9', marginRight: 4 }} />Spent</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />Budget</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ef4444', marginRight: 4 }} />Over budget</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#14b8a6', marginRight: 4 }} />Current month</span>
        </div>
      </div>

      {/* Cumulative running total */}
      <div style={panel}>
        <div style={sectionLabel}>CUMULATIVE SPENDING (RUNNING TOTAL)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={cumulativeData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={ttStyle} formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
            <Line type="monotone" dataKey="cumSpent" name="Spent" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9' }} activeDot={{ r: 5 }} />
            {cumulativeData.some((d) => d.cumBudget > 0) && (
              <Line type="monotone" dataKey="cumBudget" name="Budget" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Month-by-month table */}
      <div style={panel}>
        <div style={sectionLabel}>MONTH-BY-MONTH BREAKDOWN</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Month','Spent','Budget','Variance','Status'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((m, i) => {
                const variance = m.budget > 0 ? m.budget - m.spent : null;
                const isCurrent = m.month === currentMonth && year === now.getFullYear();
                const isFuture = m.month > currentMonth && year === now.getFullYear();
                return (
                  <tr key={i} style={{ background: isCurrent ? 'rgba(34,211,238,0.05)' : 'transparent' }}>
                    <td style={td}>
                      <span style={{ color: isCurrent ? '#14b8a6' : '#d1d5db', fontWeight: isCurrent ? 600 : 400 }}>
                        {m.label} {isCurrent ? '←' : ''}
                      </span>
                    </td>
                    <td style={{ ...td, color: m.spent > 0 ? '#a5b4fc' : '#4b5563', fontWeight: 600 }}>
                      {m.spent > 0 ? `$${m.spent.toFixed(2)}` : isFuture ? '—' : '$0.00'}
                    </td>
                    <td style={{ ...td, color: m.budget > 0 ? '#9ca3af' : '#4b5563' }}>
                      {m.budget > 0 ? `$${m.budget.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...td, color: variance === null ? '#4b5563' : variance >= 0 ? '#10b981' : '#ef4444', fontWeight: variance !== null ? 600 : 400 }}>
                      {variance === null ? '—' : variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                    </td>
                    <td style={td}>
                      {isFuture ? <span style={badge('#4b5563','#1f2937')}>Upcoming</span>
                        : m.spent === 0 ? <span style={badge('#4b5563','#1f2937')}>No data</span>
                        : variance === null ? <span style={badge('#94a3b8','rgba(107,114,128,0.15)')}>No budget</span>
                        : variance >= 0 ? <span style={badge('#10b981','rgba(16,185,129,0.15)')}>✓ On track</span>
                        : <span style={badge('#ef4444','rgba(239,68,68,0.15)')}>Over</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ ...td, color: '#64748b', fontWeight: 700 }}>YTD Total</td>
                <td style={{ ...td, color: '#a5b4fc', fontWeight: 700 }}>${ytdTotal.toFixed(2)}</td>
                <td style={{ ...td, color: '#64748b', fontWeight: 700 }}>{ytdBudget > 0 ? `$${ytdBudget.toFixed(2)}` : '—'}</td>
                <td style={{ ...td, color: ytdBudget > 0 ? (ytdTotal <= ytdBudget ? '#10b981' : '#ef4444') : '#4b5563', fontWeight: 700 }}>
                  {ytdBudget > 0 ? (ytdTotal <= ytdBudget ? `+$${(ytdBudget-ytdTotal).toFixed(2)}` : `-$${(ytdTotal-ytdBudget).toFixed(2)}`) : '—'}
                </td>
                <td style={td} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* YTD category breakdown */}
      {catYTD.length > 0 && (
        <div style={panel}>
          <div style={sectionLabel}>YTD SPENDING BY CATEGORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catYTD.sort((a, b) => b.spent - a.spent).map((c, i) => {
              const pct = c.ytdBudget > 0 ? Math.min((c.spent / c.ytdBudget) * 100, 100) : 0;
              const over = c.ytdBudget > 0 && c.spent > c.ytdBudget;
              return (
                <div key={i} style={varRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.ytdBudget > 0 ? 6 : 0 }}>
                    <span style={{ fontSize: 13, color: '#d1d5db' }}>{c.icon} {c.name}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                      <span style={{ color: c.color, fontWeight: 600 }}>${c.spent.toFixed(2)}</span>
                      {c.ytdBudget > 0 && (
                        <span style={{ color: over ? '#ef4444' : '#94a3b8' }}>
                          / ${c.ytdBudget.toFixed(2)} YTD budget
                        </span>
                      )}
                    </div>
                  </div>
                  {c.ytdBudget > 0 && (
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

      {/* YTD per member */}
      {memberYTD.length > 0 && (
        <div style={panel}>
          <div style={sectionLabel}>YTD SPENDING BY MEMBER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10 }}>
            {memberYTD.map((m) => (
              <div key={m.name} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.color}33`, borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, margin: '0 auto 8px' }}>
                  {m.name.slice(0,1).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>${m.spent.toFixed(0)}</div>
                <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                  {ytdTotal > 0 ? `${((m.spent / ytdTotal) * 100).toFixed(0)}%` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${accent}44`, borderRadius: 14, padding: '1rem' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

function badge(color, bg) {
  return { display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, border: `1px solid ${color}44` };
}

const sel = { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', color: '#0f172a', outline: 'none' };
const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.2rem' };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 };
const varRow = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' };
const ttStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 };
const th = { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' };
const td = { padding: '9px 10px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' };
