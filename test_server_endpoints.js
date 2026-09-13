const http = require('http');

const urls = [
  'http://localhost:5000/',
  'http://localhost:5000/index.html',
  'http://localhost:5000/dashboard.html',
  'http://localhost:5000/projects.html',
  'http://localhost:5000/internships.html',
  'http://localhost:5000/mockinterviews.html',
  'http://localhost:5000/projects.json',
  'http://localhost:5000/internships.json',
  'http://localhost:5000/api/health'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const isOk = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`[${isOk ? 'PASS' : 'FAIL'}] ${res.statusCode} - ${url} (${data.length} bytes)`);
        resolve({ url, status: res.statusCode, ok: isOk, snippet: data.slice(0, 100) });
      });
    }).on('error', (err) => {
      console.log(`[FAIL] ERROR - ${url}: ${err.message}`);
      resolve({ url, status: 'ERROR', ok: false, error: err.message });
    });
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("TESTING PREPAI EXPRESS SERVER ENDPOINTS");
  console.log("==================================================\n");

  let passed = 0;
  for (const url of urls) {
    const result = await testUrl(url);
    if (result.ok) passed++;
  }

  console.log("\n--------------------------------------------------");
  console.log(`RESULT: ${passed}/${urls.length} endpoints passed.`);
  console.log("--------------------------------------------------");
  
  if (passed !== urls.length) process.exit(1);
}

runTests();
