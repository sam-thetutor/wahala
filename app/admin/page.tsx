'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Trophy, 
  Users, 
  Clock, 
  Star, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  ExternalLink,
  Plus,
  Gamepad2,
  Sparkles,
  TrendingUp,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';

interface Snarkel {
  id: string;
  title: string;
  description: string;
  snarkelCode: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  totalQuestions: number;
  basePointsPerQuestion: number;
  speedBonusEnabled: boolean;
  maxSpeedBonus: number;
  spamControlEnabled: boolean;
  entryFee: string;
  entryFeeToken: string;
  allowlistCount: number;
  hasRewards: boolean;
  autoStartEnabled: boolean;
  scheduledStartTime: string | null;
  creator: {
    id: string;
    address: string;
    name: string;
  };
  stats?: {
    totalParticipants: number;
    totalSubmissions: number;
    averageScore: number;
    totalRewardsDistributed: number;
  };
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [snarkels, setSnarkels] = useState<Snarkel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnarkel, setSelectedSnarkel] = useState<Snarkel | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchMySnarkels();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchMySnarkels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/snarkel/my-snarkels?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        setSnarkels(data.snarkels);
      } else {
        setError('Failed to fetch your snarkels');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="mb-8">
              <Gamepad2 className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h1 className="text-3xl font-handwriting font-bold text-gray-800 mb-2">
                Snarkel Admin Dashboard
              </h1>
              <p className="text-gray-600">Connect your wallet to manage your snarkels</p>
            </div>
            <WalletConnectButton />
          </div>
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-handwriting font-bold text-gray-800">
                  My Snarkels
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage your quiz creations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <WalletConnectButton />
              <button
                onClick={() => window.location.href = '/create'}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-handwriting font-medium"
              >
                <Plus size={16} />
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your snarkels...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchMySnarkels}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : snarkels.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-handwriting font-bold text-gray-800 mb-2">
                No Snarkels Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first snarkel to get started!
              </p>
              <button
                onClick={() => window.location.href = '/create'}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-handwriting font-medium mx-auto"
              >
                <Plus size={18} />
                Create Your First Snarkel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Snarkels</p>
                    <p className="text-2xl font-handwriting font-bold text-gray-800">
                      {snarkels.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-handwriting font-bold text-gray-800">
                      {snarkels.filter(s => s.isActive).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-2xl font-handwriting font-bold text-gray-800">
                      {snarkels.reduce((sum, s) => sum + s.totalQuestions, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">With Rewards</p>
                    <p className="text-2xl font-handwriting font-bold text-gray-800">
                      {snarkels.filter(s => s.hasRewards).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Snarkels List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-handwriting font-bold text-gray-800">
                  Your Snarkels
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {snarkels.map((snarkel) => (
                  <div key={snarkel.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-handwriting font-bold text-gray-800">
                            {snarkel.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(snarkel.isActive)}`}>
                            {getStatusText(snarkel.isActive)}
                          </span>
                          {snarkel.hasRewards && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Rewards
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{snarkel.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(snarkel.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 size={14} />
                            {snarkel.totalQuestions} questions
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {snarkel.allowlistCount} allowed
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} />
                            {snarkel.basePointsPerQuestion} pts
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(snarkel.snarkelCode)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                          title="Copy code"
                        >
                          <Copy size={14} />
                          {snarkel.snarkelCode}
                        </button>
                        
                        <button
                          onClick={() => window.open(`/join?code=${snarkel.snarkelCode}`, '_blank')}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="View snarkel"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => window.open(`/create?edit=${snarkel.id}`, '_blank')}
                          className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                          title="Edit snarkel"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        <button
                          onClick={() => setSelectedSnarkel(snarkel)}
                          className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
                          title="View details"
                        >
                          <TrendingUp size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Snarkel Details Modal */}
      {selectedSnarkel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-handwriting font-bold text-gray-800">
                  {selectedSnarkel.title}
                </h3>
                <button
                  onClick={() => setSelectedSnarkel(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-handwriting font-bold text-gray-800 mb-2">Description</h4>
                <p className="text-gray-600">{selectedSnarkel.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-handwriting font-bold text-gray-800 mb-2">Basic Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-mono">{selectedSnarkel.snarkelCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span>{selectedSnarkel.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Points:</span>
                      <span>{selectedSnarkel.basePointsPerQuestion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed Bonus:</span>
                      <span>{selectedSnarkel.speedBonusEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {selectedSnarkel.speedBonusEnabled && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Bonus:</span>
                        <span>{selectedSnarkel.maxSpeedBonus}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-handwriting font-bold text-gray-800 mb-2">Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={getStatusColor(selectedSnarkel.isActive)}>
                        {getStatusText(selectedSnarkel.isActive)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visibility:</span>
                      <span>{selectedSnarkel.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spam Control:</span>
                      <span>{selectedSnarkel.spamControlEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {selectedSnarkel.spamControlEnabled && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entry Fee:</span>
                          <span>{selectedSnarkel.entryFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Token:</span>
                          <span className="font-mono text-xs">{selectedSnarkel.entryFeeToken}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowlist:</span>
                      <span>{selectedSnarkel.allowlistCount} addresses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto-Start:</span>
                      <span>{selectedSnarkel.autoStartEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {selectedSnarkel.autoStartEnabled && selectedSnarkel.scheduledStartTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Time:</span>
                        <span>{formatDate(selectedSnarkel.scheduledStartTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedSnarkel.stats && (
                <div>
                  <h4 className="font-handwriting font-bold text-gray-800 mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Participants:</span>
                      <span>{selectedSnarkel.stats.totalParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Submissions:</span>
                      <span>{selectedSnarkel.stats.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score:</span>
                      <span>{selectedSnarkel.stats.averageScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rewards Distributed:</span>
                      <span>{selectedSnarkel.stats.totalRewardsDistributed}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => window.open(`/join?code=${selectedSnarkel.snarkelCode}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Eye size={16} />
                  View Snarkel
                </button>
                <button
                  onClick={() => window.open(`/create?edit=${selectedSnarkel.id}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setSelectedSnarkel(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 