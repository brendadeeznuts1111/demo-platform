#!/usr/bin/env bun

// @DEMO Advanced Machine Learning Pipeline
// Complete ML workflow automation for enterprise applications

import { NeuralNetworkEngine, ModelFactory } from './neural-network-engine.js';

// Data Preprocessing Pipeline
class DataPreprocessor {
  constructor() {
    this.scalers = {};
    this.encoders = {};
    this.featureSelectors = {};
    this.transformers = {};
  }

  // Feature scaling
  normalize(data, method = 'minmax') {
    switch (method) {
      case 'minmax':
        return this.minMaxScale(data);
      case 'standard':
        return this.standardScale(data);
      case 'robust':
        return this.robustScale(data);
      default:
        return data;
    }
  }

  minMaxScale(data) {
    const scaled = [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    for (let i = 0; i < data.length; i++) {
      scaled.push((data[i] - min) / range);
    }
    
    this.scalers.minmax = { min, max, range };
    return scaled;
  }

  standardScale(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    const scaled = data.map(x => (x - mean) / std);
    
    this.scalers.standard = { mean, std };
    return scaled;
  }

  robustScale(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const iqr = q3 - q1;
    
    const scaled = data.map(x => (x - median) / iqr);
    
    this.scalers.robust = { median, iqr };
    return scaled;
  }

  // Feature engineering
  createPolynomialFeatures(data, degree = 2) {
    const features = [...data];
    
    for (let d = 2; d <= degree; d++) {
      for (let i = 0; i < data.length; i++) {
        features.push(Math.pow(data[i], d));
      }
    }
    
    return features;
  }

  createInteractionFeatures(data1, data2) {
    const interactions = [];
    
    for (let i = 0; i < data1.length; i++) {
      interactions.push(data1[i] * data2[i]);
    }
    
    return interactions;
  }

  // Dimensionality reduction
  pca(data, nComponents = 2) {
    const mean = this.calculateMean(data);
    const centered = this.centerData(data, mean);
    const covariance = this.calculateCovariance(centered);
    const eigen = this.calculateEigenDecomposition(covariance);
    
    // Select top nComponents
    const topComponents = eigen.values
      .map((val, idx) => ({ value: val, vector: eigen.vectors[idx] }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, nComponents);
    
    // Transform data
    const transformed = centered.map(sample => 
      topComponents.map(comp => 
        sample.reduce((sum, val, idx) => sum + val * comp.vector[idx], 0)
      )
    );
    
    this.transformers.pca = { components: topComponents, mean };
    return transformed;
  }

  calculateMean(data) {
    const means = [];
    
    for (let j = 0; j < data[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i][j];
      }
      means.push(sum / data.length);
    }
    
    return means;
  }

  centerData(data, mean) {
    return data.map(sample => 
      sample.map((val, idx) => val - mean[idx])
    );
  }

  calculateCovariance(data) {
    const n = data.length;
    const m = data[0].length;
    const covariance = Array(m).fill(null).map(() => Array(m).fill(0));
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += data[k][i] * data[k][j];
        }
        covariance[i][j] = sum / (n - 1);
      }
    }
    
    return covariance;
  }

  calculateEigenDecomposition(matrix) {
    // Simplified eigenvalue decomposition
    // In a real implementation, you'd use a proper linear algebra library
    const n = matrix.length;
    const values = Array(n).fill(1);
    const vectors = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Initialize vectors as identity matrix
    for (let i = 0; i < n; i++) {
      vectors[i][i] = 1;
    }
    
    return { values, vectors };
  }

  // Data cleaning
  removeOutliers(data, method = 'iqr', threshold = 1.5) {
    switch (method) {
      case 'iqr':
        return this.removeOutliersIQR(data, threshold);
      case 'zscore':
        return this.removeOutliersZScore(data, threshold);
      default:
        return data;
    }
  }

  removeOutliersIQR(data, threshold) {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;
    
    return data.filter(x => x >= lowerBound && x <= upperBound);
  }

  removeOutliersZScore(data, threshold) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
    
    return data.filter(x => Math.abs((x - mean) / std) <= threshold);
  }

  // Missing value handling
  handleMissingValues(data, strategy = 'mean') {
    const result = [...data];
    
    for (let i = 0; i < result.length; i++) {
      if (result[i] === null || result[i] === undefined || isNaN(result[i])) {
        switch (strategy) {
          case 'mean':
            const validValues = result.filter(x => x !== null && x !== undefined && !isNaN(x));
            result[i] = validValues.reduce((a, b) => a + b, 0) / validValues.length;
            break;
          case 'median':
            const sorted = result.filter(x => x !== null && x !== undefined && !isNaN(x)).sort((a, b) => a - b);
            result[i] = sorted[Math.floor(sorted.length / 2)];
            break;
          case 'mode':
            const frequency = {};
            result.filter(x => x !== null && x !== undefined && !isNaN(x)).forEach(x => {
              frequency[x] = (frequency[x] || 0) + 1;
            });
            result[i] = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
            break;
          case 'zero':
            result[i] = 0;
            break;
        }
      }
    }
    
    return result;
  }
}

