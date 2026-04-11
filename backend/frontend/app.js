/* =====================================================
   NextGen Credit Intelligence — Frontend Application
   ===================================================== */

const API = 'http://localhost:5000';
let currentUser = null;
let currentReport = null;
let pendingReviewId = null;

/* =====================================================
   PAGE NAVIGATION
   ===================================================== */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add('active');

  // Run page-specific loaders
  if (name === 'dashboard') loadDashboard();
  if (name === 'admin') loadAdminPanel();
  if (name === 'report' && currentReport) renderReportPage(currentReport);
  if (name === 'analysis') resetAnalysis();
}

function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('formSignup').style.display = tab === 'signup' ? 'block' : 'none';
}

function showDashTab(tab) {
  document.getElementById('dashOverview').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('dashHistory').style.display = tab === 'history' ? 'block' : 'none';
  if (tab === 'history') loadHistory();
}

function showAdminTab(tab) {
  ['overview','users','reports'].forEach(t => {
    document.getElementById(`admin${t.charAt(0).toUpperCase()+t.slice(1)}`).style.display = t === tab ? 'block' : 'none';
    const el = document.getElementById(`adminTab${t.charAt(0).toUpperCase()+t.slice(1)}`);
    if (el) el.classList.toggle('active', t === tab);
  });
  if (tab === 'users') loadAdminUsers();
  if (tab === 'reports') loadAdminReports();
}

/* =====================================================
   AUTH
   ===================================================== */
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');

  if (!email || !password) { showMsg('loginMsg', 'Please enter email and password.', 'error'); return; }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) { showMsg('loginMsg', data.message, 'error'); return; }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;
    updateNavForUser(data.user);
    showToast('Welcome back, ' + data.user.name + '!', 'success');
    showPage(data.user.role === 'admin' ? 'admin' : 'dashboard');
  } catch (e) {
    showMsg('loginMsg', 'Cannot connect to server. Is the backend running?', 'error');
  }
}

