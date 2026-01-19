#!/usr/bin/env bun

// @DEMO Advanced IoT & Edge Analytics Platform
// Complete IoT ecosystem with edge computing, real-time analytics, and device management

// IoT Device Manager
class IoTDeviceManager {
  constructor() {
    this.devices = new Map();
    this.deviceGroups = new Map();
    this.deviceTypes = new Map();
    this.telemetryData = new Map();
    this.commandQueue = new Map();
    this.deviceHealth = new Map();
    
    this.initializeDeviceTypes();
    this.setupDeviceGroups();
  }

  initializeDeviceTypes() {
    // Define supported device types
    this.deviceTypes.set('sensor', {
      name: 'Environmental Sensor',
      capabilities: ['temperature', 'humidity', 'pressure', 'air_quality'],
      dataRate: 1000, // ms
      powerConsumption: 0.1, // watts
      protocols: ['MQTT', 'HTTP', 'CoAP']
    });
    
    this.deviceTypes.set('camera', {
      name: 'Smart Camera',
      capabilities: ['video_stream', 'motion_detection', 'face_recognition', 'object_detection'],
      dataRate: 30, // fps
      powerConsumption: 5.0, // watts
      protocols: ['RTSP', 'WebRTC', 'HTTP']
    });
    
    this.deviceTypes.set('actuator', {
      name: 'Smart Actuator',
      capabilities: ['switch_control', 'dimming', 'motor_control', 'valve_control'],
      dataRate: 100, // ms
      powerConsumption: 2.0, // watts
      protocols: ['MQTT', 'Zigbee', 'Z-Wave']
    });
    
    this.deviceTypes.set('gateway', {
      name: 'IoT Gateway',
      capabilities: ['edge_processing', 'protocol_translation', 'data_aggregation', 'security'],
      dataRate: 500, // ms
      powerConsumption: 10.0, // watts
      protocols: ['MQTT', 'HTTP', 'CoAP', 'Zigbee', 'Z-Wave', 'LoRaWAN']
    });
    
    console.log('📱 Initialized IoT device types');
  }

  setupDeviceGroups() {
    // Create device groups for management
    this.deviceGroups.set('environmental', {
      name: 'Environmental Monitoring',
      devices: [],
      location: 'Building A',
      description: 'Temperature, humidity, and air quality sensors'
    });
    
    this.deviceGroups.set('security', {
      name: 'Security Systems',
      devices: [],
      location: 'Perimeter',
      description: 'Cameras and motion sensors'
    });
    
    this.deviceGroups.set('industrial', {
      name: 'Industrial Control',
      devices: [],
      location: 'Factory Floor',
      description: 'Actuators and control systems'
    });
    
    this.deviceGroups.set('edge_nodes', {
      name: 'Edge Computing Nodes',
      devices: [],
      location: 'Distributed',
      description: 'Gateway devices for edge processing'
    });
    
    console.log('🏗️ Setup device groups');
  }

  registerDevice(deviceConfig) {
    const device = {
      id: deviceConfig.id || this.generateDeviceId(),
      name: deviceConfig.name,
      type: deviceConfig.type,
      group: deviceConfig.group,
      location: deviceConfig.location,
      status: 'offline',
      lastSeen: null,
      capabilities: this.deviceTypes.get(deviceConfig.type)?.capabilities || [],
      protocols: this.deviceTypes.get(deviceConfig.type)?.protocols || [],
      metadata: deviceConfig.metadata || {},
      telemetry: {
        enabled: true,
        interval: this.deviceTypes.get(deviceConfig.type)?.dataRate || 1000,
        lastData: null
      },
      health: {
        battery: 100,
        signal: 100,
        errors: 0,
        uptime: 0
      }
    };
    
    this.devices.set(device.id, device);
    this.telemetryData.set(device.id, []);
    this.commandQueue.set(device.id, []);
    this.deviceHealth.set(device.id, []);
    
    // Add to device group
    if (device.group && this.deviceGroups.has(device.group)) {
      this.deviceGroups.get(device.group).devices.push(device.id);
    }
    
    console.log(`📱 Registered device: ${device.name} (${device.id})`);
    return device;
  }

  generateDeviceId() {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async connectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    console.log(`🔗 Connecting device: ${device.name}`);
    
    // Simulate device connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    device.status = 'online';
    device.lastSeen = Date.now();
    device.health.uptime = 0;
    
    // Start telemetry collection
    this.startTelemetryCollection(deviceId);
    
    console.log(`✅ Device connected: ${device.name}`);
    return device;
  }

  async disconnectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    console.log(`🔌 Disconnecting device: ${device.name}`);
    
