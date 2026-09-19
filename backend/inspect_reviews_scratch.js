const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
require('./models/Service');
const Review = require('./models/Review');

async function inspectReviews() {
  await mongoose.connect(process.env.DB_URI);
  const reviews = await Review.find({}).populate('service', 'name').populate('user', 'name').lean();
  console.log('TOTAL REVIEWS:', reviews.length);
  reviews.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r._id}] Service: ${r.service ? r.service.name : 'Unknown'} (${r.service ? r.service._id : 'N/A'}) | User: ${r.user ? r.user.name : 'N/A'} | Rating: ${r.rating}★ | Comment: "${r.comment}"`);
  });
  await mongoose.disconnect();
}

inspectReviews().catch(console.error);