async function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const company = document.getElementById('signupCompany').value.trim();

  if (!name || !email || !password) { showMsg('signupMsg', 'Please fill all required fields.', 'error'); return; }

  try {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, company })
    });
    const data = await res.json();
    if (!data.success) { showMsg('signupMsg', data.message, 'error'); return; }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;
    updateNavForUser(data.user);
    showToast('Account created! Welcome, ' + data.user.name, 'success');
    showPage('dashboard');
  } catch (e) {
    showMsg('signupMsg', 'Cannot connect to server. Is the backend running?', 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  currentReport = null;
  updateNavForUser(null);
  showToast('Signed out successfully.', 'info');
  showPage('landing');
}

function getToken() { return localStorage.getItem('token'); }

function updateNavForUser(user) {
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  document.getElementById('navLogin').style.display = isLoggedIn ? 'none' : 'inline-flex';
  document.getElementById('navLogout').style.display = isLoggedIn ? 'inline' : 'none';
  document.getElementById('navDashboard').style.display = isLoggedIn && !isAdmin ? 'inline' : 'none';
  document.getElementById('navAnalysis').style.display = isLoggedIn && !isAdmin ? 'inline' : 'none';
  document.getElementById('navAdmin').style.display = isAdmin ? 'inline' : 'none';
}

/* =====================================================
   DASHBOARD
   ===================================================== */
async function loadDashboard() {
  if (!currentUser) return;

  const name = currentUser.name;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarRole').textContent = currentUser.company || 'User';
  document.getElementById('dashWelcome').textContent = `Good to see you, ${name.split(' ')[0]}!`;

  try {
    const res = await fetch(`${API}/user/reports`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;
    const reports = data.reports;

    document.getElementById('kpiTotal').textContent = reports.length;

    if (reports.length > 0) {
      const latest = reports[0];
      document.getElementById('kpiScore').textContent = latest.score;
      document.getElementById('kpiScore').className = `kpi-value ${scoreColor(latest.score)}`;
      document.getElementById('kpiRisk').textContent = latest.risk_level;
      document.getElementById('kpiRisk').className = `kpi-value ${riskColor(latest.risk_level)}`;
      document.getElementById('kpiDecision').textContent = latest.decision;
      document.getElementById('kpiDecision').className = `kpi-value ${decisionColor(latest.decision)}`;
      drawGauge('scoreGauge', latest.score);
      document.getElementById('gaugeLabel').textContent = `Score: ${latest.score}/100`;
    }

    // Recent reports list
    const recentEl = document.getElementById('recentReports');
    if (reports.length === 0) {
      recentEl.innerHTML = `<div class="empty-state">No analyses yet. <a href="#" onclick="showPage('analysis')">Run your first analysis →</a></div>`;
    } else {
      recentEl.innerHTML = reports.slice(0, 5).map(r => `
        <div class="report-item" onclick="viewReport(${r.id})" style="cursor:pointer">
          <div>
            <div style="font-weight:600">${formatDate(r.created_at)}</div>
            <div style="font-size:11px;color:var(--grey-400);margin-top:2px">${r.decision} · ${r.risk_level} Risk</div>
          </div>
          <div class="report-score ${scoreColor(r.score)}">${r.score}</div>
        </div>
      `).join('');
    }
  } catch(e) { console.error(e); }
}

async function loadHistory() {
  try {
    const res = await fetch(`${API}/user/reports`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;

    const el = document.getElementById('historyList');
    if (data.reports.length === 0) {
      el.innerHTML = `<div class="empty-state">No reports found.</div>`;
      return;
    }
    el.innerHTML = data.reports.map(r => `
      <div class="history-card" onclick="viewReport(${r.id})">
        <div class="hc-top">
          <div class="hc-score ${scoreColor(r.score)}">${r.score}</div>
          <span class="badge badge-${r.risk_level.toLowerCase()}">${r.risk_level} Risk</span>
        </div>
        <div class="hc-row">
          <span class="hc-label">Decision</span>
          <span class="hc-val ${decisionColor(r.decision)}">${r.decision}</span>
        </div>
        <div class="hc-row">
          <span class="hc-label">Date</span>
          <span class="hc-val">${formatDate(r.created_at)}</span>
        </div>
        <div class="hc-row">
          <span class="hc-label">Admin Status</span>
          <span class="hc-val">${r.admin_decision || 'Pending'}</span>
        </div>
      </div>
    `).join('');
  } catch(e) { console.error(e); }
}

async function viewReport(reportId) {
  try {
    const res = await fetch(`${API}/analysis/report/${reportId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) { showToast('Could not load report.', 'error'); return; }
    currentReport = data.report;
    showPage('report');
  } catch(e) { showToast('Error loading report.', 'error'); }
}

/* =====================================================
   ANALYSIS
   ===================================================== */
function resetAnalysis() {
  document.getElementById('analysisFormPanel').style.display = 'flex';
  document.getElementById('analysisFormPanel').style.flexDirection = 'column';
  document.getElementById('analysisResultPanel').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = false;
  document.getElementById('analyzeBtnText').style.display = 'inline';
  document.getElementById('btnLoader').style.display = 'none';
  document.getElementById('analysisMsg').textContent = '';
}

async function runAnalysis() {
  const revenue = document.getElementById('revenue').value;
  const expenses = document.getElementById('expenses').value;
  const gst_status = document.getElementById('gstStatus').value;
  const loan_history = document.getElementById('loanHistory').value;
  const years_in_business = document.getElementById('yearsInBiz').value || 1;
  const industry = document.getElementById('industry').value;

  if (!revenue || !expenses || !gst_status || !loan_history) {
    showMsg('analysisMsg', 'Please fill all required fields.', 'error');
    return;
  }

  // Loading state
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtnText').style.display = 'none';
  document.getElementById('btnLoader').style.display = 'inline-block';
  showLoading('Analyzing financial data...');

  try {
    const res = await fetch(`${API}/analysis/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ revenue: parseFloat(revenue), expenses: parseFloat(expenses), gst_status, loan_history, years_in_business: parseInt(years_in_business), industry })
    });
    const data = await res.json();
    hideLoading();
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtnText').style.display = 'inline';
    document.getElementById('btnLoader').style.display = 'none';

    if (!data.success) { showMsg('analysisMsg', data.message, 'error'); return; }

    const r = data.result;
    currentReport = { id: data.report_id, score: r.score, risk_level: r.risk_level, decision: r.decision, ai_summary: r.ai_summary, factors: r.factors, revenue: parseFloat(revenue), expenses: parseFloat(expenses), gst_status, loan_history, metrics: r.metrics };

    // Show result panel
    document.getElementById('analysisFormPanel').style.display = 'none';
    const rp = document.getElementById('analysisResultPanel');
    rp.style.display = 'block';

    document.getElementById('resultScore').textContent = r.score;
    document.getElementById('resultScore').className = `score-big ${scoreColor(r.score)}`;
    document.getElementById('resultRisk').textContent = r.risk_level + ' Risk';
    document.getElementById('resultRisk').className = `risk-badge badge-${r.risk_level.toLowerCase()}`;

    const dd = document.getElementById('resultDecision');
    const di = document.getElementById('decisionIcon');
    const dt = document.getElementById('decisionText');
    dt.textContent = r.decision;
    if (r.decision === 'Approved') { dd.style.borderTop = '3px solid #34d399'; di.textContent = '✓'; }
    else if (r.decision === 'Risky') { dd.style.borderTop = '3px solid #f59e0b'; di.textContent = '⚠'; }
    else { dd.style.borderTop = '3px solid #ef4444'; di.textContent = '✗'; }

    drawGauge('resultGauge', r.score);

    // Factors grid
    const fg = document.getElementById('factorsGrid');
    fg.innerHTML = (r.factors || []).map(f => `
      <div class="factor-item">
        <span class="factor-label">${f.label}</span>
        <span class="factor-impact ${f.type}">${f.impact}</span>
      </div>
    `).join('');

    document.getElementById('aiSummaryText').textContent = r.ai_summary;
    showToast('Analysis complete!', 'success');
  } catch(e) {
    hideLoading();
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtnText').style.display = 'inline';
    document.getElementById('btnLoader').style.display = 'none';
    showMsg('analysisMsg', 'Server error. Is the backend running?', 'error');
  }
}

