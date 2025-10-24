import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Camera, 
  Brain, 
  Calculator, 
  TrendingUp,
  Building,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Loader,
  AlertCircle
} from 'lucide-react';

const BusinessAnalysisWorkflow = ({ 
  mapInstance, 
  selectedLocation, 
  onLocationSelect,
  onAnalysisComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [businessParams, setBusinessParams] = useState({
    buildingWidth: 3.8,
    dailyOperatingHours: 12,
    productPrice: 50000
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { id: 1, title: 'Select Location', icon: MapPin, description: 'Click on map to pinpoint exact location' },
    { id: 2, title: 'Auto Zoom', icon: Camera, description: 'Platform zooms to location automatically' },
    { id: 3, title: 'Screenshot', icon: Camera, description: 'Capturing map screenshot...' },
    { id: 4, title: 'AI Analysis', icon: Brain, description: 'Gemini AI analyzing area distribution...' },
    { id: 5, title: 'Calculate Metrics', icon: Calculator, description: 'Computing business profitability...' },
    { id: 6, title: 'Results', icon: TrendingUp, description: 'Analysis complete!' }
  ];

  // Auto-advance workflow when location is selected
  useEffect(() => {
    if (selectedLocation && currentStep === 1) {
      startAnalysisWorkflow();
    }
  }, [selectedLocation]);

  const startAnalysisWorkflow = async () => {
    if (!selectedLocation || !mapInstance) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Step 2: Auto zoom to location (screen width x height, not circle)
      setCurrentStep(2);
      await autoZoomToLocation();
      
      // Step 3: Capture screenshot
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for zoom
      const screenshot = await captureMapScreenshot();
      
      // Step 4: AI Analysis
      setCurrentStep(4);
      const areaDistribution = await analyzeWithGemini(screenshot);
      
      // Step 5: Calculate business metrics
      setCurrentStep(5);
      const results = await calculateBusinessMetrics(areaDistribution);
      
      // Step 6: Complete
      setCurrentStep(6);
      setAnalysisResults(results);
      onAnalysisComplete(results);
      
    } catch (error) {
      console.error('Analysis workflow failed:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const autoZoomToLocation = async () => {
    // Zoom to fit screen dimensions (not circle radius)
    const container = mapInstance.getContainer();
    const bounds = mapInstance.getBounds();
    
    // Calculate zoom level to fit screen dimensions
    mapInstance.setView([selectedLocation.lat, selectedLocation.lng], 18);
    
    return new Promise(resolve => setTimeout(resolve, 1500));
  };

  const captureMapScreenshot = async () => {
    // Import dynamically to avoid build issues
    const { captureMapScreenshot } = await import('../services/mapScreenshot');
    
    return await captureMapScreenshot(
      mapInstance,
      selectedLocation.lat,
      selectedLocation.lng,
      18
    );
  };

  const analyzeWithGemini = async (screenshot) => {
    const { analyzeLocationImage } = await import('../services/gemini');
    
    const result = await analyzeLocationImage(
      screenshot.imageBase64,
      screenshot.metadata
    );
    
    return result.analysis;
  };

  const calculateBusinessMetrics = async (areaDistribution) => {
    const { calculateBusinessMetrics } = await import('../services/gemini');
    
    return calculateBusinessMetrics(
      areaDistribution,
      businessParams,
      {
        areaSquareKm: 0.056, // Example area
        populationDensityPerSqKm: 16000 // Jakarta default
      }
    );
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setAnalysisResults(null);
    setError(null);
    setIsProcessing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          Business Profitability Analysis
        </h3>
        {currentStep > 1 && (
          <button
            onClick={resetWorkflow}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isProcessingStep = isProcessing && isActive;

          return (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg border transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-900/20'
                  : isCompleted
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-dark-border bg-dark-bg/50'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                isCompleted
                  ? 'bg-green-600'
                  : isActive
                  ? 'bg-blue-600'
                  : 'bg-gray-600'
              }`}>
                {isProcessingStep ? (
                  <Loader className="w-5 h-5 animate-spin text-white" />
                ) : isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-white'
                }`}>
                  Step {step.id}: {step.title}
                </h4>
                <p className="text-sm text-dark-text-secondary">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business Parameters Input */}
      {currentStep === 1 && (
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-white">Business Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-dark-text-secondary mb-2">
                Building Width (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={businessParams.buildingWidth}
                onChange={(e) => setBusinessParams(prev => ({
                  ...prev,
                  buildingWidth: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-text-secondary mb-2">
                Operating Hours/Day
              </label>
              <input
                type="number"
                step="0.5"
                value={businessParams.dailyOperatingHours}
                onChange={(e) => setBusinessParams(prev => ({
                  ...prev,
                  dailyOperatingHours: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-text-secondary mb-2">
                Product Price (IDR)
              </label>
              <input
                type="number"
                value={businessParams.productPrice}
                onChange={(e) => setBusinessParams(prev => ({
                  ...prev,
                  productPrice: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
          <div>
            <h4 className="font-medium text-red-400">Analysis Failed</h4>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {analysisResults && currentStep === 6 && (
        <div className="space-y-4">
          <h4 className="font-medium text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Analysis Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-900/20 rounded-lg p-4 border border-green-800/30">
              <div className="text-sm text-green-300">Daily Customers</div>
              <div className="text-xl font-bold text-green-400">
                {analysisResults.metrics?.tppd || 0}
              </div>
            </div>
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
              <div className="text-sm text-blue-300">Daily Revenue</div>
              <div className="text-lg font-bold text-blue-400">
                {formatCurrency(analysisResults.metrics?.dailyRevenue || 0)}
              </div>
            </div>
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
              <div className="text-sm text-purple-300">Monthly Revenue</div>
              <div className="text-lg font-bold text-purple-400">
                {formatCurrency(analysisResults.metrics?.monthlyRevenue || 0)}
              </div>
            </div>
            <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-800/30">
              <div className="text-sm text-orange-300">Yearly Revenue</div>
              <div className="text-lg font-bold text-orange-400">
                {formatCurrency(analysisResults.metrics?.yearlyRevenue || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {currentStep === 1 && !selectedLocation && (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h4 className="font-medium text-white mb-2">Ready to Analyze</h4>
          <p className="text-dark-text-secondary">
            Click anywhere on the map to select a location and start the analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysisWorkflow;
