const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { calculateCreditScore } = require('../controllers/creditEngine');

// POST /analysis/submit — submit financial data and generate report
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { revenue, expenses, gst_status, loan_history, years_in_business, industry } = req.body;

    if (!revenue || !expenses || !gst_status || !loan_history) {
      return res.status(400).json({ success: false, message: 'Revenue, expenses, GST status and loan history are required.' });
    }

    const rev = parseFloat(revenue);
    const exp = parseFloat(expenses);

    if (isNaN(rev) || isNaN(exp) || rev <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid revenue or expenses values.' });
    }

    // Save financial data
    const [fdResult] = await db.execute(
      `INSERT INTO financial_data (user_id, revenue, expenses, gst_status, loan_history, years_in_business, industry)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, rev, exp, gst_status, loan_history, years_in_business || 1, industry || null]
    );

    // Run credit engine
    const result = calculateCreditScore({ revenue: rev, expenses: exp, gst_status, loan_history, years_in_business, industry });

    // Save report
    const [reportResult] = await db.execute(
      `INSERT INTO reports (user_id, financial_data_id, score, risk_level, decision, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, fdResult.insertId, result.score, result.risk_level, result.decision, result.ai_summary]
    );

    res.status(201).json({
      success: true,
      message: 'Credit analysis completed.',
      report_id: reportResult.insertId,
      result: {
        score: result.score,
        risk_level: result.risk_level,
        decision: result.decision,
        ai_summary: result.ai_summary,
        factors: result.factors,
        warnings: result.warnings,
        metrics: result.metrics
      }
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ success: false, message: 'Server error during analysis.' });
  }
});

// GET /analysis/report/:id
router.get('/report/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, u.name as user_name, u.email, u.company,
              fd.revenue, fd.expenses, fd.gst_status, fd.loan_history, fd.years_in_business, fd.industry
       FROM reports r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN financial_data fd ON r.financial_data_id = fd.id
       WHERE r.id = ? AND (r.user_id = ? OR ? = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
