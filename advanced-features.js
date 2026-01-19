#!/usr/bin/env bun

// @DEMO Advanced Enterprise Features
// Deep technical implementation with cutting-edge capabilities

import { SecurityMiddleware, DDoSProtection, InputSanitizer } from './security-middleware.js';

// Advanced Caching System with LRU and Redis fallback
class AdvancedCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5 minutes
    this.cache = new Map();
    this.redis = options.redis; // Optional Redis client
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  async get(key) {
    // Try local cache first
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      this.metrics.hits++;
      return item.value;
    }

    // Try Redis if available
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          this.set(key, JSON.parse(value));
          this.metrics.hits++;
          return JSON.parse(value);
        }
      } catch (error) {
        console.warn('Redis cache miss:', error.message);
      }
    }

    this.metrics.misses++;
    return null;
  }

  async set(key, value) {
    // Update local cache
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    });

    // Update Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(key, Math.ceil(this.ttl / 1000), JSON.stringify(value));
      } catch (error) {
        console.warn('Redis cache set failed:', error.message);
      }
    }

    this.metrics.sets++;
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Advanced Load Balancer with health checks
class LoadBalancer {
  constructor(servers, options = {}) {
    this.servers = servers.map(server => ({
      ...server,
      healthy: true,
      lastCheck: Date.now(),
      failures: 0,
      responseTime: 0,
      requests: 0
    }));
    
    this.strategy = options.strategy || 'round-robin'; // round-robin, least-connections, weighted
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.maxFailures = options.maxFailures || 3;
    this.currentServer = 0;
    
    this.startHealthChecks();
  }

  selectServer() {
    const healthyServers = this.servers.filter(s => s.healthy);
    
    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    switch (this.strategy) {
      case 'least-connections':
        return healthyServers.reduce((min, server) => 
          server.requests < min.requests ? server : min
        );
      
      case 'weighted':
        const totalWeight = healthyServers.reduce((sum, s) => sum + (s.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        for (const server of healthyServers) {
          random -= (server.weight || 1);
          if (random <= 0) return server;
        }
        return healthyServers[0];
      
      case 'round-robin':
      default:
        const server = healthyServers[this.currentServer % healthyServers.length];
        this.currentServer++;
        return server;
    }
  }

  async checkHealth(server) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${server.url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      server.responseTime = Date.now() - startTime;
      
      if (response.ok) {
        server.healthy = true;
        server.failures = 0;
        server.lastCheck = Date.now();
      } else {
        server.failures++;
        if (server.failures >= this.maxFailures) {
          server.healthy = false;
        }
      }
    } catch (error) {
      server.failures++;
      if (server.failures >= this.maxFailures) {
        server.healthy = false;
      }
    }
  }

  startHealthChecks() {
    setInterval(() => {
      this.servers.forEach(server => this.checkHealth(server));
    }, this.healthCheckInterval);
  }

  getMetrics() {
    return {
      totalServers: this.servers.length,
      healthyServers: this.servers.filter(s => s.healthy).length,
      strategy: this.strategy,
      servers: this.servers.map(s => ({
        url: s.url,
        healthy: s.healthy,
        requests: s.requests,
        responseTime: s.responseTime,
        failures: s.failures
      }))
    };
  }
}

// Advanced Circuit Breaker Pattern
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpens: 0,
      circuitCloses: 0
    };
  }

  async execute(operation) {
    this.metrics.totalRequests++;
    this.requestCount++;

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF-OPEN';
        this.successCount = 0;
      } else {
        this.metrics.failedRequests++;
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.metrics.successfulRequests++;
    this.failures = 0;
    
    if (this.state === 'HALF-OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
        this.metrics.circuitCloses++;
      }
    }
  }

  onFailure() {
    this.metrics.failedRequests++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.metrics.circuitOpens++;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      requestCount: this.requestCount,
      metrics: this.metrics
    };
  }
}

// Advanced Rate Limiter with Sliding Window
class AdvancedRateLimiter {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.burstSize = options.burstSize || 20;
    
    this.clients = new Map();
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    
    this.startCleanup();
  }

  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    
    let clientData = this.clients.get(clientId);
    
    if (!clientData) {
      clientData = {
        requests: [],
        blocked: false,
        blockExpiry: null
      };
      this.clients.set(clientId, clientData);
    }

    // Check if client is blocked
    if (clientData.blocked && now < clientData.blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientData.blockExpiry,
        retryAfter: Math.ceil((clientData.blockExpiry - now) / 1000)
      };
    }

    // Remove old requests outside the window
    clientData.requests = clientData.requests.filter(time => time > windowStart);

    // Check burst limit
    const recentRequests = clientData.requests.filter(time => now - time < 10000); // Last 10 seconds
    if (recentRequests.length >= this.burstSize) {
      clientData.blocked = true;
      clientData.blockExpiry = now + 30000; // Block for 30 seconds
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientData.blockExpiry,
        retryAfter: 30
      };
    }

    // Check sliding window limit
    if (clientData.requests.length >= this.maxRequests) {
      clientData.blocked = true;
      clientData.blockExpiry = now + this.windowSize;
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientData.blockExpiry,
        retryAfter: Math.ceil(this.windowSize / 1000)
      };
    }

    // Allow request
    clientData.requests.push(now);
    const remaining = this.maxRequests - clientData.requests.length;
    
    return {
      allowed: true,
      remaining,
      resetTime: now + this.windowSize,
      retryAfter: 0
    };
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.windowSize;
      
      for (const [clientId, clientData] of this.clients.entries()) {
        // Remove old requests
        clientData.requests = clientData.requests.filter(time => time > windowStart);
        
        // Unblock if block expired
        if (clientData.blocked && now >= clientData.blockExpiry) {
          clientData.blocked = false;
          clientData.blockExpiry = null;
        }
        
        // Remove empty clients
        if (clientData.requests.length === 0 && !clientData.blocked) {
          this.clients.delete(clientId);
        }
      }
    }, this.cleanupInterval);
  }

  getMetrics() {
    const totalClients = this.clients.size;
    const blockedClients = Array.from(this.clients.values()).filter(c => c.blocked).length;
    
    return {
      totalClients,
      blockedClients,
      windowSize: this.windowSize,
      maxRequests: this.maxRequests,
      burstSize: this.burstSize
    };
  }
}

