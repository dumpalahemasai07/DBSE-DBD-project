const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

// Import All Models
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
const ProviderAvailability = require('./models/ProviderAvailability');
const Cart = require('./models/Cart');

const models = [
  { name: 'users', model: User },
  { name: 'providers', model: Provider },
  { name: 'categories', model: Category },
  { name: 'services', model: Service },
  { name: 'servicepackages', model: Package },
  { name: 'addresses', model: Address },
  { name: 'carts', model: Cart },
  { name: 'bookings', model: Booking },
  { name: 'reviews', model: Review },
  { name: 'notifications', model: Notification },
  { name: 'coupons', model: Coupon },
  { name: 'payments', model: Payment },
  { name: 'provideravailabilities', model: ProviderAvailability }
];

function sanitizeDocument(docObj) {
  if (!docObj) return null;
  const clone = JSON.parse(JSON.stringify(docObj));
  if (clone.password) clone.password = '[REDACTED_BCRYPT_HASH]';
  if (clone.razorpayKeySecret) clone.razorpayKeySecret = '[REDACTED_SECRET]';
  if (clone.razorpayWebhookSecret) clone.razorpayWebhookSecret = '[REDACTED_SECRET]';
  return clone;
}

function extractSchemaInfo(mongooseModel) {
  const paths = mongooseModel.schema.paths;
  const fields = [];

  for (const [fieldName, pathObj] of Object.entries(paths)) {
    if (fieldName === '__v') continue;

    let instanceType = pathObj.instance || 'Unknown';
    if (pathObj.caster) {
      instanceType = `Array of ${pathObj.caster.instance || 'Object'}`;
    }

    const isRequired = !!pathObj.isRequired;
    let defaultValue = pathObj.options.default;
    if (typeof defaultValue === 'function') {
      defaultValue = '[Function/Dynamic]';
    } else if (defaultValue === undefined) {
      defaultValue = 'None';
    }

    let reference = 'None';
    if (pathObj.options.ref) {
      reference = `Ref -> ${pathObj.options.ref}`;
    } else if (pathObj.caster && pathObj.caster.options && pathObj.caster.options.ref) {
      reference = `Ref -> ${pathObj.caster.options.ref}`;
    }

    fields.push({
      field: fieldName,
      type: instanceType,
      required: isRequired ? 'YES' : 'NO',
      default: String(defaultValue),
      reference: reference
    });
  }

  return fields;
}

async function generateReport() {
  try {
    await mongoose.connect(process.env.DB_URI);
    const dbName = mongoose.connection.name;

    console.log('========================================================');
    console.log('MONGODB ATLAS LIVE SCHEMA & STRUCTURAL INSPECTION REPORT');
    console.log(`Database Name: ${dbName}`);
    console.log('========================================================\n');

    const dbCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('1. SHOW COLLECTIONS (MySQL Equivalent: SHOW TABLES)');
    console.log('--------------------------------------------------------');
    dbCollections.forEach((c, idx) => {
      console.log(` ${idx + 1}. ${c.name}`);
    });
    console.log('');

    console.log('2. COLLECTION DOCUMENT COUNTS');
    console.log('--------------------------------------------------------');
    for (const m of models) {
      const count = await m.model.countDocuments();
      console.log(` - ${m.name.padEnd(24, ' ')}: ${count} documents`);
    }
    console.log('');

    console.log('3. DETAILED SCHEMA DESCRIPTIONS & SAMPLE DOCUMENTS (MySQL Equivalent: DESCRIBE <table>)');
    console.log('========================================================\n');

    for (const m of models) {
      const count = await m.model.countDocuments();
      const schemaFields = extractSchemaInfo(m.model);
      const rawIndexes = await m.model.collection.indexes();
      const indexList = rawIndexes.map(i => `${Object.keys(i.key).join(', ')} (${i.unique ? 'UNIQUE' : 'INDEX'})`);
      const sampleDoc = await m.model.findOne({}).lean();
      const sanitized = sanitizeDocument(sampleDoc);

      console.log(`### Collection: \`${m.name}\``);
      console.log(`- **Live Count**: ${count} documents`);
      console.log(`- **Indexes**: ${indexList.join(' | ')}`);
      console.log(`- **Schema Definition**:`);
      console.log('| Field Name | Data Type | Required | Default Value | References |');
      console.log('| :--- | :--- | :---: | :--- | :--- |');
      schemaFields.forEach(f => {
        console.log(`| \`${f.field}\` | ${f.type} | ${f.required} | \`${f.default}\` | ${f.reference} |`);
      });
      
      console.log('\n- **Sample Document**:');
      console.log('```json');
      console.log(JSON.stringify(sanitized, null, 2));
      console.log('```\n');
      console.log('--------------------------------------------------------\n');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Inspection Error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

generateReport();
