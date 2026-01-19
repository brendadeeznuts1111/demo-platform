#!/usr/bin/env bun

// @DEMO Microservices Orchestration Platform
// Complete microservices management with service discovery, load balancing, and orchestration

// Service Registry
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
    this.healthChecks = new Map();
    this.subscriptions = new Map();
    
    this.config = {
      heartbeatInterval: 30000,
      deregisterAfter: 90000,
      healthCheckTimeout: 5000
    };
    
    this.startHeartbeatMonitoring();
  }

  registerService(serviceConfig) {
    const { name, id, host, port, metadata = {} } = serviceConfig;
    
    const service = {
      name,
      id,
      host,
      port,
      url: `http://${host}:${port}`,
      metadata,
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      status: 'healthy',
      health: 'unknown'
    };
    
    // Add to services map
    if (!this.services.has(name)) {
      this.services.set(name, new Map());
    }
    this.services.get(name).set(id, service);
    
    // Add to instances map
    this.instances.set(id, service);
    
    // Setup health check
    this.setupHealthCheck(service);
    
    console.log(`📝 Registered service: ${name} (${id}) at ${service.url}`);
    
    // Notify subscribers
    this.notifySubscribers('service_registered', service);
    
    return service;
  }

  deregisterService(serviceName, instanceId) {
    const serviceMap = this.services.get(serviceName);
    if (serviceMap) {
      const service = serviceMap.get(instanceId);
      if (service) {
        serviceMap.delete(instanceId);
        this.instances.delete(instanceId);
        
        console.log(`🗑️ Deregistered service: ${serviceName} (${instanceId})`);
        
        // Notify subscribers
        this.notifySubscribers('service_deregistered', service);
        
        return true;
      }
    }
    return false;
  }

  discoverServices(serviceName) {
    const serviceMap = this.services.get(serviceName);
    if (serviceMap) {
      return Array.from(serviceMap.values())
        .filter(service => service.status === 'healthy');
    }
    return [];
  }

  discoverService(serviceName, strategy = 'random') {
    const services = this.discoverServices(serviceName);
    
    if (services.length === 0) {
      return null;
    }
    
    switch (strategy) {
      case 'random':
        return services[Math.floor(Math.random() * services.length)];
      case 'round_robin':
        return services[this.getNextRoundRobinIndex(serviceName)];
      case 'least_connections':
        return this.selectLeastConnections(services);
      default:
        return services[0];
    }
  }

  getNextRoundRobinIndex(serviceName) {
    if (!this.roundRobinIndexes) {
      this.roundRobinIndexes = new Map();
    }
    
    const currentIndex = this.roundRobinIndexes.get(serviceName) || 0;
    const services = this.discoverServices(serviceName);
    const nextIndex = (currentIndex + 1) % services.length;
    
    this.roundRobinIndexes.set(serviceName, nextIndex);
    return currentIndex;
  }

  selectLeastConnections(services) {
    return services.reduce((min, service) => {
      const connections = service.metadata.connections || 0;
      const minConnections = min.metadata.connections || 0;
      return connections < minConnections ? service : min;
    });
  }

  async setupHealthCheck(service) {
    const healthCheckUrl = `${service.url}/health`;
    
    const performHealthCheck = async () => {
      try {
        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          timeout: this.config.healthCheckTimeout
        });
        
        if (response.ok) {
          const health = await response.json();
          service.health = health.status || 'healthy';
          service.status = 'healthy';
          service.lastHeartbeat = Date.now();
        } else {
          service.health = 'unhealthy';
          service.status = 'unhealthy';
        }
      } catch (error) {
        service.health = 'error';
        service.status = 'unhealthy';
      }
    };
    
    // Perform initial health check
    await performHealthCheck();
    
    // Schedule periodic health checks
    const intervalId = setInterval(performHealthCheck, this.config.heartbeatInterval);
    this.healthChecks.set(service.id, intervalId);
  }

  startHeartbeatMonitoring() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [serviceName, serviceMap] of this.services) {
        for (const [instanceId, service] of serviceMap) {
          if (now - service.lastHeartbeat > this.config.deregisterAfter) {
            console.warn(`💀 Service ${serviceName} (${instanceId}) missed heartbeats, deregistering`);
            this.deregisterService(serviceName, instanceId);
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  subscribe(event, callback) {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    
    this.subscriptions.get(event).push(callback);
  }

  notifySubscribers(event, data) {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscription callback error:', error);
        }
      });
    }
  }

  getServiceStatus() {
    const status = {};
    
    for (const [serviceName, serviceMap] of this.services) {
      const instances = Array.from(serviceMap.values());
      status[serviceName] = {
        totalInstances: instances.length,
        healthyInstances: instances.filter(s => s.status === 'healthy').length,
        unhealthyInstances: instances.filter(s => s.status === 'unhealthy').length,
        instances: instances.map(s => ({
          id: s.id,
          url: s.url,
          status: s.status,
          health: s.health,
          lastHeartbeat: s.lastHeartbeat
        }))
      };
    }
    
    return status;
  }
}

