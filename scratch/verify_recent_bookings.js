const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'customer@example.com', password: 'password123' }));

  if (!loginRes.token) {
    console.error('Login failed:', loginRes);
    return;
  }

  const token = loginRes.token;
  console.log('Logged in successfully, token received.');

  const recentRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings/recent',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log('Recent Bookings count:', recentRes.data ? recentRes.data.length : 0);
  if (recentRes.data && recentRes.data.length > 0) {
    recentRes.data.forEach((b, i) => {
      const item = b.items && b.items[0];
      console.log(`\n--- Recent Booking #${i+1} ---`);
      console.log('Booking Number:', b.bookingNumber || b._id);
      console.log('Grand Total:', b.grandTotal);
      console.log('Item Name:', item ? item.name : 'N/A');
      console.log('Item Service:', item ? item.service : 'N/A');
      
      let sId = '';
      if (item && item.service) {
        if (typeof item.service === 'object' && item.service._id) sId = item.service._id;
        else if (typeof item.service === 'string') sId = item.service;
      }
      console.log('Extracted Service ID:', sId);
    });

    // Pick first extracted service ID and fetch service details
    const testItem = recentRes.data[0].items[0];
    const testServiceId = (typeof testItem.service === 'object' && testItem.service._id) ? testItem.service._id : testItem.service;
    
    const serviceRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/services/${testServiceId}`,
      method: 'GET'
    });

    console.log('\n--- Service Details Lookup Test ---');
    console.log('Lookup Service ID:', testServiceId);
    console.log('Service Lookup Success:', serviceRes.success);
    console.log('Service Name:', serviceRes.data ? serviceRes.data.name : serviceRes.error);
  }
}

run().catch(console.error);
