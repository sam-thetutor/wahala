import React, { useState } from 'react';
import { Trophy, Target, Zap, Plus, Trash2, Coins, Users, Award, Info } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { ChainSelector } from './ChainSelector';
import { ProgressModal } from './ProgressModal';
import { useRewardCreation } from '@/hooks/useRewardCreation';

interface RewardConfig {
  enabled: boolean;
  type: 'LINEAR' | 'QUADRATIC';
  tokenAddress: string;
  chainId: number;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  network?: string;
  totalWinners?: number;
  rewardAmounts?: number[];
  totalRewardPool?: string;
  minParticipants?: number;
  pointsWeight?: number;
  rewardAllParticipants?: boolean;
}

interface RewardConfigurationSectionProps {
  rewardConfig: RewardConfig;
  onRewardConfigChange: (config: RewardConfig) => void;
  validationErrors?: { [key: string]: string };
  className?: string;
}

// Popular token presets with full token information
const TOKEN_PRESETS = {
  42220: { // Celo Mainnet
    'USDC': {
      address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    'cUSD': {
      address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      symbol: 'cUSD',
      name: 'Celo Dollar',
      decimals: 6
    },
    'CELO': {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      symbol: 'CELO',
      name: 'Celo Native Token',
      decimals: 18
    },
  },
  8453: { // Base
    'USDC': {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    'ETH': {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18
    },
  }
};

// Default reward amounts for different winner counts
const DEFAULT_REWARDS = {
  1: [100],
  2: [60, 40],
  3: [50, 30, 20],
  4: [40, 25, 20, 15],
  5: [35, 25, 20, 15, 5],
};

export const RewardConfigurationSection: React.FC<RewardConfigurationSectionProps> = ({
  rewardConfig,
  onRewardConfigChange,
  validationErrors = {},
  className = '',
}) => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { steps, currentStep, isCreating, error, createRewardSession, resetCreation } = useRewardCreation();

  const updateRewardConfig = (updates: Partial<RewardConfig>) => {
    console.log('=== UPDATE REWARD CONFIG DEBUG ===');
    console.log('Current config:', rewardConfig);
    console.log('Updates:', updates);
    console.log('New config will be:', { ...rewardConfig, ...updates });
    
    onRewardConfigChange({ ...rewardConfig, ...updates });
  };

  const handleRewardsToggle = (enabled: boolean) => {
    if (enabled) {
      // Set default quadratic distribution when enabling rewards
      updateRewardConfig({ 
        enabled,
        type: 'QUADRATIC',
        totalWinners: 5,
        totalRewardPool: rewardConfig.totalRewardPool || '10', // Use existing value or default to 10
        minParticipants: 3,
        pointsWeight: 0.7,
        rewardAllParticipants: false
      });
    } else {
      updateRewardConfig({ enabled });
    }
  };

  const handleChainChange = (chainId: number) => {
    const networkNames = {
      42220: 'Celo',
      8453: 'Base',
      1: 'Ethereum',
      137: 'Polygon'
    };
    updateRewardConfig({ 
      chainId,
      network: networkNames[chainId as keyof typeof networkNames] || `Chain ${chainId}`
    });
  };

  const handleTokenAddressChange = (tokenAddress: string, tokenInfo?: { symbol: string; name: string; decimals: number }) => {
    console.log('=== TOKEN ADDRESS CHANGE DEBUG ===');
    console.log('Token address:', tokenAddress);
    console.log('Token info:', tokenInfo);
    
    if (tokenInfo) {
      console.log('Updating with token info:', tokenInfo);
      updateRewardConfig({ 
        tokenAddress,
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        tokenDecimals: tokenInfo.decimals
      });
    } else {
      console.log('Updating without token info');
      updateRewardConfig({ tokenAddress });
    }
  };

  const handleRewardTypeChange = (type: 'LINEAR' | 'QUADRATIC') => {
    updateRewardConfig({ type });
  };

  const handlePresetToken = (tokenName: string) => {
    console.log('=== PRESET TOKEN DEBUG ===');
    console.log('Token name:', tokenName);
    console.log('Chain ID:', rewardConfig.chainId);
    console.log('Available presets:', TOKEN_PRESETS[rewardConfig.chainId as keyof typeof TOKEN_PRESETS]);
    
    const presets = TOKEN_PRESETS[rewardConfig.chainId as keyof typeof TOKEN_PRESETS];
    if (presets && presets[tokenName as keyof typeof presets]) {
      const tokenInfo = presets[tokenName as keyof typeof presets];
      console.log('Selected token info:', tokenInfo);
      updateRewardConfig({ 
        tokenAddress: tokenInfo.address,
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        tokenDecimals: tokenInfo.decimals,
        network: `Chain ${rewardConfig.chainId}`
      });
    } else {
      console.log('No presets found for chain ID:', rewardConfig.chainId);
    }
  };

  const handleWinnersChange = (totalWinners: number) => {
    updateRewardConfig({ 
      totalWinners,
      rewardAmounts: DEFAULT_REWARDS[totalWinners as keyof typeof DEFAULT_REWARDS] || []
    });
  };

  const addRewardAmount = () => {
    const currentAmounts = rewardConfig.rewardAmounts || [];
    updateRewardConfig({ 
      rewardAmounts: [...currentAmounts, 0],
      totalWinners: currentAmounts.length + 1
    });
  };

  const removeRewardAmount = (index: number) => {
    const currentAmounts = rewardConfig.rewardAmounts || [];
    const newAmounts = currentAmounts.filter((_, i) => i !== index);
    updateRewardConfig({ 
      rewardAmounts: newAmounts,
      totalWinners: newAmounts.length
    });
  };

  const updateRewardAmount = (index: number, amount: number) => {
    const currentAmounts = rewardConfig.rewardAmounts || [];
    const newAmounts = [...currentAmounts];
    newAmounts[index] = amount;
    updateRewardConfig({ rewardAmounts: newAmounts });
  };

  const handleRewardAllParticipants = (rewardAll: boolean) => {
    updateRewardConfig({ 
      rewardAllParticipants: rewardAll,
      // If rewarding all, set type to QUADRATIC and adjust settings
      type: rewardAll ? 'QUADRATIC' : rewardConfig.type,
      totalWinners: rewardAll ? undefined : rewardConfig.totalWinners
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Rewards Toggle */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <input
          type="checkbox"
          id="rewardsEnabled"
          checked={rewardConfig.enabled}
          onChange={(e) => handleRewardsToggle(e.target.checked)}
          className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
        />
        <label htmlFor="rewardsEnabled" className="font-handwriting text-lg font-bold text-gray-700 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Enable Rewards
        </label>
        <div className="ml-auto">
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
            Optional
          </span>
        </div>
      </div>

      {rewardConfig.enabled && (
        <div className="space-y-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          {/* Network Selection */}
          <ChainSelector
            value={rewardConfig.chainId}
            onChange={handleChainChange}
            disabled={isCreating}
          />

          {/* Token Selection with Presets */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
                💰 Reward Token Address
              </label>
              
              {/* Token Presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {TOKEN_PRESETS[rewardConfig.chainId as keyof typeof TOKEN_PRESETS] && 
                  Object.keys(TOKEN_PRESETS[rewardConfig.chainId as keyof typeof TOKEN_PRESETS]).map((tokenName) => (
                    <button
                      key={tokenName}
                      onClick={() => handlePresetToken(tokenName)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-handwriting text-sm flex items-center gap-1"
                    >
                      <Coins className="w-3 h-3" />
                      {tokenName}
                    </button>
                  ))
                }
              </div>
              
              <TokenSelector
                value={rewardConfig.tokenAddress}
                onChange={handleTokenAddressChange}
                chainId={rewardConfig.chainId}
                error={validationErrors.rewardsToken}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Reward All Participants Option */}
          <div className="space-y-3">
            <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
              🎁 Reward Distribution Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleRewardAllParticipants(false)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 font-handwriting ${
                  !rewardConfig.rewardAllParticipants
                    ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-handwriting font-bold text-gray-900">Top Winners</h4>
                    <p className="font-handwriting text-xs text-gray-500">Reward top performers only</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRewardAllParticipants(true)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 font-handwriting ${
                  rewardConfig.rewardAllParticipants
                    ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-handwriting font-bold text-gray-900">All Participants</h4>
                    <p className="font-handwriting text-xs text-gray-500">Everyone gets rewarded</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Top Winners Configuration */}
          {!rewardConfig.rewardAllParticipants && (
            <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-handwriting font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Top Winners Configuration
              </h4>
              
              <div className="space-y-4">
                {/* Winner Count Selection */}
                <div>
                  <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
                    🥇 Number of Winners (Top 5)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleWinnersChange(count)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 font-handwriting ${
                          rewardConfig.totalWinners === count
                            ? 'border-purple-500 bg-purple-500 text-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-xs opacity-80">Winner{count > 1 ? 's' : ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reward Amounts */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-handwriting text-sm font-medium text-gray-700">
                      💎 Reward Amounts (in tokens)
                    </label>
                    <button
                      onClick={addRewardAmount}
                      className="text-sm font-handwriting text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Amount
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(rewardConfig.rewardAmounts || []).map((amount, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-handwriting text-gray-500 w-8">
                            #{index + 1}
                          </span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => updateRewardAmount(index, parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting text-sm"
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {rewardConfig.rewardAmounts && rewardConfig.rewardAmounts.length > 1 && (
                          <button
                            onClick={() => removeRewardAmount(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {validationErrors.rewardsAmounts && (
                    <p className="mt-1 text-sm text-red-600 font-handwriting">
                      {validationErrors.rewardsAmounts}
                    </p>
                  )}
                </div>

                {/* Total Rewards Display */}
                {rewardConfig.rewardAmounts && rewardConfig.rewardAmounts.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-handwriting text-sm font-medium text-green-800">
                        Total Reward Pool:
                      </span>
                      <span className="font-handwriting font-bold text-green-800">
                        {rewardConfig.rewardAmounts.reduce((sum, amount) => sum + amount, 0)} tokens
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quadratic Reward Configuration (Default) */}
          <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-handwriting font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quadratic Distribution Settings
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                  💰 Total Reward Pool
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rewardConfig.totalRewardPool || ''}
                  onChange={(e) => {
                    console.log('Total reward pool changed to:', e.target.value);
                    updateRewardConfig({ totalRewardPool: e.target.value });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting ${
                    validationErrors.rewardsPool ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="1000"
                />
                {validationErrors.rewardsPool && (
                  <p className="mt-1 text-sm text-red-600 font-handwriting">
                    {validationErrors.rewardsPool}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                    👥 Min Participants
                  </label>
                  <input
                    type="number"
                    value={rewardConfig.minParticipants || ''}
                    onChange={(e) => updateRewardConfig({ minParticipants: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting ${
                      validationErrors.rewardsParticipants ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    min="1"
                  />
                  {validationErrors.rewardsParticipants && (
                    <p className="mt-1 text-sm text-red-600 font-handwriting">
                      {validationErrors.rewardsParticipants}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                    ⚖️ Points Weight (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rewardConfig.pointsWeight || 0.7}
                    onChange={(e) => updateRewardConfig({ pointsWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                    min="0"
                    max="1"
                  />
                </div>
              </div>

              {/* Distribution Preview */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="font-handwriting text-sm font-medium text-blue-800">
                    Distribution Preview
                  </span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  {rewardConfig.rewardAllParticipants ? (
                    <p>• All participants will receive rewards based on their performance</p>
                  ) : (
                    <p>• Top {rewardConfig.totalWinners || 5} winners will receive rewards</p>
                  )}
                  <p>• Rewards are distributed using quadratic funding formula</p>
                  <p>• Higher scores and faster answers get proportionally more rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgressModal}
        steps={steps}
        currentStep={currentStep}
        onClose={() => setShowProgressModal(false)}
        onRetry={() => {
          resetCreation();
          // Retry logic here
        }}
      />
    </div>
  );
}; 