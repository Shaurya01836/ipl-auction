import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const QuotaContext = createContext();

export const QuotaProvider = ({ children }) => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState('');

  const triggerQuotaError = useCallback((message) => {
    setIsQuotaExceeded(true);
    if (message) setQuotaErrorMessage(message);
  }, []);

  const resetQuotaError = useCallback(() => {
    setIsQuotaExceeded(false);
    setQuotaErrorMessage('');
  }, []);

  const handleFirebaseError = useCallback((error) => {
    if (!error) return;
    const errString = String(error.code || error.message || error).toLowerCase();
    
    // Check for Firebase Quota / Resource limit keywords
    if (
      errString.includes('resource-exhausted') ||
      errString.includes('quota') ||
      errString.includes('limit exceeded') ||
      errString.includes('over-quota')
    ) {
      triggerQuotaError("Server daily free limit reached.");
    }
  }, [triggerQuotaError]);

  useEffect(() => {
    const checkErrorText = (text) => {
      const lower = String(text || '').toLowerCase();
      if (
        lower.includes('resource-exhausted') ||
        lower.includes('quota exceeded') ||
        lower.includes('quota-exceeded') ||
        lower.includes('over-quota')
      ) {
        triggerQuotaError("Server daily free limit reached.");
      }
    };

    // 1. Intercept Unhandled Promise Rejections (e.g. setDoc, getDoc rejections)
    const handleRejection = (event) => {
      const reason = event.reason;
      checkErrorText(reason?.code || reason?.message || reason);
    };

    // 2. Intercept Global Uncaught Errors
    const handleError = (event) => {
      checkErrorText(event.error?.code || event.error?.message || event.message);
    };

    // 3. Intercept console.error (Firebase SDK logs Firestore stream quota failures directly to console.error)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const fullText = args.map(a => {
        if (typeof a === 'object' && a !== null) {
          return (a.code || a.message || JSON.stringify(a));
        }
        return String(a);
      }).join(' ');
      checkErrorText(fullText);
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
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

