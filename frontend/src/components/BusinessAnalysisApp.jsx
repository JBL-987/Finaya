import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { captureMapScreenshot } from '../services/mapScreenshot';
import { CURRENCIES } from '../services/currencies';
import { useAnalysis } from '../hooks/useAnalysis';
import { analysisAPI } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import MapComponent from './MapComponent';
import AnalysisForm from './AnalysisForm';
import ProgressPanel from './ProgressPanel';
import ResultsPanel from './ResultsPanel';


const BusinessAnalysisApp = () => {
  const { selectedCurrency } = useCurrency();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [businessParams, setBusinessParams] = useState({
    buildingWidth: '',
    operatingHours: '',
    productPrice: '',
    currency: selectedCurrency
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { analyses, isLoading: analysisLoading, error: analysisError, createAnalysis, getAnalyses } = useAnalysis();

  // Sinkronkan currency di businessParams bila user mengganti currency global
  useEffect(() => {
    setBusinessParams((prev) => ({
      ...prev,
      currency: selectedCurrency
    }));
  }, [selectedCurrency]);

  // Progress tracking states
  const [analysisProgress, setAnalysisProgress] = useState({
    currentStep: 0,
    steps: [
      { id: 1, name: 'Capture Screenshot', status: 'pending', detail: 'Capturing screenshot of selected area...', image: null },
      { id: 2, name: 'Send to Finaya AI', status: 'pending', detail: 'Sending image to Finaya AI...', image: null },
      { id: 3, name: 'AI Color Analysis', status: 'pending', detail: 'AI analyzing color distribution (residential, roads, open spaces)...', data: null },
      { id: 4, name: 'Area Calculation', status: 'pending', detail: 'Calculating area from screenshot dimensions and scale...', data: null },
      { id: 5, name: 'Population Density', status: 'pending', detail: 'Calculating CGLP and road population density...', data: null },
      { id: 6, name: 'Traffic Analysis', status: 'pending', detail: 'Calculating APC, APT, and visitor traffic...', data: null },
      { id: 7, name: 'Revenue Projection', status: 'pending', detail: 'Calculating daily purchases and monthly revenue...', data: null },
      { id: 8, name: 'Complete', status: 'pending', detail: 'Analysis complete! Displaying results...', data: null }
    ]
  });

  const progressRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Add custom styles for map with yellow theme
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        height: 100% !important;
        width: 100% !important;
        background: #f8fafc !important;
      }
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      }
      .leaflet-control-zoom a {
        background-color: #ffffff !important;
        color: #1f2937 !important;
        border: 1px solid #e5e7eb !important;
      }
      .leaflet-control-zoom a:hover {
        background-color: #fbbf24 !important;
        color: #ffffff !important;
      }
      .leaflet-popup-content-wrapper {
        background: #ffffff !important;
        color: #1f2937 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      .leaflet-popup-tip {
        background: #ffffff !important;
      }
      .custom-marker {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }
      /* Hide any unwanted logos, flags, or watermarks */
      .leaflet-control-attribution,
      .leaflet-control-logo,
      [class*="flag"],
      [class*="ukraine"],
      img[src*="flag"],
      img[src*="ukraine"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      /* Component-specific styles */
      .leaflet-container {
        background: #1f2937 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle when map is ready for screenshot capture
  const handleMapReady = useCallback((mapInstance) => {
    mapInstanceRef.current = mapInstance;
    setMapLoaded(true);
    console.log('Map is ready for screenshot capture');
  }, []);

  // Handle location selection with useCallback to prevent unnecessary re-renders
  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  // Update analysis progress with auto-scroll
  const updateProgress = (stepId, status, detail = null, data = null, image = null) => {
    setAnalysisProgress(prev => ({
      ...prev,
      currentStep: stepId,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, status, detail: detail || step.detail, data, image }
          : step.id < stepId
            ? { ...step, status: 'completed' }
            : step
      )
    }));

    // Auto-scroll to current step
    setTimeout(() => {
      if (progressRef.current) {
        const activeStep = progressRef.current.querySelector(`[data-step-id="${stepId}"]`);
        if (activeStep) {
          activeStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  const handleAnalysis = async () => {
    // Validate inputs
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      await Swal.fire({
        icon: 'warning',
        title: 'Location Not Selected',
        text: 'Please select a location on the map first',
        confirmButtonText: 'OK',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    if (!businessParams.buildingWidth || !businessParams.operatingHours || !businessParams.productPrice) {
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Parameters',
        text: 'Please fill all business parameters (building width, operating hours, price)',
        confirmButtonText: 'OK',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    if (!mapInstanceRef.current) {
      await Swal.fire({
        icon: 'info',
        title: 'Map Not Ready',
        text: 'Map is not ready yet. Please wait a moment and try again.',
        confirmButtonText: 'OK',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    console.log('Starting analysis for:', selectedLocation, businessParams);
    setIsAnalyzing(true);
    setCurrentStep(2);

    // Reset progress
    setAnalysisProgress(prev => ({
      ...prev,
      currentStep: 0,
      steps: prev.steps.map(step => ({ ...step, status: 'pending', data: null, image: null }))
    }));

    try {
      // Step 1: Screenshot Capture
      updateProgress(1, 'active', 'Capturing screenshot of selected area...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Capturing screenshot for location:', selectedLocation);

      // Calculate dynamic zoom level based on building width - ZOOM IN MUCH MORE
      const buildingWidth = parseFloat(businessParams.buildingWidth);
      let zoomLevel = 18; // default - much more zoomed in

      if (buildingWidth >= 50) {
        zoomLevel = 16; // very wide buildings - still zoom in but less than smaller buildings
      } else if (buildingWidth >= 30) {
        zoomLevel = 17; // wide buildings - zoom in moderately
      } else if (buildingWidth >= 20) {
        zoomLevel = 18; // medium buildings - zoom in more
      } else if (buildingWidth >= 10) {
        zoomLevel = 19; // small buildings - zoom in significantly
      } else {
        zoomLevel = 20; // very small buildings - maximum zoom in
      }

      console.log(`Using zoom level ${zoomLevel} for building width ${buildingWidth}m`);

      const screenshot = await captureMapScreenshot(
        mapInstanceRef.current,
        selectedLocation.lat,
        selectedLocation.lng,
        zoomLevel
      );

      updateProgress(1, 'completed', 'Screenshot captured successfully!', null, screenshot.imageBase64);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Send to Backend for Analysis
      updateProgress(2, 'active', 'Sending to backend for AI analysis and calculation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call backend /analyze endpoint (no auto-save)
      const response = await analysisAPI.analyze(
        `${selectedLocation.lat}, ${selectedLocation.lng}`,
        {
          buildingWidth: parseFloat(businessParams.buildingWidth),
          operatingHours: parseFloat(businessParams.operatingHours),
          productPrice: parseFloat(businessParams.productPrice)
        },
        screenshot.imageBase64,
        screenshot.metadata
      );

      console.log('Backend analysis response:', response);

      updateProgress(2, 'completed', 'Backend analysis complete!', {
        analysisId: response.analysis_id,
        metrics: response.metrics
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update remaining steps as completed since backend handled everything
      updateProgress(3, 'completed', 'AI color analysis complete!', response.area_distribution);
      updateProgress(4, 'completed', 'Area calculation complete!');
      updateProgress(5, 'completed', 'Population density calculated!');
      updateProgress(6, 'completed', 'Traffic analysis complete!');
      updateProgress(7, 'completed', 'Revenue projection complete!', {
        tppd: `${response.metrics.tppd} potnetial daily customers`,
        monthlyRevenue: `${CURRENCIES[selectedCurrency]?.symbol || ''}${response.metrics.monthlyRevenue.toLocaleString()}`
      });
      updateProgress(8, 'completed', 'Analysis complete! Results ready to display.');

      // Set results
      const finalResults = {
        success: true,
        metrics: response.metrics,
        areaDistribution: response.area_distribution,
        rawResponse: response.raw_response,
        locationName: response.location_name,
        locationData: {
          areaSquareKm: response.metrics.areaData?.areaSqKm,
          populationDensityPerSqKm: 16000,
          screenshotArea: screenshot.metadata
        }
      };

      console.log('Final results to display:', finalResults);
      setAnalysisResults(finalResults);
      setCurrentStep(3);
      setShowResults(true);

      // Show success notification
      await Swal.fire({
        icon: 'success',
        title: 'Analysis Successful!',
        text: 'Business profitability analysis completed. Use the Save button to save results.',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1f2937'
      });

    } catch (error) {
      console.error('Analysis failed:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Analysis Failed',
        text: `An error occurred during analysis: ${error.message}`,
        confirmButtonText: 'OK',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#dc2626'
      });

      setCurrentStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedLocation(null);
    setBusinessParams({ buildingWidth: '', operatingHours: '', productPrice: '', currency: selectedCurrency });
    setAnalysisResults(null);
    setCurrentStep(1);
    setShowResults(false);

    // Clear map markers
    if (mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
    }
  };

  const handleManualSave = async () => {
    if (!analysisResults) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Results to Save',
        text: 'Please run an analysis first before saving.',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    try {
      const locationName = analysisResults.locationName || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
      const analysisData = {
        name: `Business Analysis - ${locationName}`,
        location: `${selectedLocation.lat}, ${selectedLocation.lng}`,
        analysis_type: 'business_profitability',
        data: analysisResults,
        qwen_analysis: analysisResults.areaDistribution
      };

      await createAnalysis(analysisData);

      await Swal.fire({
        icon: 'success',
        title: 'Analysis Saved!',
        text: 'Your analysis has been saved successfully.',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1f2937'
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: `Failed to save analysis: ${error.message}`,
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header Section */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-9 sm:px-6 lg:px-8">
          <div className="text-center">
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-gray-800 border-b border-gray-700">
        <AnalysisForm
          key={selectedCurrency}
          selectedLocation={selectedLocation}
          businessParams={businessParams}
          onParamsChange={setBusinessParams}
          onAnalysis={handleAnalysis}
          isAnalyzing={isAnalyzing}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Main Content - Split Layout with full height */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* Left Panel - Map */}
          <div className="w-full lg:w-3/5 relative flex flex-col">
            <div className="flex-1">
              <MapComponent
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                onMapReady={handleMapReady}
                buildingWidth={businessParams.buildingWidth}
              />
            </div>
          </div>

        {/* Vertical Divider - Full height */}
        <div className="hidden lg:block w-px bg-yellow-400 self-stretch"></div>

        {/* Right Panel - Progress & Info */}
        <div className="w-full lg:w-2/5 h-full bg-gray-900 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ProgressPanel
              analysisProgress={analysisProgress}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <ResultsPanel
        analysisResults={analysisResults}
        businessParams={businessParams}
        showResults={showResults}
        onClose={() => setShowResults(false)}
        onSave={handleManualSave}
      />
    </div>
  );
};

export default BusinessAnalysisApp;
