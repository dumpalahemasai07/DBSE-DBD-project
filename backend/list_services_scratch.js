const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Category');
const Service = require('./models/Service');

async function listAllServices() {
  await mongoose.connect(process.env.DB_URI);
  const services = await Service.find({}).populate('category', 'name').sort({ name: 1 }).lean();
  console.log('TOTAL COUNT:', services.length);
  services.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s._id}] "${s.name}" (${s.category ? s.category.name : 'N/A'}) - slug: ${s.slug}`);
  });
  await mongoose.disconnect();
}

listAllServices().catch(console.error);
