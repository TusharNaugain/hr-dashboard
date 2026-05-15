import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loading, riskBadge } from '../utils.jsx';
import { api } from '../api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLOR = { 'Open': '#ef4444', 'In Progress': '#f59e0b', 'Resolved': '#10b981' };
const RISK_COLOR = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' };

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#1a2235',border:'1px solid rgba(99,130,255,0.3)',borderRadius:8,padding:'10px 14px'}}>
      <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color,fontSize:13}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

export default function RiskReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['riskReport'],
    queryFn: api.riskReport,
  });
  const [filter, setFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  if (isLoading) return <Loading />;
  if (error) return <div className="alert-banner danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>Error Loading Risk Report</h4><p>{error.message}</p></div></div>;

  const filtered = (data||[]).filter(r => {
    if (filter !== 'All' && r.riskLevel !== filter) return false;
    if (regionFilter !== 'All' && r.region !== regionFilter) return false;
    return true;
  });

  // Category breakdown
  const catBreak = {};
  (data||[]).forEach(r => { catBreak[r.riskCategory] = (catBreak[r.riskCategory]||0)+1; });
  const catData = Object.entries(catBreak).map(([k,v])=>({cat:k,count:v}));

  // Status breakdown
  const statBreak = {};
  (data||[]).forEach(r => { statBreak[r.status] = (statBreak[r.status]||0)+1; });

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Risk Report</h2>
          <p className="section-sub">HR-maintained risk register — live updates reflected here</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card red">
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{(data||[]).filter(r=>r.riskLevel==='High').length}</div>
          <div className="stat-label">High Risk</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{(data||[]).filter(r=>r.riskLevel==='Medium').length}</div>
          <div className="stat-label">Medium Risk</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{(data||[]).filter(r=>r.riskLevel==='Low').length}</div>
          <div className="stat-label">Low Risk</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{(data||[]).filter(r=>r.status==='Resolved').length}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{(data||[]).filter(r=>r.status==='In Progress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{(data||[]).filter(r=>r.status==='Open').length}</div>
          <div className="stat-label">Open</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <div className="card-title">📊 Risk by Category</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={catData} margin={{top:0,right:0,bottom:0,left:-20}}>
            <XAxis dataKey="cat" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
            <Tooltip content={<TT />} />
            <Bar dataKey="count" radius={[4,4,0,0]} name="Count">
              {catData.map((_,i) => <Cell key={i} fill={['#ef4444','#f59e0b','#6366f1','#10b981'][i%4]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="toolbar" style={{marginBottom:16}}>
        <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="All">All Risk Levels</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <select className="filter-select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="All">All Regions</option>
          <option value="India">🇮🇳 India</option>
          <option value="US">🇺🇸 US</option>
        </select>
        <span style={{color:'var(--text-muted)',fontSize:13,marginLeft:8}}>{filtered.length} records</span>
      </div>

      {/* Risk cards grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
        {filtered.map((r, i) => (
          <div key={i} className="card" style={{borderLeft:`3px solid ${RISK_COLOR[r.riskLevel]||'#64748b'}`,padding:'16px 20px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{r.name}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2,fontFamily:'monospace'}}>{r.employeeId} · {r.region}</div>
              </div>
              {riskBadge(r.riskLevel)}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>CATEGORY</div>
                <div style={{fontSize:13,color:'var(--text-secondary)'}}>{r.riskCategory}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>DEPARTMENT</div>
                <div style={{fontSize:13,color:'var(--text-secondary)'}}>{r.department}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>IDENTIFIED</div>
                <div style={{fontSize:13,color:'var(--text-secondary)'}}>{r.identifiedDate}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>STATUS</div>
                <span style={{
                  fontSize:12,fontWeight:600,
                  color: STATUS_COLOR[r.status] || '#94a3b8'
                }}>● {r.status}</span>
              </div>
            </div>

            <div style={{padding:'8px 12px',background:'var(--bg-surface)',borderRadius:6,marginBottom:8}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>MITIGATION ACTION</div>
              <div style={{fontSize:13,color:'var(--text-secondary)'}}>{r.mitigationAction || '—'}</div>
            </div>

            <div style={{fontSize:11,color:'var(--text-muted)'}}>
              HR Notes: <span style={{color:'var(--text-secondary)'}}>{r.hrNotes || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
