#!/usr/bin/env bun

// @DEMO Edge Computing Framework
// Distributed edge computing with intelligent load balancing and edge AI

// Edge Node Management
class EdgeNode {
  constructor(id, location, capabilities = {}) {
    this.id = id;
    this.location = location;
    this.capabilities = {
      cpu: capabilities.cpu || 4,
      memory: capabilities.memory || 8192,
      storage: capabilities.storage || 100,
      gpu: capabilities.gpu || false,
      network: capabilities.network || 'wifi',
      ...capabilities
    };
    
    this.status = 'offline';
    this.load = 0;
    this.temperature = 0;
    this.networkLatency = 0;
    this.processingQueue = [];
    this.aiModels = new Map();
    this.cache = new Map();
    this.metrics = {
      requestsProcessed: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 0,
      lastHeartbeat: Date.now()
    };
    
    this.startTime = Date.now();
  }

  async initialize() {
    console.log(`🔧 Initializing edge node ${this.id} at ${this.location}`);
    
    // Initialize AI models
    await this.initializeAIModels();
    
    // Setup monitoring
    this.setupMonitoring();
    
    // Connect to network
    await this.connectToNetwork();
    
    this.status = 'online';
    console.log(`✅ Edge node ${this.id} is now online`);
  }

  async initializeAIModels() {
    // Load lightweight AI models for edge inference
    const models = [
      { name: 'image_classifier', type: 'cnn', size: '2MB' },
      { name: 'anomaly_detector', type: 'autoencoder', size: '1MB' },
      { name: 'predictor', type: 'lstm', size: '3MB' }
    ];
    
    for (const model of models) {
      this.aiModels.set(model.name, {
        type: model.type,
        size: model.size,
        loaded: true,
        inferenceCount: 0,
        averageInferenceTime: 0
      });
    }
    
    console.log(`🤖 Loaded ${models.length} AI models on edge node ${this.id}`);
  }

  setupMonitoring() {
    // Start monitoring metrics
    setInterval(() => {
      this.updateMetrics();
      this.checkHealth();
    }, 5000);
  }

  updateMetrics() {
    // Simulate metric updates
    this.load = Math.random() * 100;
    this.temperature = 40 + Math.random() * 30;
    this.networkLatency = 10 + Math.random() * 50;
    
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.lastHeartbeat = Date.now();
  }

  checkHealth() {
    if (this.temperature > 80) {
      console.warn(`🌡️ Edge node ${this.id} overheating: ${this.temperature.toFixed(1)}°C`);
      this.throttle();
    }
    
    if (this.load > 90) {
      console.warn(`⚡ Edge node ${this.id} overloaded: ${this.load.toFixed(1)}%`);
      this.scaleUp();
    }
  }

  async connectToNetwork() {
    // Simulate network connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.networkLatency = 10 + Math.random() * 20;
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      // Add to processing queue
      this.processingQueue.push(request);
      
      // Process based on request type
      let result;
      
      switch (request.type) {
        case 'ai_inference':
          result = await this.processAIInference(request);
          break;
        case 'data_processing':
          result = await this.processData(request);
          break;
        case 'cache_lookup':
          result = await this.lookupCache(request.key);
          break;
        case 'stream_processing':
          result = await this.processStream(request);
          break;
        default:
          result = await this.processGeneric(request);
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetricsAfterRequest(responseTime, true);
      
      // Remove from queue
      const index = this.processingQueue.indexOf(request);
      if (index > -1) {
        this.processingQueue.splice(index, 1);
      }
      
      return {
        success: true,
        result,
        processedBy: this.id,
        responseTime,
        location: this.location
      };
      
    } catch (error) {
      this.updateMetricsAfterRequest(Date.now() - startTime, false);
      throw error;
    }
  }

  async processAIInference(request) {
    const model = this.aiModels.get(request.model);
    if (!model) {
      throw new Error(`Model ${request.model} not found on edge node ${this.id}`);
    }
    
    const startTime = Date.now();
    
    // Simulate AI inference
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    const inferenceTime = Date.now() - startTime;
    model.inferenceCount++;
    model.averageInferenceTime = 
      (model.averageInferenceTime * (model.inferenceCount - 1) + inferenceTime) / model.inferenceCount;
    
    // Mock inference result
    return {
      prediction: Math.random(),
      confidence: 0.7 + Math.random() * 0.3,
      inferenceTime,
      model: request.model
    };
  }

