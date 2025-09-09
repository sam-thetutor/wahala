import { useEffect, useRef, useCallback } from 'react'

interface UseSmartPollingOptions {
  enabled?: boolean
  interval?: number
  onPoll: () => void | Promise<void>
  dependencies?: any[]
}

export const useSmartPolling = ({
  enabled = true,
  interval = 3000, // 3 seconds
  onPoll,
  dependencies = []
}: UseSmartPollingOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPageVisible = useRef(true)
  const lastPollTime = useRef(Date.now())

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden
      console.log('📱 Page visibility changed:', isPageVisible.current ? 'visible' : 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Polling function
  const poll = useCallback(async () => {
    if (!enabled || !isPageVisible.current) {
      console.log('⏸️ Polling skipped - disabled or page hidden')
      return
    }

    try {
      console.log('🔄 Smart polling: Refreshing data...')
      lastPollTime.current = Date.now()
      await onPoll()
    } catch (error) {
      console.error('❌ Polling error:', error)
    }
  }, [enabled, onPoll])

  // Start/stop polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Start polling
    console.log('🚀 Starting smart polling with', interval, 'ms interval')
    intervalRef.current = setInterval(poll, interval)

    // Initial poll
    poll()

    return () => {
      if (intervalRef.current) {
        console.log('🛑 Stopping smart polling')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, poll, ...dependencies])

  // Manual refresh function
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered')
    poll()
  }, [poll])

  // Get polling status
  const getStatus = useCallback(() => ({
    isActive: intervalRef.current !== null,
    isPageVisible: isPageVisible.current,
    lastPollTime: lastPollTime.current,
    timeSinceLastPoll: Date.now() - lastPollTime.current
  }), [])

  return {
    refresh,
    getStatus
  }
}