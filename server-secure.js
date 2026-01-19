#!/usr/bin/env bun

// @DEMO Secure Enterprise Server
// With integrated security middleware and monitoring

import { SecurityMiddleware, DDoSProtection, InputSanitizer } from './security-middleware.js';

const PORT = process.env.BUN_PORT || process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Initialize security middleware
const security = new SecurityMiddleware({
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100     // 100 requests per minute
  },
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  }
});

const ddosProtection = new DDoSProtection({
  threshold: 500 // requests per minute
});

// Metrics tracking
let metrics = {
  requests: 0,
  blocked: 0,
  rateLimited: 0,
  startTime: Date.now(),
  endpoints: {}
};

const connections = new Set();

// Create secure server
const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  
  websocket: {
    open(ws) {
      connections.add(ws);
      metrics.requests++;
      
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to @DEMO Secure Server',
        timestamp: new Date().toISOString(),
        security: 'enabled'
      }));
    },
    
    close(ws) {
      connections.delete(ws);
    },
    
    message(ws, message) {
      try {
        // Sanitize input
        const sanitized = InputSanitizer.sanitize(message.toString());
        
        // Broadcast sanitized message
        connections.forEach(client => {
          if (client !== ws) {
            client.send(sanitized);
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    }
  },
  
  async fetch(req) {
    const startTime = Date.now();
    const url = new URL(req.url);
    
    try {
      // Apply security middleware
      const ddosResult = ddosProtection.middleware()(req);
      if (ddosResult) {
        metrics.blocked++;
        return ddosResult;
      }
      
      const rateLimitResult = security.rateLimitMiddleware()(req);
      if (rateLimitResult) {
        metrics.rateLimited++;
        return rateLimitResult;
      }
      
      const corsResult = security.corsMiddleware()(req);
      if (corsResult) {
        return corsResult;
      }
      
      const validationResult = security.requestValidator({
        allowedPaths: ['/api', '/ws', '/', '/docs', '/favicon.ico'],
        maxRequestSize: 1024 * 1024 // 1MB
      })(req);
      if (validationResult) {
        return validationResult;
      }
      
      // Track endpoint metrics
      const endpoint = url.pathname;
      metrics.endpoints[endpoint] = (metrics.endpoints[endpoint] || 0) + 1;
      
      // Route handling
      let response;
      switch (url.pathname) {
        case '/':
          response = new Response(getSecureHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
          break;
        
        case '/api/status':
          response = Response.json({
            service: '@DEMO Secure Server',
            status: 'operational',
            security: 'enabled',
            uptime: process.uptime(),
            version: '2.0.1',
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            connections: connections.size,
            requests: metrics.requests,
            blocked: metrics.blocked,
            rateLimited: metrics.rateLimited
          });
          break;
        
        case '/api/health':
          response = Response.json({
            status: 'healthy',
            security: {
              rateLimit: 'active',
              ddosProtection: 'active',
              cors: 'configured',
              inputSanitization: 'enabled'
            },
            services: {
              server: 'running',
              websocket: 'active',
              security: 'enabled'
            }
          });
          break;
        
        case '/api/metrics':
          response = Response.json({
            ...metrics,
            server_uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
            connections: connections.size,
            endpoints: Object.entries(metrics.endpoints).map(([path, count]) => ({
              path,
              requests: count
            })),
            security: {
              blocked: metrics.blocked,
              rateLimited: metrics.rateLimited,
              totalRequests: metrics.requests,
              blockRate: Math.round((metrics.blocked / metrics.requests) * 100) + '%'
            }
          });
          break;
        
        case '/api/security':
          response = Response.json({
            features: [
              'Rate Limiting',
              'DDoS Protection', 
              'CORS Configuration',
              'Input Sanitization',
              'Request Validation',
              'Security Headers'
            ],
            configuration: {
              rateLimit: security.rateLimit,
              cors: security.cors,
              ddosThreshold: ddosProtection.threshold
            },
            stats: {
              requestsBlocked: metrics.blocked,
              requestsRateLimited: metrics.rateLimited,
              totalProcessed: metrics.requests,
              blacklistSize: ddosProtection.blacklist.size
            }
          });
          break;
        
        case '/api/echo':
          if (req.method === 'POST') {
            const body = await req.json();
            const sanitized = InputSanitizer.sanitizeJSON(body);
            
            response = Response.json({
              echo: sanitized,
              timestamp: new Date().toISOString(),
              security: 'sanitized'
            });
          } else {
            response = new Response('Method not allowed', { status: 405 });
          }
          break;
        
        case '/ws':
          response = server.upgrade(req);
          break;
        
        case '/docs':
          response = Response.json({
            name: '@DEMO Secure Server',
            version: '2.0.1',
            security: 'enabled',
            endpoints: [
              '/api/status',
              '/api/health',
              '/api/metrics',
              '/api/security',
              '/api/echo',
              '/ws'
            ],
            features: [
              'Rate limiting',
              'DDoS protection',
              'CORS support',
              'Input sanitization',
              'Security headers',
              'WebSocket security'
            ]
          });
          break;
        
        default:
          response = new Response('404 - Not Found', { status: 404 });
      }
      
      // Apply security headers
      response = security.applySecurityHeaders(response);
      
      // Track response time
      const responseTime = Date.now() - startTime;
      response.headers.set('X-Response-Time', responseTime.toString());
      
      metrics.requests++;
      return response;
      
    } catch (error) {
      console.error('Server error:', error);
      const errorResponse = new Response('Internal Server Error', { status: 500 });
      return security.applySecurityHeaders(errorResponse);
    }
  }
});

// Cleanup tasks
setInterval(() => {
  security.cleanup();
  ddosProtection.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

console.log(`🔒 @DEMO Secure Server running at ${server.url}`);
console.log(`🛡️  Security: Rate limiting, DDoS protection, CORS enabled`);
console.log(`📊 Monitoring: Real-time metrics tracking active`);
console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}/ws`);
console.log(`📖 Documentation: ${server.url}docs`);

// Generate secure HTML
function getSecureHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Secure Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; margin: 0 4px; }
        .secure { background: #22c55e; color: white; }
        .api { background: #3b82f6; color: white; }
        .card { background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .endpoint { font-family: monospace; background: #334155; padding: 2px 6px; border-radius: 4px; }
        .method { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .get { background: #22c55e; color: white; }
        .post { background: #3b82f6; color: white; }
        .ws { background: #8b5cf6; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 @DEMO Secure Server</h1>
            <p>Enterprise-grade security with real-time monitoring</p>
            <span class="badge secure">🛡️ Security Enabled</span>
            <span class="badge api">📊 API Active</span>
        </div>
        
        <div class="card">
            <h3>🔐 Security Features</h3>
            <ul>
                <li>Rate limiting (100 requests/minute)</li>
                <li>DDoS protection</li>
                <li>CORS configuration</li>
                <li>Input sanitization</li>
                <li>Security headers</li>
                <li>Request validation</li>
            </ul>
        </div>
        
        <div class="card">
            <h3>📡 API Endpoints</h3>
            <p><span class="method get">GET</span> <span class="endpoint">/api/status</span> - Server status</p>
            <p><span class="method get">GET</span> <span class="endpoint">/api/health</span> - Health check</p>
            <p><span class="method get">GET</span> <span class="endpoint">/api/metrics</span> - Performance metrics</p>
            <p><span class="method get">GET</span> <span class="endpoint">/api/security</span> - Security info</p>
            <p><span class="method post">POST</span> <span class="endpoint">/api/echo</span> - Echo with sanitization</p>
            <p><span class="method ws">WS</span> <span class="endpoint">/ws</span> - WebSocket connection</p>
        </div>
        
        <div class="card">
            <h3>📊 Real-time Monitoring</h3>
            <p>Track requests, connections, and security events in real-time.</p>
            <p><a href="/api/metrics" style="color: #3b82f6;">View Live Metrics →</a></p>
        </div>
    </div>
    
    <script>
        // Test security features
        fetch('/api/status')
            .then(r => r.json())
            .then(data => console.log('Status:', data));
            
        // Test rate limiting
        let count = 0;
        const testRateLimit = () => {
            fetch('/api/status')
                .then(r => {
                    if (r.status === 429) {
                        console.log('Rate limit active:', r.status);
                    } else {
                        count++;
                        if (count < 105) setTimeout(testRateLimit, 10);
                    }
                });
        };
    </script>
</body>
</html>`;
}

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

export default server;
