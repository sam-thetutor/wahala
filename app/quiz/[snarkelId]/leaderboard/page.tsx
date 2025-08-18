'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  Trophy, 
  Star, 
  Target, 
  Users, 
  Clock, 
  Award,
  ArrowLeft,
  Crown,
  Medal,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  DollarSign,
  Zap,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Gift,
  Wallet,
  Network,
  BarChart3,
  Calendar,
  Timer,
  Percent,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  Home
} from 'lucide-react';
import Link from 'next/link';


interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeToAnswer: number;
  timeLimit: number;
  selectedOption: string;
  correctOption: string;
  maxPoints: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  position: number;
  walletAddress: string;
  timeBonus?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  averageTimePerQuestion?: number;
  completedAt?: string;
  questionBreakdown: QuestionBreakdown[];
  accuracy: number;
}

interface Reward {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  totalRewardPool: string;
  isDistributed: boolean;
  distributedAt?: string;
  totalWinners?: number;
  rewardAllParticipants: boolean;
  rewardAmounts?: number[];
  minParticipants?: number;
  chainId: number;
  network: string;
}

interface QuizInfo {
  id: string;
  title: string;
  description?: string;
  snarkelCode: string;
  maxPossibleScore?: number;
  totalParticipants?: number;
  isCompleted?: boolean;
  completedAt?: string;
  hasRewards: boolean;
  rewards: Reward[];
  canDistributeRewards: boolean;
  onchainSessionId?: string;
  totalQuestions: number;
  questions: Array<{
    id: string;
    text: string;
    points: number;
    timeLimit: number;
  }>;
}

interface AdminDetails {
  isQuizCreator: boolean;
  creatorAddress: string;
  creatorName: string;
}

