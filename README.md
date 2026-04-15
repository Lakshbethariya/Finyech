# NextGen Credit Intelligence
### AI-Powered Corporate Credit Analysis System

---

— Login with Demo Accounts

| Role  | Email                   | Password   | Access          |
|-------|-------------------------|------------|-----------------|
| User  | demo@company.com        | password   | Dashboard       |

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
