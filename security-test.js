#!/usr/bin/env bun

// @DEMO Security Test Suite
// Tests rate limiting, DDoS protection, and input sanitization

const BASE_URL = 'http://localhost:3000';
const SECURE_URL = 'http://localhost:3000';

class SecurityTester {
  constructor() {
    this.results = {
      rateLimit: { passed: 0, failed: 0 },
      ddosProtection: { passed: 0, failed: 0 },
      inputSanitization: { passed: 0, failed: 0 },
      cors: { passed: 0, failed: 0 },
      securityHeaders: { passed: 0, failed: 0 }
    };
  }

  async testRateLimit() {
    console.log('🚦 Testing Rate Limiting...');
    
    try {
      // Make rapid requests to trigger rate limit
      const requests = [];
      for (let i = 0; i < 105; i++) {
        requests.push(fetch(`${SECURE_URL}/api/status`));
      }
      
      const responses = await Promise.allSettled(requests);
      let rateLimited = 0;
      let successful = 0;
      
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          if (response.value.status === 429) {
            rateLimited++;
            this.results.rateLimit.passed++;
          } else if (response.value.status === 200) {
            successful++;
          }
        } else {
          this.results.rateLimit.failed++;
        }
      });
      
      console.log(`✅ Rate Limit Test: ${successful} successful, ${rateLimited} rate limited`);
      
    } catch (error) {
      console.error('❌ Rate limit test failed:', error.message);
      this.results.rateLimit.failed++;
    }
  }

  async testDDoSProtection() {
    console.log('🛡️ Testing DDoS Protection...');
    
    try {
      // Simulate high-frequency requests from same IP
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(fetch(`${SECURE_URL}/api/status`, {
          headers: { 'X-Forwarded-For': '192.168.1.100' }
        }));
      }
      
      const responses = await Promise.allSettled(requests);
      let blocked = 0;
      let allowed = 0;
      
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          if (response.value.status === 429 || response.value.status === 403) {
            blocked++;
            this.results.ddosProtection.passed++;
          } else if (response.value.status === 200) {
            allowed++;
          }
        } else {
          this.results.ddosProtection.failed++;
        }
      });
      
      console.log(`✅ DDoS Protection Test: ${allowed} allowed, ${blocked} blocked`);
      
    } catch (error) {
      console.error('❌ DDoS protection test failed:', error.message);
      this.results.ddosProtection.failed++;
    }
  }

  async testInputSanitization() {
    console.log('🧹 Testing Input Sanitization...');
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '<iframe src="javascript:alert(\'xss\')"></iframe>',
      '"><script>alert("xss")</script>'
    ];
    
    for (const input of maliciousInputs) {
      try {
        const response = await fetch(`${SECURE_URL}/api/echo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if malicious content was sanitized
          const sanitized = result.echo.message;
          const hasScript = sanitized.includes('<script>');
          const hasJavascript = sanitized.toLowerCase().includes('javascript:');
          const hasOnerror = sanitized.toLowerCase().includes('onerror');
          
          if (!hasScript && !hasJavascript && !hasOnerror) {
            this.results.inputSanitization.passed++;
          } else {
            console.warn(`⚠️ Input not properly sanitized: ${sanitized}`);
            this.results.inputSanitization.failed++;
          }
        } else {
          this.results.inputSanitization.failed++;
        }
      } catch (error) {
        console.error('❌ Input sanitization test failed:', error.message);
        this.results.inputSanitization.failed++;
      }
    }
    
    console.log(`✅ Input Sanitization Test: ${this.results.inputSanitization.passed} passed, ${this.results.inputSanitization.failed} failed`);
  }

  async testCORS() {
    console.log('🌐 Testing CORS Configuration...');
    
    try {
      // Test preflight request
      const response = await fetch(`${SECURE_URL}/api/status`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      if (response.ok) {
        const corsHeaders = {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers')
        };
        
        if (corsHeaders['access-control-allow-origin'] && 
            corsHeaders['access-control-allow-methods']) {
          this.results.cors.passed++;
          console.log('✅ CORS properly configured:', corsHeaders);
        } else {
          this.results.cors.failed++;
          console.warn('⚠️ CORS headers missing:', corsHeaders);
        }
      } else {
        this.results.cors.failed++;
      }
    } catch (error) {
      console.error('❌ CORS test failed:', error.message);
      this.results.cors.failed++;
    }
  }

  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers...');
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'strict-transport-security'
    ];
    
    try {
      const response = await fetch(`${SECURE_URL}/api/status`);
      
      if (response.ok) {
        let headersFound = 0;
        
        requiredHeaders.forEach(header => {
          if (response.headers.get(header)) {
            headersFound++;
            this.results.securityHeaders.passed++;
          } else {
            this.results.securityHeaders.failed++;
          }
        });
        
        console.log(`✅ Security Headers Test: ${headersFound}/${requiredHeaders.length} found`);
      } else {
        this.results.securityHeaders.failed++;
      }
    } catch (error) {
      console.error('❌ Security headers test failed:', error.message);
      this.results.securityHeaders.failed++;
    }
  }

  async testWebSocketSecurity() {
    console.log('🔌 Testing WebSocket Security...');
    
    try {
      // Test WebSocket connection and message sanitization
      const WebSocket = (await import('ws')).default;
      const ws = new WebSocket('ws://localhost:3000/ws');
      
      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          // Send potentially malicious message
          ws.send('<script>alert("test")</script>');
        });
        
        ws.on('message', (data) => {
          const message = data.toString();
          
          // Check if message was sanitized
          if (!message.includes('<script>')) {
            console.log('✅ WebSocket message sanitization working');
            resolve();
          } else {
            console.warn('⚠️ WebSocket message not sanitized');
            reject();
          }
          
          ws.close();
        });
        
        ws.on('error', reject);
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('WebSocket test timeout')), 5000);
      });
    } catch (error) {
      console.error('❌ WebSocket security test failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🔒 @DEMO Security Test Suite');
    console.log('=============================');
    console.log('Make sure the secure server is running:');
    console.log('bun run secure');
    console.log('');
    
    await this.testRateLimit();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testDDoSProtection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testInputSanitization();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testCORS();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testSecurityHeaders();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testWebSocketSecurity();
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 Security Test Results');
    console.log('=======================');
    
    const categories = Object.entries(this.results);
    let totalPassed = 0;
    let totalFailed = 0;
    
    categories.forEach(([category, results]) => {
      const categoryName = category.replace(/([A-Z])/g, ' $1').trim();
      const total = results.passed + results.failed;
      const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
      
      console.log(`${categoryName}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📈 Pass Rate: ${passRate}%`);
      console.log('');
      
      totalPassed += results.passed;
      totalFailed += results.failed;
    });
    
    const overallPassRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
    console.log(`🎯 Overall Security Score: ${overallPassRate}%`);
    
    if (overallPassRate >= 90) {
      console.log('🏆 Excellent security posture!');
    } else if (overallPassRate >= 70) {
      console.log('👍 Good security posture');
    } else {
      console.log('⚠️ Security needs improvement');
    }
  }
}

// Run tests if called directly
if (import.meta.main) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

export { SecurityTester };
export default SecurityTester;
