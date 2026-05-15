import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Finance from './pages/Finance.jsx';
import Productivity from './pages/Productivity.jsx';
import ResourceAllocation from './pages/ResourceAllocation.jsx';
import RiskReport from './pages/RiskReport.jsx';
import Attrition from './pages/Attrition.jsx';
import OrgChart from './pages/OrgChart.jsx';
import Alerts from './pages/Alerts.jsx';
import { api } from './api.js';
import { useAutoRefresh } from './useAutoRefresh.js';

const NAV = [
  { id: 'dashboard', label: 'Overview', icon: '📊', section: 'MAIN' },
  { id: 'alerts', label: 'HR Alerts', icon: '🔔', section: 'MAIN', alertKey: true },
  { id: 'employees', label: 'Employees', icon: '👥', section: 'DATA' },
  { id: 'org', label: 'Org Chart', icon: '🌳', section: 'DATA' },
  { id: 'productivity', label: 'Productivity', icon: '⏱️', section: 'ANALYTICS' },
  { id: 'finance', label: 'Finance & CTC', icon: '💰', section: 'ANALYTICS' },
  { id: 'rm', label: 'Resource Allocation', icon: '📋', section: 'ANALYTICS' },
  { id: 'risk', label: 'Risk Report', icon: '⚠️', section: 'ANALYTICS' },
  { id: 'attrition', label: 'Attrition', icon: '📤', section: 'ANALYTICS' },
];

const PAGE_TITLES = {
  dashboard: { title: 'HR Overview', sub: 'Consolidated insights across all geographies' },
  alerts: { title: 'HR Alerts', sub: 'Intern LWDs and probation confirmations' },
  employees: { title: 'Employee Directory', sub: 'All active employees — India & US' },
  org: { title: 'Org Chart', sub: 'Reporting hierarchy of active employees' },
  productivity: { title: 'Productivity', sub: 'Average daily hours per employee — 2025' },
  finance: { title: 'Finance & CTC', sub: 'Compensation data in INR and USD' },
  rm: { title: 'Resource Allocation', sub: 'Monthly project assignments (RM Data)' },
  risk: { title: 'Risk Report', sub: 'HR-maintained risk register — live data' },
  attrition: { title: 'Attrition', sub: 'Quarterly attrition from Offboarded Resources' },
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const queryClient = useQueryClient();

  // ── Refresh notification toast ──
  const [showToast, setShowToast] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  });

  const alertCount = (dashboardData?.alerts?.internLWDAlerts?.length || 0) + 
                   (dashboardData?.alerts?.probationAlerts?.length || 0);

  // ── Auto-refresh: SSE listener ──
  useAutoRefresh(useCallback(() => {
    queryClient.invalidateQueries(); // Invalidate all queries to trigger re-fetch
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  }, [queryClient]));

  const sections = [...new Set(NAV.map(n => n.section))];

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'employees': return <Employees />;
      case 'org': return <OrgChart />;
      case 'productivity': return <Productivity />;
      case 'finance': return <Finance />;
      case 'rm': return <ResourceAllocation />;
      case 'risk': return <RiskReport />;
      case 'attrition': return <Attrition />;
      case 'alerts': return <Alerts />;
      default: return <Dashboard />;
    }
  };

  const { title, sub } = PAGE_TITLES[page] || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="app-layout">
      {/* ── Auto-refresh Toast ── */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: 'linear-gradient(135deg,#10b981,#34d399)',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
          animation: 'slideUp 0.3s ease'
        }}>
          <span style={{ fontSize: 18 }}>🔄</span>
          Excel file changed — dashboard refreshed!
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏢</div>
          <div className="logo-text">
            <h2>HR Automation</h2>
            <span>Dashboard v1.0</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => {
            const items = NAV.filter(n => n.section === section);
            return (
              <div key={section}>
                <div className="nav-section-title">{section}</div>
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`nav-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => setPage(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {item.alertKey && alertCount > 0 && (
                      <span className="nav-badge">{alertCount}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>📁 HR_Dashboard_Data.xlsx</div>
            <div style={{ color: 'var(--secondary-light)', fontWeight: 600 }}>🔄 Auto-refresh: ON</div>
            <div style={{ marginTop: 2 }}>Save Excel → dashboard updates instantly</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{title}</h1>
            <p>{sub}</p>
          </div>
          <div className="topbar-actions">
            <div className="topbar-badge">
              <span className="dot"></span>
              Live Data
            </div>
            <div className="topbar-badge" style={{ color: 'var(--secondary-light)', borderColor: 'rgba(16,185,129,0.3)' }}>
              ⚡ Auto-refresh
            </div>
            <div className="topbar-badge">
              📅 {dateStr}
            </div>
            {alertCount > 0 && (
              <div
                className="topbar-badge"
                style={{ cursor: 'pointer', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--accent-light)' }}
                onClick={() => setPage('alerts')}
              >
                🔔 {alertCount} Alert{alertCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
