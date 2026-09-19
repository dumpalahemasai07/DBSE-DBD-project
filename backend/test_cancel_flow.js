const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Service = require('./models/Service');
const Package = require('./models/Package');
const Payment = require('./models/Payment');

async function testCancelFlow() {
  require('./server');
  if (mongoose.connection.readyState !== 1) {
    await new Promise(r => mongoose.connection.once('open', r));
  }
  await new Promise(r => setTimeout(r, 500));

  console.log('========================================================');
  console.log('TESTING BOOKING CANCELLATION FLOW & ALL EDGE CASES');
  console.log('========================================================\n');

  try {
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);

    // Register User A (Owner)
    const timestamp = Date.now();
    const userAEmail = `cancel_owner_${timestamp}_${Math.random().toString(36).substring(7)}@homeease.com`;
    const userAPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const regResA = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cancel Tester A', email: userAEmail, password: 'Password123!', phone: userAPhone })
    });
    const regDataA = await regResA.json();
    if (!regDataA.success) throw new Error(`User A registration failed: ${regDataA.error}`);
    const tokenA = regDataA.data.token;

    // Register User B (Unauthorized Attacker)
    const userBEmail = `cancel_unauth_${timestamp}_${Math.random().toString(36).substring(7)}@homeease.com`;
    const userBPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const regResB = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cancel Tester B', email: userBEmail, password: 'Password123!', phone: userBPhone })
    });
    const regDataB = await regResB.json();
    if (!regDataB.success) throw new Error(`User B registration failed: ${regDataB.error}`);
    const tokenB = regDataB.data.token;

    // Fetch a service
    const serviceDoc = await Service.findOne({});
    const packageDoc = await Package.findOne({ service: serviceDoc._id });

    // Create Booking 1 for User A
    const b1Res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ serviceId: serviceDoc._id, serviceName: serviceDoc.name, variantTitle: packageDoc.name, price: packageDoc.discountPrice || packageDoc.price, quantity: 1 }],
        cartTotal: packageDoc.discountPrice || packageDoc.price,
        grandTotal: (packageDoc.discountPrice || packageDoc.price) + 49,
        date: '2026-10-01',
        timeSlot: '10:00 AM - 12:00 PM',
        address: 'Flat 101, Test Residency, Jubilee Hills, Hyderabad'
      })
    });
    const b1Data = await b1Res.json();
    const booking1 = b1Data.data;
    console.log(`\nCreated Booking 1 for User A. ID: ${booking1._id}, Number: ${booking1.bookingNumber}`);

    // TEST 1: Upcoming Booking Cancellation by Owner
    console.log('\n[TEST 1] Upcoming Booking Cancellation by Owner...');
    const cancel1Res = await fetch(`http://localhost:5000/api/bookings/${booking1._id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ cancellationReason: 'Plans changed for user' })
    });
    const cancel1Data = await cancel1Res.json();
    console.log(`Status: ${cancel1Res.status} | Response:`, cancel1Data);

    if (cancel1Res.status !== 200 || !cancel1Data.success) {
      throw new Error('TEST 1 Failed!');
    }

    // Verify in MongoDB Atlas
    const dbBooking1 = await Booking.findById(booking1._id);
    console.log('✅ MongoDB Direct Check for Booking 1:');
    console.log(` - bookingStatus: ${dbBooking1.bookingStatus}`);
    console.log(` - cancelledBy: ${dbBooking1.cancelledBy}`);
    console.log(` - cancellationReason: ${dbBooking1.cancellationReason}`);
    console.log(` - cancelledAt: ${dbBooking1.cancelledAt}`);
    console.log(` - paymentStatus: ${dbBooking1.paymentStatus}`);

    if (dbBooking1.bookingStatus !== 'CANCELLED' || !dbBooking1.cancelledAt || dbBooking1.cancellationReason !== 'Plans changed for user') {
      throw new Error('MongoDB verification failed for TEST 1');
    }

    // TEST 2: Attempting to Cancel Already Cancelled Booking
    console.log('\n[TEST 2] Attempting to Cancel Already Cancelled Booking...');
    const cancel2Res = await fetch(`http://localhost:5000/api/bookings/${booking1._id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` }
    });
    const cancel2Data = await cancel2Res.json();
    console.log(`Status: ${cancel2Res.status} | Error: "${cancel2Data.error}"`);
    if (cancel2Res.status !== 400 || cancel2Data.success) {
      throw new Error('TEST 2 Failed! Expected 400 Bad Request');
    }
    console.log('✅ TEST 2 Passed: Rejecting already cancelled booking.');

    // TEST 3: Attempting to Cancel Completed Booking
    console.log('\n[TEST 3] Attempting to Cancel Completed Booking...');
    const b2Res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ serviceId: serviceDoc._id, serviceName: serviceDoc.name, variantTitle: packageDoc.name, price: packageDoc.discountPrice || packageDoc.price, quantity: 1 }],
        cartTotal: packageDoc.discountPrice || packageDoc.price,
        grandTotal: (packageDoc.discountPrice || packageDoc.price) + 49,
        date: '2026-10-02',
        timeSlot: '02:00 PM - 04:00 PM',
        address: 'Flat 102, Test Residency, Jubilee Hills, Hyderabad'
      })
    });
    const b2Data = await b2Res.json();
    const booking2 = b2Data.data;
    
    // Set booking 2 to COMPLETED in MongoDB
    await Booking.findByIdAndUpdate(booking2._id, { bookingStatus: 'COMPLETED' });

    const cancel3Res = await fetch(`http://localhost:5000/api/bookings/${booking2._id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` }
    });
    const cancel3Data = await cancel3Res.json();
    console.log(`Status: ${cancel3Res.status} | Error: "${cancel3Data.error}"`);
    if (cancel3Res.status !== 400 || cancel3Data.success) {
      throw new Error('TEST 3 Failed! Expected 400 Bad Request');
    }
    console.log('✅ TEST 3 Passed: Rejecting completed booking cancellation.');

    // TEST 4: Invalid Booking ID
    console.log('\n[TEST 4] Invalid Booking ID...');
    const cancel4Res = await fetch(`http://localhost:5000/api/bookings/666666666666666666666666/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` }
    });
    const cancel4Data = await cancel4Res.json();
    console.log(`Status: ${cancel4Res.status} | Error: "${cancel4Data.error}"`);
    if (cancel4Res.status !== 404 || cancel4Data.success) {
      throw new Error('TEST 4 Failed! Expected 404 Not Found');
    }
    console.log('✅ TEST 4 Passed: 404 returned for invalid booking ID.');

    // TEST 5: Unauthorized User Attempting to Cancel Another User's Booking
    console.log('\n[TEST 5] Unauthorized User Attempting to Cancel Another User\'s Booking...');
    const b3Res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        items: [{ serviceId: serviceDoc._id, serviceName: serviceDoc.name, variantTitle: packageDoc.name, price: packageDoc.discountPrice || packageDoc.price, quantity: 1 }],
        cartTotal: packageDoc.discountPrice || packageDoc.price,
        grandTotal: (packageDoc.discountPrice || packageDoc.price) + 49,
        date: '2026-10-03',
        timeSlot: '04:00 PM - 06:00 PM',
        address: 'Flat 103, Test Residency, Jubilee Hills, Hyderabad'
      })
    });
    const b3Data = await b3Res.json();
    const booking3 = b3Data.data;

    // User B attempts to cancel User A's booking3
    const cancel5Res = await fetch(`http://localhost:5000/api/bookings/${booking3._id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` }
    });
    const cancel5Data = await cancel5Res.json();
    console.log(`Status: ${cancel5Res.status} | Error: "${cancel5Data.error}"`);
    if (cancel5Res.status !== 403 || cancel5Data.success) {
      throw new Error('TEST 5 Failed! Expected 403 Forbidden');
    }
    console.log('✅ TEST 5 Passed: 403 Forbidden returned for unauthorized user cancellation.');

    console.log('\n========================================================');
    console.log('ALL CANCELLATION WORKFLOW TESTS PASSED SUCCESSFULLY! 💯');
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Cancellation Test Error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

testCancelFlow();
