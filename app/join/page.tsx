'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { io, Socket } from 'socket.io-client';
import { 
  Play, 
  ArrowRight, 
  Users, 
  Clock, 
  Gift, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Gamepad2,
  Star,
  Trophy,
  Sparkles,
  Home,
  Wallet,
  Loader2,
  MessageSquare,
  Crown,
  Settings
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';



interface Participant {
  id: string;
  userId: string;
  isAdmin: boolean;
  isReady: boolean;
  joinedAt: string;
  user: {
    id: string;
    address: string;
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  currentParticipants: number;
  maxParticipants: number;
  minParticipants: number;
  isWaiting: boolean;
  isStarted: boolean;
  isFinished: boolean;
  countdownDuration: number;
}

interface Snarkel {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  basePointsPerQuestion: number;
  speedBonusEnabled: boolean;
  maxSpeedBonus: number;
}

function JoinSnarkelContent() {
  const { address, isConnected, isConnecting } = useAccount();
  
  // Force re-render when wallet state changes
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Add a manual refresh function
  const refreshWalletState = () => {
    setForceUpdate(prev => prev + 1);
    console.log('Manual refresh triggered');
  };
  
  // Debug wallet connection state changes
  useEffect(() => {
    console.log('Join page - Wallet state changed:', { isConnected, address, isConnecting });
  }, [isConnected, address, isConnecting]);
  const searchParams = useSearchParams();
  const [snarkelCode, setSnarkelCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [joinAnimation, setJoinAnimation] = useState(false);
  const [codeFromUrl, setCodeFromUrl] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }>>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const router = useRouter();

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSessionStarter, setIsSessionStarter] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [snarkel, setSnarkel] = useState<Snarkel | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number>(5);
  const [showCountdownModal, setShowCountdownModal] = useState(false);



  useEffect(() => {
    setIsLoaded(true);
    
    // Create floating elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 20 + 15,
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 4000,
    }));
    setFloatingElements(elements);
  }, []);

  // Read code from URL parameter and auto-fill
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setSnarkelCode(codeFromUrl.toUpperCase());
      setCodeFromUrl(true);
    }
  }, [searchParams]);

  const handleJoinSnarkel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet to join a snarkel');
      return;
    }
    
    if (!snarkelCode.trim()) {
      setError('Please enter a snarkel code');
      return;
    }

    setLoading(true);
    setError('');
    setJoinAnimation(true);

    try {
      const response = await fetch('/api/snarkel/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snarkelCode: snarkelCode.trim().toUpperCase(),
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Join API Response:', data);
        
        // Set admin state
        setIsAdmin(data.isAdmin);
        setIsSessionStarter(data.isSessionStarter || false);
        setRoom(data.room);
        setSnarkel(data.snarkel);
        setParticipants(data.participants || []);
        
        // Initialize socket if admin
        if (data.isAdmin) {
          initializeSocket(data.roomId);
        }
        
        // Add delay for animation
        setTimeout(() => {
          // Redirect to room with snarkel ID and room ID
          const snarkelId = data.snarkel?.id || data.snarkelId;
          if (!snarkelId) {
            console.error('No snarkel ID found in response:', data);
            setError('Invalid response from server');
            setJoinAnimation(false);
            return;
          }
          router.push(`/quiz/${snarkelId}/room/${data.roomId}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join snarkel');
        setJoinAnimation(false);
      }
    } catch (error) {
      console.error('Failed to join snarkel:', error);
      setError('Failed to join snarkel. Please try again.');
      setJoinAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = (roomId: string) => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: {
        roomId,
        walletAddress: address
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('participantJoined', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    newSocket.on('participantLeft', (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('participantReady', (participantId: string) => {
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, isReady: true } : p)
      );
    });

    setSocket(newSocket);
  };

  const startGame = () => {
    if (socket && isAdmin) {
      setShowCountdownModal(true);
    }
  };

  const confirmStartGame = () => {
    if (socket && isAdmin) {
      socket.emit('startGame', { countdownTime });
      setShowCountdownModal(false);
    }
  };

  const sendMessage = () => {
    if (socket && isAdmin && adminMessage.trim()) {
      socket.emit('sendMessage', { message: adminMessage });
      setAdminMessage('');
      setShowMessageModal(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleJoinRoom = (snarkelId: string, roomId: string) => {
    router.push(`/quiz/${snarkelId}/room/${roomId}`);
  };

  const handleShowMessageModal = () => {
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
  };

  const handleCloseCountdownModal = () => {
    setShowCountdownModal(false);
  };

  const handleJoinRoomWithParams = (snarkelId: string, roomId: string) => {
    handleJoinRoom(snarkelId, roomId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#FCF6F1' }}>
      {/* Enhanced notebook background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                transparent,
                transparent 24px,
                #E7E3D4 24px,
                #E7E3D4 26px
              ),
              radial-gradient(circle at 30% 70%, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(86, 223, 124, 0.1) 0%, transparent 50%)
            `,
            backgroundSize: '100% 26px, 600px 600px, 800px 800px'
          }}
        />
        {/* Paper texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0),
              repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
            `,
            backgroundSize: '20px 20px, 30px 30px'
          }}
        />
      </div>

      {/* Floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute opacity-10 animate-float"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              animationDelay: `${element.delay}ms`,
              animationDuration: `${element.duration}ms`,
            }}
          >
            <Star className="w-full h-full text-yellow-400" />
          </div>
        ))}
      </div>

      {/* Header - compact pinned board style */}
      <div className={`relative z-10 transition-all duration-1000 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="bg-white shadow-lg rounded-xl p-4 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-3 border-green-400 overflow-hidden">
            {/* Smaller pin effect */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full shadow-md border border-white"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-600 rounded-full"></div>
            
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{
                   backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Gamepad2 className="w-8 h-8 animate-bounce-slow" style={{ color: '#476520' }} />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping bg-yellow-400"></div>
                </div>
                <div>
                  <h1 className="font-handwriting text-2xl font-bold" style={{ color: '#476520' }}>
                    Join a Snarkel
                  </h1>
                  <p className="font-handwriting text-sm text-gray-600 mt-0.5">Enter the secret code to join!</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Wallet Connect Button in Header */}
                <div className="flex items-center gap-2">
                  <WalletConnectButton />
                </div>
                
                <button 
                  onClick={handleGoHome}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-handwriting text-sm"
                  style={{ color: '#476520' }}
                >
                  <Home className="w-4 h-4" />
                  Back Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        {/* Main join section - more compact */}
        <div className={`transition-all duration-1000 delay-300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-6 md:p-8 transform rotate-1 hover:-rotate-0.5 transition-all duration-500 relative border-l-3 border-blue-400 overflow-hidden">
            {/* Smaller pin effects */}
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 rounded-full shadow-md border-2 border-white"></div>
            <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full shadow-md border-2 border-white"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-600 rounded-full"></div>
            
            {/* Enhanced texture */}
            <div className="absolute inset-0 opacity-15 pointer-events-none"
                 style={{
                   backgroundImage: `
                     repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                     radial-gradient(circle at 20% 80%, rgba(252, 255, 82, 0.1) 0%, transparent 50%)
                   `,
                   backgroundSize: '15px 15px, 300px 300px'
                 }}></div>

            <div className="relative z-10">
              {/* Smaller header with animated icon */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto relative overflow-hidden" 
                       style={{ backgroundColor: '#FCFF52' }}>
                    <Play className="h-7 w-7 animate-pulse" style={{ color: '#476520' }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-shimmer"></div>
                  </div>
                  <div className="absolute -top-1 -right-1 animate-bounce">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
                <h2 className="font-handwriting text-3xl font-bold mb-3 transform hover:scale-105 transition-transform" style={{ color: '#476520' }}>
                  Enter Your Secret Code
                </h2>
                <p className="font-handwriting text-lg text-gray-600 max-w-md mx-auto">
                  Got a code from a friend? Drop it in below! 🎉
                </p>
              </div>

              <div className="space-y-6">
                {/* Compact code input */}
                <div className="space-y-3">
                  <label className="block font-handwriting text-xl font-medium text-center" style={{ color: '#655947' }}>
                    🔐 Snarkel Code
                  </label>
                  
                  <div className="relative max-w-xs mx-auto">
                    <div className={`relative transform transition-all duration-300 ${
                      inputFocused ? 'scale-105 rotate-0' : 'rotate-1'
                    }`}>
                      <input
                        type="text"
                        value={snarkelCode}
                        onChange={(e) => setSnarkelCode(e.target.value.toUpperCase())}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        className="w-full px-4 py-4 text-center text-2xl md:text-3xl font-mono font-bold tracking-widest border-3 border-yellow-400 rounded-xl focus:ring-3 focus:ring-yellow-300 focus:border-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg bg-gradient-to-r from-white to-yellow-50"
                        placeholder="ABC123"
                        maxLength={6}
                        disabled={loading}
                        style={{
                          backgroundImage: inputFocused ? 'linear-gradient(45deg, rgba(252, 255, 82, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)' : 'none'
                        }}
                      />
                      
                      {/* Animated border glow */}
                      {inputFocused && (
                        <div className="absolute inset-0 rounded-xl border-3 border-yellow-400 animate-ping opacity-30"></div>
                      )}
                      
                      {/* Smaller character indicators */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              i < snarkelCode.length
                                ? 'bg-green-400 animate-pulse'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-handwriting text-base text-gray-500 text-center">
                    ✨ Enter the magical 6-character code ✨
                  </p>
                  
                  {/* Auto-filled code indicator */}
                  {codeFromUrl && (
                    <div className="max-w-sm mx-auto mt-3 transform -rotate-1 hover:rotate-0 transition-transform">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border-2 border-blue-200 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="font-handwriting text-sm text-blue-700">
                          Code auto-filled from link! 🎉
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="max-w-sm mx-auto transform -rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border-2 border-red-200 shadow-md">
                      <XCircle className="h-5 w-5 text-red-500 animate-bounce" />
                      <span className="font-handwriting text-base text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Wallet Connect Button - only show if not connected */}
                {!isConnected && !isConnecting && (
                  <div className="text-center mb-4">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="font-handwriting text-yellow-800 mb-3">
                        🔗 Connect your wallet to join the quiz
                      </p>
                      <WalletConnectButton />
                    </div>
                  </div>
                )}

                {/* Show connecting state */}
                {isConnecting && (
                  <div className="text-center mb-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                      <p className="font-handwriting text-blue-800 mb-3">
                        🔄 Connecting wallet...
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-blue-600">Please complete the connection in your wallet</span>
                      </div>
                    </div>
                  </div>
                )}



                {/* Debug wallet state */}
                <div className="text-center text-xs text-gray-500 mb-2">
                  useAccount: isConnected={isConnected.toString()}, address={address || 'none'}, isConnecting={isConnecting.toString()}
                  <br />
                  WalletConnectButton should show connected state above
                  <br />
                  <button 
                    onClick={refreshWalletState}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    🔄 Refresh State
                  </button>
                </div>

                {/* Compact submit button */}
                <div className="text-center">
                  <div className="relative inline-block">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-green-300 rounded-xl blur-lg opacity-40 animate-pulse"></div>
                    
                    <button
                      type="button"
                      onClick={handleJoinSnarkel}
                      disabled={loading || !snarkelCode.trim() || !isConnected}
                      className="relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg text-white hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 -skew-x-12"></div>
                      
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-handwriting">Joining...</span>
                        </>
                      ) : !isConnected ? (
                        <>
                          <Wallet className="h-5 w-5" />
                          <span className="font-handwriting">Connect Wallet to Join Room</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 animate-pulse" />
                          <span className="font-handwriting">Join Waiting Room!</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Interface */}
        {isAdmin && room && snarkel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <h2 className="font-handwriting text-3xl font-bold" style={{ color: '#476520' }}>
                    Admin Dashboard
                  </h2>
                </div>
                <button
                  onClick={() => handleJoinRoomWithParams(snarkel.id, room.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Join Room
                </button>
              </div>

              {/* Session Starter Message */}
              {isSessionStarter && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-100 rounded-lg border border-yellow-300">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="font-handwriting text-lg font-bold" style={{ color: '#476520' }}>
                        🎉 You Started a Featured Quiz Session!
                      </h3>
                      <p className="text-sm mt-1" style={{ color: '#655947' }}>
                        As the session starter, you have admin privileges. Anyone can join this featured quiz!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Room Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-400">
                  <h3 className="font-handwriting text-xl font-bold mb-3" style={{ color: '#476520' }}>
                    📊 Room Statistics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Room Name:</span>
                      <span className="font-handwriting font-bold">{room.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Participants:</span>
                      <span className="font-handwriting font-bold">{room.currentParticipants}/{room.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Min Required:</span>
                      <span className="font-handwriting font-bold">{room.minParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Status:</span>
                      <span className="font-handwriting font-bold text-green-600">
                        {room.isWaiting ? 'Waiting' : room.isStarted ? 'Started' : 'Finished'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-400">
                  <h3 className="font-handwriting text-xl font-bold mb-3" style={{ color: '#476520' }}>
                    🎯 Quiz Info
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Title:</span>
                      <span className="font-handwriting font-bold">{snarkel.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Questions:</span>
                      <span className="font-handwriting font-bold">{snarkel.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Base Points:</span>
                      <span className="font-handwriting font-bold">{snarkel.basePointsPerQuestion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-handwriting text-gray-600">Speed Bonus:</span>
                      <span className="font-handwriting font-bold">
                        {snarkel.speedBonusEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-l-4 border-yellow-400 mb-6">
                <h3 className="font-handwriting text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#476520' }}>
                  <Users className="w-5 h-5" />
                  Participants ({participants.length})
                </h3>
                <div className="grid gap-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {participant.user.name?.charAt(0) || participant.user.address.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-handwriting font-bold text-sm">
                            {participant.user.name || `User ${participant.user.address.slice(0, 8)}...`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.user.address.slice(0, 6)}...{participant.user.address.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isAdmin && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {participant.isReady ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Controls */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-400">
                <h3 className="font-handwriting text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#476520' }}>
                  <Settings className="w-5 h-5" />
                  Admin Controls
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={startGame}
                    disabled={room.isStarted || participants.length < room.minParticipants}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-handwriting font-bold"
                  >
                    <Play className="w-5 h-5" />
                    Start Quiz
                  </button>
                  
                  <button
                    onClick={handleShowMessageModal}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all duration-300 font-handwriting font-bold"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Animation Overlay */}
        {joinAnimation && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl transform scale-100 animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="font-handwriting text-2xl font-bold mb-2" style={{ color: '#476520' }}>
                Joining Room...
              </h3>
              <p className="font-handwriting text-gray-600">
                Connecting to the quiz room...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact how it works - pinned boards grid */}
        <div className={`grid md:grid-cols-2 gap-4 mt-8 transition-all duration-1000 delay-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* How it works - smaller */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl shadow-lg p-4 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-3 border-yellow-500 overflow-hidden">
            {/* Smaller pin */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 rounded-full shadow-md border border-white"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-600 rounded-full"></div>
            
            <div className="relative z-10">
              <h3 className="font-handwriting text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#476520' }}>
                <Trophy className="w-6 h-6 animate-spin-slow" />
                How it works
              </h3>
              <div className="space-y-3">
                {[
                  { icon: '🔑', title: 'Get Code', desc: 'Friend shares 6-digit code' },
                  { icon: '🎯', title: 'Join Room', desc: 'Enter code, connect wallet' },
                  { icon: '⚡', title: 'Get Ready', desc: 'Wait for others, mark ready' },
                  { icon: '🏆', title: 'Play & Win', desc: 'Answer fast, earn CELO!' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 bg-white bg-opacity-60 rounded-lg hover:scale-105 transition-transform">
                    <div className="text-xl animate-bounce" style={{ animationDelay: `${i * 200}ms` }}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-handwriting font-bold text-base" style={{ color: '#476520' }}>{step.title}</h4>
                      <p className="font-handwriting text-sm text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Snarkels - smaller */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-lg p-4 transform rotate-1 hover:-rotate-0.5 transition-all duration-500 relative border-l-3 border-purple-400 overflow-hidden">
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-purple-500 rounded-full shadow-md border border-white"></div>
            <div className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-purple-600 rounded-full"></div>
            
            <div className="relative z-10">
              <h3 className="font-handwriting text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#476520' }}>
                <Star className="w-6 h-6 animate-pulse" />
                Popular Snarkels
              </h3>
              <div className="space-y-2">
                {[
                  { title: 'Celo Quiz', desc: 'Test Celo knowledge', participants: 24, pool: '100 CELO' },
                  { title: 'DeFi Basics', desc: 'Learn DeFi fundamentals', participants: 18, pool: '50 CELO' },
                  { title: 'Web3 Security', desc: 'Stay safe in Web3', participants: 12, pool: '75 CELO' }
                ].map((snarkel, i) => (
                  <div key={i} className="p-3 bg-white bg-opacity-70 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-md">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-handwriting font-bold text-base" style={{ color: '#476520' }}>{snarkel.title}</h4>
                      <Gift className="w-4 h-4 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="font-handwriting text-sm text-gray-600 mb-2">{snarkel.desc}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-handwriting text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{snarkel.participants}</span>
                      </div>
                      <div className="font-handwriting font-bold text-sm" style={{ color: '#476520' }}>
                        {snarkel.pool}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      {showCountdownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="font-handwriting text-2xl font-bold mb-4 text-center" style={{ color: '#476520' }}>
              Start Quiz Countdown
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
                  Countdown Duration (seconds)
                </label>
                <input
                  type="number"
                  value={countdownTime}
                  onChange={(e) => setCountdownTime(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="3"
                  max="30"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmStartGame}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-handwriting font-bold"
                >
                  Start Quiz
                </button>
                <button
                  onClick={handleCloseCountdownModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-handwriting font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="font-handwriting text-2xl font-bold mb-4 text-center" style={{ color: '#476520' }}>
              Send Message to Participants
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  placeholder="Enter your message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={sendMessage}
                  disabled={!adminMessage.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-handwriting font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
                <button
                  onClick={handleCloseMessageModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-handwriting font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .font-handwriting {
          /* Font is now handled globally with mobile optimization */
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default function JoinSnarkelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinSnarkelContent />
    </Suspense>
  );
}