import { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Loader,
  RefreshCw,
  Search,
  X,
  Download,
  Upload
} from 'lucide-react';
import { 
  getAnalysisResultsPaginated, 
  deleteAnalysisResult, 
  getAnalysisResult 
} from '../services/analysisStorage';
import { formatCurrency } from '../services/currencies';
import Swal from 'sweetalert2';

const SavedAnalysisManager = ({ onLoadAnalysis, onClose, actor }) => {
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const resultsPerPage = 10;

  // Helper function to safely convert BigInt to Number
  const safeBigIntToNumber = (value) => {
    if (typeof value === 'bigint') {
      // Check if BigInt is within safe integer range
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
        console.warn('BigInt value exceeds safe integer range:', value);
        return Number(value); // Convert anyway but warn
      }
      return Number(value);
    }
    if (typeof value === 'string' && !isNaN(value)) {
      return Number(value);
    }
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  };

  // FIXED: Helper function to normalize analysis data structure
  const normalizeAnalysisData = (analysis) => {
    if (!analysis) return analysis;
    
    // Convert backend format to frontend format
    const normalized = {
      id: analysis.id,
      timestamp: safeBigIntToNumber(analysis.timestamp),
      title: analysis.title || 'Untitled Analysis',
      notes: analysis.notes || '',
      
      // FIXED: Map backend structure to frontend structure
      locationData: {
        lat: analysis.locationData?.lat || 0,
        lng: analysis.locationData?.lng || 0,
        areaSquareKm: analysis.locationData?.areaSquareKm || 0.056
      },
      
      // FIXED: Map business metrics from backend format
      metrics: {
        tppd: safeBigIntToNumber(analysis.businessMetrics?.tppd || 0),
        dailyRevenue: safeBigIntToNumber(analysis.businessMetrics?.dailyRevenue || 0),
        monthlyRevenue: safeBigIntToNumber(analysis.businessMetrics?.monthlyRevenue || 0),
        yearlyRevenue: safeBigIntToNumber(analysis.businessMetrics?.yearlyRevenue || 0),
        cglp: safeBigIntToNumber(analysis.businessMetrics?.cglp || 0),
        pops: safeBigIntToNumber(analysis.businessMetrics?.pops || 0),
        roadAreaSqm: safeBigIntToNumber(analysis.businessMetrics?.roadAreaSqm || 0),
        pdr: analysis.businessMetrics?.pdr || 0,
        apc: analysis.businessMetrics?.apc || 0,
        apt: safeBigIntToNumber(analysis.businessMetrics?.apt || 0),
        vcdt: safeBigIntToNumber(analysis.businessMetrics?.vcdt || 0)
      },
      
      // FIXED: Map business parameters from backend format
      businessParams: {
        buildingWidth: analysis.businessParameters?.buildingWidth || 0,
        operatingHours: analysis.businessParameters?.operatingHours || 0,
        productPrice: analysis.businessParameters?.productPrice || 0,
        currency: analysis.businessParameters?.currency || 'USD',
        // FIXED: Include location in businessParams for compatibility
        location: {
          lat: analysis.locationData?.lat || 0,
          lng: analysis.locationData?.lng || 0
        }
      },
      
      // FIXED: Map area distribution from backend format
      areaDistribution: {
        residential: analysis.areaDistribution?.residential || 0,
        road: analysis.areaDistribution?.road || 0,
        openSpace: analysis.areaDistribution?.openSpace || 0
      }
    };
    
    return normalized;
  };

  // Load saved analyses
  const loadSavedAnalyses = async (page = 0, search = '') => {
    try {
      setLoading(true);
      const offset = page * resultsPerPage;
      
      // Use the actor directly if available, otherwise fall back to getAnalysisResultsPaginated
      let result;
      if (actor) {
        const rawResult = await actor.getAnalysisResultsPaginated(offset, resultsPerPage);
        result = {
          results: rawResult.results.map(analysisResult => ({
            ...analysisResult,
            timestamp: safeBigIntToNumber(analysisResult.timestamp),
            businessMetrics: {
              ...analysisResult.businessMetrics,
              cglp: safeBigIntToNumber(analysisResult.businessMetrics.cglp),
              pops: safeBigIntToNumber(analysisResult.businessMetrics.pops),
              roadAreaSqm: safeBigIntToNumber(analysisResult.businessMetrics.roadAreaSqm),
              apt: safeBigIntToNumber(analysisResult.businessMetrics.apt),
              vcdt: safeBigIntToNumber(analysisResult.businessMetrics.vcdt),
              tppd: safeBigIntToNumber(analysisResult.businessMetrics.tppd),
              dailyRevenue: safeBigIntToNumber(analysisResult.businessMetrics.dailyRevenue),
              monthlyRevenue: safeBigIntToNumber(analysisResult.businessMetrics.monthlyRevenue),
              yearlyRevenue: safeBigIntToNumber(analysisResult.businessMetrics.yearlyRevenue)
            }
          })),
          total: safeBigIntToNumber(rawResult.total),
          hasMore: Boolean(rawResult.hasMore)
        };
      } else {
        result = await getAnalysisResultsPaginated(offset, resultsPerPage);
      }
      
      console.log('Raw backend result:', result);
      
      // Normalize all analyses to handle backend structure conversion
      let filteredResults = result.results.map(normalizeAnalysisData);
      
      console.log('Normalized results:', filteredResults);
      
      // Filter by search query if provided
      if (search.trim()) {
        const query = search.toLowerCase();
        filteredResults = filteredResults.filter(analysis => {
          try {
            return (
              (analysis.title && analysis.title.toLowerCase().includes(query)) ||
              (analysis.notes && analysis.notes.toLowerCase().includes(query)) ||
              analysis.locationData.lat.toString().includes(query) ||
              analysis.locationData.lng.toString().includes(query) ||
              analysis.businessParams.currency.toLowerCase().includes(query)
            );
          } catch (error) {
            console.warn('Error filtering analysis:', analysis.id, error);
            return false;
          }
        });
      }
      
      if (page === 0) {
        setSavedAnalyses(filteredResults);
      } else {
        setSavedAnalyses(prev => [...prev, ...filteredResults]);
      }
      
      setTotalResults(result.total);
      setHasMore(result.hasMore && !search.trim()); // Disable pagination for search
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading saved analyses:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Loading Failed',
        text: 'Failed to load saved analyses. Please try again.',
        background: '#1f2937',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load more results
  const loadMore = () => {
    if (!loading && hasMore) {
      loadSavedAnalyses(currentPage + 1, searchQuery);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(0);
    loadSavedAnalyses(0, query);
  };

  // Delete analysis
  const handleDelete = async (analysisId, title) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Analysis?',
      text: `Are you sure you want to delete "${title || 'Untitled Analysis'}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff'
    });

    if (result.isConfirmed) {
      try {
        setDeleting(analysisId);
        await deleteAnalysisResult(analysisId);
        
        // Remove from local state
        setSavedAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
        setTotalResults(prev => prev - 1);
        
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Analysis has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: '#1f2937',
          color: '#ffffff'
        });
      } catch (error) {
        console.error('Error deleting analysis:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Failed to delete analysis. Please try again.',
          background: '#1f2937',
          color: '#ffffff',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        setDeleting(null);
      }
    }
  };

  // FIXED: Load analysis with proper format conversion
  const handleLoad = async (analysisId) => {
    try {
      let analysis;
      if (actor) {
        const rawAnalysis = await actor.getAnalysisResult(analysisId);
        if (rawAnalysis) {
          analysis = {
            ...rawAnalysis,
            timestamp: safeBigIntToNumber(rawAnalysis.timestamp),
            businessMetrics: {
              ...rawAnalysis.businessMetrics,
              cglp: safeBigIntToNumber(rawAnalysis.businessMetrics.cglp),
              pops: safeBigIntToNumber(rawAnalysis.businessMetrics.pops),
              roadAreaSqm: safeBigIntToNumber(rawAnalysis.businessMetrics.roadAreaSqm),
              apt: safeBigIntToNumber(rawAnalysis.businessMetrics.apt),
              vcdt: safeBigIntToNumber(rawAnalysis.businessMetrics.vcdt),
              tppd: safeBigIntToNumber(rawAnalysis.businessMetrics.tppd),
              dailyRevenue: safeBigIntToNumber(rawAnalysis.businessMetrics.dailyRevenue),
              monthlyRevenue: safeBigIntToNumber(rawAnalysis.businessMetrics.monthlyRevenue),
              yearlyRevenue: safeBigIntToNumber(rawAnalysis.businessMetrics.yearlyRevenue)
            }
          };
        }
      } else {
        analysis = await getAnalysisResult(analysisId);
      }
      
      if (analysis) {
        // Normalize the loaded analysis before passing it
        const normalizedAnalysis = normalizeAnalysisData(analysis);
        
        console.log('Loading analysis:', normalizedAnalysis);
        
        onLoadAnalysis(normalizedAnalysis);
        onClose();
        
        await Swal.fire({
          icon: 'success',
          title: 'Analysis Loaded!',
          text: 'Previous analysis has been loaded successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: '#1f2937',
          color: '#ffffff'
        });
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to load analysis. Please try again.',
        background: '#1f2937',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // Export analysis as JSON
  const handleExport = (analysis) => {
    const dataToExport = {
      ...analysis,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Finaya'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `befinder-analysis-${analysis.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format date - Updated with better error handling
  const formatDate = (timestamp) => {
    try {
      // Convert BigInt or string timestamp to number for Date constructor
      let timestampNumber;
      
      if (typeof timestamp === 'bigint') {
        timestampNumber = Number(timestamp);
      } else if (typeof timestamp === 'string') {
        timestampNumber = parseInt(timestamp, 10);
      } else if (typeof timestamp === 'number') {
        timestampNumber = timestamp;
      } else {
        console.warn('Invalid timestamp type:', typeof timestamp, timestamp);
        return 'Invalid Date';
      }

      // Check if timestamp is in milliseconds or seconds
      if (timestampNumber < 1000000000000) {
        timestampNumber *= 1000; // Convert seconds to milliseconds
      }

      const date = new Date(timestampNumber);
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date created from timestamp:', timestamp);
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid Date';
    }
  };

  // Initial load
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-card-foreground flex items-center">
              <Save className="w-6 h-6 mr-3 text-blue-400" />
              Saved Analysis Results
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search analyses..."
                className="pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{totalResults} total results</span>
              <button
                onClick={() => loadSavedAnalyses(0, searchQuery)}
                disabled={loading}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && savedAnalyses.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading saved analyses...</p>
              </div>
            </div>
          ) : savedAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <Save className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                No Saved Analyses
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'No analyses match your search.' : 'Your analysis results will appear here after you run an analysis.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-background rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {analysis.title || 'Untitled Analysis'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(analysis.timestamp)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {analysis.locationData?.lat?.toFixed(4) || 'N/A'}, {analysis.locationData?.lng?.toFixed(4) || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExport(analysis)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Export"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleLoad(analysis.id)}
                        className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                        title="Load Analysis"
                      >
                        <Upload className="w-4 h-4 text-primary-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(analysis.id, analysis.title)}
                        disabled={deleting === analysis.id}
                        className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        {deleting === analysis.id ? (
                          <Loader className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats - FIXED with safe number conversion */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-card/50 rounded-lg p-3 text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                      <div className="text-sm font-semibold text-card-foreground">
                        {analysis.metrics?.tppd || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Customers/Day</div>
                    </div>
                    
                    <div className="bg-card/50 rounded-lg p-3 text-center">
                      <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-400" />
                      <div className="text-sm font-semibold text-card-foreground">
                        {formatCurrency(analysis.metrics?.dailyRevenue || 0, analysis.businessParams?.currency || 'USD')}
                      </div>
                      <div className="text-xs text-muted-foreground">Daily Revenue</div>
                    </div>
                    
                    <div className="bg-card/50 rounded-lg p-3 text-center">
                      <div className="text-sm font-semibold text-card-foreground">
                        {formatCurrency(analysis.metrics?.monthlyRevenue || 0, analysis.businessParams?.currency || 'USD')}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                    </div>
                    
                    <div className="bg-card/50 rounded-lg p-3 text-center">
                      <div className="text-sm font-semibold text-card-foreground">
                        {analysis.businessParams?.currency || 'USD'}
                      </div>
                      <div className="text-xs text-muted-foreground">Currency</div>
                    </div>
                  </div>

                  {analysis.notes && (
                    <div className="mt-3 p-2 bg-card/30 rounded text-sm text-muted-foreground">
                      <strong>Notes:</strong> {analysis.notes}
                    </div>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted rounded-lg font-medium transition-colors text-primary-foreground"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2 inline" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAnalysisManager;