const auth = require('./auth');

// Admin middleware — must be used AFTER auth middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// Combined auth + admin check
const adminAuth = [auth, adminOnly];

module.exports = { adminOnly, adminAuth };