/* =====================================================
   REPORT PAGE
   ===================================================== */
function renderReportPage(r) {
  document.getElementById('reportId').textContent = '#' + (r.id || '—');
  document.getElementById('reportDate').textContent = r.created_at ? formatDate(r.created_at) : formatDate(new Date());
  document.getElementById('reportCompany').textContent = currentUser?.company || currentUser?.name || '—';
  document.getElementById('reportAdminStatus').textContent = r.admin_decision || 'Pending Review';

  document.getElementById('rsdScore').textContent = r.score;
  document.getElementById('rptRisk').textContent = r.risk_level || '—';
  document.getElementById('rptRisk').className = `badge badge-${(r.risk_level || '').toLowerCase()}`;
  document.getElementById('rptDecision').textContent = r.decision || '—';
  document.getElementById('rptDecision').className = `badge badge-${(r.decision || '').toLowerCase()}`;
  document.getElementById('rptMargin').textContent = r.metrics?.profitMargin ? r.metrics.profitMargin + '%' : (r.revenue && r.expenses ? (((r.revenue - r.expenses)/r.revenue)*100).toFixed(1) + '%' : '—');

  document.getElementById('rptRevenue').textContent = r.revenue ? '₹' + Number(r.revenue).toLocaleString('en-IN') : '—';
  document.getElementById('rptExpenses').textContent = r.expenses ? '₹' + Number(r.expenses).toLocaleString('en-IN') : '—';
  document.getElementById('rptGst').textContent = r.gst_status ? r.gst_status.charAt(0).toUpperCase() + r.gst_status.slice(1) : '—';

  document.getElementById('rptAiSummary').textContent = r.ai_summary || '—';

  // Factors
  const factorsEl = document.getElementById('rptFactors');
  if (r.factors && r.factors.length) {
    factorsEl.innerHTML = r.factors.map(f => `
      <div class="factor-row">
        <span>${f.label}</span>
        <span class="impact ${f.type === 'positive' ? 'pos' : f.type === 'negative' ? 'neg' : ''}">${f.impact}</span>
      </div>
    `).join('');
  } else {
    factorsEl.innerHTML = '<div style="font-size:12px;color:var(--grey-600)">Factor details not available for this report.</div>';
  }
}

function printReport() {
  window.print();
}

/* =====================================================
   ADMIN PANEL
   ===================================================== */
async function loadAdminPanel() {
  if (!currentUser || currentUser.role !== 'admin') return;
  document.getElementById('adminOverview').style.display = 'block';
  document.getElementById('adminUsers').style.display = 'none';
  document.getElementById('adminReports').style.display = 'none';
  loadAdminStats();
  loadAdminRecentReports();
}

async function loadAdminStats() {
  try {
    const res = await fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;
    document.getElementById('akpiUsers').textContent = s.total_users;
    document.getElementById('akpiReports').textContent = s.total_reports;
    document.getElementById('akpiApproved').textContent = s.approved;
    document.getElementById('akpiRejected').textContent = s.rejected;
    document.getElementById('akpiAvg').textContent = s.avg_score || '—';
    document.getElementById('akpiPending').textContent = s.pending_review;
  } catch(e) { console.error(e); }
}

