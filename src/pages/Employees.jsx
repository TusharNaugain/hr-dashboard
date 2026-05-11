import { useState } from 'react';
import { useApi, Loading, avatarClass, initials, statusBadge, regionBadge, daysUntil } from '../utils.jsx';
import { api } from '../api.js';

export default function Employees() {
  const { data: employees, loading } = useApi(api.employees);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [view, setView] = useState('table');
  const [expandedEmp, setExpandedEmp] = useState(null);

  if (loading) return <Loading />;

  const depts = ['All', ...new Set((employees || []).map(e => e.department).filter(Boolean))].sort();

  const filtered = (employees || []).filter(e => {
    if (region !== 'All' && e.region !== region) return false;
    if (dept !== 'All' && e.department !== dept) return false;
    if (status !== 'All' && e.employmentStatus !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.name?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q) ||
             e.designation?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) ||
             e.skillset?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Employee Directory</h2>
          <p className="section-sub">{filtered.length} of {(employees||[]).length} employees shown</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className={`btn ${view==='table'?'btn-primary':'btn-outline'}`} onClick={()=>setView('table')}>☰ Table</button>
          <button className={`btn ${view==='cards'?'btn-primary':'btn-outline'}`} onClick={()=>setView('cards')}>⊞ Cards</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by name, ID, designation, skill…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="All">🌐 All Regions</option>
          <option value="India">🇮🇳 India</option>
          <option value="US">🇺🇸 US</option>
        </select>
        <select className="filter-select" value={dept} onChange={e=>setDept(e.target.value)}>
          {depts.map(d=><option key={d} value={d}>{d === 'All' ? '🏢 All Depts' : d}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Under Probation">Under Probation</option>
          <option value="Intern">Intern</option>
        </select>
      </div>

      {view === 'table' ? (
        <div className="card" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Reporting Manager</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Date of Joining</th>
                  <th>LWD / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const lwd = e.lastWorkingDay && e.lastWorkingDay !== 'N/A' ? daysUntil(e.lastWorkingDay) : null;
                  return (
                    <tr key={e.employeeId} onClick={()=>setExpandedEmp(expandedEmp===e.employeeId ? null : e.employeeId)} style={{cursor:'pointer'}}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div className={`emp-avatar ${avatarClass(e.name)}`} style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>
                            {initials(e.name)}
                          </div>
                          <span className="td-name">{e.name}</span>
                        </div>
                        {expandedEmp === e.employeeId && (
                          <div style={{marginTop:8,padding:'10px 12px',background:'var(--bg-surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Skillset</div>
                            <div style={{fontSize:13,color:'var(--text-secondary)'}}>{e.skillset || '—'}</div>
                            {e.currentAllocation && (
                              <div style={{marginTop:8}}>
                                <span className="badge badge-blue">Allocation: {e.currentAllocation}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td><span className="td-id">{e.employeeId}</span></td>
                      <td>{e.department}</td>
                      <td style={{color:'var(--text-primary)'}}>{e.designation}</td>
                      <td>{e.reportingManager}</td>
                      <td>{regionBadge(e.region)}</td>
                      <td>{statusBadge(e.employmentStatus)}</td>
                      <td style={{color:'var(--text-muted)',fontSize:12}}>{e.dateOfJoining}</td>
                      <td>
                        {lwd !== null ? (
                          <span className={`badge ${lwd <= 7 ? 'badge-red' : lwd <= 30 ? 'badge-amber' : 'badge-blue'}`}>
                            {lwd <= 0 ? 'Today' : `${lwd}d left`}
                          </span>
                        ) : <span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(e => {
            const lwd = e.lastWorkingDay && e.lastWorkingDay !== 'N/A' ? daysUntil(e.lastWorkingDay) : null;
            return (
              <div key={e.employeeId} className="emp-card">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div className={`emp-avatar ${avatarClass(e.name)}`} style={{width:46,height:46,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,flexShrink:0}}>
                    {initials(e.name)}
                  </div>
                  <div>
                    <div className="emp-name">{e.name}</div>
                    <div className="emp-role">{e.designation}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,fontFamily:'monospace'}}>{e.employeeId}</div>
                  </div>
                </div>
                <div className="emp-meta">
                  {regionBadge(e.region)}
                  {statusBadge(e.employmentStatus)}
                  <span className="badge badge-gray">🏢 {e.department}</span>
                </div>
                {e.reportingManager && (
                  <div style={{marginTop:10,fontSize:12,color:'var(--text-muted)'}}>
                    📊 Reports to: <span style={{color:'var(--text-secondary)'}}>{e.reportingManager}</span>
                  </div>
                )}
                {e.dateOfJoining && (
                  <div style={{marginTop:4,fontSize:12,color:'var(--text-muted)'}}>
                    📅 Joined: <span style={{color:'var(--text-secondary)'}}>{e.dateOfJoining}</span>
                  </div>
                )}
                {lwd !== null && (
                  <div style={{marginTop:8}}>
                    <span className={`badge ${lwd <= 7 ? 'badge-red' : lwd <= 30 ? 'badge-amber' : 'badge-blue'}`}>
                      ⏰ LWD: {e.lastWorkingDay} ({lwd}d)
                    </span>
                  </div>
                )}
                {e.skillset && (
                  <div style={{marginTop:10,fontSize:11,color:'var(--text-muted)',lineHeight:1.5}}>
                    🛠️ {e.skillset}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
