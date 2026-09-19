const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Provider = require('./models/Provider');
const Category = require('./models/Category');
const Service = require('./models/Service');
const Package = require('./models/Package');
const Address = require('./models/Address');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Coupon = require('./models/Coupon');
const Payment = require('./models/Payment');

async function printProof() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}\n`);

    const users = await User.countDocuments();
    const providers = await Provider.countDocuments();
    const categories = await Category.countDocuments();
    const services = await Service.countDocuments();
    const servicepackages = await Package.countDocuments();
    const addresses = await Address.countDocuments();
    const bookings = await Booking.countDocuments();
    const reviews = await Review.countDocuments();
    const notifications = await Notification.countDocuments();
    const coupons = await Coupon.countDocuments();
    const payments = await Payment.countDocuments();

    console.log(`users: ${users}`);
    console.log(`providers: ${providers}`);
    console.log(`categories: ${categories}`);
    console.log(`services: ${services}`);
    console.log(`servicepackages: ${servicepackages}`);
    console.log(`addresses: ${addresses}`);
    console.log(`bookings: ${bookings}`);
    console.log(`reviews: ${reviews}`);
    console.log(`notifications: ${notifications}`);
    console.log(`coupons: ${coupons}`);
    console.log(`payments: ${payments}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection Error:', err.message);
    process.exit(1);
  }
}

printProof();
