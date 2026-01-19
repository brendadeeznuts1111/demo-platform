#!/usr/bin/env bun

// @DEMO Real-time Monitoring Dashboard
// Live system monitoring with WebSocket updates

const PORT = process.env.MONITOR_PORT || 3001;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// System metrics storage
let systemMetrics = {
  cpu: 0,
  memory: 0,
  connections: 0,
  requests: 0,
  uptime: 0,
  startTime: Date.now()
};

const connections = new Set();

// Create monitoring server
const monitor = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  
  websocket: {
    open(ws) {
      connections.add(ws);
      console.log(`📊 Monitor client connected. Total: ${connections.size}`);
      
      // Send initial metrics
      ws.send(JSON.stringify({
        type: 'metrics',
        data: systemMetrics,
        timestamp: new Date().toISOString()
      }));
    },
    
    close(ws) {
      connections.delete(ws);
      console.log(`📊 Monitor client disconnected. Total: ${connections.size}`);
    },
    
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'get_metrics') {
          ws.send(JSON.stringify({
            type: 'metrics',
            data: systemMetrics,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Monitor message error:', error);
      }
    }
  },
  
  fetch(req) {
    const url = new URL(req.url);
    
    switch (url.pathname) {
      case '/':
        return new Response(getMonitoringHTML(), {
          headers: { 'Content-Type': 'text/html' }
        });
      
      case '/api/metrics':
        return Response.json({
          ...systemMetrics,
          timestamp: new Date().toISOString(),
          connections: connections.size,
          server_uptime: Math.floor((Date.now() - systemMetrics.startTime) / 1000)
        });
      
      case '/api/system':
        return Response.json({
          platform: process.platform,
          arch: process.arch,
          node_version: process.version,
          bun_version: process.versions.bun,
          pid: process.pid,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        });
      
      case '/ws':
        return monitor.upgrade(req);
      
      default:
        return new Response('404 - Not Found', { status: 404 });
    }
  }
});

// Update metrics every second
setInterval(() => {
  const memUsage = process.memoryUsage();
  systemMetrics = {
    cpu: Math.random() * 100, // Simulated CPU usage
    memory: Math.round(memUsage.heapUsed / 1024 / 1024),
    connections: connections.size,
    requests: systemMetrics.requests + Math.floor(Math.random() * 5),
    uptime: process.uptime(),
    startTime: systemMetrics.startTime
  };
  
  // Broadcast to all connected clients
  const message = JSON.stringify({
    type: 'metrics_update',
    data: systemMetrics,
    timestamp: new Date().toISOString()
  });
  
  connections.forEach(ws => {
    try {
      ws.send(message);
    } catch (error) {
      connections.delete(ws);
    }
  });
}, 1000);

console.log(`📊 @DEMO Monitoring Dashboard: http://${HOSTNAME}:${PORT}`);
console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}/ws`);
console.log(`📈 Metrics API: http://${HOSTNAME}:${PORT}/api/metrics`);

// Generate monitoring HTML
function getMonitoringHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a1a; color: #fff; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric-card { background: #2a2a2a; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
        .metric-label { color: #999; margin-top: 5px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        .status.online { background: #22c55e; color: white; }
        .chart { height: 100px; background: #333; border-radius: 4px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 @DEMO Monitoring Dashboard</h1>
        <p>Real-time system monitoring and metrics</p>
        <span class="status online" id="status">● ONLINE</span>
    </div>
    
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value" id="cpu">0%</div>
            <div class="metric-label">CPU Usage</div>
            <div class="chart" id="cpu-chart"></div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="memory">0MB</div>
            <div class="metric-label">Memory Usage</div>
            <div class="chart" id="memory-chart"></div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="connections">0</div>
            <div class="metric-label">Active Connections</div>
            <div class="chart" id="connections-chart"></div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="requests">0</div>
            <div class="metric-label">Total Requests</div>
            <div class="chart" id="requests-chart"></div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="uptime">0s</div>
            <div class="metric-label">Server Uptime</div>
            <div class="chart" id="uptime-chart"></div>
        </div>
        
        <div class="metric-card">
            <div class="metric-value" id="timestamp">--:--:--</div>
            <div class="metric-label">Last Update</div>
            <div class="chart" id="time-chart"></div>
        </div>
    </div>
    
    <div class="footer">
        <p>@DEMO Monitoring Dashboard v2.0.1 | WebSocket: ws://${HOSTNAME}:${PORT}/ws</p>
    </div>
    
    <script>
        const ws = new WebSocket('ws://${HOSTNAME}:${PORT}/ws');
        const cpuHistory = [];
        const memoryHistory = [];
        
        ws.onopen = () => {
            document.getElementById('status').textContent = '● CONNECTED';
            document.getElementById('status').className = 'status online';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'metrics' || data.type === 'metrics_update') {
                updateMetrics(data.data);
            }
        };
        
        ws.onclose = () => {
            document.getElementById('status').textContent = '● DISCONNECTED';
            document.getElementById('status').className = 'status';
        };
        
        function updateMetrics(metrics) {
            document.getElementById('cpu').textContent = Math.round(metrics.cpu) + '%';
            document.getElementById('memory').textContent = metrics.memory + 'MB';
            document.getElementById('connections').textContent = metrics.connections;
            document.getElementById('requests').textContent = metrics.requests;
            document.getElementById('uptime').textContent = Math.floor(metrics.uptime) + 's';
            
            const now = new Date();
            document.getElementById('timestamp').textContent = 
                now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0') + ':' + 
                now.getSeconds().toString().padStart(2, '0');
            
            // Update charts (simplified)
            cpuHistory.push(metrics.cpu);
            if (cpuHistory.length > 20) cpuHistory.shift();
            
            memoryHistory.push(metrics.memory);
            if (memoryHistory.length > 20) memoryHistory.shift();
        }
        
        // Request initial metrics
        ws.send(JSON.stringify({ type: 'get_metrics' }));
    </script>
</body>
</html>`;
}

process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

export default monitor;
