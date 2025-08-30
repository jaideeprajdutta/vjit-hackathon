// Blockchain service for integrating with GrievanceSLA smart contract
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractABI = null;
    this.wallet = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the blockchain service
   */
  async initialize() {
    try {
      // Load deployment info
      const deploymentPath = path.join(process.cwd(), 'deployment.json');
      if (!fs.existsSync(deploymentPath)) {
        console.log('⚠️  No deployment.json found. Run "npx hardhat run scripts/deploy.js --network localhost" first.');
        return false;
      }

      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      this.contractAddress = deploymentInfo.address;

      // Load contract ABI
      const artifactsPath = path.join(process.cwd(), 'artifacts/contracts/GrievanceSLA.sol/GrievanceSLA.json');
      if (!fs.existsSync(artifactsPath)) {
        console.log('⚠️  Contract artifacts not found. Run "npx hardhat compile" first.');
        return false;
      }

      const contractArtifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
      this.contractABI = contractArtifact.abi;

      // Initialize provider (for local development)
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Get the first account as the default wallet
      const accounts = await this.provider.listAccounts();
      if (accounts.length === 0) {
        console.log('⚠️  No accounts found. Start Hardhat node first with "npx hardhat node".');
        return false;
      }

      this.wallet = new ethers.Wallet(accounts[0], this.provider);
      
      // Initialize contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.wallet
      );

      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');
      console.log('📋 Contract address:', this.contractAddress);
      console.log('👤 Wallet address:', await this.wallet.getAddress());
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      return false;
    }
  }

  /**
   * Submit a grievance to the blockchain
   */
  async submitGrievanceToBlockchain(grievanceData) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const { referenceId, title, description, category, priority } = grievanceData;
      
      // Convert priority string to enum value
      const priorityMap = {
        'low': 0,
        'medium': 1,
        'high': 2,
        'critical': 3
      };
      
      const priorityValue = priorityMap[priority] || 1; // Default to medium

      console.log('📝 Submitting grievance to blockchain:', referenceId);
      
      const tx = await this.contract.submitGrievance(
        referenceId,
        title,
        description,
        category,
        priorityValue
      );

      const receipt = await tx.wait();
      console.log('✅ Grievance submitted to blockchain. Transaction hash:', receipt.hash);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to submit grievance to blockchain:', error.message);
      throw new Error(`Blockchain submission failed: ${error.message}`);
    }
  }

  /**
   * Update grievance status on blockchain
   */
  async updateGrievanceStatus(grievanceId, newStatus) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Convert status string to enum value
      const statusMap = {
        'submitted': 0,
        'under_review': 1,
        'in_progress': 2,
        'resolved': 3,
        'escalated': 4,
        'closed': 5
      };
      
      const statusValue = statusMap[newStatus.toLowerCase()] || 0;

      console.log('🔄 Updating grievance status on blockchain:', grievanceId, '->', newStatus);
      
      const tx = await this.contract.updateGrievanceStatus(grievanceId, statusValue);
      const receipt = await tx.wait();
      
      console.log('✅ Status updated on blockchain. Transaction hash:', receipt.hash);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Failed to update status on blockchain:', error.message);
      throw new Error(`Blockchain status update failed: ${error.message}`);
    }
  }

  /**
   * Get grievance details from blockchain
   */
  async getGrievanceFromBlockchain(grievanceId) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const grievance = await this.contract.getGrievance(grievanceId);
      
      // Convert blockchain data to readable format
      const statusMap = ['Submitted', 'UnderReview', 'InProgress', 'Resolved', 'Escalated', 'Closed'];
      const priorityMap = ['Low', 'Medium', 'High', 'Critical'];
      
      return {
        id: grievance.id.toString(),
        referenceId: grievance.referenceId,
        submitter: grievance.submitter,
        title: grievance.title,
        description: grievance.description,
        category: grievance.category,
        submissionTime: new Date(parseInt(grievance.submissionTime) * 1000).toISOString(),
        deadline: new Date(parseInt(grievance.deadline) * 1000).toISOString(),
        resolutionTime: grievance.resolutionTime > 0 ? 
          new Date(parseInt(grievance.resolutionTime) * 1000).toISOString() : null,
        status: statusMap[grievance.status] || 'Unknown',
        priority: priorityMap[grievance.priority] || 'Medium',
        isResolved: grievance.isResolved,
        isEscalated: grievance.isEscalated,
        escalationLevel: grievance.escalationLevel.toString()
      };
    } catch (error) {
      console.error('❌ Failed to get grievance from blockchain:', error.message);
      throw new Error(`Blockchain query failed: ${error.message}`);
    }
  }

  /**
   * Get grievance by reference ID from blockchain
   */
  async getGrievanceByReferenceId(referenceId) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const grievance = await this.contract.getGrievanceByReferenceId(referenceId);
      
      // Convert blockchain data to readable format
      const statusMap = ['Submitted', 'UnderReview', 'InProgress', 'Resolved', 'Escalated', 'Closed'];
      const priorityMap = ['Low', 'Medium', 'High', 'Critical'];
      
      return {
        id: grievance.id.toString(),
        referenceId: grievance.referenceId,
        submitter: grievance.submitter,
        title: grievance.title,
        description: grievance.description,
        category: grievance.category,
        submissionTime: new Date(parseInt(grievance.submissionTime) * 1000).toISOString(),
        deadline: new Date(parseInt(grievance.deadline) * 1000).toISOString(),
        resolutionTime: grievance.resolutionTime > 0 ? 
          new Date(parseInt(grievance.resolutionTime) * 1000).toISOString() : null,
        status: statusMap[grievance.status] || 'Unknown',
        priority: priorityMap[grievance.priority] || 'Medium',
        isResolved: grievance.isResolved,
        isEscalated: grievance.isEscalated,
        escalationLevel: grievance.escalationLevel.toString()
      };
    } catch (error) {
      console.error('❌ Failed to get grievance by reference ID from blockchain:', error.message);
      throw new Error(`Blockchain query failed: ${error.message}`);
    }
  }

  /**
   * Check if SLA is met for a grievance
   */
  async checkSLAMet(grievanceId) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const slaMet = await this.contract.checkSLAMet(grievanceId);
      return slaMet;
    } catch (error) {
      console.error('❌ Failed to check SLA from blockchain:', error.message);
      throw new Error(`SLA check failed: ${error.message}`);
    }
  }

  /**
   * Get user's grievances from blockchain
   */
  async getUserGrievances(userAddress) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const grievanceIds = await this.contract.getUserGrievances(userAddress);
      const grievances = [];
      
      for (const id of grievanceIds) {
        try {
          const grievance = await this.getGrievanceFromBlockchain(id);
          grievances.push(grievance);
        } catch (error) {
          console.warn(`Failed to get grievance ${id}:`, error.message);
        }
      }
      
      return grievances;
    } catch (error) {
      console.error('❌ Failed to get user grievances from blockchain:', error.message);
      throw new Error(`User grievances query failed: ${error.message}`);
    }
  }

  /**
   * Get total number of grievances
   */
  async getTotalGrievances() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const total = await this.contract.getTotalGrievances();
      return total.toString();
    } catch (error) {
      console.error('❌ Failed to get total grievances from blockchain:', error.message);
      throw new Error(`Total grievances query failed: ${error.message}`);
    }
  }

  /**
   * Get SLA configuration
   */
  async getSLAConfig() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const config = await this.contract.slaConfig();
      return {
        lowPriorityDeadline: parseInt(config.lowPriorityDeadline),
        mediumPriorityDeadline: parseInt(config.mediumPriorityDeadline),
        highPriorityDeadline: parseInt(config.highPriorityDeadline),
        criticalPriorityDeadline: parseInt(config.criticalPriorityDeadline),
        escalationDeadline: parseInt(config.escalationDeadline),
        penaltyAmount: config.penaltyAmount.toString()
      };
    } catch (error) {
      console.error('❌ Failed to get SLA config from blockchain:', error.message);
      throw new Error(`SLA config query failed: ${error.message}`);
    }
  }

  /**
   * Check if address is authorized officer
   */
  async isAuthorizedOfficer(address) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const isAuthorized = await this.contract.isAuthorizedOfficer(address);
      return isAuthorized;
    } catch (error) {
      console.error('❌ Failed to check officer authorization from blockchain:', error.message);
      throw new Error(`Officer authorization check failed: ${error.message}`);
    }
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return this.contractAddress;
  }

  /**
   * Get wallet address
   */
  async getWalletAddress() {
    if (!this.wallet) return null;
    return await this.wallet.getAddress();
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized() {
    return this.isInitialized;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
