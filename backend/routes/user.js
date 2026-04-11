const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /user/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, company, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /user/reports — user's own reports
router.get('/reports', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, fd.revenue, fd.expenses, fd.gst_status, fd.loan_history
       FROM reports r
       LEFT JOIN financial_data fd ON r.financial_data_id = fd.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, reports: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /user/reports/:id — single report
router.get('/reports/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, fd.revenue, fd.expenses, fd.gst_status, fd.loan_history, fd.years_in_business, fd.industry
       FROM reports r
       LEFT JOIN financial_data fd ON r.financial_data_id = fd.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
