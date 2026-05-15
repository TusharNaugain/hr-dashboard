import { Loading, daysUntil, formatINR, formatUSD, riskBadge } from '../utils.jsx';
import { api } from '../api.js';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#b87333','#5e8f63','#b8643c','#a04030','#7a6858','#4a7c8c','#9a7040','#5a7a5a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{background:'#1a2235',border:'1px solid rgba(99,130,255,0.3)',borderRadius:8,padding:'10px 14px'}}>
        <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color:p.color,fontSize:13}}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  });

  if (isLoading) return <Loading />;
  if (error) return <div className="alert-banner danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>Error Loading Dashboard</h4><p>{error.message}</p></div></div>;

  const { summary, alerts, departmentDistribution, attritionRates, riskSummary } = data;

  // Dept chart data
  const deptData = Object.entries(departmentDistribution || {})
    .map(([dept, counts]) => ({ dept: dept.slice(0,12), India: counts.India, US: counts.US, total: counts.total }))
    .sort((a, b) => b.total - a.total);

  // Attrition chart
  const attritionData = Object.entries(attritionRates || {})
    .map(([q, v]) => ({ quarter: q, exits: v.exits, rate: parseFloat(v.rate) }));

  // Risk pie
  const riskData = Object.entries(riskSummary || {})
    .filter(([,v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }));
  const riskColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  const internAlerts = alerts?.internLWDAlerts || [];
  const probAlerts = alerts?.probationAlerts || [];

  return (
    <div>
      {/* ── Alerts ── */}
      {internAlerts.length > 0 && (
        <div className="alert-banner warning">
          <span className="alert-icon">⏰</span>
          <div className="alert-content">
            <h4>Intern LWD Alert — {internAlerts.length} intern{internAlerts.length > 1 ? 's' : ''} leaving within 45 days</h4>
            <p>{internAlerts.map(e => `${e.name} (${e.lastWorkingDay}, ${daysUntil(e.lastWorkingDay)} days)`).join(' · ')}</p>
          </div>
        </div>
      )}
      {probAlerts.length > 0 && (
        <div className="alert-banner info">
          <span className="alert-icon">📋</span>
          <div className="alert-content">
            <h4>Probation Confirmation Due — {probAlerts.length} employee{probAlerts.length > 1 ? 's' : ''} within 30 days</h4>
            <p>{probAlerts.map(e => `${e.name} (${e.region})`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{summary.totalEmployees}</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-sub">🇮🇳 {summary.indiaCount} India · 🇺🇸 {summary.usCount} US</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{summary.confirmedCount}</div>
          <div className="stat-label">Confirmed</div>
          <div className="stat-sub">{((summary.confirmedCount/summary.totalEmployees)*100).toFixed(0)}% of workforce</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{summary.probationCount}</div>
          <div className="stat-label">Under Probation</div>
          <div className="stat-sub">Confirmation tracking active</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{summary.internCount}</div>
          <div className="stat-label">Interns</div>
          <div className="stat-sub">LWD monitoring active</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{summary.avgProductivityHours}</div>
          <div className="stat-label">Avg Hrs/Day</div>
          <div className="stat-sub">{summary.employeesBelowTarget} below 8hr target</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{Object.values(riskSummary || {}).reduce((a,b)=>a+b,0)}</div>
          <div className="stat-label">Active Risks</div>
          <div className="stat-sub">H:{riskSummary?.High||0} M:{riskSummary?.Medium||0} L:{riskSummary?.Low||0}</div>
        </div>
      </div>

      {/* ── CTC Cards ── */}
      <div className="grid-2" style={{marginBottom:28}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="icon-badge" style={{background:'rgba(245,158,11,0.15)'}}>₹</div>
              Total Annual CTC (INR)
            </div>
          </div>
          <div style={{fontSize:32,fontWeight:800,color:'var(--accent-light)'}}>{formatINR(summary.totalAnnualCTCInr)}</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>Monthly: {formatINR(summary.totalAnnualCTCInr / 12)}</div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="icon-badge" style={{background:'rgba(59,130,246,0.15)'}}>$</div>
              Total Annual CTC (USD)
            </div>
          </div>
          <div style={{fontSize:32,fontWeight:800,color:'#93c5fd'}}>{formatUSD(summary.totalAnnualCTCUsd)}</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>Monthly: {formatUSD(summary.totalAnnualCTCUsd / 12)}</div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid-2" style={{marginBottom:28}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="icon-badge" style={{background:'rgba(99,102,241,0.15)'}}>📊</div>Headcount by Department</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="dept" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize:12,color:'#94a3b8'}} />
              <Bar dataKey="India" fill="#f59e0b" radius={[4,4,0,0]} name="India" />
              <Bar dataKey="US" fill="#3b82f6" radius={[4,4,0,0]} name="US" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="icon-badge" style={{background:'rgba(239,68,68,0.15)'}}>📈</div>Quarterly Attrition</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attritionData} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="quarter" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="exits" fill="#ef4444" radius={[4,4,0,0]} name="Exits" />
              <Bar dataKey="rate" fill="#f59e0b" radius={[4,4,0,0]} name="Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Risk + Recent ── */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="icon-badge" style={{background:'rgba(239,68,68,0.15)'}}>🎯</div>Risk Level Distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,value})=>`${name}: ${value}`}
                   labelLine={{stroke:'#64748b'}}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={riskColors[entry.name] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8}}>
            {riskData.map(r => (
              <div key={r.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:13}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:riskColors[r.name]}}/>
                <span style={{color:'var(--text-muted)'}}>{r.name}: <strong style={{color:'var(--text-primary)'}}>{r.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="icon-badge" style={{background:'rgba(239,68,68,0.15)'}}>🚨</div>Recent Risks</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {(data.recentRisks || []).map((r, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'var(--bg-surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{flexShrink:0,fontSize:20}}>
                  {r.riskLevel === 'High' ? '🔴' : r.riskLevel === 'Medium' ? '🟡' : '🟢'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{r.riskCategory}</div>
                </div>
                <div style={{flexShrink:0}}>
                  {riskBadge(r.riskLevel)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
