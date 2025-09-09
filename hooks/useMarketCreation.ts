import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export interface CreateMarketParams {
  question: string
  endTime: number
  description: string
  category: string
  image?: string
  source?: string
}

export interface UseMarketCreationReturn {
  createMarket: (params: CreateMarketParams) => Promise<void>
  isCreating: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: string | null
  transactionHash: string | null
  reset: () => void
  handleMarketCreated: (transactionHash: string, params: CreateMarketParams) => Promise<void>
}

export function useMarketCreation(): UseMarketCreationReturn {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const { writeContract, data: hash, isPending: isConfirming } = useWriteContract()
  
  const { isLoading: isConfirmingTx, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    setIsCreating(true)
    setError(null)
    setTransactionHash(null)

    try {
      // Get transaction data from API
      const response = await fetch('/api/markets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create market transaction')
      }

      const { transactionData } = await response.json()

      // Write the contract transaction
      writeContract({
        address: transactionData.address,
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
      })

      setTransactionHash(hash || null)

    } catch (err) {
      console.error('Error creating market:', err)
      setError(err instanceof Error ? err.message : 'Failed to create market')
    } finally {
      setIsCreating(false)
    }
  }, [address, writeContract, hash])

  // Handle successful market creation - write to database
  const handleMarketCreated = useCallback(async (transactionHash: string, params: CreateMarketParams) => {
    try {
      console.log('🔄 Extracting market ID from transaction...');
      
      // Extract the actual market ID from the smart contract transaction
      const idResponse = await fetch('/api/extract-market-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash
        }),
      });

      if (!idResponse.ok) {
        console.error('❌ Failed to extract market ID from transaction');
        return;
      }

      const { marketId } = await idResponse.json();
      console.log(`✅ Extracted market ID: ${marketId}`);

      const marketData = {
        id: marketId, // Use the actual contract-assigned ID
        question: params.question,
        description: params.description,
        category: params.category,
        image: params.image || 'https://picsum.photos/400/300?random=1',
        source: params.source || address || '0x0000000000000000000000000000000000000000',
        endtime: params.endTime.toString(),
        totalpool: '0',
        totalyes: '0',
        totalno: '0',
        status: 0, // Active
        outcome: false,
        createdat: Math.floor(Date.now() / 1000).toString(),
        creator: address || '0x0000000000000000000000000000000000000000'
      }

      const response = await fetch('/api/markets/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          type: 'create',
          data: marketData
        }),
      })

      if (!response.ok) {
        console.error('Failed to save market to database')
      } else {
        console.log('✅ Market saved to database with contract ID:', marketId)
      }
    } catch (error) {
      console.error('Error saving market to database:', error)
    }
  }, [address])

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      console.log('Market creation transaction confirmed, updating database...')
      
      // We need the market creation params to call handleMarketCreated
      // For now, we'll just log - the actual call should be made from the create market page
      // where we have access to the form data
    }
  }, [isSuccess, hash])

  const reset = useCallback(() => {
    setError(null)
    setTransactionHash(null)
    setIsCreating(false)
  }, [])

  return {
    createMarket,
    isCreating,
    isConfirming: isConfirming || isConfirmingTx,
    isSuccess,
    error,
    transactionHash: hash || transactionHash,
    reset,
    handleMarketCreated
  }
}