  async processData(request) {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 80));
    
    return {
      processed: true,
      recordCount: request.data?.length || 100,
      processedAt: Date.now()
    };
  }

  async lookupCache(key) {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes TTL
      return {
        hit: true,
        data: cached.data,
        age: Date.now() - cached.timestamp
      };
    }
    
    return {
      hit: false,
      key
    };
  }

  async processStream(request) {
    // Simulate stream processing
    const streamData = [];
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      streamData.push({
        timestamp: Date.now(),
        data: Math.random(),
        sequence: i
      });
    }
    
    return {
      streamProcessed: true,
      dataPoints: streamData.length,
      duration: Date.now() - request.startTime
    };
  }

  async processGeneric(request) {
    // Generic request processing
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));
    
    return {
      processed: true,
      type: request.type,
      timestamp: Date.now()
    };
  }

  updateMetricsAfterRequest(responseTime, success) {
    this.metrics.requestsProcessed++;
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.requestsProcessed - 1) + responseTime) / 
      this.metrics.requestsProcessed;
    
    // Update error rate
    if (!success) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.requestsProcessed - 1) + 1) / 
        this.metrics.requestsProcessed;
    } else {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.requestsProcessed - 1)) / 
        this.metrics.requestsProcessed;
    }
  }

  throttle() {
    console.log(`🐌 Throttling edge node ${this.id} due to high temperature`);
    this.status = 'throttled';
  }

  scaleUp() {
    console.log(`📈 Scaling up edge node ${this.id} due to high load`);
    // In a real implementation, this would trigger horizontal scaling
  }

  getHealth() {
    return {
      id: this.id,
      status: this.status,
      location: this.location,
      load: this.load,
      temperature: this.temperature,
      networkLatency: this.networkLatency,
      queueSize: this.processingQueue.length,
      metrics: { ...this.metrics },
      capabilities: { ...this.capabilities }
    };
  }

  cacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Edge Computing Network Manager
class EdgeNetworkManager {
  constructor() {
    this.nodes = new Map();
    this.loadBalancer = new EdgeLoadBalancer();
    this.distributedCache = new DistributedCache();
    this.serviceMesh = new ServiceMesh();
    this.monitoring = new EdgeMonitoring();
    
    this.config = {
      maxNodes: 50,
      healthCheckInterval: 10000,
      autoScaling: true,
      faultTolerance: true,
      geoReplication: true
    };
    
    this.initializeNetwork();
  }

  async initializeNetwork() {
    console.log('🌐 Initializing Edge Computing Network...');
    
    // Create edge nodes in different geographic locations
    const locations = [
      { id: 'edge-us-east-1', location: 'US East', region: 'us-east-1' },
      { id: 'edge-us-west-1', location: 'US West', region: 'us-west-1' },
      { id: 'edge-eu-west-1', location: 'EU West', region: 'eu-west-1' },
      { id: 'edge-ap-southeast-1', location: 'Asia Pacific', region: 'ap-southeast-1' }
    ];
    
    for (const loc of locations) {
      const node = new EdgeNode(loc.id, loc.location, {
        cpu: 4 + Math.floor(Math.random() * 4),
        memory: 8192 + Math.floor(Math.random() * 8192),
        storage: 100 + Math.floor(Math.random() * 100),
        gpu: Math.random() > 0.5
      });
      
      await node.initialize();
      this.nodes.set(loc.id, node);
    }
    
    // Setup load balancer
    this.loadBalancer.setNodes(Array.from(this.nodes.values()));
    
    // Start monitoring
    this.startMonitoring();
    
    console.log(`✅ Edge network initialized with ${this.nodes.size} nodes`);
  }

  startMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
      this.optimizeRouting();
      this.handleFailures();
    }, this.config.healthCheckInterval);
  }

  performHealthChecks() {
    for (const [id, node] of this.nodes) {
      const health = node.getHealth();
      
      if (health.status === 'offline' || health.temperature > 85) {
        console.warn(`⚠️ Edge node ${id} unhealthy: ${health.status}`);
        this.loadBalancer.removeNode(node);
      } else if (health.status === 'throttled' && health.temperature < 70) {
        console.log(`✅ Edge node ${id} recovered`);
        node.status = 'online';
        this.loadBalancer.addNode(node);
      }
    }
  }

  optimizeRouting() {
    // Optimize routing based on latency and load
    this.loadBalancer.optimizeRouting();
  }

  handleFailures() {
    // Handle node failures with automatic failover
    const failedNodes = Array.from(this.nodes.values())
      .filter(node => node.status === 'offline');
    
    if (failedNodes.length > 0) {
      console.log(`🔧 Handling ${failedNodes.length} node failures`);
      this.triggerFailover(failedNodes);
    }
  }

  triggerFailover(failedNodes) {
    // Implement failover logic
    for (const node of failedNodes) {
      // Redistribute load to healthy nodes
      this.redistributeLoad(node);
    }
  }

  redistributeLoad(failedNode) {
    // Redistribute load from failed node to healthy nodes
    const healthyNodes = Array.from(this.nodes.values())
      .filter(node => node.status === 'online' && node.id !== failedNode.id);
    
    console.log(`🔄 Redistributing load from ${failedNode.id} to ${healthyNodes.length} healthy nodes`);
  }

  async routeRequest(request) {
    // Route request to optimal edge node
    const optimalNode = this.loadBalancer.selectNode(request);
    
    if (!optimalNode) {
      throw new Error('No available edge nodes');
    }
    
    try {
      const result = await optimalNode.processRequest(request);
      return result;
    } catch (error) {
      // Fallback to another node
      const fallbackNode = this.loadBalancer.selectFallbackNode(request);
      if (fallbackNode) {
        console.log(`🔄 Falling back to node ${fallbackNode.id}`);
        return await fallbackNode.processRequest(request);
      }
      throw error;
    }
  }

  addNode(location, capabilities) {
    const id = `edge-${Date.now()}`;
    const node = new EdgeNode(id, location, capabilities);
    
    node.initialize().then(() => {
      this.nodes.set(id, node);
      this.loadBalancer.addNode(node);
      console.log(`➕ Added edge node ${id} at ${location}`);
    });
    
    return id;
  }

  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.loadBalancer.removeNode(node);
      this.nodes.delete(nodeId);
      console.log(`➖ Removed edge node ${nodeId}`);
    }
  }

  getNetworkStatus() {
    const nodes = Array.from(this.nodes.values());
    
    return {
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(n => n.status === 'online').length,
      offlineNodes: nodes.filter(n => n.status === 'offline').length,
      throttledNodes: nodes.filter(n => n.status === 'throttled').length,
      averageLoad: nodes.reduce((sum, n) => sum + n.load, 0) / nodes.length,
      averageTemperature: nodes.reduce((sum, n) => sum + n.temperature, 0) / nodes.length,
      totalRequests: nodes.reduce((sum, n) => sum + n.metrics.requestsProcessed, 0),
      averageResponseTime: nodes.reduce((sum, n) => sum + n.metrics.averageResponseTime, 0) / nodes.length,
      globalCacheSize: this.distributedCache.getSize()
    };
  }

  getDetailedNodeStatus() {
    return Array.from(this.nodes.values()).map(node => node.getHealth());
  }
}

// Edge Load Balancer
class EdgeLoadBalancer {
  constructor() {
    this.nodes = [];
    this.algorithm = 'weighted_round_robin';
    this.currentNode = 0;
    this.weights = new Map();
  }

  setNodes(nodes) {
    this.nodes = nodes;
    this.calculateWeights();
  }

  addNode(node) {
    if (!this.nodes.find(n => n.id === node.id)) {
      this.nodes.push(node);
      this.calculateWeights();
    }
  }

  removeNode(node) {
    this.nodes = this.nodes.filter(n => n.id !== node.id);
    this.calculateWeights();
  }

  calculateWeights() {
    // Calculate weights based on node capabilities and current load
    this.weights.clear();
    
    for (const node of this.nodes) {
      let weight = 1;
      
      // Weight by CPU
      weight += node.capabilities.cpu * 0.3;
      
      // Weight by memory
      weight += (node.capabilities.memory / 1024) * 0.2;
      
      // Weight by GPU availability
      if (node.capabilities.gpu) {
        weight += 2;
      }
      
      // Weight by current load (inverse)
      weight *= (1 - node.load / 100);
      
      // Weight by network quality (inverse latency)
      weight *= (1 / (1 + node.networkLatency / 100));
      
      this.weights.set(node.id, Math.max(weight, 0.1));
    }
  }

  selectNode(request) {
    if (this.nodes.length === 0) {
      return null;
    }
    
    switch (this.algorithm) {
      case 'round_robin':
        return this.roundRobinSelect();
      case 'weighted_round_robin':
        return this.weightedRoundRobinSelect();
      case 'least_connections':
        return this.leastConnectionsSelect();
      case 'geographic':
        return this.geographicSelect(request);
      default:
        return this.roundRobinSelect();
    }
  }

  roundRobinSelect() {
    const node = this.nodes[this.currentNode];
    this.currentNode = (this.currentNode + 1) % this.nodes.length;
    return node;
  }

  weightedRoundRobinSelect() {
    const totalWeight = Array.from(this.weights.values()).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of this.nodes) {
      random -= this.weights.get(node.id);
      if (random <= 0) {
        return node;
      }
    }
    
