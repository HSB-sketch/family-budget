'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AddExpenseForm from '../../components/AddExpenseForm';
import Summary from '../../components/Summary';
import BudgetSettings from '../../components/BudgetSettings';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [tab, setTab] = useState('add');
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: prof }, { data: cats }, { data: exps }, { data: buds }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('categories').select('*').order('name'),
      supabase.from('expenses').select('*, profiles(name)').order('date', { ascending: false }),
      supabase.from('budgets').select('*'),
    ]);
    setProfile(prof);
    setCategories(cats || []);
    setExpenses(exps || []);
    setBudgets(buds || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#999' }}>Loading...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'add', label: '+ Add Expense' },
    { id: 'summary', label: '📊 Summary' },
    ...(isAdmin ? [{ id: 'budget', label: '🎯 Set Budgets' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9f7f4' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 1rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#667eea', margin: 0 }}>💰 Family Budget</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#888' }}>{profile?.name || user?.email}</span>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#999', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
                border: tab === t.id ? '1.5px solid #667eea' : '1.5px solid #e0e0e0',
                background: tab === t.id ? '#eef0ff' : '#fff',
                color: tab === t.id ? '#667eea' : '#666',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'add' && (
          <AddExpenseForm
            categories={categories}
            userId={user.id}
            onAdded={loadData}
          />
        )}

        {tab === 'summary' && (
          <Summary
            expenses={expenses}
            categories={categories}
            budgets={budgets}
            userId={user.id}
            isAdmin={isAdmin}
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
            onChanged={loadData}
          />
        )}

        {tab === 'budget' && isAdmin && (
          <BudgetSettings
            categories={categories}
            budgets={budgets}
            month={month}
            year={year}
            onChanged={loadData}
          />
        )}
      </main>
    </div>
  );
}