    device.status = 'offline';
    device.lastSeen = Date.now();
    
    // Stop telemetry collection
    this.stopTelemetryCollection(deviceId);
    
    console.log(`✅ Device disconnected: ${device.name}`);
    return device;
  }

  startTelemetryCollection(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device || !device.telemetry.enabled) {
      return;
    }
    
    const interval = setInterval(async () => {
      if (device.status !== 'online') {
        clearInterval(interval);
        return;
      }
      
      const telemetry = await this.collectTelemetry(deviceId);
      this.storeTelemetry(deviceId, telemetry);
      
      // Update device health
      this.updateDeviceHealth(deviceId, telemetry);
      
    }, device.telemetry.interval);
    
    device.telemetry.intervalId = interval;
  }

  stopTelemetryCollection(deviceId) {
    const device = this.devices.get(deviceId);
    if (device && device.telemetry.intervalId) {
      clearInterval(device.telemetry.intervalId);
      device.telemetry.intervalId = null;
    }
  }

  async collectTelemetry(deviceId) {
    const device = this.devices.get(deviceId);
    const telemetry = {
      timestamp: Date.now(),
      deviceId: deviceId,
      data: {}
    };
    
    // Collect data based on device type and capabilities
    switch (device.type) {
      case 'sensor':
        telemetry.data = {
          temperature: 20 + Math.random() * 15,
          humidity: 40 + Math.random() * 30,
          pressure: 1000 + Math.random() * 50,
          air_quality: Math.random() * 100
        };
        break;
        
      case 'camera':
        telemetry.data = {
          motion_detected: Math.random() > 0.9,
          persons_detected: Math.floor(Math.random() * 5),
          objects_detected: Math.floor(Math.random() * 10),
          frame_rate: 30
        };
        break;
        
      case 'actuator':
        telemetry.data = {
          state: Math.random() > 0.5 ? 'on' : 'off',
          power_level: Math.random() * 100,
          position: Math.random() * 360,
          speed: Math.random() * 100
        };
        break;
        
      case 'gateway':
        telemetry.data = {
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          network_throughput: Math.random() * 1000,
          connected_devices: Math.floor(Math.random() * 50)
        };
        break;
    }
    
    device.telemetry.lastData = telemetry;
    return telemetry;
  }

  storeTelemetry(deviceId, telemetry) {
    const data = this.telemetryData.get(deviceId);
    data.push(telemetry);
    
    // Keep only last 1000 data points
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }
  }

  updateDeviceHealth(deviceId, telemetry) {
    const device = this.devices.get(deviceId);
    const health = this.deviceHealth.get(deviceId);
    
    // Update health metrics
    device.health.battery = Math.max(0, device.health.battery - Math.random() * 0.1);
    device.health.signal = Math.max(0, Math.min(100, device.health.signal + (Math.random() - 0.5) * 5));
    device.health.uptime += device.telemetry.interval / 1000;
    
    // Check for anomalies
    const anomalies = this.detectAnomalies(deviceId, telemetry);
    if (anomalies.length > 0) {
      device.health.errors += anomalies.length;
      console.warn(`⚠️ Anomalies detected for device ${deviceId}:`, anomalies);
    }
    
    // Store health data
    health.push({
      timestamp: Date.now(),
      battery: device.health.battery,
      signal: device.health.signal,
      errors: device.health.errors,
      uptime: device.health.uptime
    });
    
    // Keep only last 100 health records
    if (health.length > 100) {
      health.splice(0, health.length - 100);
    }
  }

  detectAnomalies(deviceId, telemetry) {
    const anomalies = [];
    const device = this.devices.get(deviceId);
    const data = this.telemetryData.get(deviceId);
    
    if (data.length < 10) {
      return anomalies; // Not enough data for anomaly detection
    }
    
    // Simple anomaly detection based on recent data
    const recentData = data.slice(-10);
    const averages = this.calculateAverages(recentData);
    
    for (const [key, value] of Object.entries(telemetry.data)) {
      if (typeof value === 'number' && averages[key]) {
        const deviation = Math.abs(value - averages[key]) / averages[key];
        
        if (deviation > 0.5) { // 50% deviation
          anomalies.push({
            type: 'statistical_anomaly',
            metric: key,
            value: value,
            expected: averages[key],
            deviation: deviation
          });
        }
      }
    }
    
    return anomalies;
  }

  calculateAverages(data) {
    const averages = {};
    
    data.forEach(record => {
      for (const [key, value] of Object.entries(record.data)) {
        if (typeof value === 'number') {
          if (!averages[key]) {
            averages[key] = [];
          }
          averages[key].push(value);
        }
      }
    });
    
    // Calculate average for each metric
    for (const key in averages) {
      const values = averages[key];
      averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return averages;
  }

  async sendCommand(deviceId, command) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    if (device.status !== 'online') {
      throw new Error(`Device ${deviceId} is not online`);
    }
    
    const commandObj = {
      id: this.generateCommandId(),
      deviceId: deviceId,
      command: command,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Add to command queue
    const queue = this.commandQueue.get(deviceId);
    queue.push(commandObj);
    
    // Simulate command execution
    setTimeout(() => {
      commandObj.status = 'completed';
      commandObj.completedAt = Date.now();
      console.log(`✅ Command executed for device ${deviceId}:`, command);
    }, 1000);
    
    return commandObj;
  }

  generateCommandId() {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    return {
      device: device,
      telemetry: this.telemetryData.get(deviceId).slice(-10), // Last 10 records
      health: this.deviceHealth.get(deviceId).slice(-10), // Last 10 records
      commands: this.commandQueue.get(deviceId).slice(-5) // Last 5 commands
    };
  }

  getGroupStatus(groupId) {
    const group = this.deviceGroups.get(groupId);
    if (!group) {
      throw new Error(`Device group ${groupId} not found`);
    }
    
    const devices = group.devices.map(deviceId => this.devices.get(deviceId));
    
    return {
      group: group,
      devices: devices,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      totalDevices: devices.length,
      healthScore: this.calculateGroupHealthScore(devices)
    };
  }

  calculateGroupHealthScore(devices) {
    if (devices.length === 0) return 0;
    
    const totalHealth = devices.reduce((sum, device) => {
      const health = device.health;
      return sum + (health.battery + health.signal) / 2;
    }, 0);
    
    return totalHealth / devices.length;
  }

  getSystemOverview() {
    const devices = Array.from(this.devices.values());
    
    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      offlineDevices: devices.filter(d => d.status === 'offline').length,
      deviceTypes: this.getDeviceTypeBreakdown(devices),
      deviceGroups: Array.from(this.deviceGroups.values()).map(group => ({
        name: group.name,
        deviceCount: group.devices.length,
        onlineDevices: group.devices.filter(id => this.devices.get(id)?.status === 'online').length
      })),
      systemHealth: this.calculateSystemHealth(devices)
    };
  }

  getDeviceTypeBreakdown(devices) {
    const breakdown = {};
    
    devices.forEach(device => {
      if (!breakdown[device.type]) {
        breakdown[device.type] = {
          total: 0,
          online: 0
        };
      }
      breakdown[device.type].total++;
      if (device.status === 'online') {
        breakdown[device.type].online++;
      }
    });
    
    return breakdown;
  }

  calculateSystemHealth(devices) {
    if (devices.length === 0) return 0;
    
    const totalHealth = devices.reduce((sum, device) => {
      return sum + (device.health.battery + device.health.signal) / 2;
    }, 0);
    
    return totalHealth / devices.length;
  }
}

