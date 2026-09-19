const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const Provider = require('./models/Provider');
const User = require('./models/User');

async function verifyAllProviders() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB Atlas successfully.');

    const providers = await Provider.find({}).populate('user', 'name email profileImage');
    console.log(`\n========================================================`);
    console.log(`VERIFYING ALL ${providers.length} PROVIDERS IN MONGODB:`);
    console.log(`========================================================\n`);

    const imageSet = new Set();
    let uniqueImagesCount = 0;
    let nullOrEmptyCount = 0;

    providers.forEach((p, idx) => {
      const img = p.profileImage;
      const uImg = p.user ? p.user.profileImage : 'N/A';

      if (!img) {
        nullOrEmptyCount++;
      } else {
        imageSet.add(img);
      }

      console.log(`[${(idx + 1).toString().padStart(2, '0')}] ${p.name.padEnd(16)} | ${(p.skills[0] || 'Specialist').padEnd(22)} | Photo: ${img}`);
    });

    uniqueImagesCount = imageSet.size;

    console.log(`\n========================================================`);
    console.log(`VERIFICATION AUDIT RESULTS:`);
    console.log(` - Total Providers:       ${providers.length}`);
    console.log(` - Unique Profile Photos: ${uniqueImagesCount}`);
    console.log(` - Missing/Null Photos:   ${nullOrEmptyCount}`);
    console.log(` - All Photos Distinct:   ${uniqueImagesCount === providers.length ? 'YES ✅' : 'NO ❌'}`);
    console.log(`========================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

verifyAllProviders();
