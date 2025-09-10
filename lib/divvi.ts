import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import type { Address, Hex } from 'viem'

const DIVVI_CONSUMER_ADDRESS: Address = '0x21D654daaB0fe1be0e584980ca7C3a382850939f'

/**
 * Generate a referral tag for Divvi attribution tracking
 * @param user - The user address making the transaction
 * @returns Referral tag to append to transaction data
 */
export function generateReferralTag(user: Address): Hex {
  try {
    return getReferralTag({
      user,
      consumer: DIVVI_CONSUMER_ADDRESS,
    }) as Hex
  } catch (error) {
    console.warn('Failed to generate referral tag:', error)
    return '0x' as Hex // Return empty hex if generation fails
  }
}

/**
 * Submit referral data to Divvi after successful transaction
 * @param txHash - Transaction hash
 * @param chainId - Chain ID where transaction was sent
 */
export async function submitDivviReferral(txHash: Hex, chainId: number): Promise<void> {
  try {
    await submitReferral({
      txHash,
      chainId,
    })
    console.log('✅ Referral submitted to Divvi:', { txHash, chainId })
  } catch (error) {
    console.warn('Failed to submit referral to Divvi:', error)
    // Don't throw - referral submission should not break main flow
  }
}