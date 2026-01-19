#!/usr/bin/env bun

// @DEMO Blockchain Integration Module
// Enterprise blockchain capabilities for secure transactions and smart contracts

// Simple Blockchain Implementation
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return Bun.hash(JSON.stringify(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.nonce)).toString();
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), { type: 'genesis', data: 'Genesis Block' }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTransaction = {
      from: 'network',
      to: miningRewardAddress,
      amount: this.miningReward,
      type: 'reward'
    };

    this.pendingTransactions.push(rewardTransaction);

    const block = new Block(
      this.chain.length,
      new Date().toISOString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
  }

  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const transaction of block.data) {
        if (transaction.from === address) {
          balance -= transaction.amount;
        }
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  getChainStats() {
    return {
      length: this.chain.length,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      isValid: this.isChainValid(),
      lastBlock: this.getLatestBlock()
    };
  }
}

// Smart Contract Engine
class SmartContract {
  constructor(address, code, owner) {
    this.address = address;
    this.code = code;
    this.owner = owner;
    this.state = {};
    this.created = new Date().toISOString();
    this.executions = 0;
  }

  execute(functionName, params, caller) {
    this.executions++;
    
    try {
      // Simple contract execution environment
      const contractFunction = new Function('state', 'params', 'caller', 'blockchain', this.code);
      const result = contractFunction(this.state, params, caller, this);
      
      return {
        success: true,
        result,
        state: this.state,
        executions: this.executions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        state: this.state
      };
    }
  }

  getStats() {
    return {
      address: this.address,
      owner: this.owner,
      created: this.created,
      executions: this.executions,
      stateSize: Object.keys(this.state).length
    };
  }
}

// Decentralized Storage System
class DecentralizedStorage {
  constructor() {
    this.nodes = new Map();
    this.files = new Map();
    this.replicationFactor = 3;
  }

  addNode(nodeId, capacity) {
    this.nodes.set(nodeId, {
      id: nodeId,
      capacity,
      used: 0,
      files: new Set()
    });
  }

  storeFile(fileHash, data) {
    // Distribute file across multiple nodes
    const availableNodes = Array.from(this.nodes.values())
      .filter(node => node.used + data.length < node.capacity)
      .sort((a, b) => a.used - b.used);

    if (availableNodes.length < this.replicationFactor) {
      throw new Error('Insufficient storage nodes available');
    }

    const selectedNodes = availableNodes.slice(0, this.replicationFactor);
    
    this.files.set(fileHash, {
      hash: fileHash,
      size: data.length,
      nodes: selectedNodes.map(node => node.id),
      timestamp: new Date().toISOString(),
      checksum: Bun.hash(data).toString()
    });

    // Update node usage
    selectedNodes.forEach(node => {
      node.used += data.length;
      node.files.add(fileHash);
    });

    return {
      fileHash,
      storedOn: selectedNodes.map(node => node.id),
      replicationFactor: this.replicationFactor
    };
  }

  retrieveFile(fileHash) {
    const fileInfo = this.files.get(fileHash);
    if (!fileInfo) {
      throw new Error('File not found');
    }

    // In a real implementation, this would retrieve from actual nodes
    return {
      hash: fileHash,
      size: fileInfo.size,
      nodes: fileInfo.nodes,
      timestamp: fileInfo.timestamp,
      checksum: fileInfo.checksum
    };
  }

  getStorageStats() {
    const totalCapacity = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.capacity, 0);
    
    const totalUsed = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.used, 0);

    return {
      totalNodes: this.nodes.size,
      totalCapacity,
      totalUsed,
      utilization: (totalUsed / totalCapacity * 100).toFixed(2) + '%',
      totalFiles: this.files.size,
      averageReplication: this.replicationFactor
    };
  }
}

// Crypto Wallet System
class CryptoWallet {
  constructor(privateKey) {
    this.privateKey = privateKey || this.generatePrivateKey();
    this.publicKey = this.generatePublicKey(this.privateKey);
    this.address = this.generateAddress(this.publicKey);
    this.balance = 0;
    this.transactions = [];
  }

  generatePrivateKey() {
    return Bun.hash(Date.now() + Math.random().toString()).toString();
  }

  generatePublicKey(privateKey) {
    return Bun.hash('public' + privateKey).toString();
  }

  generateAddress(publicKey) {
    return '0x' + publicKey.substring(0, 40);
  }

  signTransaction(transaction) {
    const signature = Bun.hash(JSON.stringify(transaction) + this.privateKey).toString();
    return {
      ...transaction,
      signature,
      publicKey: this.publicKey
    };
  }

  verifyTransaction(transaction) {
    const expectedSignature = Bun.hash(JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      type: transaction.type
    }) + this.privateKey).toString();
    
    return transaction.signature === expectedSignature;
  }

  addTransaction(transaction) {
    this.transactions.push({
      ...transaction,
      timestamp: new Date().toISOString()
    });
  }

  getBalance() {
    return this.balance;
  }

  getTransactionHistory() {
    return this.transactions;
  }
}

// Blockchain API Server
class BlockchainServer {
  constructor(port = 3000) {
    this.port = port;
    this.blockchain = new Blockchain();
    this.contracts = new Map();
    this.storage = new DecentralizedStorage();
    this.wallets = new Map();
    this.initializeNetwork();
  }

