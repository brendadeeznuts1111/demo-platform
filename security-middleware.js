#!/usr/bin/env bun

// @DEMO Security Middleware
// Rate limiting, CORS, and security headers

export class SecurityMiddleware {
  constructor(options = {}) {
    this.rateLimit = options.rateLimit || {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100     // 100 requests per minute
    };
    
    this.requests = new Map(); // IP -> { count, resetTime }
    this.cors = options.cors || {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
  }
  
  // Rate limiting middleware
  rateLimitMiddleware() {
    return (req) => {
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const clientData = this.requests.get(clientIP);
      
      if (!clientData || now > clientData.resetTime) {
        // New window or expired window
        this.requests.set(clientIP, {
          count: 1,
          resetTime: now + this.rateLimit.windowMs
        });
        return null; // Allow request
      }
      
      if (clientData.count >= this.rateLimit.maxRequests) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Max ${this.rateLimit.maxRequests} per ${this.rateLimit.windowMs/1000}s.`,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString()
          }
        });
      }
      
      clientData.count++;
      return null; // Allow request
    };
  }
  
  // CORS middleware
  corsMiddleware() {
    return (req) => {
      const origin = req.headers.get('origin');
      const method = req.headers.get('access-control-request-method');
      const headers = req.headers.get('access-control-request-headers');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        const response = new Response(null, { status: 200 });
        
        if (this.cors.origin === '*' || this.cors.origin.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin || '*');
        }
        
        response.headers.set('Access-Control-Allow-Methods', this.cors.methods.join(', '));
        response.headers.set('Access-Control-Allow-Headers', this.cors.headers.join(', '));
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        
        return response;
      }
      
      return null; // Continue to next middleware
    };
  }
  
  // Security headers middleware
  securityHeadersMiddleware() {
    return (req) => {
      // This would be applied to the response
      return null;
    };
  }
  
  // Apply security headers to response
  applySecurityHeaders(response) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // CORS headers for non-preflight requests
    response.headers.set('Access-Control-Allow-Origin', this.cors.origin);
    response.headers.set('Access-Control-Allow-Methods', this.cors.methods ? this.cors.methods.join(', ') : 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', this.cors.headers ? this.cors.headers.join(', ') : 'Content-Type, Authorization');
    
    return response;
  }
  
  // Request validator middleware
  requestValidator(options = {}) {
    return (req) => {
      const url = new URL(req.url);
      
      // Validate URL path
      if (options.allowedPaths && !options.allowedPaths.some(path => url.pathname.startsWith(path))) {
        return new Response(JSON.stringify({
          error: 'Forbidden',
          message: 'Path not allowed'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validate request size
      const contentLength = req.headers.get('content-length');
      if (options.maxRequestSize && contentLength && parseInt(contentLength) > options.maxRequestSize) {
        return new Response(JSON.stringify({
          error: 'Request too large',
          message: `Maximum request size is ${options.maxRequestSize} bytes`
        }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return null; // Allow request
    };
  }
  
  // Clean up old rate limit entries
  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(ip);
      }
    }
  }
}

// DDoS protection
export class DDoSProtection {
  constructor(options = {}) {
    this.threshold = options.threshold || 1000; // requests per minute
    this.blacklist = new Set();
    this.suspiciousIPs = new Map();
  }
  
  middleware() {
    return (req) => {
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
      
      // Check blacklist
      if (this.blacklist.has(clientIP)) {
        return new Response(JSON.stringify({
          error: 'Blocked',
          message: 'IP address is blacklisted'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Track suspicious activity
      const now = Date.now();
      const suspicious = this.suspiciousIPs.get(clientIP);
      
      if (!suspicious) {
        this.suspiciousIPs.set(clientIP, { count: 1, firstSeen: now });
      } else {
        suspicious.count++;
        
        // Blacklist if threshold exceeded
        if (suspicious.count > this.threshold) {
          this.blacklist.add(clientIP);
          console.warn(`🚫 IP blacklisted due to suspicious activity: ${clientIP}`);
          
          return new Response(JSON.stringify({
            error: 'Blocked',
            message: 'Too many requests from this IP'
          }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return null; // Allow request
    };
  }
  
  cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Clean old suspicious IP entries
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.firstSeen > oneHour) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Input sanitizer
export class InputSanitizer {
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  static sanitizeJSON(obj) {
    if (typeof obj === 'string') {
      return this.sanitize(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeJSON(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitize(key)] = this.sanitizeJSON(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

export default {
  SecurityMiddleware,
  DDoSProtection,
  InputSanitizer
};
