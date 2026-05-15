import { useQuery } from '@tanstack/react-query';
import { Loading, daysUntil, avatarClass, initials } from '../utils.jsx';
import { api } from '../api.js';

export default function Alerts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  });

  if (isLoading) return <Loading />;
  if (error) return <div className="alert-banner danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>Error Loading Alerts</h4><p>{error.message}</p></div></div>;

  const internAlerts = data?.alerts?.internLWDAlerts || [];
  const probAlerts = data?.alerts?.probationAlerts || [];

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">HR Alerts & Notifications</h2>
          <p className="section-sub">Auto-generated alerts for intern LWDs and probation confirmations</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <span className="badge badge-amber">⏰ {internAlerts.length} Intern Alerts</span>
          <span className="badge badge-blue">📋 {probAlerts.length} Probation Alerts</span>
        </div>
      </div>

      {internAlerts.length === 0 && probAlerts.length === 0 && (
        <div className="alert-banner success">
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <h4>All Clear</h4>
            <p>No intern LWDs or probation confirmations are due in the next 45 days.</p>
          </div>
        </div>
      )}

      {/* Intern LWD Alerts */}
      {internAlerts.length > 0 && (
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <span style={{fontSize:20}}>⏰</span>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--accent-light)'}}>Intern Last Working Day Alerts</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Interns with LWD within the next 45 days</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
            {internAlerts.map((e, i) => {
              const d = daysUntil(e.lastWorkingDay);
              const urgency = d <= 7 ? 'red' : d <= 21 ? 'amber' : 'blue';
              return (
                <div key={i} style={{
                  padding:'16px 20px',
                  background:'var(--bg-card)',
                  border:`1px solid ${urgency==='red'?'rgba(239,68,68,0.4)':urgency==='amber'?'rgba(245,158,11,0.4)':'rgba(99,102,241,0.3)'}`,
                  borderRadius:10,
                  borderLeft:`4px solid ${urgency==='red'?'#ef4444':urgency==='amber'?'#f59e0b':'#6366f1'}`
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div className={avatarClass(e.name)} style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>
                      {initials(e.name)}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{e.name}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{e.designation} · {e.department}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId} · {e.region}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'var(--bg-surface)',borderRadius:8}}>
                    <div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>LAST WORKING DAY</div>
                      <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{e.lastWorkingDay}</div>
                    </div>
                    <div style={{
                      padding:'8px 14px',
                      borderRadius:8,
                      background: urgency==='red'?'rgba(239,68,68,0.15)':urgency==='amber'?'rgba(245,158,11,0.15)':'rgba(99,102,241,0.15)',
                      color: urgency==='red'?'#f87171':urgency==='amber'?'#fbbf24':'#818cf8',
                      fontWeight:700,fontSize:18
                    }}>
                      {d}d
                    </div>
                  </div>
                  <div style={{marginTop:10,fontSize:12,color:urgency==='red'?'#f87171':urgency==='amber'?'#fbbf24':'var(--text-muted)',fontWeight:500}}>
                    {urgency==='red'?'🚨 Urgent — Action required immediately!':
                     urgency==='amber'?'⚠️ Due soon — Initiate offboarding process':
                     '📋 Upcoming — Plan knowledge transfer'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Probation Alerts */}
      {probAlerts.length > 0 && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <span style={{fontSize:20}}>📋</span>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:'#93c5fd'}}>Probation Confirmation Alerts</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Employees due for confirmation within 30 days</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
            {probAlerts.map((e, i) => {
              const doj = new Date(e.dateOfJoining);
              const confirmDate = new Date(doj);
              confirmDate.setMonth(confirmDate.getMonth() + 6);
              const confirmStr = confirmDate.toISOString().split('T')[0];
              const d = daysUntil(confirmStr);
              return (
                <div key={i} style={{
                  padding:'16px 20px',
                  background:'var(--bg-card)',
                  border:'1px solid rgba(59,130,246,0.4)',
                  borderRadius:10,
                  borderLeft:'4px solid #3b82f6'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div className={avatarClass(e.name)} style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>
                      {initials(e.name)}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{e.name}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{e.designation} · {e.department}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.employeeId} · {e.region}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{padding:'8px 12px',background:'var(--bg-surface)',borderRadius:6}}>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>DATE OF JOINING</div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{e.dateOfJoining}</div>
                    </div>
                    <div style={{padding:'8px 12px',background:'rgba(59,130,246,0.1)',borderRadius:6,border:'1px solid rgba(59,130,246,0.3)'}}>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>CONFIRM BY</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#93c5fd'}}>{confirmStr} ({d}d)</div>
                    </div>
                  </div>
                  <div style={{marginTop:10,fontSize:12,color:'#93c5fd',fontWeight:500}}>
                    📋 Schedule confirmation review meeting
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{marginTop:32,padding:'16px 20px',background:'var(--bg-card)',borderRadius:10,border:'1px solid var(--border)'}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-secondary)',marginBottom:12}}>Alert Logic</div>
        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            ⏰ <strong style={{color:'var(--text-secondary)'}}>Intern LWD Alert:</strong> Triggers when LWD ≤ 45 days from today
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            📋 <strong style={{color:'var(--text-secondary)'}}>Probation Alert:</strong> Triggers when DOJ + 6 months ≤ 30 days from today
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            🚨 <strong style={{color:'#f87171'}}>Urgent:</strong> ≤ 7 days · ⚠️ <strong style={{color:'#fbbf24'}}>Soon:</strong> ≤ 21 days
          </div>
        </div>
      </div>
    </div>
  );
}
