const BASE = '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  dashboard: () => get('/dashboard'),
  employees: () => get('/employees'),
  indiaEmployees: () => get('/india-employees'),
  usEmployees: () => get('/us-employees'),
  finance: () => get('/finance'),
  productivity: () => get('/productivity'),
  rmData: () => get('/rm-data'),
  riskReport: () => get('/risk-report'),
  offboarded: () => get('/offboarded'),
  orgChart: () => get('/org-chart'),
};
