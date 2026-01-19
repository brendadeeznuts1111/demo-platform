#!/usr/bin/env bun

// @DEMO AI-Powered Analytics Engine
// Advanced machine learning and predictive analytics

// Neural Network Implementation for Anomaly Detection
class NeuralNetwork {
  constructor(layers) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    this.learningRate = 0.01;
    
    // Initialize weights and biases
    for (let i = 0; i < layers.length - 1; i++) {
      this.weights.push(this.randomMatrix(layers[i + 1], layers[i]));
      this.biases.push(this.randomMatrix(layers[i + 1], 1));
    }
  }

  randomMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() - 0.5) * 2;
      }
    }
    return matrix;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  sigmoidDerivative(x) {
    const s = this.sigmoid(x);
    return s * (1 - s);
  }

  forward(input) {
    this.activations = [input];
    let current = input;
    
    for (let i = 0; i < this.weights.length; i++) {
      current = this.matrixMultiply(this.weights[i], current);
      current = this.matrixAdd(current, this.biases[i]);
      current = current.map(val => this.sigmoid(val));
      this.activations.push(current);
    }
    
    return current;
  }

  backward(target) {
    const output = this.activations[this.activations.length - 1];
    const error = this.matrixSubtract(target, output);
    
    let delta = error.map((val, i) => 
      val * this.sigmoidDerivative(this.activations[this.activations.length - 1][i])
    );
    
    for (let i = this.weights.length - 1; i >= 0; i--) {
      const activation = this.activations[i];
      const weightGradient = this.matrixMultiply(delta, this.transpose(activation));
      
      // Update weights
      this.weights[i] = this.weights[i].map((row, r) =>
        row.map((val, c) => val + this.learningRate * weightGradient[r][c])
      );
      
      // Update biases
      this.biases[i] = this.biases[i].map((val, i) => val + this.learningRate * delta[i][0]);
      
      if (i > 0) {
        const nextDelta = [];
        for (let j = 0; j < this.weights[i][0].length; j++) {
          let sum = 0;
          for (let k = 0; k < delta.length; k++) {
            sum += delta[k][0] * this.weights[i][k][j];
          }
          nextDelta.push([sum * this.sigmoidDerivative(this.activations[i][j])]);
        }
        delta = nextDelta;
      }
    }
  }

  train(inputs, targets, epochs) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i].map(val => [val]);
        const target = targets[i].map(val => [val]);
        
        this.forward(input);
        this.backward(target);
      }
    }
  }

  predict(input) {
    const result = this.forward(input.map(val => [val]));
    return result.map(val => val[0]);
  }

  matrixMultiply(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < a[0].length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  matrixAdd(a, b) {
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  }

  matrixSubtract(a, b) {
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
  }

  transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }
}

// Advanced Anomaly Detection System
class AnomalyDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 2.0; // Standard deviations
    this.windowSize = options.windowSize || 100;
    this.model = new NeuralNetwork([10, 8, 6, 1]);
    this.isTrained = false;
    this.dataHistory = [];
    this.anomalies = [];
    this.maxHistorySize = options.maxHistorySize || 10000;
  }

  addDataPoint(data) {
    const timestamp = Date.now();
    const normalizedData = this.normalizeData(data);
    
    this.dataHistory.push({
      timestamp,
      data: normalizedData,
      original: data
    });

    if (this.dataHistory.length > this.maxHistorySize) {
      this.dataHistory.shift();
    }

    return this.detectAnomaly(normalizedData, timestamp);
  }

  normalizeData(data) {
    // Normalize data to 0-1 range
    const features = [
      data.cpu || 0,
      data.memory || 0,
      data.requests || 0,
      data.connections || 0,
      data.responseTime || 0,
      data.errorRate || 0,
      data.throughput || 0,
      data.latency || 0,
      data.diskUsage || 0,
      data.networkIO || 0
    ];

    return features.map(val => Math.min(1, Math.max(0, val / 100)));
  }

  detectAnomaly(data, timestamp) {
    if (!this.isTrained && this.dataHistory.length >= this.windowSize) {
      this.trainModel();
    }

    if (!this.isTrained) {
      return { isAnomaly: false, confidence: 0, score: 0 };
    }

    const prediction = this.model.predict(data);
    const reconstructionError = this.calculateReconstructionError(data, prediction);
    
    const isAnomaly = reconstructionError > this.threshold;
    const confidence = Math.min(1, reconstructionError / this.threshold);
    
    if (isAnomaly) {
      this.anomalies.push({
        timestamp,
        score: reconstructionError,
        confidence,
        data: this.dataHistory[this.dataHistory.length - 1].original
      });
    }

    return {
      isAnomaly,
      confidence,
      score: reconstructionError,
      threshold: this.threshold
    };
  }

  calculateReconstructionError(original, reconstructed) {
    let error = 0;
    for (let i = 0; i < original.length; i++) {
      error += Math.pow(original[i] - reconstructed[i], 2);
    }
    return Math.sqrt(error / original.length);
  }

  trainModel() {
    if (this.dataHistory.length < this.windowSize) return;

    const trainingData = this.dataHistory.slice(-this.windowSize).map(d => d.data);
    
    // Autoencoder training - input equals target
    this.model.train(trainingData, trainingData, 100);
    this.isTrained = true;
  }

  getAnomalies(timeRange = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeRange;
    return this.anomalies.filter(a => a.timestamp > cutoff);
  }

  getAnomalyStats() {
    const recentAnomalies = this.getAnomalies();
    
    return {
      totalAnomalies: this.anomalies.length,
      recentAnomalies: recentAnomalies.length,
      anomalyRate: this.dataHistory.length > 0 
        ? (recentAnomalies.length / Math.min(this.dataHistory.length, 100)) * 100 
        : 0,
      averageScore: recentAnomalies.length > 0
        ? recentAnomalies.reduce((sum, a) => sum + a.score, 0) / recentAnomalies.length
        : 0,
      modelTrained: this.isTrained
    };
  }
}

