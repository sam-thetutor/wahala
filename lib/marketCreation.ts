import { createWalletClient, http, parseEther } from 'viem'
import { celo } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const PREDICTION_MARKET_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A'

// Contract ABI for market creation
const PREDICTION_MARKET_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "string", "name": "image", "type": "string"},
      {"internalType": "string", "name": "source", "type": "string"}
    ],
    "name": "createMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export interface CreateMarketParams {
  question: string
  endTime: number // Unix timestamp
  description: string
  category: string
  image: string
  source: string
}

export class MarketCreationService {
  private walletClient: any

  constructor(privateKey?: string) {
    if (privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      this.walletClient = createWalletClient({
        account,
        chain: celo,
        transport: http('https://forno.celo.org')
      })
    }
  }

  // Create a market transaction (for frontend to sign)
  async createMarketTransaction(params: CreateMarketParams) {
    try {
      const { question, endTime, description, category, image, source } = params

      // Validate inputs
      if (!question.trim()) {
        throw new Error('Question is required')
      }
      if (endTime <= Date.now() / 1000) {
        throw new Error('End time must be in the future')
      }
      if (!category.trim()) {
        throw new Error('Category is required')
      }

      // Prepare transaction data
      const transactionData = {
        address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'createMarket',
        args: [question, BigInt(endTime), description, category, image, source]
      }

      return transactionData

    } catch (error) {
      console.error('Error creating market transaction:', error)
      throw error
    }
  }

  // Estimate gas for market creation
  async estimateGas(params: CreateMarketParams, account: `0x${string}`) {
    try {
      const transactionData = await this.createMarketTransaction(params)
      
      const gasEstimate = await this.walletClient.estimateContractGas({
        ...transactionData,
        account
      })

      return gasEstimate

    } catch (error) {
      console.error('Error estimating gas:', error)
      throw error
    }
  }

  // Create market with private key (for server-side operations)
  async createMarketWithPrivateKey(params: CreateMarketParams, privateKey: string) {
    try {
      if (!this.walletClient) {
        const account = privateKeyToAccount(privateKey as `0x${string}`)
        this.walletClient = createWalletClient({
          account,
          chain: celo,
          transport: http('https://forno.celo.org')
        })
      }

      const transactionData = await this.createMarketTransaction(params)
      
      // Estimate gas
      const gasEstimate = await this.walletClient.estimateContractGas(transactionData)
      
      // Create and send transaction
      const hash = await this.walletClient.writeContract({
        ...transactionData,
        gas: gasEstimate
      })

      console.log(`📝 Market creation transaction sent: ${hash}`)
      
      // Wait for transaction confirmation
      const receipt = await this.walletClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        console.log(`✅ Market created successfully: ${hash}`)
        return { hash, receipt }
      } else {
        throw new Error('Transaction failed')
      }

    } catch (error) {
      console.error('Error creating market with private key:', error)
      throw error
    }
  }

  // Get market creation cost (in CELO)
  async getMarketCreationCost() {
    try {
      // This would typically involve checking the contract for any fees
      // For now, we'll return a small amount for gas
      return parseEther('0.01') // 0.01 CELO

    } catch (error) {
      console.error('Error getting market creation cost:', error)
      throw error
    }
  }

  // Validate market parameters
  validateMarketParams(params: CreateMarketParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!params.question?.trim()) {
      errors.push('Question is required')
    } else if (params.question.length > 200) {
      errors.push('Question must be 200 characters or less')
    }

    if (!params.endTime || params.endTime <= Date.now() / 1000) {
      errors.push('End time must be in the future')
    } else if (params.endTime > Date.now() / 1000 + 365 * 24 * 60 * 60) {
      errors.push('End time cannot be more than 1 year in the future')
    }

    if (!params.description?.trim()) {
      errors.push('Description is required')
    } else if (params.description.length > 1000) {
      errors.push('Description must be 1000 characters or less')
    }

    if (!params.category?.trim()) {
      errors.push('Category is required')
    }

    if (params.image && !this.isValidUrl(params.image)) {
      errors.push('Image must be a valid URL')
    }

    if (params.source && !this.isValidUrl(params.source)) {
      errors.push('Source must be a valid URL')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }
}

// Export singleton instance
export const marketCreationService = new MarketCreationService()







