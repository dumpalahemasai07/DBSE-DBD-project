const http = require('http');

http.get('http://localhost:5000/api/services', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Services API success:', parsed.success, 'Count:', parsed.data ? parsed.data.length : 0);
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', err => console.error('API Error:', err.message));
