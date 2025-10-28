import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { advisorAPI } from '../../services/api';

const TaxStrategy = ({ transactions }) => {
  const [taxLiabilities, setTaxLiabilities] = useState([{
    type: 'No tax data',
    amount: 0,
    percentage: 0
  }]);
  const [deductions, setDeductions] = useState([{
    category: 'No deductions',
    amount: 0,
    limit: 0
  }]);
  const [taxSavings, setTaxSavings] = useState(0);
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transactions) {
      try {
        setIsLoading(true);
        setError(null);
        
        if (transactions.length > 0) {
          analyzeTaxStrategy(transactions);
        } else {
          setEmptyState();
        }
      } catch (err) {
        setError('Failed to analyze tax strategy: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [transactions]);

  const setEmptyState = () => {
    setTaxLiabilities([{
      type: 'No tax data',
      amount: 0,
      percentage: 0
    }]);
    setDeductions([{
      category: 'No deductions',
      amount: 0,
      limit: 0
    }]);
    setTaxSavings(0);
    setEstimatedTax(0);
  };

  const analyzeTaxStrategy = async (transactions) => {
    try {
      console.log('Calling advisorAPI for tax strategy...');

      // Calculate income and expenses for API call
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const userIncome = Math.max(totalIncome, 0);
      const userExpenses = {
        business: totalExpenses * 0.3, // Estimate business expenses
        personal: totalExpenses * 0.7, // Estimate personal expenses
        medical: totalExpenses * 0.08, // Estimate medical expenses
        charitable: totalExpenses * 0.05 // Estimate charitable donations
      };

      const response = await advisorAPI.getTaxStrategy(userIncome, Object.values(userExpenses));

      if (response.success && response.strategy) {
        console.log('Tax strategy received:', response.strategy);

        const strategy = response.strategy;

        // Set tax liabilities from API response
        if (strategy.deductions && Array.isArray(strategy.deductions)) {
          setDeductions(strategy.deductions.map(ded => ({
            category: ded.category || ded.name || 'Unknown',
            amount: ded.amount || 0,
            limit: ded.limit || ded.amount || 0
          })));
        }

        // Set credits from API response
        if (strategy.credits && Array.isArray(strategy.credits)) {
          // Use credits as part of deductions for display
          const creditsAsDeductions = strategy.credits.map(credit => ({
            category: `Credit: ${credit.name || 'Unknown'}`,
            amount: credit.amount || 0,
            limit: credit.amount || 0
          }));
          setDeductions(prev => [...prev, ...creditsAsDeductions]);
        }

        // Set recommendations for display
        if (strategy.recommendations && Array.isArray(strategy.recommendations)) {
          setTaxSavings(estimatedTax * 0.1); // Estimate 10% savings from strategy
        }

        // Keep local tax calculation for display
        const estimatedTaxLocal = Math.max(0, userIncome * 0.25);
        setEstimatedTax(estimatedTaxLocal);

        // Create mock tax liabilities for display
        setTaxLiabilities([
          {
            type: 'Federal Income Tax',
            amount: estimatedTaxLocal * 0.6,
            percentage: 60
          },
          {
            type: 'State Income Tax',
            amount: estimatedTaxLocal * 0.25,
            percentage: 25
          },
          {
            type: 'Local Tax',
            amount: estimatedTaxLocal * 0.1,
            percentage: 10
          },
          {
            type: 'Other Taxes',
            amount: estimatedTaxLocal * 0.05,
            percentage: 5
          }
        ]);

      } else {
        console.error('Invalid advisor API response:', response);
        // Fallback to local calculation
        fallbackTaxStrategy(transactions);
      }
    } catch (error) {
      console.error('Error calling advisor API:', error);
      setError('Failed to analyze tax strategy: ' + error.message);
      // Fallback to local calculation
      fallbackTaxStrategy(transactions);
    }
  };

  const fallbackTaxStrategy = (transactions) => {
    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const taxableIncome = Math.max(0, totalIncome - totalExpenses);
    const taxRate = 0.25;
    const calculatedTax = taxableIncome * taxRate;
    setEstimatedTax(calculatedTax);

    setTaxLiabilities([
      {
        type: 'Federal Income Tax',
        amount: calculatedTax * 0.6,
        percentage: 60
      },
      {
        type: 'State Income Tax',
        amount: calculatedTax * 0.25,
        percentage: 25
      },
      {
        type: 'Local Tax',
        amount: calculatedTax * 0.1,
        percentage: 10
      },
      {
        type: 'Other Taxes',
        amount: calculatedTax * 0.05,
        percentage: 5
      }
    ]);

    const possibleDeductions = [
      {
        category: 'Charitable Contributions',
        amount: totalExpenses * 0.05,
        limit: totalIncome * 0.6
      },
      {
        category: 'Business Expenses',
        amount: totalExpenses * 0.3,
        limit: totalIncome
      },
      {
        category: 'Medical Expenses',
        amount: totalExpenses * 0.08,
        limit: totalIncome * 0.075
      }
    ];

    setDeductions(possibleDeductions);
    setTaxSavings((possibleDeductions.reduce((sum, d) => sum + Math.min(d.amount, d.limit), 0)) * taxRate);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-2"></div>
        <p className="text-gray-400">Loading tax strategy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  return (
     <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Tax Strategy</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-blue-500" />
            <h3 className="text-gray-300 font-medium">Estimated Tax</h3>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(estimatedTax)}</p>
          <p className="text-sm text-gray-400 mt-2">Based on 25% rate</p>
        </div>
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-gray-300 font-medium">Tax Savings</h3>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(taxSavings)}</p>
          <p className="text-sm text-gray-400 mt-2">From deductions</p>
        </div>
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="text-gray-300 font-medium">Total Deductions</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(deductions.reduce((sum, d) => sum + Math.min(d.amount, d.limit), 0))}
          </p>
          <p className="text-sm text-gray-400 mt-2">Across categories</p>
        </div>
      </div>

      {taxLiabilities.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-white">Tax Liabilities by Type</h2>
          <div className="space-y-4">
            {taxLiabilities.map((liability, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-300 font-medium">{liability.type}</h3>
                  <span className="text-gray-400">{formatCurrency(liability.amount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${liability.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">{liability.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {deductions.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-white">Deductions Analysis</h2>
          <div className="space-y-4">
            {deductions.map((deduction, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-300 font-medium">{deduction.category}</h3>
                  <span className="text-gray-400">{formatCurrency(deduction.amount)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-1/2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min((deduction.amount / deduction.limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {deduction.limit > 0 ? Math.min((deduction.amount / deduction.limit) * 100, 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {deduction.amount > deduction.limit ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500 inline mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500 inline mr-1" />
                    )}
                    <span className="text-gray-400">Limit: {formatCurrency(deduction.limit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Tax Strategy Recommendations</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Consider increasing charitable contributions before year-end to maximize deductions (up to 60% of AGI).</li>
          <li>Review medical expenses to ensure all eligible costs are documented (above 7.5% of AGI).</li>
          <li>Explore additional education credits if eligible (up to $2,500 per student).</li>
          <li>Ensure all business expenses are properly categorized for maximum deductions.</li>
        </ul>
      </div>
    </div>
  );
};

export default TaxStrategy;