  initializeNetwork() {
    // Initialize storage nodes
    this.storage.addNode('node1', 1000000); // 1MB
    this.storage.addNode('node2', 1000000);
    this.storage.addNode('node3', 1000000);

    // Create genesis wallet
    const genesisWallet = new CryptoWallet();
    this.wallets.set(genesisWallet.address, genesisWallet);
  }

  createWallet() {
    const wallet = new CryptoWallet();
    this.wallets.set(wallet.address, wallet);
    return wallet;
  }

  deployContract(code, ownerAddress) {
    const contractAddress = '0x' + Bun.hash(code + Date.now()).toString().substring(0, 40);
    const contract = new SmartContract(contractAddress, code, ownerAddress);
    this.contracts.set(contractAddress, contract);
    return contract;
  }

  createTransaction(from, to, amount, type = 'transfer') {
    const wallet = this.wallets.get(from);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transaction = {
      from,
      to,
      amount,
      type,
      timestamp: new Date().toISOString()
    };

    const signedTransaction = wallet.signTransaction(transaction);
    this.blockchain.addTransaction(signedTransaction);
    wallet.addTransaction(signedTransaction);

    return signedTransaction;
  }

  mineBlocks(minerAddress, count = 1) {
    const results = [];
    for (let i = 0; i < count; i++) {
      this.blockchain.minePendingTransactions(minerAddress);
      results.push(this.blockchain.getLatestBlock());
    }
    return results;
  }

  getBlockchainInfo() {
    return {
      blockchain: this.blockchain.getChainStats(),
      contracts: Array.from(this.contracts.values()).map(contract => contract.getStats()),
      storage: this.storage.getStorageStats(),
      wallets: Array.from(this.wallets.values()).map(wallet => ({
        address: wallet.address,
        balance: wallet.getBalance(),
        transactions: wallet.getTransactionHistory().length
      }))
    };
  }

  // HTTP API Handler
  async handleRequest(req) {
    const url = new URL(req.url);
    
    try {
      switch (url.pathname) {
        case '/api/blockchain':
          return Response.json(this.blockchain.getChainStats());
        
        case '/api/wallet/create':
          const wallet = this.createWallet();
          return Response.json({
            address: wallet.address,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey
          });
        
        case '/api/transaction':
          if (req.method === 'POST') {
            const body = await req.json();
            const transaction = this.createTransaction(
              body.from,
              body.to,
              body.amount,
              body.type
            );
            return Response.json({ success: true, transaction });
          }
          break;
        
        case '/api/mine':
          if (req.method === 'POST') {
            const body = await req.json();
            const blocks = this.mineBlocks(body.minerAddress, body.count || 1);
            return Response.json({ success: true, blocks });
          }
          break;
        
        case '/api/contract/deploy':
          if (req.method === 'POST') {
            const body = await req.json();
            const contract = this.deployContract(body.code, body.ownerAddress);
            return Response.json({ success: true, contract: contract.getStats() });
          }
          break;
        
        case '/api/storage/store':
          if (req.method === 'POST') {
            const body = await req.json();
            const result = this.storage.storeFile(body.hash, body.data);
            return Response.json({ success: true, storage: result });
          }
          break;
        
        case '/api/info':
          return Response.json(this.getBlockchainInfo());
        
        default:
          return new Response('404 - Not Found', { status: 404 });
      }
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  start() {
    const server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });

    console.log(`🔗 Blockchain Server running at http://localhost:${this.port}`);
    console.log(`📊 API: http://localhost:${this.port}/api/info`);
    return server;
  }
}

// Sample Smart Contract Templates
const CONTRACT_TEMPLATES = {
  // Simple Token Contract
  token: `
    // Simple Token Contract
    if (!state.totalSupply) {
      state.totalSupply = 1000000;
      state.balances = {};
      state.balances[caller] = state.totalSupply;
    }
    
    if (functionName === 'transfer') {
      const to = params.to;
      const amount = params.amount;
      
      if (state.balances[caller] >= amount) {
        state.balances[caller] -= amount;
        state.balances[to] = (state.balances[to] || 0) + amount;
        return { success: true, message: 'Transfer successful' };
      } else {
        throw new Error('Insufficient balance');
      }
    }
    
    if (functionName === 'balanceOf') {
      return state.balances[params.address] || 0;
    }
  `,
  
  // Voting Contract
  voting: `
    // Voting Contract
    if (!state.proposals) {
      state.proposals = {};
      state.voters = {};
    }
    
    if (functionName === 'createProposal') {
      const id = params.id;
      state.proposals[id] = {
        title: params.title,
        description: params.description,
        votes: 0,
        voters: []
      };
      return { success: true, proposal: state.proposals[id] };
    }
    
    if (functionName === 'vote') {
      const proposalId = params.proposalId;
      if (!state.voters[caller]) {
        state.proposals[proposalId].votes++;
        state.proposals[proposalId].voters.push(caller);
        state.voters[caller] = true;
        return { success: true, votes: state.proposals[proposalId].votes };
      } else {
        throw new Error('Already voted');
      }
    }
  `
};

export {
  Block,
  Blockchain,
  SmartContract,
  DecentralizedStorage,
  CryptoWallet,
  BlockchainServer,
  CONTRACT_TEMPLATES
};

export default {
  Block,
  Blockchain,
  SmartContract,
  DecentralizedStorage,
  CryptoWallet,
  BlockchainServer,
  CONTRACT_TEMPLATES
};