// Edge Analytics Engine
class EdgeAnalyticsEngine {
  constructor() {
    this.streamProcessors = new Map();
    this.analyticsModels = new Map();
    this.alertRules = new Map();
    this.dataStreams = new Map();
    this.processedData = new Map();
    
    this.initializeAnalyticsModels();
    this.setupAlertRules();
  }

  initializeAnalyticsModels() {
    // Initialize analytics models for different data types
    this.analyticsModels.set('temperature', {
      name: 'Temperature Analysis',
      type: 'time_series',
      parameters: {
        window_size: 60, // seconds
        threshold: 5, // degrees
        trend_analysis: true
      }
    });
    
    this.analyticsModels.set('motion', {
      name: 'Motion Detection',
      type: 'computer_vision',
      parameters: {
        sensitivity: 0.7,
        object_classes: ['person', 'vehicle', 'animal'],
        tracking_enabled: true
      }
    });
    
    this.analyticsModels.set('energy', {
      name: 'Energy Consumption',
      type: 'predictive',
      parameters: {
        forecast_horizon: 3600, // seconds
        model_type: 'linear_regression',
        confidence_threshold: 0.8
      }
    });
    
    this.analyticsModels.set('anomaly', {
      name: 'Anomaly Detection',
      type: 'statistical',
      parameters: {
        method: 'isolation_forest',
        contamination: 0.1,
        window_size: 100
      }
    });
    
    console.log('📊 Initialized edge analytics models');
  }

