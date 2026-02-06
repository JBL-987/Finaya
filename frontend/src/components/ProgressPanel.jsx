import React, { useRef, useEffect } from 'react';
import { Loader, Activity } from 'lucide-react';
import { AnalysisGuide } from './ui/AnalysisGuide';

const ProgressPanel = ({ analysisProgress, isAnalyzing }) => {
  const progressRef = useRef(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (progressRef.current && analysisProgress.currentStep > 0) {
      setTimeout(() => {
        const activeStep = progressRef.current.querySelector(`[data-step-id="${analysisProgress.currentStep}"]`);
        if (activeStep) {
          activeStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [analysisProgress.currentStep]);

  if (!isAnalyzing) {
    return <AnalysisGuide heading="Analysis Steps" />;
  }

  return (
    <div className="p-4 sm:p-6 flex-1" ref={progressRef}>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-yellow-500" />
        Analysis Progress
      </h3>
      <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
        {analysisProgress.steps.map((step, index) => (
          <div
            key={step.id}
            data-step-id={step.id}
            className={`p-4 rounded-lg border transition-all duration-300 ${
              step.status === 'completed' ? 'bg-green-900/20 border-green-600' :
              step.status === 'active' ? 'bg-yellow-900/20 border-yellow-400 shadow-lg' :
              'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                step.status === 'completed' ? 'bg-green-600 text-white' :
                step.status === 'active' ? 'bg-yellow-400 text-white animate-pulse' :
                'bg-gray-600 text-white'
              }`}>
                {step.status === 'completed' ? '✓' : step.id}
              </div>
              <h4 className={`font-semibold ${
                step.status === 'completed' ? 'text-green-400' :
                step.status === 'active' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {step.name}
              </h4>
              {step.status === 'active' && (
                <Loader className="h-4 w-4 animate-spin ml-auto text-yellow-400" />
              )}
            </div>
            <p className="text-sm text-gray-300 ml-9">{step.detail}</p>

            {/* Show screenshot when available */}
            {step.image && (
              <div className="mt-3 ml-9">
                <img
                  src={`data:image/png;base64,${step.image}`}
                  alt="Screenshot"
                  className="w-full max-w-xs rounded border border-gray-600"
                />
              </div>
            )}

            {/* Show data when available */}
            {step.data && (
              <div className="mt-3 ml-9 p-2 bg-gray-900 rounded text-xs border border-gray-600">
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(step.data, null, 2).substring(0, 200)}...
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPanel;
