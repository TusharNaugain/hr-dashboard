# HR Automation Dashboard

> **Full-stack HR dashboard** built on top of `HR_Dashboard_Data.xlsx`. Koi bhi Excel sheet badlo — dashboard automatically refresh ho jaata hai, page reload ki zaroorat nahi.

---

## ⚡ Quick Start

```bash
cd hr-dashboard
npm install       # pehli baar sirf
npm run dev       # backend + frontend dono ek saath start
```

- **Frontend** → http://localhost:5173  
- **Backend API** → http://localhost:3001

Ya manually:

```bash
# Terminal 1 — Backend API
node server.js

# Terminal 2 — Frontend UI
vite
```

---

## 📁 Project Structure

```
intern/
├── HR_Dashboard_Data.xlsx          ← Yahi file backend directly padhta hai
├── server.js                       ← Express REST API + file watcher + SSE
├── package.json                    ← Root dependencies (concurrently used)
├── vite.config.js
├── src/
│   ├── main.jsx                    ← React entry point
│   ├── App.jsx                     ← Sidebar layout + SSE auto-refresh wiring
│   ├── index.css                   ← Full design system (dark glassmorphism)
│   ├── api.js                      ← Fetch helpers for all API routes
│   ├── utils.jsx                   ← Shared hooks, formatters, badges
│   ├── useAutoRefresh.js           ← SSE-based auto-refresh hook ⭐
│   └── pages/
│       ├── Dashboard.jsx           ← Overview KPIs + charts
│       ├── Alerts.jsx              ← Intern LWD + probation alerts
│       ├── Employees.jsx           ← Employee directory (table + cards)
│       ├── OrgChart.jsx            ← Collapsible reporting hierarchy
│       ├── Finance.jsx             ← CTC in INR & USD
│       ├── Productivity.jsx        ← Avg hrs/day analytics
│       ├── ResourceAllocation.jsx  ← Monthly project RM data
│       ├── RiskReport.jsx          ← Risk register
│       └── Attrition.jsx           ← Quarterly exit analytics
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Kyon use kiya |
|------------|---------|---------------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.x | REST API framework |
| **xlsx** (SheetJS) | 0.18.x | Excel file parser |
| **cors** | 2.x | API calls allow karne ke liye |
| `fs.watch()` | Built-in | Excel file changes detect karne ke liye |
| **SSE** | Built-in | Real-time broadcast |

### Frontend

| Technology | Version | Kyon use kiya |
|------------|---------|---------------|
| **React** | 18.x | Component-based UI |
| **Vite** | 5.x | Fast dev server |
| **Recharts** | 2.x | Charts |
| **lucide-react** | 0.47x | Icons |
| **Vanilla CSS** | — | Custom dark design system |

---

## 🔄 Auto-Refresh — Kaise Kaam Karta Hai

Jab bhi tum `HR_Dashboard_Data.xlsx` mein kuch change karoge aur save karoge, dashboard automatically update ho jaata hai.

### Flow Diagram

```
Excel file save hoti hai
        │
        ▼
 fs.watch() triggers       ← server.js (Node.js built-in)
        │
        ▼
 500ms debounce            ← Multiple rapid saves merge ho jaate hain
        │
        ▼
 dataVersion = Date.now()  ← Internal version bump
        │
        ▼
 SSE broadcast             ← /api/events pe sabhi browsers ko message
        │
        ▼
 useAutoRefresh() hook     ← src/useAutoRefresh.js mein EventSource
        │
        ▼
 refreshKey++ in App.jsx   ← React page ka key change hota hai
        │
        ▼
 API calls re-fire         ← Fresh data Excel se fetch hota hai
        │
        ▼
 ✅ Dashboard updated!     ← Green toast notification
```

---

## 📊 Dashboard Pages — Kya Hai Kahan

| Page | Kya Dikhata Hai |
|------|----------------|
| **Overview** | 6 KPI cards, dept chart, attrition chart, risk pie, CTC totals |
| **HR Alerts** | Intern LWD alerts (≤45 days), Probation alerts (≤30 days) |
| **Employees** | Full directory — table & card view, search + filter |
| **Org Chart** | Collapsible reporting hierarchy tree |
| **Finance & CTC** | Annual/monthly CTC in INR & USD |
| **Productivity** | Avg hrs/day per employee |
| **Resource Allocation** | Monthly project-wise allocation |
| **Risk Report** | Risk cards by category/level |
| **Attrition** | Quarterly exit rate auto-calculated |

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
| **GET** | **`/api/events`** | **SSE stream — auto-refresh channel ⭐** |
| GET | `/api/version` | Current data version (polling fallback) |

---

## 🎨 Design System

**Dark Glassmorphism Theme** — `src/index.css`

- Background: `#0a0d14` (deep dark)
- Cards: `#1a2235` with `1px solid rgba(99,130,255,0.12)` borders
- Primary accent: `#6366f1` (indigo)
- Stat cards: colored top-border strips (blue/green/amber/red/purple/cyan)
- Micro-animations: hover `translateY(-2px)`, pulsing dots, spinner
- Responsive: sidebar collapses on mobile, grids auto-fill

---

## 📦 Dependencies

### `package.json` (unified — root level)

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.100.10",  // Server state + caching
    "cors": "^2.8.5",                       // Cross-origin API access
    "express": "^4.18.2",                   // REST API server
    "lucide-react": "^0.474.0",             // Icons
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.7",                  // Charts
    "xlsx": "^0.18.5"                       // Excel file parsing
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "concurrently": "^8.2.2",              // Run backend + frontend together
    "vite": "^5.2.0"
  }
}
```

*Node.js builtins used: `fs` (watch, readFileSync), `path`, `url`*

---

*Built for the HR Automation Dashboard Assessment Assignment.*
