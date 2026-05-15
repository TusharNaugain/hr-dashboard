import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '../utils.jsx';
import { api } from '../api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const MONTHS = ['Jan-2025','Feb-2025','Mar-2025','Apr-2025','May-2025','Jun-2025',
                'Jul-2025','Aug-2025','Sep-2025','Oct-2025','Nov-2025','Dec-2025'];
const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#1a2235',border:'1px solid rgba(99,130,255,0.3)',borderRadius:8,padding:'10px 14px'}}>
      <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color,fontSize:13}}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></p>)}
    </div>
  );
};

export default function Productivity() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['productivity'],
    queryFn: api.productivity,
  });
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [dept, setDept] = useState('All');
  const [selected, setSelected] = useState(null);

  if (isLoading) return <Loading />;
  if (error) return <div className="alert-banner danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>Error Loading Productivity Data</h4><p>{error.message}</p></div></div>;

  const depts = ['All', ...new Set((data||[]).map(e=>e.department).filter(Boolean))].sort();

  const filtered = (data||[]).filter(e => {
    if (region !== 'All' && e.region !== region) return false;
    if (dept !== 'All' && e.department !== dept) return false;
    if (search && !e.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Average by dept
  const deptAvg = {};
  (data||[]).forEach(e => {
    if (!deptAvg[e.department]) deptAvg[e.department] = { sum: 0, count: 0 };
    deptAvg[e.department].sum += e.overallAvg || 0;
    deptAvg[e.department].count++;
  });
  const deptData = Object.entries(deptAvg).map(([dept, v]) => ({
    dept: dept.slice(0, 12), avg: (v.sum / v.count).toFixed(2)
  })).sort((a,b) => b.avg - a.avg);

  // Monthly trend (team avg)
  const monthlyTeam = MONTHS.map((m, i) => {
    const vals = (data||[]).map(e => e.monthlyHours?.[m]).filter(v => v != null);
    return { month: SHORT[i], avg: vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : 0 };
  });

  const below8 = filtered.filter(e => e.belowEightFlag?.includes('Below'));
  const above8 = filtered.filter(e => !e.belowEightFlag?.includes('Below'));

  const selectedEmp = selected ? (data||[]).find(e => e.employeeId === selected) : null;

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Productivity Analytics</h2>
          <p className="section-sub">Average daily hours per employee — target: 8 hrs/day</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{above8.length}</div>
          <div className="stat-label">Meeting Target (≥8 hrs)</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{below8.length}</div>
          <div className="stat-label">Below 8 hrs Average</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{filtered.length > 0 ? (filtered.reduce((s,e)=>s+(e.overallAvg||0),0)/filtered.length).toFixed(2) : 0}</div>
          <div className="stat-label">Team Avg Hrs/Day</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">🔝</div>
          <div className="stat-value">{filtered.length > 0 ? Math.max(...filtered.map(e=>e.overallAvg||0)).toFixed(2) : 0}</div>
          <div className="stat-label">Top Performer Avg</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 Monthly Team Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTeam} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} domain={[6,10]} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{fill:'#6366f1',r:4}} name="Avg Hrs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🏢 Department Avg Hrs/Day</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical" margin={{top:0,right:20,bottom:0,left:40}}>
              <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} domain={[0,10]} />
              <YAxis type="category" dataKey="dept" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<TT />} />
              <Bar dataKey="avg" fill="#10b981" radius={[0,4,4,0]} name="Avg Hrs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter + Table */}
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
          {depts.map(d => <option key={d} value={d}>{d==='All'?'All Depts':d}</option>)}
        </select>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Region</th>
                {SHORT.map((m,i) => <th key={i}>{m}</th>)}
                <th>Overall Avg</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.employeeId} onClick={()=>setSelected(selected===e.employeeId?null:e.employeeId)} style={{cursor:'pointer'}}>
                  <td>
                    <div style={{fontWeight:600,color:'var(--text-primary)'}}>{e.name}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId}</div>
                    {selected === e.employeeId && (
                      <div style={{marginTop:10}}>
                        <ResponsiveContainer width="100%" height={80}>
                          <BarChart data={MONTHS.map((m,i)=>({m:SHORT[i],h:e.monthlyHours?.[m]||0}))} margin={{top:0,right:0,bottom:0,left:-20}}>
                            <XAxis dataKey="m" tick={{fill:'#64748b',fontSize:9}} axisLine={false} tickLine={false} />
                            <Bar dataKey="h" fill="#6366f1" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{e.department}</td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{e.region}</td>
                  {MONTHS.map((m,i) => {
                    const v = e.monthlyHours?.[m];
                    return (
                      <td key={i} style={{
                        color: v == null ? '#64748b' : v < 8 ? '#f87171' : '#34d399',
                        fontWeight: 500, fontSize: 12
                      }}>
                        {v != null ? v.toFixed(1) : '—'}
                      </td>
                    );
                  })}
                  <td style={{fontWeight:700,color: (e.overallAvg||0)<8?'#f87171':'#34d399'}}>
                    {e.overallAvg ? Number(e.overallAvg).toFixed(2) : '—'}
                  </td>
                  <td>
                    {e.belowEightFlag?.includes('Below')
                      ? <span className="badge badge-amber">⚠ Below</span>
                      : <span className="badge badge-green">✓ OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
