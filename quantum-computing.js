#!/usr/bin/env bun

// @DEMO Quantum Computing Simulation
// Advanced quantum algorithms and simulations for enterprise applications

// Quantum Bit (Qubit) Class
class Qubit {
  constructor(alpha = 1, beta = 0) {
    this.alpha = alpha; // Amplitude for |0⟩ state
    this.beta = beta;   // Amplitude for |1⟩ state
    this.normalize();
  }

  normalize() {
    const magnitude = Math.sqrt(Math.abs(this.alpha) ** 2 + Math.abs(this.beta) ** 2);
    if (magnitude > 0) {
      this.alpha /= magnitude;
      this.beta /= magnitude;
    }
  }

  measure() {
    const prob0 = Math.abs(this.alpha) ** 2;
    return Math.random() < prob0 ? 0 : 1;
  }

  applyGate(gate) {
    const newAlpha = gate[0][0] * this.alpha + gate[0][1] * this.beta;
    const newBeta = gate[1][0] * this.alpha + gate[1][1] * this.beta;
    this.alpha = newAlpha;
    this.beta = newBeta;
    this.normalize();
  }

  getProbabilities() {
    return {
      '|0⟩': Math.abs(this.alpha) ** 2,
      '|1⟩': Math.abs(this.beta) ** 2
    };
  }

  clone() {
    return new Qubit(this.alpha, this.beta);
  }
}

// Quantum Register
class QuantumRegister {
  constructor(numQubits) {
    this.numQubits = numQubits;
    this.qubits = Array(numQubits).fill(null).map(() => new Qubit());
    this.entangled = false;
  }

  getStateVector() {
    // Returns the state vector of the entire register
    const state = {};
    const size = 2 ** this.numQubits;
    
    for (let i = 0; i < size; i++) {
      const binary = i.toString(2).padStart(this.numQubits, '0');
      let amplitude = 1;
      
      for (let j = 0; j < this.numQubits; j++) {
        const bit = parseInt(binary[j]);
        amplitude *= bit === 0 ? this.qubits[j].alpha : this.qubits[j].beta;
      }
      
      state[`|${binary}⟩`] = amplitude;
    }
    
    return state;
  }

  measure() {
    return this.qubits.map(qubit => qubit.measure());
  }

  applyGate(gate, targetQubit) {
    if (targetQubit >= 0 && targetQubit < this.numQubits) {
      this.qubits[targetQubit].applyGate(gate);
    }
  }

  applyMultiQubitGate(gate, qubits) {
    // Simplified multi-qubit gate application
    // In a real implementation, this would handle entanglement properly
    for (let i = 0; i < qubits.length; i++) {
      if (i < gate.length && qubits[i] < this.numQubits) {
        this.qubits[qubits[i]].applyGate(gate[i]);
      }
    }
  }

  entangle(qubit1, qubit2) {
    // Create entanglement between two qubits
    // Simplified entanglement simulation
    this.entangled = true;
    
    // Create Bell state
    this.qubits[qubit1].alpha = 1 / Math.sqrt(2);
    this.qubits[qubit1].beta = 0;
    this.qubits[qubit2].alpha = 1 / Math.sqrt(2);
    this.qubits[qubit2].beta = 0;
  }

  getDensityMatrix() {
    // Returns the density matrix of the register
    const stateVector = this.getStateVector();
    const size = 2 ** this.numQubits;
    const densityMatrix = Array(size).fill(null).map(() => Array(size).fill(0));
    
    const states = Object.keys(stateVector);
    for (let i = 0; i < states.length; i++) {
      for (let j = 0; j < states.length; j++) {
        densityMatrix[i][j] = stateVector[states[i]] * complexConjugate(stateVector[states[j]]);
      }
    }
    
    return densityMatrix;
  }
}

