import { useState, useEffect, useRef, useCallback } from 'react';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import Swal from 'sweetalert2';
import { captureMapScreenshot } from '../services/mapScreenshot';
import { CURRENCIES } from '../services/currencies';
import { useAnalysis } from '../hooks/useAnalysis';
import { analysisAPI, placesAPI } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import { saveGuestAnalysis, hasGuestAnalyses } from '../utils/guestStorage';
import { firebaseAuth } from '../services/firebase';
import MapComponent from './MapComponent';
import AnalysisForm from './AnalysisForm';
import ProgressPanel from './ProgressPanel';
import ResultsPanel from './ResultsPanel';

const BusinessAnalysisApp = () => {
  const { selectedCurrency } = useCurrency();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [competitors, setCompetitors] = useState([]); // <--- New State
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
      { id: 2, name: 'Send to Gemini AI', status: 'pending', detail: 'Sending image to Gemini AI...', image: null },
      { id: 3, name: 'AI Color Analysis', status: 'pending', detail: 'AI analyzing color distribution...', data: null },
      { id: 4, name: 'Competitor Scan', status: 'pending', detail: 'Scanning nearby businesses via Places API...', data: null }, // <--- New Step
      { id: 5, name: 'Area Calculation', status: 'pending', detail: 'Calculating area from screenshot dimensions...', data: null },
      { id: 6, name: 'Population Density', status: 'pending', detail: 'Calculating CGLP and road population density...', data: null },
      { id: 7, name: 'Traffic Analysis', status: 'pending', detail: 'Calculating APC, APT, and visitor traffic...', data: null },
      { id: 8, name: 'Revenue Projection', status: 'pending', detail: 'Calculating daily purchases and monthly revenue...', data: null },
      { id: 9, name: 'Complete', status: 'pending', detail: 'Analysis complete! Displaying results...', data: null }
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
      
      // Close any open popups to ensure clean screenshot
      if (mapInstanceRef.current) {
        mapInstanceRef.current.closePopup();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Use current map zoom level for screenshot - no forced zoom out
      console.log('Capturing screenshot using current map zoom level');

      const screenshot = await captureMapScreenshot(
        mapInstanceRef.current,
        selectedLocation.lat,
        selectedLocation.lng
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

      // Step 3 (Color Analysis) - completed via backend response
      updateProgress(3, 'completed', 'AI color analysis complete!', response.area_distribution);

      // Step 4: Competitor Scan (New)
      updateProgress(4, 'active', 'Scanning nearby competitors...');
      let nearbyCompetitors = [];
      try {
        const selectedType = BUSINESS_TYPES.find(t => t.value === businessParams.businessType) || BUSINESS_TYPES[0];
        const osmQuery = selectedType.osmQuery || '["amenity"~"cafe"]';
        const searchRadius = selectedType.radius || 1000;

        nearbyCompetitors = await placesAPI.getCompetitors(
          selectedLocation.lat,
          selectedLocation.lng,
          searchRadius,
          osmQuery
        );
        setCompetitors(nearbyCompetitors);
        updateProgress(4, 'completed', `Found ${nearbyCompetitors.length} nearby competitors`, { count: nearbyCompetitors.length });
      } catch (err) {
        console.error("Competitor scan failed", err);
        updateProgress(4, 'completed', 'Competitor scan skipped (API error)', { count: 0 });
      }
      await new Promise(resolve => setTimeout(resolve, 500));

      // Continue with other steps (remapped IDs)
      updateProgress(5, 'completed', 'Area calculation complete!');
      updateProgress(6, 'completed', 'Population density calculated!');
      updateProgress(7, 'completed', 'Traffic analysis complete!');
      updateProgress(8, 'completed', 'Revenue projection complete!', {
        tppd: `${response.metrics.tppd} potnetial daily customers`,
        monthlyRevenue: `${CURRENCIES[selectedCurrency]?.symbol || ''}${response.metrics.monthlyRevenue.toLocaleString()}`
      });
      updateProgress(9, 'completed', 'Analysis complete! Results ready to display.');

      // Set results
      const finalResults = {
        success: true,
        metrics: response.metrics,
        areaDistribution: response.area_distribution,
        rawResponse: response.raw_response,
        locationName: response.location_name,
        competitors: nearbyCompetitors,
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
      // Check if user is authenticated
      const currentUser = firebaseAuth.getCurrentUser();
      const locationName = analysisResults.locationName || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
      
      const analysisData = {
        name: `Business Analysis - ${locationName}`,
        location: `${selectedLocation.lat}, ${selectedLocation.lng}`,
        analysis_type: 'business_profitability',
        data: analysisResults,
        gemini_analysis: analysisResults.areaDistribution
      };

      if (!currentUser) {
        // Guest mode - save to localStorage
        const savedAnalysis = saveGuestAnalysis(analysisData);
        
        if (savedAnalysis) {
          const result = await Swal.fire({
            icon: 'info',
            title: 'Analysis Saved Temporarily',
            html: `
              <p>Your analysis has been saved to your browser.</p>
              <p class="text-sm text-gray-600 mt-2">💡 <strong>Guest Mode:</strong> Your data is stored locally and will be lost if you clear your browser data.</p>
              <p class="text-sm text-yellow-600 mt-2">✨ <strong>Sign up for a free account</strong> to save your analyses permanently!</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sign Up Now',
            cancelButtonText: 'Continue as Guest',
            background: '#ffffff',
            color: '#1f2937',
            confirmButtonColor: '#d97706',
            cancelButtonColor: '#6b7280'
          });

          // If user chooses to sign up, redirect to home
          if (result.isConfirmed) {
            window.location.href = '/';
          }
        } else {
          throw new Error('Failed to save analysis to local storage');
        }
      } else {
        // Authenticated user - save to backend
        await createAnalysis(analysisData);

        await Swal.fire({
          icon: 'success',
          title: 'Analysis Saved!',
          text: 'Your analysis has been saved to your account.',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1f2937'
        });
      }
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Section */}
      <div className="bg-black border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-9 sm:px-6 lg:px-8">
          <div className="text-center">
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-neutral-950 border-b border-neutral-900">
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
                competitors={competitors}
              />
            </div>
          </div>

        {/* Vertical Divider - Full height */}
        <div className="hidden lg:block w-px bg-yellow-400 self-stretch"></div>

        {/* Right Panel - Progress & Info */}
        <div className="w-full lg:w-2/5 h-full bg-black flex flex-col">
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