// Advanced Metrics Collection with Time Series
class AdvancedMetrics {
  constructor(options = {}) {
    this.retentionPeriod = options.retentionPeriod || 3600000; // 1 hour
    this.granularity = options.granularity || 1000; // 1 second
    this.metrics = new Map();
    
    this.startCleanup();
  }

  record(name, value, tags = {}) {
    const timestamp = Date.now();
    const key = this.createKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        tags,
        values: [],
        min: value,
        max: value,
        sum: value,
        count: 1
      });
    } else {
      const metric = this.metrics.get(key);
      metric.values.push({ timestamp, value });
      metric.min = Math.min(metric.min, value);
      metric.max = Math.max(metric.max, value);
      metric.sum += value;
      metric.count++;
    }
  }

  createKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagString}}`;
  }

  getMetrics(name, timeRange = 300000) { // Default 5 minutes
    const now = Date.now();
    const startTime = now - timeRange;
    const results = [];

    for (const [key, metric] of this.metrics.entries()) {
      if (name && !metric.name.startsWith(name)) continue;
      
      const recentValues = metric.values.filter(v => v.timestamp >= startTime);
      
      if (recentValues.length > 0) {
        results.push({
          name: metric.name,
          tags: metric.tags,
          values: recentValues,
          min: metric.min,
          max: metric.max,
          avg: metric.sum / metric.count,
          count: metric.count,
          latest: recentValues[recentValues.length - 1].value
        });
      }
    }

    return results;
  }

  startCleanup() {
    setInterval(() => {
      const cutoffTime = Date.now() - this.retentionPeriod;
      
      for (const [key, metric] of this.metrics.entries()) {
        metric.values = metric.values.filter(v => v.timestamp > cutoffTime);
        
        if (metric.values.length === 0) {
          this.metrics.delete(key);
        }
      }
    }, this.granularity * 60); // Cleanup every minute
  }
}

// Advanced Event System with Replay and Persistence
class AdvancedEventSystem {
  constructor(options = {}) {
    this.listeners = new Map();
    this.eventQueue = [];
    this.processing = false;
    this.persistence = options.persistence;
    this.maxQueueSize = options.maxQueueSize || 10000;
    this.replayEnabled = options.replayEnabled || false;
    this.eventHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100000;
  }

  async emit(event, data) {
    const eventData = {
      id: this.generateId(),
      event,
      data,
      timestamp: Date.now(),
      processed: false
    };

    // Add to queue
    this.eventQueue.push(eventData);
    
    // Add to history
    if (this.replayEnabled) {
      this.eventHistory.push(eventData);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }
    }

    // Persist if enabled
    if (this.persistence) {
      await this.persistEvent(eventData);
    }

    // Process queue
    if (!this.processing) {
      this.processQueue();
    }

    return eventData.id;
  }

  on(event, listener, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listenerInfo = {
      callback: listener,
      once: options.once || false,
      priority: options.priority || 0,
      id: this.generateId()
    };

    this.listeners.get(event).push(listenerInfo);
    
    // Sort by priority (higher priority first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    return listenerInfo.id;
  }

  off(event, listenerId) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async processQueue() {
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const eventData = this.eventQueue.shift();
      await this.processEvent(eventData);
    }

    this.processing = false;
  }

  async processEvent(eventData) {
    const listeners = this.listeners.get(eventData.event) || [];
    
    for (const listener of listeners) {
      try {
        await listener.callback(eventData.data, eventData);
        
        if (listener.once) {
          this.off(eventData.event, listener.id);
        }
      } catch (error) {
        console.error(`Error processing event ${eventData.event}:`, error);
      }
    }

    eventData.processed = true;
  }

  async replay(fromTimestamp = 0) {
    if (!this.replayEnabled) {
      throw new Error('Replay is not enabled');
    }

    const eventsToReplay = this.eventHistory.filter(
      e => e.timestamp >= fromTimestamp
    );

    for (const event of eventsToReplay) {
      await this.processEvent(event);
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async persistEvent(eventData) {
    // Implementation would depend on persistence layer
    // This is a placeholder for database/file persistence
    console.log('Persisting event:', eventData.id);
  }

  getStats() {
    return {
      queueSize: this.eventQueue.length,
      processing: this.processing,
      totalListeners: Array.from(this.listeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0),
      eventTypes: this.listeners.size,
      historySize: this.eventHistory.length,
      replayEnabled: this.replayEnabled
    };
  }
}

// Export all advanced features
export {
  AdvancedCache,
  LoadBalancer,
  CircuitBreaker,
  AdvancedRateLimiter,
  AdvancedMetrics,
  AdvancedEventSystem
};

export default {
  AdvancedCache,
  LoadBalancer,
  CircuitBreaker,
  AdvancedRateLimiter,
  AdvancedMetrics,
  AdvancedEventSystem
};
