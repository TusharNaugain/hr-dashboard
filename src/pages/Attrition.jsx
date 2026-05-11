import { useState } from 'react';
import { useApi, Loading } from '../utils.jsx';
import { api } from '../api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';

const QUARTERS = ['Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025'];
const COLORS = ['#ef4444','#f59e0b','#6366f1','#10b981','#8b5cf6','#06b6d4'];
const EXIT_COLORS = { 'Resignation': '#ef4444', 'Personal Reasons': '#f59e0b', 'Performance': '#8b5cf6', 'Internship Completed': '#10b981', 'Better Opportunity': '#06b6d4', 'Higher Studies': '#ec4899' };

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#1a2235',border:'1px solid rgba(99,130,255,0.3)',borderRadius:8,padding:'10px 14px'}}>
      <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color||'#f1f5f9',fontSize:13}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

export default function Attrition() {
  const { data: offboarded, loading: oLoading } = useApi(api.offboarded);
  const { data: employees, loading: eLoading } = useApi(api.employees);
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  if (oLoading || eLoading) return <Loading />;

  const activeCount = (employees||[]).length;

  // By quarter
  const byQ = {};
  QUARTERS.forEach(q => { byQ[q] = { count: 0, region: { India: 0, US: 0 } }; });
  (offboarded||[]).forEach(e => {
    if (e.exitQuarter && byQ[e.exitQuarter]) {
      byQ[e.exitQuarter].count++;
      byQ[e.exitQuarter].region[e.region] = (byQ[e.exitQuarter].region[e.region]||0) + 1;
    }
  });
  const qData = QUARTERS.map(q => ({
    quarter: q,
    exits: byQ[q].count,
    rate: ((byQ[q].count / activeCount) * 100).toFixed(1),
    India: byQ[q].region.India,
    US: byQ[q].region.US
  }));

  // Exit reasons
  const reasons = {};
  (offboarded||[]).forEach(e => { reasons[e.exitReason] = (reasons[e.exitReason]||0)+1; });
  const reasonData = Object.entries(reasons).map(([r,v])=>({ reason: r, count: v })).sort((a,b)=>b.count-a.count);

  const filtered = (offboarded||[]).filter(e => {
    if (quarterFilter !== 'All' && e.exitQuarter !== quarterFilter) return false;
    if (regionFilter !== 'All' && e.region !== regionFilter) return false;
    return true;
  });

  const rehireYes = (offboarded||[]).filter(e=>e.rehireEligible==='Yes').length;
  const noticeSaved = (offboarded||[]).filter(e=>e.noticePeriodServed==='Yes').length;
  const totalExits = (offboarded||[]).length;

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Attrition & Offboarding</h2>
          <p className="section-sub">Auto-calculated from Offboarded Resources — quarterly attrition tracking</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card red">
          <div className="stat-icon">📤</div>
          <div className="stat-value">{totalExits}</div>
          <div className="stat-label">Total Exits (2025)</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{((totalExits/activeCount)*100).toFixed(1)}%</div>
          <div className="stat-label">Overall Attrition Rate</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{rehireYes}</div>
          <div className="stat-label">Rehire Eligible</div>
          <div className="stat-sub">{((rehireYes/totalExits)*100).toFixed(0)}% of exits</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{noticeSaved}</div>
          <div className="stat-label">Served Notice Period</div>
          <div className="stat-sub">{((noticeSaved/totalExits)*100).toFixed(0)}% compliance</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 Quarterly Attrition</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={qData} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="quarter" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="India" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} name="India" />
              <Bar dataKey="US" stackId="a" fill="#3b82f6" radius={[4,4,0,0]} name="US" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:24,justifyContent:'center',marginTop:8}}>
            {qData.map(q => (
              <div key={q.quarter} style={{textAlign:'center'}}>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{q.quarter}</div>
                <div style={{fontSize:14,fontWeight:700,color:'#f87171'}}>{q.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 Exit Reasons</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={reasonData} cx="50%" cy="50%" outerRadius={75} dataKey="count"
                   label={({reason,count})=>`${reason.slice(0,12)}: ${count}`} labelLine={{stroke:'#64748b'}}>
                {reasonData.map((e,i) => <Cell key={i} fill={EXIT_COLORS[e.reason]||COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip content={<TT />} formatter={(v)=>[v,'Exits']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="toolbar" style={{marginBottom:16}}>
        <select className="filter-select" value={quarterFilter} onChange={e=>setQuarterFilter(e.target.value)}>
          <option value="All">All Quarters</option>
          {QUARTERS.map(q=><option key={q} value={q}>{q}</option>)}
        </select>
        <select className="filter-select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="All">All Regions</option>
          <option value="India">🇮🇳 India</option>
          <option value="US">🇺🇸 US</option>
        </select>
        <span style={{color:'var(--text-muted)',fontSize:13}}>{filtered.length} exits</span>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Region</th>
                <th>Date of Joining</th>
                <th>Last Working Day</th>
                <th>Exit Quarter</th>
                <th>Exit Reason</th>
                <th>Notice Period</th>
                <th>Rehire Eligible</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.employeeId}>
                  <td>
                    <div style={{fontWeight:600,color:'var(--text-primary)'}}>{e.name}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId}</div>
                  </td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{e.department}</td>
                  <td style={{color:'var(--text-secondary)',fontSize:12}}>{e.designation}</td>
                  <td style={{fontSize:12}}>{e.region}</td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{e.dateOfJoining}</td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{e.lastWorkingDay}</td>
                  <td><span className="badge badge-purple">{e.exitQuarter}</span></td>
                  <td>
                    <span style={{fontSize:12,color: EXIT_COLORS[e.exitReason]||'#94a3b8',fontWeight:500}}>
                      {e.exitReason}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${e.noticePeriodServed==='Yes'?'badge-green':'badge-red'}`}>
                      {e.noticePeriodServed==='Yes'?'✓ Yes':'✗ No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${e.rehireEligible==='Yes'?'badge-green':'badge-gray'}`}>
                      {e.rehireEligible==='Yes'?'✓ Yes':'No'}
                    </span>
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
