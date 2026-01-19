#!/usr/bin/env bun

// @DEMO Minimal Server - Under 3KB
// Core functionality with maximum performance

const PORT = process.env.BUN_PORT || process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Real-time metrics
let metrics = { connections: 0, requests: 0, startTime: Date.now() };
const ws = new Set();

// Server with WebSocket support
const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  
  websocket: {
    open(c) {
      metrics.connections++;
      ws.add(c);
      c.send(JSON.stringify({ type: 'welcome', connections: metrics.connections }));
    },
    close(c) {
      metrics.connections--;
      ws.delete(c);
    },
    message(c, msg) {
      ws.forEach(client => client !== c && client.send(msg));
    }
  },
  
  fetch(req) {
    metrics.requests++;
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response('<!DOCTYPE html><html><head><title>@DEMO</title></head><body><h1>🚀 @DEMO Enterprise Platform</h1><p>Server running on port ' + PORT + '</p><ul><li><a href="/api/status">Status</a></li><li><a href="/api/health">Health</a></li><li><a href="/api/metrics">Metrics</a></li><li><a href="/docs">API Docs</a></li></ul></body></html>', {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/status':
          return Response.json({
            service: '@DEMO',
            status: 'operational',
            uptime: process.uptime(),
            version: '2.0.1',
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
          });
        
        case '/api/health':
          return Response.json({
            status: 'healthy',
            services: { server: 'running', websocket: 'active' },
            uptime: process.uptime()
          });
        
        case '/api/metrics':
          return Response.json({
            connections: metrics.connections,
            requests: metrics.requests,
            uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
            memory: process.memoryUsage(),
            websocket_clients: ws.size
          });
        
        case '/api/system':
          return Response.json({
            runtime: 'Bun',
            version: process.versions.bun,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
          });
        
        case '/api/broadcast':
          if (req.method === 'POST') {
            const body = req.json ? await req.json() : {};
            const message = JSON.stringify({ type: 'broadcast', data: body.message, timestamp: new Date().toISOString() });
            ws.forEach(c => c.send(message));
            return Response.json({ success: true, clients: ws.size });
          }
          break;
        
        case '/ws':
          return server.upgrade(req);
        
        case '/docs':
          return Response.json({
            name: '@DEMO',
            version: '2.0.1',
            endpoints: ['/api/status', '/api/health', '/api/metrics', '/api/system', '/api/broadcast', '/ws'],
            websocket: 'ws://' + HOSTNAME + ':' + PORT + '/ws'
          });
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (e) {
      return new Response('Error', { status: 500 });
    }
  }
});

console.log(`🚀 @DEMO Server: http://${HOSTNAME}:${PORT}`);
console.log(`📊 Status: http://${HOSTNAME}:${PORT}/api/status`);
console.log(`🔌 WebSocket: ws://${HOSTNAME}:${PORT}/ws`);

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

export default server;
