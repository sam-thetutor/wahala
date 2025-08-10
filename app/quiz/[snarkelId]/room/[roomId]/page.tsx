'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { io, Socket } from 'socket.io-client';
import { isValidWalletAddress } from '@/lib/wallet-utils';
import { useQuizContract } from '@/hooks/useViemContract';
import { 
  Users, 
  Clock, 
  Trophy, 
  Star, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Gamepad2,
  Sparkles,
  Award,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  Wallet,
  Settings,
  Crown,
  Coins,
  LogOut
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import AdminControls from '@/components/AdminControls';
import ParticipantRoom from '@/components/ParticipantRoom';

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
  sessionNumber?: number;
  scheduledStartTime?: string;
  snarkel?: Snarkel;
}

interface Snarkel {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  basePointsPerQuestion: number;
  speedBonusEnabled: boolean;
  maxSpeedBonus: number;
  rewardsEnabled?: boolean;
}

interface Question {
  id: string;
  text: string;
  timeLimit: number;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export default function QuizRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // Get route parameters
  const snarkelId = params.snarkelId as string;
  const roomId = params.roomId as string;
  
  // Initialize rewards functionality with new secure contract
  const {
    areRewardsDistributed,
    getExpectedRewardToken,
    getExpectedRewardAmount
  } = useQuizContract();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [snarkel, setSnarkel] = useState<Snarkel | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
  const [leaderboard, setLeaderboard] = useState<Array<{userId: string, score: number, name: string}>>([]);
  const [tvMessage, setTvMessage] = useState<string>('');
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number>(5);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showCountdownDisplay, setShowCountdownDisplay] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState<number>(0);
  const [adminMessageDisplay, setAdminMessageDisplay] = useState<string>('');
  const [showAdminMessage, setShowAdminMessage] = useState(false);
  const [participantTabs, setParticipantTabs] = useState<Array<{id: string, name: string, address: string, isReady: boolean, isAdmin: boolean}>>([]);
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<{questionId: string, correctAnswer: string, userAnswers: Array<{userId: string, answerId: string, isCorrect: boolean, points: number}>} | null>(null);
  const [participantLeaveNotification, setParticipantLeaveNotification] = useState<string>('');
  const [participantJoinNotification, setParticipantJoinNotification] = useState<string>('');
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [showAdminMessageModal, setShowAdminMessageModal] = useState(false);
  const [messageSentNotification, setMessageSentNotification] = useState<string>('');
  const [showRewardsSection, setShowRewardsSection] = useState(false);
  const [rewardsDistributed, setRewardsDistributed] = useState(false);
  const [distributingRewards, setDistributingRewards] = useState(false);
  const [messageProgress, setMessageProgress] = useState<number>(100);
  const [messageDuration, setMessageDuration] = useState<number>(5000);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [futureStartCountdown, setFutureStartCountdown] = useState<number | null>(null);
  const [showFutureStartCountdown, setShowFutureStartCountdown] = useState(false);

  useEffect(() => {
    // Enhanced wallet address validation
    if (!isConnected) {
      setError('Please connect your wallet to join the quiz');
      setLoading(false);
      return;
    }

    if (!address) {
      setError('No wallet address detected. Please connect your wallet and try again.');
      setLoading(false);
      return;
    }

    // Validate wallet address format
    if (!isValidWalletAddress(address)) {
      setError('Invalid wallet address format. Please ensure your wallet is properly connected.');
      setLoading(false);
      return;
    }

    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    if (roomId) {
      joinExistingRoom();
    }
    
    return () => {
      // Cleanup timeouts on unmount
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [isConnected, address, roomId]);

  // Add useEffect for future start time countdown
  useEffect(() => {
    if (room?.scheduledStartTime && !room.isStarted && gameState === 'waiting') {
      const startTime = new Date(room.scheduledStartTime);
      const now = new Date();
      
      if (startTime > now) {
        // Quiz has a future start time
        setShowFutureStartCountdown(true);
        
        const updateCountdown = () => {
          const currentTime = new Date();
          const timeDiff = startTime.getTime() - currentTime.getTime();
          
          if (timeDiff > 0) {
            const secondsLeft = Math.floor(timeDiff / 1000);
            setFutureStartCountdown(secondsLeft);
          } else {
            // Start time has passed, hide countdown
            setShowFutureStartCountdown(false);
            setFutureStartCountdown(null);
          }
        };
        
        // Update immediately
        updateCountdown();
        
        // Update every second
        const interval = setInterval(updateCountdown, 1000);
        
        return () => clearInterval(interval);
      } else {
        setShowFutureStartCountdown(false);
        setFutureStartCountdown(null);
      }
    } else {
      setShowFutureStartCountdown(false);
      setFutureStartCountdown(null);
    }
  }, [room?.scheduledStartTime, room?.isStarted, gameState]);

  const joinExistingRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      setJoinError(null);

      const response = await fetch(`/api/room/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('API Response:', data);
        console.log('Admin Address:', data.adminAddress);
        console.log('Snarkel Creator Address:', data.snarkelCreatorAddress);
        console.log('Current User Address:', address);
        console.log('Is Admin:', data.isAdmin);
        setRoom(data.room);
        setSnarkel(data.snarkel);
        setParticipants(data.participants);
        setIsAdmin(data.isAdmin);
        setIsReady(data.isReady);
        
        // Initialize participant tabs with existing participants
        setParticipantTabs(data.participants.map((p: any) => ({
          id: p.id,
          name: `${p.user.address.slice(0, 6)}...${p.user.address.slice(-4)}`,
          address: p.user.address,
          isReady: p.isReady,
          isAdmin: p.isAdmin
        })));
        
        initializeSocket();
      } else {
        const errorMessage = data.error || 'Failed to join room';
        setError(errorMessage);
        setJoinError(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      setJoinError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  console.log('isAdmin', isAdmin);
  console.log('room', room);
  console.log("user", address);
  console.log('participants', participants);
  console.log('current user is admin?', participants.find(p => p.user.address.toLowerCase() === address?.toLowerCase())?.isAdmin);
  console.log('All participant addresses:', participants.map(p => ({ address: p.user.address, isAdmin: p.isAdmin, userId: p.userId })));
  console.log('Current user address:', address);
  console.log('Admin participant:', participants.find(p => p.isAdmin));

  const initializeSocket = () => {
    if (!roomId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: {
        roomId,
        walletAddress: address
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      console.log('Socket ID:', newSocket.id);
      console.log('Room ID:', roomId);
      console.log('Wallet Address:', address);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('participantJoined', (participant: Participant) => {
      // Safety check for participant data
      if (participant && participant.user && participant.user.address) {
        setParticipants(prev => [...prev, participant]);
        // Add to animated tabs
        setParticipantTabs(prev => [...prev, {
          id: participant.id,
          name: `${participant.user.address.slice(0, 6)}...${participant.user.address.slice(-4)}`,
          address: participant.user.address,
          isReady: participant.isReady,
          isAdmin: participant.isAdmin
        }]);
      }
    });

    newSocket.on('participantLeft', (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      // Remove from animated tabs
      setParticipantTabs(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('participantReady', (participantId: string) => {
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, isReady: true } : p)
      );
      // Update animated tabs
      setParticipantTabs(prev => 
        prev.map(p => p.id === participantId ? { ...p, isReady: true } : p)
      );
    });

    newSocket.on('roomStatsUpdate', (data: any) => {
      // Update room stats
      setRoom(prev => prev ? {
        ...prev,
        currentParticipants: data.currentParticipants,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants,
        isStarted: data.isStarted,
        isWaiting: data.isWaiting
      } : null);
      
      // Update participants list
      setParticipants(data.participants);
      
      // Update participant tabs for TV display
      setParticipantTabs(data.participants.map((p: any) => ({
        id: p.id,
        name: p.user && p.user.address ? `${p.user.address.slice(0, 6)}...${p.user.address.slice(-4)}` : 'Unknown',
        address: p.user?.address || '',
        isReady: p.isReady,
        isAdmin: p.isAdmin
      })));
      
      // Log stats update
      console.log('Stats updated');
    });

    newSocket.on('participantJoined', (data: { walletAddress: string, timestamp: string }) => {
      // Show join notification
      const shortAddress = `${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}`;
      setParticipantJoinNotification(`User ${shortAddress} joined the room`);
      setTimeout(() => {
        setParticipantJoinNotification('');
      }, 3000);
      
      console.log('Participant joined:', data.walletAddress);
    });

    newSocket.on('participantLeft', (participantId: string) => {
      // Find the participant who left before removing them
      const leavingParticipant = participants.find(p => p.id === participantId);
      const participantName = leavingParticipant && leavingParticipant.user && leavingParticipant.user.address 
        ? `${leavingParticipant.user.address.slice(0, 6)}...${leavingParticipant.user.address.slice(-4)}` 
        : 'Unknown';
      
      // Remove participant from local state
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      setParticipantTabs(prev => prev.filter(p => p.id !== participantId));
      
      // Remove from leaderboard if they were there
      setLeaderboard(prev => prev.filter(p => {
        return leavingParticipant ? p.userId !== leavingParticipant.userId : true;
      }));
      
      // Show leave notification
      setParticipantLeaveNotification(`${participantName} left the room`);
      setTimeout(() => {
        setParticipantLeaveNotification('');
      }, 3000);
      
      console.log('Participant left:', participantId);
    });

    newSocket.on('gameStarting', (countdownTime: number) => {
      console.log('=== gameStarting event received ===');
      console.log('Countdown time received:', countdownTime);
      console.log('Previous gameState:', gameState);
      
      setGameState('countdown');
      setCountdown(countdownTime);
      setCountdownDisplay(countdownTime);
      setShowCountdownDisplay(true);
      setQuizStartTime(new Date());
      
      console.log('New gameState set to:', 'countdown');
      console.log('Countdown set to:', countdownTime);
      console.log('CountdownDisplay set to:', countdownTime);
      console.log('=== gameStarting event processed ===');
    });

    newSocket.on('tvMessage', (message: string) => {
      setTvMessage(message);
    });

    newSocket.on('adminMessageReceived', (data: { message: string, timestamp: string }) => {
      console.log('Received adminMessageReceived event:', data);
      
      // Clear any existing timeouts
      if (messageTimeout) {
        clearTimeout(messageTimeout);
        setMessageTimeout(null);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        setFadeTimeout(null);
      }
      
      setAdminMessageDisplay(data.message);
      setShowAdminMessage(true);
      // Also update the TV message
      setTvMessage(data.message);
      console.log('Updated tvMessage to:', data.message);
      
      // Calculate duration based on word count: min 5s, max 10s
      const wordCount = data.message.split(' ').length;
      const duration = Math.min(Math.max(wordCount * 0.5, 5), 10) * 1000; // Convert to milliseconds
      
      console.log('Message duration:', duration, 'ms, word count:', wordCount);
      
      // Set message duration and start progress animation
      setMessageDuration(duration);
      setMessageProgress(100);
      
      // Animate progress bar smoothly
      const startTime = Date.now();
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, 100 - (elapsed / duration) * 100);
        setMessageProgress(progress);
        
        if (progress > 0) {
          requestAnimationFrame(animateProgress);
        }
      };
      requestAnimationFrame(animateProgress);
      
      // Auto-hide after calculated duration
      const timeout = setTimeout(() => {
        console.log('Hiding message after duration:', duration, 'ms');
        setShowAdminMessage(false);
        // Start fade out by reducing progress to 0
        setMessageProgress(0);
        // Wait for fade out animation then clear message
        const fadeOut = setTimeout(() => {
          console.log('Clearing tvMessage completely');
          setTvMessage('');
          setMessageProgress(100);
          setShowAdminMessage(false);
          setMessageTimeout(null);
          setFadeTimeout(null);
        }, 500);
        setFadeTimeout(fadeOut);
      }, duration);
      
      setMessageTimeout(timeout);
    });

    newSocket.on('countdownUpdate', (timeLeft: number) => {
      console.log('=== countdownUpdate event received ===');
      console.log('Time left:', timeLeft);
      console.log('Current gameState:', gameState);
      
      setCountdown(timeLeft);
      setCountdownDisplay(timeLeft);
      
      // When countdown reaches 0, transition to playing state
      if (timeLeft <= 0) {
        console.log('Countdown finished, transitioning to playing state');
        setGameState('playing');
        setShowCountdownDisplay(false);
        console.log('GameState changed to: playing');
      }
      
      console.log('=== countdownUpdate event processed ===');
    });

    newSocket.on('questionStart', (question: Question) => {
      setGameState('playing');
      setCurrentQuestion(question);
      setQuestionTimeLeft(question.timeLimit);
      setSelectedAnswers([]);
      setShowAnswerReveal(false);
      setCurrentAnswer(null);
    });

    newSocket.on('questionEnd', () => {
      setCurrentQuestion(null);
      setQuestionTimeLeft(0);
    });

    newSocket.on('questionTimeUpdate', (timeLeft: number) => {
      setQuestionTimeLeft(timeLeft);
    });

    newSocket.on('answerReveal', (data: {questionId: string, correctAnswer: string, userAnswers: Array<{userId: string, answerId: string, isCorrect: boolean, points: number}>}) => {
      setShowAnswerReveal(true);
      setCurrentAnswer(data);
      
      // Hide answer reveal after 10 seconds and show leaderboard
      setTimeout(() => {
        setShowAnswerReveal(false);
        setCurrentAnswer(null);
      }, 10000);
    });

    newSocket.on('leaderboardUpdate', (newLeaderboard: Array<{userId: string, score: number, name: string}>) => {
      setLeaderboard(newLeaderboard);
    });

    newSocket.on('gameEnd', (finalLeaderboard: any[]) => {
      setGameState('finished');
      setLeaderboard(finalLeaderboard);
      // Start distributing rewards if enabled
      if (room?.snarkel?.rewardsEnabled) {
        setDistributingRewards(true);
      }
    });

    newSocket.on('rewardsDistributed', (data: {success: boolean, message: string, results?: any[], error?: string}) => {
      setDistributingRewards(false);
      
      if (data.success) {
        // Show success notification
        setTvMessage(`🎉 ${data.message}`);
        setRewardsDistributed(true);
        // Refresh rewards data
        // The useSessionRewards hook will automatically refetch
      } else {
        // Show error notification
        setTvMessage(`❌ ${data.message}: ${data.error}`);
      }
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setTvMessage('');
      }, 5000);
    });

    newSocket.on('roomEmpty', () => {
      setGameState('waiting');
      setCurrentQuestion(null);
      setQuestionTimeLeft(0);
      setSelectedAnswers([]);
      setShowAnswerReveal(false);
      setCurrentAnswer(null);
      setLeaderboard([]);
      setError('All participants have left the room. The quiz has been reset.');
    });

    newSocket.on('error', (error: string) => {
      setError(error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  };

  const toggleReady = () => {
    if (socket) {
      socket.emit('toggleReady');
      setIsReady(!isReady);
    }
  };

  // Remove the startGame function - it's redundant
  // const startGame = () => {
  //   console.log('startGame called, socket:', !!socket, 'isAdmin:', isAdmin);
  //   if (socket && isAdmin) {
  //     console.log('Opening countdown modal, current state:', showCountdownModal);
  //     setShowCountdownModal(true);
  //     console.log('Modal state set to true');
  //   } else {
  //     console.log('Cannot open modal:', { hasSocket: !!socket, isAdmin });
  //   }
  // };

  const confirmStartGame = () => {
    console.log('=== confirmStartGame called ===');
    console.log('Socket exists:', !!socket);
    console.log('Is admin:', isAdmin);
    console.log('Current countdownTime (minutes):', countdownTime);
    console.log('Current gameState:', gameState);
    
    if (socket && isAdmin) {
      // Convert minutes to seconds before sending to server
      const countdownSeconds = countdownTime * 60;
      console.log(`Converting ${countdownTime} minutes to ${countdownSeconds} seconds`);
      console.log(`Emitting startGame event with countdownTime: ${countdownSeconds}`);
      
      socket.emit('startGame', { countdownTime: countdownSeconds });
      
      console.log('Closing countdown modal');
      setShowCountdownModal(false);
      
      console.log('=== confirmStartGame completed ===');
    } else {
      console.log('Cannot start game:', { hasSocket: !!socket, isAdmin });
    }
  };

  const sendMessage = () => {
    if (socket && isAdmin && adminMessage.trim()) {
      const message = adminMessage.trim();
      
      console.log('Sending message:', message);
      console.log('Socket connected:', socket.connected);
      console.log('Is admin:', isAdmin);
      
      // Clear previous message and reset progress
      setTvMessage('');
      setMessageProgress(100);
      setShowAdminMessage(false);
      
      // Emit the socket event - let the socket event handle setting tvMessage
      socket.emit('sendMessage', { message });
      
      setMessageSentNotification('Message sent successfully!');
      setAdminMessage('');
      setShowAdminMessageModal(false);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setMessageSentNotification('');
      }, 3000);
    } else {
      console.log('Cannot send message:', { 
        hasSocket: !!socket, 
        isAdmin, 
        hasMessage: !!adminMessage.trim(),
        socketConnected: socket?.connected 
      });
    }
  };

  const selectAnswer = (optionId: string) => {
    if (selectedAnswers.includes(optionId)) {
      setSelectedAnswers(prev => prev.filter(id => id !== optionId));
    } else {
      setSelectedAnswers(prev => [...prev, optionId]);
    }
  };

  // Answer submission is now handled immediately when option is clicked
  // No separate submit function needed

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    router.push('/join');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h1 className="text-2xl font-handwriting font-bold text-gray-800 mb-2">
            Connect Wallet to Join
          </h1>
          <p className="text-gray-600 mb-6">Connect your wallet to participate in the quiz</p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Joining quiz room...</p>
        </div>
      </div>
    );
  }

  if (error || joinError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-handwriting font-bold text-gray-800 mb-2">
            Join Error
          </h1>
          <p className="text-gray-600 mb-6">{error || joinError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setJoinError(null);
                router.push('/join');
              }}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors mr-3"
            >
              Back to Join
            </button>
            <button
              onClick={() => {
                setError(null);
                setJoinError(null);
                window.location.reload();
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Enhanced Header with Admin Status */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-handwriting font-bold text-gray-800">
                  {snarkel?.title}
                </h1>
                <p className="text-gray-600 text-sm">{room?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Wallet Connection Status */}
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg shadow-md">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="font-handwriting text-sm font-medium text-white">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 rounded text-xs text-white">
                        <Trophy className="w-3 h-3" />
                        Admin
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <Wallet className="w-4 h-4 text-gray-800" />
                    <span className="font-handwriting text-sm font-medium text-gray-800">
                      Connect Wallet
                    </span>
                  </div>
                )}
                <WalletConnectButton />
              </div>
              

              
              {/* Exit Button */}
              <button
                onClick={leaveRoom}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                <LogOut size={16} />
                Exit Room
              </button>
            </div>
          </div>
        </div>
      </div>





      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* TV Display for All Participants */}
        {room && snarkel && (
          <div className="mb-6">
            <div className="bg-black rounded-xl shadow-2xl p-8 border-4 border-gray-800 relative overflow-hidden">
              <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute top-2 left-6 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div className="absolute top-2 left-10 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              
              <div className="text-center text-white">
                <h2 className="text-4xl font-handwriting font-bold mb-4 text-blue-400">
                  📺 SNARKEL TV
                </h2>
                {room?.sessionNumber && (
                  <div className="text-center mb-2">
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                      Session #{room.sessionNumber}
                    </span>
                  </div>
                )}
                
                {/* Future Start Time Countdown - Prominent Display */}
                {showFutureStartCountdown && futureStartCountdown !== null && (
                  <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-lg p-8 mb-6 border-4 border-purple-400 shadow-2xl animate-pulse">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Clock className="w-12 h-12 text-yellow-400 animate-bounce" />
                        <h3 className="text-3xl font-handwriting font-bold text-white">⏰ Quiz Starts In</h3>
                        <Clock className="w-12 h-12 text-yellow-400 animate-bounce" />
                      </div>
                      <div className="text-8xl font-bold text-yellow-400 mb-4 font-mono">
                        {formatTime(futureStartCountdown)}
                      </div>
                      <p className="text-2xl font-handwriting text-blue-200 mb-2">
                        Scheduled Start: {room?.scheduledStartTime ? new Date(room.scheduledStartTime).toLocaleString() : ''}
                      </p>
                      <p className="text-xl text-purple-200 font-handwriting">
                        🎯 Get ready! The quiz will begin automatically
                      </p>
                    </div>
                  </div>
                )}

                {/* Dynamic Content Based on Game State */}
                {gameState === 'countdown' && countdownDisplay > 0 ? (
                  <div className="bg-gradient-to-r from-red-900 to-pink-900 rounded-lg p-6 mb-4 animate-pulse">
                    <div className="text-6xl font-bold text-white mb-2">{formatTime(countdownDisplay)}</div>
                    <p className="text-xl font-handwriting">Quiz Starting Soon!</p>
                  </div>
                ) : gameState === 'waiting' && !showFutureStartCountdown ? (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-4">
                    <h3 className="text-2xl font-handwriting font-bold text-white mb-4">🎯 Quiz Room Ready</h3>
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div>
                        <div className="text-4xl font-bold text-yellow-400 mb-2">{participants.length}</div>
                        <p className="text-blue-200">Participants</p>
                      </div>
                      <div>
                        <div className="text-4xl font-bold text-green-400 mb-2">{participants.filter(p => p.isReady).length}</div>
                        <p className="text-blue-200">Ready</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-blue-200 text-lg">
                        {participants.filter(p => p.isReady).length >= (room?.minParticipants || 1) 
                          ? '✅ Ready to start!' 
                          : `⏳ Need ${(room?.minParticipants || 1) - participants.filter(p => p.isReady).length} more ready`
                        }
                      </p>
                    </div>
                  </div>
                ) : null}
                
                {/* Question Display - Prominent when playing */}
                {gameState === 'playing' && currentQuestion && !showAnswerReveal && (
                  <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-8 mb-6 border-4 border-blue-400 shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <h3 className="text-3xl font-handwriting font-bold text-white">🎯 Question</h3>
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-800 rounded-lg border-2 border-red-600">
                          <Clock className="w-6 h-6 text-white animate-pulse" />
                          <span className="font-bold text-white text-xl">{formatTime(questionTimeLeft)}</span>
                        </div>
                      </div>
                      <p className="text-3xl font-handwriting text-white leading-relaxed">{currentQuestion.text}</p>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-4 border-2 border-gray-600">
                      <div 
                        className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-linear shadow-lg"
                        style={{ 
                          width: `${((currentQuestion.timeLimit - questionTimeLeft) / currentQuestion.timeLimit) * 100}%` 
                        }}
                      ></div>
                    </div>
                    
                    {/* Answer Options Preview */}
                    <div className="text-center">
                      <p className="text-blue-200 text-lg font-handwriting">
                        Select your answer below ↓
                      </p>
                    </div>
                  </div>
                )}

                {/* Answer Reveal Display - Prominent after question */}
                {showAnswerReveal && currentAnswer && (
                  <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg p-8 mb-6 border-4 border-yellow-400 shadow-2xl animate-pulse">
                    <div className="text-center mb-6">
                      <h3 className="text-4xl font-handwriting font-bold text-white mb-4">🎉 Answer Reveal!</h3>
                      <div className="text-6xl font-handwriting font-bold text-yellow-400 mb-4 animate-bounce">
                        {currentAnswer.correctAnswer}
                      </div>
                      <p className="text-xl text-yellow-200 font-handwriting">Correct Answer</p>
                    </div>
                    
                    {/* User Answers with Better Layout */}
                    <div className="space-y-3 mb-4">
                      <h4 className="text-xl font-handwriting font-bold text-white text-center mb-4">Player Results</h4>
                      {currentAnswer.userAnswers.map((userAnswer, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-600">
                          <span className="text-white font-medium text-lg">
                            {(() => {
                              const participant = participants.find(p => p.userId === userAnswer.userId);
                              return participant && participant.user && participant.user.address 
                                ? `${participant.user.address.slice(0, 6)}...${participant.user.address.slice(-4)}` 
                                : 'Unknown';
                            })()}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-lg font-bold ${
                              userAnswer.isCorrect ? 'bg-green-600 text-white border-2 border-green-400' : 'bg-red-600 text-white border-2 border-red-400'
                            }`}>
                              {userAnswer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                            </span>
                            <span className="text-yellow-400 font-bold text-xl">
                              +{userAnswer.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leaderboard Display - Prominent when available */}
                {leaderboard.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-6 border-4 border-blue-400 shadow-2xl">
                    <h3 className="text-4xl font-handwriting font-bold text-white mb-6 text-center">🏆 Leaderboard</h3>
                    <div className="space-y-3">
                      {leaderboard.slice(0, 5).map((entry, index) => (
                        <div key={entry.userId} className={`flex items-center justify-between rounded-lg p-4 transition-all duration-300 ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 border-2 border-yellow-400' :
                          index === 1 ? 'bg-gradient-to-r from-gray-600 to-gray-700 border-2 border-gray-400' :
                          index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700 border-2 border-orange-400' :
                          'bg-gray-800 border-2 border-gray-600'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              index === 0 ? 'bg-yellow-500 shadow-lg' : 
                              index === 1 ? 'bg-gray-400 shadow-lg' : 
                              index === 2 ? 'bg-orange-500 shadow-lg' : 'bg-gray-600'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <span className="text-white font-medium text-lg">{entry.name}</span>
                          </div>
                          <span className="text-yellow-400 font-bold text-2xl">{entry.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Admin Message - Prominent when displayed */}
                {tvMessage && gameState !== 'playing' && (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-6 border-4 border-blue-400 shadow-2xl relative overflow-hidden transition-all duration-500">
                    {/* Enhanced Fading Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-100 ease-linear rounded-full"
                         style={{ width: `${messageProgress}%` }}>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-300" />
                      <h3 className="font-handwriting font-bold text-2xl text-blue-300">📢 Admin Message</h3>
                    </div>
                    <p className="text-3xl font-handwriting text-white text-center leading-relaxed">{tvMessage}</p>
                  </div>
                )}
                

                
                {/* Recent Joins - Enhanced display */}
                {participantTabs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-handwriting font-bold mb-4 text-center text-yellow-400">🎉 Recent Joins</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {participantTabs.slice(-3).map((participant, index) => (
                        <div
                          key={participant.id}
                          className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-500 hover:scale-105 ${
                            participant.isAdmin 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg border-2 border-yellow-300' 
                              : participant.isReady
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-lg border-2 border-green-300'
                              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-black shadow-lg border-2 border-blue-300'
                          }`}
                          style={{
                            animationDelay: `${index * 200}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                          }}
                        >
                          <div className="w-5 h-5 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                            {participant.isAdmin ? (
                              <Crown className="w-3 h-3" />
                            ) : participant.isReady ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                          </div>
                          <span className="text-sm font-bold">
                            {participant.name}
                          </span>
                          {participant.isAdmin && (
                            <Crown className="w-3 h-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Future Start Time Notification for Participants */}
                {showFutureStartCountdown && futureStartCountdown !== null && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-lg p-4 text-white text-center animate-pulse border-2 border-purple-400 shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400 animate-bounce" />
                        <span className="font-handwriting font-bold text-lg">
                          ⏰ Quiz starts in {formatTime(futureStartCountdown)} - Get ready!
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Join Notification */}
                {participantJoinNotification && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg p-4 text-white text-center animate-pulse border-2 border-green-400 shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                        <span className="font-handwriting font-bold text-lg">🎉 {participantJoinNotification}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Sent Notification */}
                {messageSentNotification && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg p-4 text-white text-center animate-pulse border-2 border-green-400 shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                        <span className="font-handwriting font-bold text-lg">📢 {messageSentNotification}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leave Notification */}
                {participantLeaveNotification && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-red-800 to-orange-800 rounded-lg p-4 text-white text-center animate-pulse border-2 border-red-400 shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce"></div>
                        <span className="font-handwriting font-bold text-lg">👋 {participantLeaveNotification}</span>
                      </div>
                    </div>
                  </div>
                )}
                

              </div>
            </div>
          </div>
        )}



                 {/* Answer Grid for All Participants */}
         {gameState === 'playing' && currentQuestion && (
           <div className="mt-6">
             <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
               {currentQuestion.options.map((option, index) => (
                 <button
                   key={option.id}
                   onClick={() => {
                     // Immediately submit the answer when clicked
                     socket?.emit('submitAnswer', {
                       roomId: room?.id,
                       questionId: currentQuestion.id,
                       answerId: option.id,
                       timeLeft: questionTimeLeft
                     });
                     // Disable all buttons after selection
                     setSelectedAnswers([option.id]);
                   }}
                   disabled={selectedAnswers.length > 0}
                   className={`p-6 rounded-xl border-2 transition-all duration-300 text-left font-handwriting text-lg ${
                     selectedAnswers.includes(option.id)
                       ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                       : selectedAnswers.length > 0
                       ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                       : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                       selectedAnswers.includes(option.id)
                         ? 'border-green-500 bg-green-500'
                         : 'border-gray-300'
                     }`}>
                       {selectedAnswers.includes(option.id) && (
                         <CheckCircle className="w-5 h-5 text-white" />
                       )}
                     </div>
                     <span className="font-medium text-gray-800">{option.text}</span>
                   </div>
                 </button>
               ))}
             </div>
             
             {selectedAnswers.length > 0 && (
               <div className="mt-6 text-center">
                 <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                   <CheckCircle className="w-5 h-5" />
                   <span className="font-handwriting font-bold">Answer Submitted!</span>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* Show Participant Room for non-admin users */}
        {!isAdmin && room && snarkel && (
          <ParticipantRoom
            socket={socket}
            room={room}
            snarkel={snarkel}
            participants={participants}
            isReady={isReady}
            onToggleReady={toggleReady}
            gameState={gameState}
            currentQuestion={currentQuestion}
            questionTimeLeft={questionTimeLeft}
            selectedAnswers={selectedAnswers}
            onSelectAnswer={selectAnswer}
            onSubmitAnswer={() => {}} // Not needed anymore - immediate submission
            leaderboard={leaderboard}
            tvMessage={tvMessage}
            countdown={countdown}
            onLeaveRoom={leaveRoom}
          />
        )}

        {/* Show Admin Interface for admin users */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
            {gameState === 'waiting' && (
              <div className="space-y-6">

                {/* Future Start Time Info for Admin */}
                {showFutureStartCountdown && futureStartCountdown !== null && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-handwriting font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-500" />
                        ⏰ Scheduled Quiz Start
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Auto-Start Enabled</span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-handwriting font-bold text-gray-700 mb-2">Countdown</h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-1">{formatTime(futureStartCountdown)}</div>
                          <p className="text-sm text-gray-600">Time Remaining</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-handwriting font-bold text-gray-700 mb-2">Start Time</h4>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-1">
                            {room?.scheduledStartTime ? new Date(room.scheduledStartTime).toLocaleTimeString() : ''}
                          </div>
                          <p className="text-sm text-gray-600">
                            {room?.scheduledStartTime ? new Date(room.scheduledStartTime).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 text-center">
                        💡 The quiz will start automatically when the scheduled time is reached. 
                        Participants can join and get ready while waiting.
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Admin Controls */}
                {isAdmin && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-handwriting font-bold text-gray-800 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        🎮 Admin Dashboard
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Admin Mode</span>
                        </div>
                        <button
                          onClick={() => setShowAdminControls(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all duration-300 font-handwriting font-bold shadow-md"
                        >
                          <Settings size={16} />
                          Full Controls
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-handwriting font-bold text-gray-700 mb-2">Room Stats</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Participants:</span>
                            <span className="font-bold">{participants.length}/{room?.maxParticipants}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ready:</span>
                            <span className="font-bold text-green-600">{participants.filter(p => p.isReady).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Min Required:</span>
                            <span className="font-bold">{room?.minParticipants}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-handwriting font-bold text-gray-700 mb-2">Quiz Info</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Questions:</span>
                            <span className="font-bold">{snarkel?.totalQuestions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Base Points:</span>
                            <span className="font-bold">{snarkel?.basePointsPerQuestion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Speed Bonus:</span>
                            <span className="font-bold">{snarkel?.speedBonusEnabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowCountdownModal(true)}
                        disabled={participants.filter(p => p.isReady).length < (room?.minParticipants || 1)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-400 hover:to-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-handwriting font-bold shadow-md"
                      >
                        <Play size={18} />
                        Start Quiz
                      </button>
                      <button
                        onClick={() => setShowAdminMessageModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all duration-300 font-handwriting font-bold shadow-md"
                      >
                        <MessageSquare size={18} />
                        Send Message
                      </button>

                    </div>
                  </div>
                )}


              </div>
            )}

            {/* Admin Controls for Countdown State */}
            {gameState === 'countdown' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border-l-4 border-orange-400">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-handwriting font-bold text-gray-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      🎮 Quiz Starting
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Countdown Active</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-handwriting font-bold text-orange-600 mb-2">
                      {formatTime(countdownDisplay || 0)}
                    </div>
                    <p className="text-gray-600">Quiz starting soon...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Controls for Playing State */}
            {gameState === 'playing' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-l-4 border-green-400">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-handwriting font-bold text-gray-800 flex items-center gap-2">
                      <Play className="w-5 h-5 text-green-500" />
                      🎮 Quiz Active
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                      <Play className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Quiz Running</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-handwriting font-bold text-gray-700 mb-2">Current Question</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Left:</span>
                          <span className="font-bold text-red-600">{formatTime(questionTimeLeft)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Question:</span>
                          <span className="font-bold">{currentQuestion?.text?.slice(0, 30)}...</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-handwriting font-bold text-gray-700 mb-2">Quiz Progress</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Participants:</span>
                          <span className="font-bold">{participants.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-bold text-green-600">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {gameState === 'finished' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center mb-6">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-handwriting font-bold text-gray-800 mb-2">
                    Game Finished!
                  </h2>
                  <p className="text-gray-600">Here are the final results</p>
                </div>

                <div className="space-y-4">
                  {leaderboard.map((player, index) => (
                    <div key={player.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-handwriting font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold">{player.score} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Room Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-handwriting font-bold text-gray-800">
                  Room Info
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">{participants.length}/{room?.maxParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min to Start:</span>
                  <span className="font-medium">{room?.minParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session:</span>
                  <span className="font-medium">#{room?.sessionNumber || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    room?.isStarted ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {room?.isStarted ? 'Playing' : 'Waiting'}
                  </span>
                </div>
                {room?.scheduledStartTime && !room.isStarted && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="font-medium text-purple-600">
                      {new Date(room.scheduledStartTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {/* Admin Wallet Info */}
                {participants.find(p => p.isAdmin) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Quiz Admin:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium text-purple-600">
                            {participants.find(p => p.isAdmin)?.user.address.slice(0, 6)}...{participants.find(p => p.isAdmin)?.user.address.slice(-4)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded break-all">
                        {participants.find(p => p.isAdmin)?.user.address}
                      </div>
                      <div className="text-xs text-gray-500">
                        {participants.find(p => p.isAdmin)?.user.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>




           </div>
         </div>
        )}
       </div>

       {/* Countdown Modal */}
       {showCountdownModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
             <h3 className="text-xl font-handwriting font-bold text-gray-800 mb-4">
               ⏰ Set Countdown Time
             </h3>
             <div className="space-y-4">
               <div className="grid grid-cols-3 gap-3">
                 <button
                   onClick={() => setCountdownTime(1)}
                   className={`p-4 rounded-lg border-2 transition-all ${
                     countdownTime === 1 
                       ? 'border-purple-500 bg-purple-50' 
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <div className="text-2xl font-bold">1</div>
                   <div className="text-sm text-gray-600">Minute</div>
                 </button>
                 <button
                   onClick={() => setCountdownTime(2)}
                   className={`p-4 rounded-lg border-2 transition-all ${
                     countdownTime === 2 
                       ? 'border-purple-500 bg-purple-50' 
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <div className="text-2xl font-bold">2</div>
                   <div className="text-sm text-gray-600">Minutes</div>
                 </button>
                 <button
                   onClick={() => setCountdownTime(5)}
                   className={`p-4 rounded-lg border-2 transition-all ${
                     countdownTime === 5 
                       ? 'border-purple-500 bg-purple-50' 
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <div className="text-2xl font-bold">5</div>
                   <div className="text-sm text-gray-600">Minutes</div>
                 </button>
               </div>
               <div className="flex gap-3 pt-4">
                 <button
                   onClick={confirmStartGame}
                   className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                 >
                   Start Quiz
                 </button>
                 <button
                   onClick={() => setShowCountdownModal(false)}
                   className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Admin Message Modal */}
       {showAdminMessageModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
             <h3 className="text-xl font-handwriting font-bold text-gray-800 mb-4">
               📢 Send Message to All Participants
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Message
                 </label>
                 <textarea
                   value={adminMessage}
                   onChange={(e) => setAdminMessage(e.target.value)}
                   placeholder="Enter your message here..."
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                   rows={4}
                   maxLength={200}
                 />
                 <div className="text-xs text-gray-500 mt-1 text-right">
                   {adminMessage.length}/200
                 </div>
               </div>
               <div className="flex gap-3">
                 <button
                   onClick={sendMessage}
                   disabled={!adminMessage.trim()}
                   className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-handwriting font-bold hover:from-blue-400 hover:to-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                 >
                   Send Message
                 </button>
                 <button
                   onClick={() => {
                     setShowAdminMessageModal(false);
                     setAdminMessage('');
                   }}
                   className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-handwriting font-bold hover:bg-gray-600 transition-all duration-300"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Admin Controls Modal */}
       {showAdminControls && (
         <AdminControls
           socket={socket}
           room={room}
           snarkel={snarkel}
           participants={participants}
           isAdmin={isAdmin}
           onClose={() => setShowAdminControls(false)}
         />
       )}
     </div>
   );
 } 