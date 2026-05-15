# HR Automation Dashboard

> **Full-stack HR dashboard** built on top of `HR_Dashboard_Data.xlsx`. Koi bhi Excel sheet badlo — dashboard automatically refresh ho jaata hai, page reload ki zaroorat nahi.

---


Ya manually dono servers chalaao:

```bash
# Terminal 1 — Backend API
cd hr-dashboard/backend
node server.js

# Terminal 2 — Frontend UI
cd hr-dashboard/frontend
npm run dev
```

---

## 📁 Project Structure

```
intern/
├── HR_Dashboard_Data.xlsx          ← Yahi file backend directly padhta hai
├── HR_Automation_Assignment.pdf
└── hr-dashboard/
    ├── start.sh                    ← One-command startup
    │
    ├── backend/
    │   ├── server.js               ← Express REST API + file watcher + SSE
    │   └── package.json
    │
    └── frontend/
        ├── index.html
        ├── vite.config.js
        └── src/
            ├── main.jsx            ← React entry point
            ├── App.jsx             ← Sidebar layout + SSE auto-refresh wiring
            ├── index.css           ← Full design system (dark glassmorphism)
            ├── api.js              ← Fetch helpers for all API routes
            ├── utils.jsx           ← Shared hooks, formatters, badges
            ├── useAutoRefresh.js   ← SSE-based auto-refresh hook ⭐
            └── pages/
                ├── Dashboard.jsx       ← Overview KPIs + charts
                ├── Alerts.jsx          ← Intern LWD + probation alerts
                ├── Employees.jsx       ← Employee directory (table + cards)
                ├── OrgChart.jsx        ← Collapsible reporting hierarchy
                ├── Finance.jsx         ← CTC in INR & USD
                ├── Productivity.jsx    ← Avg hrs/day analytics
                ├── ResourceAllocation.jsx  ← Monthly project RM data
                ├── RiskReport.jsx      ← Risk register
                └── Attrition.jsx       ← Quarterly exit analytics
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Kyon use kiya |
|------------|---------|---------------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.x | REST API framework — lightweight, fast |
| **xlsx** (SheetJS) | 0.18.x | Excel file parser — cellDates support ke saath |
| **cors** | 2.x | Frontend (port 5173) se API calls allow karne ke liye |
| `fs.watch()` | Built-in | Excel file changes detect karne ke liye (no extra library needed) |
| **SSE** (Server-Sent Events) | Built-in HTTP | Real-time broadcast — WebSocket se simpler, one-way kaafi hai |

### Frontend

| Technology | Version | Kyon use kiya |
|------------|---------|---------------|
| **React** | 18.x | Component-based UI, hooks ke saath clean state management |
| **Vite** | 5.x | Lightning-fast dev server, HMR, proxy support |
| **Recharts** | 2.x | Composable React charts — BarChart, LineChart, PieChart, Radar |
| **lucide-react** | 0.47x | Clean icon set |
| **Vanilla CSS** | — | Custom dark design system, no Tailwind — full control |
| **EventSource API** | Browser built-in | SSE subscription ke liye (auto-refresh) |

---

## 🔄 Auto-Refresh — Kaise Kaam Karta Hai

Yeh sabse important feature hai. Jab bhi tum `HR_Dashboard_Data.xlsx` mein kuch change karoge aur save karoge, dashboard automatically update ho jaata hai.

### Flow Diagram

```
Excel file save hoti hai
        │
        ▼
 fs.watch() triggers     ← Backend (Node.js built-in)
        │
        ▼
 500ms debounce          ← Multiple rapid events ko ek mein merge karta hai
        │
        ▼
 dataVersion = Date.now()  ← Internal version number bump hota hai
        │
        ▼
 SSE broadcast           ← Sabhi connected browsers ko message bheja jaata hai
 /api/events             ← (Server-Sent Events endpoint)
        │
        ▼
 useAutoRefresh() hook   ← Frontend mein EventSource listen kar raha hai
        │
        ▼
 refreshKey++ (React)    ← Current page ka key change hota hai
        │
        ▼
 Page remounts           ← React component re-render hota hai
        │
        ▼
 API calls re-fire       ← Fresh data Excel se fetch hota hai
        │
        ▼
 ✅ Dashboard updated!   ← Green toast notification dikhaata hai
```

### Code (Backend — `server.js`)

```js
// File watcher setup
watch(EXCEL_PATH, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(broadcastChange, 500); // 500ms debounce
});

// SSE broadcast to all connected clients
function broadcastChange() {
  dataVersion = Date.now();
  for (const res of sseClients) {
    res.write(`data: ${JSON.stringify({ version: dataVersion })}\n\n`);
  }
}

