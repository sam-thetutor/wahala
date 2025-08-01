'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { io, Socket } from 'socket.io-client';
import { isValidWalletAddress } from '@/lib/wallet-utils';
import { useQuizRewards } from '@/hooks/useQuizRewards';
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
  Coins
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
  
  // Initialize rewards functionality
  const {
    useSessionRewards,
    useHasClaimedReward,
    claimReward,
    formatRewardAmount
  } = useQuizRewards();
  
  const [room, setRoom] = useState<Room | null>(null);
  
  // Get session rewards
  const { data: sessionRewards, isLoading: rewardsLoading } = useSessionRewards(room?.sessionNumber);
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
  }, [isConnected, address, roomId]);

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
      setGameState('countdown');
      setCountdown(countdownTime);
      setQuizStartTime(new Date());
      // Countdown now shown on TV, no full-screen overlay
    });

    newSocket.on('tvMessage', (message: string) => {
      setTvMessage(message);
    });

    newSocket.on('adminMessageReceived', (data: { message: string, timestamp: string }) => {
      setAdminMessageDisplay(data.message);
      setShowAdminMessage(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowAdminMessage(false);
      }, 3000);
    });

    newSocket.on('countdownUpdate', (timeLeft: number) => {
      setCountdown(timeLeft);
      // Countdown now shown on TV, no full-screen overlay
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
      socket.emit('sendMessage', { message: adminMessage.trim() });
      setMessageSentNotification('Message sent successfully!');
      setAdminMessage('');
      setShowAdminMessageModal(false);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setMessageSentNotification('');
      }, 3000);
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
              
              {/* Admin Quick Actions */}
              {isAdmin && gameState === 'waiting' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={sendMessage}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <MessageSquare size={14} />
                    Message
                  </button>
                  <button
                    onClick={startGame}
                    disabled={participants.filter(p => p.isReady).length < (room?.minParticipants || 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={16} />
                    Start Quiz
                  </button>
                </div>
              )}
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
                
                {/* Countdown Display */}
                {countdown && (gameState === 'countdown' || room?.scheduledStartTime) && (
                  <div className="bg-gradient-to-r from-red-900 to-pink-900 rounded-lg p-6 mb-4 animate-pulse">
                    <div className="text-6xl font-bold text-white mb-2">{formatTime(countdown)}</div>
                    <p className="text-xl font-handwriting">Quiz Starting Soon!</p>
                  </div>
                )}
                
                                 {/* Question Display */}
                 {gameState === 'playing' && currentQuestion && !showAnswerReveal && (
                   <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 mb-4">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-2xl font-handwriting font-bold text-white">Question</h3>
                       <div className="flex items-center gap-2 px-4 py-2 bg-red-800 rounded-lg">
                         <Clock className="w-5 h-5 text-white" />
                         <span className="font-bold text-white">{formatTime(questionTimeLeft)}</span>
                       </div>
                     </div>
                     <p className="text-2xl font-handwriting text-white mb-4">{currentQuestion.text}</p>
                     
                     {/* Dynamic Progress Bar */}
                     <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                       <div 
                         className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-linear"
                         style={{ 
                           width: `${((currentQuestion.timeLimit - questionTimeLeft) / currentQuestion.timeLimit) * 100}%` 
                         }}
                       ></div>
                     </div>
                   </div>
                 )}

                 {/* Answer Reveal Display */}
                 {showAnswerReveal && currentAnswer && (
                   <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg p-6 mb-4">
                     <div className="text-center mb-4">
                       <h3 className="text-2xl font-handwriting font-bold text-white mb-2">Answer Reveal!</h3>
                       <div className="text-4xl font-handwriting font-bold text-yellow-400 mb-2">
                         {currentAnswer.correctAnswer}
                       </div>
                     </div>
                     
                     {/* User Answers */}
                     <div className="space-y-2 mb-4">
                       {currentAnswer.userAnswers.map((userAnswer, index) => (
                         <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                           <span className="text-white font-medium">
                             {(() => {
                               const participant = participants.find(p => p.userId === userAnswer.userId);
                               return participant && participant.user && participant.user.address 
                                 ? `${participant.user.address.slice(0, 6)}...${participant.user.address.slice(-4)}` 
                                 : 'Unknown';
                             })()}
                           </span>
                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-1 rounded text-sm font-bold ${
                               userAnswer.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                             }`}>
                               {userAnswer.isCorrect ? '✓' : '✗'}
                             </span>
                             <span className="text-yellow-400 font-bold">
                               +{userAnswer.points} pts
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Leaderboard Display */}
                 {leaderboard.length > 0 && (
                   <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-4">
                     <h3 className="text-2xl font-handwriting font-bold text-white mb-4 text-center">🏆 Leaderboard</h3>
                     <div className="space-y-2">
                       {leaderboard.slice(0, 5).map((entry, index) => (
                         <div key={entry.userId} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                           <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                               index === 0 ? 'bg-yellow-500' : 
                               index === 1 ? 'bg-gray-400' : 
                               index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                             }`}>
                               {index + 1}
                             </div>
                             <span className="text-white font-medium">{entry.name}</span>
                           </div>
                           <span className="text-yellow-400 font-bold text-lg">{entry.score} pts</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                
                {/* Admin Message */}
                {tvMessage && gameState !== 'playing' && (
                  <div className="bg-blue-900 rounded-lg p-6 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-300" />
                      <h3 className="font-handwriting font-bold text-lg text-blue-300">Admin Message</h3>
                    </div>
                    <p className="text-2xl font-handwriting text-white">{tvMessage}</p>
                  </div>
                )}
                
                {/* Default Message */}
                {!tvMessage && gameState === 'waiting' && (
                  <div className="bg-gray-900 rounded-lg p-6 mb-4">
                    <p className="text-xl text-gray-300">Waiting for admin message...</p>
                  </div>
                )}
                
                {/* Recent Joins */}
                {participantTabs.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-handwriting font-bold mb-2 text-yellow-400">Recent Joins</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {participantTabs.slice(-3).map((participant, index) => (
                        <div
                          key={participant.id}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${
                            participant.isAdmin 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg' 
                              : participant.isReady
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-lg'
                              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-black shadow-lg'
                          }`}
                          style={{
                            animationDelay: `${index * 200}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                          }}
                        >
                          <div className="w-4 h-4 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                            {participant.isAdmin ? (
                              <Crown className="w-2 h-2" />
                            ) : participant.isReady ? (
                              <CheckCircle className="w-2 h-2" />
                            ) : (
                              <Users className="w-2 h-2" />
                            )}
                          </div>
                          <span className="text-xs font-medium">
                            {participant.name}
                          </span>
                          {participant.isAdmin && (
                            <Crown className="w-2 h-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Join Notification */}
                {participantJoinNotification && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg p-3 text-white text-center animate-pulse">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-handwriting font-bold">{participantJoinNotification}</span>
                      </div>
                    </div>
                  </div>
                )}

                                 {/* Message Sent Notification */}
                 {messageSentNotification && (
                   <div className="mb-4">
                     <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg p-3 text-white text-center animate-pulse">
                       <div className="flex items-center justify-center gap-2">
                         <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                         <span className="font-handwriting font-bold">{messageSentNotification}</span>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Leave Notification */}
                 {participantLeaveNotification && (
                   <div className="mb-4">
                     <div className="bg-gradient-to-r from-red-800 to-orange-800 rounded-lg p-3 text-white text-center animate-pulse">
                       <div className="flex items-center justify-center gap-2">
                         <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                         <span className="font-handwriting font-bold">{participantLeaveNotification}</span>
                       </div>
                     </div>
                   </div>
                 )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-gray-400">Participants</p>
                    <p className="text-2xl font-bold text-green-400">{participants.length}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-gray-400">Ready</p>
                    <p className="text-2xl font-bold text-yellow-400">{participants.filter(p => p.isReady).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {room && sessionRewards && sessionRewards.length > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-2xl p-6 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-2xl font-handwriting font-bold text-gray-800">
                    Quiz Rewards
                  </h3>
                </div>
                <button
                  onClick={() => setShowRewardsSection(!showRewardsSection)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  {showRewardsSection ? 'Hide' : 'View'} Rewards
                </button>
              </div>
              
              {showRewardsSection && (
                <div className="space-y-4">
                  {rewardsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                      <span className="ml-2 text-gray-600">Loading rewards...</span>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {sessionRewards.map((reward, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Coins className="w-6 h-6 text-yellow-500" />
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {reward.tokenSymbol} ({reward.tokenName})
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatRewardAmount(reward.amount)} tokens
                                </div>
                                <div className="text-xs text-gray-500">
                                  Network: {reward.network}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {reward.isDistributed ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                  Available to Claim
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                                  Pending Distribution
                                </span>
                              )}
                              
                              {!reward.isDistributed && (
                                <button
                                  onClick={() => room?.sessionNumber && claimReward(room.sessionNumber, reward.tokenAddress)}
                                  className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                                >
                                  Claim
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                        onClick={startGame}
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
                      <button
                        onClick={() => setShowCountdownModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-400 hover:to-red-500 transition-all duration-300 font-handwriting font-bold shadow-md"
                      >
                        <Clock size={18} />
                        Set Countdown
                      </button>
                    </div>
                  </div>
                )}

                {/* Participant Controls */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-handwriting font-bold text-gray-800 mb-2">
                      Waiting Room
                    </h2>
                    <p className="text-gray-600">
                      Waiting for participants to join and get ready...
                    </p>
                  </div>

                  <div className="flex items-center justify-center mb-6">
                    <button
                      onClick={toggleReady}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-handwriting font-medium transition-all ${
                        isReady 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isReady ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      {isReady ? 'Ready' : 'Not Ready'}
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-handwriting font-bold text-purple-600 mb-2">
                      {participants.filter(p => p.isReady).length} / {room?.minParticipants || 1}
                    </div>
                    <p className="text-gray-600">Ready to start</p>
                  </div>

                  {/* Animated Participant Tabs */}
                  <div className="mt-6">
                    <h3 className="text-lg font-handwriting font-bold text-gray-700 mb-4 text-center">
                      Participants Joining...
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {participantTabs.map((participant, index) => (
                        <div
                          key={participant.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-500 transform hover:scale-105 ${
                            participant.isAdmin 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' 
                              : participant.isReady
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
                              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg'
                          }`}
                          style={{
                            animationDelay: `${index * 200}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                            {participant.isAdmin ? (
                              <Trophy className="w-3 h-3" />
                            ) : participant.isReady ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {participant.name}
                          </span>
                          {participant.isAdmin && (
                            <Crown className="w-3 h-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                      {formatTime(countdown || 0)}
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

            {gameState === 'countdown' && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h2 className="text-3xl font-handwriting font-bold text-gray-800 mb-4">
                  Game Starting in...
                </h2>
                <div className="text-6xl font-bold text-purple-600 mb-4">
                  {countdown}
                </div>
                <p className="text-gray-600">Get ready!</p>
              </div>
            )}

            {gameState === 'playing' && currentQuestion && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-handwriting font-bold text-gray-800">
                    Question
                  </h2>
                  <div className="flex items-center gap-2 text-red-600">
                    <Clock size={20} />
                    <span className="text-lg font-bold">{formatTime(questionTimeLeft)}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-lg text-gray-700 mb-4">{currentQuestion.text}</p>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => selectAnswer(option.id)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedAnswers.includes(option.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers.includes(option.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAnswers.includes(option.id) && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="font-handwriting">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="text-gray-500 text-sm">
                    Click an option to submit your answer immediately
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

            {/* Enhanced Participants */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-handwriting font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    participant.isAdmin ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        participant.isAdmin ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                        participant.isReady ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {participant.isAdmin ? <Trophy className="w-4 h-4" /> : 
                         participant.user?.address?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-handwriting text-sm font-medium">
                          {participant.user?.address ? `${participant.user.address.slice(0, 6)}...${participant.user.address.slice(-4)}` : 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {participant.user?.address ? `${participant.user.address.slice(0, 6)}...${participant.user.address.slice(-4)}` : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.isAdmin && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                          <Trophy className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-800">Admin</span>
                        </div>
                      )}
                      {participant.isReady && <CheckCircle size={16} className="text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Snarkel Info */}
            {snarkel && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-handwriting font-bold text-gray-800 mb-4">
                  Quiz Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{snarkel.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Points:</span>
                    <span className="font-medium">{snarkel.basePointsPerQuestion}</span>
                  </div>
                  {snarkel.speedBonusEnabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed Bonus:</span>
                      <span className="font-medium">+{snarkel.maxSpeedBonus}</span>
                    </div>
                  )}
                </div>
              </div>
                         )}
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