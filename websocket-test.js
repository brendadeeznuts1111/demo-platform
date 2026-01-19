#!/usr/bin/env bun

// WebSocket Test Client for @DEMO
// Demonstrates real-time communication features

import { WebSocket } from 'ws';

async function testWebSocketFeatures() {
  console.log("🔌 Testing @DEMO WebSocket Features");
  console.log("=" .repeat(50));
  
  const ws = new WebSocket('ws://localhost:3000/ws');
  
  ws.on('open', () => {
    console.log('✅ Connected to @DEMO WebSocket server');
    
    // Test sending messages
    setTimeout(() => {
      console.log('📤 Sending test message...');
      ws.send(JSON.stringify({
        type: 'test',
        message: 'Hello from WebSocket test client!',
        timestamp: new Date().toISOString()
      }));
    }, 1000);
    
    // Test broadcast API
    setTimeout(async () => {
      console.log('📢 Testing broadcast API...');
      try {
        const broadcastResponse = await fetch('http://localhost:3000/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '🎉 Server broadcast to all clients!'
          })
        });
        
        if (broadcastResponse.ok) {
          const result = await broadcastResponse.json();
          console.log('✅ Broadcast result:', result.message);
        }
      } catch (error) {
        console.error('❌ Broadcast failed:', error.message);
      }
    }, 2000);
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message.type);
      
      switch (message.type) {
        case 'welcome':
          console.log(`👋 Welcome message: ${message.message}`);
          console.log(`👥 Active connections: ${message.connections}`);
          break;
          
        case 'message':
          console.log(`💬 Message from ${message.from}: ${message.data}`);
          break;
          
        case 'broadcast':
          console.log(`📢 Broadcast: ${message.data}`);
          break;
          
        default:
          console.log('📦 Unknown message type:', message);
      }
    } catch (error) {
      console.log('📦 Raw message:', data.toString());
    }
  });
  
  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
  
  // Test real-time metrics
  setTimeout(async () => {
    console.log('\n📊 Testing real-time metrics...');
    try {
      const realtimeResponse = await fetch('http://localhost:3000/api/realtime');
      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json();
        console.log('⚡ Real-time metrics:');
        console.log(`   Connections: ${realtimeData.connections}`);
        console.log(`   Total requests: ${realtimeData.total_requests}`);
        console.log(`   Messages: ${realtimeData.messages}`);
        console.log(`   WebSocket clients: ${realtimeData.websocket_clients}`);
      }
    } catch (error) {
      console.error('❌ Real-time metrics failed:', error.message);
    }
  }, 3000);
  
  // Test system information
  setTimeout(async () => {
    console.log('\n🖥️  Testing system information...');
    try {
      const systemResponse = await fetch('http://localhost:3000/api/system');
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        console.log('🖥️  System info:');
        console.log(`   Runtime: ${systemData.runtime.name} v${systemData.runtime.version}`);
        console.log(`   Platform: ${systemData.runtime.platform} ${systemData.runtime.arch}`);
        console.log(`   Server PID: ${systemData.server.pid}`);
        console.log(`   Uptime: ${Math.floor(systemData.server.uptime)}s`);
      }
    } catch (error) {
      console.error('❌ System info failed:', error.message);
    }
  }, 4000);
  
  // Keep connection open for testing
  setTimeout(() => {
    console.log('\n🏁 WebSocket test completed');
    ws.close();
  }, 10000);
}

// Run the test
if (import.meta.main) {
  console.log('💡 Make sure the @DEMO server is running:');
  console.log('   bun start');
  console.log('');
  
  testWebSocketFeatures().catch(console.error);
}

export { testWebSocketFeatures };
