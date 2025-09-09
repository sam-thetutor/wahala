import { spawn } from 'child_process'
import path from 'path'

let pollingProcess: any = null

export function startPollingService() {
  // Don't start if already running
  if (pollingProcess && !pollingProcess.killed) {
    console.log('⚠️ Polling service is already running')
    return
  }

  // Only start in production or when explicitly enabled
  const shouldStart = process.env.NODE_ENV === 'production' || 
                     process.env.ENABLE_POLLING === 'true' ||
                     process.env.NEXT_PUBLIC_ENABLE_POLLING === 'true'

  if (!shouldStart) {
    console.log('⏸️ Polling service disabled (set ENABLE_POLLING=true to enable)')
    return
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'start-polling-service.js')
    
    console.log('🚀 Auto-starting polling service...')
    console.log('📁 Script path:', scriptPath)
    
    pollingProcess = spawn('node', [scriptPath], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    })

    // Handle process events
    pollingProcess.stdout.on('data', (data: Buffer) => {
      console.log(`[Polling Service] ${data.toString().trim()}`)
    })

    pollingProcess.stderr.on('data', (data: Buffer) => {
      console.error(`[Polling Service Error] ${data.toString().trim()}`)
    })

    pollingProcess.on('close', (code: number) => {
      console.log(`[Polling Service] Process exited with code ${code}`)
      pollingProcess = null
      
      // Restart if it was an unexpected exit (not manual shutdown)
      if (code !== 0 && process.env.NODE_ENV === 'production') {
        console.log('🔄 Restarting polling service in 5 seconds...')
        setTimeout(() => {
          startPollingService()
        }, 5000)
      }
    })

    pollingProcess.on('error', (error: Error) => {
      console.error(`[Polling Service] Failed to start:`, error)
      pollingProcess = null
    })

    console.log('✅ Polling service started successfully')

  } catch (error) {
    console.error('❌ Failed to start polling service:', error)
  }
}

export function stopPollingService() {
  if (pollingProcess && !pollingProcess.killed) {
    console.log('🛑 Stopping polling service...')
    pollingProcess.kill('SIGTERM')
    pollingProcess = null
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  stopPollingService()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  stopPollingService()
  process.exit(0)
})
