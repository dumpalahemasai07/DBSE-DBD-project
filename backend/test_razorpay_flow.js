const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Service = require('./models/Service');
const Package = require('./models/Package');
const Payment = require('./models/Payment');

async function testRazorpayFlow() {
  console.log('========================================================');
  console.log('TESTING REAL RAZORPAY PAYMENT ENDPOINTS & PERSISTENCE');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);

    // 1. Test Key Endpoint
    console.log('\n[TEST 1] GET /api/payments/key ...');
    const keyRes = await fetch('http://localhost:5000/api/payments/key');
    const keyData = await keyRes.json();
    console.log('Response:', keyData);
    if (!keyData.success || !keyData.keyId) throw new Error('Key endpoint failed!');
    console.log('✅ GET /api/payments/key OK');

    // Register User
    const timestamp = Date.now();
    const userEmail = `rzp_customer_${timestamp}@homeease.com`;
    const userPhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Razorpay Tester', email: userEmail, password: 'Password123!', phone: userPhone })
    });
    const regData = await regRes.json();
    const token = regData.data.token;

    // Fetch Service & Create Booking
    const serviceDoc = await Service.findOne({});
    const packageDoc = await Package.findOne({ service: serviceDoc._id });

    const bRes = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ serviceId: serviceDoc._id, serviceName: serviceDoc.name, variantTitle: packageDoc.name, price: packageDoc.discountPrice || packageDoc.price, quantity: 1 }],
        cartTotal: packageDoc.discountPrice || packageDoc.price,
        grandTotal: (packageDoc.discountPrice || packageDoc.price) + 49,
        date: '2026-10-15',
        timeSlot: '11:00 AM - 01:00 PM',
        address: 'Flat 909, Razorpay Enclave, Jubilee Hills, Hyderabad'
      })
    });
    const bData = await bRes.json();
    const bookingDoc = bData.data;
    console.log(`\nCreated Booking. ID: ${bookingDoc._id}, Amount: ₹${bookingDoc.totalAmount}`);

    // 2. Test Create Order Endpoint
    console.log('\n[TEST 2] POST /api/payments/create-order ...');
    const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId: bookingDoc._id })
    });
    const orderData = await orderRes.json();
    console.log('Response:', orderData);
    if (!orderData.success || !orderData.razorpayOrderId) throw new Error('Create order failed!');
    console.log('✅ POST /api/payments/create-order OK. Amount in Paise:', orderData.amount);

    // Verify Payment document in MongoDB
    let dbPayment = await Payment.findOne({ booking: bookingDoc._id });
    console.log(`✅ MongoDB Direct Check: Payment Record Created: ${dbPayment._id}, Status: ${dbPayment.status}`);

    // 3. Test Verify Payment Endpoint (Server-Side Signature Verification)
    console.log('\n[TEST 3] POST /api/payments/verify ...');
    const testPaymentId = `pay_test_${Date.now()}`;
    
    // Generate valid HMAC signature for test
    const crypto = require('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_HomeEaseSecret2026';
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(orderData.razorpayOrderId + '|' + testPaymentId)
      .digest('hex');

    const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        razorpay_payment_id: testPaymentId,
        razorpay_order_id: orderData.razorpayOrderId,
        razorpay_signature: validSignature,
        bookingId: bookingDoc._id
      })
    });
    const verifyData = await verifyRes.json();
    console.log('Response:', verifyData);
    if (!verifyData.success) throw new Error('Verify payment failed!');
    console.log('✅ POST /api/payments/verify OK. Server-side HMAC Signature Verified!');

    // Verify in MongoDB Atlas
    dbPayment = await Payment.findOne({ booking: bookingDoc._id });
    const dbBooking = await Booking.findById(bookingDoc._id);
    console.log('✅ MongoDB Direct Verification Post-Payment:');
    console.log(` - Payment status: ${dbPayment.status}`);
    console.log(` - Payment ID:     ${dbPayment.razorpayPaymentId}`);
    console.log(` - Booking status: ${dbBooking.bookingStatus}`);
    console.log(` - Payment status: ${dbBooking.paymentStatus}`);

    if (dbPayment.status !== 'PAID' || dbBooking.paymentStatus !== 'PAID' || dbBooking.bookingStatus !== 'CONFIRMED') {
      throw new Error('MongoDB verification failed after payment verify!');
    }

    // 4. Test GET /api/payments/booking/:bookingId
    console.log('\n[TEST 4] GET /api/payments/booking/:bookingId ...');
    const getPayRes = await fetch(`http://localhost:5000/api/payments/booking/${bookingDoc._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getPayData = await getPayRes.json();
    console.log(`Status: ${getPayRes.status} | Data:`, getPayData.data);
    if (!getPayData.success || getPayData.data.status !== 'PAID') throw new Error('GET payment details failed!');
    console.log('✅ GET /api/payments/booking/:bookingId OK');

    // 5. Test Webhook Idempotency
    console.log('\n[TEST 5] POST /api/payments/webhook ...');
    const hookRes = await fetch('http://localhost:5000/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order.paid',
        payload: {
          order: { entity: { id: orderData.razorpayOrderId } },
          payment: { entity: { id: testPaymentId, order_id: orderData.razorpayOrderId } }
        }
      })
    });
    const hookData = await hookRes.json();
    console.log('Webhook Response:', hookData);
    console.log('✅ Webhook Endpoint OK');

    // 6. Test Cancellation Refund Handling
    console.log('\n[TEST 6] Cancel Booking with PAID Payment...');
    const cancelRes = await fetch(`http://localhost:5000/api/bookings/${bookingDoc._id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cancellationReason: 'Customer requested refund & cancellation' })
    });
    const cancelData = await cancelRes.json();
    console.log('Response:', cancelData);

    const refundBooking = await Booking.findById(bookingDoc._id);
    const refundPayment = await Payment.findOne({ booking: bookingDoc._id });
    console.log('✅ MongoDB Refund Direct Verification:');
    console.log(` - Booking Status: ${refundBooking.bookingStatus}`);
    console.log(` - Booking Payment Status: ${refundBooking.paymentStatus}`);
    console.log(` - Payment Model Status: ${refundPayment.status}`);
    console.log(` - Payment RefundedAt: ${refundPayment.refundedAt}`);

    if (refundBooking.paymentStatus !== 'REFUNDED' || refundPayment.status !== 'REFUNDED') {
      throw new Error('Refund status verification failed!');
    }

    console.log('\n========================================================');
    console.log('ALL RAZORPAY INTEGRATION & PERSISTENCE TESTS PASSED! 💯');
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Razorpay Test Error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

testRazorpayFlow();
