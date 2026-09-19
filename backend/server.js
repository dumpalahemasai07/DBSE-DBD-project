const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Readiness Guard for API routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database connection is not ready. Please try again in a moment.'
    });
  }
  next();
});

// Routes
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const providerRoutes = require('./routes/providers');
const paymentRoutes = require('./routes/payments');

app.use('/api/services', serviceRoutes);
app.use('/api/categories', (req, res, next) => {
  const { getCategories } = require('./controllers/serviceController');
  getCategories(req, res, next);
});
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/payments', paymentRoutes);

// Static Frontend Serving
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handling
app.use(errorHandler);

// Database Connection & Server Launch
async function startServer() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.DB_URI);
    console.log(`✅ MongoDB Atlas connected successfully to database: ${mongoose.connection.name}`);
    
    app.listen(PORT, () => {
      console.log(`🚀 HomeEase Server is running on port ${PORT}`);
      console.log(`🌐 Application URL: http://localhost:${PORT}/`);
      
      const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
      const hasKey = Boolean(keyId && !keyId.includes('your_razorpay_key_id'));
      const hasSecret = Boolean(keySecret && !keySecret.includes('your_razorpay_key_secret'));

      console.log(`💳 Razorpay Key ID Configured: ${hasKey ? 'YES' : 'NO (RAZORPAY_KEY_ID missing in backend/.env)'}`);
      console.log(`💳 Razorpay Key Secret Configured: ${hasSecret ? 'YES' : 'NO (RAZORPAY_KEY_SECRET missing in backend/.env)'}`);
      console.log(`💳 Razorpay Mode: TEST`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}

startServer();