  setupAlertRules() {
    // Setup alert rules for different conditions
    this.alertRules.set('high_temperature', {
      name: 'High Temperature Alert',
      condition: 'temperature > 35',
      severity: 'warning',
      cooldown: 300, // seconds
      enabled: true
    });
    
    this.alertRules.set('motion_detected', {
      name: 'Motion Detection Alert',
      condition: 'motion_detected == true',
      severity: 'info',
      cooldown: 60,
      enabled: true
    });
    
    this.alertRules.set('device_offline', {
      name: 'Device Offline Alert',
      condition: 'device_status == offline',
      severity: 'critical',
      cooldown: 0,
      enabled: true
    });
    
    this.alertRules.set('battery_low', {
      name: 'Low Battery Alert',
      condition: 'battery < 20',
      severity: 'warning',
      cooldown: 600,
      enabled: true
    });
    
    console.log('🚨 Setup alert rules');
  }

  createStreamProcessor(streamId, config) {
    const processor = {
      id: streamId,
      config: config,
      buffer: [],
      processing: false,
      lastProcessed: null,
      metrics: {
        processed: 0,
        errors: 0,
        alerts: 0
      }
    };
    
    this.streamProcessors.set(streamId, processor);
    console.log(`🔄 Created stream processor: ${streamId}`);
    
    return processor;
  }

  async processData(streamId, data) {
    const processor = this.streamProcessors.get(streamId);
    if (!processor) {
      throw new Error(`Stream processor ${streamId} not found`);
    }
    
    // Add data to buffer
    processor.buffer.push({
      data: data,
      timestamp: Date.now()
    });
    
    // Process if buffer is full or time-based trigger
    if (processor.buffer.length >= processor.config.batchSize || 
        (processor.lastProcessed && Date.now() - processor.lastProcessed > processor.config.maxWaitTime)) {
      await this.processBatch(streamId);
    }
    
    return { processed: true, streamId: streamId };
  }

  async processBatch(streamId) {
    const processor = this.streamProcessors.get(streamId);
    if (processor.processing || processor.buffer.length === 0) {
      return;
    }
    
    processor.processing = true;
    
    try {
      const batch = processor.buffer.splice(0, processor.config.batchSize);
      const results = [];
      
      for (const item of batch) {
        const result = await this.applyAnalytics(item.data, processor.config);
        results.push(result);
        
        // Check for alerts
        const alerts = this.checkAlerts(result);
        if (alerts.length > 0) {
          processor.metrics.alerts += alerts.length;
          await this.triggerAlerts(alerts);
        }
      }
      
      // Store processed data
      this.storeProcessedData(streamId, results);
      
      processor.metrics.processed += results.length;
      processor.lastProcessed = Date.now();
      
      console.log(`📊 Processed batch of ${results.length} items for stream ${streamId}`);
      
    } catch (error) {
      processor.metrics.errors++;
      console.error(`❌ Error processing batch for stream ${streamId}:`, error);
    } finally {
      processor.processing = false;
    }
  }

  async applyAnalytics(data, config) {
    const results = {
      originalData: data,
      processedData: {},
      analytics: {},
      timestamp: Date.now()
    };
    
    // Apply configured analytics models
    for (const modelId of config.models) {
      const model = this.analyticsModels.get(modelId);
      if (model) {
        const analysis = await this.runModel(model, data);
        results.analytics[modelId] = analysis;
      }
    }
    
    // Apply transformations
    if (config.transformations) {
      results.processedData = this.applyTransformations(data, config.transformations);
    }
    
    return results;
  }

  async runModel(model, data) {
    const result = {
      model: model.name,
      type: model.type,
      timestamp: Date.now(),
      results: {}
    };
    
    switch (model.type) {
      case 'time_series':
        result.results = this.runTimeSeriesAnalysis(data, model.parameters);
        break;
        
      case 'computer_vision':
        result.results = this.runComputerVision(data, model.parameters);
        break;
        
      case 'predictive':
        result.results = this.runPredictiveAnalysis(data, model.parameters);
        break;
        
      case 'statistical':
        result.results = this.runStatisticalAnalysis(data, model.parameters);
        break;
    }
    
    return result;
  }

  runTimeSeriesAnalysis(data, params) {
    // Simplified time series analysis
    const values = Array.isArray(data) ? data : [data];
    
    return {
      mean: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.calculateTrend(values),
      anomalies: this.detectAnomalies(values, params.threshold || 2)
    };
  }

  runComputerVision(data, params) {
    // Simplified computer vision analysis
    return {
      objects_detected: Math.floor(Math.random() * 5),
      motion_detected: Math.random() > 0.7,
      confidence: 0.8 + Math.random() * 0.2,
      bounding_boxes: this.generateBoundingBoxes(Math.floor(Math.random() * 3))
    };
  }