// Model Evaluation Metrics
class ModelEvaluator {
  constructor() {
    this.metrics = {};
  }

  // Classification metrics
  accuracy(yTrue, yPred) {
    let correct = 0;
    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] === yPred[i]) {
        correct++;
      }
    }
    return correct / yTrue.length;
  }

  precision(yTrue, yPred, positiveClass = 1) {
    const [tp, fp] = this.calculateTrueFalsePositives(yTrue, yPred, positiveClass);
    return tp / (tp + fp) || 0;
  }

  recall(yTrue, yPred, positiveClass = 1) {
    const [tp, fn] = this.calculateTrueFalseNegatives(yTrue, yPred, positiveClass);
    return tp / (tp + fn) || 0;
  }

  f1Score(yTrue, yPred, positiveClass = 1) {
    const precision = this.precision(yTrue, yPred, positiveClass);
    const recall = this.recall(yTrue, yPred, positiveClass);
    return 2 * (precision * recall) / (precision + recall) || 0;
  }

  confusionMatrix(yTrue, yPred) {
    const classes = [...new Set([...yTrue, ...yPred])];
    const matrix = {};
    
    for (const trueClass of classes) {
      matrix[trueClass] = {};
      for (const predClass of classes) {
        matrix[trueClass][predClass] = 0;
      }
    }
    
    for (let i = 0; i < yTrue.length; i++) {
      matrix[yTrue[i]][yPred[i]]++;
    }
    
    return matrix;
  }

  calculateTrueFalsePositives(yTrue, yPred, positiveClass) {
    let tp = 0, fp = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      if (yPred[i] === positiveClass) {
        if (yTrue[i] === positiveClass) {
          tp++;
        } else {
          fp++;
        }
      }
    }
    
    return [tp, fp];
  }

  calculateTrueFalseNegatives(yTrue, yPred, positiveClass) {
    let tp = 0, fn = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] === positiveClass) {
        if (yPred[i] === positiveClass) {
          tp++;
        } else {
          fn++;
        }
      }
    }
    
    return [tp, fn];
  }

  // Regression metrics
  mse(yTrue, yPred) {
    let sum = 0;
    for (let i = 0; i < yTrue.length; i++) {
      sum += Math.pow(yTrue[i] - yPred[i], 2);
    }
    return sum / yTrue.length;
  }

  rmse(yTrue, yPred) {
    return Math.sqrt(this.mse(yTrue, yPred));
  }

  mae(yTrue, yPred) {
    let sum = 0;
    for (let i = 0; i < yTrue.length; i++) {
      sum += Math.abs(yTrue[i] - yPred[i]);
    }
    return sum / yTrue.length;
  }

  r2Score(yTrue, yPred) {
    const yMean = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
    let ssRes = 0, ssTot = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      ssRes += Math.pow(yTrue[i] - yPred[i], 2);
      ssTot += Math.pow(yTrue[i] - yMean, 2);
    }
    
    return 1 - (ssRes / ssTot);
  }

  // Cross-validation
  crossValidate(model, X, y, cv = 5) {
    const foldSize = Math.floor(X.length / cv);
    const scores = [];
    
    for (let fold = 0; fold < cv; fold++) {
      const startIdx = fold * foldSize;
      const endIdx = fold === cv - 1 ? X.length : (fold + 1) * foldSize;
      
      // Split data
      const XTrain = [...X.slice(0, startIdx), ...X.slice(endIdx)];
      const yTrain = [...y.slice(0, startIdx), ...y.slice(endIdx)];
      const XTest = X.slice(startIdx, endIdx);
      const yTest = y.slice(startIdx, endIdx);
      
      // Train and evaluate
      model.train(XTrain, yTrain);
      const predictions = model.predictClass(XTest);
      const score = this.accuracy(yTest, predictions);
      scores.push(score);
    }
    
    return {
      scores,
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      std: Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - scores.reduce((c, d) => c + d, 0) / scores.length, 2), 0) / scores.length)
    };
  }
}

