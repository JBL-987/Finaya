import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, PieChart, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { advisorAPI } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';

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
  const [taxParams, setTaxParams] = useState({
    income_amount: 0,
    expense_breakdown: {},
    filing_status: 'single'
  });
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [aiTaxStrategy, setAiTaxStrategy] = useState(null);

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

  const analyzeTaxStrategy = (transactions) => {
    try {
      console.log('Analyzing basic tax strategy from transactions...');

      // Calculate basic tax metrics from transactions
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Determine filing status based on income patterns (simplified)
      const defaultFilingStatus = totalIncome > 100000 ? 'married_filing_jointly' : 'single';

      // Categorize expenses for tax purposes
      const businessExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('business') || t.category?.toLowerCase().includes('office'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const medicalExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('medical') || t.category?.toLowerCase().includes('health'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const charitableExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('charitable') || t.category?.toLowerCase().includes('donation'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const expenseBreakdown = {
        business: businessExpenses || totalExpenses * 0.3,
        personal: totalExpenses * 0.5,
        medical: medicalExpenses || totalExpenses * 0.08,
        charitable: charitableExpenses || totalExpenses * 0.05
      };

      setTaxParams({
        income_amount: Math.max(totalIncome, 0),
        expense_breakdown: expenseBreakdown,
        filing_status: defaultFilingStatus
      });

      // Set up basic tax calculations
      fallbackTaxStrategy(transactions);
    } catch (error) {
      console.error('Error in basic tax analysis:', error);
      fallbackTaxStrategy(transactions);
    }
  };

  const generateAITaxStrategy = async () => {
    try {
      setGeneratingStrategy(true);

      const requestData = {
        income_amount: taxParams.income_amount,
        expense_breakdown: taxParams.expense_breakdown,
        filing_status: taxParams.filing_status
      };

      console.log('Generating AI tax strategy with params:', requestData);

      const response = await advisorAPI.getTaxStrategy(requestData);

      if (response.success && response.strategy) {
        console.log('AI Tax strategy received:', response.strategy);

        const strategy = response.strategy;

        // Parse and set AI-generated tax strategy
        setAiTaxStrategy(strategy);

        // Update deductions from AI strategy
        if (strategy.deductions && Array.isArray(strategy.deductions)) {
          setDeductions(strategy.deductions.map(ded => ({
            category: ded.category || ded.name || 'Unknown',
            amount: ded.amount || 0,
            limit: ded.limit || ded.amount || 0
          })));
        }

        // Add credits as deductions
        if (strategy.credits && Array.isArray(strategy.credits)) {
          const creditsAsDeductions = strategy.credits.map(credit => ({
            category: `Credit: ${credit.name || 'Unknown'}`,
            amount: credit.amount || 0,
            limit: credit.amount || 0
          }));
          setDeductions(prev => [...prev, ...creditsAsDeductions]);
        }

        // Calculate potential tax savings
        const potentialSavings = strategy.estimated_savings || strategy.total_savings || 0;
        setTaxSavings(potentialSavings);

      } else {
        console.error('Invalid AI tax strategy response:', response);
        setError('Failed to generate AI tax strategy');
      }
    } catch (error) {
      console.error('Error generating AI tax strategy:', error);
      setError('Failed to analyze tax strategy: ' + error.message);
    } finally {
      setGeneratingStrategy(false);
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-32 bg-gray-700" />
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-gray-900 border border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-700" />
              </div>
              <Skeleton className="h-8 w-20 mb-2 bg-gray-700" />
              <Skeleton className="h-3 w-28 bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Tax Liabilities Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-48 mb-6 bg-gray-700" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-20 bg-gray-700" />
                </div>
                <Skeleton className="h-2 w-full mb-1 bg-gray-700" />
                <Skeleton className="h-3 w-8 ml-auto bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Deductions Analysis Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-36 mb-6 bg-gray-700" />
          <div className="space-y-4">
            {['Charitable Contributions', 'Business Expenses', 'Medical Expenses'].map((deduction, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-40 bg-gray-700" />
                  <Skeleton className="h-4 w-16 bg-gray-700" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-1/2">
                    <Skeleton className="h-2 w-full mb-1 bg-gray-700" />
                  </div>
                  <Skeleton className="h-3 w-24 bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tax Strategy Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-48 mb-6 bg-gray-700" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2 bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2 bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
          </div>

          <div className="text-center">
            <Skeleton className="h-12 w-48 mx-auto bg-gray-700" />
          </div>
        </div>

        {/* Tips Section Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-40 mb-6 bg-gray-700" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex">
                <Skeleton className="h-3 w-1 mr-2 mt-0.5 bg-gray-700" />
                <Skeleton className="h-3 w-full bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
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

      {/* AI-Powered Tax Strategy */}
      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-white">AI-Powered Tax Optimization</h2>

        {!aiTaxStrategy ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filing Status</label>
                <select
                  value={taxParams.filing_status}
                  onChange={(e) => setTaxParams(prev => ({ ...prev, filing_status: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single">Single</option>
                  <option value="married_filing_jointly">Married Filing Jointly</option>
                  <option value="married_filing_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Annual Income</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={taxParams.income_amount}
                  onChange={(e) => setTaxParams(prev => ({ ...prev, income_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your annual income"
                />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={generateAITaxStrategy}
                disabled={generatingStrategy || taxParams.income_amount === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  generatingStrategy || taxParams.income_amount === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600 text-white'
                }`}
              >
                {generatingStrategy ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating tax optimization strategy...
                  </div>
                ) : (
                  'Generate AI Tax Strategy'
                )}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                AI will optimize your tax strategy based on deductions, credits, and filing status considerations
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Strategy Overview */}
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
              <h3 className="text-xl font-bold text-white mb-2">{aiTaxStrategy.title || 'Optimized Tax Strategy'}</h3>
              <p className="text-gray-300">{aiTaxStrategy.summary || aiTaxStrategy.overview}</p>
            </div>

            {/* Key Recommendations */}
            {aiTaxStrategy.recommendations && aiTaxStrategy.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Key Tax Recommendations</h3>
                <div className="space-y-3">
                  {aiTaxStrategy.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">{rec.title || rec.action}</h4>
                      <p className="text-gray-300 text-sm mb-2">{rec.description || rec.details}</p>
                      {rec.potential_savings && (
                        <p className="text-green-400 text-sm">Potential Savings: {formatCurrency(rec.potential_savings)}</p>
                      )}
                      {rec.timeframe && (
                        <p className="text-blue-400 text-xs mt-1">Timeframe: {rec.timeframe}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tax Efficiency Score */}
            {(aiTaxStrategy.tax_efficiency_score || aiTaxStrategy.effective_tax_rate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiTaxStrategy.effective_tax_rate && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Effective Tax Rate</h3>
                    <p className="text-2xl font-bold text-blue-400">{(aiTaxStrategy.effective_tax_rate * 100).toFixed(1)}%</p>
                    <p className="text-gray-400 text-sm">After deductions and credits</p>
                  </div>
                )}

                {aiTaxStrategy.tax_efficiency_score && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Tax Efficiency Score</h3>
                    <p className="text-2xl font-bold text-green-400">{aiTaxStrategy.tax_efficiency_score}/100</p>
                    <p className="text-gray-400 text-sm">Higher score means better optimization</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setAiTaxStrategy(null)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Generate New Strategy
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Additional Tax Strategy Tips</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Consider increasing charitable contributions before year-end to maximize deductions (up to 60% of AGI).</li>
          <li>Review medical expenses to ensure all eligible costs are documented (above 7.5% of AGI).</li>
          <li>Explore additional education credits if eligible (up to $2,500 per student).</li>
          <li>Ensure all business expenses are properly categorized for maximum deductions.</li>
          <li>Consider tax-advantaged retirement accounts like 401(k) or IRA contributions.</li>
        </ul>
      </div>
    </div>
  );
};

export default TaxStrategy;
