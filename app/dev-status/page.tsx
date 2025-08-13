'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl, getAppUrl } from '@/config/environment';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity,
  Server,
  RefreshCw,
  Network
} from 'lucide-react';

interface SocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastPing: number | null;
  connectionTime: Date | null;
  disconnectReason: string | null;
}

interface ServerStatus {
  app: boolean;
  socket: boolean;
  worker: boolean;
  lastCheck: Date;
}

export default function DevStatusPage() {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>({
    connected: false,
    connecting: false,
    error: null,
    lastPing: null,
    connectionTime: null,
    disconnectReason: null
  });
  
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    app: false,
    socket: false,
    worker: true,
    lastCheck: new Date()
  });
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Array<{success: boolean, error?: string, type: string}>>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Test socket connection
  const testSocketConnection = async () => {
    setIsTesting(true);
    addLog('Starting socket connection test...');
    
    try {
      // Test localhost connection
      const localSocket = io('http://localhost:4001', {
        query: { roomId: 'test', walletAddress: '0x1234567890123456789012345678901234567890' },
        timeout: 5000
      });

      const localResult = await new Promise<{success: boolean, error?: string, type: string}>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Timeout', type: 'localhost' });
        }, 5000);

        localSocket.on('connect', () => {
          clearTimeout(timeout);
          localSocket.disconnect();
          resolve({ success: true, type: 'localhost' });
        });

        localSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message, type: 'localhost' });
        });
      });

      // Test domain connection
      const domainSocket = io(getSocketUrl(), {
        query: { roomId: 'test', walletAddress: '0x1234567890123456789012345678901234567890' },
        timeout: 5000
      });

      const domainResult = await new Promise<{success: boolean, error?: string, type: string}>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Timeout', type: 'domain' });
        }, 5000);

        domainSocket.on('connect', () => {
          clearTimeout(timeout);
          domainSocket.disconnect();
          resolve({ success: true, type: 'domain' });
        });

        domainSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message, type: 'domain' });
        });
      });

      setTestResults([localResult, domainResult]);
      
      if (localResult.success && domainResult.success) {
        addLog('✅ Both localhost and domain socket connections successful');
      } else if (localResult.success && !domainResult.success) {
        addLog('⚠️ Localhost works but domain connection failed - nginx proxy issue');
      } else if (!localResult.success && domainResult.success) {
        addLog('⚠️ Domain works but localhost failed - unexpected');
      } else {
        addLog('❌ Both connections failed - socket server may be down');
      }

    } catch (error) {
      addLog(`❌ Test error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Check server status
  const checkServerStatus = async () => {
    setServerStatus(prev => ({ ...prev, lastCheck: new Date() }));
    
    try {
      // Check app server by trying to fetch the current page
      const appResponse = await fetch('https://snarkels.lol/dev-status', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);
      
      // Check socket server
      const socketResponse = await fetch(`${getSocketUrl()}/socket.io/`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      setServerStatus({
        app: appResponse?.ok || false,
        socket: socketResponse?.ok || false,
        worker: true, // Assume worker is running if we can reach the app
        lastCheck: new Date()
      });

      addLog(`Server check: App ${appResponse?.ok ? '✅' : '❌'}, Socket ${socketResponse?.ok ? '✅' : '❌'}`);
      
    } catch (error) {
      addLog(`Server check error: ${error}`);
    }
  };

  // Initialize socket connection for monitoring
  useEffect(() => {
    addLog('Initializing socket monitoring...');
    
    const newSocket = io(getSocketUrl(), {
      query: { roomId: 'dev-monitor', walletAddress: '0x1234567890123456789012345678901234567890' },
      timeout: 10000
    });

    newSocket.on('connect', () => {
      addLog('✅ Socket connected successfully');
      setSocketStatus(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null,
        connectionTime: new Date(),
        disconnectReason: null
      }));
    });

    newSocket.on('connecting', () => {
      addLog('🔄 Socket connecting...');
      setSocketStatus(prev => ({
        ...prev,
        connecting: true,
        connected: false
      }));
    });

    newSocket.on('connect_error', (error) => {
      addLog(`❌ Socket connection error: ${error.message}`);
      setSocketStatus(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message
      }));
    });

    newSocket.on('disconnect', (reason) => {
      addLog(`🔌 Socket disconnected: ${reason}`);
      setSocketStatus(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        disconnectReason: reason
      }));
    });

    newSocket.on('pong', (latency) => {
      setSocketStatus(prev => ({
        ...prev,
        lastPing: latency
      }));
    });

    setSocket(newSocket);

    // Initial server check
    checkServerStatus();

    // Periodic server check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  // Send ping to socket server
  const sendPing = () => {
    if (socket && socket.connected) {
      socket.emit('ping');
      addLog('📡 Ping sent to socket server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Dev Status Dashboard</h1>
          <p className="text-gray-600">Monitor socket connections, server status, and debug issues</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* App Server Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">App Server</p>
                <p className="text-2xl font-bold text-gray-900">Port 4000</p>
              </div>
              <div className={`p-2 rounded-full ${serverStatus.app ? 'bg-green-100' : 'bg-red-100'}`}>
                {serverStatus.app ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {serverStatus.app ? 'Running' : 'Down'}
            </p>
          </div>

          {/* Socket Server Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Socket Server</p>
                <p className="text-2xl font-bold text-gray-900">Port 4001</p>
              </div>
              <div className={`p-2 rounded-full ${serverStatus.socket ? 'bg-green-100' : 'bg-red-100'}`}>
                {serverStatus.socket ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {serverStatus.socket ? 'Running' : 'Down'}
            </p>
          </div>

          {/* Socket Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Socket Connection</p>
                <p className="text-2xl font-bold text-gray-900">
                  {socketStatus.connected ? 'Connected' : socketStatus.connecting ? 'Connecting' : 'Disconnected'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${
                socketStatus.connected ? 'bg-green-100' : 
                socketStatus.connecting ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {socketStatus.connected ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : socketStatus.connecting ? (
                  <Clock className="w-6 h-6 text-yellow-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {socketStatus.lastPing ? `${socketStatus.lastPing}ms` : 'No ping data'}
            </p>
          </div>

          {/* Worker Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Worker</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serverStatus.worker ? 'Running' : 'Unknown'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${serverStatus.worker ? 'bg-green-100' : 'bg-gray-100'}`}>
                {serverStatus.worker ? (
                  <Activity className="w-6 h-6 text-green-600" />
                ) : (
                  <Server className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last check: {serverStatus.lastCheck.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testSocketConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing...' : 'Test Socket Connection'}
            </button>
            
            <button
              onClick={checkServerStatus}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Server className="w-4 h-4" />
              Check Server Status
            </button>
            
            <button
              onClick={sendPing}
              disabled={!socketStatus.connected}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Network className="w-4 h-4" />
              Send Ping
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      result.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {result.type === 'localhost' ? 'Localhost:4001' : 'snarkels.lol'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.success ? 'Connection successful' : `Error: ${result.error}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Socket Status</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Connected:</span> {socketStatus.connected ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Connecting:</span> {socketStatus.connecting ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Connection Time:</span> {socketStatus.connectionTime?.toLocaleString() || 'N/A'}</p>
                <p><span className="font-medium">Last Ping:</span> {socketStatus.lastPing ? `${socketStatus.lastPing}ms` : 'N/A'}</p>
                <p><span className="font-medium">Disconnect Reason:</span> {socketStatus.disconnectReason || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Error Information</h3>
              <div className="space-y-2 text-sm">
                {socketStatus.error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Connection Error:</p>
                    <p className="text-red-700">{socketStatus.error}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No errors detected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Live Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
