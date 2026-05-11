import { useState } from 'react';
import { useApi, Loading, avatarClass, initials } from '../utils.jsx';
import { api } from '../api.js';

const DEPT_COLORS = {
  'HR': '#6366f1', 'Engineering': '#10b981', 'Finance': '#f59e0b', 'Sales': '#ef4444',
  'Product': '#8b5cf6', 'Operations': '#06b6d4', 'Marketing': '#ec4899',
  'Legal': '#14b8a6', 'Design': '#f97316', 'Data Science': '#84cc16'
};

function getDeptColor(dept) { return DEPT_COLORS[dept] || '#6366f1'; }

function OrgNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.reports && node.reports.length > 0;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 28, marginTop: 8 }}>
      <div
        onClick={() => hasChildren && setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: 'var(--bg-card)',
          border: `1px solid ${getDeptColor(node.department)}30`,
          borderLeft: `3px solid ${getDeptColor(node.department)}`,
          borderRadius: 8,
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.2s',
          maxWidth: 340
        }}
        onMouseEnter={e => { if (hasChildren) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
      >
        <div
          className={avatarClass(node.name)}
          style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
        >
          {initials(node.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.designation}</div>
          <div style={{ fontSize: 10, color: getDeptColor(node.department), fontWeight: 600, marginTop: 2 }}>{node.department} · {node.region}</div>
        </div>
        {hasChildren && (
          <div style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</div>
        )}
        {hasChildren && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 10 }}>
            {node.reports.length}
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div style={{ marginLeft: 20, paddingLeft: 8, borderLeft: `1px dashed var(--border)` }}>
          {node.reports.map((child, i) => (
            <OrgNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const { data, loading } = useApi(api.orgChart);
  const [filterDept, setFilterDept] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [search, setSearch] = useState('');

  if (loading) return <Loading />;

  const { nodes = [], roots = [] } = data || {};

  const depts = ['All', ...new Set(nodes.map(n=>n.department).filter(Boolean))].sort();

  // Dept distribution
  const deptCount = {};
  nodes.forEach(n => { deptCount[n.department] = (deptCount[n.department]||0)+1; });

  const filteredRoots = filterDept === 'All' && filterRegion === 'All' && !search ? roots :
    roots.filter(n => {
      const q = search.toLowerCase();
      const match = !search || n.name?.toLowerCase().includes(q);
      const deptMatch = filterDept === 'All' || n.department === filterDept;
      const regionMatch = filterRegion === 'All' || n.region === filterRegion;
      return match && deptMatch && regionMatch;
    });

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h2 className="section-title">Org Chart</h2>
          <p className="section-sub">Reporting hierarchy of all active employees — click to expand/collapse</p>
        </div>
      </div>

      {/* Dept distribution */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        {Object.entries(deptCount).sort((a,b)=>b[1]-a[1]).map(([d,c]) => (
          <div key={d} style={{
            padding:'6px 12px',
            background:'var(--bg-card)',
            border:`1px solid ${getDeptColor(d)}30`,
            borderLeft:`3px solid ${getDeptColor(d)}`,
            borderRadius:6,
            fontSize:12,
            color:'var(--text-secondary)',
            cursor:'pointer'
          }} onClick={()=>setFilterDept(filterDept===d?'All':d)}>
            {d}: <strong style={{color:getDeptColor(d)}}>{c}</strong>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="toolbar" style={{marginBottom:24}}>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by name…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
          {depts.map(d=><option key={d} value={d}>{d==='All'?'All Depts':d}</option>)}
        </select>
        <select className="filter-select" value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
          <option value="All">All Regions</option>
          <option value="India">🇮🇳 India</option>
          <option value="US">🇺🇸 US</option>
        </select>
        <span style={{color:'var(--text-muted)',fontSize:13}}>
          {nodes.length} total employees · {roots.length} top-level managers
        </span>
      </div>

      {/* Org tree */}
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:16}}>
          {filteredRoots.length === 0 ? (
            <div style={{color:'var(--text-muted)',fontSize:14}}>No results found.</div>
          ) : (
            filteredRoots.map((node, i) => (
              <div key={i} style={{background:'var(--bg-surface)',borderRadius:10,padding:16,border:'1px solid var(--border)'}}>
                <OrgNode node={node} depth={0} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