export default function QuizLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState<string | null>(null);
  const [distributingRewards, setDistributingRewards] = useState(false);
  const [rewardDistributionStatus, setRewardDistributionStatus] = useState<string>('');

  const snarkelId = params.snarkelId as string;

  useEffect(() => {
    if (snarkelId) {
      fetchLeaderboard();
    }
  }, [snarkelId, address]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz info and leaderboard with wallet address for admin check
      const url = address 
        ? `/api/quiz/${snarkelId}/leaderboard?walletAddress=${address}`
        : `/api/quiz/${snarkelId}/leaderboard`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setQuizInfo(data.quizInfo || null);
        setIsAdmin(data.isAdmin || false);
        setAdminDetails(data.adminDetails || null);
        
        // Find user position if connected
        if (isConnected && address) {
          const userEntry = data.leaderboard?.find((entry: LeaderboardEntry) => 
            entry.walletAddress.toLowerCase() === address.toLowerCase()
          );
          
          if (userEntry) {
            setUserPosition(userEntry.position);
            setUserScore(userEntry.score);
          }
        }
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const distributeRewards = async () => {
    if (!quizInfo || !isAdmin) return;
    
    try {
      setDistributingRewards(true);
      setRewardDistributionStatus('Starting reward distribution...');
      
      // Call the reward distribution API
      const response = await fetch('/api/quiz/distribute-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: quizInfo.id,
          sessionNumber: quizInfo.onchainSessionId || 1,
          finalLeaderboard: leaderboard.map(entry => ({
            userId: entry.userId,
            name: entry.name,
            score: entry.score
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to distribute rewards');
      }

      const result = await response.json();
      
      if (result.success) {
        setRewardDistributionStatus('Rewards distributed successfully!');
        // Refresh leaderboard to show updated reward status
        setTimeout(() => {
          fetchLeaderboard();
        }, 2000);
      } else {
        throw new Error(result.error || 'Reward distribution failed');
      }
    } catch (error) {
      console.error('Error distributing rewards:', error);
      setRewardDistributionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setDistributingRewards(false);
        setRewardDistributionStatus('');
      }, 3000);
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const formatPercentage = (score: number, maxScore: number) => {
    if (maxScore === 0) return '0%';
    return `${Math.round((score / maxScore) * 100)}%`;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRewardAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-orange-500" />;
    return null;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const toggleQuestionDetails = (userId: string) => {
    setShowQuestionDetails(showQuestionDetails === userId ? null : userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-handwriting font-bold text-gray-800 mb-2">
            Error Loading Leaderboard
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/quiz/${snarkelId}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Quiz</span>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-handwriting font-bold text-gray-800">
                  Quiz Leaderboard
                </h1>
                <p className="text-gray-600 text-sm">
                  {quizInfo?.title || 'Quiz Results'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {quizInfo?.snarkelCode && (
                <div className="bg-gray-100 px-2 sm:px-3 py-2 rounded-lg">
                  <span className="text-xs sm:text-sm font-mono text-gray-700">
                    #{quizInfo.snarkelCode}
                  </span>
                </div>
              )}
              {isAdmin && (
                <div className="bg-purple-100 px-2 sm:px-3 py-2 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-purple-700 flex items-center gap-1">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Quiz Admin</span>
                  </span>
                </div>
              )}
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Stats */}
      {quizInfo && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Participants</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-800">
                    {quizInfo.totalParticipants || leaderboard.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Max Score</p>
                  <p className="text-xl font-bold text-gray-800">
                    {quizInfo.maxPossibleScore ? formatScore(quizInfo.maxPossibleScore) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xl font-bold text-gray-800">
                    {quizInfo.isCompleted ? 'Completed' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Your Position</p>
                  <p className="text-xl font-bold text-gray-800">
                    {userPosition ? `#${userPosition}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Section */}
          {quizInfo.hasRewards && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <Gift className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Quiz Rewards</h3>
                </div>
                {isAdmin && quizInfo.canDistributeRewards && (
                  <button
                    onClick={distributeRewards}
                    disabled={distributingRewards}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    {distributingRewards ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {distributingRewards ? 'Distributing...' : 'Distribute Rewards'}
                  </button>
                )}
              </div>

              {rewardDistributionStatus && (
                <div className={`p-3 rounded-lg mb-4 ${
                  rewardDistributionStatus.includes('Error') 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {rewardDistributionStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {quizInfo.rewards.map((reward, index) => (
                  <div key={reward.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-800">
                          {reward.tokenSymbol || 'TOKEN'}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reward.isDistributed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reward.isDistributed ? 'Distributed' : 'Pending'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pool:</span>
                        <span className="font-medium">
                          {formatRewardAmount(reward.totalRewardPool)} {reward.tokenSymbol}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium">{reward.network}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strategy:</span>
                        <span className="font-medium">
                          {reward.rewardAllParticipants ? 'All Participants' : `Top ${reward.totalWinners || 5}`}
                        </span>
                      </div>
                      
                      {reward.isDistributed && reward.distributedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distributed:</span>
                          <span className="font-medium">
                            {new Date(reward.distributedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Functions */}
          {isAdmin && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-4 justify-center sm:justify-start">
                <Settings className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">Admin Functions</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-800 text-center sm:text-left">Quiz Management</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 text-center sm:text-left">
                    Manage quiz settings, participants, and game flow
                  </p>
                  <div className="text-center sm:text-left">
                    <Link
                      href={`/quiz/${snarkelId}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Manage Quiz
                    </Link>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-800 text-center sm:text-left">Analytics</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 text-center sm:text-left">
                    View detailed quiz analytics and participant performance
                  </p>
                  <div className="text-center sm:text-left">
                    <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                    <Gift className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-gray-800 text-center sm:text-left">Reward Management</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 text-center sm:text-left">
                    Configure and distribute quiz rewards
                  </p>
                  <div className="text-center sm:text-left">
                    <Link
                      href={`/admin`}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Rewards
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Position Highlight */}
      {isConnected && userPosition && userScore && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Performance</h3>
                  <p className="text-purple-100 text-sm sm:text-base">
                    Position #{userPosition} • {formatScore(userScore)} points
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-3xl font-bold">{userPosition}</div>
                <div className="text-purple-100 text-sm">Rank</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-6 py-4 border-b">
            <h2 className="text-lg sm:text-xl font-handwriting font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              Top {Math.min(10, leaderboard.length)} Players
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div key={entry.userId}>
                <div
                  className={`px-3 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    isConnected && address && entry.walletAddress.toLowerCase() === address.toLowerCase()
                      ? 'bg-purple-50 border-l-4 border-purple-500'
                      : ''
                  }`}
                  onClick={() => toggleQuestionDetails(entry.userId)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${getPositionColor(entry.position)}`}>
                        {getPositionIcon(entry.position) || entry.position}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                            {entry.name || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                          </span>
                          {isConnected && address && entry.walletAddress.toLowerCase() === address.toLowerCase() && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Target className="w-3 h-3" />
                            <span className="hidden sm:inline">{entry.totalQuestions || 'N/A'} questions</span>
                            <span className="sm:hidden">{entry.totalQuestions || 'N/A'}q</span>
                          </span>
                          {entry.correctAnswers !== undefined && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="hidden sm:inline">{entry.correctAnswers} correct</span>
                              <span className="sm:hidden">{entry.correctAnswers}✓</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Percent className="w-3 h-3" />
                            <span className="hidden sm:inline">{entry.accuracy.toFixed(1)}% accuracy</span>
                            <span className="sm:hidden">{entry.accuracy.toFixed(1)}%</span>
                          </span>
                          {entry.averageTimePerQuestion && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="hidden sm:inline">{formatTime(entry.averageTimePerQuestion)} avg</span>
                              <span className="sm:hidden">{formatTime(entry.averageTimePerQuestion)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center sm:text-right flex-shrink-0">
                      <div className="flex items-center justify-center sm:justify-end gap-2">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-gray-800">
                            {formatScore(entry.score)}
                          </div>
                          {quizInfo?.maxPossibleScore && (
                            <div className="text-xs sm:text-sm text-gray-500">
                              {formatPercentage(entry.score, quizInfo.maxPossibleScore)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {entry.timeBonus && entry.timeBonus > 0 && (
                        <div className="text-xs text-green-600 mt-1 text-center sm:text-right">
                          +{entry.timeBonus} time bonus
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Question Details Toggle */}
                  <div className="flex items-center justify-center mt-3">
                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      {showQuestionDetails === entry.userId ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Details */}
                {showQuestionDetails === entry.userId && (
                  <div className="bg-gray-50 px-3 sm:px-6 py-4 border-t">
                    <h4 className="font-medium text-gray-800 mb-3 text-center sm:text-left">Question Breakdown</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {entry.questionBreakdown.map((question, qIndex) => (
                        <div key={question.questionId} className="bg-white p-3 sm:p-4 rounded-lg border">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700 break-words">
                              Q{qIndex + 1}: {question.questionText.length > 40
                                ? question.questionText.substring(0, 40) + '...' 
                                : question.questionText
                              }
                            </span>
                            <div className={`flex items-center gap-1 justify-center sm:justify-start ${
                              question.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {question.isCorrect ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span className="text-xs font-medium">
                                {question.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium">Points:</span>
                              <span className="font-bold text-gray-800">
                                {question.pointsEarned}/{question.maxPoints}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium">Time:</span>
                              <span className="font-bold text-gray-800">
                                {formatTime(question.timeToAnswer)}/{formatTime(question.timeLimit)}
                              </span>
                            </div>
                            {!question.isCorrect && (
                              <div className="text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                                <div className="font-medium mb-1">Selected Answer:</div>
                                <div className="break-words">{question.selectedOption || 'N/A'}</div>
                                <div className="font-medium mt-1 mb-1">Correct Answer:</div>
                                <div className="break-words">{question.correctOption}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {leaderboard.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No results available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
