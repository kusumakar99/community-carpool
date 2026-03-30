try { require('dotenv').config(); } catch {}

const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('Starting Community CarPool server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

let authRoutes, tripRoutes, joinRequestRoutes, creditRoutes, adminRoutes, communityRoutes;
try {
  authRoutes = require('./routes/auth');
  tripRoutes = require('./routes/trips');
  joinRequestRoutes = require('./routes/joinRequests');
  creditRoutes = require('./routes/credits');
  adminRoutes = require('./routes/admin');
  communityRoutes = require('./routes/communities');
  console.log('All routes loaded successfully');
} catch (err) {
  console.error('FATAL: Failed to load routes:', err.message);
  console.error(err.stack);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check — first route, no DB needed
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: process.env.PORT });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api', joinRequestRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/communities', communityRoutes);

// Serve static frontend in production
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA catch-all — serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('sendFile error:', err.message);
      res.status(200).send('Community CarPool - App Loading...');
    }
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚗 Community CarPool server running on 0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('FATAL: Server failed to start:', err);
  process.exit(1);
});

module.exports = app;
