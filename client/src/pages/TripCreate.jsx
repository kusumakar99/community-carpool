import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TripCreate() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    originName: '',
    originLat: '',
    originLng: '',
    destinationName: '',
    destinationLat: '',
    destinationLng: '',
    departureTime: '',
    totalSeats: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Haversine distance in km
  const calcDistance = () => {
    const lat1 = parseFloat(form.originLat);
    const lng1 = parseFloat(form.originLng);
    const lat2 = parseFloat(form.destinationLat);
    const lng2 = parseFloat(form.destinationLng);
    if ([lat1, lng1, lat2, lng2].some(isNaN)) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distance = calcDistance();
  const creditsPerSeat = distance ? Math.round(distance * 0.5) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.originName || !form.destinationName || !form.departureTime || !form.totalSeats) {
      return setError('Please fill in all required fields.');
    }

    setLoading(true);
    try {
      await api.post('/trips', {
        originName: form.originName,
        originCoordinates: { lat: parseFloat(form.originLat) || 0, lng: parseFloat(form.originLng) || 0 },
        destinationName: form.destinationName,
        destinationCoordinates: { lat: parseFloat(form.destinationLat) || 0, lng: parseFloat(form.destinationLng) || 0 },
        departureTime: new Date(form.departureTime).toISOString(),
        totalSeats: parseInt(form.totalSeats),
      });
      navigate('/my-trips');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Trip</h1>
        <p className="text-gray-500 mt-1">Offer a ride and earn credits</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Origin */}
          <fieldset className="border border-gray-200 rounded-xl p-4">
            <legend className="text-sm font-semibold text-teal-700 px-2">📍 Origin</legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input type="text" name="originName" value={form.originName} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., Downtown Station" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="any" name="originLat" value={form.originLat} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="40.7128" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="any" name="originLng" value={form.originLng} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="-74.0060" />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Destination */}
          <fieldset className="border border-gray-200 rounded-xl p-4">
            <legend className="text-sm font-semibold text-teal-700 px-2">🏁 Destination</legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input type="text" name="destinationName" value={form.destinationName} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., Airport Terminal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="any" name="destinationLat" value={form.destinationLat} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="40.6413" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="any" name="destinationLng" value={form.destinationLng} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="-73.7781" />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date & Time *</label>
              <input type="datetime-local" name="departureTime" value={form.departureTime} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats *</label>
              <input type="number" min="1" max="20" name="totalSeats" value={form.totalSeats} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="4" />
            </div>
          </div>

          {/* Preview */}
          {creditsPerSeat !== null && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h3 className="font-semibold text-teal-800 mb-2">Trip Preview</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium text-gray-900">{distance.toFixed(1)} km</span>
                <span className="text-gray-600">Credits per seat:</span>
                <span className="font-bold text-teal-700">{creditsPerSeat} credits</span>
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
