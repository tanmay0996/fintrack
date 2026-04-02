# FinTrack — Finance Dashboard

A full-stack finance dashboard with role-based access control. Built with Node.js + Express + PostgreSQL (Prisma) on the backend and React + Vite + shadcn/ui on the frontend.

---

## Tech Stack

**Backend:** Node.js, Express.js, PostgreSQL (Supabase), Prisma ORM, JWT authentication  
**Frontend:** React 19, Vite, shadcn/ui, Tailwind CSS, React Hook Form, Zod, React Hot Toast

---

## Project Structure

```
fintrack/
├── backend/
│   ├── prisma/schema.prisma      # DB schema (User, FinancialRecord)
│   └── src/
│       ├── index.js              # Entry point
│       ├── app.js                # Express setup + route mounting
│       ├── constants.js          # App constants
│       ├── db/index.js           # Prisma client + connectDB
│       ├── controllers/          # Request handlers
│       ├── routes/               # Express routers (versioned /api/v1/)
│       ├── middleware/           # JWT auth + role guard
│       └── utils/                # asyncHandler, ApiError, ApiResponse
└── frontend/
    └── src/
        ├── App.jsx               # Router + AuthProvider
        ├── context/AuthContext.jsx
        ├── utils/api.js          # Native fetch wrapper
        └── components/
            ├── LoginPage.jsx
            ├── Layout.jsx + Navbar.jsx
            ├── Dashboard.jsx
            ├── RecordsTable.jsx + RecordForm.jsx
            └── UserManagement.jsx
```

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase used here)

### Backend

```bash
cd backend
npm install
npx prisma db push          # sync schema to DB
node src/db/seed.js         # seed demo users + sample records
npm run dev                 # starts on port 8000
```

**Backend `.env`** (already configured):
```
PORT=8000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=...
DIRECT_URL=...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on port 5173
```

**Frontend `.env`**:
```
VITE_REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## API Reference

All routes prefixed with `/api/v1/`

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/users/login` | Public | Login, returns JWT + sets cookie |
| POST | `/users/logout` | Auth | Logout, clears token |
| POST | `/users/refresh-token` | Public | Rotate access token |
| GET | `/users/me` | Auth | Get current user |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (paginated, filterable) |
| POST | `/users` | Create user |
| PATCH | `/users/:userId` | Update role / status |
| DELETE | `/users/:userId` | Delete user |

### Financial Records
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/records` | All roles | List records (filtered, paginated) |
| GET | `/records/:recordId` | All roles | Get single record |
| POST | `/records` | Admin | Create record |
| PATCH | `/records/:recordId` | Admin | Update record |
| DELETE | `/records/:recordId` | Admin | Delete record |

**Filter params for GET `/records`:** `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`, `sortBy`, `sortOrder`

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/summary` | All roles | Total income, expenses, net balance, category totals, recent activity |
| GET | `/dashboard/trends` | All roles | Monthly income/expense breakdown by year |
| GET | `/dashboard/categories` | All roles | Category-level aggregation |

---

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View dashboard | ✅ | ✅ | ✅ |
| View records | ✅ | ✅ | ✅ |
| Create/Edit/Delete records | ❌ | ❌ | ✅ |
| View analytics / trends | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fintrack.com | Admin@123 |
| Analyst | analyst@fintrack.com | Analyst@123 |
| Viewer | viewer@fintrack.com | Viewer@123 |

---

## Design Decisions

- **Prisma over raw SQL** — type-safe queries, schema-as-code, easy migrations
- **JWT dual-track** — stored in both httpOnly cookies and returned in response body so web and API clients both work
- **Role guard as middleware** — `requireRole(...roles)` is a higher-order function injected at route level, not globally, following the ViewTube pattern
- **Native fetch** — no axios; a thin `api.js` wrapper handles auth headers, base URL, and error normalization
- **Zod on forms** — frontend validation mirrors backend constraints so the user gets instant feedback before any network call
- **Seed script** — `src/db/seed.js` uses `upsert` so it's safe to run multiple times without duplicating users
