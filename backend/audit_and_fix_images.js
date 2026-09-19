const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const Service = require('./models/Service');
const Category = require('./models/Category');

const RELIABLE_IMAGES = {
  purifier: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80',
  ac: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0d5?w=600&q=80',
  washing: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&q=80',
  fridge: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80',
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  carpentry: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80',
  painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80',
  pest: 'https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80',
  grooming: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
  bathroom: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
  kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
  tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80',
  oven: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80'
};

function getReliableImageForName(name, slug) {
  const text = (name + ' ' + (slug || '')).toLowerCase();
  if (text.includes('purifier') || text.includes('native') || text.includes('ro ')) return RELIABLE_IMAGES.purifier;
  if (text.includes('ac ') || text.includes('air condition') || text.includes('cooling')) return RELIABLE_IMAGES.ac;
  if (text.includes('wash') || text.includes('laundry')) return RELIABLE_IMAGES.washing;
  if (text.includes('fridge') || text.includes('refriger')) return RELIABLE_IMAGES.fridge;
  if (text.includes('plumb') || text.includes('tap') || text.includes('leak') || text.includes('drain')) return RELIABLE_IMAGES.plumbing;
  if (text.includes('electric') || text.includes('wire') || text.includes('switch') || text.includes('fan')) return RELIABLE_IMAGES.electrician;
  if (text.includes('carpent') || text.includes('wood') || text.includes('furnit') || text.includes('lock')) return RELIABLE_IMAGES.carpentry;
  if (text.includes('paint') || text.includes('damp') || text.includes('wall')) return RELIABLE_IMAGES.painting;
  if (text.includes('pest') || text.includes('cockroach') || text.includes('termite') || text.includes('bedbug')) return RELIABLE_IMAGES.pest;
  if (text.includes('beauty') || text.includes('salon') || text.includes('wax') || text.includes('facial')) return RELIABLE_IMAGES.beauty;
  if (text.includes('grooming') || text.includes('barber') || text.includes('beard') || text.includes('men')) return RELIABLE_IMAGES.grooming;
  if (text.includes('bath') || text.includes('toilet') || text.includes('grout')) return RELIABLE_IMAGES.bathroom;
  if (text.includes('kitchen') || text.includes('chimney') || text.includes('cabinet')) return RELIABLE_IMAGES.kitchen;
  if (text.includes('tv') || text.includes('mount')) return RELIABLE_IMAGES.tv;
  if (text.includes('oven') || text.includes('micro')) return RELIABLE_IMAGES.oven;
  if (text.includes('clean') || text.includes('sofa') || text.includes('carpet')) return RELIABLE_IMAGES.cleaning;
  return RELIABLE_IMAGES.default;
}

async function checkUrlAccessible(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function auditAndFixImages() {
  console.log('========================================================');
  console.log('AUDITING & FIXING ALL SERVICE & CATEGORY IMAGES IN MONGODB');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);

    // Audit Categories
    const categories = await Category.find({});
    console.log(`\nAuditing ${categories.length} Categories...`);
    let catFixedCount = 0;
    for (const cat of categories) {
      const isOk = await checkUrlAccessible(cat.image);
      if (!isOk) {
        const fixedUrl = getReliableImageForName(cat.name, cat.slug);
        console.log(` ❌ Category "${cat.name}" image broken -> Replacing with: ${fixedUrl}`);
        cat.image = fixedUrl;
        await cat.save();
        catFixedCount++;
      } else {
        console.log(` ✅ Category "${cat.name}" image OK`);
      }
    }

    // Audit Services
    const services = await Service.find({});
    console.log(`\nAuditing ${services.length} Services...`);
    let srvFixedCount = 0;

    for (const srv of services) {
      const primaryUrl = (srv.images && srv.images.length > 0) ? srv.images[0] : null;
      const isOk = await checkUrlAccessible(primaryUrl);

      if (!isOk) {
        const fixedUrl = getReliableImageForName(srv.name, srv.slug);
        console.log(` ❌ Service "${srv.name}" image broken -> Replacing with: ${fixedUrl}`);
        srv.images = [fixedUrl];
        await srv.save();
        srvFixedCount++;
      } else {
        console.log(` ✅ Service "${srv.name}" image OK`);
      }
    }

    console.log('\n========================================================');
    console.log(`AUDIT COMPLETE:`);
    console.log(` - Categories checked: ${categories.length} (Fixed: ${catFixedCount})`);
    console.log(` - Services checked:   ${services.length} (Fixed: ${srvFixedCount})`);
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Audit error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

auditAndFixImages();
