'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AddExpenseForm from '../../components/AddExpenseForm';
import Summary from '../../components/Summary';
import BudgetSettings from '../../components/BudgetSettings';
import FamilyView from '../../components/FamilyView';
import AnnualView from '../../components/AnnualView';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [profiles, setProfiles] = useState([]);
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
    const [{ data: prof }, { data: cats }, { data: exps }, { data: buds }, { data: profs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('categories').select('*').order('name'),
      supabase.from('expenses').select('*, profiles(name)').order('date', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('profiles').select('*'),
    ]);
    setProfile(prof);
    setCategories(cats || []);
    setExpenses(exps || []);
    setBudgets(buds || []);
    setProfiles(profs || []);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#07080f' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs = [
    { id: 'add',    label: '+ Add Expense',  icon: '➕' },
    { id: 'summary', label: 'My Summary',    icon: '📊' },
    { id: 'family', label: 'Family View',    icon: '👨‍👩‍👧' },
    { id: 'annual', label: 'Annual',         icon: '📅' },
    { id: 'budget', label: 'Budgets',        icon: '🎯' },
  ];

  const initials = (profile?.name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#07080f' }}>
      {/* Subtle top glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 200, background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={hdr.wrap}>
        <div style={hdr.inner}>
          <div style={hdr.logo}>
            <div style={hdr.logoIcon}>💰</div>
            <span style={hdr.logoText}>FamilyBudget</span>
          </div>
          <div style={hdr.right}>
            <span style={hdr.userName}>{profile?.name || user?.email}</span>
            <div style={hdr.avatar}>{initials}</div>
            <button onClick={logout} style={hdr.signOut}>Sign out</button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav style={nav.wrap}>
        <div style={nav.inner}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...nav.tab, ...(tab === t.id ? nav.tabActive : {}) }}>
              <span style={{ marginRight: 6 }}>{t.icon}</span>
              {t.label}
              {tab === t.id && <div style={nav.indicator} />}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 4rem', position: 'relative', zIndex: 1 }}>
        {tab === 'add' && (
          <AddExpenseForm categories={categories} userId={user.id} onAdded={loadData} />
        )}
        {tab === 'summary' && (
          <Summary
            expenses={expenses} categories={categories} budgets={budgets}
            userId={user.id} isAdmin={isAdmin}
            month={month} year={year}
            onMonthChange={setMonth} onYearChange={setYear}
            onChanged={loadData}
          />
        )}
        {tab === 'family' && (
          <FamilyView
            expenses={expenses} categories={categories} budgets={budgets}
            profiles={profiles} month={month} year={year}
            onMonthChange={setMonth} onYearChange={setYear}
          />
        )}
        {tab === 'annual' && (
          <AnnualView
            expenses={expenses} categories={categories} budgets={budgets}
            profiles={profiles} year={year} onYearChange={setYear}
          />
        )}
        {tab === 'budget' && (
          <BudgetSettings
            categories={categories} budgets={budgets}
            month={month} year={year} onChanged={loadData}
            isAdmin={isAdmin}
          />
        )}
      </main>
    </div>
  );
}

const hdr = {
  wrap: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  inner: { maxWidth: 640, margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  logoText: { fontSize: 16, fontWeight: 700, color: '#f0f0f8' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  userName: { fontSize: 13, color: '#9ca3af' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' },
  signOut: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 11px', fontSize: 12, color: '#9ca3af', cursor: 'pointer' },
};

const nav = {
  wrap: { background: 'rgba(7,8,15,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' },
  inner: { maxWidth: 640, margin: '0 auto', padding: '0 1rem', display: 'flex', gap: 4 },
  tab: {
    position: 'relative', padding: '12px 14px', fontSize: 13, fontWeight: 500,
    background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'color 0.2s',
  },
  tabActive: { color: '#a5b4fc' },
  indicator: { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 2, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 1 },
};
