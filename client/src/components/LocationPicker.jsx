import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (they break with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const originIcon = createIcon('red');
const destIcon = createIcon('green');

// Component to handle map click events
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      // Reverse geocode using Nominatim
      try {
        const res = await fetch(
          `/nominatim/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
        );
        const data = await res.json();
        const name = data.display_name
          ? data.display_name.split(',').slice(0, 3).join(',').trim()
          : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onLocationSelect({ name, lat, lng });
      } catch {
        onLocationSelect({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
      }
    },
  });
  return null;
}

// Component to recenter map when position changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

// Search box with Nominatim autocomplete
function SearchBox({ onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (text) => {
    if (text.length < 3) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `/nominatim/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setResults(data);
      setShowResults(true);
      setNoResults(data.length === 0);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setNoResults(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 400);
  };

  const handleSelect = (item) => {
    const name = item.display_name.split(',').slice(0, 3).join(',').trim();
    setQuery(name);
    setResults([]);
    setShowResults(false);
    onSelect({
      name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder || 'Search for a place...'}
          className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {searching ? '⏳' : '🔍'}
        </span>
      </div>
      {showResults && results.length > 0 && (
        <ul className="absolute z-[1000] w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.display_name.split(',').slice(0, 2).join(',')}
              </p>
              <p className="text-xs text-gray-500 truncate">{item.display_name}</p>
            </li>
          ))}
        </ul>
      )}
      {showResults && noResults && !searching && (
        <div className="absolute z-[1000] w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-4 py-3">
          <p className="text-sm text-gray-500">No results found.</p>
          <p className="text-xs text-gray-400 mt-1">Try a simpler term like a neighborhood, city, or landmark name.</p>
        </div>
      )}
    </div>
  );
}

// Main LocationPicker component
export default function LocationPicker({ label, icon, color, value, onChange }) {
  const markerIcon = color === 'origin' ? originIcon : destIcon;

  const handleMapClick = (location) => {
    onChange({
      name: location.name,
      lat: location.lat,
      lng: location.lng,
    });
  };

  const handleSearchSelect = (location) => {
    onChange({
      name: location.name,
      lat: location.lat,
      lng: location.lng,
    });
  };

  return (
    <fieldset className="border border-gray-200 rounded-xl p-4">
      <legend className="text-sm font-semibold text-teal-700 px-2">{icon} {label}</legend>
      <div className="space-y-3">
        {/* Search */}
        <SearchBox
          onSelect={handleSearchSelect}
          placeholder={`Search ${label.toLowerCase()} location...`}
        />

        {/* Map */}
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '250px' }}>
          <MapContainer
            center={[value.lat || 20.5937, value.lng || 78.9629]}
            zoom={value.lat ? 14 : 5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {value.lat && value.lng && (
              <>
                <Marker position={[value.lat, value.lng]} icon={markerIcon} />
                <RecenterMap lat={value.lat} lng={value.lng} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Selected location display */}
        {value.name ? (
          <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{value.name}</p>
              <p className="text-xs text-gray-500">
                {value.lat?.toFixed(4)}, {value.lng?.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ name: '', lat: null, lng: null })}
              className="text-gray-400 hover:text-red-500 text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center">
            Search above or click on the map to select a location
          </p>
        )}
      </div>
    </fieldset>
  );
}
