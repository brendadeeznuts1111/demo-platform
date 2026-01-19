#!/usr/bin/env bun

// @DEMO Distributed Systems Integration
// Complete integration of edge computing, microservices, AI, blockchain, and quantum systems

import { EdgeNetworkManager, EdgeComputingServer } from './edge-computing.js';
import { MicroservicesServer, ServiceRegistry } from './microservices-orchestration.js';
import { AIAnalyticsDashboard } from './ai-analytics-dashboard.js';
import { BlockchainServer } from './blockchain-integration.js';
import { QuantumAlgorithms } from './quantum-computing.js';

// Distributed Systems Orchestrator
class DistributedSystemsOrchestrator {
  constructor() {
    this.components = new Map();
    this.services = new Map();
    this.dataFlows = new Map();
    this.consensus = new ConsensusManager();
    this.distributedCache = new DistributedCache();
    this.serviceMesh = new AdvancedServiceMesh();
    
    this.config = {
      replicationFactor: 3,
      consistencyLevel: 'eventual',
      faultTolerance: true,
      autoScaling: true,
      geoDistribution: true
    };
    
    this.initializeDistributedSystems();
  }

  async initializeDistributedSystems() {
    console.log('🌐 Initializing Distributed Systems Integration...');
    
    // Initialize Edge Computing
    this.components.set('edge', new EdgeNetworkManager());
    
    // Initialize Microservices
    this.components.set('microservices', new MicroservicesServer(3005));
    
    // Initialize AI Analytics
    this.components.set('analytics', new AIAnalyticsDashboard());
    
    // Initialize Blockchain
    this.components.set('blockchain', new BlockchainServer(3006));
    
    // Initialize Quantum Computing
    this.components.set('quantum', QuantumAlgorithms);
    
    // Setup inter-component communication
    this.setupInterComponentCommunication();
    
    // Initialize distributed consensus
    await this.consensus.initialize();
    
    console.log('✅ Distributed Systems Integration initialized');
  }

  setupInterComponentCommunication() {
    // Setup service discovery across all components
    const serviceRegistry = new ServiceRegistry();
    
    // Register all services
    this.registerServices(serviceRegistry);
    
    // Setup data flows between components
    this.setupDataFlows();
  }

  registerServices(serviceRegistry) {
    // Edge computing services
    serviceRegistry.registerService({
      name: 'edge-computing',
      id: 'edge-1',
      host: 'localhost',
      port: 3003,
      metadata: { type: 'edge', capabilities: ['ai_inference', 'data_processing'] }
    });
    
    // Microservices services
    serviceRegistry.registerService({
      name: 'microservices',
      id: 'micro-1',
      host: 'localhost',
      port: 3005,
      metadata: { type: 'orchestration', capabilities: ['service_discovery', 'load_balancing'] }
    });
    
    // AI Analytics services
    serviceRegistry.registerService({
      name: 'ai-analytics',
      id: 'ai-1',
      host: 'localhost',
      port: 3002,
      metadata: { type: 'analytics', capabilities: ['ml', 'prediction', 'anomaly_detection'] }
    });
    
    // Blockchain services
    serviceRegistry.registerService({
      name: 'blockchain',
      id: 'blockchain-1',
      host: 'localhost',
      port: 3006,
      metadata: { type: 'blockchain', capabilities: ['smart_contracts', 'transactions'] }
    });
    
    this.services.set('registry', serviceRegistry);
  }

  setupDataFlows() {
    // Edge -> Analytics: Real-time data processing
    this.dataFlows.set('edge-to-analytics', {
      source: 'edge',
      target: 'analytics',
      type: 'stream',
      protocol: 'websocket',
      transformation: 'normalize_metrics'
    });
    
    // Analytics -> Blockchain: Store insights
    this.dataFlows.set('analytics-to-blockchain', {
      source: 'analytics',
      target: 'blockchain',
      type: 'batch',
      protocol: 'http',
      transformation: 'hash_insights'
    });
    
    // Blockchain -> Edge: Distribute smart contracts
    this.dataFlows.set('blockchain-to-edge', {
      source: 'blockchain',
      target: 'edge',
      type: 'event',
      protocol: 'websocket',
      transformation: 'contract_abstraction'
    });
    
    // Quantum -> Analytics: Quantum-enhanced predictions
    this.dataFlows.set('quantum-to-analytics', {
      source: 'quantum',
      target: 'analytics',
      type: 'rpc',
      protocol: 'http',
      transformation: 'quantum_results'
    });
  }

