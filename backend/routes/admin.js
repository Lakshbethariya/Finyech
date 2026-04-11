const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// GET /admin/users — all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.role, u.company, u.created_at,
              COUNT(r.id) as report_count
       FROM users u
       LEFT JOIN reports r ON u.id = r.user_id
       WHERE u.role = 'user'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /admin/reports — all credit reports
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, u.name as user_name, u.email, u.company,
              fd.revenue, fd.expenses, fd.gst_status, fd.loan_history
       FROM reports r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN financial_data fd ON r.financial_data_id = fd.id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, reports: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /admin/stats — dashboard summary stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ total_users }]] = await db.execute("SELECT COUNT(*) as total_users FROM users WHERE role='user'");
    const [[{ total_reports }]] = await db.execute("SELECT COUNT(*) as total_reports FROM reports");
    const [[{ approved }]] = await db.execute("SELECT COUNT(*) as approved FROM reports WHERE decision='Approved'");
    const [[{ rejected }]] = await db.execute("SELECT COUNT(*) as rejected FROM reports WHERE decision='Rejected'");
    const [[{ risky }]] = await db.execute("SELECT COUNT(*) as risky FROM reports WHERE decision='Risky'");
    const [[{ avg_score }]] = await db.execute("SELECT AVG(score) as avg_score FROM reports");
    const [[{ pending }]] = await db.execute("SELECT COUNT(*) as pending FROM reports WHERE admin_decision='pending'");

    res.json({
      success: true,
      stats: {
        total_users,
        total_reports,
        approved,
        rejected,
        risky,
        avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : 0,
        pending_review: pending
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /admin/reports/:id/decision — admin approve/reject
router.patch('/reports/:id/decision', async (req, res) => {
  try {
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or rejected.' });
    }

    await db.execute(
      `UPDATE reports SET admin_decision = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [decision, notes || null, req.user.id, req.params.id]
    );

    // Log action
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, target_report_id) VALUES (?, ?, ?)',
      [req.user.id, `Report ${decision.toUpperCase()}`, req.params.id]
    );

    res.json({ success: true, message: `Report ${decision} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
