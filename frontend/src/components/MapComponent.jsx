import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from './ui/Skeleton';

// Ensure Leaflet is available globally
if (typeof window !== 'undefined') {
  window.L = L;
}

// Fix Leaflet marker icons in Vite/React - using CDN URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a custom red marker icon for selected locations
const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create a custom blue marker icon for user's current location
const blueMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const goldMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Calculates the appropriate zoom level for a map to display a given radius around a point.
 * Uses the Web Mercator projection formula to determine zoom level.
 *
 * @param {number} latitude - Latitude of the center point in degrees (-90 to 90)
 * @param {number} radiusMeters - Radius to display in meters (must be > 0)
 * @param {number} mapWidthPx - Width of the map container in pixels (must be > 0)
 * @returns {number} Zoom level between 10 and 18
 */
const calculateZoomFromRadius = (latitude, radiusMeters, mapWidthPx) => {
  // Input validation
  if (!radiusMeters || radiusMeters <= 0 || !mapWidthPx || mapWidthPx <= 0) {
    return 18; // Safe zoom level (OSM max is usually 19)
  }

  // Validate latitude range
  if (latitude < -90 || latitude > 90) {
    console.warn('Invalid latitude provided to calculateZoomFromRadius:', latitude);
    return 12;
  }

  try {
    // Formula: zoom = log2((156543.03392 * cos(latitude) * mapWidthPx) / (2 * radiusMeters))
    // This shows the diameter (2 * radius) across the map width
    const cosLat = Math.cos(latitude * Math.PI / 180);
    const zoom = Math.log2((156543.03392 * cosLat * mapWidthPx) / (2 * radiusMeters));

    // Clamp zoom between reasonable bounds and handle edge cases
    if (!isFinite(zoom)) {
      console.warn('Calculated zoom is not finite, using default zoom');
      return 12;
    }

    return Math.max(10, Math.min(18, Math.round(zoom)));
  } catch (error) {
    console.error('Error calculating zoom level:', error);
    return 12; // Fallback to default zoom
  }
};

