import html2canvas from 'html2canvas';
import logger from '../utils/logger';

/**
 * Captures a screenshot of the map at a specific location
 * @param {Object} map - Leaflet map instance
 * @param {number} lat - Latitude of the location
 * @param {number} lng - Longitude of the location
 * @param {number} zoomLevel - Zoom level for the screenshot
 * @returns {Promise<Object>} Screenshot data and metadata
 */
export async function captureMapScreenshot(map, lat, lng, zoomLevel = null) {
  try {
    // Ensure map is settled
    map.invalidateSize();
    
    // Optionally center if coordinates provided (but usually already centered)
    if (lat && lng) {
        const currentZoom = zoomLevel !== null ? zoomLevel : map.getZoom();
        map.setView([lat, lng], currentZoom, { animate: false });
    }

    // Wait for tiles/render to stabilize
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get the map container element and dimensions
    const mapContainer = map.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    
    // Capture screenshot using html2canvas with strict cropping
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: 1,
      logging: false,
      width: rect.width,
      height: rect.height,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        return element.classList.contains('leaflet-control-container');
      },
      onclone: (clonedDoc) => {
        const clonedMapContainer = clonedDoc.querySelector('.leaflet-container');
        if (clonedMapContainer) {
          // Reset positioning to avoid offsets in clone
          clonedMapContainer.style.position = 'fixed';
          clonedMapContainer.style.top = '0';
          clonedMapContainer.style.left = '0';
          clonedMapContainer.style.margin = '0';
        }
        
        // Ensure ALL SVGs are fully opaque (sometimes they fade in)
        const svgs = clonedDoc.querySelectorAll('svg');
        svgs.forEach(svg => {
           svg.style.opacity = '1';
        });
      }
    });
    
    // Convert canvas to base64
    const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
    
    // Get map bounds and calculate scale
    const bounds = map.getBounds();
    const mapSize = map.getSize();
    const scale = calculateMapScale(bounds, mapSize, zoomLevel);
    
    // Calculate area in square kilometers
    const areaSquareKm = calculateAreaFromBounds(bounds);
    
    const metadata = {
      width: canvas.width,
      height: canvas.height,
      scale: scale, // meters per pixel
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      center: { lat, lng },
      zoomLevel,
      areaSquareKm,
      timestamp: new Date().toISOString()
    };
    
    return {
      success: true,
      imageBase64,
      metadata,
      canvas
    };
    
  } catch (error) {
    logger.error('Error capturing map screenshot:', error);
    throw new Error(`Failed to capture map screenshot: ${error.message}`);
  }
}

/**
 * Calculates the scale (meters per pixel) for a map view
 * @param {Object} bounds - Map bounds
 * @param {Object} mapSize - Map container size in pixels
 * @param {number} zoomLevel - Current zoom level
 * @returns {number} Scale in meters per pixel
 */
function calculateMapScale(bounds, mapSize, zoomLevel) {
  // Calculate the distance in meters for the map width
  const latRad = (bounds.getNorth() + bounds.getSouth()) / 2 * Math.PI / 180;
  const metersPerDegree = 111320 * Math.cos(latRad);
  const mapWidthInDegrees = bounds.getEast() - bounds.getWest();
  const mapWidthInMeters = mapWidthInDegrees * metersPerDegree;
  
  // Calculate scale (meters per pixel)
  const scale = mapWidthInMeters / mapSize.x;
  
  return scale;
}

/**
 * Calculates the area in square kilometers from map bounds
 * @param {Object} bounds - Leaflet bounds object
 * @returns {number} Area in square kilometers
 */
function calculateAreaFromBounds(bounds) {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = bounds.getSouth() * Math.PI / 180;
  const lat2 = bounds.getNorth() * Math.PI / 180;
  const deltaLat = (bounds.getNorth() - bounds.getSouth()) * Math.PI / 180;
  const deltaLng = (bounds.getEast() - bounds.getWest()) * Math.PI / 180;
  
  // Calculate area using spherical geometry
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
           Math.cos(lat1) * Math.cos(lat2) *
           Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Approximate area calculation for small regions
  const avgLat = (lat1 + lat2) / 2;
  const latDistance = deltaLat * R;
  const lngDistance = deltaLng * R * Math.cos(avgLat);
  
  const areaSquareKm = latDistance * lngDistance;
  
  return Math.abs(areaSquareKm);
}

/**
 * Stores screenshot data in localStorage for later use
 * @param {string} locationKey - Unique key for the location
 * @param {Object} screenshotData - Screenshot data and metadata
 */
export function storeScreenshotData(locationKey, screenshotData) {
  try {
    const storageKey = `befinder_screenshot_${locationKey}`;
    const dataToStore = {
      ...screenshotData,
      // Don't store the actual image data to save space
      imageBase64: null,
      storedAt: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    
    // Store analysis results separately if they exist
    if (screenshotData.analysis) {
      const analysisKey = `befinder_analysis_${locationKey}`;
      localStorage.setItem(analysisKey, JSON.stringify(screenshotData.analysis));
    }
    
    return true;
  } catch (error) {
    logger.error('Error storing screenshot data:', error);
    return false;
  }
}

/**
 * Retrieves stored screenshot data from localStorage
 * @param {string} locationKey - Unique key for the location
 * @returns {Object|null} Stored screenshot data or null if not found
 */
export function getStoredScreenshotData(locationKey) {
  try {
    const storageKey = `befinder_screenshot_${locationKey}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return null;
    
    const data = JSON.parse(storedData);
    
    // Also get analysis results if they exist
    const analysisKey = `befinder_analysis_${locationKey}`;
    const analysisData = localStorage.getItem(analysisKey);
    if (analysisData) {
      data.analysis = JSON.parse(analysisData);
    }
    
    return data;
  } catch (error) {
    logger.error('Error retrieving screenshot data:', error);
    return null;
  }
}

/**
 * Generates a unique key for a location based on coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal precision for coordinates
 * @returns {string} Unique location key
 */
export function generateLocationKey(lat, lng, precision = 6) {
  const roundedLat = parseFloat(lat.toFixed(precision));
  const roundedLng = parseFloat(lng.toFixed(precision));
  return `${roundedLat}_${roundedLng}`;
}

export default {
  captureMapScreenshot,
  storeScreenshotData,
  getStoredScreenshotData,
  generateLocationKey
};
