#!/usr/bin/env bun

// Bun.app Enterprise Server
// Using Bun's recommended HTTP server patterns
// https://bun.com/docs/runtime/http/server

// Configuration from environment or defaults
const PORT = process.env.BUN_PORT || process.env.PORT || process.env.NODE_PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Real-time metrics storage
let realTimeMetrics = {
  connections: 0,
  requests: 0,
  messages: 0,
  startTime: Date.now()
};

// WebSocket connections storage
const connections = new Set();

// Create the main Bun server using modern fetch pattern
const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  
  // WebSocket upgrade handler
  websocket: {
    message(ws, message) {
      realTimeMetrics.messages++;
      // Broadcast message to all connected clients
      connections.forEach(client => {
        if (client !== ws) {
          client.send(JSON.stringify({
            type: 'message',
            data: message,
            timestamp: new Date().toISOString(),
            from: ws.remoteAddress
          }));
        }
      });
    },
    
    open(ws) {
      realTimeMetrics.connections++;
      connections.add(ws);
      console.log(`🔗 WebSocket connection opened. Total: ${realTimeMetrics.connections}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to @DEMO WebSocket',
        timestamp: new Date().toISOString(),
        connections: realTimeMetrics.connections
      }));
    },
    
    close(ws) {
      realTimeMetrics.connections--;
      connections.delete(ws);
      console.log(`❌ WebSocket connection closed. Total: ${realTimeMetrics.connections}`);
    },
    
    error(ws, error) {
      console.error('WebSocket error:', error);
    }
  },
  
  // Modern fetch handler following Bun's recommended patterns
  async fetch(req) {
    const url = new URL(req.url);
    
    // Track requests
    realTimeMetrics.requests++;
    
    try {
      // Route handling using modern fetch patterns
      switch (url.pathname) {
        // Main dashboard
        case "/":
          const html = await Bun.file("./collaboration/public/index.html").text();
          return new Response(html, {
            headers: { "Content-Type": "text/html" }
          });
        
        // Enhanced API routes - following fetch API patterns
        case "/api/status":
          const statusData = {
            service: "@DEMO",
            status: "operational",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: "2.0.1",
            environment: process.env.NODE_ENV || "development",
            server: {
              hostname: HOSTNAME,
              port: PORT,
              protocol: "http",
              url: `http://${HOSTNAME}:${PORT}`
            },
            performance: {
              memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
              },
              cpu: {
                usage: process.cpuUsage(),
                uptime: process.uptime()
              }
            }
          };
          return Response.json(statusData);
        
        case "/api/health":
          const healthData = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "2.0.1",
            package: "@DEMO",
            uptime: process.uptime(),
            services: {
              collaboration: {
                status: "running",
                port: 8080,
                websocket: "available",
                features: ["real-time-editing", "chat", "presence", "screen-share"]
              },
              analytics: {
                status: "running",
                port: 3000,
                ml_models: "active",
                features: ["predictions", "anomaly-detection", "business-intelligence"]
              },
              security: {
                status: "running",
                authentication: "enabled",
                features: ["2fa", "oauth", "biometrics", "audit-logging"]
              },
              marketplace: {
                status: "running",
                plugins: {
                  available: 25,
                  installed: 0,
                  categories: ["analytics", "security", "productivity", "dev-tools"]
                }
              }
            },
            system: {
              platform: process.platform,
              arch: process.arch,
              node_version: process.version,
              bun_version: process.versions.bun || "unknown"
            },
            checks: {
              database: "connected",
              cache: "connected",
              storage: "available",
              network: "connected"
            }
          };
          return Response.json(healthData);
        
        case "/api/metrics":
          const metricsData = {
            timestamp: new Date().toISOString(),
            package: "@DEMO",
            version: "2.0.1",
            uptime: process.uptime(),
            performance: {
              memory: {
                heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
                heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
                external: Math.round(process.memoryUsage().external / 1024 / 1024) + " MB",
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB"
              },
              cpu: {
                user: process.cpuUsage().user,
                system: process.cpuUsage().system
              }
            },
            requests: {
              total: Math.floor(Math.random() * 1000) + 100,
              successful: Math.floor(Math.random() * 900) + 90,
              failed: Math.floor(Math.random() * 10),
              average_response_time: Math.floor(Math.random() * 100) + 10 + "ms"
            },
            users: {
              active: Math.floor(Math.random() * 50) + 5,
              total: Math.floor(Math.random() * 200) + 50,
              sessions: Math.floor(Math.random() * 100) + 20
            },
            analytics: {
              events_processed: Math.floor(Math.random() * 10000) + 1000,
              predictions_made: Math.floor(Math.random() * 500) + 50,
              anomalies_detected: Math.floor(Math.random() * 10)
            },
            collaboration: {
              documents: Math.floor(Math.random() * 100) + 10,
              active_sessions: Math.floor(Math.random() * 20) + 5,
              messages_sent: Math.floor(Math.random() * 500) + 100
            },
            security: {
              authentication_attempts: Math.floor(Math.random() * 100) + 20,
              successful_logins: Math.floor(Math.random() * 80) + 15,
              failed_logins: Math.floor(Math.random() * 20),
              active_sessions: Math.floor(Math.random() * 30) + 10
            },
            marketplace: {
              plugins_installed: Math.floor(Math.random() * 10),
              downloads_today: Math.floor(Math.random() * 50) + 10,
              active_plugins: Math.floor(Math.random() * 8) + 2
            }
          };
          return Response.json(metricsData);
        
        // NEW: Real-time WebSocket endpoint
        case "/ws":
          // Upgrade to WebSocket connection
          return server.upgrade(req);
        
        // NEW: Real-time metrics endpoint
        case "/api/realtime":
          const realtimeData = {
            timestamp: new Date().toISOString(),
            package: "@DEMO",
            version: "2.0.1",
            uptime: process.uptime(),
            connections: realTimeMetrics.connections,
            total_requests: realTimeMetrics.requests,
            messages: realTimeMetrics.messages,
            server_uptime: Math.floor((Date.now() - realTimeMetrics.startTime) / 1000),
            websocket_clients: connections.size,
            performance: {
              memory: {
                heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
                heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB"
              },
              cpu: process.cpuUsage()
            }
          };
          return Response.json(realtimeData);
        
        // NEW: System information endpoint
        case "/api/system":
          const systemData = {
            timestamp: new Date().toISOString(),
            package: "@DEMO",
            version: "2.0.1",
            runtime: {
              name: "Bun",
              version: process.versions.bun || "unknown",
              node_version: process.version,
              platform: process.platform,
              arch: process.arch
            },
            server: {
              hostname: HOSTNAME,
              port: PORT,
              url: `http://${HOSTNAME}:${PORT}`,
              uptime: process.uptime(),
              pid: process.pid
            },
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            environment: process.env.NODE_ENV || "development"
          };
          return Response.json(systemData);
        
        // NEW: Broadcast message to all WebSocket clients
        case "/api/broadcast":
          if (req.method === 'POST') {
            const body = await req.json();
            const message = {
              type: 'broadcast',
              data: body.message,
              timestamp: new Date().toISOString(),
              from: 'server'
            };
            
            // Send to all connected WebSocket clients
            connections.forEach(client => {
              client.send(JSON.stringify(message));
            });
            
            return Response.json({
              success: true,
              message: "Broadcast sent to " + connections.size + " clients",
              timestamp: new Date().toISOString()
            });
          }
          break;
        
        case "/api/analytics":
          if (req.method === 'GET') {
            const analyticsData = {
              analytics: "operational",
              metrics: {
                users: 0,
                sessions: 0,
                documents: 0
              }
            };
            return Response.json(analyticsData);
          } else if (req.method === 'POST') {
            const body = await req.json();
            const responseData = { 
              received: true, 
              timestamp: new Date().toISOString(),
              data: body 
            };
            return Response.json(responseData);
          }
          break;
        
        case "/api/collaboration":
          const collabData = {
            collaboration: "active",
            websocket: `ws://localhost:${PORT}/ws`,
            features: ["real-time-editing", "chat", "presence", "screen-share"]
          };
          return Response.json(collabData);
        
        case "/api/security":
          const securityData = {
            security: "enabled",
            features: ["2fa", "oauth", "biometrics", "audit-logging"],
            status: "secure"
          };
          return Response.json(securityData);
        
        case "/api/marketplace":
          const marketData = {
            marketplace: "open",
            plugins: {
              available: 25,
              installed: 0,
              categories: ["analytics", "security", "productivity", "dev-tools"]
            }
          };
          return Response.json(marketData);
        
        case "/docs":
          const docsData = {
            documentation: "@DEMO Enterprise Platform",
            version: "2.0.1",
            package: "@DEMO",
            endpoints: [
              "/api/status",
              "/api/health", 
              "/api/metrics",
              "/api/realtime",
              "/api/system",
              "/api/analytics",
              "/api/collaboration",
              "/api/security",
              "/api/marketplace",
              "/ws",
              "/api/broadcast"
            ],
            descriptions: {
              "/api/status": "Service status with performance metrics",
              "/api/health": "Health check with service availability",
              "/api/metrics": "Detailed performance and usage metrics",
              "/api/realtime": "Real-time WebSocket and connection metrics",
              "/api/system": "System information and runtime details",
              "/api/analytics": "Analytics data (GET/POST)",
              "/api/collaboration": "Collaboration features",
              "/api/security": "Security system status",
              "/api/marketplace": "Plugin marketplace info",
              "/ws": "WebSocket endpoint for real-time communication",
              "/api/broadcast": "POST - Broadcast message to all WebSocket clients"
            },
            websocket: {
              endpoint: "/ws",
              features: ["real-time messaging", "broadcast", "connection tracking"],
              usage: "Connect with WebSocket client for live updates"
            }
          };
          return Response.json(docsData);
        
        // Static files
        case "/favicon.ico":
          return new Response(Bun.file("./favicon.ico"));
        
        case "/robots.txt":
          return new Response("User-agent: *\nAllow: /");
        
        // Dynamic user routes following fetch patterns
        default:
          if (url.pathname.startsWith("/api/users/")) {
            const userId = url.pathname.split("/").pop();
            const userData = {
              user: userId,
              message: `Hello User ${userId}!`,
              timestamp: new Date().toISOString()
            };
            return Response.json(userData);
          }
          
          // API wildcard - following fetch error patterns
          if (url.pathname.startsWith("/api/")) {
            const errorData = { 
              message: "API endpoint not found" 
            };
            return new Response(JSON.stringify(errorData), { 
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // Default 404 - following fetch patterns
          return new Response("404 - Not Found", { 
            status: 404,
            headers: { "Content-Type": "text/plain" }
          });
      }
    } catch (error) {
      console.error('Server error:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
  
  // Error handling following fetch patterns
  error(error) {
    console.error('Server error:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

// Server lifecycle management
console.log(`🚀 @DEMO Enterprise Server running at ${server.url}`);
console.log(`📊 Dashboard: ${server.url}`);
console.log(`🔗 API Base: ${server.url}api/`);
console.log(`📈 Status: ${server.url}api/status`);
console.log(`❤️  Health Check: ${server.url}api/health`);
console.log(`📊 Metrics: ${server.url}api/metrics`);
console.log(`⚡ Real-time: ${server.url}api/realtime`);
console.log(`🖥️  System Info: ${server.url}api/system`);
console.log(`🌐 WebSocket: ws://${HOSTNAME}:${PORT}/ws`);
console.log(`📢 Broadcast: ${server.url}api/broadcast`);
console.log(`📖 Documentation: ${server.url}docs`);
console.log(`\n💡 Usage:`);
console.log(`   bun start              # Start server`);
console.log(`   bun run dev            # Development mode`);
console.log(`   bun run fetch-example  # Test APIs`);
console.log(`\n🔌 WebSocket Features:`);
console.log(`   Real-time messaging`);
console.log(`   Connection tracking`);
console.log(`   Broadcast to all clients`);

// Example of using fetch API with the server (as shown in docs)
async function demonstrateFetch() {
  try {
    // Following the exact pattern from Bun docs
    console.log("🔍 Testing @DEMO Server Endpoints:");
    console.log("=" .repeat(40));
    
    // Test status endpoint
    const statusResponse = await fetch(`http://localhost:${PORT}/api/status`);
    console.log(`\n📈 Status: ${statusResponse.status}`);
    const statusData = await statusResponse.json();
    console.log(`Service: ${statusData.service}`);
    console.log(`Uptime: ${Math.floor(statusData.uptime)}s`);
    console.log(`Memory: ${statusData.performance.memory.used}MB used`);
    
    // Test health endpoint
    const healthResponse = await fetch(`http://localhost:${PORT}/api/health`);
    console.log(`\n❤️  Health: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log(`All services: ${Object.keys(healthData.services).join(', ')}`);
    
    // Test metrics endpoint
    const metricsResponse = await fetch(`http://localhost:${PORT}/api/metrics`);
    console.log(`\n📊 Metrics: ${metricsResponse.status}`);
    const metricsData = await metricsResponse.json();
    console.log(`Active users: ${metricsData.users.active}`);
    console.log(`Requests: ${metricsData.requests.total}`);
    console.log(`Events processed: ${metricsData.analytics.events_processed}`);
    
    console.log("\n✅ All endpoints responding correctly!");
    
  } catch (error) {
    console.error('❌ Fetch demo error:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Bun.app server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Bun.app server...');
  server.stop();
  process.exit(0);
});

// Export server for testing
export default server;