// Predictive Analytics Engine
class PredictiveAnalytics {
  constructor(options = {}) {
    this.horizon = options.horizon || 3600000; // 1 hour prediction horizon
    this.models = {};
    this.dataBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 10000;
  }

  addMetric(name, value, timestamp = Date.now()) {
    this.dataBuffer.push({ name, value, timestamp });
    
    if (this.dataBuffer.length > this.maxBufferSize) {
      this.dataBuffer.shift();
    }

    // Update model for this metric
    this.updateModel(name);
  }

  updateModel(metricName) {
    const metricData = this.dataBuffer
      .filter(d => d.name === metricName)
      .slice(-100); // Use last 100 data points

    if (metricData.length < 10) return;

    // Simple linear regression for prediction
    const model = this.linearRegression(metricData);
    this.models[metricName] = model;
  }

  linearRegression(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept, r2: this.calculateR2(data, slope, intercept) };
  }

  calculateR2(data, slope, intercept) {
    const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    let ssTotal = 0, ssResidual = 0;

    data.forEach((point, index) => {
      const predicted = slope * index + intercept;
      ssTotal += Math.pow(point.value - mean, 2);
      ssResidual += Math.pow(point.value - predicted, 2);
    });

    return 1 - (ssResidual / ssTotal);
  }

  predict(metricName, stepsAhead = 10) {
    const model = this.models[metricName];
    if (!model) return null;

    const metricData = this.dataBuffer
      .filter(d => d.name === metricName)
      .slice(-1);

    if (metricData.length === 0) return null;

    const lastIndex = this.dataBuffer
      .filter(d => d.name === metricName)
      .length - 1;

    const predictions = [];
    for (let i = 1; i <= stepsAhead; i++) {
      const predictedValue = model.slope * (lastIndex + i) + model.intercept;
      predictions.push({
        step: i,
        value: Math.max(0, predictedValue), // Ensure non-negative
        confidence: Math.max(0, model.r2)
      });
    }

    return {
      metric: metricName,
      predictions,
      model: {
        slope: model.slope,
        intercept: model.intercept,
        r2: model.r2
      }
    };
  }

  getAllPredictions(stepsAhead = 10) {
    const metrics = [...new Set(this.dataBuffer.map(d => d.name))];
    const predictions = {};

    metrics.forEach(metric => {
      const prediction = this.predict(metric, stepsAhead);
      if (prediction) {
        predictions[metric] = prediction;
      }
    });

    return predictions;
  }
}

// Advanced Performance Analyzer
class PerformanceAnalyzer {
  constructor(options = {}) {
    this.metrics = new Map();
    this.benchmarks = new Map();
    this.alertThresholds = options.alertThresholds || {};
    this.analysisInterval = options.analysisInterval || 60000; // 1 minute
    this.trends = new Map();
    
    this.startAnalysis();
  }