  async processDistributedRequest(request) {
    console.log(`🔄 Processing distributed request: ${request.type}`);
    
    try {
      // Route request through service mesh
      const route = this.serviceMesh.route(request);
      
      // Apply distributed consensus if needed
      if (request.requiresConsensus) {
        const consensus = await this.consensus.achieveConsensus(request);
        if (!consensus.agreed) {
          throw new Error('Consensus not reached');
        }
      }
      
      // Execute across multiple components
      const results = await this.executeAcrossComponents(request, route);
      
      // Aggregate results
      const aggregated = await this.aggregateResults(results, request.aggregation);
      
      // Store in distributed cache
      this.distributedCache.set(request.id, aggregated);
      
      return {
        success: true,
        requestId: request.id,
        results: aggregated,
        components: route.components,
        consensus: request.requiresConsensus,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('Distributed request failed:', error);
      throw error;
    }
  }

  async executeAcrossComponents(request, route) {
    const results = new Map();
    
    // Execute in parallel across components
    const promises = route.components.map(async component => {
      const componentInstance = this.components.get(component);
      
      if (!componentInstance) {
        throw new Error(`Component ${component} not found`);
      }
      
      try {
        const result = await this.executeOnComponent(componentInstance, request, component);
        results.set(component, result);
      } catch (error) {
        console.error(`Component ${component} failed:`, error);
        results.set(component, { error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    return results;
  }

  async executeOnComponent(component, request, componentName) {
    switch (componentName) {
      case 'edge':
        return await this.executeOnEdge(component, request);
      case 'analytics':
        return await this.executeOnAnalytics(component, request);
      case 'blockchain':
        return await this.executeOnBlockchain(component, request);
      case 'quantum':
        return await this.executeOnQuantum(component, request);
      case 'microservices':
        return await this.executeOnMicroservices(component, request);
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }

  async executeOnEdge(edgeNetwork, request) {
    if (request.type === 'data_processing') {
      const edgeNode = edgeNetwork.nodes.values().next().value;
      return await edgeNode.processRequest({
        type: 'ai_inference',
        model: 'anomaly_detector',
        data: request.data
      });
    }
    
    return { status: 'processed', component: 'edge' };
  }

  async executeOnAnalytics(analytics, request) {
    if (request.type === 'prediction') {
      return await analytics.runPredictiveAnalysis('cpu', 3600000);
    }
    
    return analytics.generateReport();
  }

  async executeOnBlockchain(blockchain, request) {
    if (request.type === 'transaction') {
      return await blockchain.createTransaction(
        request.from,
        request.to,
        request.amount,
        request.type
      );
    }
    
    return blockchain.getBlockchainInfo();
  }

  async executeOnQuantum(quantum, request) {
    if (request.type === 'grover_search') {
      return quantum.groverSearch(
        request.items,
        request.target,
        request.iterations
      );
    }
    
    if (request.type === 'shor_algorithm') {
      return quantum.shorAlgorithm(request.N, request.a);
    }
    
    return { status: 'quantum_ready', algorithms: ['grover', 'shor', 'qft'] };
  }

  async executeOnMicroservices(microservices, request) {
    return microservices.getOrchestrationStatus();
  }

  async aggregateResults(results, aggregationType) {
    switch (aggregationType) {
      case 'merge':
        return this.mergeResults(results);
      case 'consensus':
        return this.consensusAggregate(results);
      case 'priority':
        return this.priorityAggregate(results);
      default:
        return Object.fromEntries(results);
    }
  }

  mergeResults(results) {
    const merged = {};
    
    for (const [component, result] of results) {
      if (result.error) {
        merged[`${component}_error`] = result.error;
      } else {
        Object.assign(merged, result);
      }
    }
    
    return merged;
  }

  consensusAggregate(results) {
    // Simple majority consensus
    const votes = Array.from(results.values());
    const agree = votes.filter(v => !v.error).length;
    const total = votes.length;
    
    return {
      consensus: agree > total / 2,
      agree: agree,
      total: total,
      percentage: (agree / total) * 100
    };
  }

  priorityAggregate(results) {
    // Priority-based aggregation (edge > analytics > blockchain > quantum)
    const priority = ['edge', 'analytics', 'blockchain', 'quantum', 'microservices'];
    
    for (const component of priority) {
      const result = results.get(component);
      if (result && !result.error) {
        return {
          primary: result,
          component: component,
          others: Object.fromEntries(results)
        };
      }
    }
    
    return { error: 'All components failed' };
  }

  getSystemStatus() {
    const status = {
      components: {},
      services: {},
      dataFlows: {},
      consensus: this.consensus.getStatus(),
      cache: this.distributedCache.getStats(),
      mesh: this.serviceMesh.getStatus()
    };
    
    // Component status
    for (const [name, component] of this.components) {
      status.components[name] = {
        status: 'running',
        type: this.getComponentType(name)
      };
    }
    
    // Service status
    if (this.services.has('registry')) {
      status.services = this.services.get('registry').getServiceStatus();
    }
    
    // Data flow status
    for (const [name, flow] of this.dataFlows) {
      status.dataFlows[name] = {
        source: flow.source,
        target: flow.target,
        type: flow.type,
        status: 'active'
      };
    }
    
    return status;
  }

  getComponentType(name) {
    const types = {
      'edge': 'edge_comifuting',
      'analytics': 'ai_analytics',
      'blockchain': 'blockchain',
      'quantum': 'quantum_computing',
      'microservices': 'microservices'
    };
    
    return types[name] || 'unknown';
  }
}

// Advanced Service Mesh
class AdvancedServiceMesh {
  constructor() {
    this.services = new Map();
    this.connections = new Map();
    this.policies = new Map();
    this.observability = new DistributedObservability();
    this.loadBalancer = new IntelligentLoadBalancer();
  }

  addService(service) {
    this.services.set(service.name, service);
    this.observability.registerService(service.name);
  }

  createConnection(from, to, config) {
    const connection = {
      from,
      to,
      config,
      metrics: {
        requests: 0,
        errors: 0,
        latency: []
      },
      status: 'active'
    };
    
    this.connections.set(`${from}->${to}`, connection);
    return connection;
  }

  route(request) {
    const route = this.calculateOptimalRoute(request);
    this.observability.recordRoute(request, route);
    return route;
  }

  calculateOptimalRoute(request) {
    // Intelligent routing based on:
    // 1. Service health
    // 2. Network latency
    // 3. Load balancing
    // 4. Policies
    
    const availableServices = Array.from(this.services.values())
      .filter(service => service.status === 'healthy');
    
    const optimal = this.loadBalancer.select(availableServices, request);
    
    return {
      components: [optimal.name],
      primary: optimal.name,
      estimatedLatency: optimal.latency,
      confidence: 0.85
    };
  }

  getStatus() {
    return {
      totalServices: this.services.size,
      activeConnections: Array.from(this.connections.values()).filter(c => c.status === 'active').length,
      policies: this.policies.size,
      observability: this.observability.getStats()
    };
  }
}

// Consensus Manager
class ConsensusManager {
  constructor() {
    this.nodes = new Map();
    this.proposals = new Map();
    this.votes = new Map();
    this.currentRound = 0;
    
    this.config = {
      algorithm: 'raft',
      timeout: 5000,
      requiredVotes: 3
    };
  }

  async initialize() {
    console.log('🗳️ Initializing distributed consensus system...');
    
    // Initialize consensus nodes
    for (let i = 0; i < 5; i++) {
      this.nodes.set(`node-${i}`, {
        id: `node-${i}`,
        status: 'active',
        term: 0,
        votedFor: null
      });
    }
    
    console.log('✅ Consensus system initialized');
  }

  async achieveConsensus(proposal) {
    const proposalId = `proposal-${Date.now()}`;
    
    // Create proposal
    this.proposals.set(proposalId, {
      id: proposalId,
      data: proposal,
      round: this.currentRound++,
      status: 'pending'
    });
    
    // Collect votes
    const votes = await this.collectVotes(proposalId);
    
    // Check if consensus reached
    const agreed = votes.filter(v => v.vote).length >= this.config.requiredVotes;
    
    this.proposals.get(proposalId).status = agreed ? 'agreed' : 'rejected';
    
    return {
      proposalId,
      agreed,
      votes: votes.length,
      round: this.currentRound - 1
    };
  }

  async collectVotes(proposalId) {
    const votes = [];
    
    for (const [nodeId, node] of this.nodes) {
      if (node.status === 'active') {
        // Simulate voting
        const vote = Math.random() > 0.2; // 80% chance of agreement
        votes.push({ nodeId, vote });
        
        this.votes.set(`${proposalId}-${nodeId}`, {
          proposalId,
          nodeId,
          vote,
          timestamp: Date.now()
        });
      }
    }
    
    return votes;
  }

  getStatus() {
    return {
      totalNodes: this.nodes.size,
      activeNodes: Array.from(this.nodes.values()).filter(n => n.status === 'active').length,
      currentRound: this.currentRound,
      pendingProposals: Array.from(this.proposals.values()).filter(p => p.status === 'pending').length
    };
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
    
    // Replicate to other nodes
    this.replicate(key, value, ttl);
  }

  replicate(key, value, ttl) {
    // Simulate replication to distributed nodes
    for (let i = 0; i < this.replicationFactor; i++) {
      const nodeId = `cache-node-${i}`;
      if (!this.nodes.has(nodeId)) {
        this.nodes.set(nodeId, new Map());
      }
      
      this.nodes.get(nodeId).set(key, {
        value,
        timestamp: Date.now(),
        ttl
      });
    }
  }

  invalidate(key) {
    this.cache.delete(key);
    
    // Invalidate on all nodes
    for (const node of this.nodes.values()) {
      node.delete(key);
    }
  }

  getStats() {
    return {
      localCacheSize: this.cache.size,
      distributedNodes: this.nodes.size,
      totalReplicas: Array.from(this.nodes.values()).reduce((sum, node) => sum + node.size, 0),
      consistency: this.consistency
    };
  }
}

// Distributed Observability
class DistributedObservability {
  constructor() {
    this.metrics = new Map();
    this.traces = [];
    this.logs = [];
    this.services = new Set();
  }

  registerService(serviceName) {
    this.services.add(serviceName);
    this.metrics.set(serviceName, {
      requests: 0,
      errors: 0,
      latency: []
    });
  }

  recordRoute(request, route) {
    const trace = {
      traceId: this.generateTraceId(),
      requestId: request.id,
      route: route.components,
      timestamp: Date.now(),
      duration: 0
    };
    
    this.traces.push(trace);
  }

  recordMetric(serviceName, metric, value) {
    if (this.metrics.has(serviceName)) {
      this.metrics.get(serviceName)[metric] = value;
    }
  }

  generateTraceId() {
    return Math.random().toString(36).substr(2, 16);
  }

  getStats() {
    return {
      registeredServices: this.services.size,
      totalTraces: this.traces.length,
      totalMetrics: this.metrics.size
    };
  }
}

// Intelligent Load Balancer
class IntelligentLoadBalancer {
  constructor() {
    this.algorithms = ['round_robin', 'weighted', 'least_connections', 'response_time'];
    this.current = 0;
  }

  select(services, request) {
    // Use multiple algorithms for intelligent selection
    const weights = this.calculateWeights(services, request);
    return this.weightedSelection(services, weights);
  }

  calculateWeights(services, request) {
    return services.map(service => {
      let weight = 1;
      
      // Weight by service health
      weight += service.health || 0.5;
      
      // Weight by response time
      weight += 1 / (1 + (service.latency || 100));
      
      // Weight by load
      weight += 1 / (1 + (service.load || 0));
      
      return weight;
    });
  }

  weightedSelection(services, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < services.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return services[i];
      }
    }
    
    return services[0];
  }
}

// Distributed Systems Integration Server
class DistributedSystemsServer {
  constructor(port = 3007) {
    this.port = port;
    this.orchestrator = new DistributedSystemsOrchestrator();
    this.server = null;
  }

  async start() {
    // Start all components
    await this.startComponents();
    
    // Start main server
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });
    
    console.log(`🌐 Distributed Systems Integration Server running at http://localhost:${this.port}`);
  }

  async startComponents() {
    // Start edge computing
    const edgeServer = new EdgeComputingServer(3003);
    edgeServer.start();
    
    // Start microservices
    const microservicesServer = new MicroservicesServer(3005);
    microservicesServer.start();
    
    // Start AI analytics
    const analyticsServer = new AIAnalyticsDashboard();
    // Analytics server would be started separately
    
    // Start blockchain
    const blockchainServer = new BlockchainServer(3006);
    blockchainServer.start();
    
    console.log('✅ All distributed components started');
  }

  async handleRequest(req) {
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(this.getDistributedHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/distributed/status':
          const status = this.orchestrator.getSystemStatus();
          return Response.json(status);
        
        case '/api/distributed/process':
          if (req.method === 'POST') {
            const request = await req.json();
            const result = await this.orchestrator.processDistributedRequest(request);
            return Response.json(result);
          }
          break;
        
        case '/api/distributed/quantum-search':
          if (req.method === 'POST') {
            const { items, target, iterations } = await req.json();
            const result = await this.orchestrator.processDistributedRequest({
              id: `quantum-${Date.now()}`,
              type: 'quantum_search',
              items,
              target,
              iterations,
              requiresConsensus: false,
              aggregation: 'merge'
            });
            return Response.json(result);
          }
          break;
        
        case '/api/distributed/ai-prediction':
          if (req.method === 'POST') {
            const result = await this.orchestrator.processDistributedRequest({
              id: `ai-${Date.now()}`,
              type: 'prediction',
              requiresConsensus: false,
              aggregation: 'merge'
            });
            return Response.json(result);
          }
          break;
        
        case '/api/distributed/blockchain-transaction':
          if (req.method === 'POST') {
            const transaction = await req.json();
            const result = await this.orchestrator.processDistributedRequest({
              id: `blockchain-${Date.now()}`,
              type: 'transaction',
              ...transaction,
              requiresConsensus: true,
              aggregation: 'consensus'
            });
            return Response.json(result);
          }
          break;
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Distributed systems error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  getDistributedHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Distributed Systems Integration</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; color: #06b6d4; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .card h3 { color: #06b6d4; margin-top: 0; }
        .metric { font-size: 2em; font-weight: bold; color: #22d3ee; margin: 10px 0; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-indicator.active { background: #22c55e; }
        .status-indicator.inactive { background: #ef4444; }
        .button { background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 5px; }
        .button:hover { background: #0891b2; }
        .component-list { max-height: 200px; overflow-y: auto; }
        .component-item { background: #334155; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Distributed Systems Integration</h1>
            < p> Complete distributed computing with edge, microservices, AI, blockchain, and quantum</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔧 System Components</h3>
                <div class="metric" id="total-components">--</div>
                <div>Active Components</div>
                <div class="component-list" id="component-list"></div>
            </div>
            
            <div class="card">
                <h3>🗳️ Consensus System</h3>
                <div class="metric" id="consensus-nodes">--</div>
                <div>Consensus Nodes</div>
                <div class="metric" id="consensus-round">--</div>
                <div>Current Round</div>
            </div>
            
            <div class="card">
                <h3>💾 Distributed Cache</h3>
                <div class="metric" id="cache-size">--</div>
                <div>Cache Size</div>
                <div class="metric" id="cache-nodes">--</div>
                <div>Cache Nodes</div>
            </div typeof 'undefined' && result !== null) {
          resultDiv.innerHTML = \`
            <div class="component-item">
              <strong>Success:</strong> \${result.success ? 'Yes' : 'No'}
              <div>Components: \${result.components.join(', ')}</div>
              <div>Timestamp: \${new Date(result.timestamp).toLocaleString()}</div>
            </div>
          \`;
        } else {
          resultDiv.innerHTML = '<div class="component-item">No result</div>';
        }
      }
      
      async function testQuantumSearch() {
        const resultDiv = document.getElementById('quantum-result');
        resultDiv.innerHTML = '<div class="component-item">Testing quantum search...</div>';
        
        try {
          const response = await fetch('/api/distributed/quantum-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: ['apple', 'banana', 'cherry', 'date'],
              target: 'cherry',
              iterations: 5
            })
          });
          
          const result = await response.json();
          
          if (result && result.success) {
            resultDiv.innerHTML = \`
              <div class="component-item">
                <strong>Quantum Search Result:</strong> \${result.results.result || 'Not found'}
                <div>Index: \${result.results.index || 'N/A'}</div>
                <div>Probability: \${(result.results.probability || 0).toFixed(2)}</div>
              </div>
            \`;
          }
        } catch (error) {
          resultDiv.innerHTML = '<div class="component-item">Quantum search failed</div>';
        }
      }
      
      async function testAIPrediction() {
        const resultDiv = document.getElementById('ai-result');
        resultDiv.innerHTML = '<div class="component-item">Running AI prediction...</div>';
        
        try {
          const response = await fetch('/api/distributed/ai-prediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const result = await response.json();
          
          if (result && result.success) {
            resultDiv.innerHTML = \`
              <div class="component-item">
                <strong>AI Prediction:</strong> Success
                <div>Analytics: \${result.results.analytics ? 'Generated' : 'Failed'}</div>
                <div>Components: \${result.components.join(', ')}</div>
              </div>
            \`;
          }
        } catch (error) {
          resultDiv.innerHTML = '<div class="component-item">AI prediction failed</div>';
        }
      }
      
      async function testBlockchainTransaction() {
        const resultDiv = document.getElementById('blockchain-result');
        resultDiv.innerHTML = '<div class="component-item">Creating blockchain transaction...</div>';
        
        try {
          const response = await fetch('/api/distributed/blockchain-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: '0x123...',
              to: '0x456...',
              amount: 100,
              type: 'transfer'
            })
          });
          
          const result = await response.json();
          
          if (result && result.success) {
            resultDiv.innerHTML = \`
              <div class="component-item">
                <strong>Blockchain Transaction:</strong> Success
                <div>Consensus: \${result.results.consensus ? 'Reached' : 'Failed'}</div>
                <div>Agree: \${result.results.agree}/\${result.results.total}</div>
              </div>
            \`;
          }
        } catch (error) {
          resultDiv.innerHTML = '<div class="component-item">Blockchain transaction failed</div>';
        }
      }
      
      // Load initial data
      loadStatus();
      
      // Auto-refresh every 10 seconds
      setInterval(loadStatus, 10000);
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
class DistributedSystemsDemo {
  static async runDemo() {
    console.log('🌐 Running Distributed Systems Demo...');
    
    const orchestrator = new DistributedSystemsOrchestrator();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test distributed request
    const testRequest = {
      id: 'test-1',
      type: 'comprehensive_test',
      requiresConsensus: true,
      aggregation: 'merge'
    };
    
    const result = await orchestrator.processDistributedRequest(testRequest);
    console.log('✅ Distributed request result:', result);
    
    // Get system status
    const status = orchestrator.getSystemStatus();
    console.log('📊 System status:', status);
    
    return {
      orchestrator,
      testResult: result,
      status
    };
  }
}

export {
  DistributedSystemsOrchestrator,
  AdvancedServiceMesh,
  ConsensusManager,
  DistributedCache,
  DistributedSystemsServer,
  DistributedSystemsDemo
};

export default {
  DistributedSystemsOrchestrator,
  AdvancedServiceMesh,
  ConsensusManager,
  DistributedCache,
  DistributedSystemsServer,
  DistributedSystemsDemo
};
