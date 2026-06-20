import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert } from '../../components/UI';
import api from '../../utils/api';

const CONFIG_SCHEMA = {
  cooldown_days: {
    label: 'Reissue Cooldown',
    icon: '🔄',
    group: 'Borrowing Rules',
    tooltip: 'Minimum number of days a student must wait before borrowing the same book again after returning it.',
    options: [1,2,3,4,5,6,7].map(d => ({ value: String(d), label: `${d} Day${d > 1 ? 's' : ''}` })),
  },
  issue_duration_days: {
    label: 'Loan Period — Students',
    icon: '🎓',
    group: 'Borrowing Rules',
    tooltip: 'How many days a student is allowed to keep a borrowed book before it becomes overdue.',
    options: [1,2,3,4,5,6,7].map(d => ({ value: String(d), label: `${d} Day${d > 1 ? 's' : ''}` })),
  },
  issue_duration_days_teacher: {
    label: 'Loan Period — Teachers',
    icon: '👨‍🏫',
    group: 'Borrowing Rules',
    tooltip: 'How many days a teacher can keep a borrowed book. Set to "Unlimited" to allow teachers to hold books indefinitely.',
    options: [
      { value: '0',   label: 'Unlimited' },
      { value: '7',   label: '7 Days' },
      { value: '14',  label: '14 Days' },
      { value: '30',  label: '30 Days' },
      { value: '60',  label: '60 Days' },
      { value: '90',  label: '90 Days' },
      { value: '180', label: '180 Days' },
      { value: '365', label: '1 Year' },
    ],
  },
  max_books_per_student: {
    label: 'Max Books Per Student',
    icon: '📚',
    group: 'Borrowing Rules',
    tooltip: 'The maximum number of books a student can have issued at the same time. Cannot exceed 3.',
    options: [
      { value: '1', label: '1 Book' },
      { value: '2', label: '2 Books' },
      { value: '3', label: '3 Books (Maximum)' },
    ],
  },
  fine_per_day: {
    label: 'Late Fine Per Day',
    icon: '₹',
    group: 'Fine Settings',
    tooltip: 'The fixed amount charged per day for every day a book is returned late. Cannot exceed ₹10.',
    options: [1,2,3,4,5,6,7,8,9,10].map(n => ({ value: String(n), label: `₹${n} per day` })),
  },
};

const GROUP_ORDER = ['Borrowing Rules', 'Fine Settings'];
const GROUP_ICONS = { 'Borrowing Rules': '📋', 'Fine Settings': '💰' };

function Tip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 5 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 16, height: 16, borderRadius: '50%', background: 'var(--border)',
          color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, cursor: 'default',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none',
        }}
      >?</span>
      {show && (
        <span style={{
          position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)',
          background: '#1a1a2e', color: '#e2e8f0', fontSize: 11.5, lineHeight: 1.45,
          padding: '7px 10px', borderRadius: 6, width: 230, zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function SettingRow({ configKey, schema, currentValue, onSaved }) {
  const [selected, setSelected] = useState(String(currentValue ?? schema.options[0].value));
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const isDirty = selected !== String(currentValue);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/config', { key: configKey, value: selected });
      setSaved(true);
      onSaved(configKey, selected);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const displayValue = schema.options.find(o => o.value === String(currentValue))?.label ?? currentValue;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
      alignItems: 'center', padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 15 }}>{schema.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{schema.label}</span>
          <Tip text={schema.tooltip} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 21 }}>
          Currently set to: <strong style={{ color: 'var(--text)' }}>{displayValue}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ width: 160, fontSize: 13 }}
        >
          {schema.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          className={`btn btn-sm ${saved ? 'btn-success' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{ minWidth: 72 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AdminConfig() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => {
        const map = {};
        (r.data.data || []).forEach(c => { map[c.key] = c.value; });
        if (map.issue_duration_days_teacher === undefined) map.issue_duration_days_teacher = '0';
        setConfigs(map);
      })
      .catch(() => setAlert({ type: 'error', msg: 'Could not load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (key, value) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
    setAlert({ type: 'success', msg: `"${CONFIG_SCHEMA[key]?.label ?? key}" updated successfully.` });
  };

  const grouped = GROUP_ORDER.map(group => ({
    group,
    keys: Object.entries(CONFIG_SCHEMA)
      .filter(([, s]) => s.group === group)
      .map(([k]) => k),
  }));

  return (
    <Layout title="Library Settings">
      <div className="page-header">
        <div>
          <h2 className="page-title">Library Settings</h2>
          <p className="page-sub">Configure borrowing rules and fine policies for your library</p>
        </div>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      {loading ? <Spinner /> : (
        <div style={{ maxWidth: 680 }}>
          <div style={{
            background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.15)',
            borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5,
            color: 'var(--text-muted)',
          }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>ℹ️</span>
            <span>
              All changes take effect <strong>immediately</strong> for new transactions.
              Existing issued books are not affected by duration changes.
              Hover the <strong>?</strong> icon next to any setting for more details.
            </span>
          </div>

          {grouped.map(({ group, keys }) => (
            <div className="card" key={group} style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">{GROUP_ICONS[group]} {group}</span>
              </div>
              <div>
                {keys.map((k, idx) => {
                  const schema = CONFIG_SCHEMA[k];
                  const val    = configs[k];
                  if (val === undefined) return null;
                  return (
                    <div key={k} style={idx === keys.length - 1 ? { borderBottom: 'none' } : {}}>
                      <SettingRow
                        configKey={k}
                        schema={schema}
                        currentValue={val}
                        onSaved={handleSaved}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{
            background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--amber)' }}>⚠ Enforced Limits</strong><br />
            Cooldown &amp; Loan periods: 1–7 days for students &nbsp;·&nbsp;
            Max books: 1–3 per student &nbsp;·&nbsp;
            Fine: ₹1–₹10 per day &nbsp;·&nbsp;
            Teacher loan period: Unlimited or fixed days
          </div>
        </div>
      )}
    </Layout>
  );
}