// API Gateway
class APIGateway {
  constructor(serviceRegistry) {
    this.serviceRegistry = serviceRegistry;
    this.routes = new Map();
    this.middleware = [];
    this.rateLimiter = new RateLimiter();
    this.circuitBreaker = new CircuitBreaker();
    
    this.config = {
      timeout: 30000,
      retries: 3,
      loadBalancing: 'round_robin'
    };
  }

  addRoute(path, serviceName, options = {}) {
    const route = {
      path,
      serviceName,
      methods: options.methods || ['GET', 'POST', 'PUT', 'DELETE'],
      timeout: options.timeout || this.config.timeout,
      retries: options.retries || this.config.retries,
      middleware: options.middleware || [],
      cache: options.cache || false,
      auth: options.auth || false
    };
    
    this.routes.set(path, route);
    console.log(`🛣️ Added route: ${path} -> ${serviceName}`);
  }

  async handleRequest(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Find matching route
    const route = this.findRoute(path, method);
    if (!route) {
      return new Response('404 - Route not found', { status: 404 });
    }
    
    // Apply global middleware
    for (const middleware of this.middleware) {
      const result = await middleware(req);
      if (result) {
        return result;
      }
    }
    
    // Apply route-specific middleware
    for (const middleware of route.middleware) {
      const result = await middleware(req);
      if (result) {
        return result;
      }
    }
    
    // Rate limiting
    if (!await this.rateLimiter.checkLimit(req)) {
      return new Response('429 - Too Many Requests', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }
    
    // Circuit breaker check
    if (this.circuitBreaker.isOpen(route.serviceName)) {
      return new Response('503 - Service Unavailable', { status: 503 });
    }
    
    try {
      // Discover service instance
      const service = this.serviceRegistry.discoverService(
        route.serviceName, 
        this.config.loadBalancing
      );
      
      if (!service) {
        return new Response('503 - No available service instances', { status: 503 });
      }
      
      // Forward request to service
      const response = await this.forwardRequest(req, service, route);
      
      // Update circuit breaker
      this.circuitBreaker.recordSuccess(route.serviceName);
      
      return response;
      
    } catch (error) {
      // Update circuit breaker
      this.circuitBreaker.recordFailure(route.serviceName);
      
      console.error(`Gateway error for ${path}:`, error);
      return new Response('502 - Bad Gateway', { status: 502 });
    }
  }

  findRoute(path, method) {
    // Exact match first
    if (this.routes.has(path)) {
      const route = this.routes.get(path);
      if (route.methods.includes(method)) {
        return route;
      }
    }
    
    // Pattern matching
    for (const [routePath, route] of this.routes) {
      if (this.matchesPath(routePath, path) && route.methods.includes(method)) {
        return route;
      }
    }
    
    return null;
  }

  matchesPath(routePath, requestPath) {
    // Simple path matching (can be enhanced with regex)
    if (routePath.endsWith('*')) {
      const prefix = routePath.slice(0, -1);
      return requestPath.startsWith(prefix);
    }
    
    return routePath === requestPath;
  }

  async forwardRequest(req, service, route) {
    const url = new URL(req.url);
    const targetUrl = service.url + url.pathname + url.search;
    
    // Prepare headers
    const headers = new Headers(req.headers);
    headers.set('X-Forwarded-For', req.headers.get('x-forwarded-for') || 'unknown');
    headers.set('X-Forwarded-Proto', url.protocol);
    headers.set('X-Forwarded-Host', url.host);
    headers.set('X-Gateway-Request', 'true');
    
    // Prepare request options
    const options = {
      method: req.method,
      headers,
      timeout: route.timeout
    };
    
    // Add body if present
    if (req.body) {
      options.body = req.body;
    }
    
    // Make request with retries
    let lastError;
    for (let attempt = 0; attempt <= route.retries; attempt++) {
      try {
        const response = await fetch(targetUrl, options);
        
        // Create response with gateway headers
        const gatewayResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        
        gatewayResponse.headers.set('X-Gateway-Service', service.name);
        gatewayResponse.headers.set('X-Gateway-Instance', service.id);
        gatewayResponse.headers.set('X-Gateway-Attempt', (attempt + 1).toString());
        
        return gatewayResponse;
        
      } catch (error) {
        lastError = error;
        if (attempt < route.retries) {
          console.warn(`Retry ${attempt + 1}/${route.retries} for ${targetUrl}:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  getRouteStatus() {
    const status = {};
    
    for (const [path, route] of this.routes) {
      const instances = this.serviceRegistry.discoverServices(route.serviceName);
      status[path] = {
        serviceName: route.serviceName,
        methods: route.methods,
        availableInstances: instances.length,
        circuitBreakerOpen: this.circuitBreaker.isOpen(route.serviceName)
      };
    }
    
    return status;
  }
}

// Service Mesh
class ServiceMesh {
  constructor() {
    this.services = new Map();
    this.connections = new Map();
    this.policies = new Map();
    this.observability = new Observability();
  }

  addService(serviceConfig) {
    const service = {
      name: serviceConfig.name,
      version: serviceConfig.version,
      dependencies: serviceConfig.dependencies || [],
      endpoints: serviceConfig.endpoints || [],
      policies: serviceConfig.policies || [],
      metrics: {
        requests: 0,
        errors: 0,
        latency: []
      }
    };
    
    this.services.set(serviceConfig.name, service);
    console.log(`🔗 Added service to mesh: ${serviceConfig.name}`);
  }

  createConnection(from, to, config = {}) {
    const connection = {
      from,
      to,
      protocol: config.protocol || 'http',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      circuitBreaker: config.circuitBreaker || true,
      loadBalancing: config.loadBalancing || 'round_robin',
      policies: config.policies || []
    };
    
    const key = `${from}->${to}`;
    this.connections.set(key, connection);
    
    console.log(`🔗 Created mesh connection: ${key}`);
    return connection;
  }

  addPolicy(name, policy) {
    this.policies.set(name, policy);
  }

  applyPolicy(connectionName, policyName) {
    const connection = this.connections.get(connectionName);
    const policy = this.policies.get(policyName);
    
    if (connection && policy) {
      connection.policies.push(policyName);
      console.log(`📋 Applied policy ${policyName} to connection ${connectionName}`);
    }
  }

  getMeshStatus() {
    return {
      services: Array.from(this.services.values()).map(s => ({
        name: s.name,
        version: s.version,
        dependencies: s.dependencies,
        metrics: s.metrics
      })),
      connections: Array.from(this.connections.entries()).map(([key, conn]) => ({
        connection: key,
        protocol: conn.protocol,
        policies: conn.policies
      })),
      policies: Array.from(this.policies.keys())
    };
  }
}

// Container Orchestration
class ContainerOrchestrator {
  constructor() {
    this.containers = new Map();
    this.pods = new Map();
    this.services = new Map();
    this.deployments = new Map();
    
    this.config = {
      defaultReplicas: 3,
      resourceLimits: {
        cpu: '1000m',
        memory: '512Mi'
      },
      healthCheckInterval: 30000
    };
  }

  createDeployment(deploymentConfig) {
    const deployment = {
      name: deploymentConfig.name,
      image: deploymentConfig.image,
      replicas: deploymentConfig.replicas || this.config.defaultReplicas,
      ports: deploymentConfig.ports || [],
      environment: deploymentConfig.environment || {},
      resources: deploymentConfig.resources || this.config.resourceLimits,
      healthCheck: deploymentConfig.healthCheck,
      createdAt: Date.now(),
      status: 'pending'
    };
    
    this.deployments.set(deploymentConfig.name, deployment);
    
    // Create pods
    this.createPods(deployment);
    
    console.log(`🚀 Created deployment: ${deploymentConfig.name} with ${deployment.replicas} replicas`);
    return deployment;
  }

  createPods(deployment) {
    const pods = [];
    
    for (let i = 0; i < deployment.replicas; i++) {
      const pod = {
        name: `${deployment.name}-${i}`,
        deployment: deployment.name,
        image: deployment.image,
        status: 'pending',
        node: null,
        ip: this.generatePodIP(),
        ports: deployment.ports,
        environment: deployment.environment,
        resources: deployment.resources,
        createdAt: Date.now(),
        healthCheck: deployment.healthCheck
      };
      
      this.pods.set(pod.name, pod);
      pods.push(pod);
      
      // Schedule pod on node
      this.schedulePod(pod);
    }
    
    return pods;
  }

  schedulePod(pod) {
    // Simple scheduling - assign to a node
    const nodes = ['node-1', 'node-2', 'node-3'];
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    
    pod.node = node;
    pod.status = 'running';
    
    console.log(`📅 Scheduled pod ${pod.name} on ${node}`);
  }

  generatePodIP() {
    return `10.244.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  scaleDeployment(deploymentName, replicas) {
    const deployment = this.deployments.get(deploymentName);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentName} not found`);
    }
    
    const oldReplicas = deployment.replicas;
    deployment.replicas = replicas;
    
    if (replicas > oldReplicas) {
      // Scale up
      for (let i = oldReplicas; i < replicas; i++) {
        const pod = {
          name: `${deployment.name}-${i}`,
          deployment: deployment.name,
          image: deployment.image,
          status: 'pending',
          node: null,
          ip: this.generatePodIP(),
          ports: deployment.ports,
          environment: deployment.environment,
          resources: deployment.resources,
          createdAt: Date.now()
        };
        
        this.pods.set(pod.name, pod);
        this.schedulePod(pod);
      }
    } else if (replicas < oldReplicas) {
      // Scale down
      for (let i = replicas; i < oldReplicas; i++) {
        const podName = `${deployment.name}-${i}`;
        this.pods.delete(podName);
      }
    }
    
    console.log(`📈 Scaled deployment ${deploymentName} from ${oldReplicas} to ${replicas} replicas`);
  }

  getDeploymentStatus(deploymentName) {
    const deployment = this.deployments.get(deploymentName);
    if (!deployment) {
      return null;
    }
    
    const pods = Array.from(this.pods.values())
      .filter(pod => pod.deployment === deploymentName);
    
    return {
      deployment: {
        name: deployment.name,
        image: deployment.image,
        replicas: deployment.replicas,
        status: deployment.status
      },
      pods: pods.map(pod => ({
        name: pod.name,
        status: pod.status,
        node: pod.node,
        ip: pod.ip,
        age: Date.now() - pod.createdAt
      })),
      metrics: {
        runningPods: pods.filter(p => p.status === 'running').length,
        pendingPods: pods.filter(p => p.status === 'pending').length,
        failedPods: pods.filter(p => p.status === 'failed').length
      }
    };
  }

  getAllDeployments() {
    const deployments = [];
    
    for (const [name, deployment] of this.deployments) {
      deployments.push(this.getDeploymentStatus(name));
    }
    
    return deployments;
  }
}

// Supporting Classes
class RateLimiter {
  constructor() {
    this.limits = new Map();
  }

  async checkLimit(req, limit = 100, window = 60000) {
    const key = this.getClientKey(req);
    const now = Date.now();
    
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const requests = this.limits.get(key);
    
    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < window);
    this.limits.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }

  getClientKey(req) {
    return req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           'unknown';
  }
}

class CircuitBreaker {
  constructor() {
    this.states = new Map();
    this.config = {
      failureThreshold: 5,
      timeout: 60000,
      halfOpenMaxCalls: 3
    };
  }

  isOpen(serviceName) {
    const state = this.states.get(serviceName);
    if (!state) {
      return false;
    }
    
    if (state.state === 'open') {
      if (Date.now() - state.openedAt > this.config.timeout) {
        state.state = 'half_open';
        state.halfOpenCalls = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  recordSuccess(serviceName) {
    const state = this.states.get(serviceName);
    if (!state) {
      this.states.set(serviceName, {
        state: 'closed',
        failures: 0,
        lastFailureTime: null,
        openedAt: null,
        halfOpenCalls: 0
      });
      return;
    }
    
    if (state.state === 'half_open') {
      state.halfOpenCalls++;
      if (state.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        state.state = 'closed';
        state.failures = 0;
      }
    } else if (state.state === 'closed') {
      state.failures = 0;
    }
  }

  recordFailure(serviceName) {
    const state = this.states.get(serviceName);
    if (!state) {
      this.states.set(serviceName, {
        state: 'closed',
        failures: 1,
        lastFailureTime: Date.now(),
        openedAt: null,
        halfOpenCalls: 0
      });
      return;
    }
    
    state.failures++;
    state.lastFailureTime = Date.now();
    
    if (state.failures >= this.config.failureThreshold) {
      state.state = 'open';
      state.openedAt = Date.now();
    }
  }
}

class Observability {
  constructor() {
    this.metrics = new Map();
    this.traces = [];
    this.logs = [];
  }

  recordMetric(name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      value,
      tags,
      timestamp: Date.now()
    });
  }

  startTrace(operationName) {
    const trace = {
      id: this.generateTraceId(),
      operationName,
      startTime: Date.now(),
      spans: []
    };
    
    this.traces.push(trace);
    return trace;
  }

  generateTraceId() {
    return Math.random().toString(36).substr(2, 16);
  }

  log(level, message, context = {}) {
    this.logs.push({
      level,
      message,
      context,
      timestamp: Date.now()
    });
  }
}

// Microservices Server
class MicroservicesServer {
  constructor(port = 3004) {
    this.port = port;
    this.serviceRegistry = new ServiceRegistry();
    this.apiGateway = new APIGateway(this.serviceRegistry);
    this.serviceMesh = new ServiceMesh();
    this.orchestrator = new ContainerOrchestrator();
    this.server = null;
  }

  start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });
    
    console.log(`🔗 Microservices Orchestration Server running at http://localhost:${this.port}`);
  }

  async handleRequest(req) {
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(this.getMicroservicesHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/orchestration/status':
          const status = this.getOrchestrationStatus();
          return Response.json(status);
        
        case '/api/services/register':
          if (req.method === 'POST') {
            const serviceConfig = await req.json();
            const service = this.serviceRegistry.registerService(serviceConfig);
            return Response.json({ success: true, service });
          }
          break;
        
        case '/api/services/discover':
          const serviceName = url.searchParams.get('name');
          if (serviceName) {
            const services = this.serviceRegistry.discoverServices(serviceName);
            return Response.json(services);
          }
          break;
        
        case '/api/deployments/create':
          if (req.method === 'POST') {
            const deploymentConfig = await req.json();
            const deployment = this.orchestrator.createDeployment(deploymentConfig);
            return Response.json({ success: true, deployment });
          }
          break;
        
        case '/api/deployments/scale':
          if (req.method === 'POST') {
            const { name, replicas } = await req.json();
            this.orchestrator.scaleDeployment(name, replicas);
            return Response.json({ success: true });
          }
          break;
        
        default:
          // Try to route through API gateway
          return await this.apiGateway.handleRequest(req);
      }
    } catch (error) {
      console.error('Microservices error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  getOrchestrationStatus() {
    return {
      serviceRegistry: this.serviceRegistry.getServiceStatus(),
      apiGateway: this.apiGateway.getRouteStatus(),
      serviceMesh: this.serviceMesh.getMeshStatus(),
      deployments: this.orchestrator.getAllDeployments()
    };
  }

  getMicroservicesHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO Microservices Orchestration</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; color: #8b5cf6; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .card h3 { color: #8b5cf6; margin-top: 0; }
        .metric { font-size: 2em; font-weight: bold; color: #a78bfa; margin: 10px 0; }
        .service-list { max-height: 200px; overflow-y: auto; }
        .service-item { background: #334155; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 0.9em; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
        .status.healthy { background: #22c55e; color: white; }
        .status.unhealthy { background: #ef4444; color: white; }
        .button { background: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin: 4px; }
        .button:hover { background: #7c3aed; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Microservices Orchestration</h1>
            <p>Complete microservices management with service discovery and orchestration</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📝 Service Registry</h3>
                <div class="metric" id="total-services">--</div>
                <div>Total Services</div>
                <div class="metric" id="healthy-services">--</div>
                <div>Healthy Services</div>
                <div class="service-list" id="service-list"></div>
            </div>
            
            <div class="card">
                <h3>🚀 Deployments</h3>
                <div class="metric" id="total-deployments">--</div>
                <div>Total Deployments</div>
                <div class="metric" id="running-pods">--</div>
                <div>Running Pods</div>
                <div class="service-list" id="deployment-list"></div>
            </div>
            
            <div class="card">
                <h3>🔗 Service Mesh</h3>
                <div class="metric" id="mesh-services">--</div>
                <div>Mesh Services</div>
                <div class="metric" id="mesh-connections">--</div>
                <div>Connections</div>
                <div class="service-list" id="mesh-list"></div>
            </div>
            
            <div class="card">
                <h3>🛣️ API Gateway</h3>
                <div class="metric" id="total-routes">--</div>
                <div>Total Routes</div>
                <div class="metric" id="active-routes">--</div>
                <div>Active Routes</div>
                <div class="service-list" id="route-list"></div>
            </div>
        </div>
        
        <div class="card">
            <h3>🎮 Orchestration Controls</h3>
            <button class="button" onclick="refreshStatus()">🔄 Refresh Status</button>
            <button class="button" onclick="registerService()">📝 Register Service</button>
            <button class="button" onclick="createDeployment()">🚀 Create Deployment</button>
            <button class="button" onclick="scaleDeployment()">📈 Scale Deployment</button>
        </div>
    </div>
    
    <script>
        let orchestrationData = null;
        
        async function loadStatus() {
            try {
                const response = await fetch('/api/orchestration/status');
                orchestrationData = await response.json();
                updateDashboard();
            } catch (error) {
                console.error('Failed to load orchestration status:', error);
            }
        }
        
        function updateDashboard() {
            if (!orchestrationData) return;
            
            // Service Registry
            const serviceRegistry = orchestrationData.serviceRegistry;
            let totalServices = 0;
            let healthyServices = 0;
            const serviceList = [];
            
            for (const [serviceName, serviceData] of Object.entries(serviceRegistry)) {
                totalServices += serviceData.totalInstances;
                healthyServices += serviceData.healthyInstances;
                
                serviceList.push(\`
                    <div class="service-item">
                        <strong>\${serviceName}</strong>
                        <span class="status healthy">\${serviceData.healthyInstances}/\${serviceData.totalInstances}</span>
                    </div>
                \`);
            }
            
            document.getElementById('total-services').textContent = totalServices;
            document.getElementById('healthy-services').textContent = healthyServices;
            document.getElementById('service-list').innerHTML = serviceList.join('');
            
            // Deployments
            const deployments = orchestrationData.deployments;
            let totalPods = 0;
            let runningPods = 0;
            const deploymentList = [];
            
            deployments.forEach(deployment => {
                totalPods += deployment.deployment.replicas;
                runningPods += deployment.metrics.runningPods;
                
                deploymentList.push(\`
                    <div class="service-item">
                        <strong>\${deployment.deployment.name}</strong>
                        <span class="status healthy">\${deployment.metrics.runningPods}/\${deployment.deployment.replicas}</span>
                    </div>
                \`);
            });
            
            document.getElementById('total-deployments').textContent = deployments.length;
            document.getElementById('running-pods').textContent = runningPods;
            document.getElementById('deployment-list').innerHTML = deploymentList.join('');
            
            // Service Mesh
            const mesh = orchestrationData.serviceMesh;
            document.getElementById('mesh-services').textContent = mesh.services.length;
            document.getElementById('mesh-connections').textContent = mesh.connections.length;
            
            const meshList = mesh.services.map(service => 
                \`<div class="service-item"><strong>\${service.name}</strong> v\${service.version}</div>\`
            );
            document.getElementById('mesh-list').innerHTML = meshList.join('');
            
            // API Gateway
            const gateway = orchestrationData.apiGateway;
            const routes = Object.keys(gateway);
            const activeRoutes = routes.filter(route => !gateway[route].circuitBreakerOpen);
            
            document.getElementById('total-routes').textContent = routes.length;
            document.getElementById('active-routes').textContent = activeRoutes.length;
            
            const routeList = routes.map(route => 
                \`<div class="service-item">
                    <strong>\${route}</strong> → \${gateway[route].serviceName}
                    <span class="status \${gateway[route].circuitBreakerOpen ? 'unhealthy' : 'healthy'}">
                        \${gateway[route].circuitBreakerOpen ? 'Open' : 'Closed'}
                    </span>
                </div>\`
            );
            document.getElementById('route-list').innerHTML = routeList.join('');
        }
        
        function refreshStatus() {
            loadStatus();
        }
        
        async function registerService() {
            const serviceName = prompt('Enter service name:');
            const serviceId = prompt('Enter service ID:');
            const host = prompt('Enter host:');
            const port = prompt('Enter port:');
            
            if (serviceName && serviceId && host && port) {
                try {
                    const response = await fetch('/api/services/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: serviceName,
                            id: serviceId,
                            host: host,
                            port: parseInt(port)
                        })
                    });
                    
                    if (response.ok) {
                        alert('Service registered successfully!');
                        refreshStatus();
                    }
                } catch (error) {
                    alert('Failed to register service');
                }
            }
        }
        
        async function createDeployment() {
            const name = prompt('Enter deployment name:');
            const image = prompt('Enter Docker image:');
            const replicas = prompt('Enter number of replicas:', '3');
            
            if (name && image && replicas) {
                try {
                    const response = await fetch('/api/deployments/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: name,
                            image: image,
                            replicas: parseInt(replicas)
                        })
                    });
                    
                    if (response.ok) {
                        alert('Deployment created successfully!');
                        refreshStatus();
                    }
                } catch (error) {
                    alert('Failed to create deployment');
                }
            }
        }
        
        async function scaleDeployment() {
            const name = prompt('Enter deployment name:');
            const replicas = prompt('Enter new number of replicas:');
            
            if (name && replicas) {
                try {
                    const response = await fetch('/api/deployments/scale', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: name,
                            replicas: parseInt(replicas)
                        })
                    });
                    
                    if (response.ok) {
                        alert('Deployment scaled successfully!');
                        refreshStatus();
                    }
                } catch (error) {
                    alert('Failed to scale deployment');
                }
            }
        }
        
        // Load data on page load
        loadStatus();
        
        // Auto-refresh every 15 seconds
        setInterval(loadStatus, 15000);
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
class MicroservicesDemo {
  static async runDemo() {
    console.log('🔗 Running Microservices Orchestration Demo...');
    
    const orchestrator = new MicroservicesServer();
    
    // Register some test services
    const services = [
      { name: 'user-service', id: 'user-1', host: 'localhost', port: 3001 },
      { name: 'order-service', id: 'order-1', host: 'localhost', port: 3002 },
      { name: 'payment-service', id: 'payment-1', host: 'localhost', port: 3003 }
    ];
    
    for (const service of services) {
      orchestrator.serviceRegistry.registerService(service);
    }
    
    // Create test deployment
    const deployment = orchestrator.orchestrator.createDeployment({
      name: 'web-app',
      image: 'nginx:latest',
      replicas: 3,
      ports: [80]
    });
    
    // Get status
    const status = orchestrator.getOrchestrationStatus();
    console.log('📊 Orchestration status:', status);
    
    return {
      orchestrator,
      services,
      deployment,
      status
    };
  }
}

export {
  ServiceRegistry,
  APIGateway,
  ServiceMesh,
  ContainerOrchestrator,
  MicroservicesServer,
  MicroservicesDemo
};

export default {
  ServiceRegistry,
  APIGateway,
  ServiceMesh,
  ContainerOrchestrator,
  MicroservicesServer,
  MicroservicesDemo
};
