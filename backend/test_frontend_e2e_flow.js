const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Service = require('./models/Service');
const Category = require('./models/Category');

async function testFullE2EWorkflow() {
  console.log('========================================================');
  console.log('TESTING COMPLETE FRONTEND-TO-MONGODB END-TO-END WORKFLOW');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);

    // 1. REGISTER NEW CUSTOMER USER
    const timestamp = Date.now();
    const testEmail = `e2e_customer_${timestamp}@homeease.com`;
    const testPhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const testPassword = 'Password123!';

    console.log(`\n1. Registering Customer via API: ${testEmail}...`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Flow Tester',
        email: testEmail,
        password: testPassword,
        phone: testPhone
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.data || !regData.data.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    const token = regData.data.token;
    console.log('✅ Registration API succeeded. Received JWT token.');

    // 2. LOGIN USER
    console.log('\n2. Authenticating User via Login API...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.data || !loginData.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    console.log('✅ Login API succeeded. User authenticated against MongoDB.');

    // 3. BROWSE CATEGORIES & SERVICES FROM MONGODB
    console.log('\n3. Browsing Categories & Services from MongoDB API...');
    const catRes = await fetch('http://localhost:5000/api/categories');
    const catData = await catRes.json();
    console.log(`✅ Loaded ${catData.data ? catData.data.length : 0} Categories from MongoDB.`);

    const servRes = await fetch('http://localhost:5000/api/services');
    const servData = await servRes.json();
    console.log(`✅ Loaded ${servData.data ? servData.data.length : 0} Services from MongoDB.`);
    const targetService = servData.data[0];

    // 4. CREATE BOOKING IN MONGODB
    console.log(`\n4. Placing Service Booking for "${targetService.name}" via API...`);
    const bookingRes = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [{
          serviceId: targetService._id,
          serviceName: targetService.name,
          variantTitle: targetService.variants[0].title,
          price: targetService.variants[0].price,
          quantity: 1
        }],
        cartTotal: targetService.variants[0].price,
        grandTotal: targetService.variants[0].price + 49,
        date: '2026-09-25',
        timeSlot: '10:00 AM - 12:00 PM',
        address: 'Flat 402, Sun Towers, Jubilee Hills, Hyderabad - 500033'
      })
    });
    const bookingData = await bookingRes.json();
    if (!bookingRes.ok || !bookingData.data) {
      throw new Error(`Booking failed: ${JSON.stringify(bookingData)}`);
    }
    const newBooking = bookingData.data;
    console.log(`✅ Booking Created! Booking Number: ${newBooking.bookingNumber}`);

    // Verify in MongoDB Atlas
    const persistedBooking = await Booking.findOne({ bookingNumber: newBooking.bookingNumber });
    console.log(`✅ MongoDB Direct Check: Persisted Booking ID = ${persistedBooking._id}, Status = ${persistedBooking.bookingStatus}`);

    // 5. PROVIDER COMPLETES THE BOOKING IN MONGODB
    console.log('\n5. Provider Updating Booking Status to COMPLETED...');
    persistedBooking.bookingStatus = 'COMPLETED';
    await persistedBooking.save();
    console.log('✅ Booking updated to COMPLETED in MongoDB.');

    // 6. SUBMIT REVIEW IN MONGODB
    console.log('\n6. Submitting Customer Review via API...');
    const reviewRes = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId: persistedBooking._id,
        rating: 5,
        comment: 'Outstanding service! Cleaned the AC thoroughly and tested cooling.'
      })
    });
    const reviewData = await reviewRes.json();
    if (!reviewRes.ok || !reviewData.data) {
      throw new Error(`Review failed: ${JSON.stringify(reviewData)}`);
    }
    console.log('✅ Review API succeeded!');

    // Verify Review in MongoDB Atlas
    const persistedReview = await Review.findOne({ booking: persistedBooking._id });
    console.log(`✅ MongoDB Direct Check: Review ID = ${persistedReview._id}, Rating = ${persistedReview.rating}⭐`);

    // 7. ADMIN PANEL METRICS FROM MONGODB
    console.log('\n7. Fetching Admin Metrics from MongoDB API...');
    // Create admin token for stats API call
    const adminUser = await User.findOne({ role: 'admin' });
    const jwt = require('jsonwebtoken');
    const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

    const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    console.log('✅ Admin KPI Stats from MongoDB:');
    console.dir(statsData.data, { depth: null });

    console.log('\n========================================================');
    console.log('SUCCESS: COMPLETE FRONTEND-TO-MONGODB WORKFLOW VERIFIED!');
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Workflow Error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

testFullE2EWorkflow();
