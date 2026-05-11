const express = require('express');
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/leads ────────────────────────────────────────────────────────
// Save or update lead data (upsert by email)
router.post('/', async (req, res) => {
  try {
    const { email, userId, name, role, team_size, location, phone, pain_point, persona } = req.body;

    // Upsert: update if email exists, insert otherwise
    const result = await pool.query(
      `INSERT INTO leads (user_id, name, role, team_size, location, phone, pain_point, persona)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [userId || null, name || '', role || '', team_size || '', location || '', phone || '', pain_point || '', persona || 'Unknown']
    );

    // If nothing was inserted (conflict), do an update by user_id
    if (result.rows.length === 0 && userId) {
      const updated = await pool.query(
        `UPDATE leads
         SET name=$1, role=$2, team_size=$3, location=$4, phone=$5, pain_point=$6, persona=$7
         WHERE user_id=$8
         RETURNING *`,
        [name || '', role || '', team_size || '', location || '', phone || '', pain_point || '', persona || 'Unknown', userId]
      );
      return res.json(updated.rows[0] || {});
    }

    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/leads  (protected) ───────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/leads/my  (protected) ────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leads WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