// Automated Machine Learning Pipeline
class AutoMLPipeline {
  constructor(options = {}) {
    this.preprocessor = new DataPreprocessor();
    this.evaluator = new ModelEvaluator();
    this.models = [];
    this.bestModel = null;
    this.bestScore = -Infinity;
    this.options = {
      maxModels: options.maxModels || 10,
      cvFolds: options.cvFolds || 5,
      scoring: options.scoring || 'accuracy',
      preprocess: options.preprocess !== false,
      featureSelection: options.featureSelection || false,
      ...options
    };
  }

  // Automated model selection
  async fit(X, y) {
    console.log('🤖 Starting AutoML Pipeline...');
    console.log(`📊 Dataset: ${X.length} samples, ${X[0].length} features`);
    
    // Preprocess data
    let processedX = X;
    if (this.options.preprocess) {
      console.log('🔧 Preprocessing data...');
      processedX = this.preprocessData(X);
    }
    
    // Generate model candidates
    const modelCandidates = this.generateModelCandidates(X[0].length, y[0].length);
    
    // Evaluate each model
    console.log(`🧪 Evaluating ${modelCandidates.length} model candidates...`);
    
    for (let i = 0; i < Math.min(modelCandidates.length, this.options.maxModels); i++) {
      const modelConfig = modelCandidates[i];
      const model = this.createModel(modelConfig);
      
      try {
        // Cross-validation
        const cvResults = this.evaluator.crossValidate(model, processedX, y, this.options.cvFolds);
        const meanScore = cvResults.mean;
        
        console.log(`Model ${i + 1}: ${modelConfig.name} - Score: ${meanScore.toFixed(4)} (±${cvResults.std.toFixed(4)})`);
        
        // Track best model
        if (meanScore > this.bestScore) {
          this.bestScore = meanScore;
          this.bestModel = {
            model,
            config: modelConfig,
            score: meanScore,
            cvResults
          };
        }
        
        this.models.push({
          model,
          config: modelConfig,
          score: meanScore,
          cvResults
        });
        
      } catch (error) {
        console.warn(`⚠️ Model ${i + 1} failed: ${error.message}`);
      }
    }
    
    console.log(`✅ AutoML completed! Best model: ${this.bestModel.config.name} with score ${this.bestScore.toFixed(4)}`);
    
    // Train best model on full dataset
    this.bestModel.model.train(processedX, y);
    
    return this.bestModel;
  }

  preprocessData(X) {
    // Apply various preprocessing steps
    let processed = X.map(sample => [...sample]);
    
    // Normalize each feature
    for (let j = 0; j < processed[0].length; j++) {
      const feature = processed.map(sample => sample[j]);
      const normalized = this.preprocessor.normalize(feature, 'standard');
      
      for (let i = 0; i < processed.length; i++) {
        processed[i][j] = normalized[i];
      }
    }
    
    return processed;
  }

