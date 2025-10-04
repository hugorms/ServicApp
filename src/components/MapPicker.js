import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = 'http://localhost:3009/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapPicker = ({ onLocationSelect, initialPosition }) => {
  const [markerPosition, setMarkerPosition] = useState(
    initialPosition || { lat: 10.4806, lng: -66.9036 }
  );
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setMarkerPosition(pos);
        reverseGeocode(pos);
      },
    });
    return null;
  }

  function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo([position.lat, position.lng], 15);
    }, [position, map]);
    return null;
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkerPosition(pos);
          reverseGeocode(pos);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener tu ubicación. Por favor, búscala manualmente.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  const reverseGeocode = async (position) => {
    try {
      const response = await fetch(`${API_URL}/geocode/reverse?lat=${position.lat}&lon=${position.lng}`);
      const result = await response.json();

      if (result.success && result.data) {
        const address = result.data.display_name;
        setSelectedAddress(address);

        const locationData = {
          latitude: position.lat,
          longitude: position.lng,
          full_address: address,
          municipality: result.data.address?.city || result.data.address?.town || result.data.address?.municipality || '',
          parish: result.data.address?.suburb || result.data.address?.neighbourhood || '',
          sector: result.data.address?.road || ''
        };

        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
      onLocationSelect({
        latitude: position.lat,
        longitude: position.lng,
        full_address: `Coordenadas: ${position.lat}, ${position.lng}`,
        municipality: '',
        parish: '',
        sector: ''
      });
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length > 3) {
      try {
        const response = await fetch(`${API_URL}/geocode/search?query=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data) {
          setSearchResults(result.data.slice(0, 5));
          setShowResults(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error buscando:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result) => {
    const pos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setMarkerPosition(pos);
    setSelectedAddress(result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);

    const locationData = {
      latitude: pos.lat,
      longitude: pos.lng,
      full_address: result.display_name,
      municipality: result.address?.city || result.address?.town || result.address?.municipality || '',
      parish: result.address?.suburb || result.address?.neighbourhood || '',
      sector: result.address?.road || ''
    };

    onLocationSelect(locationData);
  };

  const handleMarkerDrag = (e) => {
    const pos = { lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng };
    setMarkerPosition(pos);
    reverseGeocode(pos);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={getCurrentLocation}
        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg font-bold hover:shadow-md transition-all"
      >
        <Navigation className="w-4 h-4" />
        <span>📍 Usar mi ubicación actual</span>
      </button>

      <div className="flex items-center space-x-2">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-xs text-slate-500 font-medium">o buscar dirección</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Buscar dirección..."
          className="w-full pl-10 pr-3 py-3 bg-gray-100 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-3 py-2 hover:bg-yellow-50 border-b border-gray-100 last:border-0"
              >
                <p className="text-sm text-slate-800">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={[markerPosition.lat, markerPosition.lng]}
          zoom={15}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[markerPosition.lat, markerPosition.lng]}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
          />
          <MapClickHandler />
          <MapUpdater position={markerPosition} />
        </MapContainer>

        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg z-[1000]">
          <p className="text-xs text-slate-700 font-medium flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-yellow-500" />
            <span>Arrastra el pin para ajustar</span>
          </p>
        </div>
      </div>

      {selectedAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs font-bold text-slate-700 mb-1">📌 Ubicación seleccionada:</p>
          <p className="text-sm text-slate-800">{selectedAddress}</p>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
