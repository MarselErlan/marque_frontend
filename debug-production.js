// Production Connection Debug Script
// Run this in browser console on https://marque.website

console.log('🔍 Debugging marque.website API connection...\n');

// Test 1: Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '❌ NOT SET');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ NOT SET');
console.log('');

// Test 2: API Health Check
console.log('🏥 Testing API Health...');
fetch('https://marquebackend-production.up.railway.app/api/v1/auth/health')
  .then(r => {
    console.log('✅ Health check response status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('✅ Health check data:', data);
  })
  .catch(err => {
    console.error('❌ Health check failed:', err);
  });

// Test 3: Products API
console.log('📦 Testing Products API...');
fetch('https://marquebackend-production.up.railway.app/api/v1/products/best-sellers?limit=5')
  .then(r => {
    console.log('✅ Products API response status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('✅ Products API data:', data);
  })
  .catch(err => {
    console.error('❌ Products API failed:', err);
  });

// Test 4: Categories API
console.log('📁 Testing Categories API...');
fetch('https://marquebackend-production.up.railway.app/api/v1/categories')
  .then(r => {
    console.log('✅ Categories API response status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('✅ Categories API data:', data);
  })
  .catch(err => {
    console.error('❌ Categories API failed:', err);
  });

// Test 5: Check current page API calls
console.log('🌐 Checking current page API calls...');
console.log('Current URL:', window.location.href);
console.log('Page title:', document.title);

// Test 6: Check for any existing API calls in Network tab
console.log('\n📊 To check API calls:');
console.log('1. Open DevTools → Network tab');
console.log('2. Refresh the page');
console.log('3. Look for calls to marquebackend-production.up.railway.app');
console.log('4. Check if any calls are failing');

// Test 7: Manual API URL test
console.log('\n🧪 Manual API URL test:');
const apiUrl = 'https://marquebackend-production.up.railway.app/api/v1';
console.log('Testing API base URL:', apiUrl);

fetch(apiUrl)
  .then(r => {
    console.log('✅ Base API response status:', r.status);
    return r.text();
  })
  .then(data => {
    console.log('✅ Base API response:', data);
  })
  .catch(err => {
    console.error('❌ Base API failed:', err);
  });

console.log('\n🎯 If all tests pass but frontend still not working:');
console.log('→ The issue is likely in the frontend code');
console.log('→ Check if API calls are being made from React components');
console.log('→ Look for JavaScript errors in console');
console.log('→ Check Network tab for failed requests');