    return this.nodes[0];
  }

  leastConnectionsSelect() {
    return this.nodes.reduce((min, node) => 
      node.processingQueue.length < min.processingQueue.length ? node : min
    );
  }

  geographicSelect(request) {
    // Select node closest to request origin
    if (request.location) {
      const closest = this.nodes.reduce((closest, node) => {
        const distance = this.calculateDistance(request.location, node.location);
        const closestDistance = this.calculateDistance(request.location, closest.location);
        return distance < closestDistance ? node : closest;
      });
      
      return closest;
    }
    
    return this.roundRobinSelect();
  }

  calculateDistance(loc1, loc2) {
    // Simplified distance calculation
    return Math.abs(loc1.lat - loc2.lat) + Math.abs(loc1.lon - loc2.lon);
  }

  selectFallbackNode(request) {
    // Select a different node for fallback
    const availableNodes = this.nodes.filter(n => n.status === 'online');
    if (availableNodes.length > 0) {
      return availableNodes[Math.floor(Math.random() * availableNodes.length)];
    }
    return null;
  }

  optimizeRouting() {
    this.calculateWeights();
  }
}

// Distributed Cache
class DistributedCache {
  constructor() {
    this.cache = new Map();
    this.nodes = new Map();
    this.replicationFactor = 3;
    this.consistency = 'eventual';
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl = 300000) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  getSize() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}

// Service Mesh
class ServiceMesh {
  constructor() {
    this.services = new Map();
    this.routes = new Map();
    this.policies = new Map();
  }

  registerService(name, endpoint, healthCheck) {
    this.services.set(name, {
      endpoint,
      healthCheck,
      status: 'healthy',
      lastCheck: Date.now()
    });
  }

  discoverService(name) {
    return this.services.get(name);
  }

  createRoute(from, to, policy) {
    this.routes.set(`${from}->${to}`, {
      from,
      to,
      policy,
      created: Date.now()
    });
  }
}

// Edge Monitoring
class EdgeMonitoring {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.dashboard = null;
  }

  collectMetrics(nodeId, metrics) {
    this.metrics.set(nodeId, {
      ...metrics,
      timestamp: Date.now()
    });
  }

  createAlert(severity, message, node) {
    const alert = {
      id: `alert_${Date.now()}`,
      severity,
      message,
      node,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    console.log(`🚨 ${severity.toUpperCase()} Alert: ${message} (Node: ${node})`);
  }

  getMetrics(nodeId) {
    return this.metrics.get(nodeId);
  }

  getAlerts(severity) {
    return severity ? 
      this.alerts.filter(a => a.severity === severity) : 
      this.alerts;
  }
}

// Edge Computing Server
class EdgeComputingServer {
  constructor(port = 3003) {
    this.port = port;
    this.network = new EdgeNetworkManager();
    this.server = null;
  }

