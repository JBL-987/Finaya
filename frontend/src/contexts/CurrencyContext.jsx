import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrency as formatCurrencyUtil } from '../services/currencies';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('IDR');
  const [isLoading, setIsLoading] = useState(false);

  // Load currency preference from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    } else {
      // If no saved currency, default to IDR
      setSelectedCurrency('IDR');
      localStorage.setItem('selectedCurrency', 'IDR');
    }
  }, []);

  // Save currency preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  const formatCurrency = (amount, currency = null) => {
    return formatCurrencyUtil(amount, currency || selectedCurrency);
  };

  const changeCurrency = (newCurrency) => {
    setSelectedCurrency(newCurrency);
  };

  const value = {
    selectedCurrency,
    formatCurrency,
    changeCurrency,
    isLoading,
    setIsLoading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
