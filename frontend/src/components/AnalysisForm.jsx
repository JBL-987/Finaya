import { Loader, MapPin, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CURRENCIES, getCurrencySymbol } from "../services/currencies";

const AnalysisForm = ({
  selectedLocation,
  businessParams,
  onParamsChange,
  onAnalysis,
  isAnalyzing,
  onLocationSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleCurrencyChange = (e) => {
    onParamsChange({
      ...businessParams,
      currency: e.target.value,
      productPrice: "", // Reset productPrice to avoid invalid values for new currency
    });
  };

  const getInputStep = (currencyCode) => {
    const highDenominationCurrencies = ["IDR", "VND", "KRW", "JPY"];
    return highDenominationCurrencies.includes(currencyCode) ? "1000" : "0.01";
  };

  const searchLocations = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLocationSelect = (result) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
    };
    onLocationSelect(location);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 p-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
          {/* Location Search */}
          <div className="relative w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-yellow-400 text-white placeholder-gray-400"
                placeholder="Search for a location..."
              />
              {isSearching && (
                <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-yellow-400" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                  >
                    <div className="text-sm text-white font-medium">
                      {result.display_name.split(",")[0]}
                    </div>
                    <div className="text-xs text-gray-400">
                      {result.display_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Status */}
          {selectedLocation && (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <MapPin className="h-4 w-4" />
              <span>Location Selected</span>
            </div>
          )}
        </div>

        {/* Business Parameters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <input
              type="number"
              value={businessParams.buildingWidth}
              onChange={(e) =>
                onParamsChange({
                  ...businessParams,
                  buildingWidth: e.target.value,
                })
              }
              className="w-12 sm:w-16 px-1 sm:px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs sm:text-sm focus:ring-1 focus:ring-yellow-400 text-white placeholder-gray-400"
              placeholder="10"
            />
            <span className="text-xs text-gray-300">m</span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <input
              type="number"
              value={businessParams.operatingHours}
              onChange={(e) =>
                onParamsChange({
                  ...businessParams,
                  operatingHours: e.target.value,
                })
              }
              className="w-12 sm:w-16 px-1 sm:px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs sm:text-sm focus:ring-1 focus:ring-yellow-400 text-white placeholder-gray-400"
              placeholder="12"
            />
            <span className="text-xs text-gray-300">hrs</span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <select
              value={businessParams.currency}
              onChange={handleCurrencyChange}
              className="w-16 sm:w-20 px-1 sm:px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs sm:text-sm focus:ring-1 focus:ring-yellow-400 text-white"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-300">
              {getCurrencySymbol(businessParams.currency)}
            </span>
            <input
              type="number"
              step={getInputStep(businessParams.currency)}
              value={businessParams.productPrice}
              onChange={(e) =>
                onParamsChange({
                  ...businessParams,
                  productPrice: e.target.value,
                })
              }
              className="w-16 sm:w-20 px-1 sm:px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs sm:text-sm focus:ring-1 focus:ring-yellow-400 text-white placeholder-gray-400"
              placeholder={
                CURRENCIES[businessParams.currency]?.placeholder || "0.00"
              }
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={onAnalysis}
            disabled={
              isAnalyzing ||
              !selectedLocation ||
              !businessParams.buildingWidth ||
              !businessParams.operatingHours ||
              !businessParams.productPrice
            }
            className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-4 py-2 font-medium shadow-lg hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisForm;
