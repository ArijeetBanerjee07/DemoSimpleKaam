const dotenv    = require('dotenv');
dotenv.config(); // ← must be FIRST before any other require that reads env vars

const express   = require('express');
const cors      = require('cors');
const { connectDB } = require('./config/db');

connectDB();

const app = express();

// ── CORS — allow Vite dev server ───────────────────────────────────────────
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'postgresql' }));

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
