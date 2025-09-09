'use client';

import { useState, useCallback } from 'react';

export const useCelebration = () => {
  const [celebrations, setCelebrations] = useState<{
    marketCreated: boolean;
    sharesBought: boolean;
    marketResolved: boolean;
  }>({
    marketCreated: false,
    sharesBought: false,
    marketResolved: false,
  });

  const triggerCelebration = useCallback((type: keyof typeof celebrations) => {
    setCelebrations(prev => ({
      ...prev,
      [type]: true
    }));
  }, []);

  const completeCelebration = useCallback((type: keyof typeof celebrations) => {
    setCelebrations(prev => ({
      ...prev,
      [type]: false
    }));
  }, []);

  return {
    celebrations,
    triggerCelebration,
    completeCelebration,
  };
};
