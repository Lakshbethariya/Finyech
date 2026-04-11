/**
 * NextGen Credit Intelligence - Credit Score Engine
 * Rule-based scoring logic with AI-style explanations
 */

function calculateCreditScore(data) {
  const { revenue, expenses, gst_status, loan_history, years_in_business, industry } = data;

  let score = 50; // Base score
  const factors = [];
  const warnings = [];

  // --- REVENUE vs EXPENSES ANALYSIS ---
  const profitMargin = ((revenue - expenses) / revenue) * 100;

  if (profitMargin > 30) {
    score += 20;
    factors.push({ label: 'Strong Profit Margin', impact: '+20', type: 'positive', detail: `${profitMargin.toFixed(1)}% margin indicates excellent financial health` });
  } else if (profitMargin > 15) {
    score += 12;
    factors.push({ label: 'Healthy Profit Margin', impact: '+12', type: 'positive', detail: `${profitMargin.toFixed(1)}% margin shows stable operations` });
  } else if (profitMargin > 5) {
    score += 5;
    factors.push({ label: 'Moderate Profit Margin', impact: '+5', type: 'neutral', detail: `${profitMargin.toFixed(1)}% margin is acceptable but could improve` });
  } else if (profitMargin >= 0) {
    score -= 5;
    factors.push({ label: 'Thin Profit Margin', impact: '-5', type: 'negative', detail: `${profitMargin.toFixed(1)}% margin leaves little buffer for debt service` });
    warnings.push('Operating on thin margins increases default risk');
  } else {
    score -= 20;
    factors.push({ label: 'Operating at Loss', impact: '-20', type: 'negative', detail: `Expenses exceed revenue by ${Math.abs(profitMargin).toFixed(1)}%` });
    warnings.push('Business is currently operating at a loss');
  }

  // --- REVENUE SCALE ---
  if (revenue >= 10000000) { // 1 Crore+
    score += 10;
    factors.push({ label: 'High Revenue Volume', impact: '+10', type: 'positive', detail: 'Revenue exceeds ₹1 Cr indicating substantial business operations' });
  } else if (revenue >= 2500000) { // 25 Lakh+
    score += 6;
    factors.push({ label: 'Moderate Revenue', impact: '+6', type: 'positive', detail: 'Revenue indicates established business activity' });
  } else if (revenue >= 500000) { // 5 Lakh+
    score += 2;
    factors.push({ label: 'Early-Stage Revenue', impact: '+2', type: 'neutral', detail: 'Revenue indicates nascent but active business' });
  } else {
    score -= 5;
    factors.push({ label: 'Low Revenue Base', impact: '-5', type: 'negative', detail: 'Revenue base may be insufficient for loan servicing' });
  }

  // --- GST STATUS ---
  if (gst_status === 'active') {
    score += 10;
    factors.push({ label: 'GST Compliant', impact: '+10', type: 'positive', detail: 'Active GST registration confirms legal business operations' });
  } else if (gst_status === 'pending') {
    score += 2;
    factors.push({ label: 'GST Pending', impact: '+2', type: 'neutral', detail: 'GST registration in progress — await confirmation' });
  } else {
    score -= 8;
    factors.push({ label: 'GST Non-Compliant', impact: '-8', type: 'negative', detail: 'No GST registration raises compliance concerns' });
    warnings.push('GST non-compliance is a significant risk indicator');
  }

  // --- LOAN HISTORY ---
  if (loan_history === 'no_default') {
    score += 15;
    factors.push({ label: 'Clean Credit History', impact: '+15', type: 'positive', detail: 'No prior defaults demonstrates strong repayment discipline' });
  } else if (loan_history === 'minor_default') {
    score -= 10;
    factors.push({ label: 'Minor Past Default', impact: '-10', type: 'negative', detail: 'Previous minor default requires additional scrutiny' });
    warnings.push('Historical minor default detected — review circumstances');
  } else if (loan_history === 'major_default') {
    score -= 25;
    factors.push({ label: 'Major Default History', impact: '-25', type: 'negative', detail: 'Major prior default significantly elevates credit risk' });
    warnings.push('Major default history is a critical risk factor');
  }

  // --- BUSINESS TENURE ---
  const bizYears = parseInt(years_in_business) || 1;
  if (bizYears >= 5) {
    score += 8;
    factors.push({ label: 'Established Business', impact: '+8', type: 'positive', detail: `${bizYears} years in operation demonstrates market sustainability` });
  } else if (bizYears >= 2) {
    score += 4;
    factors.push({ label: 'Growing Business', impact: '+4', type: 'positive', detail: `${bizYears} years shows initial business stability` });
  } else {
    score -= 3;
    factors.push({ label: 'New Business', impact: '-3', type: 'neutral', detail: 'Less than 2 years of operational history' });
  }

  // --- DEBT SERVICE RATIO ---
  const monthlyRevenue = revenue / 12;
  const monthlyExpenses = expenses / 12;
  const availableForDebt = monthlyRevenue - monthlyExpenses;

  // Clamp score 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // --- RISK LEVEL & DECISION ---
  let risk_level, decision;

  if (score >= 70) {
    risk_level = 'Low';
    decision = 'Approved';
  } else if (score >= 45) {
    risk_level = 'Medium';
    decision = 'Risky';
  } else {
    risk_level = 'High';
    decision = 'Rejected';
  }

  // --- AI SUMMARY GENERATION ---
  const ai_summary = generateAISummary({ score, risk_level, decision, profitMargin, gst_status, loan_history, bizYears, availableForDebt, factors, warnings });

  return { score, risk_level, decision, ai_summary, factors, warnings, metrics: { profitMargin: profitMargin.toFixed(2), availableForDebt: availableForDebt.toFixed(2), debtServiceCapacity: availableForDebt > 0 ? 'Positive' : 'Negative' } };
}

