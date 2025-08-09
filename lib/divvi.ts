import type { Hex } from 'viem'
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'

const DIVVI_CONSUMER_ADDRESS: `0x${string}` = '0x53eaF4CD171842d8144e45211308e5D90B4b0088'

export function getReferralDataSuffix(providers: `0x${string}`[] = []): Hex {
  try {
    const suffix = getDataSuffix({ consumer: DIVVI_CONSUMER_ADDRESS, providers })
    return `0x${suffix}` as Hex
  } catch {
    return '0x' as Hex
  }
}

export async function submitDivviReferral(txHash: Hex, chainId: number): Promise<void> {
  try {
    await submitReferral({ txHash, chainId })
  } catch {
    // no-op; attribution errors must not break main flow
  }
}