  runPredictiveAnalysis(data, params) {
    // Simplified predictive analysis
    const values = Array.isArray(data) ? data : [data];
    const trend = this.calculateTrend(values);
    const prediction = values[values.length - 1] + trend * 10;
    
    return {
      prediction: prediction,
      confidence: 0.7 + Math.random() * 0.3,
      horizon: params.forecast_horizon,
      model_type: params.model_type
    };
  }

  runStatisticalAnalysis(data, params) {
    // Simplified statistical analysis
    const values = Array.isArray(data) ? data : [data];
    
    return {
      mean: values.reduce((sum, val) => sum + val, 0) / values.length,
      std_dev: this.calculateStdDev(values),
      outliers: this.detectOutliers(values),
      distribution: 'normal'
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope;
  }

  calculateStdDev(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  detectAnomalies(values, threshold) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = this.calculateStdDev(values);
    
    return values.map((val, index) => ({
      index: index,
      value: val,
      is_anomaly: Math.abs(val - mean) > threshold * stdDev
    }));
  }

  detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    return values.map((val, index) => ({
      index: index,
      value: val,
      is_outlier: val < q1 - 1.5 * iqr || val > q3 + 1.5 * iqr
    }));
  }

  generateBoundingBoxes(count) {
    const boxes = [];
    for (let i = 0; i < count; i++) {
      boxes.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: 10 + Math.random() * 50,
        height: 10 + Math.random() * 50,
        confidence: 0.7 + Math.random() * 0.3
      });
    }
    return boxes;
  }

  applyTransformations(data, transformations) {
    const transformed = { ...data };
    
    transformations.forEach(transform => {
      switch (transform.type) {
        case 'normalize':
          transformed[transform.field] = this.normalize(data[transform.field]);
          break;
        case 'scale':
          transformed[transform.field] = data[transform.field] * transform.factor;
          break;
        case 'filter':
          transformed[transform.field] = this.filter(data[transform.field], transform.condition);
          break;
      }
    });
    
    return transformed;
  }

  normalize(value) {
    // Simple normalization to 0-1 range
    return Math.max(0, Math.min(1, value / 100));
  }

  filter(value, condition) {
    // Simple filter based on condition
    switch (condition.operator) {
      case '>':
        return value > condition.value ? value : null;
      case '<':
        return value < condition.value ? value : null;
      case '==':
        return value === condition.value ? value : null;
      default:
        return value;
    }
  }

  checkAlerts(results) {
    const alerts = [];
    
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      
      if (this.evaluateCondition(rule.condition, results)) {
        alerts.push({
          id: ruleId,
          name: rule.name,
          severity: rule.severity,
          condition: rule.condition,
          data: results,
          timestamp: Date.now()
        });
      }
    }
    
    return alerts;
  }

  evaluateCondition(condition, data) {
    // Simple condition evaluation
    try {
      // Extract values from data
      const context = {
        temperature: data.originalData?.temperature || data.analytics?.temperature?.results?.mean || 0,
        motion_detected: data.originalData?.motion_detected || data.analytics?.motion?.results?.motion_detected || false,
        device_status: data.originalData?.device_status || 'online',
        battery: data.originalData?.battery || 100
      };
      
      // Evaluate condition (simplified)
      if (condition.includes('temperature >')) {
        const temp = parseFloat(condition.split('>')[1]);
        return context.temperature > temp;
      }
      
      if (condition.includes('motion_detected')) {
        return context.motion_detected;
      }
      
      if (condition.includes('device_status')) {
        const status = condition.split('==')[1].trim();
        return context.device_status === status;
      }
      
      if (condition.includes('battery <')) {
        const battery = parseFloat(condition.split('<')[1]);
        return context.battery < battery;
      }
      
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  async triggerAlerts(alerts) {
    for (const alert of alerts) {
      console.log(`🚨 ALERT: ${alert.name} (${alert.severity.toUpperCase()})`);
      console.log(`   Condition: ${alert.condition}`);
      console.log(`   Timestamp: ${new Date(alert.timestamp).toISOString()}`);
      
      // Here you would send alerts to various channels
      // email, SMS, webhook, etc.
    }
  }

  storeProcessedData(streamId, results) {
    if (!this.processedData.has(streamId)) {
      this.processedData.set(streamId, []);
    }
    
    const data = this.processedData.get(streamId);
    data.push(...results);
    
    // Keep only last 1000 processed records
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }
  }

  getStreamMetrics(streamId) {
    const processor = this.streamProcessors.get(streamId);
    if (!processor) {
      throw new Error(`Stream processor ${streamId} not found`);
    }
    
    return {
      streamId: streamId,
      metrics: processor.metrics,
      bufferSize: processor.buffer.length,
      lastProcessed: processor.lastProcessed,
      processing: processor.processing
    };
  }

  getSystemMetrics() {
    const processors = Array.from(this.streamProcessors.values());
    
    return {
      totalStreams: this.streamProcessors.size,
      activeStreams: processors.filter(p => p.processing).length,
      totalProcessed: processors.reduce((sum, p) => sum + p.metrics.processed, 0),
      totalErrors: processors.reduce((sum, p) => sum + p.metrics.errors, 0),
      totalAlerts: processors.reduce((sum, p) => sum + p.metrics.alerts, 0),
      models: this.analyticsModels.size,
      alertRules: this.alertRules.size
    };
  }
}

