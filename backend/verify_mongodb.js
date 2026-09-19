const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

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

async function verifyCounts() {
    try {
        await mongoose.connect(process.env.DB_URI);
        const dbName = mongoose.connection.name;
        console.log(`==========================================`);
        console.log(`VERIFYING LIVE MONGODB PERSISTENCE`);
        console.log(`MongoDB Connected: YES`);
        console.log(`MongoDB Database Name: ${dbName}`);
        console.log(`==========================================`);

        const counts = {
            users: await User.countDocuments(),
            providers: await Provider.countDocuments(),
            categories: await Category.countDocuments(),
            services: await Service.countDocuments(),
            packages: await Package.countDocuments(),
            addresses: await Address.countDocuments(),
            carts: await Cart.countDocuments(),
            bookings: await Booking.countDocuments(),
            reviews: await Review.countDocuments(),
            notifications: await Notification.countDocuments(),
            coupons: await Coupon.countDocuments(),
            payments: await Payment.countDocuments(),
        };

        console.log('REAL MONGODB DOCUMENT COUNTS:');
        console.dir(counts, { depth: null });
        console.log(`==========================================`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error querying MongoDB:', err.message);
        process.exit(1);
    }
}

verifyCounts();