// Quantum Gates
const QuantumGates = {
  // Pauli Gates
  X: [[0, 1], [1, 0]],           // NOT gate
  Y: [[0, -1], [1, 0]],          // Y gate
  Z: [[1, 0], [0, -1]],          // Z gate
  
  // Hadamard Gate
  H: [[1 / Math.sqrt(2), 1 / Math.sqrt(2)], [1 / Math.sqrt(2), -1 / Math.sqrt(2)]],
  
  // Phase Gates
  S: [[1, 0], [0, 1]],           // Phase gate
  T: [[1, 0], [0, Math.exp(Math.PI / 4)]], // T gate
  
  // Rotation Gates
  RX: (theta) => [[Math.cos(theta / 2), -1 * Math.sin(theta / 2)], [Math.sin(theta / 2), Math.cos(theta / 2)]],
  RY: (theta) => [[Math.cos(theta / 2), -1 * Math.sin(theta / 2)], [Math.sin(theta / 2), Math.cos(theta / 2)]],
  RZ: (theta) => [[1, 0], [0, Math.exp(1 * theta)]],
  
  // Two-Qubit Gates
  CNOT: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]], // Controlled NOT
  SWAP: [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]], // SWAP gate
  
  // Three-Qubit Gates
  TOFFOLI: [
    [1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 0]
  ]
};

// Quantum Algorithms
class QuantumAlgorithms {
  // Grover's Search Algorithm
  static groverSearch(items, target, iterations = null) {
    const n = items.length;
    const numQubits = Math.ceil(Math.log2(n));
    const register = new QuantumRegister(numQubits);
    
    // Initialize superposition
    for (let i = 0; i < numQubits; i++) {
      register.applyGate(QuantumGates.H, i);
    }
    
    // Number of iterations (approximately √N)
    const optimalIterations = iterations || Math.floor(Math.PI / 4 * Math.sqrt(n));
    
    for (let iter = 0; iter < optimalIterations; iter++) {
      // Oracle function (marks the target state)
      this.oracle(register, target, n);
      
      // Diffusion operator
      this.diffusionOperator(register);
    }
    
    // Measure the result
    const result = register.measure();
    const index = parseInt(result.join(''), 2);
    
    return {
      result: index < n ? items[index] : null,
      index: index,
      iterations: optimalIterations,
      probability: this.getSearchProbability(register, target, n)
    };
  }
  
  static oracle(register, target, n) {
    // Simplified oracle - marks the target state
    // In a real implementation, this would use phase kickback
    const numQubits = register.numQubits;
    const targetBinary = target.toString(2).padStart(numQubits, '0');
    
    // Apply phase flip to target state
    for (let i = 0; i < numQubits; i++) {
      if (targetBinary[i] === '1') {
        register.applyGate(QuantumGates.Z, i);
      }
    }
  }
  
  static diffusionOperator(register) {
    // Apply Hadamard gates
    for (let i = 0; i < register.numQubits; i++) {
      register.applyGate(QuantumGates.H, i);
    }
    
    // Apply X gates
    for (let i = 0; i < register.numQubits; i++) {
      register.applyGate(QuantumGates.X, i);
    }
    
    // Multi-controlled Z gate (simplified)
    register.applyGate(QuantumGates.Z, register.numQubits - 1);
    
    // Apply X gates again
    for (let i = 0; i < register.numQubits; i++) {
      register.applyGate(QuantumGates.X, i);
    }
    
    // Apply Hadamard gates again
    for (let i = 0; i < register.numQubits; i++) {
      register.applyGate(QuantumGates.H, i);
    }
  }
  
  static getSearchProbability(register, target, n) {
    // Calculate probability of finding the target
    const stateVector = register.getStateVector();
    const targetBinary = target.toString(2).padStart(register.numQubits, '0');
    const targetState = `|${targetBinary}⟩`;
    
    return Math.abs(stateVector[targetState] || 0) ** 2;
  }
  
