require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('./config/db');

const app = express();

// Security middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(morgan('dev'));

// CORS — allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/employees', require('./routes/employees'));
app.use('/roles', require('./routes/roles'));
app.use('/attendance', require('./routes/attendance'));
app.use('/leave', require('./routes/leave'));
app.use('/payroll', require('./routes/payroll'));
app.use('/performance', require('./routes/performance'));
app.use('/recruitment', require('./routes/recruitment'));
app.use('/exit', require('./routes/exit'));
app.use('/departments', require('./routes/departments'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 EMS Backend running on http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});

module.exports = app;
