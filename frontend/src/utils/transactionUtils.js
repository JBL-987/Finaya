export const validateTransactions = (transactions) => {
  if (!transactions || !Array.isArray(transactions)) {
    console.error('Invalid transactions data:', transactions);
    return [];
  }

  return transactions.map(transaction => {
    const amount = parseFloat(transaction.amount || 0);
    const validAmount = isNaN(amount) ? 0 : amount;
    return {
      id: transaction.id || `tx-${Math.random().toString(36).substr(2, 9)}`,
      transactionType: transaction.transactionType || 'expense',
      amount: validAmount,
      date: transaction.date || new Date().toISOString().split('T')[0],
      description: transaction.description || 'No description',
      category: transaction.category || 'Uncategorized',
      paymentMethod: transaction.paymentMethod || 'Unknown',
      reference: transaction.reference || '',
      taxDeductible: transaction.taxDeductible || false,
      sourceFile: transaction.sourceFile || null,
      timestamp: transaction.timestamp || new Date().toISOString()
    };
  });
};

export const formatCurrency = (amount) => {
  const validAmount = isNaN(parseFloat(amount)) ? 0 : parseFloat(amount);
  if (validAmount >= 1000000000) {
    return `$${(validAmount / 1000000000).toFixed(1)}B`;
  } else if (validAmount >= 1000000) {
    return `$${(validAmount / 1000000).toFixed(1)}M`;
  } else if (validAmount >= 1000) {
    return `$${(validAmount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(validAmount);
};

