// IoT Edge Analytics Server
class IoTEdgeAnalyticsServer {
  constructor(port = 3012) {
    this.port = port;
    this.deviceManager = new IoTDeviceManager();
    this.analyticsEngine = new EdgeAnalyticsEngine();
    this.server = null;
    
    this.initializeDemoDevices();
  }

  initializeDemoDevices() {
    // Create demo devices for testing
    const demoDevices = [
      {
        name: 'Temperature Sensor 1',
        type: 'sensor',
        group: 'environmental',
        location: 'Room 101'
      },
      {
        name: 'Security Camera 1',
        type: 'camera',
        group: 'security',
        location: 'Entrance'
      },
      {
        name: 'Smart Light 1',
        type: 'actuator',
        group: 'industrial',
        location: 'Hallway'
      },
      {
        name: 'Edge Gateway 1',
        type: 'gateway',
        group: 'edge_nodes',
        location: 'Building A'
      }
    ];
    
    demoDevices.forEach(config => {
      const device = this.deviceManager.registerDevice(config);
      this.deviceManager.connectDevice(device.id);
    });
    
    // Create analytics streams
    this.analyticsEngine.createStreamProcessor('environmental', {
      batchSize: 10,
      maxWaitTime: 5000,
      models: ['temperature', 'anomaly'],
      transformations: [
        { type: 'normalize', field: 'temperature' }
      ]
    });
    
    this.analyticsEngine.createStreamProcessor('security', {
      batchSize: 5,
      maxWaitTime: 2000,
      models: ['motion'],
      transformations: []
    });
    
    console.log('🏭 Initialized demo IoT devices and analytics streams');
  }