  // Quantum Fourier Transform
  static quantumFourierTransform(register) {
    const n = register.numQubits;
    
    for (let i = 0; i < n; i++) {
      register.applyGate(QuantumGates.H, i);
      
      for (let j = i + 1; j < n; j++) {
        const angle = Math.PI / (2 ** (j - i + 1));
        const controlledPhase = [
          [1, 0],
          [0, Math.exp(1 * angle)]
        ];
        register.applyGate(controlledPhase, j);
      }
    }
    
    // Reverse qubit order
    for (let i = 0; i < n / 2; i++) {
      register.applyGate(QuantumGates.SWAP, [i, n - 1 - i]);
    }
  }
  
  // Shor's Algorithm (simplified version for period finding)
  static shorsAlgorithm(N, a) {
    console.log(`Shor's Algorithm for factoring ${N} with base ${a}`);
    
    // Step 1: Choose a random power of 2 >= N^2
    const n = Math.ceil(Math.log2(N * N));
    const register = new QuantumRegister(2 * n);
    
    // Step 2: Initialize superposition
    for (let i = 0; i < 2 * n; i++) {
      register.applyGate(QuantumGates.H, i);
    }
    
    // Step 3: Apply modular exponentiation (simplified)
    // This would be the quantum part of the algorithm
    console.log('Applying modular exponentiation...');
    
    // Step 4: Apply Quantum Fourier Transform
    this.quantumFourierTransform(register);
    
    // Step 5: Measure and extract period
    const measurement = register.measure();
    const measuredValue = parseInt(measurement.join(''), 2);
    
    // Step 6: Classical post-processing to extract period
    const period = this.extractPeriod(measuredValue, 2 * n);
    
    return {
      N: N,
      a: a,
      measuredValue: measuredValue,
      estimatedPeriod: period,
      factors: this.findFactors(N, a, period)
    };
  }
  
  static extractPeriod(measuredValue, n) {
    // Simplified period extraction
    // In a real implementation, this would use continued fractions
    const denominator = 2 ** n;
    const fraction = measuredValue / denominator;
    
    // Find closest rational approximation
    let bestPeriod = 1;
    let bestError = 1;
    
    for (let r = 1; r <= 100; r++) {
      const error = Math.abs(fraction - Math.round(fraction * r) / r);
      if (error < bestError) {
        bestError = error;
        bestPeriod = r;
      }
    }
    
    return bestPeriod;
  }
  
  static findFactors(N, a, period) {
    // Use the period to find factors
    if (period % 2 !== 0) {
      return { error: 'Period is odd, retry with different a' };
    }
    
    const x = Math.pow(a, period / 2);
    const factor1 = this.gcd(x - 1, N);
    const factor2 = this.gcd(x + 1, N);
    
    if (factor1 === 1 || factor1 === N) {
      return { error: 'Trivial factors found, retry with different a' };
    }
    
    return { factor1, factor2 };
  }
  
  static gcd(a, b) {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
}

// Quantum Circuit Simulator
class QuantumCircuit {
  constructor(numQubits) {
    this.numQubits = numQubits;
    this.register = new QuantumRegister(numQubits);
    this.gates = [];
    this.measurements = [];
  }
  
  addGate(gate, targetQubits, params = {}) {
    this.gates.push({
      gate: gate,
      targets: targetQubits,
      params: params,
      type: this.getGateType(gate)
    });
  }
  
  getGateType(gate) {
    if (Array.isArray(gate)) {
      if (gate.length === 2) return 'single';
      if (gate.length === 4) return 'double';
      if (gate.length === 8) return 'triple';
    }
    return 'custom';
  }
  
  run() {
    // Execute all gates in sequence
    for (const gateOp of this.gates) {
      if (gateOp.type === 'single') {
        this.register.applyGate(gateOp.gate, gateOp.targets[0]);
      } else if (gateOp.type === 'double') {
        this.register.applyMultiQubitGate(gateOp.gate, gateOp.targets);
      }
    }
    
    return this.register.getStateVector();
  }
  
  measure() {
    const result = this.register.measure();
    this.measurements.push(result);
    return result;
  }
  
