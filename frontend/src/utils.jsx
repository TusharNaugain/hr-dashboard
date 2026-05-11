import { useState, useEffect } from 'react';

export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}

export function avatarClass(name) {
  const classes = ['av-1','av-2','av-3','av-4','av-5','av-6','av-7','av-8'];
  let hash = 0;
  for (let c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) % 8;
  return classes[hash];
}

export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function formatINR(n) {
  if (!n) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatUSD(n) {
  if (!n) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function daysUntil(dateStr) {
  if (!dateStr || dateStr === 'N/A') return null;
  const today = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

export function statusBadge(status) {
  if (!status) return <span className="badge badge-gray">—</span>;
  if (status === 'Confirmed') return <span className="badge badge-green">✓ Confirmed</span>;
  if (status === 'Under Probation') return <span className="badge badge-amber">⏳ Probation</span>;
  if (status === 'Intern') return <span className="badge badge-blue">🎓 Intern</span>;
  return <span className="badge badge-gray">{status}</span>;
}

export function regionBadge(region) {
  if (region === 'India') return <span className="badge badge-india">🇮🇳 India</span>;
  if (region === 'US') return <span className="badge badge-us">🇺🇸 US</span>;
  return <span className="badge badge-gray">{region}</span>;
}

export function riskBadge(level) {
  if (!level) return null;
  if (level === 'High') return <span className="badge badge-red">🔴 High</span>;
  if (level === 'Medium') return <span className="badge badge-amber">🟡 Medium</span>;
  if (level === 'Low') return <span className="badge badge-green">🟢 Low</span>;
  return <span className="badge badge-gray">{level}</span>;
}

export function Loading() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p className="loading-text">Loading data…</p>
    </div>
  );
}
