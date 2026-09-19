async function testServerStatic() {
  console.log('Testing http://localhost:5000/ ...');
  const rootRes = await fetch('http://localhost:5000/');
  const rootText = await rootRes.text();
  console.log(`Root GET / Status: ${rootRes.status}`);
  console.log(`Root Contains HTML Title: ${rootText.includes('<title>HomeEase')}`);

  console.log('\nTesting http://localhost:5000/api/categories ...');
  const catRes = await fetch('http://localhost:5000/api/categories');
  const catJson = await catRes.json();
  console.log(`API /api/categories Status: ${catRes.status}`);
  console.log(`Returned Categories Count: ${catJson.data ? catJson.data.length : 0}`);

  console.log('\nTesting http://localhost:5000/api/services ...');
  const servRes = await fetch('http://localhost:5000/api/services');
  const servJson = await servRes.json();
  console.log(`API /api/services Status: ${servRes.status}`);
  console.log(`Returned Services Count: ${servJson.data ? servJson.data.length : 0}`);

  if (rootRes.status === 200 && rootText.includes('HomeEase') && catJson.data.length >= 15 && servJson.data.length >= 40) {
    console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ Verification test failed');
    process.exit(1);
  }
}

testServerStatic();
