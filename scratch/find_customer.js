const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
  const users = await User.find({ role: 'customer' }).limit(5);
  console.log('Customer emails:', users.map(u => u.email));
  await mongoose.disconnect();
}

run();
