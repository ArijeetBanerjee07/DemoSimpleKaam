const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from PostgreSQL (exclude password)
      const result = await pool.query(
        'SELECT id, email, name, role, company, phone, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (!result.rows[0]) return res.status(401).json({ message: 'User not found' });

      req.user = result.rows[0];
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