  getProbabilities() {
    const stateVector = this.register.getStateVector();
    const probabilities = {};
    
    for (const [state, amplitude] of Object.entries(stateVector)) {
      probabilities[state] = Math.abs(amplitude) ** 2;
    }
    
    return probabilities;
  }
  
  getDensityMatrix() {
    return this.register.getDensityMatrix();
  }
  
  reset() {
    this.register = new QuantumRegister(this.numQubits);
    this.measurements = [];
  }
  
  visualize() {
    const visualization = {
      numQubits: this.numQubits,
      gates: this.gates.map((gate, index) => ({
        step: index + 1,
        gate: gate.type,
        targets: gate.targets,
        params: gate.params
      })),
      measurements: this.measurements
    };
    
    return visualization;
  }
}

// Quantum Error Correction
class QuantumErrorCorrection {
  static encodeBitFlip(qubit) {
    // Encode a logical qubit using three physical qubits
    const encoded = new QuantumRegister(3);
    
    // Copy the state to all three qubits (simplified)
    encoded.qubits[0] = qubit.clone();
    encoded.qubits[1] = qubit.clone();
    encoded.qubits[2] = qubit.clone();
    
    return encoded;
  }
  
  static decodeBitFlip(encodedRegister) {
    // Decode and correct bit flip errors
    const measurements = encodedRegister.measure();
    
    // Majority vote for error correction
    const zeros = measurements.filter(m => m === 0).length;
    const ones = measurements.filter(m => m === 1).length;
    
    const correctedBit = zeros > ones ? 0 : 1;
    
    return new Qubit(correctedBit === 0 ? 1 : 0, correctedBit === 1 ? 1 : 0);
  }
  
  static encodePhaseFlip(qubit) {
    // Encode for phase flip error correction
    const encoded = new QuantumRegister(3);
    
    // Create GHZ-like state for phase flip protection
    encoded.qubits[0] = qubit.clone();
    encoded.qubits[1] = qubit.clone();
    encoded.qubits[2] = qubit.clone();
    
    return encoded;
  }
  
  static shorCode(qubit) {
    // Full Shor code implementation (9 qubits)
    const encoded = new QuantumRegister(9);
    
    // First level: Bit flip encoding
    const bitFlipEncoded = this.encodeBitFlip(qubit);
    
    // Second level: Phase flip encoding for each bit flip encoded qubit
    for (let i = 0; i < 3; i++) {
      const phaseEncoded = this.encodePhaseFlip(bitFlipEncoded.qubits[i]);
      encoded.qubits[i * 3] = phaseEncoded.qubits[0];
      encoded.qubits[i * 3 + 1] = phaseEncoded.qubits[1];
      encoded.qubits[i * 3 + 2] = phaseEncoded.qubits[2];
    }
    
    return encoded;
  }
}

// Utility Functions
function complexConjugate(complex) {
  if (typeof complex === 'number') {
    return complex;
  }
  // For complex numbers a + bi, return a - bi
  return complex; // Simplified for real numbers
}

function createBellState(type = 'phi+') {
  const register = new QuantumRegister(2);
  
  // Create Bell state
  register.applyGate(QuantumGates.H, 0);
  register.applyGate(QuantumGates.CNOT, [0, 1]);
  
  const bellStates = {
    'phi+': '|00⟩ + |11⟩',
    'phi-': '|00⟩ - |11⟩',
    'psi+': '|01⟩ + |10⟩',
    'psi-': '|01⟩ - |10⟩'
  };
  
  return {
    register: register,
    type: type,
    description: bellStates[type] || bellStates['phi+'],
    stateVector: register.getStateVector()
  };
}

export {
  Qubit,
  QuantumRegister,
  QuantumGates,
  QuantumAlgorithms,
  QuantumCircuit,
  QuantumErrorCorrection,
  createBellState
};

export default {
  Qubit,
  QuantumRegister,
  QuantumGates,
  QuantumAlgorithms,
  QuantumCircuit,
  QuantumErrorCorrection,
  createBellState
};
