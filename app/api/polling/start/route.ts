import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

let pollingProcess: any = null

export async function POST(request: NextRequest) {
  try {
    // Check if polling service is already running
    if (pollingProcess && !pollingProcess.killed) {
      return NextResponse.json({
        success: true,
        message: 'Polling service is already running',
        pid: pollingProcess.pid
      })
    }

    // Start the polling service
    const scriptPath = path.join(process.cwd(), 'scripts', 'start-polling-service.js')
    
    console.log('🚀 Starting polling service from API...')
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
    })

    pollingProcess.on('error', (error: Error) => {
      console.error(`[Polling Service] Failed to start:`, error)
      pollingProcess = null
    })

    // Wait a moment to ensure the process starts
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (pollingProcess && !pollingProcess.killed) {
      return NextResponse.json({
        success: true,
        message: 'Polling service started successfully',
        pid: pollingProcess.pid
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to start polling service'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error starting polling service:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start polling service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (pollingProcess && !pollingProcess.killed) {
      pollingProcess.kill('SIGTERM')
      pollingProcess = null
      
      return NextResponse.json({
        success: true,
        message: 'Polling service stopped successfully'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Polling service was not running'
      })
    }
  } catch (error) {
    console.error('Error stopping polling service:', error)
    return NextResponse.json(
      { 
        error: 'Failed to stop polling service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
