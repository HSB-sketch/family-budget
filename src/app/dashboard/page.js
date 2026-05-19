'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AddExpenseForm from '../../components/AddExpenseForm';
import Summary from '../../components/Summary';
import BudgetSettings from '../../components/BudgetSettings';
import FamilyView from '../../components/FamilyView';
import AnnualView from '../../components/AnnualView';

// Rotating beach header images
const HEADER_IMGS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=70',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1400&q=70',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=70',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=70',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=70',
];

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

  // Pick a hero image based on day
  const heroImg = HEADER_IMGS[now.getDate() % HEADER_IMGS.length];

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f9ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌊</div>
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading your budget…</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'add',    label: '+ Add',     icon: '➕' },
    { id: 'summary', label: 'My Month', icon: '📊' },
    { id: 'family', label: 'Family',    icon: '👨‍👩‍👧' },
    { id: 'annual', label: 'Annual',    icon: '📅' },
    { id: 'budget', label: 'Budgets',   icon: '🎯' },
  ];

  const initials = (profile?.name || user?.email || '?').slice(0, 1).toUpperCase();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Quick spend this month
  const monthlyTotal = expenses
    .filter((e) => { const d = new Date(e.date); return d.getMonth()+1===month && d.getFullYear()===year; })
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>

      {/* Hero header */}
      <div style={{ ...hero.wrap, backgroundImage: `url(${heroImg})` }}>
        <div style={hero.overlay} />
        <div style={hero.inner}>
          {/* Top bar */}
          <div style={hero.topBar}>
            <div style={hero.logo}>
              <span style={{ fontSize: 20 }}>🌊</span>
              <span style={hero.logoText}>FamilyBudget</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={hero.avatar}>{initials}</div>
              <span style={hero.userName}>{profile?.name || user?.email}</span>
              <button onClick={logout} style={hero.signOut}>Sign out</button>
            </div>
          </div>
          {/* Hero copy */}
          <div style={hero.copy}>
            <h1 style={hero.title}>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p style={hero.subtitle}>
              <strong style={{ color: '#fff' }}>${monthlyTotal.toFixed(2)}</strong> spent in {MONTHS[month-1]} {year}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky nav tabs */}
      <nav style={nav.wrap}>
        <div style={nav.inner}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...nav.tab, ...(tab === t.id ? nav.tabActive : {}) }}>
              <span style={{ marginRight: 5 }}>{t.icon}</span>
              {t.label}
              {tab === t.id && <div style={nav.indicator} />}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
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

const hero = {
  wrap: { position: 'relative', backgroundSize: 'cover', backgroundPosition: 'center', height: 220 },
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,48,71,0.45) 0%, rgba(2,48,71,0.65) 100%)' },
  inner: { position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 1rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '1rem', paddingBottom: '1.5rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 16, fontWeight: 700, color: '#fff' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' },
  userName: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  signOut: { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' },
  copy: {},
  title: { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
};

const nav = {
  wrap: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflowX: 'auto' },
  inner: { maxWidth: 680, margin: '0 auto', padding: '0 1rem', display: 'flex', gap: 2 },
  tab: {
    position: 'relative', padding: '13px 14px', fontSize: 13, fontWeight: 500,
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'color 0.2s',
  },
  tabActive: { color: '#0ea5e9', fontWeight: 600 },
  indicator: { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: 2.5, background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)', borderRadius: 2 },
};
