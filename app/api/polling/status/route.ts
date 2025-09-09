import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if polling service is running by looking for the process
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout } = await execAsync('ps aux | grep "start-polling-service" | grep -v grep')
      const isRunning = stdout.trim().length > 0
      
      return NextResponse.json({
        success: true,
        isRunning,
        message: isRunning ? 'Polling service is running' : 'Polling service is not running',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        success: true,
        isRunning: false,
        message: 'Polling service is not running',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Error checking polling status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check polling status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
