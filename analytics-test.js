#!/usr/bin/env bun

// @DEMO Analytics Test Server
// Simple test for AI analytics functionality

console.log('🧠 Testing AI Analytics Dashboard...');

// Test neural network engine
import { NeuralNetworkEngine, ModelFactory } from './neural-network-engine.js';

// Test AutoML pipeline
import { AutoMLPipeline, MLDemo } from './ml-pipeline.js';

// Test analytics dashboard
import { AIAnalyticsDashboard } from './ai-analytics-dashboard.js';

async function runTests() {
  console.log('🎯 Running AI/ML Tests...');
  
  try {
    // Test 1: Neural Network Engine
    console.log('\n📊 Test 1: Neural Network Engine');
    const nn = ModelFactory.createMLP(5, [16, 8], 2, 'relu');
    console.log('✅ Neural network created with architecture:');
    nn.getModelSummary();
    
    // Test 2: AutoML Pipeline
    console.log('\n🤖 Test 2: AutoML Pipeline');
    const automlResult = await MLDemo.runClassificationDemo();
    console.log(`✅ AutoML completed with test accuracy: ${(automlResult.testAccuracy * 100).toFixed(2)}%`);
    
    // Test 3: Analytics Dashboard
    console.log('\n📈 Test 3: Analytics Dashboard');
    const dashboard = new AIAnalyticsDashboard();
    console.log('✅ Analytics dashboard initialized');
    
    // Wait for some data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate report
    const report = dashboard.generateReport();
    console.log('✅ Analytics report generated:');
    console.log(`   - System Health: ${report.systemHealth.score}% (${report.systemHealth.status})`);
    console.log(`   - Active Metrics: ${report.summary.totalMetrics}`);
    console.log(`   - Recent Anomalies: ${report.summary.totalAnomalies}`);
    console.log(`   - AI Insights: ${report.summary.totalInsights}`);
    
    console.log('\n🎉 All AI/ML tests completed successfully!');
    
    return {
      neuralNetwork: nn,
      automlResult,
      dashboard,
      report
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
runTests().then(results => {
  console.log('\n🏆 AI/ML Test Results:');
  console.log('🧠 Neural Network: ✅ Working');
  console.log('🤖 AutoML Pipeline: ✅ Working');
  console.log('📊 Analytics Dashboard: ✅ Working');
  console.log('\n🚀 All AI/ML features are operational!');
}).catch(error => {
  console.error('💥 AI/ML test failed:', error);
  process.exit(1);
});
