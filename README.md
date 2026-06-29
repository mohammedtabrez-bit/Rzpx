# Freshdesk Performance Dashboard

Enterprise-grade React application for Freshdesk support operations analytics.

## Tech Stack

- **React 18 + Vite** — fast dev & production builds
- **TypeScript** — full type safety
- **Tailwind CSS** — utility-first styling with dark mode
- **Firebase** — Auth (Google + Email), Firestore, Storage
- **Recharts** — all interactive charts
- **Framer Motion** — smooth animations
- **SheetJS (xlsx)** — CSV/Excel parsing
- **React Router v6** — client-side routing
- **TanStack Table** — leaderboard

---

## Folder Structure

```
src/
├── App.tsx                    # Root with routing and auth guard
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + global styles
├── context/
│   └── AppContext.tsx          # Global state (useReducer)
├── firebase/
│   ├── config.ts              # Firebase initialization
│   ├── auth.ts                # Google + email auth
│   └── firestore.ts           # CRUD for settings, uploads, reports
├── hooks/
│   ├── useAuth.ts             # Auth state listener
│   └── useFileUpload.ts       # CSV/XLSX parsing + Firebase Storage
├── utils/
│   ├── columnMapper.ts        # Smart fuzzy column mapping
│   ├── dataProcessor.ts       # Agent stats, score calc, metrics
│   └── export.ts              # Excel/PDF export
├── types/
│   └── index.ts               # All TypeScript interfaces
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── KPICard.tsx        # Animated metric cards
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx          # Toast notification system
│   ├── layout/
│   │   ├── Layout.tsx         # Main shell with sidebar + nav
│   │   ├── TopNav.tsx         # Header with upload, export, dark mode
│   │   └── Sidebar.tsx        # Animated sidebar navigation
│   ├── UploadZone.tsx         # Drag-and-drop upload
│   ├── FilterBar.tsx          # Global live filters
│   └── AgentPanel.tsx         # Slide-in agent detail panel
└── pages/
    ├── LoginPage.tsx           # Google + email auth
    ├── OverviewPage.tsx        # KPIs + charts + leaderboard
    ├── AgentsPage.tsx          # Agent card grid
    ├── AnalyticsPage.tsx       # 8 interactive charts
    ├── InsightsPage.tsx        # AI-style insights + recommendations
    └── SettingsPage.tsx        # Weights, targets, column mapping
```

---

## Firestore Schema

```
users/{uid}
  uid, email, displayName, photoURL, role, createdAt

uploads/{docId}
  fileName, rowCount, agentCount, uploadedAt, uploadedBy, storagePath

configurations/{uid}
  weights: { csat, quality, sla, frt, rt, escalations }
  targets: { csat, sla, fcr, frt, rt, reopen }
  thresholds: { excellent, good, average }
  columnOverrides: { [field]: columnName }
  updatedAt

performanceReports/{uid_reportId}
  createdAt, createdBy, [report data]
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd freshdesk-performance-dashboard
npm install
```

### 2. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in methods → Google + Email/Password
4. Enable **Firestore Database** (start in production mode)
5. Enable **Storage**
6. Copy your web app config

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your Firebase values in .env
```

### 4. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /configurations/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /uploads/{docId} {
      allow read, write: if request.auth != null && resource.data.uploadedBy == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /performanceReports/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Firebase Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{uid}/{allPaths=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### 6. Local development

```bash
npm run dev
```

---

## Deployment to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel

# Set environment variables when prompted, or:
vercel env add VITE_FIREBASE_API_KEY
# repeat for all VITE_FIREBASE_* variables
```

### Option B — Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repo
4. Add all `VITE_FIREBASE_*` environment variables in Settings → Environment Variables
5. Deploy

---

## Usage

1. **Login** — sign in with Google or email/password
2. **Upload** — drag & drop your Freshdesk CSV/XLSX export onto the upload zone (or click "Upload Data" in the nav)
3. **Auto-mapping** — columns are detected automatically (Agent, Status, Priority, CSAT, FRT, etc.)
4. **Filter** — use the filter bar to slice by date, agent, group, status, priority
5. **Explore** — navigate between Overview, Agents, Analytics, and Insights pages
6. **Configure** — go to Settings to adjust score weightages, KPI targets, and column overrides
7. **Export** — use the nav buttons to export Excel or PDF

---

## Supported Column Names (Auto-Detected)

| Field | Accepted Names |
|-------|----------------|
| Agent | agent, responder, assigned to, owner, agent name, assignee, ... |
| Status | status, ticket status, state |
| Priority | priority, urgency, severity |
| Group | group, team, department, product area, queue |
| CSAT | csat, customer satisfaction, satisfaction score, rating |
| FRT | first response time, frt, first reply time |
| Resolution Time | resolution time, handling time, time to resolve |
| SLA | sla, sla status, sla met, within sla |
| Created At | created at, created time, date created, opened at |
| Resolved At | resolved at, resolved time, closed at, close date |

---

## Score Calculation (Default Weights)

| Metric | Weight |
|--------|--------|
| CSAT | 30% |
| Quality (CSAT + SLA avg) | 25% |
| SLA Compliance | 20% |
| First Response Time | 10% |
| Resolution Time | 10% |
| Escalations | 5% |

All weights and targets are configurable from the Settings page.

---

## License

MIT
 