  generateModelCandidates(inputSize, outputSize) {
    const candidates = [];
    
    // Neural Network variants
    candidates.push(
      { name: 'MLP_Small', type: 'mlp', config: { hiddenSizes: [32, 16] } },
      { name: 'MLP_Medium', type: 'mlp', config: { hiddenSizes: [64, 32, 16] } },
      { name: 'MLP_Large', type: 'mlp', config: { hiddenSizes: [128, 64, 32] } },
      { name: 'MLP_Deep', type: 'mlp', config: { hiddenSizes: [64, 32, 16, 8] } }
    );
    
    // Different activation functions
    ['relu', 'sigmoid', 'tanh'].forEach(activation => {
      candidates.push({
        name: `MLP_${activation}`,
        type: 'mlp',
        config: { hiddenSizes: [64, 32], activation }
      });
    });
    
    // Different optimizers
    ['adam', 'sgd', 'rmsprop'].forEach(optimizer => {
      candidates.push({
        name: `MLP_${optimizer}`,
        type: 'mlp',
        config: { hiddenSizes: [64, 32], optimizer }
      });
    });
    
    return candidates;
  }

  createModel(config) {
    switch (config.type) {
      case 'mlp':
        return ModelFactory.createMLP(
          this.options.inputSize || 10,
          config.config.hiddenSizes,
          this.options.outputSize || 2,
          config.config.activation || 'relu'
        );
      default:
        throw new Error(`Unknown model type: ${config.type}`);
    }
  }

  predict(X) {
    if (!this.bestModel) {
      throw new Error('Model not trained. Call fit() first.');
    }
    
    let processedX = X;
    if (this.options.preprocess) {
      processedX = this.preprocessData(X);
    }
    
    return this.bestModel.model.predict(processedX);
  }

  predictClass(X) {
    if (!this.bestModel) {
      throw new Error('Model not trained. Call fit() first.');
    }
    
    let processedX = X;
    if (this.options.preprocess) {
      processedX = this.preprocessData(X);
    }
    
    return this.bestModel.model.predictClass(processedX);
  }

  // Model analysis
  getModelSummary() {
    if (!this.bestModel) {
      return 'No model trained yet.';
    }
    
    return {
      bestModel: {
        name: this.bestModel.config.name,
        score: this.bestModel.score,
        config: this.bestModel.config
      },
      allModels: this.models.map(m => ({
        name: m.config.name,
        score: m.score
      })),
      totalModels: this.models.length
    };
  }

  // Feature importance (simplified)
  getFeatureImportance(X, y) {
    if (!this.bestModel) {
      throw new Error('Model not trained. Call fit() first.');
    }
    
    const importance = [];
    const baselineScore = this.bestScore;
    
    for (let i = 0; i < X[0].length; i++) {
      // Shuffle feature i and measure impact
      const shuffledX = X.map(sample => {
        const newSample = [...sample];
        const randomIndex = Math.floor(Math.random() * X.length);
        newSample[i] = X[randomIndex][i];
        return newSample;
      });
      
      const tempModel = this.createModel(this.bestModel.config);
      tempModel.train(this.preprocessData(shuffledX), y);
      const shuffledScore = this.evaluator.accuracy(
        y,
        tempModel.predictClass(this.preprocessData(shuffledX))
      );
      
      importance.push({
        feature: i,
        importance: baselineScore - shuffledScore
      });
    }
    
    return importance.sort((a, b) => b.importance - a.importance);
  }

  // Save pipeline
  savePipeline(filename) {
    const pipelineData = {
      bestModel: {
        config: this.bestModel.config,
        weights: this.bestModel.model.getWeights()
      },
      preprocessors: {
        scalers: this.preprocessor.scalers,
        encoders: this.preprocessor.encoders
      },
      options: this.options,
      results: {
        bestScore: this.bestScore,
        allModels: this.models.map(m => ({
          name: m.config.name,
          score: m.score
        }))
      }
    };
    
    Bun.write(filename, JSON.stringify(pipelineData, null, 2));
    console.log(`💾 Pipeline saved to ${filename}`);
  }

