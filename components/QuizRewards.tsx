import React, { useState, useEffect } from 'react';
import { useQuizRewards } from '../hooks/useQuizRewards';
import { TokenConfig, NetworkConfig } from '../lib/tokens-config';
import { 
  Trophy, 
  Coins, 
  Network, 
  Settings, 
  Plus, 
  Minus, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2,
  Wallet,
  Zap,
  Gift,
  Users,
  DollarSign
} from 'lucide-react';

interface QuizRewardsProps {
  sessionId: number;
  isAdmin: boolean;
  onClose: () => void;
}

export default function QuizRewards({ sessionId, isAdmin, onClose }: QuizRewardsProps) {
  const {
    rewardState,
    resetRewardState,
    getAvailableNetworks,
    getAvailableTokens,
    setSelectedNetwork,
    setSelectedToken,
    setRewardAmount,
    setCustomTokenAddress,
    validateRewardConfig,
    useSessionRewards,
    useHasClaimedReward,
    useIsAdmin,
    addRewardToSession,
    distributeRewards,
    claimReward,
    formatRewardAmount,
    isConnected,
    userAddress
  } = useQuizRewards();

  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenConfig[]>([]);

  // Get session rewards
  const { data: sessionRewards, isLoading: rewardsLoading } = useSessionRewards(sessionId);
  
  // Check if current user is admin
  const { data: isUserAdmin } = useIsAdmin();

  // Update available tokens when network changes
  useEffect(() => {
    if (rewardState.selectedNetwork) {
      const tokens = getAvailableTokens(rewardState.selectedNetwork.name);
      setAvailableTokens(tokens);
    }
  }, [rewardState.selectedNetwork, getAvailableTokens]);

  const handleAddReward = async () => {
    await addRewardToSession(sessionId);
    if (!rewardState.error) {
      setShowAddRewardModal(false);
      resetRewardState();
    }
  };

  const handleDistributeRewards = async (tokenAddress: string) => {
    await distributeRewards(sessionId, tokenAddress as `0x${string}`);
  };

  const handleClaimReward = async (tokenAddress: string) => {
    await claimReward(sessionId, tokenAddress as `0x${string}`);
  };

  const networks = getAvailableNetworks();

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-handwriting font-bold text-gray-800">
            Quiz Rewards
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XCircle className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Error Display */}
      {rewardState.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{rewardState.error}</span>
          </div>
        </div>
      )}

      {/* Success Display */}
      {rewardState.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">Transaction successful!</span>
          </div>
        </div>
      )}

      {/* Current Rewards */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Current Rewards
        </h3>
        
        {rewardsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading rewards...</span>
          </div>
        ) : sessionRewards && sessionRewards.length > 0 ? (
          <div className="grid gap-4">
            {sessionRewards.map((reward, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-yellow-500" />
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
                        Distributed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        Pending
                      </span>
                    )}
                    
                    {isAdmin && !reward.isDistributed && (
                      <button
                        onClick={() => handleDistributeRewards(reward.tokenAddress)}
                        disabled={rewardState.isLoading}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                      >
                        Distribute
                      </button>
                    )}
                    
                    {!reward.isDistributed && (
                      <button
                        onClick={() => handleClaimReward(reward.tokenAddress)}
                        disabled={rewardState.isLoading}
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No rewards configured for this session</p>
          </div>
        )}
      </div>

      {/* Add Reward Section (Admin Only) */}
      {isAdmin && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Reward
            </h3>
            <button
              onClick={() => setShowAddRewardModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all"
            >
              Add Reward
            </button>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-handwriting font-bold text-gray-800 mb-4">
              Add Quiz Reward
            </h3>
            
            <div className="space-y-4">
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network
                </label>
                <select
                  value={rewardState.selectedNetwork?.name || ''}
                  onChange={(e) => {
                    const network = networks.find(n => n.name === e.target.value);
                    if (network) setSelectedNetwork(network);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Network</option>
                  {networks.map((network) => (
                    <option key={network.name} value={network.name}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Token Selection */}
              {rewardState.selectedNetwork && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token
                  </label>
                  <div className="space-y-2">
                    <select
                      value={rewardState.selectedToken?.address || ''}
                      onChange={(e) => {
                        const token = availableTokens.find(t => t.address === e.target.value);
                        if (token) setSelectedToken(token);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Token</option>
                      {availableTokens.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customToken"
                        checked={showCustomTokenInput}
                        onChange={(e) => setShowCustomTokenInput(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="customToken" className="text-sm text-gray-600">
                        Use custom token address
                      </label>
                    </div>
                    
                    {showCustomTokenInput && (
                      <input
                        type="text"
                        placeholder="0x..."
                        value={rewardState.customTokenAddress}
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Reward Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={rewardState.rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddReward}
                  disabled={rewardState.isLoading || !validateRewardConfig().isValid}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {rewardState.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Add Reward'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddRewardModal(false);
                    resetRewardState();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 