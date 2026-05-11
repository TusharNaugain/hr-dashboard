import { useState } from 'react';
import { useApi, Loading, formatINR, formatUSD } from '../utils.jsx';
import { api } from '../api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#1a2235',border:'1px solid rgba(99,130,255,0.3)',borderRadius:8,padding:'10px 14px'}}>
      <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color,fontSize:13}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

export default function Finance() {
  const { data, loading } = useApi(api.finance);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [dept, setDept] = useState('All');
  const [sortBy, setSortBy] = useState('annualCTCInr');
  const [sortDir, setSortDir] = useState('desc');

  if (loading) return <Loading />;

  const depts = ['All', ...new Set((data||[]).map(e=>e.department).filter(Boolean))].sort();

  const filtered = (data||[]).filter(e => {
    if (region !== 'All' && e.region !== region) return false;
    if (dept !== 'All' && e.department !== dept) return false;
    if (search && !e.name?.toLowerCase().includes(search.toLowerCase()) && !e.employeeId?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a,b) => {
    const av = a[sortBy] || 0, bv = b[sortBy] || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const totalInr = filtered.reduce((s,e) => s+(e.annualCTCInr||0), 0);
  const totalUsd = filtered.reduce((s,e) => s+(e.annualCTCUsd||0), 0);
  const avgInr = filtered.length ? totalInr / filtered.length : 0;

  // Dept breakdown
  const deptBreakdown = {};
  (data||[]).forEach(e => {
    if (!deptBreakdown[e.department]) deptBreakdown[e.department] = { inr: 0, usd: 0, count: 0 };
    deptBreakdown[e.department].inr += (e.annualCTCInr || 0);
    deptBreakdown[e.department].usd += (e.annualCTCUsd || 0);
    deptBreakdown[e.department].count++;
  });
  const deptData = Object.entries(deptBreakdown)
    .map(([d, v]) => ({ dept: d.slice(0,12), totalUsd: Math.round(v.usd), count: v.count }))
    .sort((a,b) => b.totalUsd - a.totalUsd);

  // Region pie
  const indiaTotal = (data||[]).filter(e=>e.region==='India').reduce((s,e)=>s+(e.annualCTCUsd||0),0);
  const usTotal = (data||[]).filter(e=>e.region==='US').reduce((s,e)=>s+(e.annualCTCUsd||0),0);
  const regionPie = [
    { name: '🇮🇳 India', value: Math.round(indiaTotal) },
    { name: '🇺🇸 US', value: Math.round(usTotal) }
  ];

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => sortBy === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕';

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Finance & CTC Overview</h2>
          <p className="section-sub">Compensation data across India and US geographies</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card amber">
          <div className="stat-icon">₹</div>
          <div className="stat-value" style={{fontSize:22}}>{formatINR(totalInr)}</div>
          <div className="stat-label">Total Annual CTC (INR)</div>
          <div className="stat-sub">Monthly: {formatINR(totalInr/12)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">$</div>
          <div className="stat-value" style={{fontSize:22}}>{formatUSD(totalUsd)}</div>
          <div className="stat-label">Total Annual CTC (USD)</div>
          <div className="stat-sub">Monthly: {formatUSD(totalUsd/12)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">👤</div>
          <div className="stat-value" style={{fontSize:22}}>{formatINR(avgInr)}</div>
          <div className="stat-label">Avg CTC per Employee (INR)</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">Employees Shown</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏢 CTC by Department (USD)</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData} layout="vertical" margin={{top:0,right:20,bottom:0,left:50}}>
              <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}
                     tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="dept" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<TT />} formatter={(v)=>[`$${v.toLocaleString()}`,'Total USD']} />
              <Bar dataKey="totalUsd" radius={[0,4,4,0]} name="Total USD">
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🌐 CTC Split by Region</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={regionPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                   label={({name, value})=>`${name} $${(value/1000).toFixed(0)}k`} labelLine={{stroke:'#64748b'}}>
                <Cell fill="#f59e0b" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip formatter={(v)=>[`$${v.toLocaleString()}`]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:24,justifyContent:'center',marginTop:8}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>🇮🇳 India</div>
              <div style={{fontWeight:700,color:'var(--accent-light)'}}>{formatUSD(indiaTotal)}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>🇺🇸 US</div>
              <div style={{fontWeight:700,color:'#93c5fd'}}>{formatUSD(usTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search employee…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="All">All Regions</option>
          <option value="India">🇮🇳 India</option>
          <option value="US">🇺🇸 US</option>
        </select>
        <select className="filter-select" value={dept} onChange={e=>setDept(e.target.value)}>
          {depts.map(d=><option key={d} value={d}>{d==='All'?'All Depts':d}</option>)}
        </select>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Region</th>
                <th style={{cursor:'pointer'}} onClick={()=>toggleSort('annualCTCInr')}>Annual CTC (INR)<SortIcon col="annualCTCInr"/></th>
                <th onClick={()=>toggleSort('monthlyCTCInr')} style={{cursor:'pointer'}}>Monthly (INR)<SortIcon col="monthlyCTCInr"/></th>
                <th onClick={()=>toggleSort('annualCTCUsd')} style={{cursor:'pointer'}}>Annual CTC (USD)<SortIcon col="annualCTCUsd"/></th>
                <th onClick={()=>toggleSort('monthlyCTCUsd')} style={{cursor:'pointer'}}>Monthly (USD)<SortIcon col="monthlyCTCUsd"/></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.employeeId}>
                  <td>
                    <div style={{fontWeight:600,color:'var(--text-primary)'}}>{e.name}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId}</div>
                  </td>
                  <td style={{color:'var(--text-muted)',fontSize:13}}>{e.department}</td>
                  <td style={{color:'var(--text-muted)',fontSize:13}}>{e.region}</td>
                  <td style={{color:'var(--accent-light)',fontWeight:600}}>{formatINR(e.annualCTCInr)}</td>
                  <td style={{color:'var(--text-secondary)'}}>{formatINR(e.monthlyCTCInr)}</td>
                  <td style={{color:'#93c5fd',fontWeight:600}}>{formatUSD(e.annualCTCUsd)}</td>
                  <td style={{color:'var(--text-secondary)'}}>{formatUSD(e.monthlyCTCUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