  loadPipeline(filename) {
    const pipelineData = JSON.parse(Bun.read(filename));
    
    // Recreate best model
    this.bestModel = {
      config: pipelineData.bestModel.config,
      model: this.createModel(pipelineData.bestModel.config)
    };
    this.bestModel.model.setWeights(pipelineData.bestModel.weights);
    this.bestScore = pipelineData.results.bestScore;
    
    // Load preprocessors
    this.preprocessor.scalers = pipelineData.preprocessors.scalers;
    this.preprocessor.encoders = pipelineData.preprocessors.encoders;
    
    this.options = pipelineData.options;
    this.models = pipelineData.results.allModels;
    
    console.log(`📂 Pipeline loaded from ${filename}`);
  }
}

// Example usage and demo
class MLDemo {
  static async runClassificationDemo() {
    console.log('🎯 Running Classification Demo...');
    
    // Generate sample data
    const X = [];
    const y = [];
    
    for (let i = 0; i < 1000; i++) {
      const features = [
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      ];
      
      // Simple rule for classification
      const label = (features[0] + features[1] > 10) ? 1 : 0;
      
      X.push(features);
      y.push([label === 0 ? 1 : 0, label === 1 ? 1 : 0]); // One-hot encoding
    }
    
    // Split data
    const splitIndex = Math.floor(X.length * 0.8);
    const XTrain = X.slice(0, splitIndex);
    const yTrain = y.slice(0, splitIndex);
    const XTest = X.slice(splitIndex);
    const yTest = y.slice(splitIndex);
    
    // Create and run AutoML pipeline
    const automl = new AutoMLPipeline({
      maxModels: 5,
      cvFolds: 3,
      inputSize: 5,
      outputSize: 2
    });
    
    const bestModel = await automl.fit(XTrain, yTrain);
    
    // Evaluate on test set
    const predictions = automl.predictClass(XTest);
    const testLabels = yTest.map(y => y[1] === 1 ? 1 : 0);
    const accuracy = new ModelEvaluator().accuracy(testLabels, predictions);
    
    console.log(`🎯 Test Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    
    return {
      model: bestModel,
      testAccuracy: accuracy,
      predictions
    };
  }

  static async runRegressionDemo() {
    console.log('📈 Running Regression Demo...');
    
    // Generate sample regression data
    const X = [];
    const y = [];
    
    for (let i = 0; i < 500; i++) {
      const x1 = Math.random() * 10;
      const x2 = Math.random() * 10;
      const target = 2 * x1 + 3 * x2 + Math.random() * 2 - 1; // Linear relationship with noise
      
      X.push([x1, x2]);
      y.push([target]);
    }
    
    // Create simple MLP for regression
    const model = ModelFactory.createMLP(2, [16, 8], 1, 'linear');
    model.options.lossFunction = 'mse';
    
    // Train model
    model.train(X, y);
    
    // Evaluate
    const predictions = model.predict(X);
    const evaluator = new ModelEvaluator();
    const mse = evaluator.mse(y.map(yi => yi[0]), predictions.map(p => p[0]));
    const r2 = evaluator.r2Score(y.map(yi => yi[0]), predictions.map(p => p[0]));
    
    console.log(`📈 MSE: ${mse.toFixed(4)}`);
    console.log(`📈 R²: ${r2.toFixed(4)}`);
    
    return {
      model,
      mse,
      r2,
      predictions
    };
  }
}

export {
  DataPreprocessor,
  ModelEvaluator,
  AutoMLPipeline,
  MLDemo
};

export default {
  DataPreprocessor,
  ModelEvaluator,
  AutoMLPipeline,
  MLDemo
};
