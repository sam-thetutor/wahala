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
  User
} from 'lucide-react';
import Link from 'next/link';

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

      // Fetch quiz info and leaderboard
      const response = await fetch(`/api/quiz/${snarkelId}/leaderboard`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setQuizInfo(data.quizInfo || null);
        
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/quiz/${snarkelId}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-handwriting font-bold text-gray-800">
                  Quiz Leaderboard
                </h1>
                <p className="text-gray-600 text-sm">
                  {quizInfo?.title || 'Quiz Results'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {quizInfo?.snarkelCode && (
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-mono text-gray-700">
                    #{quizInfo.snarkelCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Stats */}
      {quizInfo && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-xl font-bold text-gray-800">
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
        </div>
      )}

      {/* User Position Highlight */}
      {isConnected && userPosition && userScore && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Performance</h3>
                  <p className="text-purple-100">
                    Position #{userPosition} • {formatScore(userScore)} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{userPosition}</div>
                <div className="text-purple-100 text-sm">Rank</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h2 className="text-xl font-handwriting font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Top {Math.min(10, leaderboard.length)} Players
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={entry.userId}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  isConnected && address && entry.walletAddress.toLowerCase() === address.toLowerCase()
                    ? 'bg-purple-50 border-l-4 border-purple-500'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getPositionColor(entry.position)}`}>
                      {getPositionIcon(entry.position) || entry.position}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {entry.name || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                        </span>
                        {isConnected && address && entry.walletAddress.toLowerCase() === address.toLowerCase() && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {entry.totalQuestions || 'N/A'} questions
                        </span>
                        {entry.correctAnswers !== undefined && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {entry.correctAnswers} correct
                          </span>
                        )}
                        {entry.averageTimePerQuestion && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.averageTimePerQuestion)} avg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {formatScore(entry.score)}
                        </div>
                        {quizInfo?.maxPossibleScore && (
                          <div className="text-sm text-gray-500">
                            {formatPercentage(entry.score, quizInfo.maxPossibleScore)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {entry.timeBonus && entry.timeBonus > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        +{entry.timeBonus} time bonus
                      </div>
                    )}
                  </div>
                </div>
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