// SSE endpoint — browsers subscribe karte hain yahan
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.write(`data: ${JSON.stringify({ version: dataVersion })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res)); // cleanup on disconnect
});
```

### Code (Frontend — `useAutoRefresh.js`)

```js
export function useAutoRefresh(onRefresh) {
  useEffect(() => {
    const es = new EventSource('/api/events');  // SSE connection open

    es.onmessage = (e) => {
      const { version } = JSON.parse(e.data);
      if (previousVersion !== null && version !== previousVersion) {
        onRefresh();  // Excel badla → page refresh
      }
      previousVersion = version;
    };
    return () => es.close();  // cleanup on unmount
  }, []);
}
```

### Fallback (Polling)

Agar browser SSE support nahi karta (rare), toh automatically 5-second polling pe fall back hota hai:

```js
// Poll /api/version every 5 seconds
setInterval(async () => {
  const { version } = await fetch('/api/version').then(r => r.json());
  if (version changed) onRefresh();
}, 5000);
```

---

## 📊 Dashboard Pages — Kya Hai Kahan

| Page | Kya Dikhata Hai | Excel Sheet |
|------|----------------|-------------|
| **Overview** | 6 KPI cards, dept chart, attrition chart, risk pie, CTC totals | Sabhi sheets |
| **HR Alerts** | Intern LWD alerts (≤45 days), Probation alerts (≤30 days) | India + US DB |
| **Employees** | Full directory — table & card view, search + filter | India + US DB |
| **Org Chart** | Collapsible reporting hierarchy tree | India + US DB |
| **Finance & CTC** | Annual/monthly CTC in INR & USD, dept breakdown | Finance sheet |
| **Productivity** | Avg hrs/day per employee, monthly trend, dept ranking | Productivity |
| **Resource Allocation** | Monthly project-wise allocation per employee | RM Data |
| **Risk Report** | Risk cards by category/level, mitigation tracking | Risk Report |
| **Attrition** | Quarterly exit rate auto-calculated, exit reasons pie | Offboarded Resources |

---

## 🔌 API Endpoints

| Method | Route | Returns |
|--------|-------|---------|
| GET | `/api/dashboard` | Summary KPIs, alerts, attrition rates, risk summary |
| GET | `/api/employees` | All employees (India + US combined) |
| GET | `/api/india-employees` | India employee database |
| GET | `/api/us-employees` | US employee database |
| GET | `/api/finance` | CTC data in INR & USD |
| GET | `/api/productivity` | Monthly avg hrs/day per employee |
| GET | `/api/rm-data` | Monthly project allocation (RM sheet) |
| GET | `/api/risk-report` | Risk register entries |
| GET | `/api/offboarded` | Offboarded resources with exit details |
| GET | `/api/org-chart` | Reporting hierarchy tree |
| **GET** | **`/api/events`** | **SSE stream — auto-refresh channel** ⭐ |
| GET | `/api/version` | Current data version timestamp (polling fallback) |

---

## 🚨 Alert Logic

### Intern LWD Alert (45 days)
```
Agar: Last Working Day ≤ Today + 45 days
Then: Alert trigger → shown on Overview banner + Alerts page
```

### Probation Confirmation Alert (30 days)
```
Agar: Employment Status == "Under Probation"
  AND: Date of Joining + 6 months ≤ Today + 30 days
Then: Alert trigger → "Schedule confirmation review meeting"
```

---

## ✅ Assignment Requirements Coverage

| Requirement | Implementation |
|-------------|----------------|
| Org chart — reporting hierarchy | Collapsible tree (OrgChart page), manager name → employee name matching |
| Live-linked to all data tabs | Backend reads Excel **on every API call** — no caching, always fresh |
| High-level display, expandable on demand | Summary cards on overview; click rows/nodes to expand details |
| Intern LWD alert (45 days) | Auto-calculated in `/api/dashboard`, banner + dedicated Alerts page |
| Probation confirmation alert (30 days) | DOJ + 6 months logic, same alert system |
| Risk Report live updates | `/api/risk-report` reads sheet directly; SSE auto-refresh applies |
| Quarterly attrition auto-calculated | `exits / active_employees * 100` from Offboarded Resources tab |
| Intuitive, uncluttered | KPIs only on overview; raw tables are expandable, not default view |
| India Employee Database | Full CRUD display via `/api/india-employees` |
| US Employee Database | Full display via `/api/us-employees` with CTC + allocation fields |
| RM Data | Monthly allocation grid with project color coding |
| Finance (INR + USD) | Annual + monthly in both currencies, dept breakdown chart |
| Productivity | Per-employee monthly grid, team trend line, dept ranking |
| Offboarded Resources | Full exit table with quarter filter, exit reason analysis |

---

## 🎨 Design System

**Dark Glassmorphism Theme** — `src/index.css`

- Background: `#0a0d14` (deep dark)
- Cards: `#1a2235` with `1px solid rgba(99,130,255,0.12)` borders
- Primary accent: `#6366f1` (indigo) with `rgba(99,102,241,0.25)` glow
- Typography: **Inter** (Google Fonts)
- Stat cards: colored top-border strips (blue/green/amber/red/purple/cyan)
- Micro-animations: hover `translateY(-2px)`, pulsing dots, spinner
- Responsive: sidebar collapses on mobile, grids auto-fill

---

## 📦 Dependencies

### Backend (`backend/package.json`)
```json
{
  "express": "^4.18.2",   // HTTP server
  "cors": "^2.8.5",       // Cross-origin requests
  "xlsx": "^0.18.5"       // Excel file parsing
}
```
*All Node.js builtins used: `fs`, `path`, `url`*

### Frontend (`frontend/package.json`)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "recharts": "^2.12.7",      // Charts
  "lucide-react": "^0.474.0", // Icons
  "vite": "^5.2.0",           // Dev server + bundler
  "@vitejs/plugin-react": "^4.2.1"
}
```

---

*Built for the HR Automation Dashboard Assessment Assignment.*
