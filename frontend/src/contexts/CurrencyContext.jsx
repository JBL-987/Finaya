import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  formatCurrency as formatCurrencyUtil,
  convertCurrency,
  getExchangeRate,
  formatConversion
} from '../services/currencies';

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
    const targetCurrency = currency || selectedCurrency;
    // If the target currency is not USD, convert from USD to target currency
    const convertedAmount = targetCurrency === 'USD' ? amount : convertAmount(amount, 'USD', targetCurrency);
    return formatCurrencyUtil(convertedAmount, targetCurrency);
  };

  const changeCurrency = (newCurrency) => {
    setSelectedCurrency(newCurrency);
  };

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    return convertCurrency(amount, fromCurrency, toCurrency);
  };

  const getRate = (fromCurrency, toCurrency) => {
    return getExchangeRate(fromCurrency, toCurrency);
  };

  const convertAndFormat = (amount, fromCurrency, toCurrency) => {
    return formatConversion(amount, fromCurrency, toCurrency);
  };

  const value = {
    selectedCurrency,
    formatCurrency,
    changeCurrency,
    convertAmount,
    getRate,
    convertAndFormat,
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
