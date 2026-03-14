'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  active: boolean;
}

interface Transaction {
  id: string;
  name: string;
  date: string;
  accountId: string;
  amount: number;
  type: 'credit' | 'debit';
  logoInitials: string;
  logoColor: string;
}

interface StatCard {
  label: string;
  value: string;
  change: number;
  currency: string;
}

interface ErpDashboardProps {
  tenantId?: string;
  tenantName?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STAT_CARDS: StatCard[] = [
  { label: 'Total Revenue',  value: '248,650', change: +4.8, currency: '$' },
  { label: 'EUR Expenses',   value: '38,650',  change: -2.1, currency: '€' },
  { label: 'GBP Payroll',    value: '120,650', change: +1.3, currency: '£' },
];

const TRANSACTIONS: Transaction[] = [
  { id: '1', name: 'Stripe Payment',     date: '15 March 2026', accountId: '****4421', amount: 4280,  type: 'credit', logoInitials: 'St', logoColor: '#60a5fa' },
  { id: '2', name: 'Tbilisi Office Rent',date: '14 March 2026', accountId: '****9902', amount: 2100,  type: 'debit',  logoInitials: 'Tb', logoColor: '#f59e0b' },
  { id: '3', name: 'AWS Services',       date: '13 March 2026', accountId: '****7731', amount: 890,   type: 'debit',  logoInitials: 'Aw', logoColor: '#a78bfa' },
  { id: '4', name: 'Client Payment',     date: '12 March 2026', accountId: '****1145', amount: 12500, type: 'credit', logoInitials: 'Ps', logoColor: '#34d399' },
];

const CASHFLOW_BARS = [55, 40, 70, 45, 85, 60, 90, 55, 75, 40, 95, 65];

const QUICK_ACTIONS = [
  { icon: '⇄', label: 'Transfer' },
  { icon: '⊡', label: 'Scan' },
  { icon: '↑',  label: 'Top up' },
  { icon: '◈', label: 'Partner' },
  { icon: '%',  label: 'Promo' },
  { icon: '◎', label: 'Wallet' },
  { icon: '↗', label: 'Invest' },
  { icon: '···',label: 'More' },
];

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { icon: '⊞', text: 'Dashboard', id: 'dashboard', badge: null },
      { icon: '◈', text: 'Modules',   id: 'modules',   badge: null },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: '◉', text: 'Accounts',     id: 'accounts',     badge: '3' },
      { icon: '⊟', text: 'Transactions', id: 'transactions', badge: null },
      { icon: '◎', text: 'Invoices',     id: 'invoices',     badge: null },
      { icon: '⊠', text: 'Payroll',      id: 'payroll',      badge: null },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: '◫', text: 'Inventory',   id: 'inventory',   badge: null },
      { icon: '◭', text: 'Procurement', id: 'procurement', badge: null },
      { icon: '◱', text: 'HR & Teams',  id: 'hr',          badge: null },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: '◌', text: 'Tenants',  id: 'tenants',  badge: null },
      { icon: '⊹', text: 'Settings', id: 'settings', badge: null },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: 'linear-gradient(135deg,#f0d9a0,#c9a84c)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

