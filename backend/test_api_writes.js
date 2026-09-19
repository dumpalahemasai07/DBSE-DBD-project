const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Service = require('./models/Service');
const Package = require('./models/Package');
const Provider = require('./models/Provider');

async function testApiWrites() {
    const testEmail = `live_test_${Date.now()}@homeease.com`;
    const testPhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const testPassword = 'Password123!';

    console.log('==========================================');
    console.log('STEP 10 — TESTING REAL API WRITE OPERATIONS');
    console.log('==========================================');

    try {
        // 1. Register User via HTTP REST API
        console.log(`1. Creating User via Express API: ${testEmail}...`);
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Live Persistence Tester',
                email: testEmail,
                password: testPassword,
                phone: testPhone
            })
        });

        const regData = await regRes.json();
        const token = regData.token || (regData.data && regData.data.token);
        if (!regRes.ok || !token) {
            throw new Error(`Registration API failed: ${JSON.stringify(regData)}`);
        }
        const userToken = token;
        console.log('✅ User registered successfully via API. Received JWT Token.');

        // 2. Query MongoDB directly to confirm user document was persisted
        await mongoose.connect(process.env.DB_URI);
        const persistedUser = await User.findOne({ email: testEmail });
        if (!persistedUser) {
            throw new Error('❌ User not found in MongoDB after API call!');
        }
        console.log(`✅ MongoDB Direct Verification: User persisted with _id = ${persistedUser._id}`);

        // 3. Create Booking via API
        const serviceDoc = await Service.findOne({});
        const packageDoc = await Package.findOne({ service: serviceDoc._id });
        const providerDoc = await Provider.findOne({});

        console.log(`2. Creating Booking via Express API for service: "${serviceDoc.name}"...`);
        const bookingRes = await fetch('http://localhost:5000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                items: [{
                    serviceId: serviceDoc._id,
                    serviceName: serviceDoc.name,
                    variantTitle: packageDoc.name,
                    price: packageDoc.discountPrice || packageDoc.price,
                    quantity: 1
                }],
                cartTotal: packageDoc.discountPrice || packageDoc.price,
                grandTotal: (packageDoc.discountPrice || packageDoc.price) + 49,
                date: '2026-09-20',
                timeSlot: '11:00 AM - 01:00 PM',
                address: 'Flat 505, Tech Park Way, Hitec City, Hyderabad - 500081'
            })
        });

        const bookingData = await bookingRes.json();
        if (!bookingRes.ok || !bookingData.data) {
            throw new Error(`Booking API failed: ${JSON.stringify(bookingData)}`);
        }

        const newBooking = bookingData.data;
        console.log(`✅ Booking created successfully via API. Booking Number: ${newBooking.bookingNumber}`);

        // 4. Query MongoDB directly to confirm booking document was persisted
        const persistedBooking = await Booking.findOne({ bookingNumber: newBooking.bookingNumber });
        if (!persistedBooking) {
            throw new Error('❌ Booking not found in MongoDB after API call!');
        }
        console.log(`✅ MongoDB Direct Verification: Booking persisted with _id = ${persistedBooking._id}, totalAmount = ₹${persistedBooking.totalAmount}`);

        // Mark booking as completed in DB to allow review test
        persistedBooking.bookingStatus = 'COMPLETED';
        await persistedBooking.save();

        // 5. Create Review via API
        console.log('3. Creating Review via Express API...');
        const reviewRes = await fetch('http://localhost:5000/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                bookingId: persistedBooking._id,
                rating: 5,
                title: 'Outstanding Live Service Test',
                comment: 'Tested end-to-end write pipeline: API -> Mongoose -> Real MongoDB Atlas document persistence.'
            })
        });

        const reviewData = await reviewRes.json();
        if (!reviewRes.ok) {
            throw new Error(`Review API failed: ${JSON.stringify(reviewData)}`);
        }
        console.log('✅ Review created successfully via API.');

        // 6. Query MongoDB directly to confirm review document was persisted
        const persistedReview = await Review.findOne({ booking: persistedBooking._id });
        if (!persistedReview) {
            throw new Error('❌ Review not found in MongoDB after API call!');
        }
        console.log(`✅ MongoDB Direct Verification: Review persisted with _id = ${persistedReview._id}, comment = "${persistedReview.comment}"`);

        console.log(`==========================================`);
        console.log(`SUCCESS: END-TO-END PERSISTENCE VERIFIED!`);
        console.log(`Frontend/API -> Express -> Mongoose -> MongoDB Atlas IS 100% OPERATIONAL.`);
        console.log(`==========================================`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during API write verification:', err.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

testApiWrites();
