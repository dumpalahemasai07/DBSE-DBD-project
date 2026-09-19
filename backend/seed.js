const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
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

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.DB_URI);
    console.log(`Connected successfully to database: ${mongoose.connection.name}`);

    // 1. SEED CATEGORIES (15 Categories)
    console.log('Seeding 15 Categories...');
    const categoryData = [
      { name: 'Cleaning', slug: 'cleaning', description: 'Deep cleaning for home, sofas, carpets & upholstery.', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: '🧹', displayOrder: 1 },
      { name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', description: 'Expert servicing & repair for AC, Washing Machine, Fridge & Microwave.', image: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0d5?w=600&q=80', icon: '❄️', displayOrder: 2 },
      { name: 'Electrician', slug: 'electrician', description: 'Certified electricians for wiring, switchboards, lights & fans.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: '⚡', displayOrder: 3 },
      { name: 'Plumbing', slug: 'plumbing', description: 'Expert plumbers for tap repair, leakage fix, drain clearing & fittings.', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80', icon: '🚰', displayOrder: 4 },
      { name: 'Carpentry', slug: 'carpentry', description: 'Custom woodwork, furniture repair, door locks & assembly.', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80', icon: '🪚', displayOrder: 5 },
      { name: 'Painting & Waterproofing', slug: 'painting', description: 'Interior/exterior home painting, wall textures & damp proofing.', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80', icon: '🎨', displayOrder: 6 },
      { name: 'Pest Control', slug: 'pest-control', description: 'Eco-friendly pest treatment for cockroaches, termites, bedbugs & ants.', image: 'https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?w=600&q=80', icon: '🦟', displayOrder: 7 },
      { name: 'Water Purifier', slug: 'water-purifier', description: 'RO water purifier repair, filter replacement & Native smart purifiers.', image: 'https://images.unsplash.com/photo-1574360773950-89196b05ebde?w=600&q=80', icon: '💧', displayOrder: 8 },
      { name: 'Washing Machine Repair', slug: 'washing-machine-repair', description: 'Front load & top load washing machine servicing and motor repair.', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&q=80', icon: '🧺', displayOrder: 9 },
      { name: 'Refrigerator Repair', slug: 'refrigerator-repair', description: 'Single door, double door & side-by-side fridge gas refill & compressor repair.', image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', icon: '🧊', displayOrder: 10 },
      { name: 'Beauty & Salon', slug: 'beauty-salon', description: 'Salon at home for women: waxing, facial, manicure, pedicure & hair spa.', image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80', icon: '💄', displayOrder: 11 },
      { name: 'Men\'s Grooming', slug: 'mens-grooming', description: 'Haircut, beard styling, head massage & facials for men.', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80', icon: '💈', displayOrder: 12 },
      { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', description: 'Hard water stain removal, tile scrub & deep descaling.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80', icon: '🚿', displayOrder: 13 },
      { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', description: 'Chimney degreasing, slab scrubbing & cabinet deep clean.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80', icon: '🍳', displayOrder: 14 },
      { name: 'Full Home Deep Cleaning', slug: 'full-home-cleaning', description: 'Comprehensive room, balcony, window & floor mechanized scrubbing.', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80', icon: '🏠', displayOrder: 15 }
    ];

    const categoryMap = {};
    for (const cat of categoryData) {
      const created = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryMap[cat.slug] = created;
    }
    console.log(`✅ ${Object.keys(categoryMap).length} Categories upserted.`);

    // 2. SEED USERS (10 Customers + 1 Admin)
    console.log('Seeding Users...');
    const defaultPassword = 'password123';
    
    const customerData = [
      { name: 'Arjun Sharma', email: 'arjun@homeease.com', phone: '+91 9876543210', role: 'customer' },
      { name: 'Sneha Reddy', email: 'sneha@homeease.com', phone: '+91 9876543211', role: 'customer' },
      { name: 'Rahul Verma', email: 'rahul@homeease.com', phone: '+91 9876543212', role: 'customer' },
      { name: 'Divya Nair', email: 'divya@homeease.com', phone: '+91 9876543213', role: 'customer' },
      { name: 'Karthik Rao', email: 'karthik@homeease.com', phone: '+91 9876543214', role: 'customer' },
      { name: 'Ananya Gupta', email: 'ananya@homeease.com', phone: '+91 9876543215', role: 'customer' },
      { name: 'Vijay Kumar', email: 'vijay@homeease.com', phone: '+91 9876543216', role: 'customer' },
      { name: 'Meera Joshi', email: 'meera@homeease.com', phone: '+91 9876543217', role: 'customer' },
      { name: 'Sanjay Patel', email: 'sanjay@homeease.com', phone: '+91 9876543218', role: 'customer' },
      { name: 'Pooja Das', email: 'pooja@homeease.com', phone: '+91 9876543219', role: 'customer' },
      { name: 'Admin Control', email: 'admin@homeease.com', phone: '+91 9999999999', role: 'admin' }
    ];

    const userMap = {};
    for (const u of customerData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create({
          ...u,
          password: defaultPassword
        });
      }
      userMap[u.email] = user;
    }

    // 3. SEED ADDRESSES (15 Standalone Address Documents)
    console.log('Seeding 15 Addresses into Address collection...');
    const customersList = Object.values(userMap).filter(u => u.role === 'customer');
    const addressDefinitions = [
      { house: 'Flat 302, Sun Towers', street: 'Road No 36', area: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', tag: 'Home' },
      { house: 'Suite 405, Cyber Towers', street: 'Hitec City Main Rd', area: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', tag: 'Work' },
      { house: 'Villa 12, Green Meadows', street: 'Financial District Rd', area: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032', tag: 'Home' },
      { house: 'Flat 101, Lakeview Residency', street: 'Necklace Road', area: 'Khairatabad', city: 'Hyderabad', state: 'Telangana', pincode: '500004', tag: 'Home' },
      { house: 'Plot 45, Silicon Enclave', street: 'Kondapur Main Rd', area: 'Kondapur', city: 'Hyderabad', state: 'Telangana', pincode: '500084', tag: 'Work' },
      { house: 'Flat 204, Orchid Heights', street: 'KPHB Colony Phase 3', area: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', pincode: '500072', tag: 'Home' },
      { house: 'Villa 88, Palm Meadows', street: 'Gandipet Main Rd', area: 'Gandipet', city: 'Hyderabad', state: 'Telangana', pincode: '500075', tag: 'Home' },
      { house: 'Flat 502, Sapphire Apartments', street: 'Road No 12', area: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034', tag: 'Home' },
      { house: 'Office 301, iSprout Hub', street: 'Financial District', area: 'Nanakramguda', city: 'Hyderabad', state: 'Telangana', pincode: '500032', tag: 'Work' },
      { house: 'Flat 108, Lotus Springs', street: 'Hafeezpet Road', area: 'Miyapur', city: 'Hyderabad', state: 'Telangana', pincode: '500049', tag: 'Home' },
      { house: 'Flat 401, Marigold Court', street: 'Mindspace Road', area: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', tag: 'Home' },
      { house: 'Flat 603, Royal Enclave', street: 'Botanical Garden Rd', area: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032', tag: 'Work' },
      { house: 'Villa 5, Sunshine Valley', street: 'Manikonda Main Rd', area: 'Manikonda', city: 'Hyderabad', state: 'Telangana', pincode: '500089', tag: 'Home' },
      { house: 'Flat 202, Fortune Plaza', street: 'Kavuri Hills Phase 1', area: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', tag: 'Home' },
      { house: 'Flat 110, Serene Suites', street: 'Secretariat Road', area: 'Somajiguda', city: 'Hyderabad', state: 'Telangana', pincode: '500082', tag: 'Home' }
    ];

    await Address.deleteMany({});
    const insertedAddresses = [];
    for (let i = 0; i < addressDefinitions.length; i++) {
      const addr = addressDefinitions[i];
      const targetUser = customersList[i % customersList.length];
      const createdAddr = await Address.create({
        user: targetUser._id,
        ...addr,
        isDefault: i < customersList.length
      });
      insertedAddresses.push(createdAddr);
    }
    console.log(`✅ ${insertedAddresses.length} Addresses persisted into Address collection.`);

    // 4. SEED PROVIDERS & PROVIDER USERS (15 Professionals)
    console.log('Seeding Service Professionals...');
    const providerListRaw = [
      { name: 'Rajesh Kumar', email: 'rajesh.pro@homeease.com', phone: '+91 9123456701', bio: 'Certified Master Electrician & Plumbing Specialist.', exp: 7, skills: ['Wiring', 'Tap Repair', 'Switchboard'], areas: ['Jubilee Hills', 'Banjara Hills'], profileImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80' },
      { name: 'Anita Sharma', email: 'anita.pro@homeease.com', phone: '+91 9123456702', bio: 'Experienced Beautician & Bridal Makeup Expert.', exp: 8, skills: ['Facials', 'Waxing', 'Hair Spa'], areas: ['Gachibowli', 'Kondapur'], profileImage: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500&auto=format&fit=crop&q=80' },
      { name: 'Suresh Verma', email: 'suresh.pro@homeease.com', phone: '+91 9123456703', bio: 'Senior AC Technician with Jet Pump Cleaning expertise.', exp: 6, skills: ['Split AC', 'Window AC', 'Gas Leak Fix'], areas: ['Madhapur', 'Hitec City'], profileImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80' },
      { name: 'Vikram Reddy', email: 'vikram.pro@homeease.com', phone: '+91 9123456704', bio: 'Mechanized Deep Cleaning Supervisor.', exp: 5, skills: ['Floor Scrubbing', 'Sofa Cleaning'], areas: ['Jubilee Hills', 'Kukatpally'], profileImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop&q=80' },
      { name: 'Priya Das', email: 'priya.pro@homeease.com', phone: '+91 9123456705', bio: 'Certified Aromatherapy & Spa Therapist.', exp: 9, skills: ['Swedish Massage', 'Deep Tissue Spa'], areas: ['Banjara Hills', 'Gachibowli'], profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80' },
      { name: 'Mohammad Ali', email: 'ali.pro@homeease.com', phone: '+91 9123456706', bio: 'Custom Woodwork & Furniture Repair Master.', exp: 10, skills: ['Lock Fitting', 'Furniture Repair'], areas: ['Madhapur', 'Kondapur'], profileImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80' },
      { name: 'Ramesh Rao', email: 'ramesh.pro@homeease.com', phone: '+91 9123456707', bio: 'Bayer Certified Pest Control Specialist.', exp: 6, skills: ['Cockroach Control', 'Termite Treatment'], areas: ['All Hyderabad'], profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80' },
      { name: 'Sunita Patel', email: 'sunita.pro@homeease.com', phone: '+91 9123456708', bio: 'Organic Facial & Pedicure Specialist.', exp: 7, skills: ['Pedicure', 'Manicure', 'Organic Facial'], areas: ['Jubilee Hills', 'Banjara Hills'], profileImage: 'https://images.unsplash.com/photo-1570158268183-d296b2892211?w=500&auto=format&fit=crop&q=80' },
      { name: 'Amit Gupta', email: 'amit.pro@homeease.com', phone: '+91 9123456709', bio: 'RO & Native Smart Water Purifier Technician.', exp: 5, skills: ['RO Filter Replacement', 'Membrane Fix'], areas: ['Gachibowli', 'Madhapur'], profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80' },
      { name: 'Deepak Sharma', email: 'deepak.pro@homeease.com', phone: '+91 9123456710', bio: 'Asian Paints Certified Master Painter.', exp: 8, skills: ['Wall Painting', 'Waterproofing'], areas: ['Kukatpally', 'Kondapur'], profileImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80' },
      { name: 'Arjun Prasad', email: 'arjun.pro@homeease.com', phone: '+91 9123456711', bio: 'Washing Machine Motor & PCB Repair Expert.', exp: 6, skills: ['Front Load', 'Top Load Repair'], areas: ['Madhapur', 'Jubilee Hills'], profileImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80' },
      { name: 'Kavita Nair', email: 'kavita.pro@homeease.com', phone: '+91 9123456712', bio: 'Celebrity Makeup & Hair Spa Specialist.', exp: 7, skills: ['Hair Spa', 'Makeup'], areas: ['Banjara Hills', 'Gachibowli'], profileImage: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=80' },
      { name: 'Mahesh Kumar', email: 'mahesh.pro@homeease.com', phone: '+91 9123456713', bio: 'Double Door Fridge & Compressor Specialist.', exp: 9, skills: ['Gas Refill', 'Compressor Repair'], areas: ['All Hyderabad'], profileImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&auto=format&fit=crop&q=80' },
      { name: 'Swati Joshi', email: 'swati.pro@homeease.com', phone: '+91 9123456714', bio: 'Kitchen Chimney & Appliance Cleaning Expert.', exp: 4, skills: ['Chimney Degreasing', 'Oven Clean'], areas: ['Kondapur', 'Hitec City'], profileImage: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&auto=format&fit=crop&q=80' },
      { name: 'Vinod Rao', email: 'vinod.pro@homeease.com', phone: '+91 9123456715', bio: 'Handyman, Wall Drilling & TV Mounting Pro.', exp: 5, skills: ['TV Mounting', 'Drilling', 'Curtain Rods'], areas: ['Jubilee Hills', 'Gachibowli'], profileImage: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=80' }
    ];

    const providerMap = [];
    for (const p of providerListRaw) {
      let pUser = await User.findOne({ email: p.email });
      if (!pUser) {
        pUser = await User.create({
          name: p.name,
          email: p.email,
          phone: p.phone,
          password: defaultPassword,
          role: 'provider',
          profileImage: p.profileImage
        });
      } else if (p.profileImage) {
        pUser.profileImage = p.profileImage;
        await pUser.save();
      }

      let providerDoc = await Provider.findOne({ user: pUser._id });
      if (!providerDoc) {
        providerDoc = await Provider.create({
          user: pUser._id,
          name: p.name,
          phone: p.phone,
          email: p.email,
          profileImage: p.profileImage,
          bio: p.bio,
          experience: p.exp,
          skills: p.skills,
          rating: (4.7 + Math.random() * 0.25).toFixed(1),
          reviewCount: Math.floor(40 + Math.random() * 200),
          completedJobs: Math.floor(100 + Math.random() * 500),
          serviceAreas: p.areas,
          isAvailable: true
        });
      } else if (p.profileImage) {
        providerDoc.profileImage = p.profileImage;
        await providerDoc.save();
      }
      providerMap.push(providerDoc);
    }
    console.log(`✅ ${providerMap.length} Providers verified & ready.`);

    // 5. SEED 40+ SERVICES & PACKAGES
    console.log('Seeding 40+ Services & Service Packages...');
    const servicesDefinition = [
      // AC & APPLIANCE REPAIR
      { catSlug: 'ac-appliance-repair', name: 'AC Servicing & Maintenance', slug: 'ac-servicing-maintenance', description: 'Comprehensive jet pump cleaning for split & window ACs.', startingPrice: 399, duration: '45 mins', features: ['Jet Pump Clean', 'Drain Check'], packages: [{ name: 'Basic AC Service', price: 399, discountPrice: 349, duration: '45 mins', includedItems: ['Indoor coil wash'] }, { name: 'Deep Jet AC Service', price: 699, discountPrice: 599, duration: '60 mins', includedItems: ['Indoor & Outdoor wash'] }] },
      { catSlug: 'ac-appliance-repair', name: 'AC Repair & Gas Refill', slug: 'ac-repair-gas-refill', description: 'Cooling issue fix and R32/R410/R22 gas charging.', startingPrice: 1499, duration: '90 mins', features: ['100% Leak Fix', '30 Days Warranty'], packages: [{ name: 'AC Gas Leak Fix & Refill', price: 2499, discountPrice: 2199, duration: '90 mins', includedItems: ['Leak fix & gas refill'] }] },
      { catSlug: 'ac-appliance-repair', name: 'AC Installation & Uninstallation', slug: 'ac-installation-uninstallation', description: 'Mounting & unmounting of split/window ACs.', startingPrice: 699, duration: '90 mins', features: ['Core Drilling', 'Vacuuming'], packages: [{ name: 'Split AC Installation', price: 1499, discountPrice: 1299, duration: '120 mins', includedItems: ['Wall bracket fix'] }] },
      { catSlug: 'ac-appliance-repair', name: 'Microwave & Convection Oven Repair', slug: 'microwave-oven-repair', description: 'Magnetron change, heating issue fix & touch panel repair.', startingPrice: 299, duration: '45 mins', features: ['Original Magnetron', 'Fuse fix'], packages: [{ name: 'Microwave Inspection & Fix', price: 349, discountPrice: 299, duration: '45 mins', includedItems: ['Diode & fuse check'] }] },
      { catSlug: 'ac-appliance-repair', name: 'TV Wall Mounting & Setup', slug: 'tv-wall-mounting-setup', description: 'Precision mounting for 32" to 75" LED/OLED Smart TVs.', startingPrice: 349, duration: '40 mins', features: ['Spirit Level Align', 'Concealed Cable'], packages: [{ name: 'Up to 55 inch TV Mount', price: 349, discountPrice: 299, duration: '40 mins', includedItems: ['Bracket mounting'] }] },

      // CLEANING
      { catSlug: 'cleaning', name: 'Sofa & Upholstery Deep Cleaning', slug: 'sofa-upholstery-cleaning', description: 'Multi-stage vacuuming, wet shampooing, and water extraction.', startingPrice: 549, duration: '60 mins', features: ['Stain Removal', 'Eco Shampoo'], packages: [{ name: '3 Seater Sofa Cleaning', price: 849, discountPrice: 749, duration: '60 mins', includedItems: ['Deep shampooing'] }, { name: '5 Seater Sofa Cleaning', price: 1299, discountPrice: 1149, duration: '90 mins', includedItems: ['5 seater deep clean'] }] },
      { catSlug: 'cleaning', name: 'Full Home Deep Cleaning', slug: 'full-home-deep-cleaning', description: 'Mechanized floor scrubbing & wall dusting.', startingPrice: 2499, duration: '4 hrs', features: ['Heavy Machinery', '4 Pros Team'], packages: [{ name: '1 BHK Full Home Cleaning', price: 2499, discountPrice: 2199, duration: '4 hrs', includedItems: ['Deep clean all rooms'] }, { name: '2 BHK Full Home Cleaning', price: 3499, discountPrice: 3199, duration: '5 hrs', includedItems: ['2 BHK scrub & wash'] }] },
      { catSlug: 'cleaning', name: 'Carpet & Mattress Cleaning', slug: 'carpet-mattress-cleaning', description: 'Deep extraction vacuuming for dust mites.', startingPrice: 499, duration: '45 mins', features: ['Dust Mite Kill', 'Foam Scrub'], packages: [{ name: 'King Mattress Wash', price: 899, discountPrice: 799, duration: '45 mins', includedItems: ['Both sides extraction'] }] },
      { catSlug: 'cleaning', name: 'Balcony & Glass Window Scrubbing', slug: 'balcony-window-scrubbing', description: 'High pressure balcony cleaning and exterior glass wiping.', startingPrice: 499, duration: '45 mins', features: ['Grille Dusting', 'Streak-free Glass'], packages: [{ name: 'Balcony & Windows Wash', price: 599, discountPrice: 499, duration: '45 mins', includedItems: ['Railing & glass wiping'] }] },
      { catSlug: 'cleaning', name: 'Water Tank Deep Cleaning', slug: 'water-tank-cleaning', description: 'Submersible slurry pump extraction & UV disinfection.', startingPrice: 799, duration: '90 mins', features: ['Sludge Removal', 'UV Sterilization'], packages: [{ name: '1000L Overhead Tank Clean', price: 899, discountPrice: 799, duration: '90 mins', includedItems: ['Sediment & UV treatment'] }] },

      // BATHROOM CLEANING
      { catSlug: 'bathroom-cleaning', name: 'Bathroom Deep Cleaning', slug: 'bathroom-deep-cleaning', description: 'Hard water stain removal from tiles & mirrors.', startingPrice: 449, duration: '45 mins', features: ['Scrub Machine', 'Chrome Polish'], packages: [{ name: '1 Bathroom Deep Clean', price: 449, discountPrice: 399, duration: '45 mins', includedItems: ['WC & mirror scrub'] }] },
      { catSlug: 'bathroom-cleaning', name: 'Tile Grout & Mold Treatment', slug: 'tile-grout-mold-treatment', description: 'Chemical descaling and fresh waterproof grouting.', startingPrice: 699, duration: '60 mins', features: ['Black Mold Cure', 'White Grout Fill'], packages: [{ name: 'Shower Area Grouting', price: 799, discountPrice: 699, duration: '60 mins', includedItems: ['Grout scraping & sealing'] }] },

      // KITCHEN CLEANING
      { catSlug: 'kitchen-cleaning', name: 'Kitchen & Chimney Deep Cleaning', slug: 'kitchen-chimney-cleaning', description: 'Grease removal from stove, chimney mesh & counters.', startingPrice: 999, duration: '2 hrs', features: ['Boiling Degrease', 'Counter Polish'], packages: [{ name: 'Kitchen Degrease', price: 999, discountPrice: 899, duration: '90 mins', includedItems: ['Stove & tile degrease'] }] },
      { catSlug: 'kitchen-cleaning', name: 'Kitchen Cabinet Scrubbing', slug: 'kitchen-cabinet-scrubbing', description: 'Interior shelf wiping, liner changing & oil stain removal.', startingPrice: 599, duration: '60 mins', features: ['Food-safe Sanitizer', 'Shelf Wiping'], packages: [{ name: 'Modular Cabinet Clean', price: 699, discountPrice: 599, duration: '60 mins', includedItems: ['Inside & outside wipe'] }] },

      // ELECTRICIAN
      { catSlug: 'electrician', name: 'Switchboard & Socket Repair', slug: 'switchboard-socket-repair', description: 'Fixing burnt switches and loose wiring.', startingPrice: 149, duration: '30 mins', features: ['Shock-proof Tools', 'Safety Test'], packages: [{ name: 'Switch Replacement', price: 149, discountPrice: 129, duration: '20 mins', includedItems: ['Board rewiring'] }] },
      { catSlug: 'electrician', name: 'Fan & Light Fitting', slug: 'fan-light-fitting', description: 'Ceiling fan assembly & chandelier hanging.', startingPrice: 199, duration: '30 mins', features: ['Balancing Hook', 'Concealed Line'], packages: [{ name: 'Ceiling Fan Fix', price: 199, discountPrice: 149, duration: '30 mins', includedItems: ['Assembly & hook hanging'] }] },
      { catSlug: 'electrician', name: 'Inverter Wiring & MCB Trip Fix', slug: 'inverter-mcb-trip-fix', description: 'MCB box troubleshooting and inverter battery bypass.', startingPrice: 399, duration: '45 mins', features: ['Load Calculation', 'Trip Diagnosis'], packages: [{ name: 'MCB Change & Line Check', price: 449, discountPrice: 399, duration: '45 mins', includedItems: ['Single pole MCB fix'] }] },
      { catSlug: 'electrician', name: 'Complete House Wiring Inspection', slug: 'house-wiring-inspection', description: 'Earth leakage test, phase balance and short circuit fix.', startingPrice: 799, duration: '90 mins', features: ['Multimeter Audit', 'Safety Certificate'], packages: [{ name: '2 BHK Electrical Safety Audit', price: 899, discountPrice: 799, duration: '90 mins', includedItems: ['DB box check'] }] },

      // PLUMBING
      { catSlug: 'plumbing', name: 'Tap & Mixer Repair / Replacement', slug: 'tap-mixer-repair', description: 'Fixing leaking taps, wall mixers & health faucets.', startingPrice: 149, duration: '30 mins', features: ['Teflon Sealing', 'Leak Guarantee'], packages: [{ name: 'Tap Washer Fix', price: 149, discountPrice: 119, duration: '20 mins', includedItems: ['Spout sealing'] }] },
      { catSlug: 'plumbing', name: 'Drainage & Pipe Blockage Clearing', slug: 'drainage-blockage-clearing', description: 'Unclogging sink pipes and floor traps.', startingPrice: 399, duration: '45 mins', features: ['Snake Clearing', 'Trap Flush'], packages: [{ name: 'Sink Pipe Unclog', price: 399, discountPrice: 349, duration: '40 mins', includedItems: ['Drain snake clear'] }] },
      { catSlug: 'plumbing', name: 'Flush Tank & Commode Repair', slug: 'flush-tank-commode-repair', description: 'Internal syphon replacement and seat cover fix.', startingPrice: 299, duration: '45 mins', features: ['Jet Spray Change', 'Tank Syphon'], packages: [{ name: 'Flush Tank Overhaul', price: 399, discountPrice: 349, duration: '45 mins', includedItems: ['Internal valve replace'] }] },
      { catSlug: 'plumbing', name: 'Water Heater & Geyser Installation', slug: 'geyser-installation-repair', description: 'Mounting geyser, inlet/outlet piping and thermostat fix.', startingPrice: 499, duration: '60 mins', features: ['Pressure Valve', 'Anchor Fastener'], packages: [{ name: 'Geyser Mounting', price: 499, discountPrice: 449, duration: '60 mins', includedItems: ['Connection hose fix'] }] },

      // CARPENTRY
      { catSlug: 'carpentry', name: 'Furniture Repair & Assembly', slug: 'furniture-repair-assembly', description: 'Bed frame assembly, drawer channel replacement & hinges.', startingPrice: 249, duration: '45 mins', features: ['Precision Align', 'Heavy Hinges'], packages: [{ name: 'Door Hinge Repair', price: 249, discountPrice: 199, duration: '30 mins', includedItems: ['Screw tightening'] }] },
      { catSlug: 'carpentry', name: 'Door Lock & Handle Fitting', slug: 'door-lock-handle-fitting', description: 'Mortise lock installation, latch repair & digital lock fix.', startingPrice: 349, duration: '45 mins', features: ['Wood Chiseling', 'Smooth Latch'], packages: [{ name: 'Mortise Lock Fitting', price: 449, discountPrice: 399, duration: '45 mins', includedItems: ['Keyhole & latch fix'] }] },
      { catSlug: 'carpentry', name: 'Wooden Polishing & Touch-Up', slug: 'wooden-polishing-varnish', description: 'French polish, Melamyne & PU coat for dining tables & doors.', startingPrice: 999, duration: '2 hrs', features: ['Sanding Finish', 'High Gloss'], packages: [{ name: 'Dining Table Polish', price: 1199, discountPrice: 999, duration: '2 hrs', includedItems: ['Top coat sanding'] }] },
      { catSlug: 'carpentry', name: 'Curtains & Blind Installation', slug: 'curtains-blind-installation', description: 'Bracket drilling, curtain rod hanging & roller blinds.', startingPrice: 199, duration: '30 mins', features: ['Laser Level', 'Heavy Plugs'], packages: [{ name: 'Curtain Rod Mount (per window)', price: 199, discountPrice: 149, duration: '30 mins', includedItems: ['Drilling & bracket'] }] },

      // PAINTING
      { catSlug: 'painting', name: 'Wall Painting & Touch-up', slug: 'wall-painting-touchup', description: 'Putty coating, emulsion painting & accent walls.', startingPrice: 1499, duration: '1 Day', features: ['Asian Paints', 'Dust-free Sanding'], packages: [{ name: 'Single Accent Wall', price: 1999, discountPrice: 1799, duration: '1 Day', includedItems: ['2 coats emulsion'] }] },
      { catSlug: 'painting', name: 'Damp Proofing & Waterproofing', slug: 'damp-proofing-waterproofing', description: 'Efflorescence treatment and SmartCare rubberized coating.', startingPrice: 2499, duration: '1 Day', features: ['10 Year Anti-Damp', 'Primer Base'], packages: [{ name: 'Wall Dampness Seal', price: 2999, discountPrice: 2499, duration: '1 Day', includedItems: ['Scraping & elastomer'] }] },
      { catSlug: 'painting', name: 'Texture & Stencil Wall Painting', slug: 'texture-stencil-painting', description: 'Royale Play textures, metallic finishes & geometric stencils.', startingPrice: 2999, duration: '1 Day', features: ['Royale Finish', 'Custom Stencil'], packages: [{ name: 'Royale Play Texture Wall', price: 3499, discountPrice: 2999, duration: '1 Day', includedItems: ['Base coat & texture'] }] },

      // PEST CONTROL
      { catSlug: 'pest-control', name: 'Cockroach & Ant Pest Control', slug: 'cockroach-ant-pest-control', description: 'Odourless gel baiting and spray treatment.', startingPrice: 699, duration: '45 mins', features: ['Safe for Children', '1 Year Warranty'], packages: [{ name: '1 BHK Cockroach Control', price: 699, discountPrice: 599, duration: '45 mins', includedItems: ['Gel baiting'] }] },
      { catSlug: 'pest-control', name: 'Termite Control Treatment', slug: 'termite-control-treatment', description: 'Drill-fill-seal chemical barrier for doors and floor skirts.', startingPrice: 1999, duration: '2 hrs', features: ['Chlorpyrifos Cure', '2 Year Guarantee'], packages: [{ name: 'Termite Barrier Treatment', price: 2499, discountPrice: 1999, duration: '2 hrs', includedItems: ['Drilling & chemical injection'] }] },
      { catSlug: 'pest-control', name: 'Bedbug Eradication Service', slug: 'bedbug-eradication-service', description: '2-stage chemical spray for mattresses, cots & crevices.', startingPrice: 999, duration: '60 mins', features: ['Egg Destroyer', 'Free 2nd Visit'], packages: [{ name: 'Bedbug Treatment (2 Visits)', price: 1299, discountPrice: 1099, duration: '60 mins', includedItems: ['Complete mattress spray'] }] },

      // WATER PURIFIER
      { catSlug: 'water-purifier', name: 'Native Smart Water Purifier', slug: 'native-smart-water-purifier', description: 'RO+UV+Copper purification with 2 years zero maintenance.', startingPrice: 13999, duration: '90 mins', features: ['10 Stage RO', '2 Yr Warranty'], packages: [{ name: 'Native M1 Copper RO', price: 13999, discountPrice: 12999, duration: '90 mins', includedItems: ['Free Installation'] }] },
      { catSlug: 'water-purifier', name: 'RO Service & Filter Replacement', slug: 'ro-service-filter-replacement', description: 'Filter change, UV lamp & membrane check.', startingPrice: 299, duration: '45 mins', features: ['TDS Test', 'Original Filters'], packages: [{ name: 'Complete Filter Kit', price: 1999, discountPrice: 1799, duration: '60 mins', includedItems: ['Membrane & carbon'] }] },

      // WASHING MACHINE REPAIR
      { catSlug: 'washing-machine-repair', name: 'Washing Machine Servicing & Repair', slug: 'washing-machine-repair-service', description: 'Fixing drum noise, drainage pump failure & PCB errors.', startingPrice: 299, duration: '45 mins', features: ['Genuine Spares', '30 Days Warranty'], packages: [{ name: 'Washer Inspection', price: 299, discountPrice: 199, duration: '30 mins', includedItems: ['Diagnosis'] }] },
      { catSlug: 'washing-machine-repair', name: 'Front Load Washer Tub Descaling', slug: 'front-load-tub-descaling', description: 'High-temp drum descaling and inlet filter flush.', startingPrice: 799, duration: '60 mins', features: ['Scale Removal', 'Odour Cure'], packages: [{ name: 'Tub Descaling Wash', price: 899, discountPrice: 799, duration: '60 mins', includedItems: ['Descaling powder'] }] },

      // REFRIGERATOR REPAIR
      { catSlug: 'refrigerator-repair', name: 'Fridge Repair & Gas Refill', slug: 'fridge-repair-gas-refill', description: 'Compressor repair, thermostat fix & gas charging.', startingPrice: 299, duration: '45 mins', features: ['Genuine Gas', 'Relay Change'], packages: [{ name: 'Single Door Gas Charging', price: 1499, discountPrice: 1349, duration: '60 mins', includedItems: ['R134 Gas Refill'] }] },
      { catSlug: 'refrigerator-repair', name: 'Double Door Inverter Compressor Repair', slug: 'double-door-compressor-repair', description: 'Inverter PCB fix, defrost heater & compressor replacement.', startingPrice: 1999, duration: '90 mins', features: ['Inverter Board', 'Capillary Flush'], packages: [{ name: 'Inverter Fridge Repair', price: 2199, discountPrice: 1999, duration: '90 mins', includedItems: ['Defrost timer fix'] }] },

      // BEAUTY & SALON
      { catSlug: 'beauty-salon', name: 'Waxing & Threading for Women', slug: 'waxing-threading-women', description: 'Rica and Honey waxing options for smooth skin.', startingPrice: 399, duration: '45 mins', features: ['Disposable Sheets', 'Rica Wax'], packages: [{ name: 'Full Arms + Legs Waxing', price: 599, discountPrice: 499, duration: '45 mins', includedItems: ['Honey wax application'] }] },
      { catSlug: 'beauty-salon', name: 'Facials & Cleanup', slug: 'facials-cleanup', description: 'O3+ & VLCC brightening facials.', startingPrice: 799, duration: '60 mins', features: ['Sealed Kits', 'Steam Treatment'], packages: [{ name: 'VLCC Instant Glow Facial', price: 799, discountPrice: 699, duration: '60 mins', includedItems: ['Facial scrub & pack'] }] },
      { catSlug: 'beauty-salon', name: 'Hair Spa & Haircut for Women', slug: 'hair-spa-haircut-women', description: 'L\'Oreal Hair Spa treatment, blow dry & precision cut.', startingPrice: 999, duration: '75 mins', features: ['L\'Oreal Creambath', 'Scalp Massage'], packages: [{ name: 'L\'Oreal Hair Spa + Cut', price: 1299, discountPrice: 999, duration: '75 mins', includedItems: ['Deep cream massage'] }] },

      // MEN'S GROOMING
      { catSlug: 'mens-grooming', name: 'Men\'s Haircut & Beard Styling', slug: 'mens-haircut-beard-styling', description: 'Barber service at home with sanitized shears.', startingPrice: 249, duration: '45 mins', features: ['Single Cape', 'Aftershave'], packages: [{ name: 'Haircut + Beard Trim', price: 349, discountPrice: 299, duration: '45 mins', includedItems: ['Style cut & razor edge'] }] },
      { catSlug: 'mens-grooming', name: 'Men\'s Head Massage & De-Tan Facial', slug: 'mens-massage-detan-facial', description: 'Hot oil scalp massage and O3+ tan removal facial.', startingPrice: 599, duration: '60 mins', features: ['Hot Oil Spa', 'Tan Clear'], packages: [{ name: 'Head Massage + De-tan', price: 699, discountPrice: 599, duration: '60 mins', includedItems: ['20 min oil massage'] }] }
    ];

    let totalServicesCount = 0;
    let totalPackagesCount = 0;

    for (const def of servicesDefinition) {
      const cat = categoryMap[def.catSlug];
      if (!cat) continue;

      let serviceDoc = await Service.findOne({ slug: def.slug });
      if (!serviceDoc) {
        serviceDoc = await Service.create({
          category: cat._id,
          name: def.name,
          slug: def.slug,
          description: def.description,
          images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80'],
          startingPrice: def.startingPrice,
          duration: def.duration,
          features: def.features,
          rating: (4.7 + Math.random() * 0.25).toFixed(1),
          reviewCount: Math.floor(150 + Math.random() * 1000)
        });
      }
      totalServicesCount++;

      for (const pkg of def.packages) {
        let packageDoc = await Package.findOne({ service: serviceDoc._id, name: pkg.name });
        if (!packageDoc) {
          packageDoc = await Package.create({
            service: serviceDoc._id,
            name: pkg.name,
            description: `Professional ${pkg.name} service with guaranteed satisfaction.`,
            price: pkg.price,
            discountPrice: pkg.discountPrice,
            duration: pkg.duration,
            includedItems: pkg.includedItems,
            excludedItems: []
          });
        }
        totalPackagesCount++;
      }
    }
    console.log(`✅ ${totalServicesCount} Services and ${totalPackagesCount}+ Service Packages configured.`);

    // 6. SEED BOOKINGS (22 Bookings)
    console.log('Seeding 22 Customer Bookings...');
    const allServices = await Service.find({});
    const allPackages = await Package.find({});
    const customers = Object.values(userMap).filter(u => u.role === 'customer');

    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PROVIDER_ASSIGNED', 'PROVIDER_ON_THE_WAY', 'SERVICE_STARTED', 'CONFIRMED', 'CANCELLED'];
    const bookingMap = [];

    for (let i = 1; i <= 22; i++) {
      const cust = customers[i % customers.length];
      const prov = providerMap[i % providerMap.length];
      const serv = allServices[i % allServices.length];
      const pkg = allPackages.find(p => p.service.toString() === serv._id.toString()) || allPackages[0];

      const bNumber = `HS20260912${i.toString().padStart(3, '0')}`;
      const status = statuses[i % statuses.length];
      const dateStr = `2026-09-${(10 + (i % 15)).toString().padStart(2, '0')}`;
      const timeStr = '10:00 AM - 12:00 PM';

      let bookingDoc = await Booking.findOne({ bookingNumber: bNumber });
      if (!bookingDoc) {
        bookingDoc = await Booking.create({
          bookingNumber: bNumber,
          customer: cust._id,
          provider: prov._id,
          items: [{
            service: serv._id,
            package: pkg._id,
            name: serv.name,
            packageName: pkg.name,
            unitPrice: pkg.discountPrice || pkg.price,
            quantity: 1,
            totalPrice: pkg.discountPrice || pkg.price
          }],
          addressSnapshot: {
            tag: 'Home',
            house: `Flat ${100 + i}`,
            street: 'Road No 36',
            area: 'Jubilee Hills',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500033'
          },
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          subtotal: pkg.discountPrice || pkg.price,
          discount: 50,
          tax: 0,
          platformFee: 49,
          totalAmount: (pkg.discountPrice || pkg.price) - 50 + 49,
          paymentStatus: status === 'COMPLETED' ? 'PAID' : 'PENDING',
          bookingStatus: status
        });
      }
      bookingMap.push(bookingDoc);
    }
    console.log(`✅ ${bookingMap.length} Bookings created.`);

    // 7. SEED REVIEWS (20 Reviews)
    console.log('Seeding 20 Customer Reviews into Review collection...');
    await Review.deleteMany({});
    const sampleComments = [
      'Extremely professional technician! Arrived on time and cleaned up after finishing.',
      'Outstanding service! The AC is cooling like brand new now.',
      'Very neat and hygienic work. Highly recommended for every household!',
      'Prompt, polite, and knew exactly what needed to be repaired.',
      'Superb deep cleaning! Removed tough stains from sofa effortlessly.',
      'Very satisfied with the quality of service. Will book again next month.',
      'Excellent plumbing work. Fixed the tap leak in under 15 minutes.',
      'Great electrician! Replaced switchboards cleanly and safely.',
      'Salon at home experience was super comfortable and relaxing.',
      'Termite treatment was thorough. No smell and very neat job.'
    ];

    let reviewsCreated = 0;
    for (let i = 0; i < 20; i++) {
      const b = bookingMap[i % bookingMap.length];
      const item = b.items[0];
      const cust = customers[i % customers.length];
      const prov = providerMap[i % providerMap.length];
      const serv = allServices[i % allServices.length];

      await Review.create({
        user: cust._id,
        provider: prov._id,
        service: serv._id,
        booking: b._id,
        rating: 5,
        title: 'Excellent Home Service',
        comment: sampleComments[i % sampleComments.length],
        isVerifiedBooking: true
      });
      reviewsCreated++;
    }
    console.log(`✅ ${reviewsCreated} Reviews persisted into Review collection.`);

    // 8. SEED NOTIFICATIONS (20 Notifications)
    console.log('Seeding 20 Notifications...');
    let notifCount = 0;
    for (let i = 0; i < 20; i++) {
      const b = bookingMap[i % bookingMap.length];
      let notif = await Notification.findOne({ booking: b._id });
      if (!notif) {
        await Notification.create({
          user: b.customer,
          title: `Booking #${b.bookingNumber} Update`,
          message: `Your booking for ${b.items[0]?.name || 'Home Service'} status is now ${b.bookingStatus.replace(/_/g, ' ')}.`,
          type: 'BOOKING',
          booking: b._id,
          isRead: i % 2 === 0
        });
        notifCount++;
      }
    }
    console.log(`✅ ${await Notification.countDocuments()} Notifications created.`);

    // 9. SEED COUPONS (10 Coupons)
    console.log('Seeding Coupons...');
    const couponsData = [
      { code: 'WELCOME100', description: 'Flat ₹100 off on your first home service booking', discountType: 'FIXED', discountValue: 100, minimumOrder: 499, expiryDate: new Date('2026-12-31') },
      { code: 'HOME20', description: '20% off on all deep cleaning services', discountType: 'PERCENTAGE', discountValue: 20, maximumDiscount: 200, minimumOrder: 399, expiryDate: new Date('2026-12-31') },
      { code: 'CLEAN150', description: '₹150 discount on full home deep cleaning', discountType: 'FIXED', discountValue: 150, minimumOrder: 999, expiryDate: new Date('2026-12-31') },
      { code: 'ACFEST', description: '₹200 off on AC Foam & Jet Servicing', discountType: 'FIXED', discountValue: 200, minimumOrder: 699, expiryDate: new Date('2026-12-31') },
      { code: 'BEAUTY50', description: '₹50 off on Salon at Home for women', discountType: 'FIXED', discountValue: 50, minimumOrder: 299, expiryDate: new Date('2026-12-31') },
      { code: 'FESTIVE25', description: '25% off festive home overhaul', discountType: 'PERCENTAGE', discountValue: 25, maximumDiscount: 350, minimumOrder: 1199, expiryDate: new Date('2026-12-31') },
      { code: 'FREESHIP', description: '100% waiver on convenience & visit fee', discountType: 'FIXED', discountValue: 49, minimumOrder: 199, expiryDate: new Date('2026-12-31') },
      { code: 'FIRSTJOB', description: 'Flat ₹100 off for new users', discountType: 'FIXED', discountValue: 100, minimumOrder: 399, expiryDate: new Date('2026-12-31') },
      { code: 'SUMMERCOOL', description: '₹150 off on fridge & AC repair', discountType: 'FIXED', discountValue: 150, minimumOrder: 599, expiryDate: new Date('2026-12-31') },
      { code: 'SUPERHOME', description: 'Flat ₹300 off on high-value bookings', discountType: 'FIXED', discountValue: 300, minimumOrder: 1499, expiryDate: new Date('2026-12-31') }
    ];

    for (const c of couponsData) {
      await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true });
    }
    console.log(`✅ 10 Promotional Coupons configured.`);

    // 10. SEED CARTS (5 Active Carts)
    console.log('Seeding Carts...');
    const Cart = require('./models/Cart');
    await Cart.deleteMany({});
    let cartCount = 0;
    for (let i = 0; i < 5; i++) {
      const cust = customers[i % customers.length];
      const serv = allServices[i % allServices.length];
      const pkg = allPackages.find(p => p.service.toString() === serv._id.toString()) || allPackages[0];

      await Cart.create({
        user: cust._id,
        items: [{
          service: serv._id,
          package: pkg._id,
          quantity: 1,
          unitPrice: pkg.discountPrice || pkg.price,
          totalPrice: pkg.discountPrice || pkg.price
        }],
        subtotal: pkg.discountPrice || pkg.price,
        discount: 0,
        tax: 0,
        total: pkg.discountPrice || pkg.price
      });
      cartCount++;
    }
    console.log(`✅ ${cartCount} Active Carts created.`);

    // 11. SEED PAYMENTS
    console.log('Seeding Payment Records...');
    const completedBookings = bookingMap.filter(b => b.bookingStatus === 'COMPLETED');
    let paymentCount = 0;
    for (const b of completedBookings) {
      let pDoc = await Payment.findOne({ booking: b._id });
      if (!pDoc) {
        await Payment.create({
          booking: b._id,
          user: b.customer,
          amount: b.totalAmount,
          method: 'UPI',
          transactionId: `TXN_HS_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          status: 'COMPLETED',
          paidAt: b.createdAt
        });
        paymentCount++;
      }
    }
    console.log(`✅ ${await Payment.countDocuments()} Payment transactions recorded.`);

    // PRINT PERSISTENT COUNTS
    console.log('\n========================================================');
    console.log('MongoDB Atlas Connected & Seeded Successfully!');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log('--------------------------------------------------------');
    console.log(`users:        ${await User.countDocuments()}`);
    console.log(`providers:    ${await Provider.countDocuments()}`);
    console.log(`categories:   ${await Category.countDocuments()}`);
    console.log(`services:     ${await Service.countDocuments()}`);
    console.log(`servicepackages: ${await Package.countDocuments()}`);
    console.log(`addresses:    ${await Address.countDocuments()}`);
    console.log(`bookings:     ${await Booking.countDocuments()}`);
    console.log(`reviews:      ${await Review.countDocuments()}`);
    console.log(`notifications:${await Notification.countDocuments()}`);
    console.log(`coupons:      ${await Coupon.countDocuments()}`);
    console.log(`payments:     ${await Payment.countDocuments()}`);
    console.log('========================================================\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedDatabase();
