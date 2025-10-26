import React, { useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

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
    return (
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">📍 Analysis Guide</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-yellow-900/20 rounded-lg border border-yellow-600">
              <h4 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">1. Select Location</h4>
              <p className="text-xs sm:text-sm text-gray-300">Use the search bar or click directly on the map to select your business location</p>
            </div>
            <div className="p-3 sm:p-4 bg-yellow-900/20 rounded-lg border border-yellow-600">
              <h4 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">2. Enter Parameters</h4>
              <p className="text-xs sm:text-sm text-gray-300">Input building width (meters), operating hours, and product price</p>
            </div>
            <div className="p-3 sm:p-4 bg-yellow-900/20 rounded-lg border border-yellow-600">
              <h4 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">3. AI Analysis</h4>
              <p className="text-xs sm:text-sm text-gray-300">AI will analyze the location and calculate business profitability following Finaya chart methodology</p>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h4 className="font-semibold text-gray-400 mb-2 text-sm">💡 Tips for Better Results</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Choose locations with high foot traffic</li>
            <li>• Consider accessibility and parking</li>
            <li>• Analyze competition in the area</li>
            <li>• Factor in local demographics</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex-1" ref={progressRef}>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">🔄 Analysis Progress</h3>
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
