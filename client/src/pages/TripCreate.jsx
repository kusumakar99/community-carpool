import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';

export default function TripCreate() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('simple'); // 'simple' | 'map'

  // Community selector
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(searchParams.get('communityId') || '');

  // Simple mode fields
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');
  const [creditsPerSeat, setCreditsPerSeat] = useState('');

  // Map mode fields
  const [origin, setOrigin] = useState({ name: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ name: '', lat: null, lng: null });

  // Shared fields
  const [departureTime, setDepartureTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('');

  useEffect(() => {
    api.get('/communities').then(res => {
      setCommunities(res.data.communities || []);
    }).catch(() => {});
  }, [api]);

  // Auto-calculated distance & credits for map mode
  const calcDistance = () => {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) return null;
    const R = 6371;
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((origin.lat * Math.PI) / 180) * Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const distance = calcDistance();
  const autoCredits = distance ? Math.round(distance * 2) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'simple') {
      if (!originName.trim() || !destName.trim()) {
        return setError('Please enter origin and destination.');
      }
      if (!creditsPerSeat || parseFloat(creditsPerSeat) <= 0) {
        return setError('Please enter price per seat (must be > 0).');
      }
    } else {
      if (!origin.name || !origin.lat) {
        return setError('Please select an origin location on the map.');
      }
      if (!destination.name || !destination.lat) {
        return setError('Please select a destination location on the map.');
      }
    }
    if (!departureTime) return setError('Please set a departure date & time.');
    if (!totalSeats || parseInt(totalSeats) < 1) return setError('Please enter the number of seats.');

    setLoading(true);
    try {
      const payload = {
        departureTime: new Date(departureTime).toISOString(),
        totalSeats: parseInt(totalSeats),
      };

      if (mode === 'simple') {
        payload.originName = originName.trim();
        payload.destName = destName.trim();
        payload.creditsPerSeat = parseFloat(creditsPerSeat);
      } else {
        payload.originName = origin.name;
        payload.originLat = origin.lat;
        payload.originLng = origin.lng;
        payload.destName = destination.name;
        payload.destLat = destination.lat;
        payload.destLng = destination.lng;
      }

      if (selectedCommunity) {
        payload.communityId = selectedCommunity;
      }

      await api.post('/trips', payload);
      navigate('/my-trips');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Trip</h1>
        <p className="text-gray-500 mt-1">Offer a ride and earn ₹</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button type="button" onClick={() => setMode('simple')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === 'simple' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            ✏️ Simple
          </button>
          <button type="button" onClick={() => setMode('map')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === 'map' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            🗺️ Map Picker
          </button>
        </div>

        {/* Community Selector */}
        {communities.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">👥 Community (optional)</label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Public / No Community</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Post this trip to a community so only members can see it</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'simple' ? (
            <>
              {/* Simple Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📍 From (Origin) *</label>
                <input type="text" value={originName} onChange={(e) => setOriginName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., Serene County, Telecom Nagar, Hyderabad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">🏁 To (Destination) *</label>
                <input type="text" value={destName} onChange={(e) => setDestName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., Rajiv Gandhi International Airport" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">💰 Price per Seat (₹) *</label>
                <input type="number" min="1" step="1" value={creditsPerSeat} onChange={(e) => setCreditsPerSeat(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., 50" />
                <p className="text-xs text-gray-400 mt-1">Set the price (₹) each rider pays for this trip</p>
              </div>
            </>
          ) : (
            <>
              {/* Map Mode */}
              <LocationPicker label="Origin" icon="📍" color="origin" value={origin} onChange={setOrigin} />
              <LocationPicker label="Destination" icon="🏁" color="destination" value={destination} onChange={setDestination} />
            </>
          )}

          {/* Shared Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date & Time *</label>
              <input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats *</label>
              <input type="number" min="1" max="20" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="4" />
            </div>
          </div>

          {/* Preview */}
          {mode === 'simple' && originName && destName && creditsPerSeat && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h3 className="font-semibold text-teal-800 mb-2">Trip Preview</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium text-gray-900">{originName} → {destName}</span>
                <span className="text-gray-600">Price per seat:</span>
                <span className="font-bold text-teal-700">₹{creditsPerSeat}</span>
              </div>
            </div>
          )}
          {mode === 'map' && autoCredits !== null && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h3 className="font-semibold text-teal-800 mb-2">Trip Preview</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium text-gray-900">{origin.name} → {destination.name}</span>
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium text-gray-900">{distance.toFixed(1)} km</span>
                <span className="text-gray-600">Price per seat:</span>
                <span className="font-bold text-teal-700">₹{autoCredits} (auto)</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-lg">
            {loading ? 'Creating...' : '🚗 Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