const MapComponent = ({ onLocationSelect, selectedLocation, onMapReady, buildingWidth, competitors = [] }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);

  // Get user's current location (non-blocking)
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Initialize map
  useEffect(() => {
    const initMap = () => {
      // Prevent multiple initializations
      if (mapInstanceRef.current) {
        console.log('Map already initialized, skipping...');
        return;
      }

      try {
        console.log('Starting map initialization...');

        // Check if Leaflet is available
        if (typeof L === 'undefined') {
          console.error('Leaflet not loaded, trying to load from window.L');
          if (typeof window !== 'undefined' && window.L) {
            console.log('Using window.L instead');
            window.L = window.L;
          } else {
            throw new Error('Leaflet not loaded');
          }
        }

        // Wait for DOM to be ready (no delay for instant loading)

        // Get the map container
        const container = document.getElementById('business-map');
        if (!container) {
          throw new Error('Map container not found');
        }

        // Check if container already has a map
        if (container._leaflet_id) {
          console.log('Container already has a map, skipping initialization');
          return;
        }

        console.log('Creating Leaflet map...');

        // Get dynamic map width
        const mapWidthPx = container.offsetWidth || 800; // Fallback to 800 if container not ready

        // Start with Jakarta as default location
        const defaultLocation = { lat: -6.2088, lng: 106.8456 }; // Jakarta coordinates

        const zoomLevel = calculateZoomFromRadius(defaultLocation.lat, parseFloat(buildingWidth) || 0, mapWidthPx);

        // Create map with default location as center
        const map = L.map(container, {
          center: [defaultLocation.lat, defaultLocation.lng],
          zoom: zoomLevel,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true
        });

        // Try to get user's location asynchronously (non-blocking)
        console.log('Attempting to get user location...');
        getUserLocation()
          .then((userLocation) => {
            console.log('User location obtained:', userLocation);
            // Update map center to user's location
            map.setView([userLocation.lat, userLocation.lng], zoomLevel);

            // Add red marker for user's current location
            L.marker([userLocation.lat, userLocation.lng], { icon: redMarkerIcon })
              .addTo(map)
              .bindPopup(`📍 Your Current Location<br/>Lat: ${userLocation.lat.toFixed(6)}<br/>Lng: ${userLocation.lng.toFixed(6)}`)
              .openPopup();
          })
          .catch((error) => {
            console.log('Using default location (Jakarta) due to geolocation error:', error.message);
          });

        console.log('Adding map layer...');

        // Define Base Layers
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri'
        });

        // Add default layer (Street)
        streetLayer.addTo(map);

        // Add Layer Control (Switch betweeen Street & Satellite)
        const baseMaps = {
          "Street View": streetLayer,
          "Satellite View": satelliteLayer
        };

        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

        // Handle tile errors for both
        [streetLayer, satelliteLayer].forEach(layer => {
          layer.on('tileerror', (e) => {
             console.warn('Tile load error:', e);
             if (!layer._backupUsed) {
                layer._backupUsed = true;
                layer.setUrl('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
             }
          });
        });

        // Store map instance
        mapInstanceRef.current = map;

        // Add click handler
        map.on('click', (e) => {
          console.log('Map clicked:', e.latlng);
          const { lat, lng } = e.latlng;
          onLocationSelect({ lat, lng });

          // Clear existing markers
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });

          // Add red marker for selected location
          L.marker([lat, lng], { icon: redMarkerIcon })
            .addTo(map)
            .bindPopup(`📍 Selected Location<br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}`)
            .openPopup();
        });

        console.log('Map initialized successfully!');
        console.log('Map instance:', map);
        console.log('Map container size:', container.offsetWidth, 'x', container.offsetHeight);

        // Notify parent component that map is ready
        if (onMapReady) {
          onMapReady(map);
        }

        // Set loaded state immediately after successful initialization
        setMapLoaded(true);

      } catch (error) {
        console.error('Map initialization failed:', error);
        // Create a fallback clickable area
        const container = document.getElementById('business-map');
        if (container) {
          container.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              background: linear-gradient(45deg, #fef3c7 25%, transparent 25%),
                          linear-gradient(-45deg, #fef3c7 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #fef3c7 75%),
                          linear-gradient(-45deg, transparent 75%, #fef3c7 75%);
              background-size: 20px 20px;
              background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: crosshair;
              color: #1f2937;
              font-family: Arial, sans-serif;
            ">
              <div style="text-align: center; background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; border: 2px solid #fbbf24;">
                <h3 style="color: #1f2937;">Click to Select Location</h3>
                <p style="font-size: 14px; color: #6b7280;">Map tiles unavailable - using fallback mode</p>
              </div>
            </div>
          `;

          container.onclick = (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Convert to approximate lat/lng (very rough approximation)
            const lat = 51.505 + (y - rect.height/2) * -0.001;
            const lng = -0.09 + (x - rect.width/2) * 0.001;

            onLocationSelect({ lat, lng });
            console.log('Fallback location selected:', { lat, lng });
          };
        }
        setMapLoaded(true);
      }
    };

    initMap();
  }, [onLocationSelect]);

  // Handle map resize when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update marker and circle when selectedLocation or buildingWidth changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation) {
      // Clear existing markers and circles
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Calculate appropriate zoom level for the building width radius
      const radiusMeters = parseFloat(buildingWidth) || 0;
      const mapSize = mapInstanceRef.current.getSize();
      const mapWidthPx = (mapSize && mapSize.x > 0) ? mapSize.x : 800;
      const zoomLevel = calculateZoomFromRadius(selectedLocation.lat, radiusMeters, mapWidthPx);

      // Fly to the location with calculated zoom
      mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lng], zoomLevel, {
        animate: true,
        duration: 1.5
      });

      // Add new marker
      L.marker([selectedLocation.lat, selectedLocation.lng], { icon: redMarkerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
            <div style="background-color: #0a0a0a; color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #fbbf24; min-width: 220px; font-family: 'Inter', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #fbbf24; display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                 Target Location
              </h3>
              <div style="font-size: 11px; color: #a3a3a3; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #262626; padding-top: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Lat:</span> <span style="color: #e5e5e5; font-family: monospace;">${selectedLocation.lat.toFixed(6)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Lng:</span> <span style="color: #e5e5e5; font-family: monospace;">${selectedLocation.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
        `, { autoClose: false, closeOnClick: false, className: 'custom-popup' })
        .openPopup();

      // Add circle overlay for radius visualization if radius > 0
      if (radiusMeters > 0) {
        try {
          circleRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.1,
            radius: radiusMeters,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(mapInstanceRef.current);
        } catch (error) {
          console.error('Error adding circle overlay:', error);
        }
      }
    }
  }, [selectedLocation, buildingWidth]);

  // Handle Competitors Rendering
  useEffect(() => {
    if (mapInstanceRef.current && competitors) {
      // Clear existing competitor markers (identify them by a custom property or keep track in a ref)
      // For simplicity, we can remove all markers that are NOT the selected location or user location
      // But better: keep a ref of competitor layers
      
      // Remove previous competitor markers
      if (window.competitorLayers && Array.isArray(window.competitorLayers)) {
         window.competitorLayers.forEach(layer => mapInstanceRef.current.removeLayer(layer));
      }
      window.competitorLayers = [];

      competitors.forEach(comp => {
        let icon = redMarkerIcon;
        if (comp.rating >= 4.5) icon = blueMarkerIcon; // Premium
        else if (comp.rating >= 4.0) icon = greenMarkerIcon; // Strong
        else if (comp.rating >= 3.0) icon = goldMarkerIcon; // Moderate
        // else Red (< 3.0)

        const marker = L.marker([comp.lat, comp.lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="background-color: #0a0a0a; color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #333; min-width: 220px; font-family: 'Inter', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #fbbf24; line-height: 1.4; padding-right: 24px;">${comp.name}</h3>
              <div style="display: flex; gap: 12px; margin-bottom: 6px;">
                <div style="font-size: 12px; color: #e5e5e5; display: flex; align-items: center; gap: 4px;">
                  <span style="color: #fbbf24;">★</span> 
                  <span>${comp.rating > 0 ? comp.rating : 'N/A'}</span>
                  <span style="color: #737373; font-size: 10px;">(${comp.user_ratings_total})</span>
                </div>
                <div style="font-size: 12px; color: #a3a3a3;">
                  ${'$'.repeat(comp.price_level || 1)}
                </div>
              </div>
              <div style="font-size: 11px; color: #a3a3a3; margin-top: 8px; border-top: 1px solid #262626; padding-top: 8px; line-height: 1.4;">
                ${comp.vicinity || 'Address not available'}
              </div>
            </div>
          `, { className: 'custom-popup' });
        
        window.competitorLayers.push(marker);
      });
    }
  }, [competitors]);

  return (
    <div className="w-full h-full relative min-h-[400px]">
      <div
        id="business-map"
        ref={mapRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{
          minHeight: '400px',
          backgroundColor: '#e5e5e5', // Light gray background to prevent black screen
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0,
          border: 'none',
          position: 'absolute',
        }}
      />
      {/* Simple Instructions */}
      {!selectedLocation && (
        <div className="absolute top-4 left-4 z-40 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm border border-neutral-800 shadow-xl flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">Click map to select location</span>
          </div>
        </div>
      )}
      {/* Location Status */}
      <div className="absolute top-4 right-4 z-40 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm border border-neutral-800 shadow-xl flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-400" />
          <span className="font-medium">Map centered on your location</span>
        </div>
      </div>
      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Skeleton className="h-8 w-8 rounded-full mx-auto mb-3" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
