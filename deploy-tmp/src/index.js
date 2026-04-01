require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const joinRequestRoutes = require('./routes/joinRequests');
const creditRoutes = require('./routes/credits');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api', joinRequestRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend in production
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚗 Community CarPool server running on port ${PORT}`);
});

module.exports = app;
