import React, { createContext, useContext, useState, useCallback } from 'react';
import { isQuotaError } from '../lib/quota';

const QuotaContext = createContext();

export const QuotaProvider = ({ children }) => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState('');

  const triggerQuotaError = useCallback((message = "Server daily free limit reached.") => {
    setIsQuotaExceeded(true);
    if (message) setQuotaErrorMessage(message);
  }, []);

  const resetQuotaError = useCallback(() => {
    setIsQuotaExceeded(false);
    setQuotaErrorMessage('');
  }, []);

  const handleFirebaseError = useCallback((error) => {
    if (!error) return false;
    if (isQuotaError(error)) {
      triggerQuotaError("Server daily free limit reached.");
      return true;
    }
    return false;
  }, [triggerQuotaError]);

  return (
    <QuotaContext.Provider
      value={{
        isQuotaExceeded,
        quotaErrorMessage,
        triggerQuotaError,
        resetQuotaError,
        handleFirebaseError
      }}
    >
      {children}
    </QuotaContext.Provider>
  );
};

export const useQuota = () => {
  const context = useContext(QuotaContext);
  if (!context) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
};

export { isQuotaError };