  recordMetric(name, value, tags = {}) {
    const key = this.createKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        tags,
        values: [],
        min: value,
        max: value,
        sum: value,
        count: 1,
        avg: value,
        trend: 'stable'
      });
    } else {
      const metric = this.metrics.get(key);
      metric.values.push({ value, timestamp: Date.now() });
      
      // Keep only last 1000 values
      if (metric.values.length > 1000) {
        metric.values.shift();
      }
      
      metric.min = Math.min(metric.min, value);
      metric.max = Math.max(metric.max, value);
      metric.sum += value;
      metric.count++;
      metric.avg = metric.sum / metric.count;
    }
  }

  createKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagString}}`;
  }

  analyzeTrends() {
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.values.length < 10) continue;

      const recent = metric.values.slice(-10);
      const older = metric.values.slice(-20, -10);

      if (older.length === 0) continue;

      const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (change > 10) {
        metric.trend = 'increasing';
      } else if (change < -10) {
        metric.trend = 'decreasing';
      } else {
        metric.trend = 'stable';
      }

      // Check for alerts
      this.checkAlerts(key, metric, recentAvg);
    }
  }

  checkAlerts(key, metric, currentValue) {
    const threshold = this.alertThresholds[metric.name];
    if (!threshold) return;

    if (threshold.max && currentValue > threshold.max) {
      this.triggerAlert('high', key, metric, currentValue, threshold.max);
    } else if (threshold.min && currentValue < threshold.min) {
      this.triggerAlert('low', key, metric, currentValue, threshold.min);
    }
  }

  triggerAlert(type, key, metric, value, threshold) {
    console.warn(`ALERT: ${metric.name} ${type} - Current: ${value}, Threshold: ${threshold}`);
    
    // In a real implementation, this would send notifications
    // to monitoring systems, Slack, email, etc.
  }

  startAnalysis() {
    setInterval(() => {
      this.analyzeTrends();
    }, this.analysisInterval);
  }

  getAnalysis() {
    const results = {};
    
    for (const [key, metric] of this.metrics.entries()) {
      results[key] = {
        name: metric.name,
        tags: metric.tags,
        current: metric.avg,
        min: metric.min,
        max: metric.max,
        trend: metric.trend,
        sampleCount: metric.count
      };
    }

    return results;
  }

  setBenchmark(name, value) {
    this.benchmarks.set(name, {
      value,
      timestamp: Date.now()
    });
  }

  compareWithBenchmark(name, currentValue) {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) return null;

    const change = ((currentValue - benchmark.value) / benchmark.value) * 100;
    
    return {
      benchmark: benchmark.value,
      current: currentValue,
      change: change.toFixed(2) + '%',
      improved: change > 0
    };
  }
}

// AI-Powered Recommendations Engine
class RecommendationEngine {
  constructor(options = {}) {
    this.rules = options.rules || [];
    this.recommendations = [];
    this.maxRecommendations = options.maxRecommendations || 50;
  }

  analyzeSystem(metrics) {
    this.recommendations = [];

    // Performance recommendations
    if (metrics.cpu && metrics.cpu > 80) {
      this.addRecommendation('performance', 'high_cpu', {
        priority: 'high',
        message: 'CPU usage is above 80%. Consider scaling up or optimizing processes.',
        actions: [
          'Scale horizontally by adding more instances',
          'Profile and optimize CPU-intensive operations',
          'Implement caching to reduce computational load'
        ]
      });
    }

    if (metrics.memory && metrics.memory > 85) {
      this.addRecommendation('performance', 'high_memory', {
        priority: 'high',
        message: 'Memory usage is above 85%. Risk of memory leaks.',
        actions: [
          'Check for memory leaks in the application',
          'Implement memory pooling',
          'Consider increasing available memory'
        ]
      });
    }

    // Security recommendations
    if (metrics.blockedRequests && metrics.blockedRequests > 100) {
      this.addRecommendation('security', 'high_blocked_requests', {
        priority: 'medium',
        message: 'High number of blocked requests detected.',
        actions: [
          'Review security logs for attack patterns',
          'Consider tightening rate limiting',
          'Implement IP whitelisting for legitimate traffic'
        ]
      });
    }

    // Reliability recommendations
    if (metrics.errorRate && metrics.errorRate > 5) {
      this.addRecommendation('reliability', 'high_error_rate', {
        priority: 'high',
        message: 'Error rate is above 5%. Service reliability at risk.',
        actions: [
          'Investigate error logs for root cause',
          'Implement circuit breaker pattern',
          'Add retry logic for transient failures'
        ]
      });
    }

    return this.getRecommendations();
  }

  addRecommendation(category, type, recommendation) {
    this.recommendations.push({
      id: `${category}_${type}_${Date.now()}`,
      category,
      type,
      timestamp: Date.now(),
      ...recommendation
    });

    if (this.recommendations.length > this.maxRecommendations) {
      this.recommendations.shift();
    }
  }

  getRecommendations(category = null) {
    let filtered = this.recommendations;
    
    if (category) {
      filtered = filtered.filter(r => r.category === category);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  dismissRecommendation(id) {
    const index = this.recommendations.findIndex(r => r.id === id);
    if (index !== -1) {
      this.recommendations.splice(index, 1);
    }
  }
}

// Export all AI analytics components
export {
  NeuralNetwork,
  AnomalyDetector,
  PredictiveAnalytics,
  PerformanceAnalyzer,
  RecommendationEngine
};

export default {
  NeuralNetwork,
  AnomalyDetector,
  PredictiveAnalytics,
  PerformanceAnalyzer,
  RecommendationEngine
};
