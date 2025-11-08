#!/usr/bin/env ts-node
/**
 * API Connection Test Script
 * Run with: npx ts-node scripts/test-api-connection.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marquebwithd-production.up.railway.app/api/v1'

interface TestResult {
  name: string
  endpoint: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  responseTime?: number
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  endpoint: string,
  options?: RequestInit
): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      return {
        name,
        endpoint,
        status: 'PASS',
        message: `Success (${response.status})`,
        responseTime
      }
    } else {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      return {
        name,
        endpoint,
        status: 'FAIL',
        message: `HTTP ${response.status}: ${error.detail || error.message || 'Unknown error'}`,
        responseTime
      }
    }
  } catch (error: any) {
    return {
      name,
      endpoint,
      status: 'FAIL',
      message: `Network error: ${error.message}`
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Marque Backend API Connection...\n')
  console.log(`📍 Backend URL: ${API_BASE_URL}\n`)
  console.log('=' .repeat(80))
  
  // Test 1: Health Check
  results.push(await testEndpoint('Health Check', '/auth/health'))
  
  // Test 2: Get Categories
  results.push(await testEndpoint('Get Categories', '/categories'))
  
  // Test 3: Get Best Sellers
  results.push(await testEndpoint('Get Best Sellers', '/products/best-sellers?limit=5'))
  
  // Test 4: Get Banners
  results.push(await testEndpoint('Get Banners', '/banners'))
  
  // Test 5: Get Supported Markets
  results.push(await testEndpoint('Get Supported Markets', '/auth/markets'))
  
  // Test 6: Search Products
  results.push(await testEndpoint('Search Products', '/products/search?query=футболка&limit=3'))
  
  // Print results
  console.log('\n📊 Test Results:\n')
  console.log('=' .repeat(80))
  
  results.forEach((result, index) => {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️ '
    const timeStr = result.responseTime ? ` (${result.responseTime}ms)` : ''
    
    console.log(`${index + 1}. ${statusIcon} ${result.name}${timeStr}`)
    console.log(`   ${result.endpoint}`)
    console.log(`   ${result.message}`)
    console.log()
  })
  
  // Summary
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length
  
  console.log('=' .repeat(80))
  console.log(`\n📈 Summary: ${passed}/${total} tests passed`)
  
  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed. Check your backend configuration.`)
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed! Your frontend is ready to connect to the backend.')
    process.exit(0)
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error)
  process.exit(1)
})