  start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });
    
    console.log(`🌐 Edge Computing Server running at http://localhost:${this.port}`);
  }

  async handleRequest(req) {
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(this.getEdgeHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/edge/status':
          const status = this.network.getNetworkStatus();
          return Response.json(status);
        
        case '/api/edge/nodes':
          const nodes = this.network.getDetailedNodeStatus();
          return Response.json(nodes);
        
        case '/api/edge/process':
          if (req.method === 'POST') {
            const request = await req.json();
            const result = await this.network.routeRequest(request);
            return Response.json(result);
          }
          break;
        
        case '/api/edge/add-node':
          if (req.method === 'POST') {
            const nodeConfig = await req.json();
            const nodeId = this.network.addNode(nodeConfig.location, nodeConfig.capabilities);
            return Response.json({ success: true, nodeId });
          }
          break;
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Edge computing error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  getEdgeHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Edge Computing Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; color: #10b981; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .card h3 { color: #10b981; margin-top: 0; }
        .metric { font-size: 2em; font-weight: bold; color: #34d399; margin: 10px 0; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.9em; }
        .status.online { background: #22c55e; color: white; }
        .status.offline { background: #ef4444; color: white; }
        .status.throttled { background: #f59e0b; color: white; }
        .node-list { max-height: 300px; overflow-y: auto; }
        .node-item { background: #334155; padding: 10px; margin: 5px 0; border-radius: 6px; }
        .button { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 5px; }
        .button:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Edge Computing Dashboard</h1>
            <p>Distributed edge computing with intelligent load balancing</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Network Status</h3>
                <div class="metric" id="total-nodes">--</div>
                <div>Total Edge Nodes</div>
                <div class="metric" id="online-nodes">--</div>
                <div>Online Nodes</div>
            </div>
            
            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric" id="avg-load">--</div>
                <div>Average Load</div>
                <div class="metric" id="avg-response">--</div>
                <div>Avg Response Time</div>
            </div>
            
            <div class="card">
                <h3>🌡️ System Health</h3>
                <div class="metric" id="avg-temp">--</div>
                <div>Average Temperature</div>
                <div class="metric" id="total-requests">--</div>
                <div>Total Requests</div>
            </div>
            
            <div class="card">
                <h3>🗺️ Node Distribution</h3>
                <div class="node-list" id="node-list"></div>
            </div>
        </div>
        
        <div class="card">
            <h3>🎮 Edge Controls</h3>
            <button class="button" onclick="refreshStatus()">🔄 Refresh Status</button>
            <button class="button" onclick="addNode()">➕ Add Node</button>
            <button class="button" onclick="testEdgeProcessing()">🧪 Test Processing</button>
        </div>
    </div>
    
    <script>
        let edgeData = null;
        
        async function loadStatus() {
            try {
                const response = await fetch('/api/edge/status');
                edgeData = await response.json();
                updateDashboard();
            } catch (error) {
                console.error('Failed to load edge status:', error);
            }
        }
        
        function updateDashboard() {
            if (!edgeData) return;
            
            document.getElementById('total-nodes').textContent = edgeData.totalNodes;
            document.getElementById('online-nodes').textContent = edgeData.onlineNodes;
            document.getElementById('avg-load').textContent = edgeData.averageLoad.toFixed(1) + '%';
            document.getElementById('avg-response').textContent = edgeData.averageResponseTime.toFixed(0) + 'ms';
            document.getElementById('avg-temp').textContent = edgeData.averageTemperature.toFixed(1) + '°C';
            document.getElementById('total-requests').textContent = edgeData.totalRequests;
        }
        
        async function loadNodes() {
            try {
                const response = await fetch('/api/edge/nodes');
                const nodes = await response.json();
                
                const nodeList = document.getElementById('node-list');
                nodeList.innerHTML = nodes.map(node => \`
                    <div class="node-item">
                        <strong>\${node.id}</strong>
                        <span class="status \${node.status}">\${node.status}</span>
                        <div>Location: \${node.location}</div>
                        <div>Load: \${node.load.toFixed(1)}% | Temp: \${node.temperature.toFixed(1)}°C</div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Failed to load nodes:', error);
            }
        }
        
        function refreshStatus() {
            loadStatus();
            loadNodes();
        }
        
        async function addNode() {
            try {
                const response = await fetch('/api/edge/add-node', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: 'New Region',
                        capabilities: { cpu: 4, memory: 8192, storage: 100 }
                    })
                });
                const result = await response.json();
                alert(\`Node added: \${result.nodeId}\`);
                refreshStatus();
            } catch (error) {
                alert('Failed to add node');
            }
        }
        
        async function testEdgeProcessing() {
            try {
                const response = await fetch('/api/edge/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'ai_inference',
                        model: 'image_classifier',
                        data: [1, 2, 3, 4, 5]
                    })
                });
                const result = await response.json();
                alert(\`Processed by: \${result.processedBy} in \${result.responseTime}ms\`);
            } catch (error) {
                alert('Processing test failed');
            }
        }
        
        // Load data on page load
        loadStatus();
        loadNodes();
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            loadStatus();
            loadNodes();
        }, 10000);
    </script>
</body>
</html>`;
  }

  stop() {
    if (this.server) {
      this.server.stop();
    }
  }
}

// Demo and testing
class EdgeComputingDemo {
  static async runDemo() {
    console.log('🌐 Running Edge Computing Demo...');
    
    const network = new EdgeNetworkManager();
    
    // Wait for network initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test edge processing
    const testRequest = {
      type: 'ai_inference',
      model: 'image_classifier',
      data: [1, 2, 3, 4, 5],
      location: { lat: 40.7128, lon: -74.0060 }
    };
    
    const result = await network.routeRequest(testRequest);
    console.log('✅ Edge processing result:', result);
    
    // Get network status
    const status = network.getNetworkStatus();
    console.log('📊 Network status:', status);
    
    return {
      network,
      testResult: result,
      status
    };
  }
}

export {
  EdgeNode,
  EdgeNetworkManager,
  EdgeLoadBalancer,
  EdgeComputingServer,
  EdgeComputingDemo
};

export default {
  EdgeNode,
  EdgeNetworkManager,
  EdgeLoadBalancer,
  EdgeComputingServer,
  EdgeComputingDemo
};
