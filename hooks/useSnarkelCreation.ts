import { useState } from 'react';

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
  rewards: {
    enabled: boolean;
    type: 'LINEAR' | 'QUADRATIC';
    tokenAddress: string;
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

  const validateForm = (data: SnarkelData): boolean => {
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
      if (data.entryFee <= 0) {
        errors.entryFee = 'Entry fee must be greater than 0';
      }
      if (!data.entryFeeToken.trim()) {
        errors.entryFeeToken = 'Entry fee token address is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createSnarkel = async (data: SnarkelData): Promise<{ success: boolean; snarkelCode?: string; error?: string }> => {
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Validate form first
    if (!validateForm(data)) {
      setError('Please fix the validation errors before creating your snarkel.');
      return { success: false, error: 'Validation failed' };
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/snarkel/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          creatorAddress: data.creatorAddress,
          startTime: data.scheduledStartTime || undefined, // Map scheduledStartTime to startTime
          autoStartEnabled: data.autoStartEnabled || false
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setError(null);
        return { 
          success: true, 
          snarkelCode: responseData.snarkelCode 
        };
      } else {
        const errorMessage = responseData.error || 'Failed to create snarkel';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Error creating snarkel:', error);
      const errorMessage = 'Network error: Failed to create snarkel. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
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