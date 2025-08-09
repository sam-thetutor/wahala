import { useState } from 'react';
import { useQuizContract } from './useViemContract';
import { parseEther, formatEther, type Address } from 'viem';

// Contract address
const SNARKEL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS || '0x...';

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
  creatorAddress?: string; // Wallet address of the creator
  autoStartEnabled?: boolean;
  scheduledStartTime?: string | null;
  isFeatured?: boolean;
  featuredPriority?: number;
  rewards: {
    enabled: boolean;
    type: 'LINEAR' | 'QUADRATIC';
    tokenAddress: string;
    chainId: number;
    totalWinners?: number;
    rewardAmounts?: number[];
    totalRewardPool?: string;
    minParticipants?: number;
    pointsWeight?: number;
  };
  questions: Array<{
    id: string;
    text: string;
    timeLimit: number;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface ValidationErrors {
  [key: string]: string;
}

interface UseSnarkelCreationReturn {
  isSubmitting: boolean;
  error: string | null;
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors | ((prev: ValidationErrors) => ValidationErrors)) => void;
  createSnarkel: (data: SnarkelData) => Promise<{ success: boolean; snarkelCode?: string; error?: string }>;
  clearErrors: () => void;
}

export const useSnarkelCreation = (): UseSnarkelCreationReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Get smart contract functions - Updated to use Wagmi
  const { 
    createSnarkelSession, 
    approveToken, 
    transferToken, 
    getTokenBalance, 
    getTokenAllowance,
    contractState 
  } = useQuizContract();

  const validateForm = (data: SnarkelData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Check wallet connection
    if (!data.creatorAddress) {
      errors.wallet = 'Wallet connection is required to create a snarkel';
    }

    // Check title
    if (!data.title.trim()) {
      errors.title = 'Snarkel title is required';
    }

    // Check questions
    if (data.questions.length === 0) {
      errors.questions = 'At least one question is required';
    } else {
      // Validate each question
      data.questions.forEach((question, index) => {
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

    // Check rewards if enabled
    if (data.rewards.enabled) {
      if (!data.rewards.tokenAddress.trim()) {
        errors.rewardsToken = 'Reward token address is required when rewards are enabled';
      }
      
      if (data.rewards.type === 'LINEAR') {
        if (!data.rewards.totalWinners || data.rewards.totalWinners < 1) {
          errors.rewardsWinners = 'Total winners must be at least 1';
        }
        if (!data.rewards.rewardAmounts || data.rewards.rewardAmounts.length === 0) {
          errors.rewardsAmounts = 'Reward amounts are required';
        }
      }
      
      if (data.rewards.type === 'QUADRATIC') {
        if (!data.rewards.totalRewardPool || data.rewards.totalRewardPool === '0') {
          errors.rewardsPool = 'Total reward pool is required';
        }
        if (!data.rewards.minParticipants || data.rewards.minParticipants < 1) {
          errors.rewardsParticipants = 'Minimum participants must be at least 1';
        }
      }
    }

    // Check spam control if enabled
    if (data.spamControlEnabled) {
      if (!data.entryFee || data.entryFee <= 0) {
        errors.entryFee = 'Entry fee must be greater than 0';
      }
      if (!data.entryFeeToken.trim()) {
        errors.entryFeeToken = 'Entry fee token address is required';
      }
    }

    return errors;
  };

  const createSnarkel = async (data: SnarkelData): Promise<{ success: boolean; snarkelCode?: string; error?: string }> => {
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Validate form first
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors before creating your snarkel.');
      setValidationErrors(errors);
      return { success: false, error: 'Validation failed' };
    }
    
    setIsSubmitting(true);
    
    // Add overall timeout for the entire operation
    const overallTimeout = setTimeout(() => {
      console.error('Overall timeout reached for createSnarkel');
      setIsSubmitting(false);
    }, 300000); // 5 minutes timeout
    
    try {
      let snarkelCode: string | undefined;
      let onchainSessionId: string | undefined;

      // Step 1: Create quiz in database first to get the quiz code
      console.log('Creating quiz in database...');
      const response = await fetch('/api/snarkel/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          creatorAddress: data.creatorAddress,
          startTime: data.scheduledStartTime || undefined,
          autoStartEnabled: data.autoStartEnabled || false,
          entryFee: data.entryFee || 0 // Ensure entry fee is set to zero if not provided
        }),
      });

      const responseData = await response.json();
      console.log('Database response:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create snarkel';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      snarkelCode = responseData.snarkelCode;
      console.log('Quiz created in database, snarkelCode:', snarkelCode);

      // Step 2: If rewards are enabled, create smart contract session with the actual quiz code
      if (data.rewards.enabled && snarkelCode) {
        console.log('Rewards enabled, starting blockchain operations...');
        try {
          // Validate token first
          console.log('Validating token...');
          const tokenResponse = await fetch('/api/token/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenAddress: data.rewards.tokenAddress,
              chainId: data.rewards.chainId,
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Token validation failed');
          }

          const tokenData = await tokenResponse.json();
          console.log('Token validation result:', tokenData);
          if (!tokenData.isValid) {
            throw new Error(tokenData.error || 'Invalid token address');
          }

          // Calculate entry fee from spam control settings
          let entryFeeWei = '0';
          
          if (data.spamControlEnabled && data.entryFee > 0) {
            // Convert entry fee to wei (assuming entry fee is in the token's smallest unit)
            entryFeeWei = (data.entryFee * 1e18).toString();
          }

          console.log('Creating session with params:', {
            snarkelCode,
            entryFeeWei,
            platformFeePercentage: 5,
            maxParticipants: 100
          });

          // Calculate required amount for rewards if enabled
          let requiredAmount = '0';
          if (data.rewards.enabled) {
            if (data.rewards.type === 'LINEAR') {
              const totalReward = data.rewards.rewardAmounts?.reduce((sum, amount) => sum + amount, 0) || 0;
              requiredAmount = parseEther(totalReward.toString()).toString();
            } else if (data.rewards.type === 'QUADRATIC') {
              requiredAmount = data.rewards.totalRewardPool 
                ? parseEther(data.rewards.totalRewardPool).toString()
                : '0';
            }
          }

          // Create smart contract session with the actual quiz code - Using Wagmi
          const sessionResult = await createSnarkelSession({
            snarkelCode, // Use the actual quiz code from database
            entryFeeWei, // entryFee in wei
            platformFeePercentage: 5, // 5%
            maxParticipants: 100,
            expectedRewardToken: data.rewards.enabled ? (data.rewards.tokenAddress as Address) : '0x0000000000000000000000000000000000000000' as Address, // NEW: Required reward token
            expectedRewardAmount: requiredAmount // NEW: Required reward amount
          });

          if (!sessionResult.success) {
            throw new Error(sessionResult.error || 'Failed to create session');
          }

          console.log('Session created successfully:', sessionResult.transactionHash);

          // Step 3: Handle ERC20 token operations if rewards are enabled
          if (data.rewards.enabled && sessionResult.transactionHash) {
            console.log('Handling ERC20 token operations...');
            
            // Check token balance on the correct chain
            console.log('Checking token balance...');
            const tokenBalance = await getTokenBalance(
              data.rewards.tokenAddress as any,
              data.creatorAddress as any
            );
            console.log('Token balance:', tokenBalance);

            console.log('Required amount:', requiredAmount);

            // Verify user has enough tokens
            if (parseFloat(tokenBalance) < parseFloat(formatEther(BigInt(requiredAmount)))) {
              throw new Error(`Insufficient token balance. Required: ${formatEther(BigInt(requiredAmount))}, Available: ${tokenBalance}`);
            }

            // Check current allowance
            console.log('Checking token allowance...');
            const currentAllowance = await getTokenAllowance(
              data.rewards.tokenAddress as any,
              data.creatorAddress as any,
              SNARKEL_CONTRACT_ADDRESS as any
            );
            console.log('Current allowance:', currentAllowance);

            // Approve tokens if needed - Using Wagmi
            if (parseFloat(currentAllowance) < parseFloat(formatEther(BigInt(requiredAmount)))) {
              console.log('Approving tokens...');
              const approveResult = await approveToken({
                tokenAddress: data.rewards.tokenAddress as any,
                spenderAddress: SNARKEL_CONTRACT_ADDRESS as any,
                amount: requiredAmount
              });

              if (!approveResult.success) {
                throw new Error(`Token approval failed: ${approveResult.error}`);
              }

              console.log('Token approval successful:', approveResult.transactionHash);

              // Wait a bit for the approval to be processed
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Transfer tokens to contract - Using Wagmi
            console.log('Transferring tokens to contract...');
            const transferResult = await transferToken({
              tokenAddress: data.rewards.tokenAddress as any,
              toAddress: SNARKEL_CONTRACT_ADDRESS as any,
              amount: requiredAmount
            });

            if (!transferResult.success) {
              throw new Error(`Token transfer failed: ${transferResult.error}`);
            }

            console.log('Token transfer successful:', transferResult.transactionHash);
          }

          // Get the actual session ID from the contract response
          // We need to read the session ID from the blockchain
          onchainSessionId = sessionResult.transactionHash; // Using transaction hash as session ID for now

          // Step 4: Update database with reward configuration and onchain session ID
          console.log('Updating database with reward config...');
          const updateResponse = await fetch('/api/snarkel/update-rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              snarkelId: responseData.snarkel.id,
              rewardConfig: data.rewards,
              onchainSessionId: onchainSessionId,
              transactionHash: sessionResult.transactionHash,
            }),
          });

          if (!updateResponse.ok) {
            const updateError = await updateResponse.json();
            throw new Error(`Failed to update reward configuration: ${updateError.error || 'Unknown error'}`);
          }

          console.log('Database updated with reward configuration successfully');

        } catch (blockchainError: any) {
          console.error('Blockchain operation failed:', blockchainError);
          
          // Try to update the database to mark the snarkel as having failed blockchain setup
          try {
            await fetch('/api/snarkel/mark-blockchain-failed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                snarkelId: responseData.snarkel.id,
                error: blockchainError.message
              }),
            });
          } catch (updateError) {
            console.error('Failed to update database with blockchain error:', updateError);
          }

          // Return partial success - quiz created but rewards failed
          return { 
            success: true, 
            snarkelCode,
            error: `Quiz created successfully, but reward setup failed: ${blockchainError.message}. You can try setting up rewards later.`
          };
        }
      }

      setError(null);
      console.log('Snarkel creation completed successfully');
      return { 
        success: true, 
        snarkelCode 
      };

    } catch (error: any) {
      console.error('Error creating snarkel:', error);
      const errorMessage = error.message || 'Network error: Failed to create snarkel. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      clearTimeout(overallTimeout);
      setIsSubmitting(false);
    }
  };

  const clearErrors = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    isSubmitting,
    error,
    validationErrors,
    setValidationErrors,
    createSnarkel,
    clearErrors,
  };
};