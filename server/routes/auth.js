const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/check-email ─────────────────────────────────────────────
// Returns { exists: true/false } — used by frontend to decide sign-up vs login
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, company, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    // Check duplicate
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ message: 'Email already registered' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, company, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, company, phone, created_at`,
      [email.toLowerCase(), hashed, name, role || '', company || '', phone || '']
    );

    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'No account found for this email' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    // Return user without password
    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/auth/profile  (protected) ────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, role, company, phone } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name    = COALESCE(NULLIF($1, ''), name),
           role    = COALESCE(NULLIF($2, ''), role),
           company = COALESCE(NULLIF($3, ''), company),
           phone   = COALESCE(NULLIF($4, ''), phone)
       WHERE id = $5
       RETURNING id, email, name, role, company, phone, created_at`,
      [name || '', role || '', company || '', phone || '', req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me  (protected) ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
