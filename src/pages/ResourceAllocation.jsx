import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '../utils.jsx';
import { api } from '../api.js';

const MONTHS = ['Jan-2025','Feb-2025','Mar-2025','Apr-2025','May-2025','Jun-2025',
                'Jul-2025','Aug-2025','Sep-2025','Oct-2025','Nov-2025','Dec-2025'];
const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ALLOC_COLORS = {
  'Project Atlas': '#6366f1',
  'Project Zenith': '#10b981',
  'Project Nexus': '#f59e0b',
  'Project Apollo': '#ef4444',
  'Project Orion': '#8b5cf6',
  'Project Falcon': '#06b6d4',
  'Project Nova': '#ec4899',
  'Project Vega': '#14b8a6',
  'Project Titan': '#f97316',
  'Internal – BAU': '#64748b',
  'Internal – Support': '#94a3b8',
  'Bench / Training': '#334155',
};

function getAllocColor(project) {
  return ALLOC_COLORS[project] || '#6366f1';
}

function AllocBar({ value, project }) {
  const pct = Math.min(value || 0, 100);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
      <div style={{flex:1,height:6,background:'var(--border)',borderRadius:999,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:getAllocColor(project),borderRadius:999,transition:'width 0.4s'}} />
      </div>
      <span style={{fontSize:11,color:'var(--text-muted)',width:32,textAlign:'right'}}>{pct}%</span>
    </div>
  );
}

export default function ResourceAllocation() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rmData'],
    queryFn: api.rmData,
  });
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [dept, setDept] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('Dec-2025');
  const [expanded, setExpanded] = useState(null);

  if (isLoading) return <Loading />;
  if (error) return <div className="alert-banner danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>Error Loading RM Data</h4><p>{error.message}</p></div></div>;

  const depts = ['All', ...new Set((data||[]).map(e=>e.department).filter(Boolean))].sort();

  const filtered = (data||[]).filter(e => {
    if (region !== 'All' && e.region !== region) return false;
    if (dept !== 'All' && e.department !== dept) return false;
    if (search && !e.name?.toLowerCase().includes(search.toLowerCase()) && !e.employeeId?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Aggregate unique projects across all employees for selected month
  const projectAllocMap = {};
  filtered.forEach(e => {
    const alloc = e.allocations?.[selectedMonth];
    if (alloc?.project) {
      if (!projectAllocMap[alloc.project]) projectAllocMap[alloc.project] = { count: 0, totalAlloc: 0 };
      projectAllocMap[alloc.project].count++;
      projectAllocMap[alloc.project].totalAlloc += (alloc.allocation || 0);
    }
  });
  const projectSummary = Object.entries(projectAllocMap)
    .map(([p, v]) => ({ project: p, headcount: v.count, avgAlloc: (v.totalAlloc / v.count).toFixed(0) }))
    .sort((a,b) => b.headcount - a.headcount);

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Resource Allocation (RM Data)</h2>
          <p className="section-sub">Monthly project allocations across all employees</p>
        </div>
      </div>

      {/* Month selector */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {MONTHS.map((m, i) => (
          <button
            key={m}
            className={`tab-btn ${selectedMonth === m ? 'active' : ''}`}
            onClick={() => setSelectedMonth(m)}
            style={{padding:'6px 14px',fontSize:12}}
          >
            {SHORT[i]}
          </button>
        ))}
      </div>

      {/* Project summary cards */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:12}}>
          Projects active in {selectedMonth}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {projectSummary.map((p, i) => (
            <div key={i} style={{
              padding:'8px 14px',
              background:'var(--bg-card)',
              border:`1px solid ${getAllocColor(p.project)}40`,
              borderLeft:`3px solid ${getAllocColor(p.project)}`,
              borderRadius:8,
              minWidth:160
            }}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>{p.project}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>
                👤 {p.headcount} people · avg {p.avgAlloc}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar" style={{marginBottom:16}}>
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

      {/* Employee allocation table */}
      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept · Region</th>
                <th>{selectedMonth} Project</th>
                <th>Allocation</th>
                {SHORT.map((m, i) => <th key={i} style={{fontSize:10,padding:'8px'}}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const cur = e.allocations?.[selectedMonth];
                const isExp = expanded === e.employeeId;
                return (
                  <tr key={e.employeeId} onClick={()=>setExpanded(isExp?null:e.employeeId)} style={{cursor:'pointer'}}>
                    <td>
                      <div style={{fontWeight:600,color:'var(--text-primary)'}}>{e.name}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId}</div>
                      {isExp && (
                        <div style={{marginTop:10,padding:'10px 12px',background:'var(--bg-surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8,fontWeight:600}}>FULL YEAR ALLOCATION</div>
                          {MONTHS.map((m,i) => {
                            const a = e.allocations?.[m];
                            return a?.project ? (
                              <div key={m} style={{marginBottom:6}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                                  <span style={{fontSize:11,color:'var(--text-muted)'}}>{SHORT[i]}</span>
                                  <span style={{fontSize:11,color:getAllocColor(a.project),fontWeight:600}}>{a.project}</span>
                                </div>
                                <AllocBar value={a.allocation} project={a.project} />
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{fontSize:12,color:'var(--text-secondary)'}}>{e.department}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{e.region}</div>
                    </td>
                    <td>
                      {cur?.project
                        ? <span style={{fontSize:13,fontWeight:600,color:getAllocColor(cur.project)}}>{cur.project}</span>
                        : <span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}
                    </td>
                    <td>
                      {cur?.allocation
                        ? <div><AllocBar value={cur.allocation} project={cur.project} /></div>
                        : <span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}
                    </td>
                    {MONTHS.map((m, i) => {
                      const a = e.allocations?.[m];
                      return (
                        <td key={i} style={{padding:'8px',fontSize:11,textAlign:'center'}}>
                          {a?.allocation
                            ? <span style={{color:getAllocColor(a.project),fontWeight:600}}>{a.allocation}%</span>
                            : <span style={{color:'var(--text-muted)'}}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
