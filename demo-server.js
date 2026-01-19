#!/usr/bin/env bun

// @DEMO Working Server Demo
// Simple but functional server to showcase the platform

const PORT = process.env.BUN_PORT || process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Metrics tracking
let metrics = {
  requests: 0,
  connections: 0,
  startTime: Date.now()
};

const connections = new Set();

// Simple but functional server
const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  
  websocket: {
    open(ws) {
      connections.add(ws);
      metrics.connections++;
      
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to @DEMO Server',
        timestamp: new Date().toISOString(),
        connections: connections.size
      }));
    },
    
    close(ws) {
      connections.delete(ws);
      metrics.connections--;
    },
    
    message(ws, message) {
      try {
        const messageData = JSON.parse(message.toString());
        
        // Broadcast to all clients
        const broadcast = {
          type: 'message',
          data: messageData,
          timestamp: new Date().toISOString()
        };
        
        connections.forEach(client => {
          client.send(JSON.stringify(broadcast));
        });
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    }
  },
  
  fetch(req) {
    const url = new URL(req.url);
    metrics.requests++;
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(getDemoHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/status':
          return Response.json({
            service: '@DEMO Server',
            status: 'operational',
            version: '2.0.1',
            uptime: process.uptime(),
            requests: metrics.requests,
            connections: connections.size,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
          });
        
        case '/api/health':
          return Response.json({
            status: 'healthy',
            services: {
              server: 'running',
              websocket: 'active'
            },
            uptime: process.uptime()
          });
        
        case '/api/metrics':
          return Response.json({
            requests: metrics.requests,
            connections: connections.size,
            uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
            memory: process.memoryUsage(),
            websocket_clients: connections.size
          });
        
        case '/ws':
          return server.upgrade(req);
        
        case '/docs':
          return Response.json({
            name: '@DEMO Server',
            version: '2.0.1',
            endpoints: ['/api/status', '/api/health', '/api/metrics', '/ws'],
            websocket: 'ws://' + HOSTNAME + ':' + PORT + '/ws'
          });
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
});

console.log(`🚀 @DEMO Server running at ${server.url}`);
console.log(`📊 Status: ${server.url}api/status`);
console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}/ws`);
console.log(`📖 Documentation: ${server.url}docs`);

// Generate demo HTML
function getDemoHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Server Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #3b82f6; }
        .card { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { font-size: 2em; font-weight: bold; color: #22c55e; }
        .status { color: #3b82f6; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
        button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2563eb; }
        #messages { max-height: 300px; overflow-y: auto; background: #1a1a1a; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .message { padding: 5px; border-bottom: 1px solid #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 @DEMO Server Demo</h1>
            <p>Ultra lightweight enterprise platform</p>
        </div>
        
        <div class="card">
            <h3>📊 Server Status</h3>
            <div id="status">Loading...</div>
        </div>
        
        <div class="card">
            <h3>🔌 WebSocket Test</h3>
            <button onclick="sendMessage()">Send Message</button>
            <div id="messages"></div>
        </div>
        
        <div class="card">
            <h3>📈 Features</h3>
            <ul>
                <li> ultra-lightweight (232KB)</li>
                <li> AI-powered analytics</li>
                <li> Enterprise security</li>
                <li> Real-time WebSocket</li>
                <li> Predictive monitoring</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>@DEMO Server v2.0.1 | Enterprise Platform</p>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://${HOSTNAME}:${PORT}/ws');
        const messages = document.getElementById('messages');
        
        ws.onopen = () => {
            addMessage('Connected to @DEMO Server', 'system');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            addMessage(data.message || data.data, data.type);
        };
        
        function addMessage(text, type = 'message') {
            const div = document.createElement('div');
            div.className = 'message';
            div.innerHTML = '<strong>' + type + ':</strong> ' + text;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const message = {
                text: 'Hello from @DEMO!',
                timestamp: new Date().toISOString()
            };
            ws.send(JSON.stringify(message));
        }
        
        // Load server status
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                document.getElementById('status').innerHTML = 
                    '<div class="metric">' + status.requests + '</div> requests<br>' +
                    '<div class="metric">' + status.connections + '</div> connections<br>' +
                    '<div class="status">Uptime: ' + Math.floor(status.uptime) + 's</div>';
            } catch (error) {
                document.getElementById('status').innerHTML = 'Error loading status';
            }
        }
        
        loadStatus();
        setInterval(loadStatus, 5000);
    </script>
</body>
</html>`;
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down @DEMO Server...');
  server.stop();
  process.exit(0);
});

// Server is running - no export needed for direct execution
