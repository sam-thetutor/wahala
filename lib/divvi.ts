import type { Hex } from 'viem'

const DIVVI_CONSUMER_ADDRESS: `0x${string}` = '0x21D654daaB0fe1be0e584980ca7C1a382850939f'

// Always safe: return empty suffix if SDK is unavailable
// @ts-ignore - downstream consumers accept Hex '0x' as no-op suffix
export function getReferralDataSuffix(_providers: `0x${string}`[] = []): Hex {
  return DIVVI_CONSUMER_ADDRESS as Hex
}

export async function submitDivviReferral(txHash: Hex, chainId: number): Promise<void> {
  try {
    // Dynamically import to avoid build-time coupling
    const mod = await import('@divvi/referral-sdk') as any
    if (mod && typeof mod.submitReferral === 'function') {
      await mod.submitReferral({ txHash, chainId })
    }
  } catch {
    // no-op; attribution errors must not break main flow
  }
}


