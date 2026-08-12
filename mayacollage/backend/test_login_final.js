import http from 'http';

const body = JSON.stringify({ loginId: '25BP001', password: '22/02/2007' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/student-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    if (res.statusCode === 200) {
      console.log('✅ LOGIN SUCCESS!');
      console.log(`   Student: ${result.firstName} ${result.lastName}`);
      console.log(`   ID: ${result.studentId}`);
      console.log(`   Token: ${result.token ? result.token.substring(0, 30) + '...' : 'N/A'}`);
    } else {
      console.log('❌ LOGIN FAILED:', result.message);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Connection error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
