const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('./node_modules/mongoose');
require('./node_modules/dotenv').config();

async function run() {
  await mongoose.connect(process.env.DB_URI);
  const Booking = require('./models/Booking');
  const Service = require('./models/Service');
  
  const bookings = await Booking.find({}).populate('items.service');
  console.log(`Total Bookings in DB: ${bookings.length}`);
  
  let validCount = 0;
  let unresolvedCount = 0;
  
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const item = b.items && b.items[0];
    if (!item) {
      console.log(`Booking #${b.bookingNumber}: No items`);
      unresolvedCount++;
      continue;
    }
    
    let resolvedService = item.service;
    if (!resolvedService) {
      // Try searching service by name
      const foundByName = await Service.findOne({ name: new RegExp(item.name, 'i') });
      if (foundByName) {
        resolvedService = foundByName;
        console.log(`Booking #${b.bookingNumber}: Resolved by name "${item.name}" -> ${foundByName._id}`);
      } else {
        console.log(`Booking #${b.bookingNumber}: Could NOT resolve service (name: "${item.name}")`);
        unresolvedCount++;
        continue;
      }
    }
    validCount++;
    console.log(`Booking #${b.bookingNumber} -> Customer: ${b.customer}, Service: ${resolvedService.name || resolvedService._id}, Package: ${item.packageName}, Amount: ₹${b.totalAmount}`);
  }
  
  console.log(`\nSummary: ${validCount} valid, ${unresolvedCount} unresolved.`);
  await mongoose.disconnect();
}

run().catch(console.error);
