# NextGen Credit Intelligence
### AI-Powered Corporate Credit Analysis System

---

## 📁 Project Structure

```
nextgen-credit/
├── frontend/
│   ├── index.html          # Single-page app (all 6 pages, no scroll)
│   ├── styles.css          # Complete bank-style UI (dark blue theme)
│   └── app.js              # All frontend logic & API calls
├── backend/
│   ├── server.js           # Express entry point — run this to start
│   ├── db.js               # MySQL connection pool
│   ├── package.json        # Node.js dependencies
│   ├── .env                # Environment variables (edit this!)
│   ├── .env.example        # Template for .env
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         # POST /auth/login, /auth/signup
│   │   ├── user.js         # GET /user/profile, /user/reports
│   │   ├── analysis.js     # POST /analysis/submit, GET /analysis/report/:id
│   │   └── admin.js        # Admin CRUD routes
│   └── controllers/
│       └── creditEngine.js # Credit scoring logic
└── database/
    └── schema.sql          # MySQL tables + seed data (run this first!)
```

---

## ⚡ HOW TO START IN VS CODE & OPEN IN BROWSER

### Prerequisites — Install these first:
- **Node.js 18+** → https://nodejs.org/ (download LTS version)
- **MySQL 8.0+** → https://dev.mysql.com/downloads/mysql/
- **VS Code** → https://code.visualstudio.com/

---

### STEP 1 — Open the project in VS Code

1. Open VS Code
2. Click **File → Open Folder**
3. Select the `nextgen-credit` folder
4. You'll see the full project tree in the sidebar

---

### STEP 2 — Set up the Database

Open a terminal in VS Code (**Terminal → New Terminal**) and run:

```bash
# Log into MySQL (enter your MySQL root password when prompted)
mysql -u root -p

# Once inside MySQL shell, run the schema:
source /full/path/to/nextgen-credit/database/schema.sql

# OR if you're already in the database folder:
# source database/schema.sql

# Exit MySQL shell
exit
```

**Alternative (if the above doesn't work):**
```bash
mysql -u root -p nextgen_credit < database/schema.sql
```

This creates:
- `nextgen_credit` database
- All tables (users, financial_data, reports, admin_logs)
- Two demo accounts (admin + regular user)

---

### STEP 3 — Configure Environment Variables

1. Open `backend/.env` in VS Code
2. Change `DB_PASSWORD=your_mysql_password_here` to your actual MySQL password
3. Save the file

Example:
```
DB_PASSWORD=mypassword123
```

---

### STEP 4 — Install Node.js Dependencies

In VS Code terminal:

```bash
# Navigate to the backend folder
cd backend

# Install all dependencies
npm install
```

This installs: express, mysql2, bcryptjs, jsonwebtoken, cors, dotenv

---

### STEP 5 — Start the Backend Server

Still in the `backend` folder in terminal:

```bash
npm start
```

You should see:
```
🚀 NextGen Credit Intelligence API
   Running on: http://localhost:5000
   Environment: development
✅ MySQL database connected successfully
```

If you see MySQL connection error → check your DB_PASSWORD in `.env`

---

### STEP 6 — Open in Browser

Open your browser and go to:

```
http://localhost:5000
```

The app will load automatically! The backend serves the frontend files.

---

### STEP 7 — Login with Demo Accounts

| Role  | Email                   | Password   | Access          |
|-------|-------------------------|------------|-----------------|
| Admin | admin@nextgencredit.com | password   | Admin Panel     |
| User  | demo@company.com        | password   | Dashboard       |

---

## 🔄 Development Mode (Auto-restart on save)

Instead of `npm start`, use:

```bash
npm run dev
```

This uses `nodemon` — the server restarts automatically when you edit backend files.

---

## 🌐 API Routes Reference

| Method | Endpoint                    | Auth       | Description           |
|--------|-----------------------------|------------|-----------------------|
| POST   | /auth/signup                | None       | Register new user     |
| POST   | /auth/login                 | None       | Login, get JWT token  |
| GET    | /user/profile               | User+      | Get profile info      |
| GET    | /user/reports               | User+      | Get own reports       |
| POST   | /analysis/submit            | User+      | Run credit analysis   |
| GET    | /analysis/report/:id        | User+      | Get single report     |
| GET    | /admin/users                | Admin only | All users list        |
| GET    | /admin/reports              | Admin only | All credit reports    |
| GET    | /admin/stats                | Admin only | Dashboard stats       |
| PATCH  | /admin/reports/:id/decision | Admin only | Approve/Reject report |

---

## 🧠 Credit Score Logic

| Factor              | Points  |
|---------------------|---------|
| Profit margin > 30% | +20     |
| Profit margin > 15% | +12     |
| Profit margin > 5%  | +5      |
| Thin margin (0–5%)  | -5      |
| Operating at loss   | -20     |
| Revenue > ₹1 Crore  | +10     |
| Revenue > ₹25 Lakh  | +6      |
| GST Active          | +10     |
| GST Pending         | +2      |
| GST Inactive        | -8      |
| No loan default     | +15     |
| Minor default       | -10     |
| Major default       | -25     |
| 5+ years in biz     | +8      |
| 2+ years in biz     | +4      |
| < 2 years in biz    | -3      |

**Decision Thresholds:**
- Score ≥ 70 → **Approved** (Low Risk) ✅
- Score 45–69 → **Risky** (Medium Risk) ⚠️
- Score < 45 → **Rejected** (High Risk) ❌

---

## 🎨 Pages

1. **Landing** — Hero, features, stats (no scroll, 100vh)
2. **Login/Signup** — JWT auth, tab-based form
3. **Dashboard** — KPIs, score gauge, recent reports
4. **Credit Analysis** — Input form → Live result with factors
5. **Report** — Full printable credit report
6. **Admin Panel** — Stats, user list, report management

---

## ❓ Troubleshooting

**"Cannot connect to server" error in browser:**
→ Make sure the backend is running (`npm start` in backend folder)

**MySQL connection failed:**
→ Check your password in `backend/.env`
→ Make sure MySQL service is running on your machine

**Port 5000 already in use:**
→ Change `PORT=5000` to `PORT=3001` in `.env`
→ Also update `const API = 'http://localhost:3001'` in `frontend/app.js`

**npm not found:**
→ Install Node.js from https://nodejs.org/

---

## 🔐 Security Notes

- Change `JWT_SECRET` in `.env` before deploying to production
- Change demo passwords via the admin panel or database
- The `.env` file is NOT committed to git (add it to `.gitignore`)
