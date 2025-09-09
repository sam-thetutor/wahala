'use client';

import { useNotifications } from '@/components/NotificationContainer';

export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifyMarketCreated = (question: string) => {
    addNotification({
      type: 'success',
      title: 'Market Created Successfully!',
      message: `"${question}" has been created and is now live for trading.`,
      duration: 5000
    });
  };

  const notifyMarketCreationFailed = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Market Creation Failed',
      message: error,
      duration: 7000
    });
  };

  const notifyMarketCreationStarted = () => {
    addNotification({
      type: 'info',
      title: 'Creating Market...',
      message: 'Please wait while your market is being created on the blockchain.',
      duration: 3000
    });
  };

  const notifyValidationError = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Validation Error',
      message: error,
      duration: 5000
    });
  };

  const notifyTransactionSuccess = (message: string) => {
    addNotification({
      type: 'success',
      title: 'Transaction Successful',
      message: message,
      duration: 4000
    });
  };

  const notifyTransactionFailed = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Transaction Failed',
      message: error,
      duration: 6000
    });
  };

  const notifyInsufficientBalance = (required: string, current: string) => {
    addNotification({
      type: 'error',
      title: 'Insufficient Balance',
      message: `You need at least ${required} CELO. Current balance: ${current} CELO`,
      duration: 7000
    });
  };

  const notifyWalletConnection = (message: string) => {
    addNotification({
      type: 'warning',
      title: 'Wallet Connection',
      message: message,
      duration: 5000
    });
  };

  return {
    notifyMarketCreated,
    notifyMarketCreationFailed,
    notifyMarketCreationStarted,
    notifyValidationError,
    notifyTransactionSuccess,
    notifyTransactionFailed,
    notifyInsufficientBalance,
    notifyWalletConnection
  };
}
