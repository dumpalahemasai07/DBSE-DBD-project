const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Provider = require('./models/Provider');

// Curated 15 Profession-Matched Unique Professional Photos (Verified Unsplash Direct URLs)
const PROVIDER_PHOTO_MAPPING = {
  'Rajesh Kumar': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80', // Electrician & Plumbing
  'Anita Sharma': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500&auto=format&fit=crop&q=80', // Beautician & Makeup
  'Suresh Verma': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80', // AC Technician
  'Vikram Reddy': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop&q=80', // Deep Cleaning
  'Priya Das': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80', // Spa & Aromatherapy
  'Mohammad Ali': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80', // Carpenter
  'Ramesh Rao': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80', // Pest Control
  'Sunita Patel': 'https://images.unsplash.com/photo-1570158268183-d296b2892211?w=500&auto=format&fit=crop&q=80', // Skincare & Facial
  'Amit Gupta': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', // Water Purifier Tech
  'Deepak Sharma': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80', // Painter
  'Arjun Prasad': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80', // Washing Machine Tech
  'Kavita Nair': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=80', // Hair Spa & Makeup
  'Mahesh Kumar': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&auto=format&fit=crop&q=80', // Refrigerator Tech
  'Swati Joshi': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&auto=format&fit=crop&q=80', // Kitchen Cleaning
  'Vinod Rao': 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=80'  // Handyman & TV Mounting
};

async function testUrlAccessibility(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function updateProviderPhotos() {
  console.log('========================================================');
  console.log('STARTING PROVIDER PROFILE PHOTOS AUDIT & UPDATE');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}\n`);

    const providers = await Provider.find({}).populate('user');
    console.log(`Found ${providers.length} providers in database.\n`);

    let updatedCount = 0;
    let testedCount = 0;
    let failedCount = 0;

    for (const provider of providers) {
      const name = provider.name;
      const targetPhotoUrl = PROVIDER_PHOTO_MAPPING[name];

      if (!targetPhotoUrl) {
        console.log(`⚠️ No specific mapping found for "${name}". Keeping current image.`);
        continue;
      }

      testedCount++;
      const isUrlAccessible = await testUrlAccessibility(targetPhotoUrl);
      
      if (!isUrlAccessible) {
        console.log(`❌ URL Accessibility check failed for ${name}: ${targetPhotoUrl}`);
        failedCount++;
        continue;
      }

      // Update Provider document
      provider.profileImage = targetPhotoUrl;
      await provider.save();

      // Update associated User document
      if (provider.user) {
        const userDoc = await User.findById(provider.user._id);
        if (userDoc) {
          userDoc.profileImage = targetPhotoUrl;
          await userDoc.save();
        }
      }

      updatedCount++;
      console.log(`✅ [${updatedCount}/${providers.length}] Updated "${name}" (${provider.skills.join(', ') || 'Specialist'}) -> ${targetPhotoUrl.slice(0, 65)}...`);
    }

    console.log('\n========================================================');
    console.log('SUMMARY OF PROVIDER PHOTO UPDATE:');
    console.log(` - Total Providers Checked:   ${providers.length}`);
    console.log(` - URLs Tested & Verified:   ${testedCount}`);
    console.log(` - Provider Photos Updated:  ${updatedCount}`);
    console.log(` - Broken URLs Encountered:  ${failedCount}`);
    console.log('========================================================\n');

    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating provider photos:', error);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

updateProviderPhotos();