function generateAISummary({ score, risk_level, decision, profitMargin, gst_status, loan_history, bizYears, availableForDebt, factors, warnings }) {
  const posCount = factors.filter(f => f.type === 'positive').length;
  const negCount = factors.filter(f => f.type === 'negative').length;

  let summary = `Credit Analysis Report — Score: ${score}/100 | Risk: ${risk_level} | Recommendation: ${decision}\n\n`;

  summary += `EXECUTIVE SUMMARY:\n`;
  if (decision === 'Approved') {
    summary += `This entity presents a strong credit profile with ${posCount} positive indicators and only ${negCount} areas of concern. `;
    summary += `With a profit margin of ${parseFloat(profitMargin).toFixed(1)}% and ${bizYears > 1 ? bizYears + ' years' : 'under 2 years'} of operational history, `;
    summary += `the applicant demonstrates adequate capacity to service debt obligations. Credit extension is recommended with standard monitoring protocols.\n\n`;
  } else if (decision === 'Risky') {
    summary += `This entity presents a moderate credit profile requiring enhanced due diligence. `;
    summary += `With ${posCount} positive and ${negCount} adverse factors identified, the overall risk exposure is manageable but notable. `;
    summary += `Conditional approval may be considered with collateral requirements, reduced loan-to-value ratios, or guarantor provisions.\n\n`;
  } else {
    summary += `This entity presents significant credit concerns with ${negCount} adverse indicators identified. `;
    summary += `The current financial profile does not meet minimum lending criteria. `;
    summary += `Application is recommended for rejection or deferral pending material improvement in financial performance.\n\n`;
  }

  summary += `KEY RISK FACTORS:\n`;
  if (gst_status !== 'active') summary += `• GST non-compliance raises questions about regulatory adherence and business legitimacy.\n`;
  if (loan_history === 'major_default') summary += `• Major historical default is the primary adverse factor and must be investigated thoroughly.\n`;
  if (loan_history === 'minor_default') summary += `• Minor historical default warrants review of repayment circumstances.\n`;
  if (parseFloat(profitMargin) < 10) summary += `• Thin profit margins limit debt repayment buffer and increase default probability under stress.\n`;
  if (availableForDebt < 0) summary += `• Negative monthly cash surplus indicates inability to service additional debt.\n`;
  if (warnings.length === 0) summary += `• No significant risk flags identified in automated screening.\n`;

  summary += `\nANALYSIS METHODOLOGY:\n`;
  summary += `This score is computed using NextGen Credit Intelligence's rule-based scoring engine incorporating revenue-expense analysis, GST compliance verification, credit history assessment, and business tenure evaluation. All decisions should be validated by a qualified credit officer before final approval.`;

  return summary;
}

module.exports = { calculateCreditScore };
