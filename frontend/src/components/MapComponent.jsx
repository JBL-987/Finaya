import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapComponent = ({ onLocationSelect, selectedLocation, onMapReady }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
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

        // Create map with Jakarta as center
        const map = L.map(container, {
          center: [-6.2088, 106.8456], // Jakarta coordinates
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true
        });

        console.log('Adding map layer...');

        // Add OpenStreetMap tiles with error handling and fallback
        let tileLayer;

        // Try standard OpenStreetMap first
        try {
          tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '' // Remove attribution text
          });

          // Add error handling for tile loading
          tileLayer.on('tileerror', (e) => {
            console.error('Tile loading error:', e);
            // Try fallback tile server
            console.log('Trying fallback tile server...');
            map.removeLayer(tileLayer);
            const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '' // Remove attribution from fallback too
            });
            fallbackLayer.addTo(map);
          });

          tileLayer.addTo(map);
        } catch (error) {
          console.error('Failed to load primary tiles, trying fallback:', error);
          // Fallback to another tile server
          tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '' // Remove attribution from fallback too
          });
          tileLayer.addTo(map);
        }

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

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation) {
      // Clear existing markers
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Fly to the location
      mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lng], 16, {
        animate: true,
        duration: 1.5
      });

      // Add new marker
      L.marker([selectedLocation.lat, selectedLocation.lng], { icon: redMarkerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`📍 Selected Location<br/>Lat: ${selectedLocation.lat.toFixed(6)}<br/>Lng: ${selectedLocation.lng.toFixed(6)}`)
        .openPopup();
    }
  }, [selectedLocation]);

  return (
    <div className="w-full h-full relative min-h-[400px]">
      <div
        id="business-map"
        ref={mapRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{
          minHeight: '400px',
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
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/90 text-gray-900 px-3 py-2 rounded-lg text-sm border border-gray-300 shadow-sm">
            📍 Click map to select location
          </div>
        </div>
      )}
      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
            <p className="text-lg text-gray-600">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
