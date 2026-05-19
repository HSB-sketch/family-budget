'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import EntryList from './EntryList';

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6b7280'];

export default function Summary({ expenses, categories, budgets, userId, isAdmin, month, year, onMonthChange, onYearChange, onChanged }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const grandTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  const catData = categories.map((cat) => {
    const spent = filtered.filter((e) => e.category_id === cat.id).reduce((s, e) => s + parseFloat(e.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id && b.month === month && b.year === year)?.amount || 0;
    return { name: cat.name, icon: cat.icon, spent, budget: parseFloat(budget), variance: parseFloat(budget) - spent };
  }).filter((c) => c.spent > 0 || c.budget > 0);

  const pieData = catData.filter((c) => c.spent > 0).map((c) => ({ name: c.name, value: c.spent }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Month/Year picker */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select value={month} onChange={(e) => onMonthChange(parseInt(e.target.value))} style={selectStyle}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYearChange(parseInt(e.target.value))} style={selectStyle}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Total */}
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '1.5rem', borderRadius: '16px', color: '#fff', textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', opacity: 0.85 }}>Total spent — {months[month - 1]} {year}</p>
        <p style={{ margin: 0, fontSize: '36px', fontWeight: '700' }}>${grandTotal.toFixed(2)}</p>
      </div>

      {catData.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', padding: '1rem 0' }}>No expenses for this period.</p>
      )}

      {/* Bar chart: spent vs budget */}
      {catData.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Spending vs Budget</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="spent" name="Spent" fill="#667eea" radius={[4,4,0,0]} />
              <Bar dataKey="budget" name="Budget" fill="#e0e7ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Spending Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Variance table */}
      {catData.length > 0 && (
        <div>
          <h3 style={sectionTitle}>Budget Variance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {catData.map((c) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
                <span style={{ fontSize: '14px', color: '#555' }}>{c.icon} {c.name}</span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', textAlign: 'right' }}>
                  <span style={{ color: '#667eea' }}>${c.spent.toFixed(2)}</span>
                  {c.budget > 0 && (
                    <span style={{ color: c.variance >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      {c.variance >= 0 ? `$${c.variance.toFixed(2)} left` : `$${Math.abs(c.variance).toFixed(2)} over`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div>
        <h3 style={sectionTitle}>All Entries — {months[month - 1]} {year}</h3>
        <EntryList expenses={filtered} categories={categories} userId={userId} isAdmin={isAdmin} onChanged={onChanged} />
      </div>
    </div>
  );
}

const sectionTitle = { fontSize: '13px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' };
const selectStyle = { padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none', background: '#fff' };