async function loadAdminRecentReports() {
  try {
    const res = await fetch(`${API}/admin/reports`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;
    const pending = data.reports.filter(r => r.admin_decision === 'pending').slice(0, 5);
    const el = document.getElementById('adminRecentReports');
    if (pending.length === 0) { el.innerHTML = `<div class="empty-state">No reports pending review.</div>`; return; }
    el.innerHTML = pending.map(r => `
      <div class="report-item">
        <div>
          <div style="font-weight:600">${r.user_name} — ${r.company || 'N/A'}</div>
          <div style="font-size:11px;color:var(--grey-400);margin-top:2px">Score: ${r.score} · ${r.risk_level} · ${formatDate(r.created_at)}</div>
        </div>
        <button class="btn-review" onclick="openDecisionModal(${r.id})">Review</button>
      </div>
    `).join('');
  } catch(e) { console.error(e); }
}

async function loadAdminUsers() {
  try {
    const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('userCountBadge').textContent = data.users.length + ' users';
    const tbody = document.getElementById('usersTableBody');
    if (data.users.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No users found.</td></tr>`; return; }
    tbody.innerHTML = data.users.map((u, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.company || '—'}</td>
        <td><span class="badge badge-low">${u.report_count} reports</span></td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
  } catch(e) { console.error(e); }
}

async function loadAdminReports() {
  try {
    const res = await fetch(`${API}/admin/reports`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('reportCountBadge').textContent = data.reports.length + ' reports';
    const tbody = document.getElementById('reportsTableBody');
    if (data.reports.length === 0) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No reports found.</td></tr>`; return; }
    tbody.innerHTML = data.reports.map((r, i) => `
      <tr>
        <td>#${r.id}</td>
        <td>${r.company || r.user_name}</td>
        <td><strong>${r.score}</strong></td>
        <td><span class="badge badge-${r.risk_level.toLowerCase()}">${r.risk_level}</span></td>
        <td><span class="badge badge-${r.decision.toLowerCase()}">${r.decision}</span></td>
        <td>${r.admin_decision === 'pending' ? '<span class="badge badge-medium">Pending</span>' : r.admin_decision === 'approved' ? '<span class="badge badge-approved">Approved</span>' : '<span class="badge badge-rejected">Rejected</span>'}</td>
        <td>${formatDate(r.created_at)}</td>
        <td>${r.admin_decision === 'pending' ? `<button class="btn-review" onclick="openDecisionModal(${r.id})">Review</button>` : '—'}</td>
      </tr>
    `).join('');
  } catch(e) { console.error(e); }
}

function openDecisionModal(reportId) {
  pendingReviewId = reportId;
  document.getElementById('modalReportId').textContent = '#' + reportId;
  document.getElementById('adminNotes').value = '';
  document.getElementById('decisionModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('decisionModal').style.display = 'none';
  pendingReviewId = null;
}

async function submitDecision(decision) {
  if (!pendingReviewId) return;
  const notes = document.getElementById('adminNotes').value;
  try {
    const res = await fetch(`${API}/admin/reports/${pendingReviewId}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ decision, notes })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Report ${decision} successfully.`, 'success');
      closeModal();
      loadAdminStats();
      loadAdminRecentReports();
      if (document.getElementById('adminReports').style.display !== 'none') loadAdminReports();
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) { showToast('Server error.', 'error'); }
}

/* =====================================================
   CANVAS GAUGE
   ===================================================== */
function drawGauge(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.85;
  const r = Math.min(w, h * 2) * 0.38;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.stroke();

  // Score color
  const color = score >= 70 ? '#00897b' : score >= 45 ? '#f59e0b' : '#dc2626';
  const angle = Math.PI + (score / 100) * Math.PI;

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, angle, false);
  ctx.lineWidth = 12;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 0.42)}px DM Sans, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score, cx, cy - r * 0.12);
}

/* =====================================================
   HELPERS
   ===================================================== */
function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `form-msg ${type}`;
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.classList.remove('show'); }, 3500);
}

function showLoading(text = 'Processing...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function scoreColor(score) {
  if (score >= 70) return 'approved-color';
  if (score >= 45) return 'risky-color';
  return 'rejected-color';
}

function riskColor(risk) {
  if (risk === 'Low') return 'approved-color';
  if (risk === 'Medium') return 'risky-color';
  return 'rejected-color';
}

function decisionColor(d) {
  if (d === 'Approved') return 'approved-color';
  if (d === 'Risky') return 'risky-color';
  return 'rejected-color';
}

/* =====================================================
   INIT — Check existing session
   ===================================================== */
(function init() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      currentUser = JSON.parse(userStr);
      updateNavForUser(currentUser);
    } catch(e) { localStorage.clear(); }
  }
  showPage('landing');
})();