  start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });
    
    console.log(`🏭 IoT Edge Analytics Server running at http://localhost:${this.port}`);
    
    // Start data simulation
    this.startDataSimulation();
  }

  startDataSimulation() {
    // Simulate real-time data from devices
    setInterval(async () => {
      const devices = Array.from(this.deviceManager.devices.values())
        .filter(d => d.status === 'online');
      
      for (const device of devices) {
        const telemetry = await this.deviceManager.collectTelemetry(device.id);
        
        // Send to analytics engine
        if (device.group === 'environmental') {
          await this.analyticsEngine.processData('environmental', telemetry.data);
        } else if (device.group === 'security') {
          await this.analyticsEngine.processData('security', telemetry.data);
        }
      }
    }, 2000);
  }

  async handleRequest(req) {
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(this.getIoTAnalyticsHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        
        case '/api/devices':
          const overview = this.deviceManager.getSystemOverview();
          return Response.json(overview);
        
        case '/api/device':
          const deviceId = url.searchParams.get('id');
          if (deviceId) {
            const status = this.deviceManager.getDeviceStatus(deviceId);
            return Response.json(status);
          }
          break;
        
        case '/api/groups':
          const groupId = url.searchParams.get('id');
          if (groupId) {
            const groupStatus = this.deviceManager.getGroupStatus(groupId);
            return Response.json(groupStatus);
          }
          break;
        
        case '/api/analytics/metrics':
          const metrics = this.analyticsEngine.getSystemMetrics();
          return Response.json(metrics);
        
        case '/api/analytics/stream':
          const streamId = url.searchParams.get('id');
          if (streamId) {
            const streamMetrics = this.analyticsEngine.getStreamMetrics(streamId);
            return Response.json(streamMetrics);
          }
          break;
        
        case '/api/device/command':
          if (req.method === 'POST') {
            const { deviceId, command } = await req.json();
            const result = await this.deviceManager.sendCommand(deviceId, command);
            return Response.json(result);
          }
          break;
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('IoT Edge Analytics server error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  getIoTAnalyticsHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>@DEMO IoT Edge Analytics Platform</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 2.5em; color: #10b981; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .card h3 { color: #10b981; margin-top: 0; }
        .metric { font-size: 2em; font-weight: bold; color: #34d399; margin: 10px 0; }
        .button { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 5px; }
        .button:hover { background: #059669; }
        .device-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.9em; }
        .device-status.online { background: #22c55e; color: white; }
        .device-status.offline { background: #ef4444; color: white; }
        .telemetry-data { background: #0f172a; padding: 10px; border-radius: 6px; margin: 10px 0; font-family: monospace; font-size: 0.9em; }
        .analytics-chart { background: #1e293b; padding: 15px; border-radius: 8px; margin: 10px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏭 IoT Edge Analytics Platform</h1>
            <p>Real-time IoT device management and edge analytics</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📱 Device Management</h3>
                <div class="metric" id="total-devices">0</div>
                <div>Total Devices</div>
                <div class="metric" id="online-devices">0</div>
                <div>Online Devices</div>
                <div>
                    <button class="button" onclick="refreshDevices()">Refresh Devices</button>
                    <button class="button" onclick="addDevice()">Add Device</button>
                </div>
                <div class="telemetry-data" id="device-list">Loading devices...</div>
            </div>
            
            <div class="card">
                <h3>📊 Edge Analytics</h3>
                <div class="metric" id="processed-streams">0</div>
                <div>Processed Streams</div>
                <div class="metric" id="analytics-alerts">0</div>
                <div>Analytics Alerts</div>
                <div>
                    <button class="button" onclick="refreshAnalytics()">Refresh Analytics</button>
                    <button class="button" onclick="viewMetrics()">View Metrics</button>
                </div>
                <div class="telemetry-data" id="analytics-status">Analytics engine ready</div>
            </div>
            
            <div class="card">
                <h3>📈 Real-time Telemetry</h3>
                <div class="metric" id="data-points">0</div>
                <div>Data Points</div>
                <div class="metric" id="update-rate">2s</div>
                <div>Update Rate</div>
                <div>
                    <button class="button" onclick="startTelemetry()">Start Telemetry</button>
                    <button class="button" onclick="stopTelemetry()">Stop Telemetry</button>
                </div>
                <div class="telemetry-data" id="telemetry-data">Waiting for data...</div>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 Device Groups</h3>
            <div id="device-groups">
                <div>Loading device groups...</div>
            </div>
        </div>
        
        <div class="card">
            <h3>📈 Analytics Visualization</h3>
            <div class="analytics-chart" id="analytics-chart">
                <canvas id="telemetry-chart" width="400" height="200"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        let telemetryInterval = null;
        let dataPoints = 0;
        
        async function refreshDevices() {
            try {
                const response = await fetch('/api/devices');
                const overview = await response.json();
                
                document.getElementById('total-devices').textContent = overview.totalDevices;
                document.getElementById('online-devices').textContent = overview.onlineDevices;
                
                const deviceList = document.getElementById('device-list');
                deviceList.innerHTML = overview.deviceTypes.map(type => 
                    \`<div>📱 \${type}: \${type.online}/\${type.total} online</div>\`
                ).join('');
                
            } catch (error) {
                document.getElementById('device-list').textContent = 'Failed to load devices';
            }
        }
        
        async function refreshAnalytics() {
            try {
                const response = await fetch('/api/analytics/metrics');
                const metrics = await response.json();
                
                document.getElementById('processed-streams').textContent = metrics.totalProcessed;
                document.getElementById('analytics-alerts').textContent = metrics.totalAlerts;
                
                document.getElementById('analytics-status').innerHTML = \`
                    <div>🔄 Active Streams: \${metrics.activeStreams}</div>
                    <div>📊 Total Streams: \${metrics.totalStreams}</div>
                    <div>🤖 Models: \${metrics.models}</div>
                    <div>🚨 Alert Rules: \${metrics.alertRules}</div>
                \`;
                
            } catch (error) {
                document.getElementById('analytics-status').textContent = 'Failed to load analytics';
            }
        }
        
        function addDevice() {
            const status = document.getElementById('device-list');
            status.textContent = 'Adding new device...';
            
            setTimeout(() => {
                status.textContent = '✅ New device added successfully';
                refreshDevices();
            }, 1500);
        }
        
        function viewMetrics() {
            const status = document.getElementById('analytics-status');
            status.innerHTML = \`
                <div>📊 Stream Processing: Real-time</div>
                <div>🤖 ML Models: 4 active</div>
                <div>📈 Data Rate: 1000 msg/sec</div>
                <div>⚡ Latency: <50ms</div>
                <div>🎯 Accuracy: 95%</div>
            \`;
        }
        
        function startTelemetry() {
            if (telemetryInterval) return;
            
            telemetryInterval = setInterval(async () => {
                dataPoints++;
                document.getElementById('data-points').textContent = dataPoints;
                
                // Simulate telemetry data
                const telemetry = {
                    temperature: 20 + Math.random() * 10,
                    humidity: 40 + Math.random() * 20,
                    timestamp: new Date().toISOString()
                };
                
                const dataDiv = document.getElementById('telemetry-data');
                dataDiv.innerHTML = \`
                    <div>🌡️ Temperature: \${telemetry.temperature.toFixed(1)}°C</div>
                    <div>💧 Humidity: \${telemetry.humidity.toFixed(1)}%</div>
                    <div>⏰ \${telemetry.timestamp}</div>
                \`;
                
                // Update chart
                updateChart(telemetry);
                
            }, 2000);
            
            document.getElementById('telemetry-data').textContent = 'Telemetry started...';
        }
        
        function stopTelemetry() {
            if (telemetryInterval) {
                clearInterval(telemetryInterval);
                telemetryInterval = null;
                document.getElementById('telemetry-data').textContent = 'Telemetry stopped';
            }
        }
        
        function updateChart(data) {
            const canvas = document.getElementById('telemetry-chart');
            const ctx = canvas.getContext('2d');
            
            // Simple chart drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw temperature line
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - (data.temperature / 40) * canvas.height);
            ctx.lineTo(canvas.width, canvas.height - (data.temperature / 40) * canvas.height);
            ctx.stroke();
            
            // Draw humidity line
            ctx.strokeStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - (data.humidity / 100) * canvas.height);
            ctx.lineTo(canvas.width, canvas.height - (data.humidity / 100) * canvas.height);
            ctx.stroke();
        }
        
        async function loadDeviceGroups() {
            try {
                const groupsDiv = document.getElementById('device-groups');
                groupsDiv.innerHTML = \`
                    <div>🏗️ Environmental Monitoring: 2 devices (2 online)</div>
                    <div>🔒 Security Systems: 1 device (1 online)</div>
                    <div>⚙️ Industrial Control: 1 device (1 online)</div>
                    <div>🌐 Edge Computing: 1 device (1 online)</div>
                \`;
            } catch (error) {
                document.getElementById('device-groups').textContent = 'Failed to load device groups';
            }
        }
        
        // Initialize
        refreshDevices();
        refreshAnalytics();
        loadDeviceGroups();
        startTelemetry();
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            refreshDevices();
            refreshAnalytics();
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
class IoTAnalyticsDemo {
  static async runDemo() {
    console.log('🏭 Running IoT Edge Analytics Demo...');
    
    const deviceManager = new IoTDeviceManager();
    const analyticsEngine = new EdgeAnalyticsEngine();
    
    // Demo device registration
    console.log('📱 Registering IoT devices...');
    const sensor = deviceManager.registerDevice({
      name: 'Demo Temperature Sensor',
      type: 'sensor',
      group: 'environmental',
      location: 'Demo Room'
    });
    
    const camera = deviceManager.registerDevice({
      name: 'Demo Security Camera',
      type: 'camera',
      group: 'security',
      location: 'Demo Entrance'
    });
    
    // Connect devices
    await deviceManager.connectDevice(sensor.id);
    await deviceManager.connectDevice(camera.id);
    
    console.log('✅ Devices connected');
    
    // Demo analytics
    console.log('📊 Setting up analytics...');
    analyticsEngine.createStreamProcessor('demo-stream', {
      batchSize: 5,
      maxWaitTime: 3000,
      models: ['temperature', 'anomaly'],
      transformations: []
    });
    
    // Process some sample data
    const sampleData = {
      temperature: 25.5,
      humidity: 60.2,
      timestamp: Date.now()
    };
    
    const result = await analyticsEngine.processData('demo-stream', sampleData);
    console.log('✅ Data processed:', result);
    
    // Demo device commands
    console.log('🎮 Sending device commands...');
    const command = await deviceManager.sendCommand(sensor.id, {
      action: 'set_interval',
      value: 5000
    });
    console.log('✅ Command sent:', command.id);
    
    // Get system overview
    const overview = deviceManager.getSystemOverview();
    console.log('📊 System Overview:', overview);
    
    return {
      deviceManager,
      analyticsEngine,
      devices: [sensor, camera],
      overview
    };
  }
}

export {
  IoTDeviceManager,
  EdgeAnalyticsEngine,
  IoTEdgeAnalyticsServer,
  IoTAnalyticsDemo
};

export default {
  IoTDeviceManager,
  EdgeAnalyticsEngine,
  IoTEdgeAnalyticsServer,
  IoTAnalyticsDemo
};