function SilverText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: 'linear-gradient(135deg,#e2eaf0,#a8b4c0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ErpDashboard({
  tenantId = 'nexus-corp',
  tenantName = 'Nexus Corp',
}: ErpDashboardProps) {
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [activePeriod, setActivePeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [cardActive, setCardActive]     = useState(true);

  // CSS-in-JS token map — swap these for your design-system tokens if available
  const t = {
    bg0:     '#0d0f14',
    bg1:     '#13161d',
    bg2:     '#181c26',
    bg3:     '#1e2233',
    bg4:     '#242840',
    border:  '#2a2f45',
    border2: '#323852',
    silver:  '#a8b4c0',
    silver2: '#c8d4de',
    accent:  '#7c6fff',
    accent2: '#a899ff',
    green:   '#3ecf8e',
    red:     '#f87171',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: 600,
        maxHeight: 720,
        background: t.bg0,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        color: t.silver2,
      }}
    >
      {/* ── SIDEBAR ───────────────────────────────────── */}
      <nav
        style={{
          background: t.bg1,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 0',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '0 18px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c6fff,#5040cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            E
          </div>
          <div>
            <GoldText><div style={{ fontSize: 13, fontWeight: 600 }}>ERP-Core</div></GoldText>
            <div style={{ fontSize: 10, color: t.silver, opacity: 0.6, marginTop: 1 }}>Enterprise Suite</div>
          </div>
        </div>

        {/* Tenant selector */}
        <div style={{ padding: '14px 18px 8px' }}>
          <div style={{ background: t.bg3, border: `1px solid ${t.border2}`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.green, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 500, flex: 1, background: 'linear-gradient(135deg,#d4b86a,#a8b4c0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tenant: {tenantName}
            </span>
            <span style={{ fontSize: 10, color: t.silver, opacity: 0.6 }}>⌄</span>
          </div>
        </div>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ padding: '0 10px', marginBottom: 4 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.silver, opacity: 0.5, padding: '10px 8px 4px', fontWeight: 500 }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = item.id === activeNav;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 400, position: 'relative',
                    background: isActive ? 'linear-gradient(90deg,rgba(124,111,255,.2),rgba(124,111,255,.06))' : 'transparent',
                    color: isActive ? t.accent2 : t.silver,
                    transition: 'background .15s',
                  }}
                >
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 2.5, background: t.accent, borderRadius: '0 2px 2px 0' }} />
                  )}
                  <span style={{ fontSize: 13, opacity: 0.7, width: 16, textAlign: 'center' }}>{item.icon}</span>
                  <span style={isActive ? { background: `linear-gradient(135deg,${t.accent2},${t.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
                    {item.text}
                  </span>
                  {item.badge && (
                    <span style={{ marginLeft: 'auto', background: t.accent, color: '#fff', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 10 }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* User row */}
        <div style={{ marginTop: 'auto', padding: '14px 10px 0', borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6fff,#5040cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              GR
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, background: 'linear-gradient(135deg,#d4b86a,#a8b4c0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Giorgi R.</div>
              <div style={{ fontSize: 9, color: t.silver, opacity: 0.6 }}>Super Admin</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: t.bg1, borderBottom: `1px solid ${t.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <GoldText><span style={{ fontSize: 14, fontWeight: 600 }}>Overview</span></GoldText>
          <div style={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', width: 200, flex: 1, maxWidth: 220 }}>
            <span style={{ fontSize: 12, opacity: 0.4 }}>⌕</span>
            <input placeholder="Search modules, tenants…" style={{ background: 'none', border: 'none', outline: 'none', fontSize: 11, color: t.silver2, width: '100%', fontFamily: 'inherit' }} />
          </div>
          <TopbarBtn label="↓ Export" bg={t.bg2} border={t.border} color={t.silver2} />
          <TopbarBtn label="+ New"    bg={t.bg2} border={t.border} color={t.silver2} />
          <div style={{ width: 30, height: 30, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, position: 'relative' }}>
            🔔
            <span style={{ position: 'absolute', top: 5, right: 6, width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', border: `1.5px solid ${t.bg1}` }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, background: t.bg0 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {STAT_CARDS.map((card, i) => (
              <div key={i} style={{ background: t.bg1, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ fontSize: 10, color: t.silver, opacity: 0.65, fontWeight: 500, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {card.label} <span style={{ opacity: 0.4, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>···</span>
                </div>
                {i === 1
                  ? <SilverText><div style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 6px', fontVariantNumeric: 'tabular-nums' }}>{card.currency}{card.value}</div></SilverText>
                  : <GoldText><div style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 6px', fontVariantNumeric: 'tabular-nums' }}>{card.currency}{card.value}</div></GoldText>
                }
                <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: card.change > 0 ? t.green : t.red, fontSize: 10 }}>{card.change > 0 ? '↗' : '↘'}</span>
                  <span style={{ color: card.change > 0 ? t.green : t.red }}>{card.change > 0 ? '+' : ''}{card.change}%</span>
                  <span style={{ fontSize: 10, color: t.silver, opacity: 0.5, marginLeft: 'auto' }}>vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mid row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>

            {/* Balance card */}
            <div style={{ background: `linear-gradient(135deg,${t.bg2},${t.bg3})`, border: `1px solid ${t.border2}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: t.silver, opacity: 0.7, flex: 1, fontWeight: 500 }}>Available Balance</span>
                <div style={{ background: t.bg4, border: `1px solid ${t.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 10, color: t.silver2, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>🇺🇸 USD ⌄</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#f0d9a0,#d4b86a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14, fontVariantNumeric: 'tabular-nums' }}>
                $985,430.00
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['↑ Withdraw', '↓ Deposit', '⇄ Transfer'].map((label) => (
                  <div key={label} style={{ flex: 1, background: t.bg4, border: `1px solid ${t.border}`, borderRadius: 7, padding: 7, fontSize: 10, color: t.silver2, cursor: 'pointer', textAlign: 'center', fontWeight: 500 }}>{label}</div>
                ))}
                <div style={{ width: 28, background: t.bg4, border: `1px solid ${t.border}`, borderRadius: 7, padding: '7px 6px', fontSize: 14, color: t.silver2, cursor: 'pointer', textAlign: 'center', lineHeight: 1 }}>···</div>
              </div>
            </div>

            {/* Card widget */}
            <div style={{ background: t.bg1, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: t.silver, opacity: 0.7, fontWeight: 500, flex: 1 }}>Company Card</span>
                <div style={{ width: 22, height: 22, border: `1px solid ${t.border2}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: t.silver, opacity: 0.6 }}>+</div>
              </div>
              <div style={{ background: `linear-gradient(135deg,${t.bg3},${t.bg4})`, border: `1px solid ${t.border2}`, borderRadius: 10, padding: 12, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: t.silver, opacity: 0.4 }}>))))</span>
                  <span style={{ background: 'rgba(62,207,142,.12)', border: '1px solid rgba(62,207,142,.2)', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: t.green, fontWeight: 500 }}>● Active</span>
                  <div
                    onClick={() => setCardActive(!cardActive)}
                    style={{ width: 28, height: 16, background: cardActive ? t.green : t.border2, borderRadius: 8, position: 'relative', cursor: 'pointer', transition: 'background .2s' }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: cardActive ? 'auto' : 2, right: cardActive ? 2 : 'auto', width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s, right .2s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, color: t.silver, opacity: 0.5 }}>Treasury</div>
                    <div style={{ fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg,#d4b86a,#a8b4c0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$47,463</div>
                  </div>
                  <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 5, padding: '2px 8px', fontSize: 9, color: '#e8c97a', cursor: 'pointer' }}>Freeze ●</div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: t.bg1, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: t.silver, opacity: 0.7, fontWeight: 500, flex: 1 }}>Quick Actions</span>
                <div style={{ fontSize: 9, background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer', color: t.silver2 }}>Edit</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {QUICK_ACTIONS.map((action) => (
                  <div key={action.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 4, borderRadius: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: t.bg3, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{action.icon}</div>
                    <span style={{ fontSize: 9, color: t.silver, opacity: 0.6, textAlign: 'center' }}>{action.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>

            {/* Cashflow */}
            <div style={{ background: t.bg1, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: t.silver, opacity: 0.7, fontWeight: 500, flex: 1 }}>Cashflow</span>
                <div style={{ display: 'flex', background: t.bg3, borderRadius: 7, padding: 2, gap: 2 }}>
                  {(['Monthly', 'Yearly'] as const).map((p) => (
                    <div key={p} onClick={() => setActivePeriod(p)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontWeight: 500, color: activePeriod === p ? '#e8c97a' : t.silver, background: activePeriod === p ? t.bg1 : 'transparent', border: activePeriod === p ? `1px solid ${t.border}` : '1px solid transparent', transition: 'all .15s' }}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg,#e8c97a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
                $135,843.00
              </div>
              <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {CASHFLOW_BARS.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: (v / 100) * 55, borderRadius: '3px 3px 0 0', cursor: 'pointer', background: i % 2 === 0 ? 'linear-gradient(180deg,rgba(232,201,122,.8),rgba(201,168,76,.4))' : 'linear-gradient(180deg,rgba(200,212,222,.5),rgba(168,180,192,.2))' }} />
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            <div style={{ background: t.bg1, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: t.silver, opacity: 0.7, fontWeight: 500, flex: 1 }}>Recent Activity</span>
                <div style={{ background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 10, color: t.silver2, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>This Week ⌄</div>
              </div>
              {TRANSACTIONS.map((txn, i) => (
                <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid rgba(42,47,69,.6)` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: t.bg3, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: txn.logoColor, flexShrink: 0 }}>
                    {txn.logoInitials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, background: 'linear-gradient(135deg,#d4b86a,#a8b4c0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {txn.name}
                    </div>
                    <div style={{ fontSize: 9, color: t.silver, opacity: 0.4, marginTop: 1 }}>
                      {txn.date} · <span style={{ opacity: 0.85 }}>{txn.accountId}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', background: txn.type === 'credit' ? 'linear-gradient(135deg,#6ee7b7,#3ecf8e)' : 'linear-gradient(135deg,#fca5a5,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {txn.type === 'credit' ? '+' : '-'}${txn.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TopbarBtn({ label, bg, border, color }: { label: string; bg: string; border: string; color: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', color, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' }}>
      {label}
    </div>
  );
}
