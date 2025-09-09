import { parseEther } from 'viem'
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts'
import { getCoreContractAddress } from '@/lib/contract-addresses'

export interface CreateMarketParams {
  question: string
  endTime: number
  description: string
  category: string
  image?: string
  source?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class MarketCreationService {
  private readonly MARKET_CREATION_FEE = '0.01' // 0.01 CELO
  private readonly MINIMUM_END_TIME = 24 * 60 * 60 // 24 hours in seconds

  validateMarketParams(params: CreateMarketParams): ValidationResult {
    const errors: string[] = []

    // Validate question
    if (!params.question || params.question.trim().length === 0) {
      errors.push('Question is required')
    } else if (params.question.length > 200) {
      errors.push('Question must be 200 characters or less')
    }

    // Validate end time
    const now = Math.floor(Date.now() / 1000)
    if (params.endTime <= now + this.MINIMUM_END_TIME) {
      errors.push(`End time must be at least ${this.MINIMUM_END_TIME / 3600} hours in the future`)
    }

    // Validate description
    if (!params.description || params.description.trim().length === 0) {
      errors.push('Description is required')
    } else if (params.description.length > 1000) {
      errors.push('Description must be 1000 characters or less')
    }

    // Validate category
    if (!params.category || params.category.trim().length === 0) {
      errors.push('Category is required')
    }

    // Validate image URL if provided
    if (params.image && params.image.trim().length > 0) {
      try {
        new URL(params.image)
      } catch {
        errors.push('Image must be a valid URL')
      }
    }

    // Validate source URL if provided
    if (params.source && params.source.trim().length > 0) {
      try {
        new URL(params.source)
      } catch {
        errors.push('Source must be a valid URL')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async createMarketTransaction(params: CreateMarketParams) {
    const contractAddress = getCoreContractAddress(42220) // Celo Mainnet
    
    return {
      address: contractAddress,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'createMarket',
      args: [
        params.question,
        params.description,
        params.category,
        params.image || '',
        params.source || '',
        BigInt(params.endTime)
      ],
      value: parseEther(this.MARKET_CREATION_FEE)
    }
  }

  async estimateGas(params: CreateMarketParams, userAddress: string) {
    // This is a simplified gas estimation
    // In a real implementation, you would call the contract's estimateGas method
    return BigInt(500000) // Estimated gas for createMarket function
  }

  async getMarketCreationCost() {
    return this.MARKET_CREATION_FEE
  }
}

// Export singleton instance
export const marketCreationService = new MarketCreationService()