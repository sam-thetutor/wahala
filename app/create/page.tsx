'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Settings, Users, Trophy, Shield, Home, Gamepad2, Star, Sparkles, ArrowLeft, ArrowRight, Clock, Edit3, CheckCircle, XCircle, Loader, Info, Link as LinkIcon } from 'lucide-react';
import { useSnarkelCreation } from '@/hooks/useSnarkelCreation';
import { useQuizContract } from '@/hooks/useViemContract';
import WalletConnectButton from '@/components/WalletConnectButton';
import { RewardConfigurationSection } from '@/components/RewardConfigurationSection';
import AIGenerateSnarkelModal from '@/components/AIGenerateSnarkelModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import MiniAppHeader from '@/components/MiniAppHeader';
import MiniAppContextDisplay from '@/components/MiniAppContextDisplay';
import SocialShareButton from '@/components/SocialShareButton';
import { useAccount } from 'wagmi';

// Progress Modal Component
interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  steps: ProgressStep[];
  currentStep: number;
  onClose: () => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, steps, currentStep, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-handwriting text-lg font-bold">Creating Your Snarkel</h3>
              <p className="text-purple-100 text-sm">Please wait while we set everything up...</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50"></div>
                  )}
                  {step.status === 'loading' && (
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                  )}
                  {step.status === 'completed' && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {step.status === 'error' && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-handwriting text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'error' ? 'text-red-600' :
                    step.status === 'loading' ? 'text-purple-600' :
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  {step.error && (
                    <p className="text-xs text-red-500 mt-1">{step.error}</p>
                  )}
                  
                  {/* Featured Quiz Info for featured-setup step */}
                  {step.id === 'featured-setup' && step.status === 'loading' && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <Star className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs" style={{ color: '#655947' }}>
                          <p className="font-medium">Featured Quiz Benefits:</p>
                          <ul className="mt-1 space-y-0.5">
                            <li>• Appears on homepage for all users</li>
                            <li>• Anyone can start the quiz session</li>
                            <li>• Higher visibility and participation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 font-handwriting">
              Step {currentStep + 1} of {steps.length}
            </div>
            {steps.every(step => step.status === 'completed' || step.status === 'error') && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-handwriting font-medium"
              >
                {steps.some(step => step.status === 'error') ? 'Close' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  snarkelCode: string;
  rewardsEnabled: boolean;
  chainId?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, snarkelCode, rewardsEnabled, chainId }) => {
  const router = useRouter();
  
  if (!isOpen) return null;

  const CELO_CONTRACT = '0x8b8fb708758dc8185ef31e685305c1aa0827ea65';
  const BASE_CONTRACT = '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40';

  const networkName = (() => {
    if (!rewardsEnabled) return undefined;
    if (chainId === 42220) return 'Celo';
    if (chainId === 8453) return 'Base';
    return undefined;
  })();

  const explorerLink = (() => {
    if (!rewardsEnabled) return undefined;
    if (chainId === 42220) return `https://celoscan.io/address/${CELO_CONTRACT}`;
    if (chainId === 8453) return `https://basescan.org/address/${BASE_CONTRACT}`;
    return undefined;
  })();

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleClose = () => {
    onClose();
    // Redirect to admin page after modal is closed
    router.push('/admin');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-handwriting text-lg font-bold">Quiz Created</h3>
              <p className="text-emerald-100 text-sm">Your snarkel is ready to go!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-sm font-handwriting text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Snarkel Code</span>
                <span className="font-mono font-bold">{snarkelCode}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-handwriting text-gray-700">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Anyone can start a session for featured quizzes.</span>
            </div>
            {rewardsEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Rewards Network</span>
                    <span className="text-sm font-handwriting font-semibold text-gray-800">{networkName || 'Unknown'}</span>
                  </div>
                  {explorerLink && (
                    <a href={explorerLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-700 underline text-sm">
                      <LinkIcon className="w-4 h-4" /> View Contract
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
          <button onClick={handleClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-handwriting font-medium">
            Close
          </button>
          <SocialShareButton 
            snarkelCode={snarkelCode}
            title="I just created a quiz on Snarkels!"
            className="flex-1"
          />
          <button onClick={handleClose} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-handwriting font-bold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

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

interface SnarkelData {
  title: string;
  description: string;
  basePointsPerQuestion: number;
  maxSpeedBonus: number;
  speedBonusEnabled: boolean;
  maxQuestions: number;
  isPublic: boolean;
  allowlist: string[];
  spamControlEnabled: boolean;
  entryFee: number;
  entryFeeToken: string;
  autoStartEnabled: boolean;
  scheduledStartTime: string | null;
  isFeatured: boolean;
  featuredPriority: number;
  rewards: {
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
  };
  questions: Question[];
}

export default function SnarkelCreationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }>>([]);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  
  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ snarkelCode: string; rewardsEnabled: boolean; chainId?: number } | null>(null);
  
  // Use the custom hook for snarkel creation
  const { isSubmitting, error, validationErrors, setValidationErrors, createSnarkel, clearErrors } = useSnarkelCreation();
  const { address, isConnected } = useAccount();
  
  const [snarkel, setSnarkel] = useState<SnarkelData>({
    title: '',
    description: '',
    basePointsPerQuestion: 1000,
    maxSpeedBonus: 50,
    speedBonusEnabled: true,
    maxQuestions: 10,
    isPublic: true,
    allowlist: [],
    spamControlEnabled: false,
    entryFee: 0,
    entryFeeToken: '',
    autoStartEnabled: false,
    scheduledStartTime: null,
    isFeatured: false,
    featuredPriority: 0,
    rewards: {
      enabled: false,
      type: 'QUADRATIC',
      tokenAddress: '',
      chainId: 8453, // Base Mainnet (default)
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      tokenDecimals: 6,
      network: 'Base',
      totalWinners: 5,
      rewardAmounts: [35, 25, 20, 15, 5],
      totalRewardPool: '10', // Default to 10 tokens instead of 1000
      minParticipants: 3,
      pointsWeight: 0.7,
      rewardAllParticipants: false
    },
    questions: []
  });

  // Get contract functions for blockchain operations - only when rewards are enabled
  const { 
    createSnarkelSession, 
    approveToken, 
    transferToken, 
    getTokenBalance, 
    getTokenAllowance,
    contractState 
  } = useQuizContract(snarkel.rewards.enabled ? snarkel.rewards.chainId : undefined);

  const [newAllowlistAddress, setNewAllowlistAddress] = useState('');

  useEffect(() => {
    setIsLoaded(true);
    
    // Create floating elements
    const elements = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 15 + 10,
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 4000,
    }));
    setFloatingElements(elements);
  }, []);

  // Tab validation functions - return errors instead of setting state directly
  const validateDetailsTab = useCallback(() => {
    const errors: any = {};
    if (!snarkel.title.trim()) {
      errors.title = 'Snarkel title is required';
    }
    return errors;
  }, [snarkel.title]);

  const validateQuestionsTab = useCallback(() => {
    const errors: any = {};
    if (snarkel.questions.length === 0) {
      errors.questions = 'At least one question is required';
    } else {
      // Validate each question
      snarkel.questions.forEach((question, index) => {
        if (!question.text.trim()) {
          errors[`question_${index}_text`] = `Question ${index + 1} text is required`;
        }
        
        // Check if question has at least 2 options
        if (question.options.length < 2) {
          errors[`question_${index}_options`] = `Question ${index + 1} needs at least 2 options`;
        }
        
        // Check if at least one option is marked as correct
        const hasCorrectOption = question.options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          errors[`question_${index}_correct`] = `Question ${index + 1} needs at least one correct answer`;
        }
        
        // Check if all options have text
        question.options.forEach((option, optIndex) => {
          if (!option.text.trim()) {
            errors[`question_${index}_option_${optIndex}`] = `Question ${index + 1} option ${optIndex + 1} is required`;
          }
        });
      });
    }
    return errors;
  }, [snarkel.questions]);

  const validateRewardsTab = useCallback(() => {
    const errors: any = {};
    if (snarkel.rewards.enabled) {
      if (!snarkel.rewards.tokenAddress.trim()) {
        errors.rewardsToken = 'Reward token address is required when rewards are enabled';
      }
      
      if (!snarkel.rewards.rewardAllParticipants) {
        // Top winners mode
        if (!snarkel.rewards.totalWinners || snarkel.rewards.totalWinners < 1) {
          errors.rewardsWinners = 'Total winners must be at least 1';
        }
        if (!snarkel.rewards.rewardAmounts || snarkel.rewards.rewardAmounts.length === 0 || snarkel.rewards.rewardAmounts.every(amt => amt === 0)) {
          errors.rewardsAmounts = 'Reward amounts are required';
        }
      }
      
      // Both modes need quadratic settings
      if (!snarkel.rewards.totalRewardPool || snarkel.rewards.totalRewardPool === '0') {
        errors.rewardsPool = 'Total reward pool is required';
      }
      if (!snarkel.rewards.minParticipants || snarkel.rewards.minParticipants < 1) {
        errors.rewardsParticipants = 'Minimum participants must be at least 1';
      }
    }
    return errors;
  }, [snarkel.rewards]);

  const validateAntiSpamTab = useCallback(() => {
    const errors: any = {};
    if (snarkel.spamControlEnabled) {
      if (!snarkel.entryFee || snarkel.entryFee <= 0) {
        errors.entryFee = 'Entry fee must be greater than 0';
      }
      if (!snarkel.entryFeeToken.trim()) {
        errors.entryFeeToken = 'Entry fee token address is required';
      }
    }
    return errors;
  }, [snarkel.spamControlEnabled, snarkel.entryFee, snarkel.entryFeeToken]);

  const handleNextTab = useCallback(() => {
    let isValid = true;
    let newErrors = { ...validationErrors };
    
    // Clear current tab errors and validate
    if (activeTab === 'details') {
      delete newErrors.title;
      const errors = validateDetailsTab();
      newErrors = { ...newErrors, ...errors };
      isValid = Object.keys(errors).length === 0;
    } else if (activeTab === 'questions') {
      // Clear all question-related errors
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('question_') || key === 'questions') {
          delete newErrors[key];
        }
      });
      const errors = validateQuestionsTab();
      newErrors = { ...newErrors, ...errors };
      isValid = Object.keys(errors).length === 0;
    } else if (activeTab === 'rewards') {
      // Clear reward-related errors
      ['rewardsToken', 'rewardsWinners', 'rewardsAmounts', 'rewardsPool', 'rewardsParticipants'].forEach(key => {
        delete newErrors[key];
      });
      const errors = validateRewardsTab();
      newErrors = { ...newErrors, ...errors };
      isValid = Object.keys(errors).length === 0;
    } else if (activeTab === 'spam') {
      // Clear spam-related errors
      ['entryFee', 'entryFeeToken'].forEach(key => {
        delete newErrors[key];
      });
      const errors = validateAntiSpamTab();
      newErrors = { ...newErrors, ...errors };
      isValid = Object.keys(errors).length === 0;
    }
    
    setValidationErrors(newErrors);
    
    if (isValid) {
      const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (tabIndex < tabs.length - 1) {
        setActiveTab(tabs[tabIndex + 1].id);
      }
    }
  }, [activeTab, validationErrors, validateDetailsTab, validateQuestionsTab, validateRewardsTab, validateAntiSpamTab]);

  const isTabCompleted = useCallback((tabId: string) => {
    if (tabId === 'details') {
      return snarkel.title.trim() !== '';
    } else if (tabId === 'questions') {
      return snarkel.questions.length > 0 && 
             snarkel.questions.every(q => 
               q.text.trim() !== '' && 
               q.options.length >= 2 && 
               q.options.some(opt => opt.isCorrect) &&
               q.options.every(opt => opt.text.trim() !== '')
             );
    } else if (tabId === 'access') {
      return true; // Access tab is always valid (optional settings)
    } else if (tabId === 'rewards') {
      if (!snarkel.rewards.enabled) return true;
      
      const hasToken = snarkel.rewards.tokenAddress.trim() !== '';
      const hasRewardPool = snarkel.rewards.totalRewardPool !== '0';
      const hasMinParticipants = (snarkel.rewards.minParticipants ?? 0) > 0;
      
      if (snarkel.rewards.rewardAllParticipants) {
        // All participants mode - only need token, pool, and min participants
        return hasToken && hasRewardPool && hasMinParticipants;
      } else {
        // Top winners mode - need token, winners, amounts, pool, and min participants
        const hasWinners = (snarkel.rewards.totalWinners ?? 0) > 0;
        const hasAmounts = snarkel.rewards.rewardAmounts && snarkel.rewards.rewardAmounts.length > 0;
        return hasToken && hasWinners && hasAmounts && hasRewardPool && hasMinParticipants;
      }
    } else if (tabId === 'spam') {
      if (!snarkel.spamControlEnabled) return true;
      return snarkel.entryFee > 0 && snarkel.entryFeeToken.trim() !== '';
    }
    return false;
  }, [snarkel]);

  const tabs = [
    { id: 'details', label: 'Details', icon: Settings },
    { id: 'questions', label: 'Questions', icon: Edit3 },
    { id: 'access', label: 'Access', icon: Shield },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'spam', label: 'Anti-Spam', icon: Users }
  ];

  const addQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: '',
      timeLimit: 15,
      options: [
        { id: `opt${Date.now()}_1`, text: '', isCorrect: false },
        { id: `opt${Date.now()}_2`, text: '', isCorrect: false },
        { id: `opt${Date.now()}_3`, text: '', isCorrect: false },
        { id: `opt${Date.now()}_4`, text: '', isCorrect: false }
      ]
    };
    setSnarkel(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionIndex(snarkel.questions.length);
    setActiveTab('questions');
  }, [snarkel.questions.length]);

  const removeQuestion = useCallback((questionId: string) => {
    setSnarkel(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
  }, [activeQuestionIndex]);

  const updateQuestion = useCallback((questionId: string, field: keyof Question, value: any) => {
    setSnarkel(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const updateOption = useCallback((questionId: string, optionId: string, field: 'text' | 'isCorrect', value: any) => {
    setSnarkel(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? {
          ...q,
          options: q.options.map(opt => 
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        } : q
      )
    }));
  }, []);

  const addOption = useCallback((questionId: string) => {
    setSnarkel(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? {
          ...q,
          options: [...q.options, { 
            id: `opt${Date.now()}_${q.options.length + 1}`, 
            text: '', 
            isCorrect: false 
          }]
        } : q
      )
    }));
  }, []);

  const removeOption = useCallback((questionId: string, optionId: string) => {
    setSnarkel(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? {
          ...q,
          options: q.options.filter(opt => opt.id !== optionId)
        } : q
      )
    }));
  }, []);

  const addAllowlistAddress = useCallback(() => {
    if (newAllowlistAddress.trim() && !snarkel.allowlist.includes(newAllowlistAddress.trim())) {
      setSnarkel(prev => ({
        ...prev,
        allowlist: [...prev.allowlist, newAllowlistAddress.trim()]
      }));
      setNewAllowlistAddress('');
    }
  }, [newAllowlistAddress, snarkel.allowlist]);

  const removeAllowlistAddress = useCallback((address: string) => {
    setSnarkel(prev => ({
      ...prev,
      allowlist: prev.allowlist.filter(addr => addr !== address)
    }));
  }, []);

  // Check token balance for debugging
  const checkTokenBalance = useCallback(async (tokenAddress: string, chainId: number) => {
    try {
      console.log('=== CHECKING TOKEN BALANCE ===');
      console.log('Token address:', tokenAddress);
      console.log('Chain ID:', chainId);
      
      // Use the contract reader to check balance
      const { readTokenBalance } = await import('@/utils/contract-reader');
      const balance = await readTokenBalance(tokenAddress as `0x${string}`, address!, chainId);
      console.log('Token balance:', balance);
      return balance;
    } catch (error) {
      console.error('Error checking token balance:', error);
      return '0';
    }
  }, [address]);

  const handleSubmit = useCallback(async () => {
    // Check if wallet is connected first
    if (!isConnected || !address) {
      setValidationErrors(prev => ({
        ...prev,
        wallet: 'Please connect your wallet to create a snarkel'
      }));
      return;
    }

    // Clear wallet error if wallet is now connected
    if (validationErrors.wallet) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.wallet;
        return newErrors;
      });
    }

    // Debug: Log the current snarkel state at submission time
    console.log('=== SUBMIT DEBUG ===');
    console.log('Current snarkel state:', JSON.stringify(snarkel, null, 2));
    console.log('Rewards state at submit:', JSON.stringify(snarkel.rewards, null, 2));
    console.log('Token symbol at submit:', snarkel.rewards.tokenSymbol);
    console.log('Token name at submit:', snarkel.rewards.tokenName);
    console.log('Token decimals at submit:', snarkel.rewards.tokenDecimals);

    // Add wallet debugging
    console.log('=== WALLET DEBUG ===');
    console.log('Wallet connected:', isConnected);
    console.log('Wallet address:', address);
    console.log('Current chain ID:', snarkel.rewards.chainId);
    console.log('Rewards enabled:', snarkel.rewards.enabled);
    if (snarkel.rewards.enabled) {
      console.log('Token address:', snarkel.rewards.tokenAddress);
      console.log('Reward type:', snarkel.rewards.type);
      console.log('Reward configuration:', snarkel.rewards);
      
      // Check token balance for debugging
      await checkTokenBalance(snarkel.rewards.tokenAddress, snarkel.rewards.chainId);
    }

    // Validate all tabs before proceeding
    const detailsErrors = validateDetailsTab();
    const questionsErrors = validateQuestionsTab();
    const rewardsErrors = snarkel.rewards.enabled ? validateRewardsTab() : {};
    const spamErrors = snarkel.spamControlEnabled ? validateAntiSpamTab() : {};
    
    const allErrors = { ...detailsErrors, ...questionsErrors, ...rewardsErrors, ...spamErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    // Set entry fee to zero if not set
    const snarkelData = {
      ...snarkel,
      entryFee: snarkel.entryFee || 0,
      creatorAddress: address
    };

    // Initialize progress steps
    const steps: ProgressStep[] = [
      {
        id: 'prepare',
        title: 'Preparing Data',
        description: 'Validating form data and preparing for creation',
        status: 'pending'
      },
      {
        id: 'create-quiz',
        title: 'Creating Quiz',
        description: 'Creating quiz in database and setting up blockchain',
        status: 'pending'
      },
      ...(snarkel.isFeatured ? [{
        id: 'featured-setup',
        title: 'Featured Quiz Setup',
        description: 'Setting up featured content and homepage visibility',
        status: 'pending' as const
      }] : []),
      ...(snarkel.rewards.enabled ? [{
        id: 'create-session',
        title: 'Creating Quiz Session',
        description: 'Setting up quiz session with rewards pool',
        status: 'pending' as const
      }] : []),
      {
        id: 'blockchain',
        title: 'Blockchain Transaction',
        description: 'Creating smart contract session on blockchain',
        status: 'pending'
      },
      {
        id: 'token-ops',
        title: 'Token Operations',
        description: 'Approving and transferring ERC20 tokens',
        status: 'pending'
      }
    ];

    setProgressSteps(steps);
    setCurrentProgressStep(0);
    setShowProgressModal(true);

    try {
      // Step 1: Prepare data
      updateProgressStep(0, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate preparation
      updateProgressStep(0, 'completed');

      // Step 2: Create quiz (database + blockchain if rewards enabled)
      updateProgressStep(1, 'loading');
      console.log('=== CREATE PAGE DEBUG ===');
      console.log('Snarkel data being sent:', JSON.stringify(snarkelData, null, 2));
      console.log('Rewards configuration:', snarkelData.rewards);
      console.log('Chain ID:', snarkelData.rewards.chainId);
      console.log('Token address:', snarkelData.rewards.tokenAddress);
      console.log('Token symbol:', snarkelData.rewards.tokenSymbol);
      console.log('Token name:', snarkelData.rewards.tokenName);
      console.log('Token decimals:', snarkelData.rewards.tokenDecimals);
      console.log('Network:', snarkelData.rewards.network);
      console.log('Total reward pool (raw):', snarkelData.rewards.totalRewardPool);
      console.log('Total reward pool type:', typeof snarkelData.rewards.totalRewardPool);
      console.log('Total reward pool (parsed):', parseFloat(snarkelData.rewards.totalRewardPool || '0'));
      console.log('Current snarkel state rewards:', snarkel.rewards);
      console.log('Contract functions available:', {
        createSnarkelSession: !!createSnarkelSession,
        approveToken: !!approveToken,
        transferToken: !!transferToken,
        getTokenBalance: !!getTokenBalance,
        getTokenAllowance: !!getTokenAllowance
      });
      console.log('Starting createSnarkel...');
      
      // Additional debugging for token information
      console.log('=== TOKEN INFO DEBUG ===');
      console.log('Token symbol type:', typeof snarkelData.rewards.tokenSymbol);
      console.log('Token symbol value:', snarkelData.rewards.tokenSymbol);
      console.log('Token name type:', typeof snarkelData.rewards.tokenName);
      console.log('Token name value:', snarkelData.rewards.tokenName);
      console.log('Token decimals type:', typeof snarkelData.rewards.tokenDecimals);
      console.log('Token decimals value:', snarkelData.rewards.tokenDecimals);
      // Only pass contract functions if rewards are enabled
      const contractFunctions = snarkelData.rewards.enabled ? {
        createSnarkelSession,
        approveToken,
        transferToken,
        getTokenBalance,
        getTokenAllowance,
        contractState
      } : null;
      
      const result = await createSnarkel(snarkelData, contractFunctions);
      console.log('createSnarkel result:', result);
      
      if (result.success && result.snarkelCode) {
        updateProgressStep(1, 'completed');
        console.log('Quiz creation completed, snarkelCode:', result.snarkelCode);
        
        // Handle featured quiz setup if enabled
        if (snarkelData.isFeatured) {
          updateProgressStep(2, 'loading');
          console.log('Setting up featured quiz...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate featured setup
          updateProgressStep(2, 'completed');
          console.log('Featured quiz setup completed');
        }
        
        // Handle featured quiz setup if enabled
        if (snarkelData.isFeatured) {
          updateProgressStep(2, 'loading');
          console.log('Setting up featured quiz...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate featured setup
          updateProgressStep(2, 'completed');
          console.log('Featured quiz setup completed');
        }
        
        // If rewards are enabled and blockchain operations succeeded, create session
        if (snarkelData.rewards.enabled && !result.error) {
          const sessionStepIndex = snarkelData.isFeatured ? 3 : 2;
          const blockchainStepIndex = snarkelData.isFeatured ? 4 : 3;
          const tokenStepIndex = snarkelData.isFeatured ? 5 : 4;
          
          // Create session step
          updateProgressStep(sessionStepIndex, 'loading');
          console.log('Creating quiz session with rewards...');
          
          try {
            // Call the create-session API to create a session immediately
            const sessionResponse = await fetch('/api/snarkel/create-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                snarkelId: result.snarkelId,
                adminAddress: address,
                rewards: snarkelData.rewards
              }),
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              console.log('Quiz session created:', sessionData);
              updateProgressStep(sessionStepIndex, 'completed');
            } else {
              const errorData = await sessionResponse.json();
              console.error('Failed to create session:', errorData);
              updateProgressStep(sessionStepIndex, 'error', errorData.error || 'Failed to create session');
            }
          } catch (error: any) {
            console.error('Error creating session:', error);
            updateProgressStep(sessionStepIndex, 'error', error.message || 'Failed to create session');
          }
          
          // Blockchain and token operations
          updateProgressStep(blockchainStepIndex, 'loading');
          console.log('Blockchain transaction step completed');
          updateProgressStep(blockchainStepIndex, 'completed');
          
          updateProgressStep(tokenStepIndex, 'loading');
          console.log('Token operations step completed');
          updateProgressStep(tokenStepIndex, 'completed');
        } else if (snarkelData.rewards.enabled && result.error) {
          // Rewards were enabled but blockchain operations failed
          const sessionStepIndex = snarkelData.isFeatured ? 3 : 2;
          const blockchainStepIndex = snarkelData.isFeatured ? 4 : 3;
          const tokenStepIndex = snarkelData.isFeatured ? 5 : 4;
          
          // Extract specific error message for better user experience
          let blockchainError = 'Blockchain operations failed';
          if (result.error.includes('RPC rate limit exceeded')) {
            blockchainError = 'Network congestion - please try again later';
          } else if (result.error.includes('Insufficient token balance')) {
            blockchainError = 'Insufficient token balance - check your rewards configuration';
          } else if (result.error.includes('Token approval failed')) {
            blockchainError = 'Token approval failed - please try again';
          } else if (result.error.includes('Token transfer failed')) {
            blockchainError = 'Token transfer failed - please try again';
          } else if (result.error.includes('Failed to create session')) {
            blockchainError = 'Smart contract session creation failed';
          }
          
          // Mark blockchain step as failed with specific error
          updateProgressStep(blockchainStepIndex, 'error', blockchainError);
          updateProgressStep(tokenStepIndex, 'error', 'Token operations skipped due to blockchain failure');
          
          console.log('Quiz created but blockchain operations failed:', result.error);
        } else {
          // Skip blockchain and token steps if no rewards
          const blockchainStepIndex = snarkelData.isFeatured ? 3 : 2;
          const tokenStepIndex = snarkelData.isFeatured ? 4 : 3;
          updateProgressStep(blockchainStepIndex, 'completed');
          updateProgressStep(tokenStepIndex, 'completed');
        }
        
        // Show success details modal
        setTimeout(() => {
          setShowProgressModal(false);
          setSuccessData({ snarkelCode: result.snarkelCode!, rewardsEnabled: !!snarkelData.rewards.enabled, chainId: snarkelData.rewards.chainId });
          setShowSuccessModal(true);
        }, 600);
      } else {
        updateProgressStep(1, 'error', result.error || 'Failed to create quiz');
      }
    } catch (error: any) {
      updateProgressStep(currentProgressStep, 'error', error.message || 'An unexpected error occurred');
    }
  }, [isConnected, address, validationErrors, validateDetailsTab, validateQuestionsTab, validateRewardsTab, validateAntiSpamTab, snarkel, createSnarkel, currentProgressStep]);

  const updateProgressStep = useCallback((stepIndex: number, status: 'pending' | 'loading' | 'completed' | 'error', error?: string) => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, error } : step
    ));
    setCurrentProgressStep(stepIndex);
  }, []);

  // Handle AI generated quiz
  const handleAIGeneratedQuiz = useCallback((quizData: any) => {
    // Update the snarkel with AI generated data
    setSnarkel(prev => ({
      ...prev,
      title: quizData.title,
      description: quizData.description,
      maxQuestions: quizData.questions.length,
      questions: quizData.questions.map((q: any, index: number) => ({
        id: `ai-generated-${index}`,
        text: q.question,
        timeLimit: 15,
        options: Object.entries(q.options).map(([key, value]: [string, any], optIndex: number) => ({
          id: `ai-option-${index}-${optIndex}`,
          text: value,
          isCorrect: key === q.correctAnswer
        }))
      }))
    }));
    
    // Switch to questions tab to show the generated questions
    setActiveTab('questions');
  }, []);

  // Show wallet connection requirement if not connected
  if (!isConnected) {
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
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="font-handwriting text-2xl font-bold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="font-handwriting text-gray-600 mb-6">
              You need to connect your wallet to create a Snarkel quiz
            </p>
            <WalletConnectButton />
            <p className="font-handwriting text-xs text-gray-500 mt-4">
              This ensures you can create and manage your quizzes securely
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-white shadow-lg rounded-xl p-4 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-3 border-purple-400 overflow-hidden">
            {/* Pin effect */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 rounded-full shadow-md border border-white"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-600 rounded-full"></div>
            
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
                    Create New Snarkel
                  </h1>
                  <p className="font-handwriting text-sm text-gray-600 mt-0.5">Design your Web3 quiz experience!</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors font-handwriting text-sm"
                  style={{ color: '#1e40af' }}
                >
                  <Trophy className="w-4 h-4" />
                  My Quizzes
                </button>
                <WalletConnectButton />
                <button 
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-handwriting text-sm"
                  style={{ color: '#476520' }}
                >
                  <Home className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Mini App Context Display - Shows Mini App info when running as Mini App */}
        <MiniAppContextDisplay />
        
        {/* Mini App Header - Shows social context when running as Mini App */}
        <MiniAppHeader />
        
        {/* Main content card */}
        <div className={`transition-all duration-1000 delay-300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative border-l-3 border-blue-400">
            {/* Pin effects */}
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 rounded-full shadow-md border-2 border-white z-10"></div>
            <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full z-10"></div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full shadow-md border-2 border-white z-10"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-600 rounded-full z-10"></div>

            {/* Progress indicator */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-handwriting text-sm font-medium text-gray-600">
                  Step {tabs.findIndex(tab => tab.id === activeTab) + 1} of {tabs.length}
                </h3>
                <span className="font-handwriting text-xs text-gray-500">
                  {activeTab === 'details' && 'Basic Information'}
                  {activeTab === 'questions' && 'Quiz Questions'}
                  {activeTab === 'access' && 'Access Control'}
                  {activeTab === 'rewards' && 'Rewards Setup'}
                  {activeTab === 'spam' && 'Anti-Spam Settings'}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((tabs.findIndex(tab => tab.id === activeTab) + 1) / tabs.length) * 100}%` 
                  }}
                />
              </div>
              
              {/* Enhanced Tabs - more compact */}
              <div className="flex overflow-x-auto gap-2 pb-2">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isCompleted = isTabCompleted(tab.id);
                  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
                  const canAccess = index <= currentTabIndex || isCompleted;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => canAccess ? setActiveTab(tab.id) : null}
                      disabled={!canAccess}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-handwriting font-medium whitespace-nowrap rounded-lg transition-all transform hover:scale-105 ${
                        isActive
                          ? 'text-white bg-gradient-to-r from-purple-500 to-blue-500 shadow-md scale-105'
                          : isCompleted
                          ? 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 cursor-pointer'
                          : canAccess
                          ? 'text-gray-600 hover:text-purple-600 hover:bg-white hover:shadow-sm cursor-pointer'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                      {isCompleted && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {!isCompleted && !canAccess && (
                        <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🔒</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions Tab - Horizontal Navigation */}
            {activeTab === 'questions' && snarkel.questions.length > 0 && (
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-handwriting font-bold text-sm text-gray-700">Questions:</span>
                  
                  {/* Question navigation pills */}
                  <div className="flex overflow-x-auto gap-2 flex-1">
                    {snarkel.questions.map((question, index) => (
                      <button
                        key={question.id}
                        onClick={() => setActiveQuestionIndex(index)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-handwriting font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                          activeQuestionIndex === index
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md scale-105'
                            : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 shadow-sm'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="max-w-20 truncate">
                          {question.text || `Question ${index + 1}`}
                        </span>
                        {question.text && <Edit3 size={10} className="opacity-60" />}
                      </button>
                    ))}
                  </div>

                  {/* Navigation arrows */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                      disabled={activeQuestionIndex === 0}
                      className="p-1.5 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={() => setActiveQuestionIndex(Math.min(snarkel.questions.length - 1, activeQuestionIndex + 1))}
                      disabled={activeQuestionIndex === snarkel.questions.length - 1}
                      className="p-1.5 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content - more compact */}
            <div className="p-4">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                        🎯 Snarkel Title *
                      </label>
                      <input
                        type="text"
                        value={snarkel.title}
                        onChange={(e) => setSnarkel(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting ${
                          validationErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter snarkel title..."
                      />
                      {validationErrors.title && (
                        <p className="mt-1 text-sm text-red-600 font-handwriting flex items-center gap-1">
                          <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                          {validationErrors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                        ⏱️ Max Questions
                      </label>
                      <input
                        type="number"
                        value={snarkel.maxQuestions}
                        onChange={(e) => setSnarkel(prev => ({ ...prev, maxQuestions: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                      📝 Description
                    </label>
                    <textarea
                      value={snarkel.description}
                      onChange={(e) => setSnarkel(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                      placeholder="Describe your snarkel..."
                    />
                  </div>

                  {/* Featured Quiz Section */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-100 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-handwriting text-lg font-medium" style={{ color: '#476520' }}>
                        Featured Quiz Options
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Featured Toggle */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={snarkel.isFeatured}
                            onChange={(e) => setSnarkel(prev => ({ 
                              ...prev, 
                              isFeatured: e.target.checked,
                              featuredPriority: e.target.checked ? prev.featuredPriority : 0
                            }))}
                            className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="font-handwriting text-sm" style={{ color: '#655947' }}>
                            Make this quiz featured on homepage
                          </span>
                        </label>
                      </div>

                      {/* Priority Setting */}
                      {snarkel.isFeatured && (
                        <div>
                          <label className="block font-handwriting text-sm font-medium mb-1" style={{ color: '#476520' }}>
                            🏆 Featured Priority (1-10)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={snarkel.featuredPriority}
                              onChange={(e) => setSnarkel(prev => ({ 
                                ...prev, 
                                featuredPriority: Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                              }))}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-handwriting"
                              min="1"
                              max="10"
                            />
                            <span className="text-sm" style={{ color: '#655947' }}>
                              Higher number = higher priority
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Featured Quiz Info */}
                      {snarkel.isFeatured && (
                        <div className="bg-white bg-opacity-60 p-3 rounded-lg border border-yellow-300">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm" style={{ color: '#655947' }}>
                              <p className="font-medium mb-1">Featured Quiz Benefits:</p>
                              <ul className="space-y-1 text-xs">
                                <li>• Appears on homepage for all users</li>
                                <li>• Can be started by anyone (not just creator)</li>
                                <li>• Higher visibility and participation</li>
                                <li>• Priority determines display order</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                        💯 Base Points per Question
                      </label>
                      <input
                        type="number"
                        value={snarkel.basePointsPerQuestion}
                        onChange={(e) => setSnarkel(prev => ({ ...prev, basePointsPerQuestion: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                        min="100"
                      />
                    </div>

                    <div>
                      <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                        ⚡ Max Speed Bonus
                      </label>
                      <input
                        type="number"
                        value={snarkel.maxSpeedBonus}
                        onChange={(e) => setSnarkel(prev => ({ ...prev, maxSpeedBonus: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                       min="0"
                     />
                   </div>
                 </div>

                 <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                   <input
                     type="checkbox"
                     id="speedBonus"
                     checked={snarkel.speedBonusEnabled}
                     onChange={(e) => setSnarkel(prev => ({ ...prev, speedBonusEnabled: e.target.checked }))}
                     className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                   />
                   <label htmlFor="speedBonus" className="font-handwriting text-sm font-medium text-gray-700">
                     ⚡ Enable speed bonus for faster answers
                   </label>
                 </div>

                 {/* Auto-Start Settings */}
                 <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <h4 className="font-handwriting text-lg font-bold text-gray-800 flex items-center gap-2">
                     <Clock className="w-5 h-5" />
                     Auto-Start Settings
                   </h4>
                   
                   <div className="flex items-center gap-3">
                     <input
                       type="checkbox"
                       id="autoStart"
                       checked={snarkel.autoStartEnabled}
                       onChange={(e) => setSnarkel(prev => ({ 
                         ...prev, 
                         autoStartEnabled: e.target.checked,
                         scheduledStartTime: e.target.checked ? prev.scheduledStartTime : null
                       }))}
                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                     />
                     <label htmlFor="autoStart" className="font-handwriting text-sm font-medium text-gray-700">
                       🚀 Enable automatic quiz start
                     </label>
                   </div>

                   {snarkel.autoStartEnabled && (
                     <div className="mt-3">
                       <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
                         📅 Scheduled Start Time
                       </label>
                       <input
                         type="datetime-local"
                         value={snarkel.scheduledStartTime || ''}
                         onChange={(e) => setSnarkel(prev => ({ 
                           ...prev, 
                           scheduledStartTime: e.target.value 
                         }))}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-handwriting"
                         min={new Date().toISOString().slice(0, 16)}
                       />
                       <p className="mt-1 text-xs text-gray-500 font-handwriting">
                         If not set, admin must start quiz manually
                       </p>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {activeTab === 'questions' && (
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <h3 className="font-handwriting text-lg font-bold text-gray-900 flex items-center gap-2">
                     <Edit3 className="w-5 h-5" />
                     Questions ({snarkel.questions.length})
                   </h3>
                   <div className="flex gap-2">
                     <button
                       onClick={() => setShowAIModal(true)}
                       className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 font-handwriting font-bold shadow-md"
                     >
                       <Sparkles size={16} />
                       AI Generate
                     </button>
                     <button
                       onClick={addQuestion}
                       className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 font-handwriting font-bold shadow-md"
                     >
                       <Plus size={16} />
                       Add Question
                     </button>
                   </div>
                 </div>

                 {snarkel.questions.length === 0 ? (
                   <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                     <Edit3 size={48} className="mx-auto mb-4 text-gray-300" />
                     <p className="font-handwriting text-gray-500 text-lg mb-4">No questions added yet</p>
                     {validationErrors.questions && (
                       <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                         <p className="text-red-600 font-handwriting text-sm flex items-center gap-2">
                           <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                           {validationErrors.questions}
                         </p>
                       </div>
                     )}
                     <div className="flex gap-3 justify-center">
                       <button
                         onClick={() => setShowAIModal(true)}
                         className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 font-handwriting font-bold flex items-center gap-2"
                       >
                         <Sparkles size={16} />
                         AI Generate Quiz
                       </button>
                       <button
                         onClick={addQuestion}
                         className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 font-handwriting font-bold"
                       >
                         🚀 Create Your First Question
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                     {(() => {
                       const question = snarkel.questions[activeQuestionIndex];
                       if (!question) return null;
                       
                       return (
                         <div className="space-y-4">
                           <div className="flex justify-between items-start">
                             <h4 className="font-handwriting text-lg font-bold text-gray-900 flex items-center gap-2">
                               <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
                                 {activeQuestionIndex + 1}
                               </span>
                               Question {activeQuestionIndex + 1}
                             </h4>
                             <button
                               onClick={() => removeQuestion(question.id)}
                               className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>

                           <div className="space-y-3">
                             <div>
                               <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                                 ❓ Question Text *
                               </label>
                               <textarea
                                 value={question.text}
                                 onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                 rows={2}
                                 className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting ${
                                   validationErrors[`question_${activeQuestionIndex}_text`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                 }`}
                                 placeholder="Enter your question..."
                               />
                               {validationErrors[`question_${activeQuestionIndex}_text`] && (
                                 <p className="mt-1 text-sm text-red-600 font-handwriting flex items-center gap-1">
                                   <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                   {validationErrors[`question_${activeQuestionIndex}_text`]}
                                 </p>
                               )}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <div>
                                 <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                   <Clock size={14} />
                                   Time Limit (seconds)
                                 </label>
                                 <input
                                   type="number"
                                   value={question.timeLimit}
                                   onChange={(e) => updateQuestion(question.id, 'timeLimit', parseInt(e.target.value) || 15)}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                                   min="5"
                                   max="60"
                                   placeholder="15"
                                 />
                               </div>
                             </div>

                             <div>
                               <div className="flex justify-between items-center mb-2">
                                 <label className="block font-handwriting text-sm font-medium text-gray-700">
                                   📝 Answer Options
                                 </label>
                                 <button
                                   onClick={() => addOption(question.id)}
                                   className="text-sm font-handwriting text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                                 >
                                   + Add Option
                                 </button>
                               </div>

                               <div className="space-y-2">
                                 {question.options.map((option, oIndex) => (
                                   <div key={option.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                                     <div className="flex items-center gap-2">
                                       <input
                                         type="checkbox"
                                         checked={option.isCorrect}
                                         onChange={(e) => updateOption(question.id, option.id, 'isCorrect', e.target.checked)}
                                         className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                       />
                                       <span className="text-xs font-handwriting text-gray-500 w-8">
                                         {option.isCorrect ? '✅' : `${String.fromCharCode(65 + oIndex)}.`}
                                       </span>
                                     </div>
                                     <input
                                       type="text"
                                       value={option.text}
                                       onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                       className={`flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting text-sm ${
                                         validationErrors[`question_${activeQuestionIndex}_option_${oIndex}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                       }`}
                                       placeholder={`Option ${oIndex + 1}...`}
                                     />
                                     {question.options.length > 2 && (
                                       <button
                                         onClick={() => removeOption(question.id, option.id)}
                                         className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                     )}
                                   </div>
                                 ))}
                               </div>
                               
                               {/* Question-level validation errors */}
                               {(validationErrors[`question_${activeQuestionIndex}_options`] || validationErrors[`question_${activeQuestionIndex}_correct`]) && (
                                 <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                   {validationErrors[`question_${activeQuestionIndex}_options`] && (
                                     <p className="text-red-600 font-handwriting text-sm flex items-center gap-2 mb-1">
                                       <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                       {validationErrors[`question_${activeQuestionIndex}_options`]}
                                     </p>
                                   )}
                                   {validationErrors[`question_${activeQuestionIndex}_correct`] && (
                                     <p className="text-red-600 font-handwriting text-sm flex items-center gap-2">
                                       <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                       {validationErrors[`question_${activeQuestionIndex}_correct`]}
                                     </p>
                                   )}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       );
                     })()}
                   </div>
                 )}
               </div>
             )}

             {activeTab === 'access' && (
               <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                   <input
                     type="checkbox"
                     id="isPublic"
                     checked={snarkel.isPublic}
                     onChange={(e) => setSnarkel(prev => ({ ...prev, isPublic: e.target.checked }))}
                     className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                   />
                   <label htmlFor="isPublic" className="font-handwriting text-sm font-medium text-gray-700">
                     🌍 Public snarkel (anyone can join)
                   </label>
                 </div>

                 {!snarkel.isPublic && (
                   <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                     <div>
                       <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                         🔐 Allowlist Addresses
                       </label>
                       <div className="flex gap-2">
                         <input
                           type="text"
                           value={newAllowlistAddress}
                           onChange={(e) => setNewAllowlistAddress(e.target.value)}
                           className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-handwriting"
                           placeholder="Enter wallet address..."
                         />
                         <button
                           onClick={addAllowlistAddress}
                           className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-handwriting font-bold"
                         >
                           Add
                         </button>
                       </div>
                     </div>

                     {snarkel.allowlist.length > 0 && (
                       <div className="space-y-2">
                         <label className="block font-handwriting text-sm font-medium text-gray-700">
                           Allowed Addresses ({snarkel.allowlist.length})
                         </label>
                         <div className="space-y-2 max-h-40 overflow-y-auto">
                           {snarkel.allowlist.map((address, index) => (
                             <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                               <span className="font-handwriting text-sm font-mono text-gray-700 truncate">{address}</span>
                               <button
                                 onClick={() => removeAllowlistAddress(address)}
                                 className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                               >
                                 <Trash2 size={12} />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}

             {activeTab === 'rewards' && (
               <RewardConfigurationSection
                 rewardConfig={snarkel.rewards}
                 onRewardConfigChange={(rewards) => {
                   console.log('=== REWARD CONFIG CHANGE DEBUG ===');
                   console.log('Previous rewards:', snarkel.rewards);
                   console.log('New rewards:', rewards);
                   setSnarkel(prev => ({ ...prev, rewards }));
                 }}
                 validationErrors={validationErrors}
               />
             )}

             {activeTab === 'spam' && (
               <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                   <input
                     type="checkbox"
                     id="spamControl"
                     checked={snarkel.spamControlEnabled}
                     onChange={(e) => setSnarkel(prev => ({ ...prev, spamControlEnabled: e.target.checked }))}
                     className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                   />
                   <label htmlFor="spamControl" className="font-handwriting text-sm font-medium text-gray-700">
                     🛡️ Enable entry fee to prevent spam
                   </label>
                 </div>

                 {snarkel.spamControlEnabled && (
                   <div className="space-y-3 p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div>
                         <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                           💳 Entry Fee Amount
                         </label>
                         <input
                           type="number"
                           step="0.01"
                           value={snarkel.entryFee}
                           onChange={(e) => setSnarkel(prev => ({ ...prev, entryFee: parseFloat(e.target.value) || 0 }))}
                           className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-handwriting ${
                             validationErrors.entryFee ? 'border-red-500 bg-red-50' : 'border-gray-300'
                           }`}
                           min="0"
                         />
                         {validationErrors.entryFee && (
                           <p className="mt-1 text-sm text-red-600 font-handwriting flex items-center gap-1">
                             <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                             {validationErrors.entryFee}
                           </p>
                         )}
                       </div>

                       <div>
                         <label className="block font-handwriting text-sm font-medium text-gray-700 mb-1">
                           🪙 Entry Fee Token Address
                         </label>
                         <input
                           type="text"
                           value={snarkel.entryFeeToken}
                           onChange={(e) => setSnarkel(prev => ({ ...prev, entryFeeToken: e.target.value }))}
                           className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-handwriting ${
                             validationErrors.entryFeeToken ? 'border-red-500 bg-red-50' : 'border-gray-300'
                           }`}
                           placeholder="0x..."
                         />
                         {validationErrors.entryFeeToken && (
                           <p className="mt-1 text-sm text-red-600 font-handwriting flex items-center gap-1">
                             <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                             {validationErrors.entryFeeToken}
                           </p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>

           {/* Footer - compact */}
           <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-t border-gray-200">
             <div className="flex justify-between items-center">
               <div className="font-handwriting text-sm text-gray-600 flex items-center gap-4">
                 <span className="flex items-center gap-1">
                   <Edit3 size={14} />
                   {snarkel.questions.length} questions
                 </span>
                 <span className="flex items-center gap-1">
                   <Users size={14} />
                   {snarkel.allowlist.length} allowlist entries
                 </span>
                 <span className="flex items-center gap-1">
                   <Trophy size={14} />
                   {snarkel.rewards.enabled ? 'Rewards enabled' : 'No rewards'}
                 </span>
                 {/* Progress indicator */}
                 <span className="flex items-center gap-1 text-xs">
                   <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                     {tabs.filter(tab => isTabCompleted(tab.id)).length}
                   </div>
                   of {tabs.length} completed
                 </span>
               </div>
               
               <div className="flex items-center gap-3">
                 {/* Back button - show on all tabs except first */}
                 {activeTab !== 'details' && (
                   <button
                     onClick={() => {
                       const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
                       if (tabIndex > 0) {
                         setActiveTab(tabs[tabIndex - 1].id);
                       }
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-handwriting font-medium"
                   >
                     <ArrowLeft size={16} />
                     Back
                   </button>
                 )}
                 
                 {/* Wallet Error Display */}
                 {activeTab === 'spam' && validationErrors.wallet && (
                   <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                     <div className="flex items-center gap-2">
                       <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                         <span className="text-white text-xs font-bold">!</span>
                       </div>
                       <span className="font-handwriting text-red-700">{validationErrors.wallet}</span>
                     </div>
                   </div>
                 )}

                 {/* Next/Create button */}
                 {activeTab === 'spam' ? (
                   // Last tab - show Create button
                   <button
                     onClick={handleSubmit}
                     disabled={!isTabCompleted('details') || !isTabCompleted('questions') || isSubmitting}
                     className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-handwriting font-bold shadow-md"
                   >
                     {isSubmitting ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         {snarkel.rewards.enabled ? 'Creating with Rewards...' : 'Creating...'}
                       </>
                     ) : (
                       <>
                         <Save size={16} />
                         {snarkel.rewards.enabled ? 'Create with Rewards' : 'Create Snarkel'}
                       </>
                     )}
                   </button>
                 ) : (
                   // Other tabs - show Next button
                   <button
                     onClick={handleNextTab}
                     disabled={isSubmitting}
                     className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-handwriting font-bold shadow-md"
                   >
                     Next
                     <ArrowRight size={16} />
                   </button>
                 )}
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Progress Modal */}
     <ProgressModal
       isOpen={showProgressModal}
       steps={progressSteps}
       currentStep={currentProgressStep}
       onClose={() => setShowProgressModal(false)}
     />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        snarkelCode={successData?.snarkelCode || ''}
        rewardsEnabled={!!successData?.rewardsEnabled}
        chainId={successData?.chainId}
      />

     {/* Error Popup */}
     {error && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
           {/* Header */}
           <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-t-xl">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                 <Shield size={20} />
               </div>
               <div>
                 <h3 className="font-handwriting text-lg font-bold">Creation Failed</h3>
                 <p className="text-red-100 text-sm">Unable to create your snarkel</p>
               </div>
             </div>
           </div>

           {/* Content */}
           <div className="p-6">
             <div className="flex items-start gap-3">
               <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                 <span className="text-red-600 text-sm font-bold">!</span>
               </div>
               <div className="flex-1">
                 <p className="font-handwriting text-gray-700 mb-4 leading-relaxed">
                   {error}
                 </p>
                 
                 {/* Enhanced error details for blockchain operations */}
                 {error.includes('Insufficient token balance') && (
                   <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                     <div className="flex items-start gap-2">
                       <span className="text-yellow-600 text-sm">⚠️</span>
                       <div className="text-sm text-yellow-800">
                         <p className="font-medium mb-1">Token Balance Issue:</p>
                         <ul className="text-xs space-y-1">
                           <li>• Check your token balance on the correct network</li>
                           <li>• Ensure you have enough tokens for the reward pool</li>
                           <li>• Verify the token amount in the rewards configuration</li>
                           <li>• Make sure you're on the right network (Base: 8453)</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {error.includes('RPC rate limit exceeded') && (
                   <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-start gap-2">
                       <span className="text-blue-600 text-sm">🔄</span>
                       <div className="text-sm text-blue-800">
                         <p className="font-medium mb-1">Network Congestion:</p>
                         <ul className="text-xs space-y-1">
                           <li>• The Base network is experiencing high traffic</li>
                           <li>• Please wait a few minutes and try again</li>
                           <li>• Your quiz was created successfully</li>
                           <li>• You can set up rewards later when traffic is lower</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                   <p className="font-handwriting">💡 Tips:</p>
                   <ul className="mt-1 space-y-1">
                     <li>• Check your internet connection</li>
                     <li>• Ensure all required fields are filled</li>
                     <li>• Verify your wallet connection</li>
                     <li>• Try again in a few moments</li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>

           {/* Footer */}
           <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
             <button
               onClick={() => clearErrors()}
               className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-handwriting font-medium"
             >
               Dismiss
             </button>
             <button
               onClick={() => {
                 clearErrors();
                 handleSubmit();
               }}
               className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-handwriting font-bold"
             >
               Try Again
             </button>
           </div>
         </div>
       </div>
     )}

     {/* AI Generate Modal */}
     <AIGenerateSnarkelModal
       isOpen={showAIModal}
       onClose={() => setShowAIModal(false)}
       onGenerate={handleAIGeneratedQuiz}
     />

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
       
       .animate-float {
         animation: float 6s ease-in-out infinite;
       }
       
       .animate-bounce-slow {
         animation: bounce-slow 3s ease-in-out infinite;
       }
     `}     </style>
   </div>
     </ErrorBoundary>
 );
}

