import express from 'express';
import cors from 'cors';
import * as XLSX from 'xlsx';
import { readFileSync, watch, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const EXCEL_PATH = path.join(__dirname, '../../HR_Dashboard_Data.xlsx');

// ─── Auto-refresh: SSE clients + file watcher ────────────────────────────────
let dataVersion = Date.now();          // bumped on every Excel change
const sseClients = new Set();          // connected browser tabs

function broadcastChange() {
  dataVersion = Date.now();
  console.log(`[watch] Excel changed — broadcasting v${dataVersion} to ${sseClients.size} client(s)`);
  for (const res of sseClients) {
    res.write(`data: ${JSON.stringify({ version: dataVersion })}\n\n`);
  }
}

// Debounce: Excel often triggers multiple rapid events on a single save
let debounceTimer = null;
watch(EXCEL_PATH, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(broadcastChange, 500);
});
console.log(`[watch] Watching ${EXCEL_PATH} for changes…`);

// ─── SSE endpoint — browsers subscribe here ──────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Send current version immediately so client is in sync
  res.write(`data: ${JSON.stringify({ version: dataVersion })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ─── Version endpoint — lightweight poll fallback ────────────────────────────
app.get('/api/version', (req, res) => {
  res.json({ version: dataVersion });
});

function loadWorkbook() {
  const buf = readFileSync(EXCEL_PATH);
  return XLSX.read(buf, { type: 'buffer', cellDates: true });
}

function sheetToJson(wb, sheetName, headerRow = 0) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: null, dateNF: 'yyyy-mm-dd' });
}

function formatDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'string') return d;
  return null;
}

// ─── India Employees ────────────────────────────────────────────────
app.get('/api/india-employees', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'India Employee Database');
  const result = rows.map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    designation: r['Designation'],
    reportingManager: r['Reporting Manager'],
    skillset: r['Skillset'],
    dateOfJoining: formatDate(r['Date of Joining']),
    employmentStatus: r['Employment Status'],
    lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
    region: 'India'
  }));
  res.json(result);
});

// ─── US Employees ────────────────────────────────────────────────────
app.get('/api/us-employees', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'US Employee Database');
  const result = rows.map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    designation: r['Designation'],
    reportingManager: r['Reporting Manager'],
    currentAllocation: r['Current Allocation (%)'],
    ctcAnnualUSD: r['CTC (Annual USD)'],
    skillset: r['Skillset'],
    dateOfJoining: formatDate(r['Date of Joining']),
    employmentStatus: r['Employment Status'],
    lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
    region: 'US'
  }));
  res.json(result);
});

// ─── All Employees combined ──────────────────────────────────────────
app.get('/api/employees', (req, res) => {
  const wb = loadWorkbook();
  const india = sheetToJson(wb, 'India Employee Database').map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    designation: r['Designation'],
    reportingManager: r['Reporting Manager'],
    skillset: r['Skillset'],
    dateOfJoining: formatDate(r['Date of Joining']),
    employmentStatus: r['Employment Status'],
    lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
    region: 'India'
  }));
  const us = sheetToJson(wb, 'US Employee Database').map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    designation: r['Designation'],
    reportingManager: r['Reporting Manager'],
    currentAllocation: r['Current Allocation (%)'],
    ctcAnnualUSD: r['CTC (Annual USD)'],
    skillset: r['Skillset'],
    dateOfJoining: formatDate(r['Date of Joining']),
    employmentStatus: r['Employment Status'],
    lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
    region: 'US'
  }));
  res.json([...india, ...us]);
});

// ─── Finance ─────────────────────────────────────────────────────────
app.get('/api/finance', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'Finance');
  const result = rows.map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    region: r['Region'],
    annualCTCInr: r['Annual CTC (INR)'],
    monthlyCTCInr: r['Monthly CTC (INR)'],
    annualCTCUsd: r['Annual CTC (USD)'],
    monthlyCTCUsd: r['Monthly CTC (USD)']
  }));
  res.json(result);
});

// ─── Productivity ─────────────────────────────────────────────────────
app.get('/api/productivity', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'Productivity');
  const months = ['Jan-2025','Feb-2025','Mar-2025','Apr-2025','May-2025','Jun-2025',
                  'Jul-2025','Aug-2025','Sep-2025','Oct-2025','Nov-2025','Dec-2025'];
  const result = rows.map(r => {
    const monthly = {};
    months.forEach(m => { monthly[m] = r[`${m} Avg Hrs/Day`]; });
    return {
      employeeId: r['Employee ID'],
      name: r['Employee Name'],
      department: r['Department'],
      region: r['Region'],
      monthlyHours: monthly,
      overallAvg: r['Overall Avg Hrs/Day'],
      belowEightFlag: r['Below 8 Hrs Flag']
    };
  });
  res.json(result);
});

// ─── RM Data (Resource Management) ────────────────────────────────────
app.get('/api/rm-data', (req, res) => {
  const wb = loadWorkbook();
  const ws = wb.Sheets['RM Data'];
  if (!ws) return res.json([]);

  // Row 1 = month headers, Row 2 = sub-headers, Row 3+ = data
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const months = ['Jan-2025','Feb-2025','Mar-2025','Apr-2025','May-2025','Jun-2025',
                  'Jul-2025','Aug-2025','Sep-2025','Oct-2025','Nov-2025','Dec-2025'];

  const result = [];
  for (let i = 2; i < raw.length; i++) {
    const row = raw[i];
    if (!row[0]) continue;
    const emp = {
      employeeId: row[0],
      name: row[1],
      department: row[2],
      region: row[3],
      allocations: {}
    };
    months.forEach((m, idx) => {
      const col = 4 + idx * 2;
      emp.allocations[m] = {
        project: row[col],
        allocation: row[col + 1]
      };
    });
    result.push(emp);
  }
  res.json(result);
});

// ─── Risk Report ──────────────────────────────────────────────────────
app.get('/api/risk-report', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'Risk Report');
  const result = rows.map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    region: r['Region'],
    riskCategory: r['Risk Category'],
    riskLevel: r['Risk Level'],
    identifiedDate: formatDate(r['Identified Date']),
    mitigationAction: r['Mitigation Action'],
    status: r['Status'],
    hrNotes: r['HR Notes']
  }));
  res.json(result);
});

// ─── Offboarded Resources ─────────────────────────────────────────────
app.get('/api/offboarded', (req, res) => {
  const wb = loadWorkbook();
  const rows = sheetToJson(wb, 'Offboarded Resources');
  const result = rows.map(r => ({
    employeeId: r['Employee ID'],
    name: r['Employee Name'],
    department: r['Department'],
    region: r['Region'],
    designation: r['Designation'],
    dateOfJoining: formatDate(r['Date of Joining']),
    lastWorkingDay: formatDate(r['Last Working Day']),
    exitReason: r['Exit Reason'],
    exitQuarter: r['Exit Quarter'],
    noticePeriodServed: r['Notice Period Served'],
    rehireEligible: r['Rehire Eligible']
  }));
  res.json(result);
});

// ─── Dashboard Summary ────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const wb = loadWorkbook();

  const indiaRows = sheetToJson(wb, 'India Employee Database');
  const usRows = sheetToJson(wb, 'US Employee Database');
  const allEmployees = [
    ...indiaRows.map(r => ({
      employeeId: r['Employee ID'],
      name: r['Employee Name'],
      department: r['Department'],
      designation: r['Designation'],
      reportingManager: r['Reporting Manager'],
      dateOfJoining: formatDate(r['Date of Joining']),
      employmentStatus: r['Employment Status'],
      lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
      region: 'India'
    })),
    ...usRows.map(r => ({
      employeeId: r['Employee ID'],
      name: r['Employee Name'],
      department: r['Department'],
      designation: r['Designation'],
      reportingManager: r['Reporting Manager'],
      dateOfJoining: formatDate(r['Date of Joining']),
      employmentStatus: r['Employment Status'],
      lastWorkingDay: formatDate(r['Last Working Day (Interns Only)']) || r['Last Working Day (Interns Only)'],
      region: 'US'
    }))
  ];

  const today = new Date();
  const in45Days = new Date(today); in45Days.setDate(today.getDate() + 45);
  const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

  // Intern LWD alerts (within 45 days)
  const internAlerts = allEmployees.filter(e => {
    if (!e.lastWorkingDay || e.lastWorkingDay === 'N/A') return false;
    const lwd = new Date(e.lastWorkingDay);
    return lwd >= today && lwd <= in45Days;
  });

  // Probation confirmation alerts (within 30 days - joining + 6 months)
  const probationAlerts = allEmployees.filter(e => {
    if (e.employmentStatus !== 'Under Probation') return false;
    if (!e.dateOfJoining) return false;
    const doj = new Date(e.dateOfJoining);
    const confirmDate = new Date(doj);
    confirmDate.setMonth(confirmDate.getMonth() + 6);
    return confirmDate >= today && confirmDate <= in30Days;
  });

  // Department distribution
  const deptCount = {};
  allEmployees.forEach(e => {
    if (!deptCount[e.department]) deptCount[e.department] = { India: 0, US: 0, total: 0 };
    deptCount[e.department][e.region]++;
    deptCount[e.department].total++;
  });

  // Status breakdown
  const statusCount = { Confirmed: 0, 'Under Probation': 0, Intern: 0 };
  allEmployees.forEach(e => {
    if (statusCount[e.employmentStatus] !== undefined) statusCount[e.employmentStatus]++;
    else if (e.employmentStatus === 'Intern') statusCount['Intern']++;
  });

  // Attrition by quarter
  const offboardedRows = sheetToJson(wb, 'Offboarded Resources');
  const quarterlyAttrition = {};
  const activeCounts = { 'Q1-2025': allEmployees.length, 'Q2-2025': allEmployees.length,
                         'Q3-2025': allEmployees.length, 'Q4-2025': allEmployees.length };
  offboardedRows.forEach(r => {
    const q = r['Exit Quarter'];
    if (q) {
      quarterlyAttrition[q] = (quarterlyAttrition[q] || 0) + 1;
    }
  });
  const attritionRates = {};
  Object.entries(quarterlyAttrition).forEach(([q, exits]) => {
    const base = activeCounts[q] || allEmployees.length;
    attritionRates[q] = { exits, rate: ((exits / base) * 100).toFixed(1) };
  });

  // Productivity summary
  const prodRows = sheetToJson(wb, 'Productivity');
  const prodBelow8 = prodRows.filter(r => r['Below 8 Hrs Flag'] && r['Below 8 Hrs Flag'].toString().includes('Below'));
  const avgProductivity = prodRows.reduce((sum, r) => sum + (Number(r['Overall Avg Hrs/Day']) || 0), 0) / prodRows.length;

  // Finance totals
  const finRows = sheetToJson(wb, 'Finance');
  const totalCTCInr = finRows.reduce((s, r) => s + (r['Annual CTC (INR)'] || 0), 0);
  const totalCTCUsd = finRows.reduce((s, r) => s + (r['Annual CTC (USD)'] || 0), 0);

  // Risk summary
  const riskRows = sheetToJson(wb, 'Risk Report');
  const riskByLevel = { High: 0, Medium: 0, Low: 0 };
  riskRows.forEach(r => { if (riskByLevel[r['Risk Level']] !== undefined) riskByLevel[r['Risk Level']]++; });

  res.json({
    summary: {
      totalEmployees: allEmployees.length,
      indiaCount: indiaRows.length,
      usCount: usRows.length,
      confirmedCount: statusCount['Confirmed'],
      probationCount: statusCount['Under Probation'],
      internCount: statusCount['Intern'],
      totalAnnualCTCInr: totalCTCInr,
      totalAnnualCTCUsd: totalCTCUsd,
      avgProductivityHours: avgProductivity.toFixed(2),
      employeesBelowTarget: prodBelow8.length
    },
    alerts: {
      internLWDAlerts: internAlerts,
      probationAlerts: probationAlerts
    },
    departmentDistribution: deptCount,
    employmentStatusBreakdown: statusCount,
    attritionRates,
    riskSummary: riskByLevel,
    recentRisks: riskRows.slice(0, 5).map(r => ({
      employeeId: r['Employee ID'],
      name: r['Employee Name'],
      riskCategory: r['Risk Category'],
      riskLevel: r['Risk Level'],
      status: r['Status']
    }))
  });
});

// ─── Org Chart ────────────────────────────────────────────────────────
app.get('/api/org-chart', (req, res) => {
  const wb = loadWorkbook();
  const indiaRows = sheetToJson(wb, 'India Employee Database');
  const usRows = sheetToJson(wb, 'US Employee Database');

  const allEmps = [
    ...indiaRows.map(r => ({
      id: r['Employee ID'],
      name: r['Employee Name'],
      designation: r['Designation'],
      department: r['Department'],
      manager: r['Reporting Manager'],
      region: 'India',
      status: r['Employment Status']
    })),
    ...usRows.map(r => ({
      id: r['Employee ID'],
      name: r['Employee Name'],
      designation: r['Designation'],
      department: r['Department'],
      manager: r['Reporting Manager'],
      region: 'US',
      status: r['Employment Status']
    }))
  ];

  // Build adjacency: manager name -> list of employees
  const nameToEmp = {};
  allEmps.forEach(e => { nameToEmp[e.name] = e; });

  const tree = {};
  const hasParent = new Set();

  allEmps.forEach(e => {
    if (!tree[e.name]) tree[e.name] = { ...e, reports: [] };
  });

  allEmps.forEach(e => {
    if (e.manager && nameToEmp[e.manager]) {
      if (!tree[e.manager]) tree[e.manager] = { ...nameToEmp[e.manager], reports: [] };
      tree[e.manager].reports.push(tree[e.name]);
      hasParent.add(e.name);
    }
  });

  const roots = allEmps.filter(e => !hasParent.has(e.name)).map(e => tree[e.name]);

  res.json({ nodes: allEmps, roots });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HR Dashboard API running on http://localhost:${PORT}`);
  console.log(`Auto-refresh via SSE: http://localhost:${PORT}/api/events`);
});
