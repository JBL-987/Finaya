import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, FileText, Brain, Save, Tag, CheckSquare, BarChart3, Lightbulb } from 'lucide-react';

const AIWorkflowProgress = ({ fileName, onComplete, onError }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([
    {
      id: 1,
      name: 'Reading Document',
      description: 'Extracting text and data from your file',
      icon: FileText,
      status: 'pending',
      duration: 0
    },
    {
      id: 2,
      name: 'AI Extraction',
      description: 'Using Qwen AI to extract transaction data',
      icon: Brain,
      status: 'pending',
      duration: 0
    },
    {
      id: 3,
      name: 'Saving Transactions',
      description: 'Storing extracted transactions in database',
      icon: Save,
      status: 'pending',
      duration: 0
    },
    {
      id: 4,
      name: 'Auto-Categorization',
      description: 'AI automatically categorizing each transaction',
      icon: Tag,
      status: 'pending',
      duration: 0
    },
    {
      id: 5,
      name: 'Validation',
      description: 'Checking data completeness and anomalies',
      icon: CheckSquare,
      status: 'pending',
      duration: 0
    },
    {
      id: 6,
      name: 'Pattern Analysis',
      description: 'Analyzing spending patterns and trends',
      icon: BarChart3,
      status: 'pending',
      duration: 0
    },
    {
      id: 7,
      name: 'AI Recommendations',
      description: 'Generating personalized financial insights',
      icon: Lightbulb,
      status: 'pending',
      duration: 0
    }
  ]);

  const [startTime, setStartTime] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
    startWorkflow();
  }, []);

  const startWorkflow = async () => {
    try {
      // Simulate API call to start workflow
      const response = await fetch('/api/v1/accounting/ai/process-complete-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filePath: fileName // This should be the actual file path
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start workflow');
      }

      const result = await response.json();

      if (result.success) {
        // Simulate step-by-step progress (in real implementation, use WebSocket or polling)
        await simulateProgress(result.data);
        setResults(result.data);
        setIsComplete(true);
        onComplete && onComplete(result.data);
      } else {
        throw new Error(result.errors?.[0] || 'Workflow failed');
      }

    } catch (error) {
      console.error('Workflow error:', error);
      updateStepStatus(1, 'error');
      onError && onError(error.message);
    }
  };

  const simulateProgress = async (workflowData) => {
    const stepDurations = [800, 2000, 500, 1500, 800, 1200, 1000]; // Simulated durations

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      updateStepStatus(step.id, 'active');

      // Wait for simulated duration
      await new Promise(resolve => setTimeout(resolve, stepDurations[i]));

      updateStepStatus(step.id, 'completed');
    }
  };

  const updateStepStatus = (stepId, status) => {
    setSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id === stepId) {
          const now = Date.now();
          const duration = startTime ? (now - startTime) / 1000 : 0;

          return {
            ...step,
            status,
            duration: status === 'completed' ? duration : step.duration
          };
        }
        return step;
      })
    );

    if (status === 'active') {
      setCurrentStep(stepId);
    }
  };

  const getStatusIcon = (step) => {
    const IconComponent = step.icon;

    if (step.status === 'completed') {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (step.status === 'active') {
      return <Loader className="h-6 w-6 text-blue-500 animate-spin" />;
    } else if (step.status === 'error') {
      return <XCircle className="h-6 w-6 text-red-500" />;
    } else {
      return <IconComponent className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (step) => {
    if (step.status === 'completed') return 'border-green-500 bg-green-50';
    if (step.status === 'active') return 'border-blue-500 bg-blue-50';
    if (step.status === 'error') return 'border-red-500 bg-red-50';
    return 'border-gray-300 bg-gray-50';
  };

  const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              🤖 AI Processing Your Document
            </h2>
            <div className="text-sm text-gray-500">
              {fileName}
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Our AI is automatically extracting, categorizing, and analyzing your financial data
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor(step)}`}
              >
                <div className="flex-shrink-0 mr-4">
                  {getStatusIcon(step)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {step.name}
                    </h3>
                    {step.duration > 0 && (
                      <span className="text-sm text-gray-500">
                        {step.duration.toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                </div>

                {/* Progress line to next step */}
                {index < steps.length - 1 && (
                  <div className="flex-shrink-0 ml-4">
                    <div className={`w-0.5 h-8 ${
                      step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">
                {steps.filter(s => s.status === 'completed').length} / {steps.length} steps
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
                }}
              />
            </div>
            {totalDuration > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                Total time: {totalDuration.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Results Summary */}
          {isComplete && results && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">Processing Complete!</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <div>✅ {results.extracted_count} transactions extracted</div>
                <div>✅ {results.transactions?.length || 0} transactions saved</div>
                <div>✅ {results.recommendations?.length || 0} AI recommendations generated</div>
                <div>⚡ Processed in {results.processing_time?.toFixed(1) || '0.0'} seconds</div>
              </div>
            </div>
          )}

          {/* Error State */}
          {steps.some(s => s.status === 'error') && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-800">Processing Failed</span>
              </div>
              <div className="mt-2 text-sm text-red-700">
                Something went wrong during AI processing. Please try again.
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkflowProgress;
