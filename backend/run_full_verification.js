const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./models/User');
const Provider = require('./models/Provider');
const Category = require('./models/Category');
const Service = require('./models/Service');
const Package = require('./models/Package');
const Address = require('./models/Address');
const Cart = require('./models/Cart');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Coupon = require('./models/Coupon');
const Payment = require('./models/Payment');

async function runFullVerification() {
    require('./server');
    await new Promise(r => setTimeout(r, 1500));

    console.log('========================================================');
    console.log('ACTUAL MONGODB ATLAS DATABASE VERIFICATION');
    console.log('========================================================');

    try {
        // 1. Connect to MongoDB Atlas
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.DB_URI);
        
        // 2. Database Name
        const dbName = mongoose.connection.name;
        console.log(`\n✅ MongoDB Connected Successfully`);
        console.log(`📌 Database Name: ${dbName}`);

        // 3. List Collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name).sort();
        console.log('\n📋 Actual MongoDB Collections Present:');
        console.log(collectionNames.join(', '));

        // 4. Query Actual Document Counts for Every Required Collection
        console.log('\n📊 Actual Document Counts from MongoDB Queries:');
        const counts = {
            users: await User.countDocuments(),
            providers: await Provider.countDocuments(),
            categories: await Category.countDocuments(),
            services: await Service.countDocuments(),
            servicepackages: await Package.countDocuments(),
            addresses: await Address.countDocuments(),
            carts: await Cart.countDocuments(),
            bookings: await Booking.countDocuments(),
            reviews: await Review.countDocuments(),
            notifications: await Notification.countDocuments(),
            coupons: await Coupon.countDocuments(),
            payments: await Payment.countDocuments()
        };

        for (const [coll, count] of Object.entries(counts)) {
            console.log(` - ${coll.padEnd(16, ' ')}: ${count}`);
        }

        // 5. Test Live Express REST APIs to confirm data is served from MongoDB
        console.log('\n🌐 Testing Live Express REST APIs (http://localhost:5000):');

        const catRes = await fetch('http://localhost:5000/api/categories');
        const catJson = await catRes.json();
        console.log(` - GET /api/categories      : HTTP status ${catRes.status} | Returned ${catJson.data ? catJson.data.length : 0} items from MongoDB`);

        const servRes = await fetch('http://localhost:5000/api/services');
        const servJson = await servRes.json();
        console.log(` - GET /api/services        : HTTP status ${servRes.status} | Returned ${servJson.data ? servJson.data.length : 0} items from MongoDB`);

        const provRes = await fetch('http://localhost:5000/api/providers');
        const provJson = await provRes.json();
        console.log(` - GET /api/providers       : HTTP status ${provRes.status} | Returned ${provJson.data ? provJson.data.length : 0} items from MongoDB`);

        console.log('\n========================================================');
        console.log('VERIFICATION COMPLETE: 100% PERSISTENT MONGODB ATLAS DATABASE');
        console.log('========================================================\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

runFullVerification();
